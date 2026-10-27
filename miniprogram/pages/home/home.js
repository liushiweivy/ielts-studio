var S = require('../../utils/study.js');
var D = S.D;

Page({
  data: {
    streak: 0,
    checkedToday: false,
    knownCount: 0,
    listenCount: 0,
    readCount: 0,
    wordsPct: 0,
    listenPct: 0,
    readPct: 0,
    wordsTotal: D.WORDS.length,
    listenTotal: D.LISTENING.length,
    readTotal: D.READING.length,
    dailyWord: null,
    tip: ''
  },

  onShow: function () {
    var res = S.checkIn();
    var store = S.getStore();
    var knownCount = store.known ? Object.keys(store.known).length : 0;
    var listenCount = (store.listenOk || []).length;
    var readCount = (store.readDone || []).length;
    var w = D.WORDS[S.dayNum(S.dayStr()) % D.WORDS.length];
    this.setData({
      streak: res.streak,
      checkedToday: store.lastDay === S.dayStr(),
      knownCount: knownCount,
      listenCount: listenCount,
      readCount: readCount,
      wordsPct: Math.round(knownCount / D.WORDS.length * 100),
      listenPct: Math.round(listenCount / D.LISTENING.length * 100),
      readPct: Math.round(readCount / D.READING.length * 100),
      dailyWord: { w: w.w, ph: w.ph, pos: w.pos, cn: w.cn },
      tip: D.TIPS[S.dayNum(S.dayStr()) % D.TIPS.length]
    });
  },

  tapCheckIn: function () {
    var res = S.checkIn();
    this.setData({ streak: res.streak, checkedToday: true });
    wx.showToast({ title: '已打卡 ' + res.streak + ' 天', icon: 'none' });
  },

  goTab: function (e) {
    wx.switchTab({ url: e.currentTarget.dataset.url });
  },
  goSpeaking: function () {
    wx.navigateTo({ url: '/pages/speaking/speaking' });
  }
});
