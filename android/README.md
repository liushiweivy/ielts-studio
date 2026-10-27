# 雅思书房 · Android APK 版

[`../web`](../web)（零依赖网页版）的原生 WebView 壳 APK。

## 结构

```
app/src/main/assets/www/     网页版资产（由 tools/sync_web.py 生成，勿手改）
app/src/main/java/.../MainActivity.java   WebView 壳 + TTS 桥 + 麦克风授权
tools/android-tts.js         speechSynthesis polyfill（注入到 assets 的 index.html，app.js 之前）
tools/sync_web.py            网页版 → assets 同步脚本（幂等）
```

## 要点

- **TTS**：Android WebView 没有 Web Speech API。MainActivity 用系统 TextToSpeech
  暴露 `AndroidTts` JS 接口，`android-tts.js` 在 `js/app.js` 之前把
  `window.speechSynthesis` / `SpeechSynthesisUtterance` 整体替换为桥接实现
  （en-GB/en-US 伪语音列表，speak/cancel/onend 回调）。普通浏览器里无
  `AndroidTts`，polyfill 是 no-op，网页版不受影响。
- **录音**：口语模块 MediaRecorder 走 `WebChromeClient.onPermissionRequest`，
  已在 manifest 声明 RECORD_AUDIO 并在运行时申请。
- **进度**：localStorage 在 WebView file:// origin 下持久化（domStorageEnabled）。
- 无 androidx 依赖，纯 framework Activity，minSdk 24 / targetSdk 36。

## 构建

前置：JDK 17、Android SDK（android-36 + build-tools 35/36.1）、Gradle 8.14.3。
最简单的方式是用 Android Studio 打开本目录，IDE 会自动准备 SDK 与 Gradle。

```bat
rem 同步网页资产（从 ../web 拷贝）
python tools\sync_web.py

rem 构建 debug APK
set JAVA_HOME=<JDK 17 安装路径>
gradle assembleDebug

rem 产物
app\build\outputs\apk\debug\app-debug.apk
```

debug 签名直接可装；`adb install -r app\build\outputs\apk\debug\app-debug.apk`。

## 发布签名（可选）

`keytool -genkey` 生成 keystore 后在 `app/build.gradle` 加 signingConfigs，
`assembleRelease` 出正式包。
