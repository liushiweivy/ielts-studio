var S = require('../../utils/study.js');
var D = S.D;

var TFNG = [
  { key: 'T', label: 'TRUE' },
  { key: 'F', label: 'FALSE' },
  { key: 'NG', label: 'NOT GIVEN' }
];

Page({
  data: {
    mode: 'list',
    list: [],
    practice: null,
    score: 0,
    total: 0,
    graded: false
  },

  onShow: function () {
    this.refreshList();
  },

  refreshList: function () {
    var store = S.getStore();
    var done = store.readDone || [];
    var best = store.readBest || {};
    var list = D.READING.map(function (p, i) {
      return {
        id: p.id,
        idx: i + 1,
        title: p.title,
        topic: p.topic,
        minutes: p.minutes,
        qn: p.questions.length,
        done: done.indexOf(p.id) >= 0,
        best: best[p.id]
      };
    });
    this.setData({ list: list });
  },

  open: function (e) {
    var pid = e.currentTarget.dataset.id;
    var p = D.READING.find(function (x) { return x.id === pid; });
    this.pid = pid;
    this.answers = {};
    var questions = p.questions.map(function (q) {
      var options;
      if (q.type === 'tfng') {
        options = TFNG.map(function (o) { return { key: o.key, label: o.label, text: '' }; });
      } else {
        options = q.opts.map(function (o, j) {
          return { key: String.fromCharCode(65 + j), label: String.fromCharCode(65 + j) + '.', text: o };
        });
      }
      return {
        stem: q.q,
        type: q.type,
        options: options,
        why: q.why,
        answer: q.a,
        chosen: '',
        isCorrect: false
      };
    });
    this.setData({
      mode: 'practice',
      graded: false,
      score: 0,
      total: p.questions.length,
      practice: {
        title: p.title, topic: p.topic, minutes: p.minutes,
        paragraphs: p.paragraphs, questions: questions
      }
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  back: function () {
    this.setData({ mode: 'list', practice: null });
    this.refreshList();
  },

  choose: function (e) {
    if (this.data.graded) return;
    var qi = e.currentTarget.dataset.qi;
    var key = e.currentTarget.dataset.key;
    this.answers[qi] = key;
    var questions = this.data.practice.questions.map(function (q, i) {
      if (i !== qi) return q;
      var copy = {};
      Object.keys(q).forEach(function (k) { copy[k] = q[k]; });
      copy.chosen = key;
      return copy;
    });
    this.setData({ ['practice.questions']: questions });
  },

  grade: function () {
    var unanswered = 0;
    var p = D.READING.find(function (x) { return x.id === this.pid; }, this);
    var questions = this.data.practice.questions.map(function (q, i) {
      var chosen = this.answers[i] || '';
      if (!chosen) unanswered++;
      var copy = {};
      Object.keys(q).forEach(function (k) { copy[k] = q[k]; });
      copy.chosen = chosen;
      copy.isCorrect = chosen === q.answer;
      return copy;
    }, this);
    if (unanswered > 0) {
      wx.showToast({ title: '还有 ' + unanswered + ' 题未作答', icon: 'none' });
      return;
    }
    var result = S.gradeReading(p.questions, this.answers);
    var store = S.getStore();
    store.readDone = Array.from(new Set((store.readDone || []).concat([this.pid])));
    store.readBest = store.readBest || {};
    store.readBest[this.pid] = Math.max(store.readBest[this.pid] || 0, result.score);
    S.saveStore({ readDone: store.readDone, readBest: store.readBest });
    this.setData({
      graded: true,
      score: result.score,
      ['practice.questions']: questions
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  redo: function () {
    this.answers = {};
    var questions = this.data.practice.questions.map(function (q) {
      var copy = {};
      Object.keys(q).forEach(function (k) { copy[k] = q[k]; });
      copy.chosen = '';
      copy.isCorrect = false;
      return copy;
    });
    this.setData({ graded: false, score: 0, ['practice.questions']: questions });
  }
});
