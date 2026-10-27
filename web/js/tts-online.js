/* tts-online.js — online TTS audio core + browser speechSynthesis watchdog.
 *
 * Two jobs:
 * 1. window.TtsOnline: play text as online audio (Baidu fanyi TTS primary,
 *    Youdao dictvoice fallback). Used directly by the Android polyfill
 *    (android-tts.js) and by the browser wrapper below.
 * 2. In a normal browser (no AndroidTts bridge) wrap the native
 *    speechSynthesis: if the platform engine silently accepts speak()
 *    without firing onstart (common on Android Chrome when the only system
 *    TTS engine is a broken cloud one, e.g. com.iflytek.speechcloud on
 *    HyperOS), transparently fail over to online audio. The choice is
 *    sticky per browser (localStorage) and re-probed once every page load,
 *    so a repaired engine self-heals. Desktop browsers with working local
 *    voices fire onstart immediately and are never affected.
 *
 * Loaded before app.js. In the Android APK, android-tts.js loads after
 * this file and consumes TtsOnline; the auto-wrapper here is skipped when
 * the AndroidTts bridge is present.
 */
(function () {
  'use strict';

  var MODE_KEY = 'ielts_tts_mode_v1';     // 'online' = 实测系统语音静默失效
  var GRACE_MS = window.__IELTS_TTS_GRACE_MS || 1500;
  var ENC_LIMIT = 1400;                    // 单请求 URL 编码长度上限

  /* ---------------- 在线播放核心 ---------------- */

  var audioEl = null;
  var onlineChain = 0;

  function stopAudio() {
    if (audioEl) {
      var a = audioEl;
      audioEl = null;
      a.onended = null;
      a.onerror = null;
      try { a.pause(); } catch (e) { /* ignore */ }
      try { a.removeAttribute('src'); a.load(); } catch (e) { /* ignore */ }
    }
  }

  function isZh(lang) {
    return !!lang && /^zh|cmn/i.test(String(lang));
  }

  /** 按句读切分，超长句再按编码长度硬切，保证 GET URL 不超长。 */
  function chunkText(text) {
    text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!text) return [];
    var sentences = text.match(/[^.!?。！？；;…]+[.!?。！？；;…]*\s*/g) || [text];
    var units = [];
    sentences.forEach(function (s) {
      if (encodeURIComponent(s).length <= ENC_LIMIT) { units.push(s); return; }
      var piece = '';
      for (var i = 0; i < s.length; i++) {
        if (piece && encodeURIComponent(piece + s[i]).length > ENC_LIMIT) {
          units.push(piece); piece = '';
        }
        piece += s[i];
      }
      if (piece) units.push(piece);
    });
    var chunks = [], cur = '';
    units.forEach(function (u) {
      if (cur && encodeURIComponent(cur + u).length > ENC_LIMIT) {
        chunks.push(cur); cur = '';
      }
      cur += u;
    });
    if (cur) chunks.push(cur);
    return chunks;
  }

  function playUrl(urls, j, myChain, onDone, onFail) {
    if (myChain !== onlineChain) return;
    if (j >= urls.length) { onFail(); return; }
    stopAudio();
    var a = new Audio();
    audioEl = a;
    var settled = false;
    var fail = function () {
      if (settled) return;
      settled = true;
      if (myChain !== onlineChain) return;
      playUrl(urls, j + 1, myChain, onDone, onFail);
    };
    a.onended = function () {
      if (settled) return;
      settled = true;
      if (myChain !== onlineChain) return;
      onDone();
    };
    a.onerror = fail;
    a.src = urls[j];
    try {
      var p = a.play();
      if (p && typeof p.then === 'function') p.then(undefined, fail);
    } catch (e) { fail(); }
  }

  function playChunks(chunks, i, myChain, lan, spd, onDone, onFail) {
    if (myChain !== onlineChain) return;
    if (i >= chunks.length) { onDone(); return; }
    var t = encodeURIComponent(chunks[i]);
    var urls = [
      'https://fanyi.baidu.com/gettts?lan=' + lan + '&text=' + t + '&spd=' + spd + '&source=web',
      'https://dict.youdao.com/dictvoice?audio=' + t + '&type=2'  // type=2 英音；中文自动识别
    ];
    playUrl(urls, 0, myChain,
      function () { playChunks(chunks, i + 1, myChain, lan, spd, onDone, onFail); },
      onFail);
  }

  /** 在线朗读一段文本；返回代际号，cancel() 可随时中止。 */
  function onlineSpeak(text, lang, rate, onDone, onFail) {
    var chunks = chunkText(text);
    var myChain = ++onlineChain;
    if (!chunks.length) { onFail(); return myChain; }
    var lan = isZh(lang) ? 'zh' : 'en';
    var spd = Math.max(1, Math.min(5, Math.round((rate || 1) * 3)));
    playChunks(chunks, 0, myChain, lan, spd, onDone, onFail);
    return myChain;
  }

  function onlineCancel() {
    onlineChain++;
    stopAudio();
  }

  window.TtsOnline = {
    speak: onlineSpeak,
    cancel: onlineCancel,
    chunkText: chunkText
  };

  /* App 内由 android-tts.js 接管 speechSynthesis，浏览器看门狗不安装。 */
  if (window.AndroidTts) return;

  /* ---------------- 浏览器：原生语音看门狗包装 ---------------- */

  var mode = localStorage.getItem(MODE_KEY) === 'online' ? 'online' : 'auto';
  var probedThisLaunch = false;
  var graceTimer = null;
  var cur = null;   // {u, started, taken, nativeEnded}

  // 诊断/手动切换通道（三种安装路径都要有）
  window.__androidTtsPolyfill = window.__androidTtsPolyfill || {
    version: 2,
    getMode: function () { return mode; },
    setMode: function (m) { if (m === 'online') setOnline(); else setAuto(); }
  };

  function emitMode() {
    try { window.dispatchEvent(new Event('ieltsTtsMode')); } catch (e) { /* ignore */ }
  }
  function setOnline() {
    if (mode === 'online') return;
    mode = 'online';
    try { localStorage.setItem(MODE_KEY, 'online'); } catch (e) { /* ignore */ }
    try { window.dispatchEvent(new Event('ieltsTtsOnline')); } catch (e) { /* ignore */ }
    emitMode();
  }
  function setAuto() {
    if (mode === 'auto') return;
    mode = 'auto';
    try { localStorage.removeItem(MODE_KEY); } catch (e) { /* ignore */ }
    emitMode();
  }
  function clearGrace() { if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; } }

  function finishCur(ok) {
    if (!cur) return;
    var c = cur;
    cur = null;
    clearGrace();
    var cb = ok ? c.userOnEnd : c.userOnError;
    if (typeof cb === 'function') {
      try { cb({ target: c.u }); } catch (e) { /* page handler */ }
    }
  }

  function takeOverOnline(c) {
    c.taken = true;
    try { native.cancel(); } catch (e) { /* ignore */ }
    setOnline();
    TtsOnline.speak(c.u.text, c.u.lang, c.u.rate,
      function () { if (cur === c) finishCur(true); },
      function () { if (cur === c) finishCur(false); });
  }

  // Chrome/Android WebView 里 window.speechSynthesis 多为只读访问器，
  // 直接赋值在严格模式抛 TypeError，统一走 defineProperty 覆盖
  function replaceGlobal(name, value) {
    try {
      Object.defineProperty(window, name, { value: value, configurable: true, writable: true });
    } catch (e) {
      try { window[name] = value; } catch (e2) { /* 无法覆盖：看门狗不生效 */ }
    }
  }

  var native = window.speechSynthesis;

  if (!native || typeof native.speak !== 'function') {
    // 浏览器完全没有 Web Speech：给 app.js 一个纯在线伪实现
    replaceGlobal('speechSynthesis', {
      speak: function (u) {
        TtsOnline.cancel();
        runOnlineOnly(u);
      },
      cancel: function () { TtsOnline.cancel(); cur = null; clearGrace(); },
      pause: function () {}, resume: function () {},
      getVoices: function () { return []; },
      onvoiceschanged: null, speaking: false, pending: false, paused: false
    });
    if (!window.SpeechSynthesisUtterance) {
      replaceGlobal('SpeechSynthesisUtterance', function (text) {
        this.text = String(text == null ? '' : text);
        this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1;
        this.voice = null; this.onstart = null; this.onend = null; this.onerror = null;
      });
    }
    setOnline();
    return;
  }

  function runOnlineOnly(u) {
    var c = { u: u, userOnEnd: u.onend, userOnError: u.onerror, started: false, taken: true };
    cur = c;
    TtsOnline.speak(u.text, u.lang, u.rate,
      function () { if (cur === c) finishCur(true); },
      function () { if (cur === c) finishCur(false); });
  }

  var proxy = {
    speak: function (u) {
      if (cur) { cur = null; clearGrace(); TtsOnline.cancel(); }
      var c = {
        u: u, started: false, taken: false,
        userOnStart: u.onstart, userOnEnd: u.onend, userOnError: u.onerror
      };
      cur = c;

      u.onstart = function (ev) {
        c.started = true;
        clearGrace();
        setAuto();
        if (typeof c.userOnStart === 'function') {
          try { c.userOnStart(ev); } catch (e) { /* ignore */ }
        }
      };
      u.onend = function (ev) {
        if (cur === c && !c.taken) {
          cur = null; clearGrace();
          if (typeof c.userOnEnd === 'function') {
            try { c.userOnEnd(ev); } catch (e) { /* ignore */ }
          }
        }
      };
      u.onerror = function () {
        if (cur !== c || c.taken) return;
        // 原生明确报错：在线接管，最终回调由在线结果决定
        takeOverOnline(c);
      };

      var tryNative = (mode === 'auto') || !probedThisLaunch;
      probedThisLaunch = true;
      if (tryNative) {
        native.cancel();
        native.speak(u);
        graceTimer = setTimeout(function () {
          if (cur === c && !c.started && !c.taken) takeOverOnline(c);
        }, GRACE_MS);
      } else {
        // 已确认本平台引擎静默：直接在线，不再打扰原生引擎
        cur = null;
        runOnlineOnly(u);
      }
    },
    cancel: function () {
      cur = null;
      clearGrace();
      TtsOnline.cancel();
      try { native.cancel(); } catch (e) { /* ignore */ }
    },
    pause: function () { proxy.cancel(); },
    resume: function () {},
    getVoices: function () { return native.getVoices ? native.getVoices() : []; },
    onvoiceschanged: null
  };
  Object.defineProperty(proxy, 'speaking', { get: function () { return native.speaking || !!cur; } });
  Object.defineProperty(proxy, 'pending', { get: function () { return native.pending || false; } });
  Object.defineProperty(proxy, 'paused', { get: function () { return false; } });

  // 原生 voices 变化透传给 app.js
  try {
    native.addEventListener('voiceschanged', function () {
      if (typeof proxy.onvoiceschanged === 'function') proxy.onvoiceschanged();
    });
  } catch (e) {
    try { native.onvoiceschanged = function () {
      if (typeof proxy.onvoiceschanged === 'function') proxy.onvoiceschanged();
    }; } catch (e2) { /* ignore */ }
  }

  replaceGlobal('speechSynthesis', proxy);
})();
