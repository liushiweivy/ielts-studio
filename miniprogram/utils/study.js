// 跨页面共用的纯逻辑 + 本地进度（小程序与 Node 打桩测试均可 require）
var D = require('./data.js');
var V = require('./vocab-levels.js');

var KEY = 'ielts-mp-v1';

/* ---------- 进度存储 ---------- */
function getStore() {
  try { return wx.getStorageSync(KEY) || {}; } catch (e) { return {}; }
}
function saveStore(patch) {
  var s = getStore();
  Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
  try { wx.setStorageSync(KEY, s); } catch (e) {}
  return s;
}
function dayStr(d) {
  d = d || new Date();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}
function dayNum(s) { return Math.floor(new Date(s + 'T00:00:00').getTime() / 864e5); }

// 打卡，返回 {streak, checked}
function checkIn() {
  var s = getStore(), t = dayStr();
  if (s.lastDay === t) return { streak: s.streak || 0, checked: true };
  s.streak = s.lastDay && dayNum(t) - dayNum(s.lastDay) === 1 ? (s.streak || 0) + 1 : 1;
  s.lastDay = t;
  saveStore({ streak: s.streak, lastDay: t });
  return { streak: s.streak, checked: false };
}

/* ---------- 纯函数 ---------- */
function shuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function normWord(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z-]/g, ''); }
function wordCount(text) {
  var m = String(text || '').trim().match(/[A-Za-z0-9'’-]+/g);
  return m ? m.length : 0;
}
function catName(id) {
  var c = D.WORD_CATS.find(function (x) { return x.id === id; });
  if (c) return c.name;
  var l = (V.LEVELS || []).find(function (x) { return x.id === id; });
  return l ? l.name : id;
}
// 分级词库条目是紧凑数组 [w,ph,pos,cn,ex?,exCn?]，映射成与雅思词相同的对象
function levelList(level) {
  return (V.WORDS[level] || []).map(function (e) {
    return { w: e[0], ph: e[1], pos: e[2], cn: e[3], ex: e[4] || '', exCn: e[5] || '', cat: level };
  });
}
// 阅读批改：answers 为 {题号index: 'T'|'A'}，返回 {score, per:[bool]}
function gradeReading(questions, answers) {
  var per = questions.map(function (q, i) { return answers[i] === q.a; });
  return { score: per.filter(Boolean).length, per: per };
}
// 听力判分
function listenCorrect(input, answer) { return normWord(input) === normWord(answer); }

module.exports = {
  D: D,
  V: V,
  KEY: KEY,
  getStore: getStore,
  saveStore: saveStore,
  dayStr: dayStr,
  dayNum: dayNum,
  checkIn: checkIn,
  shuffle: shuffle,
  normWord: normWord,
  wordCount: wordCount,
  catName: catName,
  levelList: levelList,
  gradeReading: gradeReading,
  listenCorrect: listenCorrect
};
