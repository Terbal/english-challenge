// speech.js — text-to-speech using the native Web Speech API.
// No external API, no cost, works fully offline once voices are cached by the OS/browser.

const Speech = (() => {
  let voices = [];
  let preferredVoiceURI = null;

  function refreshVoices() {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return voices;
  }

  if (window.speechSynthesis) {
    // Voices load asynchronously in most browsers.
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    refreshVoices();
  }

  function englishVoices() {
    return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
  }

  function setPreferredVoice(uri) {
    preferredVoiceURI = uri;
  }

  function speak(text, { rate = 0.95, pitch = 1, onend = null } = {}) {
    if (!window.speechSynthesis) {
      console.warn("SpeechSynthesis not supported in this browser.");
      return;
    }
    // Cancel anything currently queued so buttons feel instant/responsive.
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    utter.pitch = pitch;

    const chosen = voices.find(v => v.voiceURI === preferredVoiceURI) ||
                   englishVoices().find(v => v.lang === "en-US") ||
                   englishVoices()[0];
    if (chosen) utter.voice = chosen;

    if (onend) utter.onend = onend;
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function translateLink(text) {
    return `https://translate.google.com/?sl=en&tl=fr&text=${encodeURIComponent(text)}&op=translate`;
  }

  return { refreshVoices, englishVoices, setPreferredVoice, speak, stop, translateLink };
})();
