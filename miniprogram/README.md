# 雅思书房 · IELTS Studio（微信小程序版）

与网页版（[`../web`](../web)）共用同一份题库 `utils/data.js` 与分级词库 `utils/vocab-levels.js`（canonical 在网页版 `js/`，改动后需同步拷贝）。

## 运行

1. 打开 **微信开发者工具** → 导入项目 → 选择本目录
2. AppID 选择「测试号 / 使用游客模式」（project.config.json 已配 `touristappid`）
3. 编译即可，无需后端、无需联网（朗读插件除外）

## 页面

| Tab/页面 | 功能 |
|-----------|------|
| 今日（home） | 打卡 streak、词汇/听力/阅读进度环、每日一词、每日应考提示、口语入口 |
| 词汇（words） | **四个等级**：雅思核心 8 类 120 词 + **小学 811 / 四级 4129 / 六级 2101 全量词库**（含音标释义例句）；闪卡 3D 翻面、认识/不认识（跨等级共享掌握记录）、10 题拼写测验、10 题同义替换测验、TTS 朗读 |
| 听力（listening） | 24 句挖空听写、3 档难度、每句限播 5 次；朗读走 TTS（见下方插件说明） |
| 阅读（reading） | 3 篇学术文 × 8 题（T/F/NG + 选择），提交批改、逐题解析、分数持久化 |
| 写作（writing） | 7 题（4 Task 2 + 3 Task 1：表格/折线图/柱状图），倒计时、字数统计、自动存稿、提纲/**7 篇全部带范文**/自评清单 |
| 口语（speaking，二级页） | Part 2 × 8 题卡（60s 准备 + 120s 录音回听，RecorderManager）、Part 1 五话题 15 问范例、Part 3 十题骨架 |

## 关键技术点

- 题库：`utils/data.js` + `utils/vocab-levels.js`（均 UMD，Node 可直接 require）；词库由网页版 `tools/build-vocab.js` 从人教/CET 考纲 jsonl 生成，跨等级去重、词保留在最低等级；纯逻辑：`utils/study.js`（打卡、洗牌、字数、批改、存储 key `ielts-mp-v1`）
- 朗读：`requirePlugin('WechatSI')`（同声传译插件，provider `wx069ba97219f66d99`，0.3.6）+ `InnerAudioContext`；插件不可用时降级为 toast，**且不扣减播放次数**，不影响其他功能
- 录音：`wx.getRecorderManager()`（mp3）+ `wx.authorize` 权限处理；切题卡自动结束录音，回放固定归属原卡
- 无 DOM API、无数组字面量写入 WXML；所有视图模型在 JS 中构建后 setData
- 进度存储：`wx.setStorageSync`；写作草稿 400ms 防抖落盘 + 切题/离页 flush
- 包体：主包约 1.06MB（含 911KB 词库），低于 2MB 限制

## TTS 插件说明（重要）

**`app.json` 默认不声明 WechatSI 插件**：游客/测试 appid 无法拉取插件代码，一旦在 `app.json` 声明，DevTools 会报 `provider:wx..., AppID 不合法,invalid appid` 并导致**整个小程序模拟器启动失败**（不只是朗读不可用）。

- 游客 appid 下：朗读按钮提示「演示版不支持朗读，正式版可用」，其余功能全部正常
- 接入正式 AppID 后启用朗读：在小程序管理后台添加「微信同声传译」插件，再在 `app.json` 顶层加回：
  ```json
  "plugins": {
    "WechatSI": { "version": "0.3.6", "provider": "wx069ba97219f66d99" }
  }
  ```
  页面代码（`words.js` / `listening.js`）无需改动

## 测试

```bash
node tools/smoke-test.js
```

Node 打桩测试（模拟 wx 存储 / 录音 / 授权 / 可控时钟）：数据完整性 + 分级词库 811/4129/2101 计数与跨级去重锁定 + 六页面交互 + 等级切换与同义替换流程，共 **105 条断言**。

另已用微信开发者工具 CLI（游客 appid）真机模拟器验证：编译通过、`simulator launch success`（移除插件声明后）。

## 已知限制

- 游客 appid 仅用于开发者工具；真机发布需替换正式 AppID 并按上节启用插件
- 插件 TTS 不支持语速调节，故小程序版没有 0.8/1.2x 变速（网页版有）
