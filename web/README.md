# 雅思书房 · IELTS Studio（网页版）

零依赖单页应用：双击 `index.html`（或运行 `start.bat`）即可使用，无需联网、无需构建。

## 五大模块

| 模块 | 内容 |
|------|------|
| 今日 | 学习打卡 streak、词汇/听力/阅读进度环、每日一词、每日应考提示 |
| 词汇 | **五个等级**：雅思核心 8 话题 × 120 个 7 分核心词；**雅思词库 1634 / 小学 811 / 四级 4129 / 六级 2101 全量词库**（人教 + 考纲 + 雅思词表，含音标释义例句，跨等级去重）。闪卡翻面、**列表模式**（全量展开 + 筛选 + 逐词/逐句朗读）、**🎧 随身听**（单词→释义→例句连续播报磨耳朵，可调语速/乱序）、认识/不认识、10 题拼写测验、10 题同义替换测验 |
| 听力 | 三个板块：**句子听写**（手写真题风格句 24 句 + 雅思例句库 180 句，3 档难度挖空、每句限播 5 次）、**对话篇章 ×10**（租房/入会/旅行/面试/办卡/订位/陶艺课/搬家/失物/慈善跑等 Section 1-2 场景，A/B 双人双音色轮流朗读）、**短文讲座 ×10**（鲸鲨/城市骑行/睡眠记忆/博物馆/蜜蜂/垂直农业/潮汐能/拖延心理学/巧克力史/仿生学 Section 4 学术独白）；整篇播放、0.8/1/1.25× 语速、单句复读、原文显隐对照、每篇 3 题选择 + 解析 |
| 阅读 | 3 篇学术长文（环境、心理学、AI 招聘），T/F/NG + 四选一各 8 题，提交后逐题解析 |
| 写作 | 4 道 Task 2 + 3 道 Task 1（表格/折线图/柱状图）；40/20 分钟倒计时、实时字数、自动存稿、提纲 + **7 篇全部带 7 分范文**、自评清单 |
| 口语 | Part 2 × 8 题卡（60s 准备 + 120s 录音回听）、Part 1 × 5 话题 15 问范例、Part 3 × 10 题答题骨架 |

## 技术说明

- 纯原生 HTML/CSS/JS，数据与逻辑分离：`js/data.js`（雅思题库，UMD）+ `js/vocab-levels.js`（分级词库，UMD）+ `js/app.js`
- 分级词库与雅思例句听写库由 `tools/build-vocab.js` 从 `tools/vocab-src/*.jsonl` 生成（源：[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)（BSD-3-Clause），人教小学 3-6 年级 / CET-4 / CET-6 / 雅思）；跨等级去重，词保留在最低等级；重新生成：先把上游 jsonl 放入 `tools/vocab-src/`（该目录已 gitignore，约 42MB，不随仓库分发），再 `node tools/build-vocab.js`
- 进度存于浏览器 `localStorage`（key: `ielts-studio-v1`，打卡日期按本地时区）；各级「认识」按单词共享一份掌握记录
- 阅读批改有漏答拦截；切题卡会停止其他录音并释放麦克风；切语速不清空已输入答案
- 朗读使用 Web Speech API（speechSynthesis），优先 en-GB 语音，Windows 需系统装有英语语音（Edge 自带在线神经语音）
- 录音使用 MediaRecorder；`file://` 下部分浏览器可能限制麦克风，可用 Edge/Chrome，若被拒会给出提示
- 小程序版：[`../miniprogram`](../miniprogram)（游客 appid，与本项目共用 `js/data.js` 与 `js/vocab-levels.js`）；Android 壳：[`../android`](../android)

## 文件

```
index.html              页面骨架
css/styles.css          暖纸学院风样式
js/data.js              ★ canonical 雅思题库（改动后拷贝到小程序 utils/data.js）
js/vocab-levels.js      ★ canonical 分级词库（生成产物，勿手改；同步到小程序 utils/vocab-levels.js）
js/listening-bank.js    雅思例句听写库（生成产物，勿手改；小程序版暂未引入）
js/app.js               全部交互逻辑
tools/build-vocab.js    词库生成脚本
tools/vocab-src/        词库源文件（jsonl，gitignore 不随仓分发，从上游仓库下载）
start.bat               双击在默认浏览器打开
```
