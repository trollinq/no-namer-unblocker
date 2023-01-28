document.addEventListener("DOMContentLoaded", function(event) {
    startTime()
    prepSpeechRecognition()
    prepSearchHandling();
});

// The default config the user starts with, also the config used when a user resets the config
const defaultConfig = `{
    "bookmarks": [
        {
            "category": "Social Media",
            "bookmarks": [
                { "label": "Facebook",              "url": "https://www.facebook.com" },
                { "label": "Messenger",             "url": "https://www.messenger.com" },
                { "label": "Instagram",             "url": "https://www.instagram.com" },
                { "label": "Reddit",                "url": "https://www.reddit.com" },
                { "label": "Twitter",               "url": "https://www.twitter.com" }
            ]
        },
        {
            "category": "Entertainment",
            "bookmarks": [
                { "label": "YouTube",               "url": "https://www.youtube.com" },
                { "label": "Twitch",                "url": "https://www.twitch.com" },
                { "label": "Tiktok",                "url": "https://www.tiktok.com" }
            ]
        }
    ],

    "bookmarkOptions": {
        "alwaysOpenInNewTab": true,
        "useFaviconKit": false
    },

    "steamGames": [
        { "id": 730,          "title": "Counter-Strike: Global Offensive",  "logoHash": "d1159d1a4d0e18da4d74f85dbb4934d7a92ace2b" }
    ],

    "sidebar": {
        "idleOpacity": 0.06
    },

    "voiceReg": {
        "enabled": false,
        "language": "en-US"
    },

    "glass": {
        "background": "rgba(47, 43, 48, 0.568)",
        "backgroundHover": "rgba(47, 43, 48, 0.568)",
        "editorBackground": "rgba(0,0,0, 0.868)",
        "blur": 12
    },

    "background": {
        "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
        "snow": {
            "enabled": false,
            "count": 200
        },
        "mist": {
            "enabled": false,
            "opacity": 5
        },
        "css": "filter: blur(0px) saturate(150%); transform: scale(1.1); opacity: 1"
    }
}`;


// The user config is merged with this one to make sure some important bits aren't missing
const baseConfig = `{
    "bookmarks": [
        
    ],

    "bookmarkOptions": {
        "alwaysOpenInNewTab": true,
        "useFaviconKit": false
    },

    "steamGames": [
        
    ],

    "sidebar": {
        "idleOpacity": 0.06
    },

    "voiceReg": {
        "enabled": false,
        "language": "en-US"
    },

    "glass": {
        "background": "rgba(47, 43, 48, 0.568)",
        "backgroundHover": "rgba(47, 43, 48, 0.568)",
        "editorBackground": "rgba(0,0,0, 0.868)",
        "blur": 12
    },

    "background": {
        "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
        "snow": {
            "enabled": false,
            "count": 200
        },
        "mist": {
            "enabled": false,
            "opacity": 5
        },
        "css": ""
    }
}`;


const configLoad = JSON.parse(localStorage.getItem('saferoom_config') ?? defaultConfig);
const config = Object.assign(JSON.parse(baseConfig), configLoad)
console.log(config);
localStorage.setItem('saferoom_config',JSON.stringify(config))

// -------------------------------------------------------------------------
//  Clockwork
// -------------------------------------------------------------------------

function startTime() {

    var today = new Date();

    let elem = document.getElementById('Clock');
    let elemDate = document.getElementById('Date');

    if (elem) {
        elem.innerHTML = today.toLocaleTimeString();
    }

    if (elemDate) {
        elemDate.innerHTML = today.toLocaleTimeString();
        elemDate.innerHTML = today.toUTCString().split(' ').slice(0, 4).join(' ')
    }

    var t = setTimeout(startTime, 500);
}

// -------------------------------------------------------------------------
// search
// -------------------------------------------------------------------------

const searchElem = document.getElementById('Search_Input');

function back(){
    let p = document.getElementById('iframelol');
    let k = document.getElementById('ok');
    let o = document.getElementById('topbarr')
    o.setAttribute("hidden",true)
    k.removeAttribute("hidden")
    p.setAttribute("hidden",true);
    p.removeAttribute("src")
}

function isValidHttpUrl(string) {
  return string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
}

function open(url){
    /*
let p = document.getElementById('iframelol');
    let k = document.getElementById('ok');
    let o = document.getElementById('topbarr')
    o.removeAttribute("hidden")
    k.setAttribute("hidden",true)
    p.removeAttribute("hidden");
    p.setAttribute("src", url)
    */
    window.location.href = url
}

function search(phrase){
    var proxyType = localStorage.getItem('proxyEngine') || "nu"
    localStorage.setItem("lastUrl",phrase)

    if (proxyType=="nu"){
        open(`${document.location.origin}/nu/${phrase}`, '_blank');
    } else {
        window.navigator.serviceWorker.register('../sw.js', {
            scope: __uv$config.prefix
        }).then(() => {
            open(__uv$config.prefix + __uv$config.encodeUrl(phrase));
        });
    }
}

function searchForPhrase(phrase, replace = false) {
    if (isValidHttpUrl(phrase)){
        if (phrase.search(/^http[s]?:\/\//)){
            phrase = `https://${phrase}`;        
        }
        //window.open(`${document.location.origin}/nu/${phrase}`, '_blank');
        return search(phrase);
    }
    // if(replace) document.getElementById('Search_Input').value = phrase;
    //window.open(`${document.location.origin}/nu/https://duckduckgo.com/?q=${phrase}`, '_blank');
    search(`https://duckduckgo.com/?q=${phrase}`)
}


function prepSearchHandling(e) {
    const searchElem = document.getElementById('Search_Input');

    searchElem.addEventListener("keydown", function(event) {
        if (event.keyCode === 13) {
            searchForPhrase(searchElem.value);
        }
    });
}


// -------------------------------------------------------------------------
//  Speech recognition for google search
// -------------------------------------------------------------------------

var activeSpeech = false;
var recognitionHandle;

let toggleVoiceRecognition = () => {

    if (!config.voiceReg.enabled) return;

    let elem = document.getElementById('Search_VoiceRecognition');

    if (activeSpeech) {
        recognitionHandle.stop();
        elem.innerHTML = '<i class="bi bi-mic"></i>';
        activeSpeech = false;
    } else {
        recognitionHandle.start();
        elem.innerHTML = '<i class="bi bi-mic-mute"></i>';
        activeSpeech = true;
    }

}

// TODO: Fixed buggy toggling on the button
function prepSpeechRecognition() {

    // Don't init anything if voiceReg is disabled
    if (!config.voiceReg.enabled) return;

    try {
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        var recognition = new SpeechRecognition();
        recognition.lang = config.voiceReg.language || 'en-US';

        recognitionHandle = recognition;
    } catch (e) {
        console.error(e);
        return;
    }

    recognition.onstart = function() {
        let elem = document.getElementById('Search_VoiceRecognition');
        elem.innerHTML = '<i class="bi bi-mic-mute"></i>';
    }

    recognition.onspeechend = function() {
        let elem = document.getElementById('Search_VoiceRecognition');
        elem.innerHTML = '<i class="bi bi-mic"></i>';
        activeSpeech = false;
    }

    recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
            console.log('No speech was detected. Try again.');
        };

        let elem = document.getElementById('Search_VoiceRecognition');
        elem.innerHTML = '<i class="bi bi-mic"></i>';
        activeSpeech = false;
    }

    recognition.onresult = function(event) {
        activeSpeech = false;
        var transcript = event.results[event.resultIndex][0].transcript;
        console.log(transcript)
        searchForPhrase(transcript, false);
    }

    let elem = document.getElementById('Search_VoiceRecognition');
    elem.onclick = () => toggleVoiceRecognition();
}

// -------------------------------------------------------------------------
//  Focus on the search input when pressing anykey if not already focused
// -------------------------------------------------------------------------

let allowKeyboard = false;

document.addEventListener("keydown", (e) => {

    if (allowKeyboard) return;

    if (e.keyCode === 18) {
        e.preventDefault();
        toggleVoiceRecognition();
    } else document.getElementById('Search_Input')?.focus();
}, false);