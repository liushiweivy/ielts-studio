var S = require('../../utils/study.js');
var D = S.D;

var ttsPlugin = null;
try { ttsPlugin = requirePlugin('WechatSI'); } catch (e) { ttsPlugin = null; }
var audio = null;
var MAX_TRIES = 5;

Page({
  data: {
    chips: [
      { id: 0, name: '全部' },
      { id: 1, name: '★ 基础' },
      { id: 2, name: '★★ 进阶' },
      { id: 3, name: '★★★ 冲刺' }
    ],
    level: 0,
    idx: 0,
    total: 0,
    pct: 0,
    stars: '',
    parts: [],
    cn: '',
    triesLeft: MAX_TRIES,
    input: '',
    done: false,
    fbOk: false,
    fbText: '',
    answer: ''
  },

  onLoad: function () {
    this.list = D.LISTENING.slice();
    this.buildChips(0);
    this.showItem(0);
  },

  buildChips: function (level) {
    var chips = this.data.chips.map(function (c) {
      return { id: c.id, name: c.name, on: c.id === level };
    });
    this.setData({ chips: chips });
  },

  pickLevel: function (e) {
    var level = e.currentTarget.dataset.id;
    this.list = level ? D.LISTENING.filter(function (x) { return x.level === level; }) : D.LISTENING.slice();
    this.buildChips(level);
    this.setData({ level: level });
    this.showItem(0);
  },

  showItem: function (idx) {
    var item = this.list[idx];
    var at = item.sentence.indexOf(item.answer);
    var parts = [
      { t: 'text', v: item.sentence.slice(0, at) },
      { t: 'blank', v: '', ok: false },
      { t: 'text', v: item.sentence.slice(at + item.answer.length) }
    ];
    this.setData({
      idx: idx,
      total: this.list.length,
      pct: Math.round(idx / this.list.length * 100),
      stars: '★'.repeat(item.level),
      parts: parts,
      cn: item.cn,
      triesLeft: MAX_TRIES,
      input: '',
      done: false,
      fbOk: false,
      fbText: '',
      answer: ''
    });
  },

  onUnload: function () {
    if (audio) { try { audio.destroy(); } catch (e) {} audio = null; }
  },

  play: function () {
    if (this.data.triesLeft <= 0) {
      wx.showToast({ title: '本句播放次数已用完', icon: 'none' });
      return;
    }
    if (!ttsPlugin || !ttsPlugin.textToSpeech) {
      // 不可用环境不扣次数，避免 5 次机会被 toast 烧光
      wx.showToast({ title: '演示版不支持朗读，正式版可用', icon: 'none' });
      return;
    }
    var item = this.list[this.data.idx];
    var self = this;
    this.setData({ triesLeft: this.data.triesLeft - 1 });
    ttsPlugin.textToSpeech({
      lang: 'en_US',
      tts: true,
      content: item.sentence,
      success: function (res) {
        if (!audio) audio = wx.createInnerAudioContext();
        audio.src = res.filename;
        audio.play();
      },
      fail: function () {
        // 服务失败退还一次播放机会
        self.setData({ triesLeft: Math.min(MAX_TRIES, self.data.triesLeft + 1) });
        wx.showToast({ title: '语音服务暂不可用', icon: 'none' });
      }
    });
  },

  onInput: function (e) { this.setData({ input: e.detail.value }); },

  grade: function (revealed) {
    if (this.data.done) return;
    var item = this.list[this.data.idx];
    var ok = !revealed && S.listenCorrect(this.data.input, item.answer);
    var parts = this.data.parts.map(function (p) {
      if (p.t === 'blank') return { t: 'blank', v: item.answer, ok: ok };
      return p;
    });
    var patch = {
      done: true,
      fbOk: ok,
      fbText: ok ? '✓ 听写正确！' : '✗ 正确答案：' + item.answer,
      answer: item.answer,
      parts: parts
    };
    if (ok) {
      var store = S.getStore();
      store.listenOk = Array.from(new Set((store.listenOk || []).concat([item.sentence])));
      S.saveStore({ listenOk: store.listenOk });
    }
    this.setData(patch);
  },

  submit: function () {
    if (!this.data.input.trim()) { wx.showToast({ title: '先输入答案', icon: 'none' }); return; }
    this.grade(false);
  },
  reveal: function () { this.setData({ input: this.list[this.data.idx].answer }); this.grade(true); },
  next: function () { this.showItem((this.data.idx + 1) % this.list.length); }
});
