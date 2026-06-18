
// exceptions to adjust pronounciation of the ResponsiveVoiceModule
function adjustTranslationBeforeSpeaking(word,translation)
{
    //console.log("Adjustment: ... w="+word+", t="+translation);
   // one word 
   if (translation=="read") return "read.";
   else if (translation=="live") return "liv";

   // past tense
   else if (translation=="read-read-read" || translation=="read read read") return "read-red-red";
   else if (translation=="lead-led-led" || translation=="lead led led") return "leed led led";
   else if (translation=="run ran run" || translation=="run-ran-run") return "run ren ran";


   // combined
   else if (word=="olovo" && translation=="lead") return "led";

   else if (translation=="skaten") return "skejten";
   else if (translation=="liken") return "lajken";

   return translation; 
}