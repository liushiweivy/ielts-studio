/*
 * 选词建表 · 纯逻辑核心（UMD）
 * 依赖分级词库 IELTS_VOCAB（js/vocab-levels.js）：
 *   buildIndex      跨 4 档难度的 单词→紧凑词条 索引（build 已跨级去重，首个命中为准）
 *   matchWords      指定难度内按英文/中文关键词过滤，返回单词列表
 *   defaultSetName  新建词表默认名（我的词表 1/2/3…，自动避让已用名）
 *   resolveWords    自定义词表只存单词字符串，用时经索引还原为紧凑词条（缺词自动跳过）
 * 浏览器挂 window.IELTS_PICK_CORE；Node 走 module.exports 供 tools/pick.test.js。
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.IELTS_PICK_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PICK_CHUNK = 400;   // 每档首屏渲染数，「加载更多」追加
  var GRID_COLS = 10;    // 选词列表一行 10 个

  function buildIndex(V) {
    var m = {};
    (V.LEVELS || []).forEach(function (l) {
      (V.WORDS[l.id] || []).forEach(function (e) {
        if (e && e[0] && !(e[0] in m)) m[e[0]] = e;
      });
    });
    return m;
  }

  /** 任意单词字符串列表内按英文/中文过滤（中文释义经跨级索引还原）。 */
  function matchWordList(index, words, kw) {
    words = words || [];
    kw = (kw || '').trim();
    if (!kw) return words.slice();
    var k = kw.toLowerCase();
    var out = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i], e = index[w], cn = e ? (e[3] || '') : '';
      if (w.toLowerCase().indexOf(k) >= 0 || cn.indexOf(kw) >= 0) out.push(w);
    }
    return out;
  }

  /** level 内按英文前缀/包含或中文释义包含过滤；kw 为空返回全量单词。 */
  function matchWords(V, level, kw) {
    var arr = ((V.WORDS && V.WORDS[level]) || []).map(function (e) { return e[0]; });
    return matchWordList(buildIndex(V), arr, kw);
  }

  /** 选词来源的全部单词：难度档取词库，'set:<id>' 取自定义词表（支持从旧表造新表）。 */
  function sourceWords(V, sets, src) {
    if (src && src.indexOf('set:') === 0) {
      var s = (sets || []).find(function (x) { return x.id === src.slice(4); });
      return s ? s.words.slice() : [];
    }
    return ((V.WORDS && V.WORDS[src]) || []).map(function (e) { return e[0]; });
  }

  function defaultSetName(sets) {
    var taken = {};
    (sets || []).forEach(function (s) { taken[s.name] = true; });
    var n = 1;
    while (taken['我的词表' + n]) n++;
    return '我的词表' + n;
  }

  /** 自定义词表的单词数组 → 紧凑词条数组（跨级索引还原，保持选择顺序）。 */
  function resolveWords(index, words) {
    var out = [];
    (words || []).forEach(function (w) {
      if (index[w]) out.push(index[w]);
    });
    return out;
  }

  /** 选择集去重合并（旧集在前、新词在后）。 */
  function mergeWords(oldWords, newWords) {
    var seen = {};
    var out = [];
    oldWords.concat(newWords || []).forEach(function (w) {
      if (w && !seen[w]) { seen[w] = true; out.push(w); }
    });
    return out;
  }

  return {
    PICK_CHUNK: PICK_CHUNK,
    GRID_COLS: GRID_COLS,
    buildIndex: buildIndex,
    matchWords: matchWords,
    matchWordList: matchWordList,
    sourceWords: sourceWords,
    defaultSetName: defaultSetName,
    resolveWords: resolveWords,
    mergeWords: mergeWords
  };
});
