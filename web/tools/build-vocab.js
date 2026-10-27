/*
 * 词库生成脚本：把 KyleBing/english-vocabulary 的 jsonl 源文件转成项目用紧凑词库
 * 用法：node tools/build-vocab.js
 * 输入：tools/vocab-src/{人教小学三~六年级,四级,六级,雅思}.jsonl（先按 README 下载）
 * 输出：js/vocab-levels.js（UMD，浏览器挂 window.IELTS_VOCAB，小程序 require）
 *       js/listening-bank.js（UMD，window.IELTS_LISTEN_BANK，雅思例句听写库）
 *       生成后需手动拷贝 vocab-levels.js 到 ielts-learning-mp/utils/
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'vocab-src');
const OUT = path.join(__dirname, '..', 'js', 'vocab-levels.js');

// 等级定义：优先级从低到高，跨等级去重时保留在最低等级
const LEVELS = [
  { id: 'primary', name: '小学', en: 'Primary', note: '人教版 3–6 年级', files: ['人教小学三年级.jsonl', '人教小学四年级.jsonl', '人教小学五年级.jsonl', '人教小学六年级.jsonl'] },
  { id: 'cet4', name: '四级', en: 'CET-4', note: '大学英语四级', files: ['四级.jsonl'] },
  { id: 'cet6', name: '六级', en: 'CET-6', note: '大学英语六级', files: ['六级.jsonl'] },
  { id: 'ieltsfull', name: '雅思词库', en: 'IELTS', note: '雅思全量词表（剔除小/四/六级已收录词）', files: ['雅思.jsonl'] }
];

const WORD_RE = /^[a-z][a-z' -]*[a-z]$/i;
const EX_MAX_LEN = 70;   // 例句超过此长度则不收录（控制体积）
const EXCN_MAX_LEN = 45;

function phoneticOf(c) {
  const ph = c.ukphone || c.usphone || '';
  const clean = String(ph).replace(/^'+|'+$/g, '').trim();
  return clean ? '/' + clean + '/' : '';
}

function cnOf(trans) {
  const parts = [];
  for (const t of (trans || [])) {
    if (!t.tranCn) continue;
    const cn = String(t.tranCn).replace(/\s+/g, ' ').trim();
    if (cn && !parts.includes(cn)) parts.push(cn);
    if (parts.length >= 2) break;
  }
  return parts.join('；');
}

function exampleOf(c) {
  const sents = (c.sentence && c.sentence.sentences) || [];
  for (const s of sents) {
    const en = String(s.sContent || '').replace(/<[^>]+>/g, '').trim();
    const cn = String(s.sCn || '').trim();
    if (en && cn && en.length <= EX_MAX_LEN && cn.length <= EXCN_MAX_LEN && en.length > 8) {
      return [en, cn];
    }
  }
  return null;
}

function parseFile(file) {
  const text = fs.readFileSync(path.join(SRC, file), 'utf8');
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch (e) { continue; }
    const c = d.content && d.content.word && d.content.word.content;
    if (!c) continue;
    rows.push({ head: d.headWord, c: c, rank: d.wordRank || 99999 });
  }
  return rows;
}

const seen = new Set();
const result = {};
let skipped = 0, noCn = 0, dup = 0;

for (const lv of LEVELS) {
  const words = [];
  for (const f of lv.files) {
    for (const { head, c } of parseFile(f)) {
      const w = String(head || '').trim();
      if (!w || w.length < 2 || w.length > 24 || !WORD_RE.test(w)) { skipped++; continue; }
      const key = w.toLowerCase();
      if (seen.has(key)) { dup++; continue; }
      const cn = cnOf(c.trans);
      if (!cn) { noCn++; continue; }
      seen.add(key);
      let pos = (c.trans && c.trans[0] && c.trans[0].pos) || '';
      if (pos && /^[a-z]+$/.test(pos)) pos += '.';
      const entry = [w, phoneticOf(c), pos, cn];
      const ex = exampleOf(c);
      if (ex) entry.push(ex[0], ex[1]);
      words.push(entry);
    }
  }
  // 字母序，便于浏览；测验时另行洗牌
  words.sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));
  result[lv.id] = words;
}

let js = `/*
 * 分级词库（小学 / 四级 / 六级 / 雅思）——由 tools/build-vocab.js 生成，勿手改
 * 源数据：KyleBing/english-vocabulary（人教小学 3-6 年级、CET-4、CET-6、雅思，含音标/释义/例句）
 * 词条格式：[单词, 音标, 词性, 中文释义] 或 [单词, 音标, 词性, 中文释义, 英文例句, 例句中译]
 * UMD：浏览器 <script> 挂 window.IELTS_VOCAB；Node/小程序走 module.exports
 * 同步规则：本文件与 js/data.js 同为 canonical，改动后拷贝到小程序 utils/vocab-levels.js
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.IELTS_VOCAB = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var LEVELS = ${JSON.stringify(LEVELS.map(({ id, name, en, note }) => ({ id, name, en, note })))};
`;

const stats = [];
for (const lv of LEVELS) {
  const arr = result[lv.id];
  stats.push(`${lv.id}=${arr.length}`);
  js += `  var ${lv.id.toUpperCase()} = [\n`;
  js += arr.map(e => '    ' + JSON.stringify(e)).join(',\n');
  js += `\n  ];\n`;
}
js += `  return { LEVELS: LEVELS, WORDS: { primary: PRIMARY, cet4: CET4, cet6: CET6, ieltsfull: IELTSFULL } };\n});\n`;

fs.writeFileSync(OUT, js, 'utf8');
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`生成 ${OUT}`);
console.log(`词条：${stats.join('  ')}（去重 ${dup}，无释义 ${noCn}，非法 ${skipped}）`);
console.log(`体积：${kb} KB`);

/* ---------- 雅思例句听写库：从雅思 jsonl 例句挖空词头生成 ---------- */
// 注意：源文件按字母序排列，wordRank 只是字母序号，不能当难度用——
// 难度按句长+词长划分，候选先全量收集再等距抽样，避免答案扎堆 a 开头。
const LISTEN_OUT = path.join(__dirname, '..', 'js', 'listening-bank.js');
const LISTEN_CAP = { 1: 60, 2: 60, 3: 60 }; // 每级条数上限

function listenLevel(word, enLen) {
  if (enLen <= 55 && word.length <= 7) return 1;
  if (enLen <= 80) return 2;
  if (enLen <= 110) return 3;
  return 0;
}

function buildListenBank() {
  const cand = { 1: [], 2: [], 3: [] };
  const usedSentence = new Set();
  for (const { head, c } of parseFile('雅思.jsonl')) {
    const w = String(head || '').trim();
    if (!w || w.length < 4 || !WORD_RE.test(w) || w.includes(' ') || w.includes("'")) continue;
    const sents = (c.sentence && c.sentence.sentences) || [];
    for (const s of sents) {
      const en = String(s.sContent || '').replace(/<[^>]+>/g, '').trim();
      const cn = String(s.sCn || '').trim();
      if (!en || !cn || cn.length < 8 || usedSentence.has(en)) continue;
      if (!/^[A-Z]/.test(en) || /[=()[\]]/.test(en)) continue; // 滤掉短语碎片、词典注释与残留标记
      if (en.split(/\s+/).length < 5) continue; // 太短的句子没有听写价值
      // 整词定位词头（句首大写也算）；词形变化（abandon→abandoned）不硬猜，直接跳过
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (!re.test(en)) continue;
      const lv = listenLevel(w, en.length);
      if (!lv) continue;
      usedSentence.add(en);
      cand[lv].push([lv, en, w, cn]);
      break; // 一个词只贡献一句
    }
  }
  // 等距抽样：把候选均匀铺满，抽 cap 条，保证字母分布散开
  const all = [];
  for (const lv of [1, 2, 3]) {
    const pool = cand[lv], cap = LISTEN_CAP[lv];
    if (pool.length <= cap) { all.push(...pool); continue; }
    const step = pool.length / cap;
    for (let i = 0; i < cap; i++) all.push(pool[Math.floor(i * step)]);
  }
  let out = `/*
 * 雅思例句听写库——由 tools/build-vocab.js 生成，勿手改
 * 源数据：KyleBing/english-vocabulary 雅思.jsonl 例句，挖空词头
 * 条目格式：[难度 1-3, 完整句子, 挖空答案词, 中文]
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.IELTS_LISTEN_BANK = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return [
`;
  out += all.map(e => '    ' + JSON.stringify(e)).join(',\n');
  out += `\n  ];\n});\n`;
  fs.writeFileSync(LISTEN_OUT, out, 'utf8');
  console.log(`生成 ${LISTEN_OUT}：1级=${all.filter(x => x[0] === 1).length} 2级=${all.filter(x => x[0] === 2).length} 3级=${all.filter(x => x[0] === 3).length}（候选 ${cand[1].length}/${cand[2].length}/${cand[3].length}）`);
}

buildListenBank();
