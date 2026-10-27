/* android-tts.js — speechSynthesis polyfill for the Android WebView wrapper.
 *
 * Android WebView does not implement the Web Speech API. This script is
 * injected (before js/app.js) into the assets copy of index.html and bridges
 * window.speechSynthesis / SpeechSynthesisUtterance to the native
 * TextToSpeech engine exposed as window.AndroidTts by MainActivity.
 *
 * In a normal browser window.AndroidTts is absent and this file is a no-op.
 */
(function () {
  'use strict';
  if (!window.AndroidTts) return;

  var voices = [];
  try { voices = JSON.parse(window.AndroidTts.getVoicesJson()); } catch (e) { voices = []; }

  var currentId = null;
  var speaking = false;
  var currentUtterance = null;

  function fireEnd(ok) {
    var u = currentUtterance;
    currentUtterance = null;
    currentId = null;
    speaking = false;
    if (u) {
      var cb = ok ? u.onend : u.onerror;
      if (typeof cb === 'function') {
        try { cb({ target: u }); } catch (e) { /* page handler error */ }
      }
    }
  }

  function SpeechSynthesisUtterancePolyfill(text) {
    this.text = String(text == null ? '' : text);
    this.lang = '';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }

  var synth = {
    getVoices: function () { return voices.slice(); },
    speak: function (u) {
      synth.cancel();
      currentUtterance = u;
      speaking = true;
      var id = '';
      try { id = window.AndroidTts.speak(u.text, u.rate || 1); } catch (e) { id = ''; }
      if (!id) { fireEnd(false); return; }
      currentId = id;
      if (typeof u.onstart === 'function') {
        try { u.onstart({ target: u }); } catch (e) { /* ignore */ }
      }
    },
    cancel: function () {
      try { window.AndroidTts.cancel(); } catch (e) { /* ignore */ }
      if (speaking || currentUtterance) fireEnd(false);
    },
    pause: function () { synth.cancel(); },
    resume: function () { /* no-op */ },
    pending: false,
    paused: false,
    onvoiceschanged: null
  };

  Object.defineProperty(synth, 'speaking', {
    get: function () { return speaking; }
  });

  /* called from Java when the native engine finishes/errors an utterance */
  window.__androidTtsOnEnd = function (id) {
    if (currentId && id === currentId) fireEnd(true);
  };

  /* native engine became ready: let the page refresh its voice list */
  window.addEventListener('androidTtsReady', function () {
    if (typeof synth.onvoiceschanged === 'function') {
      try { synth.onvoiceschanged(); } catch (e) { /* ignore */ }
    }
  });

  Object.defineProperty(window, 'speechSynthesis', {
    value: synth, writable: true, configurable: true
  });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: SpeechSynthesisUtterancePolyfill, writable: true, configurable: true
  });
})();
