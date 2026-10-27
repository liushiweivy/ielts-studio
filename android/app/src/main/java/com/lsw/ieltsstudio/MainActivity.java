package com.lsw.ieltsstudio;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.DisplayCutout;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * IELTS Studio - WebView wrapper.
 *
 * Loads the zero-dependency web app from assets/www and bridges
 * window.speechSynthesis (missing in Android WebView) to the system
 * TextToSpeech engine via the AndroidTts javascript interface +
 * assets/www/android-tts.js polyfill (loaded before js/app.js).
 *
 * Microphone (MediaRecorder in the speaking module) is granted through
 * WebChromeClient.onPermissionRequest after the RECORD_AUDIO runtime
 * permission has been granted.
 */
public class MainActivity extends Activity {

    private static final int REQ_RECORD_AUDIO = 1001;
    private static final String HOME_URL = "file:///android_asset/www/index.html";

    private WebView webView;
    private TextToSpeech tts;
    private AudioManager audioManager;
    private boolean ttsReady = false;
    private int initStatus = Integer.MIN_VALUE;
    private String ttsLang = "";                 // 已应用语言："en" / "zh"
    private String defaultEngine = "";
    private int availEnGB = -99, availEnUS = -99, availZhCN = -99;
    private int lastSetLangResult = -99;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    // stop 与 speak 都 post 到主线程；speak 入队时撤掉挂起的 stop，
    // 否则部分国产 TTS 引擎会把紧跟 stop() 的第一句吞掉（单词点击无声）
    private final Runnable stopTtsTask = () -> {
        if (ttsReady && tts != null) tts.stop();
        logEv("native stop()");
    };

    // 最近一次 WindowInsets（物理像素），onPageFinished 时要重新推给页面
    private int insetL, insetT, insetR, insetB;

    // TTS 事件环形日志，供页内诊断面板排障
    private final List<String> events = Collections.synchronizedList(new ArrayList<>());
    private int eventSeq = 0;

    // 已收到 onStart 的 utterance id；speak 成功后 3s 仍不在集合里 = 引擎静默接单（NO-START）。
    // 讯飞云引擎(com.iflytek.speechcloud)典型故障：speak rc=0 但永远不回调，App 层无音频。
    private final Set<String> startedIds = Collections.synchronizedSet(new HashSet<>());
    private volatile String lastNoStart = "";
    private static final long NO_START_TIMEOUT_MS = 3000L;

    private void logEv(String msg) {
        String line = (SystemClock.uptimeMillis() % 100000L / 10L) / 100.0 + "s " + msg;
        synchronized (events) {
            events.add(line);
            while (events.size() > 30) events.remove(0);
        }
    }

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        audioManager = (AudioManager) getSystemService(AudioManager.class);

        webView = new WebView(this);
        setContentView(webView);
        // 纸色底，避免避让区/过滚动露白
        webView.setBackgroundColor(0xFFF5EFE3);
        // targetSdk 35+ 强制 edge-to-edge：把状态栏/挖孔（灵动岛）/手势条
        // 安全区推成页面 CSS 变量（WebView setPadding 在部分机型不作用于
        // 网页内容，故走 CSS 通道，由 --app-inset-* 生效）
        applyWindowInsets(webView);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage progress/streak
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);                    // ignore system font scale

        webView.addJavascriptInterface(new TtsBridge(), "AndroidTts");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("file://")) return false;   // stay inside the app
                return true;                                    // no external browsing
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pushInsetsToPage();   // 页面加载完成后首推一次安全区
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // getUserMedia({audio:true}) from the speaking module
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    request.deny();
                    requestAudioPermission();
                }
            }
        });

        initTts();
        requestAudioPermission();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(HOME_URL);
        }
    }

    private void requestAudioPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO);
        }
    }

    /* ---------------- 安全区 → 页面 CSS 变量 ---------------- */

    private void applyWindowInsets(WebView view) {
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                int bars = WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars();
                int cutout = WindowInsets.Type.displayCutout();
                top = insets.getInsets(bars | cutout).top;
                bottom = insets.getInsets(bars).bottom;
                left = insets.getInsets(bars | cutout).left;
                right = insets.getInsets(bars | cutout).right;
            } else {
                left = insets.getSystemWindowInsetLeft();
                top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight();
                bottom = insets.getSystemWindowInsetBottom();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    DisplayCutout c = insets.getDisplayCutout();
                    if (c != null) {
                        top = Math.max(top, c.getSafeInsetTop());
                        bottom = Math.max(bottom, c.getSafeInsetBottom());
                        left = Math.max(left, c.getSafeInsetLeft());
                        right = Math.max(right, c.getSafeInsetRight());
                    }
                }
            }
            insetL = left; insetT = top; insetR = right; insetB = bottom;
            pushInsetsToPage();
            return insets;
        });
    }

    /** 物理像素 → CSS 像素（除以 density）后写入 --app-inset-*。 */
    private void pushInsetsToPage() {
        float d = getResources().getDisplayMetrics().density;
        if (d <= 0) d = 1f;
        String js = String.format(Locale.ROOT,
                "(function(){var r=document.documentElement;if(!r)return;"
                + "r.style.setProperty('--app-inset-top','%.1fpx');"
                + "r.style.setProperty('--app-inset-right','%.1fpx');"
                + "r.style.setProperty('--app-inset-bottom','%.1fpx');"
                + "r.style.setProperty('--app-inset-left','%.1fpx');})();",
                insetT / d, insetR / d, insetB / d, insetL / d);
        evaluateJs(js);
    }

    /* ---------------- TextToSpeech ---------------- */

    private void initTts() {
        bindTts(null);
    }

    /** 绑定（或切换到）指定包名的 TTS 引擎；pkg 为 null 时用系统默认引擎。 */
    private void bindTts(String pkg) {
        TextToSpeech old = tts;
        ttsReady = false;
        startedIds.clear();
        TextToSpeech created = (pkg == null || pkg.isEmpty())
                ? new TextToSpeech(getApplicationContext(), ttsInitListener)
                : new TextToSpeech(getApplicationContext(), ttsInitListener, pkg);
        tts = created;
        attachProgressListener(created);
        logEv("bind engine: " + (pkg == null || pkg.isEmpty() ? "(system default)" : pkg));
        if (old != null) {
            try { old.stop(); old.shutdown(); } catch (Exception ignore) { }
        }
    }

    private final TextToSpeech.OnInitListener ttsInitListener = status -> {
        initStatus = status;
        ttsReady = status == TextToSpeech.SUCCESS;
        if (ttsReady) {
            try { defaultEngine = tts.getDefaultEngine(); } catch (Exception e) { defaultEngine = "?"; }
            // HyperOS 默认引擎（讯飞/小爱）可能没有 en-GB 数据，逐个探测
            try { availEnGB = tts.isLanguageAvailable(Locale.UK); } catch (Exception e) { availEnGB = -99; }
            try { availEnUS = tts.isLanguageAvailable(Locale.US); } catch (Exception e) { availEnUS = -99; }
            try { availZhCN = tts.isLanguageAvailable(Locale.SIMPLIFIED_CHINESE); } catch (Exception e) { availZhCN = -99; }
            Locale first = availEnGB >= 0 ? Locale.UK : (availEnUS >= 0 ? Locale.US : Locale.getDefault());
            lastSetLangResult = tts.setLanguage(first);
            ttsLang = "en";
            logEv(String.format(Locale.ROOT,
                    "init ok engine=%s avail(gb=%d,us=%d,zh=%d) setFirst=%d",
                    defaultEngine, availEnGB, availEnUS, availZhCN, lastSetLangResult));
        } else {
            logEv("init FAILED status=" + status);
        }
        // let the page refresh its voice list once the engine is up
        evaluateJs("window.dispatchEvent && window.dispatchEvent(new Event('androidTtsReady'));");
    };

    private void attachProgressListener(TextToSpeech target) {
        target.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {
                startedIds.add(id);
                if (startedIds.size() > 32) {
                    synchronized (startedIds) {
                        java.util.Iterator<String> it = startedIds.iterator();
                        if (it.hasNext()) { it.next(); it.remove(); }
                    }
                }
                lastNoStart = "";   // 新引擎能正常开口，清除旧的 NO-START 告警
                logEv("onStart " + id);
                // 通知 polyfill：引擎真的开口了（在线兜底看门狗据此撤防/恢复离线模式）
                evaluateJs("window.__androidTtsOnStart && window.__androidTtsOnStart("
                        + jsString(id) + ");");
            }
            @Override public void onDone(String id) { logEv("onDone " + id); notifyDone(id); }
            @Override public void onError(String id) { logEv("onError " + id); notifyDone(id); }
            @Override
            public void onError(String id, int errorCode) {
                logEv("onError " + id + " code=" + errorCode);
                notifyDone(id);
            }
        });
    }

    private void notifyDone(String utteranceId) {
        // fire the polyfill's onend callback on the JS thread
        evaluateJs("window.__androidTtsOnEnd && window.__androidTtsOnEnd("
                + jsString(utteranceId) + ");");
    }

    private void evaluateJs(String js) {
        mainHandler.post(() -> {
            if (webView != null) webView.evaluateJavascript(js, null);
        });
    }

    private static String jsString(String s) {
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    /** 按 utterance 语言切换引擎语音（zh 用普通话，其余优先英式、次选美式）。 */
    private void applyTtsLanguage(String lang) {
        if (tts == null) return;
        boolean zh = lang != null && lang.toLowerCase(Locale.ROOT).startsWith("zh");
        String want = zh ? "zh" : "en";
        if (want.equals(ttsLang)) return;
        Locale loc;
        int avail;
        if (zh) { loc = Locale.SIMPLIFIED_CHINESE; avail = availZhCN; }
        else if (availEnGB >= 0) { loc = Locale.UK; avail = availEnGB; }
        else { loc = Locale.US; avail = availEnUS; }
        int r = tts.setLanguage(loc);
        lastSetLangResult = r;
        ttsLang = want;
        logEv(String.format(Locale.ROOT, "setLang %s avail=%d rc=%d", loc, avail, r));
    }

    public class TtsBridge {
        /** Speak text. rate ~0.5-2.0, lang 为 BCP-47（en-GB / zh-CN）。返回 utterance id。 */
        @JavascriptInterface
        public String speak(String text, float rate, String lang) {
            if (!ttsReady) {
                logEv("speak rejected: engine not ready");
                return "";
            }
            String id = "u" + System.currentTimeMillis() + "_" + (eventSeq++);
            mainHandler.removeCallbacks(stopTtsTask);
            mainHandler.post(() -> {
                if (tts == null) return;
                applyTtsLanguage(lang);
                tts.setSpeechRate(Math.max(0.3f, Math.min(rate, 3.0f)));
                tts.setPitch(1.0f);
                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
                int rc = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id);
                String preview = text == null ? "" : (text.length() > 24 ? text.substring(0, 24) : text);
                logEv(String.format(Locale.ROOT, "speak %s lang=%s rc=%d «%s»", id, lang, rc, preview));
                if (rc == TextToSpeech.SUCCESS) {
                    // 3s 内没有 onStart = 引擎静默接单（讯飞云引擎常见），标记给诊断面板
                    startedIds.remove(id);
                    mainHandler.postDelayed(() -> {
                        if (!startedIds.contains(id)) {
                            lastNoStart = id;
                            logEv("NO-START " + id + " engine=" + defaultEngine
                                    + "（接单但未发声，请切换引擎）");
                        }
                    }, NO_START_TIMEOUT_MS);
                }
            });
            return id;
        }

        /** 两参兼容重载：默认英语。 */
        @JavascriptInterface
        public String speak(String text, float rate) {
            return speak(text, rate, "en-GB");
        }

        /** 诊断面板用：试播一条，返回 utterance id。 */
        @JavascriptInterface
        public String ttsTest(String text, String lang) {
            return speak(text, 1.0f, lang);
        }

        @JavascriptInterface
        public void cancel() {
            mainHandler.removeCallbacks(stopTtsTask);
            mainHandler.post(stopTtsTask);
        }

        /** 诊断面板用：媒体音量加减（TTS 走 STREAM_MUSIC，音量 0 时完全无声）。 */
        @JavascriptInterface
        public void volumeUp() {
            mainHandler.post(() -> audioManager.adjustStreamVolume(
                    AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI));
        }

        @JavascriptInterface
        public void volumeDown() {
            mainHandler.post(() -> audioManager.adjustStreamVolume(
                    AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI));
        }

        /** 诊断面板用：打开系统「文字转语音输出」设置（可换引擎/装语言数据）。 */
        @JavascriptInterface
        public void openTtsSettings() {
            mainHandler.post(() -> {
                Intent intent = new Intent("com.android.settings.TTS_SETTINGS");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    startActivity(intent);
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(MainActivity.this, "未找到系统 TTS 设置页", Toast.LENGTH_SHORT).show();
                }
            });
        }

        /** 诊断面板用：列出系统已安装 TTS 引擎（含当前引擎标记），供页内一键切换。 */
        @JavascriptInterface
        public String getEnginesJson() {
            JSONArray arr = new JSONArray();
            try {
                List<TextToSpeech.EngineInfo> infos = tts == null ? null : tts.getEngines();
                if (infos != null) {
                    for (TextToSpeech.EngineInfo e : infos) {
                        JSONObject o = new JSONObject();
                        o.put("pkg", e.name);
                        o.put("label", e.label != null && !e.label.isEmpty() ? e.label : e.name);
                        o.put("current", e.name.equals(defaultEngine));
                        arr.put(o);
                    }
                }
            } catch (Exception e) {
                logEv("getEngines fail: " + e);
            }
            return arr.toString();
        }

        /** 诊断面板用：切换系统 TTS 引擎（重新绑定 TextToSpeech 服务）。 */
        @JavascriptInterface
        public String switchEngine(String pkg) {
            if (pkg == null || pkg.isEmpty()) return "bad pkg";
            mainHandler.post(() -> bindTts(pkg));
            return "ok";
        }

        /** 诊断面板用：在媒体声道直出 0.5s 440Hz 测试音，区分"引擎坏"与"音频通道/音量问题"。 */
        @JavascriptInterface
        public String playBeep() {
            mainHandler.post(() -> {
                AudioTrack track = null;
                try {
                    int sampleRate = 22050;
                    int samples = sampleRate / 2;          // 0.5s
                    AudioFormat fmt = new AudioFormat.Builder()
                            .setSampleRate(sampleRate)
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build();
                    AudioAttributes attrs = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build();
                    int minBuf = AudioTrack.getMinBufferSize(sampleRate,
                            AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
                    int bufBytes = Math.max(minBuf > 0 ? minBuf : samples * 2, samples * 2);
                    track = new AudioTrack(attrs, fmt, bufBytes, AudioTrack.MODE_STATIC,
                            AudioManager.AUDIO_SESSION_ID_GENERATE);
                    short[] pcm = new short[samples];
                    for (int i = 0; i < samples; i++) {
                        // 首尾加淡入淡出，避免爆音
                        double env = Math.min(1.0, i / 200.0)
                                * Math.min(1.0, (double) (samples - i) / 600.0);
                        pcm[i] = (short) (Math.sin(2.0 * Math.PI * 440.0 * i / sampleRate)
                                * 9000.0 * Math.max(0.0, env));
                    }
                    track.write(pcm, 0, samples);
                    track.play();
                    logEv("beep 440Hz 0.5s mediaVol="
                            + audioManager.getStreamVolume(AudioManager.STREAM_MUSIC));
                    final AudioTrack t2 = track;
                    mainHandler.postDelayed(() -> {
                        try { t2.release(); } catch (Exception ignore) { }
                    }, 1500);
                } catch (Exception e) {
                    logEv("beep fail: " + e);
                    if (track != null) try { track.release(); } catch (Exception ignore) { }
                }
            });
            return "ok";
        }

        /** 诊断面板用：TTS/音量/安全区/事件日志快照。 */
        @JavascriptInterface
        public String getTtsDebug() {
            try {
                JSONObject o = new JSONObject();
                o.put("version", getAppVersion());
                o.put("ready", ttsReady);
                o.put("initStatus", initStatus);
                o.put("engine", defaultEngine);
                JSONObject avail = new JSONObject();
                avail.put("enGB", availEnGB);
                avail.put("enUS", availEnUS);
                avail.put("zhCN", availZhCN);
                o.put("avail", avail);
                o.put("currentLang", ttsLang);
                o.put("lastSetLangResult", lastSetLangResult);
                o.put("noStart", lastNoStart == null ? "" : lastNoStart);
                o.put("mediaVol", audioManager.getStreamVolume(AudioManager.STREAM_MUSIC));
                o.put("mediaMax", audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC));
                o.put("ringerMode", audioManager.getRingerMode());
                JSONObject ins = new JSONObject();
                ins.put("l", insetL); ins.put("t", insetT); ins.put("r", insetR); ins.put("b", insetB);
                o.put("insets", ins);
                JSONArray arr = new JSONArray();
                synchronized (events) {
                    for (String e : events) arr.put(e);
                }
                o.put("events", arr);
                return o.toString();
            } catch (Exception e) {
                return "{\"error\":" + JSONObject.quote(e.toString()) + "}";
            }
        }

        @JavascriptInterface
        public String getAppVersion() {
            return BuildConfig.VERSION_NAME + "#" + BuildConfig.VERSION_CODE;
        }

        /** JSON array of voices so the page's en-GB / zh-CN filters find a match. */
        @JavascriptInterface
        public String getVoicesJson() {
            return "[{\"name\":\"en-GB\",\"lang\":\"en-GB\",\"default\":true},"
                 + "{\"name\":\"en-US\",\"lang\":\"en-US\",\"default\":false},"
                 + "{\"name\":\"zh-CN\",\"lang\":\"zh-CN\",\"default\":false}]";
        }
    }

    /* ---------------- lifecycle ---------------- */

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else if (webView != null && webView.getUrl() != null
                && !webView.getUrl().endsWith("index.html")) {
            webView.loadUrl(HOME_URL);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
