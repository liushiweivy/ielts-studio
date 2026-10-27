/* tts-online.js tests: node --test tools/tts-online.test.js
 *
 * Loads js/tts-online.js in a vm sandbox with a fake native
 * speechSynthesis (healthy/silent/erroring engines) and a stub Audio.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CODE = fs.readFileSync(path.join(__dirname, '..', 'js', 'tts-online.js'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadEnv(opts) {
  opts = opts || {};
  const records = [];
  const calls = { speak: 0, cancel: 0 };
  const store = {};
  if (opts.storedOnline) store['ielts_tts_mode_v1'] = 'online';

  const sandbox = {
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    encodeURIComponent, decodeURIComponent, JSON, Object, Array, Math,
    String, Number, Boolean, RegExp, Date, Promise, Error, TypeError
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.document = { documentElement: { setAttribute() {} } };
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };

  const listeners = {};
  sandbox.Event = function Event(t) { this.type = t; };
  sandbox.dispatchEvent = function (ev) {
    (listeners[ev.type] || []).forEach((fn) => { try { fn(ev); } catch (e) {} });
    return true;
  };
  sandbox.addEventListener = function (t, fn) {
    (listeners[t] = listeners[t] || []).push(fn);
  };

  sandbox.Audio = function Audio() {
    const self = this;
    this.play = function () { records.push(self); return Promise.resolve(); };
    this.pause = function () {};
    this.removeAttribute = function () {};
    this.load = function () {};
  };

  // fake native speechSynthesis
  const native = {
    speaking: false, pending: false,
    speak: function (u) {
      calls.speak++;
      native._last = u;
      if (opts.engine === 'healthy') {
        setTimeout(() => { try { u.onstart({ type: 'start' }); } catch (e) {} }, 20);
        setTimeout(() => { try { u.onend({ type: 'end' }); } catch (e) {} }, 120);
      } else if (opts.engine === 'error') {
        setTimeout(() => { try { u.onerror({ type: 'error' }); } catch (e) {} }, 20);
      }
      // 'silent': never calls back
    },
    cancel: function () { calls.cancel++; },
    getVoices: () => [{ lang: 'en-GB' }],
    addEventListener: function (t, fn) { (listeners['native:' + t] = listeners['native:' + t] || []).push(fn); }
  };
  sandbox.speechSynthesis = native;
  sandbox.SpeechSynthesisUtterance = function (text) {
    this.text = String(text == null ? '' : text);
    this.lang = ''; this.rate = 1;
    this.onstart = null; this.onend = null; this.onerror = null;
  };

  sandbox.__IELTS_TTS_GRACE_MS = 40;

  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);
  return { sb: sandbox, records, calls, store, native, listeners };
}

function utter(sb, text, lang) {
  const u = new sb.SpeechSynthesisUtterance(text);
  u.lang = lang || 'en-GB';
  const r = { start: 0, end: null };
  u.onstart = () => { r.start++; };
  u.onend = () => { r.end = 'end'; };
  u.onerror = () => { r.end = 'error'; };
  sb.speechSynthesis.speak(u);
  return r;
}

test('TtsOnline core: baidu url with lan and spd', () => {
  const env = loadEnv({ engine: 'silent' });
  let done = null;
  env.sb.TtsOnline.speak('hello world', 'en-GB', 1, () => { done = 'end'; }, () => { done = 'fail'; });
  assert.strictEqual(env.records.length, 1);
  assert.match(env.records[0].src, /fanyi\.baidu\.com\/gettts/);
  assert.match(env.records[0].src, /[?&]lan=en/);
  assert.match(env.records[0].src, /[?&]spd=3/);
  env.records[0].onended();
  assert.strictEqual(done, 'end');
});

test('TtsOnline core: youdao fallback then both-fail', async () => {
  const env = loadEnv({ engine: 'silent' });
  let done = null;
  env.sb.TtsOnline.speak('hi', 'en', 1, () => { done = 'end'; }, () => { done = 'fail'; });
  env.records[0].onerror();
  assert.match(env.records[1].src, /dict\.youdao\.com\/dictvoice/);
  assert.strictEqual(done, null);
  env.records[1].onerror();
  assert.strictEqual(done, 'fail');
});

test('TtsOnline cancel stops chunk chain', async () => {
  const env = loadEnv({ engine: 'silent' });
  let done = 'none';
  // long text guarantees multiple chunks
  env.sb.TtsOnline.speak('This is sentence one. ' + 'x'.repeat(3000), 'en', 1,
    () => { done = 'end'; }, () => { done = 'fail'; });
  assert.ok(env.records.length >= 1);
  const before = env.records.length;
  env.sb.TtsOnline.cancel();
  await sleep(20);
  assert.strictEqual(env.records.length, before, 'no new audio after cancel');
  assert.strictEqual(done, 'none');
});

test('chunkText splits long Chinese text into bounded pieces', () => {
  const env = loadEnv({ engine: 'silent' });
  const chunks = env.sb.TtsOnline.chunkText('测'.repeat(2000));
  assert.ok(chunks.length > 1);
  chunks.forEach((c) => assert.ok(encodeURIComponent(c).length <= 1400));
});

test('healthy native engine: onstart in time, no online audio, mode stays auto', async () => {
  const env = loadEnv({ engine: 'healthy' });
  const r = utter(env.sb, 'good morning');
  await sleep(160);
  assert.strictEqual(r.start, 1);
  assert.strictEqual(r.end, 'end');
  assert.strictEqual(env.records.length, 0);
  assert.strictEqual(env.store['ielts_tts_mode_v1'], undefined);
});

test('silent native engine: watchdog takes over to online audio', async () => {
  const env = loadEnv({ engine: 'silent' });
  let onlineEvent = 0;
  env.listeners.ieltsTtsOnline = env.listeners.ieltsTtsOnline || [];
  env.listeners.ieltsTtsOnline.push(() => { onlineEvent++; });
  const r = utter(env.sb, 'good morning');
  await sleep(70);
  assert.strictEqual(env.records.length, 1);
  assert.match(env.records[0].src, /fanyi\.baidu\.com/);
  assert.strictEqual(env.store['ielts_tts_mode_v1'], 'online');
  assert.strictEqual(onlineEvent, 1);
  env.records[0].onended();
  assert.strictEqual(r.end, 'end');
});

test('native onerror triggers immediate online takeover', async () => {
  const env = loadEnv({ engine: 'error' });
  const r = utter(env.sb, 'good morning');
  await sleep(50);
  assert.strictEqual(env.records.length, 1);
  assert.strictEqual(r.end, null, 'final callback decided by online result');
  env.records[0].onended();
  assert.strictEqual(r.end, 'end');
});

test('sticky online: first launch probes native, later speaks skip it', async () => {
  const env = loadEnv({ engine: 'silent', storedOnline: true });
  utter(env.sb, 'first');
  await sleep(70);
  assert.strictEqual(env.calls.speak, 1);
  utter(env.sb, 'second');
  assert.strictEqual(env.calls.speak, 1, 'native not retried within the same launch');
  assert.ok(env.records.length >= 2);
});

test('healthy probe after sticky-online clears stored mode', async () => {
  const env = loadEnv({ engine: 'healthy', storedOnline: true });
  const r = utter(env.sb, 'first');
  await sleep(160);
  assert.strictEqual(env.records.length, 0);
  assert.strictEqual(env.store['ielts_tts_mode_v1'], undefined);
  assert.strictEqual(env.sb.__androidTtsPolyfill.getMode(), 'auto');
  assert.strictEqual(r.end, 'end');
});

test('cancel during grace: no audio, callback suppressed', async () => {
  const env = loadEnv({ engine: 'silent' });
  const r = utter(env.sb, 'hello');
  env.sb.speechSynthesis.cancel();
  await sleep(70);
  assert.strictEqual(env.records.length, 0);
  assert.strictEqual(r.end, null);
});

test('Chinese utterance maps to lan=zh', async () => {
  const env = loadEnv({ engine: 'silent' });
  utter(env.sb, '这是中文测试', 'zh-CN');
  await sleep(70);
  assert.match(env.records[0].src, /[?&]lan=zh/);
});

test('voices passthrough and polyfill API', () => {
  const env = loadEnv({ engine: 'silent' });
  assert.deepStrictEqual(env.sb.speechSynthesis.getVoices().map((v) => v.lang), ['en-GB']);
  assert.strictEqual(env.sb.__androidTtsPolyfill.version, 2);
});
