// 小程序页面逻辑的 Node 打桩测试：模拟 wx API + Page 注册 + 可控时钟
// 运行：node tools/smoke-test.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

/* ---- wx 打桩 ---- */
const storage = {};
let intervalCb = null;
let recStartCount = 0;
let playerSrc = '';
global.wx = {
  getStorageSync: k => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v; },
  showToast() {}, showModal(o) { o.success && o.success({ confirm: true }); },
  pageScrollTo() {},
  authorize(o) { o.success && o.success(); },
  createInnerAudioContext() {
    return { play() {}, set src(v) { playerSrc = v; }, get src() { return playerSrc; } };
  },
  getRecorderManager() {
    return {
      onStart() {},
      onStop(fn) { this._onStop = fn; },
      onError(fn) { this._onErr = fn; },
      start() { recStartCount++; },
      stop() { this._onStop && this._onStop({ tempFilePath: 'tmp://rec.mp3' }); }
    };
  },
  navigateTo() {}, switchTab() {}
};
global.App = () => {};
const pageDefs = {};
global.Page = def => { pageDefs[def.__name] = def; };

// 可控时钟
const realSetInterval = global.setInterval;
const realClearInterval = global.clearInterval;
global.setInterval = cb => { intervalCb = cb; return 99; };
global.clearInterval = () => { intervalCb = null; };

function loadPage(name, rel) {
  delete require.cache[path.resolve(__dirname, rel)];
  const def = require(rel);
  const inst = Object.assign({}, pageDefs[name]);
  inst.data = JSON.parse(JSON.stringify(pageDefs[name].data));
  inst.setData = function (patch) {
    Object.keys(patch).forEach(k => {
      if (k.indexOf('.') !== -1) {
        // 支持 practice.questions 这类点路径
        const parts = k.split('.');
        let obj = this.data;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = patch[k];
      } else this.data[k] = patch[k];
    });
  };
  return inst;
}

/* ============ 0. 数据完整性 ============ */
const D = require('../utils/data.js');
let pass = 0;
function ok(name, cond) { assert.ok(cond, name); console.log('  PASS ' + name); pass++; }

ok('120 个单词', D.WORDS.length === 120);
ok('8 个词汇类别', D.WORD_CATS.length === 8);
ok('每个类别恰好 15 词', D.WORD_CATS.every(c => D.WORDS.filter(w => w.cat === c.id).length === 15));
ok('24 个听写句', D.LISTENING.length === 24);
ok('听写三难度各 8 句', [1, 2, 3].every(l => D.LISTENING.filter(x => x.level === l).length === 8));
ok('3 篇阅读', D.READING.length === 3);
ok('每篇 8 题', D.READING.every(p => p.questions.length === 8));
ok('每篇含 5 个 T/F/NG', D.READING.every(p => p.questions.filter(q => q.type === 'tfng').length === 5));
ok('7 道写作题', D.WRITING.length === 7);
ok('7 篇写作范文（全部题目含范文）', D.WRITING.filter(w => w.model).length === 7);
ok('Part2 题卡 8 张', D.SPEAKING.part2.length === 8);
ok('Part1 15 问', D.SPEAKING.part1.reduce((n, g) => n + g.items.length, 0) === 15);
ok('Part3 10 题', D.SPEAKING.part3.length === 10);
ok('同义替换 24 组', D.PARAPHRASE.length === 24);
ok('同义替换每组 4 选项且答案在界内', D.PARAPHRASE.every(p => p.opts.length === 4 && p.a >= 0 && p.a < 4));
// 听力挖空词必须真的在句中
D.LISTENING.forEach(x => assert.ok(x.sentence.indexOf(x.answer) >= 0, 'answer in sentence: ' + x.answer));
console.log('  PASS 全部挖空答案词均出现在句子中（24 句）'); pass++;
// 分级词库（小学/四级/六级全量）
const V = require('../utils/vocab-levels.js');
ok('分级词库 3 个等级', V.LEVELS.length === 3);
ok('小学 811 词', V.WORDS.primary.length === 811);
ok('四级 4129 词', V.WORDS.cet4.length === 4129);
ok('六级 2101 词', V.WORDS.cet6.length === 2101);
ok('词条为 4-6 元数组且含中文释义', ['primary', 'cet4', 'cet6'].every(k =>
  V.WORDS[k].every(e => e.length >= 4 && e.length <= 6 && e[3] && e[3].length > 0)));
ok('跨等级无重复词', (() => {
  const seen = new Set();
  for (const k of ['primary', 'cet4', 'cet6']) for (const e of V.WORDS[k]) {
    const w = e[0].toLowerCase();
    if (seen.has(w)) return false;
    seen.add(w);
  }
  return true;
})());

/* ============ 1. 首页打卡与进度 ============ */
global.Page = def => { pageDefs.home = def; };
let home = loadPage('home', '../pages/home/home.js');
home.onShow();
ok('首页打卡 streak=1', home.data.streak === 1);
ok('首次进入即自动打卡，标签显示已打卡', home.data.checkedToday === true);
ok('首页进度环分母来自题库（120/24/3）', home.data.wordsTotal === 120 && home.data.listenTotal === 24 && home.data.readTotal === 3);
ok('首页每日一词', !!home.data.dailyWord.w);
ok('首页提示非空', home.data.tip.length > 0);
home.tapCheckIn();
ok('同日重复打卡仍为 1', home.data.streak === 1);

/* ============ 2. 词汇闪卡 + 测验 ============ */
global.Page = def => { pageDefs.words = def; };
let words = loadPage('words', '../pages/words/words.js');
words.onLoad();
ok('闪卡首词 curriculum', words.data.card.w === 'curriculum');
ok('总数 120', words.data.total === 120);
ok('等级 chips 4 档', words.data.levels.length === 4);
words.flip();
ok('翻面状态', words.data.flipped === true);
words.markKnown();
ok('标记认识后到第 2 张', words.data.idx === 1);
ok('认识已持久化', storage['ielts-mp-v1'].known && storage['ielts-mp-v1'].known.curriculum === true);
words.startCard('env');
ok('切换环境类别为 15 词', words.data.total === 15);
// 切到四级词库：乱序 4129 词、话题 chips 隐藏、释义与例句映射正确
words.tapLevel({ currentTarget: { dataset: { id: 'cet4' } } });
ok('四级词库 4129 词', words.data.total === 4129);
ok('四级下话题 chips 为空', words.data.chips.length === 0);
ok('四级闪卡有词性与中文', !!words.data.card.pos && !!words.data.card.cn);
// 四级拼写测验可用
words.startQuiz();
ok('四级测验 10 题', words.data.qTotal === 10);
words.setData({ qInput: words.data.qWord });
words.submitQuiz();
ok('四级测验判分', words.data.qScore === 1 && words.data.qState === 'good');
// 切回雅思
words.tapLevel({ currentTarget: { dataset: { id: 'ielts' } } });
ok('切回雅思恢复 120 词与话题 chips', words.data.total === 120 && words.data.chips.length === 9);

words.startQuiz();
ok('测验 10 题', words.data.qTotal === 10);
// 故意答错
words.setData({ qInput: 'wrongword' });
words.submitQuiz();
ok('答错反馈 bad', words.data.qState === 'bad' && words.data.qScore === 0);
ok('答错后按钮文案为下一题', words.data.qBtnText === '下一题');
words.advanceQuiz();
// 答对第二题
words.setData({ qInput: words.data.qWord });
words.submitQuiz();
ok('答对得分', words.data.qScore === 1 && words.data.qState === 'good');
// 直接跑到成绩单：剩余题全部答对
let guard = 0;
while (!words.data.qDone && guard++ < 30) {
  if (words.data.qAnswered) words.advanceQuiz();
  else { words.setData({ qInput: words.data.qWord }); words.submitQuiz(); }
}
ok('测验结束出成绩单', words.data.qDone === true);
ok('最终 9/10', words.data.qResult === 9);

/* ---- 同义替换模式 ---- */
words.switchPara();
ok('同义替换 10 题', words.data.pTotal === 10 && words.data.mode === 'para');
ok('题干与 4 选项就绪', !!words.data.pOrig && words.data.pOpts.length === 4);
// 先选错（取非答案项）
const wrongJ = (words.data.pAnswer + 1) % 4;
words.choosePara({ currentTarget: { dataset: { j: wrongJ } } });
ok('选错不得分且出解析', words.data.pScore === 0 && words.data.pAnswered === true && !!words.data.pWhy);
ok('错误项标 wrong、答案项标 correct', words.data.pOpts[wrongJ].cls === 'wrong' && words.data.pOpts[words.data.pAnswer].cls === 'correct');
// 已作答后重复点击无效
words.choosePara({ currentTarget: { dataset: { j: words.data.pAnswer } } });
ok('重复点击不加分', words.data.pScore === 0);
words.nextPara();
ok('下一题重置', words.data.pAnswered === false && words.data.pIdx === 1);
// 答对一题
words.choosePara({ currentTarget: { dataset: { j: words.data.pAnswer } } });
ok('选对得分', words.data.pScore === 1 && words.data.pFbOk === true);
// 全部答对跑完
let pGuard = 0;
while (!words.data.pDone && pGuard++ < 30) {
  if (words.data.pAnswered) words.nextPara();
  else words.choosePara({ currentTarget: { dataset: { j: words.data.pAnswer } } });
}
ok('同义替换成绩单 9/10', words.data.pDone === true && words.data.pResult === 9);
ok('最佳成绩已持久化', storage['ielts-mp-v1'].paraBest === 9);
words.switchCard();
ok('返回闪卡模式', words.data.mode === 'card');

/* ============ 3. 听力 ============ */
global.Page = def => { pageDefs.listening = def; };
let lis = loadPage('listening', '../pages/listening/listening.js');
lis.onLoad();
ok('24 句', lis.data.total === 24);
ok('句子被切成 3 段且中段是空格', lis.data.parts.length === 3 && lis.data.parts[1].t === 'blank');
lis.play();
ok('插件不可用时不扣播放次数（仍为 5）', lis.data.triesLeft === 5);
lis.setData({ input: 'throughout' });
lis.submit();
ok('首句听写正确', lis.data.fbOk === true && lis.data.done === true);
ok('空格显示正确答案（绿色）', lis.data.parts[1].v === 'throughout' && lis.data.parts[1].ok === true);
ok('正确句已持久化', storage['ielts-mp-v1'].listenOk.length === 1);
lis.next();
ok('下一句重置 5 次播放', lis.data.triesLeft === 5 && lis.data.done === false);
lis.setData({ input: 'nonsense' });
lis.submit();
ok('答错判定', lis.data.fbOk === false);
lis.next();
lis.reveal();
ok('直接看答案算错', lis.data.done === true && lis.data.fbOk === false);

/* ============ 4. 阅读 ============ */
global.Page = def => { pageDefs.reading = def; };
let read = loadPage('reading', '../pages/reading/reading.js');
read.onShow();
ok('文章列表 3 篇', read.data.list.length === 3);
read.open({ currentTarget: { dataset: { id: 'kelp' } } });
ok('进入练习态', read.data.mode === 'practice' && read.data.total === 8);
// 未答完不能提交
read.answers = { 0: 'T' };
read.grade();
ok('未答完有 toast 且不出分', read.data.graded === false);
// 全对答案
const correct = ['T', 'F', 'T', 'NG', 'F', 'B', 'C', 'A'];
correct.forEach((key, i) => read.choose({ currentTarget: { dataset: { qi: i, key: key } } }));
read.grade();
ok('全对 8/8', read.data.graded === true && read.data.score === 8);
ok('每题 isCorrect', read.data.practice.questions.every(q => q.isCorrect));
ok('完成状态已持久化', storage['ielts-mp-v1'].readDone.indexOf('kelp') >= 0);
read.back();
ok('列表显示已完成', read.data.list[0].done === true && read.data.list[0].best === 8);
// 第二篇：故意错 3 题
read.open({ currentTarget: { dataset: { id: 'habit' } } });
const habitAnswers = ['T', 'T', 'T', 'T', 'T', 'A', 'A', 'A'];
habitAnswers.forEach((key, i) => read.choose({ currentTarget: { dataset: { qi: i, key: key } } }));
read.grade();
ok('habit 篇得分 3/8（TFNG 对 3、选择全错）', read.data.score === 3);

/* ============ 5. 写作 ============ */
global.Page = def => { pageDefs.writing = def; };
let wr = loadPage('writing', '../pages/writing/writing.js');
wr.onLoad();
ok('默认 Task 2（40 分钟）', wr.data.cur.time === 40 && wr.data.timerText === '40:00');
wr.onInput({ detail: { value: 'one two three four five' } });
ok('字数统计 5', wr.data.words === 5 && wr.data.under === true);
ok('输入后防抖未落盘', !(storage['ielts-mp-v1'].drafts && storage['ielts-mp-v1'].drafts[wr.pid]));
wr.flushDraft();
ok('flush 后草稿已保存', storage['ielts-mp-v1'].drafts[wr.pid].indexOf('five') >= 0);
wr.pick({ currentTarget: { dataset: { id: 't1' } } });
ok('Task1 20 分钟', wr.data.cur.time === 20 && !!wr.data.cur.table);
ok('Task1 表格 6 行数据', wr.data.cur.table.rows.length === 6);
wr.toggleTimer();
intervalCb(); intervalCb();
ok('计时器走 2 秒到 19:58', wr.data.timerText === '19:58' && wr.data.running === true);
wr.toggleTimer();
ok('暂停', wr.data.startText === '▶ 继续');
wr.resetTimer();
ok('重置回 20:00', wr.data.timerText === '20:00');
wr.toggleRef();
ok('提纲/范文展开', wr.data.showRef === true);

/* ============ 6. 口语 ============ */
global.Page = def => { pageDefs.speaking = def; };
let sp = loadPage('speaking', '../pages/speaking/speaking.js');
sp.onLoad();
ok('Part2 题卡 8 张', sp.data.cues.length === 8);
ok('Part1 五个话题组', sp.data.part1.length === 5);
ok('Part3 首题默认展开', sp.data.part3[0].open === true);
sp.startPrep({ currentTarget: { dataset: { id: 's1' } } });
ok('准备阶段标签', sp.data.activeId === 's1' && sp.data.phase.indexOf('准备') >= 0);
intervalCb();
ok('准备计时到 00:59', sp.data.clock === '00:59');
sp.startSpeak({ currentTarget: { dataset: { id: 's2' } } });
ok('录音已启动（authorize 打桩直接成功）', recStartCount === 1 && sp.data.recording === true);
ok('作答 120 秒', sp.data.clock === '02:00');
intervalCb();
ok('作答计时到 01:59', sp.data.clock === '01:59');
// 模拟录音停止回调
sp.recorder.stop();
ok('停止后出现录音文件', sp.data.recPath === 'tmp://rec.mp3' && sp.data.recForId === 's2');
sp.playBack();
ok('播放器拿到录音路径', playerSrc === 'tmp://rec.mp3');
sp.toggleCue({ currentTarget: { dataset: { id: 's1' } } });
ok('示范答案展开', sp.data.cues[0].showModel === true);
sp.toggleP1({ currentTarget: { dataset: { gi: 0, ii: 0 } } });
ok('Part1 折叠展开', sp.data.part1[0].items[0].open === true);
sp.toggleP3({ currentTarget: { dataset: { i: 0 } } });
ok('Part3 折叠收起', sp.data.part3[0].open === false);

/* ============ 7. 录音归属 / 切换题卡 ============ */
// 当前仍在 s2 录音态（前面 stop 是 onStop 回调，recording 已 false，先重新录 s2）
sp.startSpeak({ currentTarget: { dataset: { id: 's2' } } });
ok('s2 重新录音', sp.data.recording === true && recStartCount === 2);
// 不经过准备直接在 s4 开录音：旧录音应被吞掉，不覆盖新卡状态
sp.beginRecord('s4');
ok('切卡旧录音 onStop 被吞（recPath 仍为空）', sp.data.recPath === '' && sp.data.recording === true);
sp.recorder.stop();
ok('新录音停止后归属 s4', sp.data.recForId === 's4' && !!sp.data.recPath);
// 准备别的卡会先正常停录（不吞），回放归原卡
sp.beginRecord('s1');
sp.startPrep({ currentTarget: { dataset: { id: 's3' } } });
ok('准备 s3 时停止 s1 录音，回放仍挂 s1', sp.data.recForId === 's1' && !!sp.data.recPath);

/* ============ 8. 评审回归锁定（静态 + 防御） ============ */
const appJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app.json'), 'utf8'));
ok('app.json 不声明插件（游客 appid 挂插件会整包启动失败）', !appJson.plugins);
const wordsWxml = fs.readFileSync(path.resolve(__dirname, '../pages/words/words.wxml'), 'utf8');
ok('测验听音按钮绑 speak（非 speakText）', /catchtap="speak" data-text="\{\{qWord\}\}"/.test(wordsWxml));
ok('WXML 中无直接绑 speakText 的按钮', !/catchtap="speakText"/.test(wordsWxml));
// speakText 收到事件对象时自动解包，不抛异常
words.speakText({ currentTarget: { dataset: { text: 'curriculum' } } });
ok('speakText 防御事件对象入参', true);

global.setInterval = realSetInterval;
global.clearInterval = realClearInterval;

console.log('\n✅ 全部 ' + pass + ' 条断言通过');
