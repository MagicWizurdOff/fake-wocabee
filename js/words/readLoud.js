// readloud.js — Single-file TTS helper (plain JS, ES5, var-only)
// API:
//   readLoud(text, langId, responsiveVoiceType, responsiveVoiceSpeed, onstart, onend, onerror)
//   stopReadLoud()
//   readLoud_setBeforeSpeak(fn)   // optional: run right before speaking (e.g., stop recognition)
//
// Design:
// - NO early onend: no watchdog forcing end by time.
// - Real-time sync ONLY: rely on responsiveVoice.isPlaying() or native onend.
// - Prevent double-calls of onend via a settled flag.

(function () {

  // --- Phonetic tweaks from your original ---
  function adjustTranslationBeforeSpeaking(translation) {
    if (translation=="read") return "read.";
    else if (translation=="live") return "liv";
    else if (translation=="read-read-read" || translation=="read read read") return "read-red-red";
    else if (translation=="lead-led-led" || translation=="lead led led") return "leed led led";
    else if (translation=="run ran run" || translation=="run-ran-run") return "run ren ran";
    else if (translation=="skaten") return "skejten";
    else if (translation=="liken") return "lajken";
    return translation;
  }

  // Defaults / toggles
  if (typeof window !== 'undefined') {
    if (typeof window.useResponsiveVoiceDirectly !== 'boolean') {
      window.useResponsiveVoiceDirectly = true; // your default
    }
  }

  // Optional runtime config:
  // window.readLoud_config = { pollMs: 250 }
  var DEFAULT_POLL_MS = 250;

  // ---- Language map (ID -> BCP-47 tag) ----
  var LANG_MAP = {
    BG:'bg-BG', CZ:'cs-CZ', DE:'de-DE', EN:'en-US', EO:'eo', ES:'es-ES',
    FR:'fr-FR', HR:'hr-HR', HU:'hu-HU', IT:'it-IT', LA:'la', PL:'pl-PL',
    RO:'ro-RO', RU:'ru-RU', SI:'sl-SI', SK:'sk-SK', UA:'uk-UA'
  };

  // Default ResponsiveVoice names if caller doesn't pass one
  var RV_DEFAULT = {
    'bg':'Bulgarian Female','cs':'Czech Female','de':'Deutsch Female',
    'en':'UK English Female','eo':'UK English Female','es':'Spanish Female',
    'fr':'French Female','hr':'Croatian Female','hu':'Hungarian Female',
    'it':'Italian Female','la':'UK English Female','pl':'Polish Female',
    'ro':'Romanian Female','ru':'Russian Female','sl':'Slovenian Female',
    'sk':'Slovak Female','uk':'Ukrainian Female'
  };

  // Prefer higher-quality native voice names
  var PREFERRED_NATIVE = {
    '*':[ /Google/i, /Natural/i ],
    'en':[ /^Google .*English/i, /Natural/i, /Aria/i, /Jenny/i, /Guy/i, /Zira/i ],
    'de':[ /^Google/i, /Katja/i, /Hedda/i, /Natural/i ],
    'fr':[ /^Google/i, /Natural/i, /Denise/i, /Vivienne/i ],
    'it':[ /^Google/i, /Natural/i, /Elsa/i, /Isabella/i ],
    'es':[ /^Google/i, /Natural/i, /Helena/i, /Alvaro/i ],
    'pl':[ /^Google/i ],
    'ru':[ /^Google/i ]
  };
  var LOW_NATIVE_BAD = [ /Microsoft David/i, /Desktop/i ];

  // ---- Internal state ----
  var RL = {
    seq: 0,
    currentEngine: null,     // 'native' | 'rv' | null
    currentUtterance: null,
    pendingTimer: null,
    cbStart: null,
    cbEnd: null,
    cbError: null,
    speaking: false,
    beforeSpeakFn: null,
    pollTimer: null,
    settledFlag: false // prevents double-calling end/error
  };

  // ---- Utilities ----
  function normalizeTag(tag) { return String(tag || '').replace('_','-').toLowerCase(); }
  function baseLang(tag) { var n = normalizeTag(tag), i = n.indexOf('-'); return i === -1 ? n : n.slice(0,i); }

  function matchScore(voiceLang, wantTag) {
    var v = normalizeTag(voiceLang), w = normalizeTag(wantTag), wb = baseLang(w);
    if (v === w) return 4;
    if (v.indexOf(wb + '-') === 0) return 3;
    if (baseLang(v) === wb) return 2;
    return 0;
  }

  function nativeRateFrom(rvSpeed) {
    var r = parseFloat(rvSpeed);
    if (!(r > 0)) r = 1.0;
    if (r < 0.60) r = 0.60;
    if (r > 1.25) r = 1.25;
    return r;
  }

  function wsAvailable() { return typeof window !== 'undefined' && 'speechSynthesis' in window; }
  function rvAvailable() { return typeof window !== 'undefined' && window.responsiveVoice && typeof window.responsiveVoice.speak === 'function'; }

  function getAllVoices() {
    if (!wsAvailable()) return [];
    var vs = window.speechSynthesis.getVoices();
    return vs || [];
  }

  function nameMatchesAny(reList, name) {
    var i;
    for (i = 0; i < reList.length; i++) if (reList[i].test(name)) return true;
    return false;
  }

  function prefNameScore(name, base) {
    var score = 0, list = PREFERRED_NATIVE[base] || [], g = PREFERRED_NATIVE['*'] || [];
    var i, j;
    for (i = 0; i < list.length; i++) if (list[i].test(name)) score = Math.max(score, (list.length - i));
    for (j = 0; j < g.length; j++) if (g[j].test(name)) score = Math.max(score, (g.length - j));
    return score;
  }

  function getBestNativeCandidate(bcp47) {
    var vs = getAllVoices(), base = baseLang(bcp47);
    var best = null, bestKey = -1, bestIsBad = false;
    var i;
    for (i = 0; i < vs.length; i++) {
      var v = vs[i];
      var ms = matchScore(v.lang, bcp47);
      if (ms <= 0) continue;
      var ps = prefNameScore(v.name || '', base);
      var goodFlag = nameMatchesAny(LOW_NATIVE_BAD, v.name || '') ? 0 : 1;
      var key = (goodFlag * 10000) + (ps * 100) + ms;
      if (key > bestKey) { best = v; bestKey = key; bestIsBad = !goodFlag; }
    }
    return { voice: best, isBad: bestIsBad };
  }

  // Wait for voices up to ~4s (100 ms x 40)
  function waitForVoices(cb) {
    if (!wsAvailable()) { cb(); return; }
    var tries = 0, max = 40;
    var h = setInterval(function () {
      var n = window.speechSynthesis.getVoices().length; tries++;
      if (n > 0 || tries >= max) { clearInterval(h); cb(); }
    }, 100);
  }

  // Unlock audio on first gesture (helps Safari/Chrome)
  (function unlockOnce() {
    function once() {
      try { if (wsAvailable() && window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (e) {}
      document.removeEventListener('pointerdown', once);
      document.removeEventListener('keydown', once);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', once);
      document.addEventListener('keydown', once);
    }
  })();

  function _clearPoll() {
    if (RL.pollTimer) { clearInterval(RL.pollTimer); RL.pollTimer = null; }
  }


  function _finish(kind) {
    if (RL.settledFlag) return;
    RL.settledFlag = true;
    _clearPoll();
    RL.speaking = false;
    // Do not cancel speech here; we only signal the app via callbacks.

    if (kind === 'error') {
      if (RL.cbError) { try { RL.cbError('tts-error'); } catch (e2) {} }
      if (RL.cbEnd)   { try { RL.cbEnd(); }   catch (e3) {} }
    } else {
      if (RL.cbEnd)   { try { RL.cbEnd(); }   catch (e4) {} }
    }
  }

  function _stopAll() {
    if (RL.pendingTimer) { clearTimeout(RL.pendingTimer); RL.pendingTimer = null; }
    _clearPoll();
    RL.speaking = false;
    RL.settledFlag = false;
    if (wsAvailable()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    if (rvAvailable()) { try { window.responsiveVoice.cancel(); } catch (e) {} }
    RL.currentEngine = null;
    RL.currentUtterance = null;
  }

  // Poll responsiveVoice.isPlaying() — ONLY source of sync (besides native onend)
  function startPlayingPoll() {
    var cfg = (typeof window!=='undefined' && window.readLoud_config) ? window.readLoud_config : {};
    var pollMs = (typeof cfg.pollMs === 'number' && cfg.pollMs > 0) ? cfg.pollMs : DEFAULT_POLL_MS;

    _clearPoll();
    RL.pollTimer = setInterval(function () {
      var playing = false;
      try {
        playing = !!(window.responsiveVoice && window.responsiveVoice.isPlaying && window.responsiveVoice.isPlaying());
      } catch (e) {}

      if (!playing) {
        _finish('ended'); // Real-time sync only: finish when RV truly stops
      } else {
        // Optional heartbeat for debugging:
        // console.log("I hope you are listening");
      }
    }, pollMs);
  }

  // --- Single wrapper for ResponsiveVoice ---
  function rvSpeak(text, bcp47, responsiveVoiceType, responsiveVoiceSpeed, mySeq) {
    if (!rvAvailable()) {
      _finish('error');
      return false;
    }
    var norm = normalizeTag(bcp47);
    var rvType = (responsiveVoiceType && String(responsiveVoiceType).trim())
      ? responsiveVoiceType
      : (RV_DEFAULT[baseLang(norm)] || 'UK English Female');

    var rvRate = parseFloat(responsiveVoiceSpeed);
    if (!(rvRate > 0)) rvRate = 1;

    RL.currentEngine = 'rv';
    try {
      window.responsiveVoice.speak(
        String(text),
        rvType,
        {
          rate: rvRate,
          onstart: function () {
            if (mySeq === RL.seq && RL.cbStart) { try { RL.cbStart(); } catch (e) {} }
          },
          onend: function () {
            if (mySeq !== RL.seq) return;
            // Native RV onend — also ends flow; _finish is guarded against double-call
            _finish('ended');
          }
        }
      );
      // Start polling immediately; we'll finish when isPlaying() flips false.
      startPlayingPoll();
      return true;
    } catch (e) {
      RL.currentEngine = null;
      _finish('error');
      return false;
    }
  }

  // ---- Public API ----
  window.stopReadLoud = function () { _stopAll(); };

  // Hook to stop recognition, etc., *before* we begin speaking
  window.readLoud_setBeforeSpeak = function (fn) {
    RL.beforeSpeakFn = (typeof fn === 'function') ? fn : null;
  };

  // Main entry (with optional callbacks)
  window.readLoud = function (text, langId, responsiveVoiceType, responsiveVoiceSpeed, onstart, onend, onerror) {
    if (!text) return;

    text = adjustTranslationBeforeSpeaking(text);

    // If 5th arg is an object, treat as { onstart, onend, onerror }
    if (typeof onstart === 'object' && onstart) {
      var o = onstart;
      onstart = (typeof o.onstart === 'function') ? o.onstart : onstart;
      onend   = (typeof o.onend   === 'function') ? o.onend   : onend;
      onerror = (typeof o.onerror === 'function') ? o.onerror : onerror;
    }

    RL.cbStart = (typeof onstart === 'function') ? onstart : null;
    RL.cbEnd   = (typeof onend   === 'function') ? onend   : null;
    RL.cbError = (typeof onerror === 'function') ? onerror : null;

    RL.seq++; 
    var mySeq = RL.seq;

    // Clean state
    _stopAll();
    RL.settledFlag = false;

    // Run pre-speak hook if present (e.g., stop recognition/abort)
    try { if (RL.beforeSpeakFn) RL.beforeSpeakFn(); } catch (e) {}

    var id = String(langId || 'EN').toUpperCase();
    var bcp47 = LANG_MAP[id] || 'en-US';

    RL.speaking = true;

    // If forcing ResponsiveVoice, bypass native entirely
    if (typeof window !== 'undefined' && window.useResponsiveVoiceDirectly === true) {
      RL.pendingTimer = setTimeout(function () {
        RL.pendingTimer = null;
        rvSpeak(text, bcp47, responsiveVoiceType, responsiveVoiceSpeed, mySeq);
      }, 10);
      return;
    }

    // Otherwise: try native first (quality-aware), then fallback to RV
    if (wsAvailable() && getAllVoices().length === 0) {
      // Wait for native voices to load then retry
      waitForVoices(function () {
        if (mySeq === RL.seq) window.readLoud(text, id, responsiveVoiceType, responsiveVoiceSpeed, onstart, onend, onerror);
      });
      return;
    }

    RL.pendingTimer = setTimeout(function () {
      RL.pendingTimer = null;

      var usedNative = false;

      if (wsAvailable()) {
        var cand = getBestNativeCandidate(bcp47);
        var v = cand.voice, isBad = cand.isBad;

        if (v && !isBad) {
          try {
            var u = new SpeechSynthesisUtterance(String(text));
            u.lang = v.lang; u.voice = v; u.rate = nativeRateFrom(responsiveVoiceSpeed); u.pitch = 1; u.volume = 1;
            RL.currentEngine = 'native'; RL.currentUtterance = u;

            u.onstart = function () { if (mySeq === RL.seq && RL.cbStart) { try { RL.cbStart(); } catch (e) {} } };
            u.onend   = function () { if (mySeq !== RL.seq) return; _finish('ended'); };
            u.onerror = function () { if (mySeq !== RL.seq) return; _finish('error'); };

            window.speechSynthesis.speak(u);
            usedNative = true;
          } catch (e) {
            usedNative = false;
          }
        }
      }

      if (!usedNative) {
        rvSpeak(text, bcp47, responsiveVoiceType, responsiveVoiceSpeed, mySeq);
      }

      if (!usedNative && !rvAvailable()) {
        _finish('error');
      }
    }, 10);
  };

  // Optional: handle backgrounding (mobile Safari/Chrome sometimes drops events)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        _stopAll();
        // We do NOT call cbEnd here; app flow decides what to do on tab switch.
      }
    });
  }

})();
