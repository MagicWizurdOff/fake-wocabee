

var cid=getURLParameter("class_id");

if ($lang_is_specific && !$conf_req_def_lang && $langSysName === "RU" && $conf_req_virtual_keyboard && cid!=61721 && cid!=58961 && cid!=58962 && cid!=58963 && cid!=58964) {
    var textInputs = $("input[type=text]");
    var kioskboardInput = $(".js-kioskboard-input");

    textInputs.addClass('js-kioskboard-input');
    textInputs.attr({
        "data-kioskboard-type": "keyboard",
        "data-kioskboard-placement": "bottom",
        "data-kioskboard-specialcharacters": "false",
    });
    KioskBoard.run('.js-kioskboard-input', {

        /*!
        * Required
        * An Array of Objects has to be defined for the custom keys. Hint: Each object creates a row element (HTML) on the keyboard.
        * e.g. [{"key":"value"}, {"key":"value"}] => [{"0":"A","1":"B","2":"C"}, {"0":"D","1":"E","2":"F"}]
        * e.g. [{"key":"value"}, {"key":"value"}] => [{"0":"A","1":"B","2":"C"}, {"0":"D","1":"E","2":"F"}]
        */
        keysArrayOfObjects: [
            {
                "0": "Ё",
                "1": "Ъ",
                "2": "Ш",
                "3": "Ч",
                "4": "Щ",
                "5": "Ж",
            },
            {
                "0": "№",
                "1": "Ю",
                "2": "Е",
                "3": "Р",
                "4": "Т",
                "5": "З",
                "6": "У",
                "7": "И",
                "8": "О",
                "9": "П",
                "10": "Э",
            },
            {
                "0": "А",
                "1": "С",
                "2": "Д",
                "3": "Ф",
                "4": "Г",
                "5": "Х",
                "6": "Й",
                "7": "К",
                "8": "Л",
                "9": "Ь",
            },
            {
                "0": "Ы",
                "1": "Я",
                "2": "Ц",
                "3": "В",
                "4": "Б",
                "5": "Н",
                "6": "М",
            }
        ],

        /*!
        * Required only if "keysArrayOfObjects" is "null".
        * The path of the "kioskboard-keys-${langugage}.json" file must be set to the "keysJsonUrl" option. (XMLHttpRequest to get the keys from JSON file.)
        * e.g. '/Content/Plugins/KioskBoard/dist/kioskboard-keys-english.json'
        */
        keysJsonUrl: null,

        /*
        * Optional: An Array of Strings can be set to override the built-in special characters.
        * e.g. ["#", "€", "%", "+", "-", "*"]
        */
        keysSpecialCharsArrayOfStrings: ["Ё", "ё", "Ъ", "Ш", "Ч", "Щ", "Ж",],


        // Language Code (ISO 639-1) for custom keys (for language support) => e.g. "de" || "en" || "fr" || "hu" || "tr" etc...
        language: 'ru',

        // The theme of keyboard => "light" || "dark" || "flat" || "material" || "oldschool"
        theme: $conf_dark_mode ? 'dark' : 'light',

        /*
          * Allow or prevent real/physical keyboard usage. Prevented when "false"
          * In addition, the "allowMobileKeyboard" option must be "true" as well, if the real/physical keyboard has wanted to be used.
          */
        allowRealKeyboard: false,

        // Allow or prevent mobile keyboard usage. Prevented when "false"
        allowMobileKeyboard: false,

        capsLockActive: false,

        cssAnimationsDuration: 200,

        autoScroll: false,

    });
    kioskboardInput.attr("readonly", "readonly");
    kioskboardInput.css("background-color", "white");
    
}