/* 题库校验：node --test tools/data.test.js */
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const D = require(path.join(__dirname, '..', 'js', 'data.js'));

test('data.js 基础题库可加载', () => {
  assert.ok(Array.isArray(D.WORDS) && D.WORDS.length > 0);
  assert.ok(Array.isArray(D.LISTENING) && D.LISTENING.length > 0);
});

test('日常口语题库：场景结构完整', () => {
  const groups = D.DAILY_PHRASES;
  assert.ok(Array.isArray(groups), 'DAILY_PHRASES 必须是数组');
  assert.ok(groups.length >= 10, '至少 10 个生活场景');
  const ids = new Set();
  for (const g of groups) {
    assert.ok(g.id && typeof g.id === 'string', '场景缺 id');
    assert.ok(!ids.has(g.id), '场景 id 重复: ' + g.id);
    ids.add(g.id);
    assert.ok(g.name && /[一-鿿]/.test(g.name), '场景要有中文名: ' + g.id);
    assert.ok(Array.isArray(g.items) && g.items.length >= 10, g.id + ' 至少 10 句');
  }
});

test('日常口语题库：每句中英对照、格式正确', () => {
  const seen = new Set();
  for (const g of D.DAILY_PHRASES) {
    for (const item of g.items) {
      assert.ok(Array.isArray(item) && item.length === 2, g.id + ' 条目必须是 [英文, 中文]');
      const [en, cn] = item;
      assert.ok(typeof en === 'string' && en.trim().length > 3, '英文句为空或过短');
      assert.ok(typeof cn === 'string' && cn.trim().length > 1, '中文翻译为空');
      assert.strictEqual(en, en.trim(), '英文句首尾有空白: ' + en);
      assert.strictEqual(cn, cn.trim(), '中文句首尾有空白: ' + cn);
      assert.ok(en.length <= 120, '英文句过长不利朗读（>120）: ' + en);
      assert.ok(/[A-Za-z]/.test(en), '英文句无字母: ' + en);
      assert.ok(/[.!?…]$/.test(en), '英文句应以标点结尾: ' + en);
      assert.ok(/[一-鿿]/.test(cn), '中文翻译缺汉字: ' + cn);
      const key = en.toLowerCase();
      assert.ok(!seen.has(key), '英文句重复: ' + en);
      seen.add(key);
    }
  }
  assert.ok(seen.size >= 200, '口语题库总量应不少于 200 句，实际 ' + seen.size);
});
