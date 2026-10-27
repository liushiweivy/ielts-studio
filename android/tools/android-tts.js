/* android-tts.js — speechSynthesis polyfill for the Android WebView wrapper.
 *
 * Android WebView does not implement the Web Speech API. This script is
 * injected (before js/app.js, after js/tts-online.js) into the assets copy
 * of index.html and bridges window.speechSynthesis /
 * SpeechSynthesisUtterance to the native TextToSpeech engine exposed as
 * window.AndroidTts by MainActivity.
 *
 * Some factory ROMs ship a cloud TTS engine that silently accepts speak()
 * but never starts playback (observed: com.iflytek.speechcloud on HyperOS,
 * rc=SUCCESS with no onStart callback). When that happens the polyfill
 * transparently fails over to online TTS audio via window.TtsOnline
 * (defined in js/tts-online.js: Baidu primary, Youdao backup). The
 * failover is sticky (localStorage) so later taps start instantly; the
 * native engine is still re-probed once per app launch, so installing or
 * repairing an engine self-heals without any UI action.
 *
 * In a normal browser window.AndroidTts is absent and this file is a
 * no-op (js/tts-online.js installs its own watchdog wrapper there).
 */
(function () {
  'use strict';
  if (!window.AndroidTts) return;

  // 标记 App 环境：状态栏/挖孔避让由原生 WebView padding 负责，
  // CSS 里的 env(safe-area-inset-*) 对 App 关闭，避免双重间距
  document.documentElement.setAttribute('data-android-app', '1');

  var MODE_KEY = 'ielts_tts_mode_v1';     // 'online' = 上次实测系统引擎静默失效
  var GRACE_MS = window.__ANDROID_TTS_GRACE_MS || 1200;  // 等系统引擎 onStart
  var TtsOnline = window.TtsOnline;       // js/tts-online.js 先于本文件加载

  var voices = [];
  try { voices = JSON.parse(window.AndroidTts.getVoicesJson()); } catch (e) { voices = []; }

  var currentId = null;          // 在跟的原生 utterance id（在线接管后置空）
  var currentUtterance = null;
  var speaking = false;
  var startedIds = Object.create(null);
  var takenOverIds = Object.create(null);  // 已转在线、忽略其晚到回调的 id
  var graceTimer = null;
  var chain = 0;                 // speak/cancel 代际号，作废上一轮在线播放
  var probedThisLaunch = false;
  var mode = localStorage.getItem(MODE_KEY) === 'online' ? 'online' : 'auto';

  function stopOnline() { if (TtsOnline) TtsOnline.cancel(); }

  function fireStart(u) {
    if (typeof u.onstart === 'function') {
      try { u.onstart({ target: u }); } catch (e) { /* ignore */ }
    }
  }

  function fireEnd(ok, myChain) {
    if (myChain !== undefined && myChain !== chain) return;
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

  function clearGrace() {
    if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
  }

  function markOnline() {
    mode = 'online';
    try { localStorage.setItem(MODE_KEY, 'online'); } catch (e) { /* private mode */ }
    window.dispatchEvent(new Event('androidTtsMode'));
  }

  function markAuto() {
    if (mode === 'auto') return;
    mode = 'auto';
    try { localStorage.removeItem(MODE_KEY); } catch (e) { /* ignore */ }
    window.dispatchEvent(new Event('androidTtsMode'));
  }

  /** 系统引擎不开口时的在线接管（核心在 js/tts-online.js）。 */
  function onlineSpeak(u, myChain) {
    if (!TtsOnline) { fireEnd(false, myChain); return; }
    TtsOnline.speak(u.text, u.lang || 'en-GB', u.rate || 1,
      function () { fireEnd(true, myChain); },
      function () { fireEnd(false, myChain); });
  }

  /* ---------------- speechSynthesis 桥 ---------------- */

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
      // 原生 speak 用 QUEUE_FLUSH 自己冲掉旧条目（被冲条目不保证回调），
      // 这里只补 JS 层结账；不能调 native cancel：stop()+speak() 连击会让
      // 部分国产 TTS 引擎吞掉紧跟的第一句（单词点击无声的根因）
      if (speaking || currentUtterance) fireEnd(false);
      currentUtterance = u;
      speaking = true;
      chain++;
      clearGrace();
      stopOnline();

      // 已确认系统引擎坏：本启动后续直接在线；但每次启动首句仍探测一次，
      // 便于用户新装/修好引擎后自动恢复离线朗读
      var tryNative = (mode === 'auto') || !probedThisLaunch;
      probedThisLaunch = true;

      var id = '';
      if (tryNative) {
        try { id = window.AndroidTts.speak(u.text, u.rate || 1, u.lang || 'en-GB'); }
        catch (e) { id = ''; }
      }
      if (id) {
        currentId = id;
        startedIds[id] = false;
        fireStart(u);
        graceTimer = setTimeout(function () {
          if (currentId !== id || startedIds[id]) return;
          // 系统引擎接单不开口 → 撤掉它并在线接管
          takenOverIds[id] = true;
          currentId = null;
          try { window.AndroidTts.cancel(); } catch (e) { /* ignore */ }
          markOnline();
          onlineSpeak(u, chain);
        }, GRACE_MS);
      } else {
        // 引擎未就绪/明确在线模式：直接走网络
        currentId = null;
        fireStart(u);
        onlineSpeak(u, chain);
      }
    },
    cancel: function () {
      chain++;
      clearGrace();
      stopOnline();
      currentId = null;
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

  /* native engine callbacks (invoked from Java via evaluateJavascript) */
  window.__androidTtsOnStart = function (id) {
    startedIds[id] = true;
    if (currentId === id) {
      clearGrace();
      markAuto();   // 引擎恢复发声：解除在线兜底
    }
  };
  window.__androidTtsOnEnd = function (id) {
    if (takenOverIds[id]) return;
    if (currentId && id === currentId) {
      clearGrace();
      fireEnd(true);
    }
  };

  /* native engine became ready: let the page refresh its voice list */
  window.addEventListener('androidTtsReady', function () {
    if (typeof synth.onvoiceschanged === 'function') {
      try { synth.onvoiceschanged(); } catch (e) { /* ignore */ }
    }
  });

  /* 诊断面板用：朗读通道状态/手动覆盖 */
  window.__androidTtsPolyfill = {
    version: 2,
    getMode: function () { return mode; },
    setMode: function (m) {
      if (m === 'online') { markOnline(); } else { markAuto(); }
    }
  };

  Object.defineProperty(window, 'speechSynthesis', {
    value: synth, writable: true, configurable: true
  });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: SpeechSynthesisUtterancePolyfill, writable: true, configurable: true
  });
})();
