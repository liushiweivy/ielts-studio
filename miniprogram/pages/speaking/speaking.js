var S = require('../../utils/study.js');
var D = S.D;

function fmt(sec) {
  var m = Math.floor(sec / 60), r = sec % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}

Page({
  data: {
    cues: [],
    part1: [],
    part3: [],
    activeId: '',
    clock: '1:00',
    phase: '准备 60 秒',
    cls: 'prep',
    recording: false,
    recPath: '',
    recForId: ''
  },

  onLoad: function () {
    var cues = D.SPEAKING.part2.map(function (c) {
      return { id: c.id, cue: c.cue, bullets: c.bullets, model: c.model, showModel: false };
    });
    var part1 = D.SPEAKING.part1.map(function (g) {
      return {
        topic: g.topic, icon: g.icon,
        items: g.items.map(function (it) { return { q: it.q, a: it.a, open: false }; })
      };
    });
    var part3 = D.SPEAKING.part3.map(function (p, i) {
      return { q: p.q, tips: p.tips, open: i === 0 };
    });
    this.setData({ cues: cues, part1: part1, part3: part3 });

    var self = this;
    this.phaseLeft = 0;
    this.phaseCls = 'prep';
    this.recId = '';               // 录音归属的题卡
    this.suppressNextStop = false; // 主动切卡弃用旧录音时，吞掉它的 onStop
    this.recorder = wx.getRecorderManager();
    this.player = wx.createInnerAudioContext();
    this.recorder.onStop(function (res) {
      if (self.suppressNextStop) { self.suppressNextStop = false; return; }
      self.setData({ recording: false, recPath: res.tempFilePath, recForId: self.recId });
    });
    this.recorder.onError(function () {
      self.setData({ recording: false });
      wx.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' });
    });
  },

  onUnload: function () {
    this.clearTimer();
    try { this.recorder.stop(); } catch (e) {}
    try { this.player.destroy(); } catch (e2) {}
  },

  // 切换题卡/模式前先结束正在进行的录音，回放入口归到原卡
  stopRecording: function () {
    if (!this.data.recording) return;
    try { this.recorder.stop(); } catch (e) {}
  },

  clearTimer: function () {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  },

  startPrep: function (e) {
    var id = e.currentTarget.dataset.id;
    this.clearTimer();
    this.stopRecording(); // 切卡先结束进行中的录音，回放归原卡
    this.runTimer(id, 60, 'prep', '准备中…');
  },

  startSpeak: function (e) {
    var id = e.currentTarget.dataset.id;
    this.clearTimer();
    var self = this;
    wx.authorize({
      scope: 'scope.record',
      success: function () { self.beginRecord(id); },
      fail: function () {
        wx.showModal({
          title: '需要麦克风权限',
          content: '在设置中允许麦克风后才能录音回听，仍可只使用计时器。',
          confirmText: '只计时',
          success: function () { self.runTimer(id, 120, 'speak', '作答中（未录音）'); }
        });
      }
    });
  },

  beginRecord: function (id) {
    if (this.data.recording) {
      // 从别的题卡直接跳到新录音：旧录音作废，吞掉它的 onStop
      this.suppressNextStop = true;
      try { this.recorder.stop(); } catch (e) {}
    }
    this.recId = id;
    this.recorder.start({ duration: 120000, format: 'mp3', sampleRate: 44100, numberOfChannels: 1 });
    this.setData({ recording: true, recPath: '', recForId: id });
    this.runTimer(id, 120, 'speak', '录音作答中');
  },

  runTimer: function (id, secs, cls, label) {
    var self = this;
    this.phaseCls = cls;
    this.phaseLeft = secs;
    this.setData({ activeId: id, clock: fmt(secs), phase: label, cls: cls });
    this.timerId = setInterval(function () {
      self.phaseLeft--;
      self.setData({ clock: fmt(Math.max(0, self.phaseLeft)) });
      if (self.phaseLeft <= 0) {
        self.clearTimer();
        self.setData({ phase: '时间到', clock: '00:00' });
        if (cls === 'speak') { try { self.recorder.stop(); } catch (e) {} }
        wx.showToast({ title: cls === 'prep' ? '准备结束，开始作答' : '两分钟到！', icon: 'none' });
      }
    }, 1000);
  },

  playBack: function () {
    if (!this.data.recPath) return;
    this.player.src = this.data.recPath;
    this.player.play();
  },

  toggleCue: function (e) {
    var id = e.currentTarget.dataset.id;
    var cues = this.data.cues.map(function (c) {
      if (c.id !== id) return c;
      var copy = {};
      Object.keys(c).forEach(function (k) { copy[k] = c[k]; });
      copy.showModel = !copy.showModel;
      return copy;
    });
    this.setData({ cues: cues });
  },

  toggleP1: function (e) {
    var gi = e.currentTarget.dataset.gi, ii = e.currentTarget.dataset.ii;
    var part1 = this.data.part1.slice();
    var group = {};
    Object.keys(part1[gi]).forEach(function (k) { group[k] = part1[gi][k]; });
    group.items = group.items.map(function (it, j) {
      if (j !== ii) return it;
      var copy = {};
      Object.keys(it).forEach(function (k) { copy[k] = it[k]; });
      copy.open = !copy.open;
      return copy;
    });
    part1[gi] = group;
    this.setData({ part1: part1 });
  },

  toggleP3: function (e) {
    var i = e.currentTarget.dataset.i;
    var part3 = this.data.part3.map(function (p, j) {
      if (j !== i) return p;
      var copy = {};
      Object.keys(p).forEach(function (k) { copy[k] = p[k]; });
      copy.open = !copy.open;
      return copy;
    });
    this.setData({ part3: part3 });
  }
});
