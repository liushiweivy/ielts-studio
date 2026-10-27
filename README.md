# 雅思书房 · IELTS Studio

一个产品、三个端的雅思备考应用：**零依赖网页版** + **微信小程序** + **Android APK（WebView 壳）**。
题库、词库三端同源，无需后端服务器，学习进度只存本机。

## 目录

| 目录 | 端 | 技术 | 怎么用 |
|------|----|------|--------|
| [`web/`](web) | 网页版（主端，canonical） | 原生 HTML/CSS/JS，零依赖零构建 | 双击 `web/index.html` 或 `web/start.bat` |
| [`miniprogram/`](miniprogram) | 微信小程序 | 原生小程序，游客 appid | 微信开发者工具导入目录，测试号编译 |
| [`android/`](android) | Android APK | 原生 WebView 壳 + TTS/录音桥，minSdk 24 | Android Studio 打开构建，或直接装 [`android/dist/ielts-studio-1.0.apk`](android/dist/ielts-studio-1.0.apk) |

各端详细说明见对应目录的 README。

## 功能

- **今日**：打卡 streak、学习进度环、每日一词、应考提示
- **词汇**：雅思核心 8 话题 120 词 + 小学 / 四级 / 六级 / 雅思全量词库（共约 8700 词，音标、释义、例句），闪卡、列表筛选、逐词逐句朗读、随身听连续播报、拼写与同义替换测验
- **听力**：204 句挖空听写（3 档难度）+ **10 组 Section 1-2 双人对话**（双音色轮流朗读）+ **10 篇 Section 4 学术讲座**；整篇播放、0.8–1.25× 语速、单句复读、原文对照、每篇 3 题选择与中文解析
- **阅读**：3 篇学术长文，T/F/NG + 四选一共 24 题，逐题解析
- **写作**：4 道 Task 2 + 3 道 Task 1（表格/折线/柱状），倒计时、自动存稿、提纲 + 7 篇 7 分范文 + 自评清单
- **口语**：Part 1 五话题 15 问、Part 2 八张题卡（录音回听）、Part 3 十题答题骨架

## 三端同源

- 题库 `data.js` 与逻辑在网页版维护（canonical），小程序持有拷贝：改动后同步到 `miniprogram/utils/`
- 词库 `vocab-levels.js` 由 `web/tools/build-vocab.js` 从词库源数据生成，网页版生成后同步到小程序；Android 端用 `android/tools/sync_web.py` 整体同步网页资产到 `assets/www/`
- 三端学习进度相互独立，分别存于浏览器 / 小程序 / WebView 的本地存储，不上传任何服务器

## 内容与版权声明

- 应用内全部题目、对话、讲座、范文与解析均为**手写原创的 IELTS 风格练习材料**，不含任何官方真题或第三方版权内容；如有雷同纯属巧合
- 词库数据由 [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)（**BSD 3-Clause**，Copyright © KyleBing）的 jsonl 转换生成，遵循其许可；源文件约 42MB，未随仓库分发，需要重新生成时按 [`web/README.md`](web/README.md) 从上游下载到 `web/tools/vocab-src/`（该目录已 gitignore）
- 朗读依赖系统 TTS：网页版用 Web Speech API（推荐 Edge/Chrome 的 en-GB 神经语音），小程序用同声传译插件（WechatSI，不可用时自动降级），Android 端用系统 TextToSpeech 桥接

## License

见 [LICENSE](LICENSE)：**保留所有权利，禁止商业用途**，公开仅作学习交流。
