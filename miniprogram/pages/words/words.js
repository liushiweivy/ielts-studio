var S = require('../../utils/study.js');
var D = S.D;
var V = S.V;

// 微信同声传译插件（游客 appid 在开发者工具中可用；真机不可用时静默降级）
var ttsPlugin = null;
try { ttsPlugin = requirePlugin('WechatSI'); } catch (e) { ttsPlugin = null; }
var audio = null;

Page({
  data: {
    mode: 'card', // card | quiz | para
    level: 'ielts', // ielts | primary | cet4 | cet6
    levels: [],
    chips: [],
    // 闪卡
    cat: 'all',
    card: null,
    idx: 0,
    total: 0,
    pct: 0,
    flipped: false,
    isKnown: false,
    finished: false,
    // 拼写测验
    qPos: '', qCn: '', qCat: '', qWord: '', qEx: '', qPh: '',
    qIdx: 0, qTotal: 0, qScore: 0,
    qState: '',      // '' | good | bad
    qFb: '',
    qAnswered: false,
    qBtnText: '提交',
    qInput: '',
    qDone: false,
    qResult: 0,
    // 同义替换
    pOrig: '', pOpts: [], pAnswer: 0,
    pIdx: 0, pTotal: 0, pScore: 0,
    pAnswered: false, pWhy: '', pFbOk: false,
    pBtnText: '下一题',
    pDone: false, pResult: 0
  },

  onLoad: function () {
    this.list = D.WORDS.slice();
    this.quizList = [];
    this.paraList = [];
    this.buildLevels();
    this.buildChips('all');
    this.startCard('all');
  },

  buildLevels: function () {
    var self = this;
    var levels = [{ id: 'ielts', name: '雅思 ' + D.WORDS.length, on: self.data.level === 'ielts' }];
    (V.LEVELS || []).forEach(function (l) {
      levels.push({ id: l.id, name: l.name + ' ' + (V.WORDS[l.id] || []).length, on: self.data.level === l.id });
    });
    this.setData({ levels: levels });
  },
  tapLevel: function (e) {
    var lv = e.currentTarget.dataset.id;
    if (lv !== this.data.level) this.setData({ level: lv, cat: 'all' });
    this.buildLevels();
    this.startCard('all');
  },

  buildChips: function (cat) {
    if (this.data.level !== 'ielts') { this.setData({ chips: [] }); return; } // 分级词库不按话题分类
    var chips = [{ id: 'all', name: '全部 ' + D.WORDS.length, on: cat === 'all' }];
    D.WORD_CATS.forEach(function (c) {
      chips.push({ id: c.id, name: c.name, on: cat === c.id });
    });
    this.setData({ chips: chips });
  },

  /* ---------- 闪卡 ---------- */
  startCard: function (cat) {
    if (this.data.level === 'ielts') {
      this.list = cat === 'all' ? D.WORDS.slice() : D.WORDS.filter(function (w) { return w.cat === cat; });
    } else {
      this.list = S.shuffle(S.levelList(this.data.level)); // 大词库乱序进入
    }
    this.setData({ cat: cat, finished: false, mode: 'card' });
    this.buildChips(cat);
    this.showCard(0);
  },
  showCard: function (idx) {
    var w = this.list[idx];
    var store = S.getStore();
    var card = {
      w: w.w, ph: w.ph, pos: w.pos, cn: w.cn, ex: w.ex || '', exCn: w.exCn || '',
      cat: w.cat, catName: S.catName(w.cat)
    };
    this.setData({
      idx: idx,
      total: this.list.length,
      pct: Math.round((idx + 1) / this.list.length * 100),
      flipped: false,
      isKnown: !!(store.known && store.known[w.w]),
      card: card
    });
  },
  tapChip: function (e) { this.startCard(e.currentTarget.dataset.id); },
  flip: function () { this.setData({ flipped: !this.data.flipped }); },

  markKnown: function () {
    var w = this.list[this.data.idx];
    var store = S.getStore();
    store.known = store.known || {};
    store.known[w.w] = true;
    S.saveStore({ known: store.known });
    this.nextCard();
  },
  markUnknown: function () {
    var w = this.list[this.data.idx];
    var store = S.getStore();
    store.known = store.known || {};
    delete store.known[w.w];
    S.saveStore({ known: store.known });
    this.nextCard();
  },
  nextCard: function () {
    if (this.data.idx < this.list.length - 1) this.showCard(this.data.idx + 1);
    else this.setData({ finished: true });
  },
  replay: function () { this.startCard(this.data.cat); },
  toQuiz: function () { this.startQuiz(); },

  onUnload: function () {
    if (audio) { try { audio.destroy(); } catch (e2) {} audio = null; }
  },

  speak: function (e) {
    var text = e.currentTarget.dataset.text;
    this.speakText(text);
  },
  speakText: function (text) {
    // 防御：被 WXML 直接绑定时收到的是事件对象而非文本
    if (text && text.currentTarget) text = text.currentTarget.dataset.text;
    if (!ttsPlugin || !ttsPlugin.textToSpeech) {
      wx.showToast({ title: '演示版不支持朗读，正式版可用', icon: 'none' });
      return;
    }
    ttsPlugin.textToSpeech({
      lang: 'en_US',
      tts: true,
      content: text,
      success: function (res) {
        if (!audio) audio = wx.createInnerAudioContext();
        audio.src = res.filename;
        audio.play();
      },
      fail: function () {
        wx.showToast({ title: '语音服务暂不可用', icon: 'none' });
      }
    });
  },

  /* ---------- 拼写测验 ---------- */
  switchQuiz: function () { this.startQuiz(); },
  switchCard: function () { this.setData({ mode: 'card', qDone: false, pDone: false }); this.startCard(this.data.cat); },
  startQuiz: function () {
    var pool;
    if (this.data.level === 'ielts') {
      var cat = this.data.cat;
      pool = cat === 'all' ? D.WORDS : D.WORDS.filter(function (w) { return w.cat === cat; });
    } else {
      pool = S.levelList(this.data.level);
    }
    this.quizList = S.shuffle(pool).slice(0, Math.min(10, pool.length));
    this.setData({ mode: 'quiz', qDone: false, qResult: 0 });
    this.showQuiz(0, 0);
  },
  showQuiz: function (idx, score) {
    var w = this.quizList[idx];
    this.setData({
      qIdx: idx,
      qTotal: this.quizList.length,
      qScore: score,
      qPos: w.pos, qCn: w.cn, qCat: S.catName(w.cat),
      qWord: w.w, qPh: w.ph, qEx: w.ex || '',
      qState: '', qFb: '', qAnswered: false,
      qBtnText: idx === this.quizList.length - 1 ? '查看成绩' : '提交',
      qInput: ''
    });
  },
  onQuizInput: function (e) { this.setData({ qInput: e.detail.value }); },
  submitQuiz: function () {
    if (this.data.qAnswered) { this.advanceQuiz(); return; }
    var ok = S.normWord(this.data.qInput) === S.normWord(this.data.qWord);
    var score = this.data.qScore + (ok ? 1 : 0);
    this.setData({
      qAnswered: true,
      qState: ok ? 'good' : 'bad',
      qScore: score,
      qFb: ok ? '✓ 正确！' + this.data.qWord + ' ' + this.data.qPh
              : '✗ 正确答案：' + this.data.qWord + (this.data.qEx ? '　' + this.data.qEx : ''),
      qBtnText: this.data.qIdx === this.quizList.length - 1 ? '查看成绩' : '下一题'
    });
  },
  advanceQuiz: function () {
    if (this.data.qIdx < this.quizList.length - 1) {
      this.showQuiz(this.data.qIdx + 1, this.data.qScore);
    } else {
      var store = S.getStore();
      store.quizBest = Math.max(store.quizBest || 0, this.data.qScore);
      S.saveStore({ quizBest: store.quizBest });
      this.setData({ qDone: true, qResult: this.data.qScore });
    }
  },
  quizAgain: function () { this.startQuiz(); },

  /* ---------- 同义替换测验 ---------- */
  switchPara: function () { this.startPara(); },
  startPara: function () {
    this.paraList = S.shuffle(D.PARAPHRASE).slice(0, Math.min(10, D.PARAPHRASE.length));
    this.setData({ mode: 'para', pDone: false, pResult: 0 });
    this.showPara(0, 0);
  },
  showPara: function (idx, score) {
    var q = this.paraList[idx];
    this.setData({
      pIdx: idx,
      pTotal: this.paraList.length,
      pScore: score,
      pOrig: q.orig,
      pAnswer: q.a,
      pOpts: q.opts.map(function (o, j) {
        return { t: o, letter: String.fromCharCode(65 + j), cls: '' };
      }),
      pAnswered: false, pWhy: '', pFbOk: false,
      pBtnText: idx === this.paraList.length - 1 ? '查看成绩' : '下一题'
    });
  },
  choosePara: function (e) {
    if (this.data.pAnswered) return;
    var pick = Number(e.currentTarget.dataset.j);
    var q = this.paraList[this.data.pIdx];
    var ok = pick === q.a;
    var opts = this.data.pOpts.map(function (o, j) {
      return { t: o.t, letter: o.letter, cls: j === q.a ? 'correct' : (j === pick ? 'wrong' : '') };
    });
    this.setData({
      pAnswered: true,
      pFbOk: ok,
      pScore: this.data.pScore + (ok ? 1 : 0),
      pOpts: opts,
      pWhy: q.why
    });
  },
  nextPara: function () {
    if (!this.data.pAnswered) return;
    if (this.data.pIdx < this.paraList.length - 1) {
      this.showPara(this.data.pIdx + 1, this.data.pScore);
    } else {
      var store = S.getStore();
      store.paraBest = Math.max(store.paraBest || 0, this.data.pScore);
      S.saveStore({ paraBest: store.paraBest });
      this.setData({ pDone: true, pResult: this.data.pScore });
    }
  },
  paraAgain: function () { this.startPara(); }
});
