/* android-tts polyfill tests: node --test tools/android-tts.test.js
 *
 * Loads tools/android-tts.js in a vm sandbox that mimics the Android
 * WebView globals (AndroidTts bridge stub, Audio stub, localStorage).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CODE = fs.readFileSync(path.join(__dirname, 'android-tts.js'), 'utf8');
// android-tts.js consumes window.TtsOnline from js/tts-online.js (loaded first).
// Standalone repo: sibling ielts-learning/ ; monorepo copy: ../web/.
const ttsOnlineCandidates = [
  path.join(__dirname, '..', '..', 'ielts-learning', 'js', 'tts-online.js'),
  path.join(__dirname, '..', 'web', 'js', 'tts-online.js'),
  path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'www', 'js', 'tts-online.js')
];
const ONLINE_CODE = fs.readFileSync(
  ttsOnlineCandidates.find((p) => fs.existsSync(p)), 'utf8');
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
  sandbox.document = { documentElement: { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } } };
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  sandbox.Event = function Event(t) { this.type = t; };
  sandbox.dispatchEvent = function () { return true; };
  sandbox.addEventListener = function () {};

  let seq = 0;
  sandbox.AndroidTts = {
    getVoicesJson: () => '[{"name":"en-GB","lang":"en-GB","default":true}]',
    speak: () => {
      calls.speak++;
      if (opts.nativeSpeak) return opts.nativeSpeak();
      return 'u' + (++seq);
    },
    cancel: () => { calls.cancel++; }
  };

  sandbox.Audio = function Audio() {
    const self = this;
    this.play = function () { records.push(self); return Promise.resolve(); };
    this.pause = function () {};
    this.removeAttribute = function () {};
    this.load = function () {};
  };

  sandbox.__ANDROID_TTS_GRACE_MS = 20;

  sandbox.dispatchEvent = function () { return true; };   // tts-online early-returns, unused
  vm.createContext(sandbox);
  vm.runInContext(ONLINE_CODE, sandbox);  // defines window.TtsOnline (bridge present → no wrapper)
  vm.runInContext(CODE, sandbox);
  return { sb: sandbox, records, calls, store };
}

function utter(env, text, lang) {
  const sb = env.sb;
  const u = new sb.SpeechSynthesisUtterance(text);
  u.lang = lang || 'en-GB';
  const result = { onstart: 0, end: null };
  u.onstart = () => { result.onstart++; };
  u.onend = () => { result.end = 'end'; };
  u.onerror = () => { result.end = 'error'; };
  sb.speechSynthesis.speak(u);
  return result;
}

test('no AndroidTts bridge: polyfill is a no-op', () => {
  const sandbox = { console, Object, Array, JSON };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);
  assert.strictEqual(sandbox.speechSynthesis, undefined);
});

test('native onStart in time: no online takeover, onend via native callback', async () => {
  const env = loadEnv();
  const r = utter(env, 'hello');
  assert.strictEqual(r.onstart, 1);
  env.sb.__androidTtsOnStart('u1');
  await sleep(50);
  assert.strictEqual(env.records.length, 0);
  assert.strictEqual(env.store['ielts_tts_mode_v1'], undefined);
  env.sb.__androidTtsOnEnd('u1');
  assert.strictEqual(r.end, 'end');
});

test('silent native engine: watchdog fails over to Baidu online audio', async () => {
  const env = loadEnv();
  const r = utter(env, 'Good morning.');
  await sleep(50);
  assert.strictEqual(env.records.length, 1);
  assert.ok(env.records[0].src.includes('fanyi.baidu.com/gettts'));
  assert.ok(env.records[0].src.includes('lan=en'));
  assert.strictEqual(env.store['ielts_tts_mode_v1'], 'online');
  assert.strictEqual(env.calls.cancel, 1, 'native engine stopped on takeover');
  env.records[0].onended();
  assert.strictEqual(r.end, 'end');
});

test('Chinese utterance uses lan=zh', async () => {
  const env = loadEnv();
  const r = utter(env, '这是中文测试', 'zh-CN');
  await sleep(50);
  assert.ok(env.records[0].src.includes('lan=zh'));
  env.records[0].onended();
  assert.strictEqual(r.end, 'end');
});

test('Baidu failure falls back to Youdao dictvoice', async () => {
  const env = loadEnv();
  utter(env, 'hello');
  await sleep(50);
  assert.strictEqual(env.records.length, 1);
  env.records[0].onerror();
  assert.strictEqual(env.records.length, 2);
  assert.ok(env.records[1].src.includes('dict.youdao.com/dictvoice'));
  env.records[1].onended();
});

test('both providers failing reports onerror', async () => {
  const env = loadEnv();
  const r = utter(env, 'hello');
  await sleep(50);
  env.records[0].onerror();
  env.records[1].onerror();
  assert.strictEqual(r.end, 'error');
});

test('cancel during grace aborts before any online audio', async () => {
  const env = loadEnv();
  const r = utter(env, 'hello');
  env.sb.speechSynthesis.cancel();
  assert.strictEqual(r.end, 'error');
  await sleep(50);
  assert.strictEqual(env.records.length, 0);
  assert.ok(env.calls.cancel >= 1);
});

test('native not ready (empty id): immediate online, mode not forced', async () => {
  const env = loadEnv({ nativeSpeak: () => '' });
  const r = utter(env, 'hello');
  assert.strictEqual(env.records.length, 1, 'online starts without waiting for grace');
  assert.strictEqual(env.store['ielts_tts_mode_v1'], undefined);
  env.records[0].onended();
  assert.strictEqual(r.end, 'end');
});

test('sticky online mode: first launch speak still probes, later speaks skip native', async () => {
  const env = loadEnv({ storedOnline: true });
  utter(env, 'first sentence');
  await sleep(50);                       // probe fails → online
  assert.strictEqual(env.calls.speak, 1);
  assert.ok(env.records.length >= 1);

  utter(env, 'second sentence');        // already probed this launch
  assert.strictEqual(env.calls.speak, 1, 'native speak not called again');
  assert.ok(env.records.length >= 2, 'second utterance goes straight online');
});

test('probe success after sticky-online clears stored mode', async () => {
  const env = loadEnv({ storedOnline: true });
  utter(env, 'first');
  env.sb.__androidTtsOnStart('u1');
  await sleep(50);
  assert.strictEqual(env.records.length, 0);
  assert.strictEqual(env.store['ielts_tts_mode_v1'], undefined);
  assert.strictEqual(env.sb.__androidTtsPolyfill.getMode(), 'auto');
});

test('manual setMode toggle via polyfill API', () => {
  const env = loadEnv();
  assert.strictEqual(env.sb.__androidTtsPolyfill.getMode(), 'auto');
  env.sb.__androidTtsPolyfill.setMode('online');
  assert.strictEqual(env.store['ielts_tts_mode_v1'], 'online');
  env.sb.__androidTtsPolyfill.setMode('auto');
  assert.strictEqual(env.store['ielts_tts_mode_v1'], undefined);
});

test('long text is split into bounded-URL chunks played in order', async () => {
  const env = loadEnv();
  const r = utter(env, '测'.repeat(2000), 'zh-CN');
  await sleep(50);
  const srcs = [];
  let rec = env.records[0];
  srcs.push(rec.src);
  assert.ok(rec.src.length < 2000, 'first chunk URL must be bounded: ' + rec.src.length);
  while (srcs.length < 20) {
    if (rec.onended) rec.onended();
    await sleep(5);
    const next = env.records[env.records.length - 1];
    if (next === rec) break;
    rec = next;
    srcs.push(rec.src);
    assert.ok(rec.src.length < 2000);
    if (r.end) break;
  }
  assert.ok(srcs.length > 1, '2000 chars must be split into multiple chunks');
  if (!r.end) rec.onended();
  assert.strictEqual(r.end, 'end');
});
