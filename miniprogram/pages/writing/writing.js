var S = require('../../utils/study.js');
var D = S.D;
var SAVE_DEBOUNCE_MS = 400;

Page({
  data: {
    prompts: [],
    cur: null,
    draft: '',
    words: 0,
    under: true,
    timerText: '40:00',
    danger: false,
    running: false,
    startText: '▶ 开始计时',
    showRef: false
  },

  onLoad: function () {
    this.pid = D.WRITING[0].id;
    this.remaining = D.WRITING[0].time * 60;
    this.timerId = null;
    this.buildList();
    this.loadPrompt();
  },
  onUnload: function () { this.stopTimer(); this.flushDraft(); },
  onHide: function () { this.flushDraft(); },

  buildList: function () {
    var pid = this.pid;
    var drafts = S.getStore().drafts || {};
    var prompts = D.WRITING.map(function (p) {
      return {
        id: p.id, type: p.type, typeCn: p.typeCn, time: p.time,
        lead: p.prompt.slice(0, 60) + '…',
        on: p.id === pid,
        hasDraft: !!drafts[p.id],
        icon: p.model ? '📝' : '🏗'
      };
    });
    this.setData({ prompts: prompts });
  },

  pick: function (e) {
    this.stopTimer();
    this.flushDraft();
    this.pid = e.currentTarget.dataset.id;
    this.buildList();
    this.loadPrompt();
  },

  loadPrompt: function () {
    var p = D.WRITING.find(function (x) { return x.id === this.pid; }, this);
    var drafts = S.getStore().drafts || {};
    var draft = drafts[p.id] || '';
    this.remaining = p.time * 60;
    this.setData({
      cur: p,
      draft: draft,
      words: S.wordCount(draft),
      under: S.wordCount(draft) < p.minWords,
      timerText: this.fmt(this.remaining),
      danger: false,
      running: false,
      startText: '▶ 开始计时',
      showRef: false
    });
  },

  fmt: function (sec) {
    var m = Math.floor(sec / 60), r = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  },

  onInput: function (e) {
    var text = e.detail.value;
    // 视图即时更新，storage 防抖写入（低配机连续输入不卡）
    this.setData({ draft: text, words: S.wordCount(text), under: S.wordCount(text) < this.data.cur.minWords });
    var self = this;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(function () { self.flushDraft(); }, SAVE_DEBOUNCE_MS);
  },

  flushDraft: function () {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    var store = S.getStore();
    store.drafts = store.drafts || {};
    store.drafts[this.pid] = this.data.draft;
    S.saveStore({ drafts: store.drafts });
  },

  saveDraft: function () {
    this.flushDraft();
    wx.showToast({ title: '草稿已保存', icon: 'none' });
  },

  clearDraft: function () {
    var self = this;
    wx.showModal({
      title: '清空草稿', content: '确定清空这篇作文？',
      success: function (res) {
        if (!res.confirm) return;
        var store = S.getStore();
        store.drafts = store.drafts || {};
        delete store.drafts[self.pid];
        S.saveStore({ drafts: store.drafts });
        self.setData({ draft: '', words: 0, under: true });
      }
    });
  },

  toggleRef: function () { this.setData({ showRef: !this.data.showRef }); },

  toggleTimer: function () {
    if (this.data.running) {
      this.stopTimer();
      this.setData({ running: false, startText: '▶ 继续' });
      return;
    }
    var self = this;
    this.setData({ running: true, startText: '⏸ 暂停' });
    this.timerId = setInterval(function () {
      self.remaining--;
      self.setData({
        timerText: self.fmt(Math.max(0, self.remaining)),
        danger: self.remaining <= 300
      });
      if (self.remaining <= 0) {
        self.stopTimer();
        self.setData({ running: false, startText: '⏰ 时间到' });
        wx.showToast({ title: '时间到，对照范文自评', icon: 'none' });
      }
    }, 1000);
  },
  stopTimer: function () {
    this.running = false;
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  },
  resetTimer: function () {
    this.stopTimer();
    this.remaining = this.data.cur.time * 60;
    this.setData({ timerText: this.fmt(this.remaining), danger: false, running: false, startText: '▶ 开始计时' });
  }
});
