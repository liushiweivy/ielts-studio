/* node --test tools/pick.test.js
 * 选词建表纯逻辑：跨级索引 / 关键词匹配 / 默认命名 / 词条还原 / 合并去重。 */
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const P = require(path.join(__dirname, '..', 'js', 'pick-core.js'));

// 紧凑词条 [w, ph, pos, cn, ex?, exCn?]；b 档故意放重复词 apple 验证跨级去重
var V = {
  LEVELS: [{ id: 'a', name: 'A档' }, { id: 'b', name: 'B档' }],
  WORDS: {
    a: [
      ['apple', '/ˈæpl/', 'n.', '苹果'],
      ['apply', '/əˈplaɪ/', 'v.', '申请；应用']
    ],
    b: [
      ['banana', '/bəˈnɑːnə/', 'n.', '香蕉'],
      ['apple', '/DUP/', 'n.', '重复词条，应被跨级索引忽略']
    ]
  }
};

test('常量：每行 10 词、首屏 400', function () {
  assert.strictEqual(P.GRID_COLS, 10);
  assert.strictEqual(P.PICK_CHUNK, 400);
});

test('buildIndex 跨 4 档建索引，重复词以首次出现为准', function () {
  var idx = P.buildIndex(V);
  assert.deepStrictEqual(Object.keys(idx).sort(), ['apple', 'apply', 'banana']);
  assert.strictEqual(idx.apple[1], '/ˈæpl/'); // 不是 b 档的 /DUP/
});

test('matchWords 空关键词返回该档全部单词字符串', function () {
  assert.deepStrictEqual(P.matchWords(V, 'a', ''), ['apple', 'apply']);
  assert.deepStrictEqual(P.matchWords(V, 'a', '   '), ['apple', 'apply']);
  assert.deepStrictEqual(P.matchWords(V, 'x', ''), []); // 不存在的档
});

test('matchWords 支持英文包含（不区分大小写）与中文释义包含', function () {
  assert.deepStrictEqual(P.matchWords(V, 'a', 'app'), ['apple', 'apply']);
  assert.deepStrictEqual(P.matchWords(V, 'a', 'APP'), ['apple', 'apply']);
  assert.deepStrictEqual(P.matchWords(V, 'a', '苹果'), ['apple']);
  assert.deepStrictEqual(P.matchWords(V, 'a', '申请'), ['apply']);
  assert.deepStrictEqual(P.matchWords(V, 'a', 'zzz'), []);
});

test('defaultSetName 自动避让已用名称', function () {
  assert.strictEqual(P.defaultSetName([]), '我的词表1');
  assert.strictEqual(P.defaultSetName([{ name: '我的词表1' }]), '我的词表2');
  assert.strictEqual(
    P.defaultSetName([{ name: '我的词表1' }, { name: '我的词表2' }, { name: '自定义' }]),
    '我的词表3'
  );
});

test('resolveWords 按选择顺序还原词条，缺失词自动跳过', function () {
  var idx = P.buildIndex(V);
  var out = P.resolveWords(idx, ['banana', 'apple', 'ghost', 'apply']);
  assert.deepStrictEqual(out.map(function (e) { return e[0]; }), ['banana', 'apple', 'apply']);
  assert.strictEqual(out[1][3], '苹果');
  assert.deepStrictEqual(P.resolveWords(idx, []), []);
  assert.deepStrictEqual(P.resolveWords(idx, ['ghost']), []);
});

test('matchWordList 对任意单词列表按英文/中文（经索引）过滤', function () {
  var idx = P.buildIndex(V);
  assert.deepStrictEqual(P.matchWordList(idx, ['apple', 'banana', 'ghost'], ''), ['apple', 'banana', 'ghost']);
  assert.deepStrictEqual(P.matchWordList(idx, ['apple', 'banana'], 'an'), ['banana']); // 英文包含
  assert.deepStrictEqual(P.matchWordList(idx, ['apple', 'banana'], '香'), ['banana']); // 索引中文
  assert.deepStrictEqual(P.matchWordList(idx, ['ghost'], 'ghost'), ['ghost']); // 无索引词只能匹配英文
  assert.deepStrictEqual(P.matchWordList(idx, ['ghost'], '鬼'), []);
});

test('sourceWords 难度档取词库，set: 取自建词表（新表再造新表）', function () {
  var sets = [{ id: 's1', name: '我的词表1', words: ['banana', 'apple'] }];
  assert.deepStrictEqual(P.sourceWords(V, sets, 'a'), ['apple', 'apply']);
  assert.deepStrictEqual(P.sourceWords(V, sets, 'set:s1'), ['banana', 'apple']);
  assert.deepStrictEqual(P.sourceWords(V, sets, 'set:missing'), []);
  assert.deepStrictEqual(P.sourceWords(V, sets, 'nope'), []);
});

test('mergeWords 旧集在前、新词在后，整体去重', function () {
  assert.deepStrictEqual(
    P.mergeWords(['apple', 'apply'], ['apply', 'banana', 'apple']),
    ['apple', 'apply', 'banana']
  );
  assert.deepStrictEqual(P.mergeWords([], ['a', 'a', 'b']), ['a', 'b']);
  assert.deepStrictEqual(P.mergeWords(['x'], null), ['x']);
});
