package com.lsw.ieltsstudio;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.Locale;

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

    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private static final String HOME_URL = "file:///android_asset/www/index.html";

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);
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

    /* ---------------- TextToSpeech ---------------- */

    private void initTts() {
        tts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setLanguage(Locale.UK);
            }
            // let the page refresh its voice list once the engine is up
            evaluateJs("window.dispatchEvent && window.dispatchEvent(new Event('androidTtsReady'));");
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onError(String id) { notifyDone(id); }
            @Override public void onDone(String id) { notifyDone(id); }
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

    public class TtsBridge {
        /** Speak text. rate ~0.5-2.0. Returns utterance id used for onEnd. */
        @JavascriptInterface
        public String speak(String text, float rate) {
            if (!ttsReady) return "";
            String id = "u" + System.currentTimeMillis();
            mainHandler.post(() -> {
                tts.setSpeechRate(Math.max(0.3f, Math.min(rate, 3.0f)));
                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id);
            });
            return id;
        }

        @JavascriptInterface
        public void cancel() {
            mainHandler.post(() -> {
                if (ttsReady) tts.stop();
            });
        }

        /** JSON array of voices so the page's en-GB filter finds a match. */
        @JavascriptInterface
        public String getVoicesJson() {
            return "[{\"name\":\"en-GB\",\"lang\":\"en-GB\",\"default\":true},"
                 + "{\"name\":\"en-US\",\"lang\":\"en-US\",\"default\":false}]";
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
