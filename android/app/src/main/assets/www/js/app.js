/* 雅思书房 · 前端逻辑（零依赖，原生 JS） */
(function () {
  'use strict';
  var D = window.IELTS_DATA;

  /* ---------------- 本地进度 ---------------- */
  var KEY = 'ielts-studio-v1';
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveStore(patch) {
    try {
      var s = loadStore();
      Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {
      toast('本地存储不可用，进度未能保存');
    }
  }
  // 本地时区日期（与小程序端一致），避免 UTC 在凌晨 0-8 点算成前一天
  function today() {
    var d = new Date();
    function p2(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  function dayNum(d) { return Math.floor(new Date(d + 'T00:00:00').getTime() / 864e5); }
  // 打卡 + streak
  function checkIn() {
    var s = loadStore(), t = today();
    if (s.lastDay === t) return s.streak || 1;
    s.streak = s.lastDay && dayNum(t) - dayNum(s.lastDay) === 1 ? (s.streak || 0) + 1 : 1;
    s.lastDay = t;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s.streak;
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- 英语朗读 TTS ---------------- */
  var voices = [];
  function refreshVoices() { voices = speechSynthesis.getVoices(); }
  if ('speechSynthesis' in window) {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
  }
  function speak(text, rate) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    speechSynthesis.cancel();
    speechSynthesis.speak(makeUtter(text, 'en', rate));
  }
  // tts-online.js 看门狗：系统语音静默失效转在线朗读时提示一次（需联网）
  if (window.addEventListener) {
    window.addEventListener('ieltsTtsOnline', function () {
      toast('系统语音不可用，已自动改用在线朗读（需联网）');
    });
  }
  // 生成一条 utterance（随身听模式要自己串联 onend，不走 cancel 版 speak）
  function makeUtter(text, lang, rate) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'zh' ? 'zh-CN' : 'en-GB';
    u.rate = rate || 1;
    var v = voices.filter(function (x) {
        return lang === 'zh' ? /^zh/i.test(x.lang) : /en[-_]GB/i.test(x.lang);
      })[0] ||
      voices.filter(function (x) { return lang === 'zh' ? /zh|cmn/i.test(x.lang) : /^en/i.test(x.lang); })[0];
    if (v) u.voice = v;
    return u;
  }

  /* ---------------- 路由 ---------------- */
  function go(name) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('on'); });
    document.getElementById('page-' + name).classList.add('on');
    document.querySelectorAll('#nav button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.go === name);
    });
    window.scrollTo(0, 0);
    history.replaceState(null, '', '#' + name);
    checkIn();
    if (name === 'dashboard') renderDashboard();
    if (name === 'daily') enterDaily();
    if (name !== 'daily') stopDaily(); // 离开听读页即停止连读
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (t) go(t.dataset.go);
  });

  /* ---------------- 今日 ---------------- */
  function masteredCount() { var s = loadStore(); return Object.keys(s.known || {}).length; }
  function listenDone() { var s = loadStore(); return (s.listenOk || []).length; }
  function readDone() { var s = loadStore(); return (s.readDone || []).length; }
  function ring(el, pct) { el.style.setProperty('--p', pct + '%'); }

  function renderDashboard() {
    var s = loadStore();
    document.getElementById('streak-num').textContent = s.streak || 0;
    var mk = masteredCount();
    document.getElementById('words-known-num').textContent = mk;
    document.getElementById('words-ring-text').textContent = mk + '/' + D.WORDS.length;
    ring(document.getElementById('words-ring'), Math.round(mk / D.WORDS.length * 100));
    var ld = listenDone();
    var listenTotal = allListening().length;
    document.getElementById('listen-done-num').textContent = ld;
    document.getElementById('listen-ring-text').textContent = ld + '/' + listenTotal;
    ring(document.getElementById('listen-ring'), Math.round(ld / listenTotal * 100));
    var rd = readDone();
    document.getElementById('read-done-num').textContent = rd;
    document.getElementById('read-ring-text').textContent = rd + '/' + D.READING.length;
    ring(document.getElementById('read-ring'), Math.round(rd / D.READING.length * 100));
    var dnum = document.getElementById('daily-done-num');
    if (dnum) dnum.textContent = dailyDoneCount();
    var dtot = document.getElementById('daily-done-total');
    if (dtot) dtot.textContent = dailyGroups().length;
    document.getElementById('daily-tip').textContent = D.TIPS[dayNum(today()) % D.TIPS.length];
    var w = D.WORDS[dayNum(today()) % D.WORDS.length];
    document.getElementById('dw-w').textContent = w.w;
    document.getElementById('dw-ph').textContent = w.ph;
    document.getElementById('dw-cn').textContent = w.pos + ' ' + w.cn;
    document.getElementById('daily-word').onclick = function () {
      go('words'); startCard(w.cat, w.w);
    };
  }
  document.getElementById('streak-check').onclick = function () {
    var n = checkIn();
    toast('已打卡，连续学习 ' + n + ' 天 🔥');
    renderDashboard();
  };

  /* ---------------- 词汇闪卡（雅思核心 + 分级词库） ---------------- */
  var VOCAB = window.IELTS_VOCAB || { LEVELS: [], WORDS: {} };
  // 雅思例句听写库（生成产物 js/listening-bank.js）：紧凑数组转对象，并入手写句
  var LISTEN_BANK = (window.IELTS_LISTEN_BANK || []).map(function (e) {
    return { level: e[0], sentence: e[1], answer: e[2], cn: e[3] };
  });
  function allListening() { return D.LISTENING.concat(LISTEN_BANK); }
  var cardState = { level: 'ielts', cat: 'all', idx: 0, list: D.WORDS.slice(), flipped: false };
  var PICK = window.IELTS_PICK_CORE;
  // 跨 4 档难度的单词索引（自定义词表只存单词字符串，用时经它还原词条）
  var VOCAB_INDEX = PICK ? PICK.buildIndex(VOCAB) : {};
  // 分级词库条目是紧凑数组 [w,ph,pos,cn,ex?,exCn?]，统一映射成与雅思词相同的对象
  function entryToWord(e, cat) {
    return { w: e[0], ph: e[1], pos: e[2], cn: e[3], ex: e[4] || '', exCn: e[5] || '', cat: cat };
  }
  function levelList(level) {
    if (level.indexOf('set:') === 0) {
      var s = findSet(level.slice(4));
      var entries = s ? PICK.resolveWords(VOCAB_INDEX, s.words) : [];
      return entries.map(function (e) { return entryToWord(e, level); });
    }
    return (VOCAB.WORDS[level] || []).map(function (e) { return entryToWord(e, level); });
  }
  function levelName(id) {
    if (id === 'ielts') return '雅思核心';
    if (id.indexOf('set:') === 0) {
      var s = findSet(id.slice(4));
      return s ? s.name : '我的词表';
    }
    var l = VOCAB.LEVELS.find(function (x) { return x.id === id; });
    return l ? l.name : id;
  }
  /* ---------- 自定义词表（选词建表） ---------- */
  function getSets() { return loadStore().sets || []; }
  function findSet(id) { return getSets().find(function (s) { return s.id === id; }) || null; }
  function saveSets(sets) { saveStore({ sets: sets }); }
  function pickDraft() { return loadStore().pickDraft || []; }
  function savePickDraft(words) { saveStore({ pickDraft: words }); }
  function deleteSet(id) {
    var sets = getSets().filter(function (s) { return s.id !== id; });
    saveSets(sets);
    if (cardState.level === 'set:' + id) {
      cardState.level = 'ielts'; cardState.cat = 'all';
      renderLevelChips(); renderWordChips(); enterMode(currentMode);
    } else {
      renderLevelChips();
    }
  }
  function renderLevelChips() {
    var html = '<button class="chip ' + (cardState.level === 'ielts' ? 'on' : '') + '" data-level="ielts">雅思核心 ' + D.WORDS.length + '</button>';
    VOCAB.LEVELS.forEach(function (l) {
      html += '<button class="chip ' + (cardState.level === l.id ? 'on' : '') + '" data-level="' + l.id + '">' +
        l.name + ' ' + (VOCAB.WORDS[l.id] || []).length + '</button>';
    });
    getSets().forEach(function (s) {
      html += '<button class="chip chip-set ' + (cardState.level === 'set:' + s.id ? 'on' : '') + '" data-level="set:' + s.id + '" title="' + s.words.length + ' 个单词">' +
        '🧺 ' + esc(s.name) + ' ' + s.words.length +
        '<span class="chip-del" data-del="' + s.id + '" title="删除该词表">×</span></button>';
    });
    document.getElementById('level-chips').innerHTML = html;
  }
  document.getElementById('level-chips').addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      var s0 = findSet(del.dataset.del);
      if (s0 && confirm('删除词表「' + s0.name + '」？（词库单词不会被删）')) deleteSet(del.dataset.del);
      return;
    }
    var b = e.target.closest('.chip'); if (!b) return;
    if (b.dataset.level !== cardState.level) { cardState.level = b.dataset.level; cardState.cat = 'all'; }
    enterMode(currentMode); // 切等级后停留在当前模式（闪卡/列表/随身听各自刷新）
  });
  function wordChips(onCat) {
    if (cardState.level !== 'ielts') return ''; // 分级词库不按话题分类
    var html = '<button class="chip ' + (onCat === 'all' ? 'on' : '') + '" data-cat="all">全部 ' + D.WORDS.length + '</button>';
    D.WORD_CATS.forEach(function (c) {
      html += '<button class="chip ' + (onCat === c.id ? 'on' : '') + '" data-cat="' + c.id + '">' + c.name + '</button>';
    });
    return html;
  }
  function renderWordChips() {
    document.getElementById('word-chips').innerHTML = wordChips(cardState.cat);
  }
  document.getElementById('word-chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    cardState.cat = b.dataset.cat;
    enterMode(currentMode);
  });

  function startCard(cat, jumpWord) {
    setMode('card'); // 从话题 chip / 每日一词进入时退出测验模式
    cardState.cat = cat;
    if (cardState.level === 'ielts') {
      cardState.list = cat === 'all' ? D.WORDS.slice() : D.WORDS.filter(function (w) { return w.cat === cat; });
    } else if (cardState.level.indexOf('set:') === 0) {
      cardState.list = levelList(cardState.level); // 自定义词表保持选词顺序
    } else {
      cardState.list = shuffle(levelList(cardState.level)); // 大词库乱序进入，避免永远从 a 开始
    }
    cardState.idx = 0;
    if (jumpWord) {
      var i = cardState.list.findIndex(function (w) { return w.w === jumpWord; });
      if (i >= 0) cardState.idx = i;
    }
    cardState.flipped = false;
    renderLevelChips();
    renderWordChips();
    renderCard();
  }
  function renderCard() {
    var w = cardState.list[cardState.idx], total = cardState.list.length;
    var s = loadStore(), isKnown = (s.known || {})[w.w];
    var stage = document.getElementById('word-card-stage');
    stage.innerHTML =
      '<div class="study-bar"><span class="study-count">' + (cardState.idx + 1) + ' / ' + total + '</span>' +
      '<div class="progress-line"><i style="width:' + ((cardState.idx + 1) / total * 100) + '%"></i></div>' +
      '<span class="tag ' + (isKnown ? 'tag-green' : '') + '">' + (isKnown ? '已掌握' : '未掌握') + '</span></div>' +
      '<div class="flashcard" id="flashcard">' +
        '<div class="flash-inner">' +
          '<div class="flash-face flash-front">' +
            '<div class="flash-top"><span class="tag">' + catName(w.cat) + '</span><button class="speak-btn" data-speak="' + esc(w.w) + '" title="朗读">🔊</button></div>' +
            '<div class="flash-word">' + w.w + '</div>' +
            '<div class="flash-ph">' + w.ph + ' <span class="flash-pos">' + w.pos + '</span></div>' +
            '<div class="flash-hint">点击卡片翻面看释义</div>' +
          '</div>' +
          '<div class="flash-face flash-back">' +
            '<div class="flash-top"><span class="tag tag-red">' + catName(w.cat) + '</span>' +
            (w.ex ? '<button class="speak-btn" data-speak="' + esc(w.ex) + '" title="朗读例句">🔊</button>' : '') + '</div>' +
            '<div class="flash-cn">' + w.cn + '</div>' +
            (w.ex ? '<div class="flash-ex">' + esc(w.ex) + '</div><div class="flash-excn">' + esc(w.exCn) + '</div>' : '') +
            '<div class="flash-hint" style="margin-top:auto">再点一次翻回正面</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button class="btn btn-ghost" id="btn-unknown">😕 还不认识</button>' +
        '<button class="btn btn-primary" id="btn-known">✓ 认识</button>' +
      '</div>';
    var fc = document.getElementById('flashcard');
    fc.onclick = function (e) {
      if (e.target.closest('.speak-btn')) return;
      cardState.flipped = !cardState.flipped;
      fc.classList.toggle('flipped', cardState.flipped);
    };
    document.getElementById('btn-known').onclick = function () {
      var st = loadStore(); st.known = st.known || {}; st.known[w.w] = true; saveStore({ known: st.known });
      nextCard();
    };
    document.getElementById('btn-unknown').onclick = function () {
      var st = loadStore(); st.known = st.known || {}; delete st.known[w.w]; saveStore({ known: st.known });
      nextCard();
    };
    stage.querySelectorAll('[data-speak]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); speak(b.dataset.speak); };
    });
  }
  function nextCard() {
    if (cardState.idx < cardState.list.length - 1) { cardState.idx++; cardState.flipped = false; renderCard(); }
    else {
      document.getElementById('word-card-stage').innerHTML =
        '<div class="panel panel-pad score-hero"><div class="big">🎉</div><p>本组卡片过完了！去拼写测验检验一下，或换个话题继续。</p>' +
        '<div style="margin-top:18px;display:flex;gap:10px;justify-content:center"><button class="btn btn-primary" id="to-quiz">开始拼写测验</button>' +
        '<button class="btn btn-ghost" id="replay">再过一遍</button></div></div>';
      document.getElementById('to-quiz').onclick = function () { setMode('quiz'); startQuiz(); };
      document.getElementById('replay').onclick = function () { startCard(cardState.cat); };
    }
  }
  function catName(id) {
    var c = D.WORD_CATS.find(function (x) { return x.id === id; });
    return c ? c.name : levelName(id); // 分级词库的 cat 即等级 id
  }

  /* ---------- 列表模式：全量展开 + 逐词朗读 ---------- */
  var listState = { kw: '', shown: 0, pool: [] };
  var LIST_CHUNK = 200;
  function currentWordPool() {
    if (cardState.level === 'ielts') {
      return cardState.cat === 'all' ? D.WORDS.slice() : D.WORDS.filter(function (w) { return w.cat === cardState.cat; });
    }
    return levelList(cardState.level); // 生成文件按字母序，列表模式不乱序
  }
  function startList() {
    renderLevelChips(); renderWordChips();
    listState.pool = currentWordPool();
    listState.kw = '';
    listState.shown = 0;
    var stage = document.getElementById('word-list-stage');
    stage.innerHTML =
      '<div class="listen-controls">' +
        '<input class="input" id="list-filter" placeholder="筛选：英文或中文关键词" autocomplete="off" style="max-width:280px">' +
        '<span class="muted small" id="list-count"></span>' +
      '</div>' +
      '<div id="list-rows"></div>' +
      '<div style="margin:14px 0;text-align:center"><button class="btn btn-ghost btn-sm" id="list-more" style="display:none">加载更多</button></div>';
    document.getElementById('list-filter').addEventListener('input', function (e) {
      listState.kw = e.target.value.trim().toLowerCase();
      listState.shown = 0;
      document.getElementById('list-rows').innerHTML = '';
      renderListRows();
    });
    document.getElementById('list-more').onclick = renderListRows;
    renderListRows();
  }
  function listFiltered() {
    var kw = listState.kw;
    if (!kw) return listState.pool;
    return listState.pool.filter(function (w) {
      return w.w.toLowerCase().indexOf(kw) >= 0 || String(w.cn || '').toLowerCase().indexOf(kw) >= 0;
    });
  }
  function renderListRows() {
    var rows = listFiltered();
    var box = document.getElementById('list-rows');
    var known = loadStore().known || {};
    var slice = rows.slice(listState.shown, listState.shown + LIST_CHUNK);
    var html = slice.map(function (w) {
      return '<div class="word-row">' +
        '<button class="speak-btn" data-speak="' + esc(w.w) + '" title="朗读单词">🔊</button>' +
        '<span class="wr-w">' + esc(w.w) + '</span>' +
        '<span class="wr-ph">' + esc(w.ph || '') + '</span>' +
        '<span class="wr-pos">' + esc(w.pos || '') + '</span>' +
        '<span class="wr-cn">' + esc(w.cn || '') + '</span>' +
        (known[w.w] ? '<span class="tag tag-green">已掌握</span>' : '') +
      '</div>' +
      (w.ex ? '<div class="word-row word-row-ex">' +
        '<button class="speak-btn" data-speak="' + esc(w.ex) + '" title="朗读例句">🔊</button>' +
        '<span class="wr-ex">' + esc(w.ex) + '</span>' +
        '<span class="wr-excn">' + esc(w.exCn || '') + '</span>' +
      '</div>' : '');
    }).join('');
    box.insertAdjacentHTML('beforeend', html);
    listState.shown += slice.length;
    document.getElementById('list-count').textContent = '共 ' + rows.length + ' 词 · 已展开 ' + Math.min(listState.shown, rows.length);
    var more = document.getElementById('list-more');
    more.style.display = listState.shown < rows.length ? '' : 'none';
    more.textContent = '加载更多（还剩 ' + (rows.length - listState.shown) + '）';
    box.querySelectorAll('[data-speak]').forEach(function (b) {
      b.onclick = function () { speak(b.dataset.speak); };
    });
  }

  /* ---------- 随身听：日常口语短句（默认，英文→中文翻译）+ 单词连续播报 ---------- */
  // opts 放在状态里：每播一句都会重渲染面板，选项不能只活在 DOM 里（否则每句被重置）
  var radio = { src: 'phrase', scene: 'all', list: [], idx: 0, playing: false, gen: 0, watchdog: null,
                opts: { cn: true, ex: true, times: 2, rate: 1 } };
  (function restoreRadioPrefs() {
    var r = loadStore().radio;
    if (r && typeof r === 'object') {
      if (r.src === 'word' || r.src === 'phrase') radio.src = r.src;
      if (typeof r.scene === 'string') radio.scene = r.scene;
    }
  })();
  function saveRadioPrefs() { saveStore({ radio: { src: radio.src, scene: radio.scene } }); }
  function phraseGroups() { return D.DAILY_PHRASES || []; }
  function phraseTotal() {
    return phraseGroups().reduce(function (n, g) { return n + g.items.length; }, 0);
  }
  function phrasePool() {
    var out = [];
    phraseGroups().forEach(function (g) {
      if (radio.scene === 'all' || radio.scene === g.id) {
        g.items.forEach(function (it) { out.push({ en: it[0], cn: it[1], scene: g.id }); });
      }
    });
    return out;
  }
  function phraseSceneName(id) {
    if (id === 'all') return '全部场景';
    var g = phraseGroups().find(function (x) { return x.id === id; });
    return g ? g.name : id;
  }
  function rebuildRadioList(doShuffle) {
    var list = radio.src === 'phrase' ? phrasePool() : currentWordPool();
    radio.list = doShuffle ? shuffle(list) : list;
  }
  function startRadio() {
    var phraseMode = radio.src === 'phrase';
    // 口语模式不按词汇等级/话题选词，藏掉词汇页那两排 chips（离开随身听时由 setMode 恢复）
    document.getElementById('level-chips').style.display = phraseMode ? 'none' : '';
    document.getElementById('word-chips').style.display = phraseMode ? 'none' : '';
    if (!phraseMode) { renderLevelChips(); renderWordChips(); }
    rebuildRadioList(false);
    radio.idx = 0;
    radio.playing = false;
    renderRadio();
  }
  function optSel(name, val) {
    return radio.opts[name] === val ? ' selected' : '';
  }
  function renderRadio() {
    var stage = document.getElementById('word-radio-stage');
    var phraseMode = radio.src === 'phrase';
    var item = radio.list[radio.idx] || null;
    var wordPoolTotal = currentWordPool().length;
    var html = '<div class="radio-src">' +
        '<button class="btn btn-sm ' + (phraseMode ? 'btn-dark' : 'btn-ghost') + '" data-rsrc="phrase">🗣 日常口语 ' + phraseTotal() + '</button>' +
        '<button class="btn btn-sm ' + (phraseMode ? 'btn-ghost' : 'btn-dark') + '" data-rsrc="word">📖 单词播报 ' + wordPoolTotal + '</button>' +
      '</div>';

    if (phraseMode) {
      html += '<div class="chips radio-scene">' +
        '<button class="chip ' + (radio.scene === 'all' ? 'on' : '') + '" data-rscene="all">全部 ' + phraseTotal() + '</button>' +
        phraseGroups().map(function (g) {
          return '<button class="chip ' + (radio.scene === g.id ? 'on' : '') + '" data-rscene="' + g.id + '">' +
            esc(g.name) + ' ' + g.items.length + '</button>';
        }).join('') +
      '</div>';
    }

    if (phraseMode) {
      html += '<div class="panel panel-pad radio-card">' +
        '<div class="quiz-hint">日常口语连播：先读英文（可重复多遍跟读），再给中文翻译，自动播下一句。边做事边磨耳朵，抬头就能看原文和翻译。</div>' +
        (item ? '<span class="tag tag-green">' + esc(phraseSceneName(item.scene)) + '</span>' +
          '<div class="radio-en">' + esc(item.en) + '</div>' +
          '<div class="radio-cn">' + esc(item.cn || '') + '</div>'
          : '<div class="quiz-hint">该场景暂无句子</div>') +
        radioControls() +
        '<div class="listen-controls">' +
          '<label class="small muted"><input type="checkbox" id="radio-cn" ' + (radio.opts.cn ? 'checked' : '') + '> 读中文翻译</label>' +
          '<label class="small muted">英文读 <select id="radio-times">' +
            '<option value="1"' + optSel('times', 1) + '>1 遍</option>' +
            '<option value="2"' + optSel('times', 2) + '>2 遍</option>' +
            '<option value="3"' + optSel('times', 3) + '>3 遍</option>' +
          '</select></label>' +
          radioRateAndPos() +
        '</div>' +
      '</div>';
    } else {
      var w = item;
      html += '<div class="panel panel-pad">' +
        '<div class="quiz-hint">连续播报「' + levelName(cardState.level) + '」的 ' + radio.list.length + ' 个单词：先读单词，再读中文释义和例句，自动循环。想听简单的，上面切「小学」或「四级」。</div>' +
        (w ? '<div class="radio-now">' +
          '<span class="wr-w">' + esc(w.w) + '</span>' +
          '<span class="wr-ph">' + esc(w.ph || '') + '</span>' +
          '<span class="wr-pos">' + esc(w.pos || '') + '</span>' +
          '<span class="wr-cn">' + esc(w.cn || '') + '</span></div>' +
          (w.ex ? '<div class="muted small" style="margin-top:6px">' + esc(w.ex) + '<br>' + esc(w.exCn || '') + '</div>' : '') : '') +
        radioControls() +
        '<div class="listen-controls">' +
          '<label class="small muted"><input type="checkbox" id="radio-cn" ' + (radio.opts.cn ? 'checked' : '') + '> 读中文释义</label>' +
          '<label class="small muted"><input type="checkbox" id="radio-ex" ' + (radio.opts.ex ? 'checked' : '') + '> 读例句</label>' +
          radioRateAndPos() +
        '</div>' +
      '</div>';
    }
    stage.innerHTML = html;

    stage.querySelectorAll('[data-rsrc]').forEach(function (b) {
      b.onclick = function () { switchRadioSrc(b.dataset.rsrc); };
    });
    stage.querySelectorAll('[data-rscene]').forEach(function (b) {
      b.onclick = function () { switchRadioScene(b.dataset.rscene); };
    });
    document.getElementById('radio-toggle').onclick = function () { radio.playing ? pauseRadio() : playRadio(); };
    document.getElementById('radio-prev').onclick = function () { stepRadio(-1); };
    document.getElementById('radio-next').onclick = function () { stepRadio(1); };
    document.getElementById('radio-shuffle').onclick = function () {
      rebuildRadioList(true); radio.idx = 0;
      if (radio.playing) { speechSynthesis.cancel(); playCurrent(); } else renderRadio();
    };
    bindRadioOpts();
  }
  function radioControls() {
    return '<div class="listen-controls">' +
      '<button class="btn btn-primary btn-sm" id="radio-toggle">' + (radio.playing ? '⏸ 暂停' : '▶ 开始') + '</button>' +
      '<button class="btn btn-ghost btn-sm" id="radio-prev">上一句</button>' +
      '<button class="btn btn-ghost btn-sm" id="radio-next">下一句</button>' +
      '<button class="btn btn-ghost btn-sm" id="radio-shuffle">🔀 乱序重排</button>' +
    '</div>';
  }
  function radioRateAndPos() {
    return '<label class="small muted">语速 <select id="radio-rate">' +
        '<option value="0.8"' + optSel('rate', 0.8) + '>慢</option>' +
        '<option value="1"' + optSel('rate', 1) + '>常速</option>' +
        '<option value="1.25"' + optSel('rate', 1.25) + '>快</option>' +
      '</select></label>' +
      '<span class="muted small">' + (radio.list.length ? (radio.idx + 1) + ' / ' + radio.list.length : '0 / 0') + '</span>';
  }
  function bindRadioOpts() {
    var cn = document.getElementById('radio-cn');
    var ex = document.getElementById('radio-ex');
    var times = document.getElementById('radio-times');
    var rate = document.getElementById('radio-rate');
    if (cn) cn.onchange = function () { radio.opts.cn = cn.checked; };
    if (ex) ex.onchange = function () { radio.opts.ex = ex.checked; };
    if (times) times.onchange = function () { radio.opts.times = parseInt(times.value, 10); };
    if (rate) rate.onchange = function () { radio.opts.rate = parseFloat(rate.value); };
  }
  function switchRadioSrc(src) {
    if (src === radio.src) return;
    pauseRadio();
    radio.src = src;
    if (src === 'phrase' && !radio.scene) radio.scene = 'all';
    saveRadioPrefs();
    startRadio();
  }
  function switchRadioScene(id) {
    if (id === radio.scene) return;
    radio.scene = id;
    saveRadioPrefs();
    rebuildRadioList(false);
    radio.idx = 0;
    if (radio.playing) { speechSynthesis.cancel(); playCurrent(); } else renderRadio();
  }
  function playRadio() {
    if (!radio.list.length) { toast(radio.src === 'phrase' ? '该场景没有句子' : '当前等级没有词条'); return; }
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    radio.playing = true;
    playCurrent();
  }
  function playCurrent() {
    if (!radio.playing) return;
    var item = radio.list[radio.idx];
    if (!item) { pauseRadio(); return; }
    radio.gen++;
    renderRadio();
    var seq;
    if (radio.src === 'phrase') {
      seq = [];
      for (var k = 0; k < radio.opts.times; k++) seq.push({ text: item.en, lang: 'en' });
      if (radio.opts.cn && item.cn) seq.push({ text: item.cn, lang: 'zh' });
    } else {
      seq = [{ text: item.w, lang: 'en' }];
      if (radio.opts.cn && item.cn) seq.push({ text: String(item.cn).replace(/[；;].*$/, ''), lang: 'zh' }); // 释义只读第一条，免得太长
      if (radio.opts.ex && item.ex) seq.push({ text: item.ex, lang: 'en' });
    }
    playSeq(seq, 0, radio.opts.rate, radio.gen);
  }
  function playSeq(seq, i, rate, gen) {
    if (!radio.playing || gen !== radio.gen) return;
    // 全部经 setTimeout 推下一轮事件循环：无语音环境下 onend 可能同步连发，
    // 直接递归会把整本词表在一个调用栈里播完（爆栈）
    if (i >= seq.length) { setTimeout(function () { stepRadio(1); }, 0); return; }
    var u = makeUtter(seq[i].text, seq[i].lang, rate);
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      clearTimeout(radio.watchdog);
      setTimeout(function () { playSeq(seq, i + 1, rate, gen); }, 0);
    };
    u.onend = finish;
    u.onerror = finish;
    // 部分浏览器 onend 偶发不触发，按文本长度兜底推进
    radio.watchdog = setTimeout(finish, Math.max(3000, seq[i].text.length * 300));
    speechSynthesis.speak(u);
  }
  function stepRadio(d) {
    if (!radio.list.length) return;
    radio.idx = (radio.idx + d + radio.list.length) % radio.list.length;
    if (radio.playing) { speechSynthesis.cancel(); playCurrent(); } else renderRadio();
  }
  function pauseRadio() {
    radio.playing = false;
    clearTimeout(radio.watchdog);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    renderRadio();
  }
  function stopRadio() {
    if (radio.playing) pauseRadio();
  }

  /* ---------- 日常听读：DAILY_PHRASES 场景对话，整篇连读 + 逐句复读 + 中文显隐 ---------- */
  var daily = {
    scene: '', idx: -1, playing: false, gen: 0, watchdog: 0,
    opts: { cnShow: true, cnRead: false, times: 1, rate: 1 }
  };
  (function initDaily() {
    var s = loadStore();
    var groups = D.DAILY_PHRASES || [];
    var ok = groups.some(function (g) { return g.id === s.dailyScene; });
    daily.scene = ok ? s.dailyScene : (groups[0] && groups[0].id);
    var o = s.dailyOpts;
    if (o && typeof o === 'object') {
      ['cnShow', 'cnRead'].forEach(function (k) {
        if (typeof o[k] === 'boolean') daily.opts[k] = o[k];
      });
      if ([1, 2, 3].indexOf(o.times) >= 0) daily.opts.times = o.times;
      if ([0.8, 1, 1.25].indexOf(o.rate) >= 0) daily.opts.rate = o.rate;
    }
  })();
  function dailyGroups() { return D.DAILY_PHRASES || []; }
  function dailyGroup() {
    var g = dailyGroups().filter(function (x) { return x.id === daily.scene; })[0];
    return g || dailyGroups()[0];
  }
  function dailyDoneMap() {
    var m = loadStore().dailyDone;
    return m && typeof m === 'object' ? m : {};
  }
  function dailyDoneCount() {
    var m = dailyDoneMap();
    return dailyGroups().filter(function (g) { return m[g.id]; }).length;
  }
  function saveDailyPrefs() {
    saveStore({ dailyScene: daily.scene, dailyOpts: daily.opts });
  }
  function enterDaily() {
    var g = dailyGroup();
    if (g) daily.scene = g.id;
    renderDaily();
  }
  function dailyOpt(name, val) {
    return daily.opts[name] === val ? ' selected' : '';
  }
  function renderDaily() {
    var stage = document.getElementById('daily-stage');
    if (!stage) return;
    var groups = dailyGroups(), g = dailyGroup(), done = dailyDoneMap();
    var items = g ? g.items : [];
    document.getElementById('daily-chips').innerHTML = groups.map(function (x) {
      return '<button class="chip' + (x.id === daily.scene ? ' on' : '') + '" data-dscene="' + x.id + '">' +
        esc(x.name) + (done[x.id] ? ' ✓' : '') + '</button>';
    }).join('');
    var html = '<div class="panel panel-pad daily-panel">' +
      '<div class="daily-head">' +
        '<div><span class="tag tag-red">' + esc(g.en) + '</span>' +
        '<h3 style="margin:8px 0 0;font-family:var(--font-serif)">' + esc(g.name) + '</h3></div>' +
        '<span class="tag ' + (done[g.id] ? 'tag-green' : '') + '">' +
          (done[g.id] ? '已听完 ✓' : items.length + ' 句') + '</span>' +
      '</div>' +
      '<div class="listen-controls">' +
        '<button class="btn btn-primary btn-sm" id="daily-play">' +
          (daily.playing ? '⏸ 停止' : '▶ 播放本组') + '</button>' +
        '<label class="small muted">语速 <select id="daily-rate">' +
          '<option value="0.8"' + dailyOpt('rate', 0.8) + '>慢 0.8x</option>' +
          '<option value="1"' + dailyOpt('rate', 1) + '>常速</option>' +
          '<option value="1.25"' + dailyOpt('rate', 1.25) + '>快 1.25x</option>' +
        '</select></label>' +
        '<label class="small muted">英文读 <select id="daily-times">' +
          '<option value="1"' + dailyOpt('times', 1) + '>1 遍</option>' +
          '<option value="2"' + dailyOpt('times', 2) + '>2 遍</option>' +
          '<option value="3"' + dailyOpt('times', 3) + '>3 遍</option>' +
        '</select></label>' +
        '<label class="small muted"><input type="checkbox" id="daily-cnshow"' +
          (daily.opts.cnShow ? ' checked' : '') + '> 显示中文</label>' +
        '<label class="small muted"><input type="checkbox" id="daily-cnread"' +
          (daily.opts.cnRead ? ' checked' : '') + '> 跟读中文</label>' +
        '<span class="tries" id="daily-progress">' +
          '已完成 ' + dailyDoneCount() + ' / ' + groups.length + ' 组</span>' +
      '</div>' +
      '<div class="dlg-rows" id="daily-rows">' + items.map(function (it, i) {
        var who = i % 2 ? 'B' : 'A';
        return '<div class="dlg-row ' + who.toLowerCase() + '" data-dline="' + i + '">' +
          '<span class="dlg-who who-' + who + '">' + who + '</span>' +
          '<div class="dlg-bubble">' +
            '<div class="dlg-en">' + esc(it[0]) + '</div>' +
            (daily.opts.cnShow ? '<div class="dlg-cn">' + esc(it[1]) + '</div>' : '') +
          '</div>' +
          '<span class="dlg-play" title="点句复读">🔊</span>' +
        '</div>';
      }).join('') + '</div>' +
      '<p class="muted small" style="margin:12px 2px 0">点任意一句可单独复读；想练听力先取消「显示中文」。完整播完本组自动打勾。</p>' +
    '</div>';
    stage.innerHTML = html;

    stage.querySelectorAll('[data-dscene]').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.dscene === daily.scene) return;
        stopDaily();
        daily.scene = b.dataset.dscene;
        daily.idx = -1;
        saveDailyPrefs();
        renderDaily();
      };
    });
    document.getElementById('daily-play').onclick = function () {
      if (daily.playing) { stopDaily(); renderDaily(); }
      else { playDaily(daily.idx < 0 ? 0 : daily.idx); }
    };
    document.getElementById('daily-rate').onchange = function () {
      daily.opts.rate = parseFloat(this.value); saveDailyPrefs();
    };
    document.getElementById('daily-times').onchange = function () {
      daily.opts.times = parseInt(this.value, 10); saveDailyPrefs();
    };
    document.getElementById('daily-cnshow').onchange = function () {
      daily.opts.cnShow = this.checked; saveDailyPrefs();
      // 只重绘气泡区，不打断正在播放的语音
      var rows = document.getElementById('daily-rows');
      var gg = dailyGroup();
      rows.innerHTML = gg.items.map(function (it, i) {
        var who = i % 2 ? 'B' : 'A';
        return '<div class="dlg-row ' + who.toLowerCase() + '" data-dline="' + i + '">' +
          '<span class="dlg-who who-' + who + '">' + who + '</span>' +
          '<div class="dlg-bubble">' +
            '<div class="dlg-en">' + esc(it[0]) + '</div>' +
            (daily.opts.cnShow ? '<div class="dlg-cn">' + esc(it[1]) + '</div>' : '') +
          '</div>' +
          '<span class="dlg-play" title="点句复读">🔊</span>' +
        '</div>';
      }).join('');
      bindDailyRows();
      updateDailyHighlight();
    };
    document.getElementById('daily-cnread').onchange = function () {
      daily.opts.cnRead = this.checked; saveDailyPrefs();
    };
    bindDailyRows();
    updateDailyHighlight();
  }
  function bindDailyRows() {
    document.querySelectorAll('#daily-rows [data-dline]').forEach(function (row) {
      row.onclick = function () { replayDailyLine(Number(row.dataset.dline)); };
    });
  }
  function dailyLineSeq(i) {
    var it = dailyGroup().items[i], seq = [];
    for (var k = 0; k < daily.opts.times; k++) {
      seq.push({ t: it[0], l: 'en', who: i % 2 ? 'B' : 'A' });
    }
    if (daily.opts.cnRead && it[1]) seq.push({ t: it[1], l: 'zh' });
    return seq;
  }
  function playDaily(from) {
    if (!dailyGroup()) return;
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    daily.playing = true;
    daily.idx = from;
    daily.gen++;
    speechSynthesis.cancel();
    renderDaily();
    playDailyTurn(from, 0, daily.gen);
  }
  function playDailyTurn(i, j, gen) {
    if (!daily.playing || gen !== daily.gen) return;
    var items = dailyGroup().items;
    if (i >= items.length) { finishDaily(); return; }
    daily.idx = i;
    updateDailyHighlight();
    var seq = dailyLineSeq(i);
    if (j >= seq.length) {
      setTimeout(function () { playDailyTurn(i + 1, 0, gen); }, 0);
      return;
    }
    var u = makeUtter(seq[j].t, seq[j].l, daily.opts.rate);
    if (seq[j].l === 'en') {
      var v = partVoice(seq[j].who);
      if (v) u.voice = v;
    }
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      clearTimeout(daily.watchdog);
      setTimeout(function () { playDailyTurn(i, j + 1, gen); }, 0);
    };
    u.onend = finish;
    u.onerror = finish;
    // onend 偶发不触发时按文本长度兜底；中文按字符计更宽裕
    var per = seq[j].l === 'zh' ? 350 : 250;
    daily.watchdog = setTimeout(finish, Math.max(3500, seq[j].t.length * per));
    speechSynthesis.speak(u);
  }
  function updateDailyHighlight() {
    document.querySelectorAll('#daily-rows .dlg-row').forEach(function (r, i) {
      r.classList.toggle('turn-cur', i === daily.idx);
      if (i === daily.idx && daily.idx >= 0) {
        r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
    var pb = document.getElementById('daily-play');
    if (pb) pb.textContent = daily.playing ? '⏸ 停止' : '▶ 播放本组';
    var prog = document.getElementById('daily-progress');
    if (prog) {
      var n = dailyGroup().items.length;
      prog.textContent = daily.playing && daily.idx >= 0
        ? '播放中 ' + (daily.idx + 1) + ' / ' + n
        : '已完成 ' + dailyDoneCount() + ' / ' + dailyGroups().length + ' 组';
    }
  }
  function finishDaily() {
    daily.playing = false;
    daily.idx = -1;
    daily.gen++;
    clearTimeout(daily.watchdog);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    var s = loadStore();
    var first = !s.dailyDone || !s.dailyDone[daily.scene];
    s.dailyDone = s.dailyDone || {};
    s.dailyDone[daily.scene] = true;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    renderDaily();
    if (first) toast('本组已听完 ✓ 进度已保存');
  }
  function replayDailyLine(i) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    stopDaily();
    daily.idx = i;
    daily.gen++;
    speechSynthesis.cancel();
    updateDailyHighlight();
    var it = dailyGroup().items[i];
    var u = makeUtter(it[0], 'en', daily.opts.rate);
    var v = partVoice(i % 2 ? 'B' : 'A');
    if (v) u.voice = v;
    var done = false;
    var settle = function () {
      if (done) return;
      done = true;
      clearTimeout(daily.watchdog);
      daily.idx = -1;
      setTimeout(updateDailyHighlight, 0);
    };
    u.onend = settle;
    u.onerror = settle;
    daily.watchdog = setTimeout(settle, Math.max(3500, it[0].length * 250));
    speechSynthesis.speak(u);
  }
  function stopDaily() {
    if (!daily.playing && daily.idx < 0) return;
    daily.playing = false;
    daily.idx = -1;
    daily.gen++;
    clearTimeout(daily.watchdog);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  /* ---------- 模式切换（闪卡/列表/随身听/拼写/同义替换） ---------- */
  var quiz = { list: [], idx: 0, score: 0, answered: false };
  var MODES = ['card', 'list', 'radio', 'quiz', 'para', 'pick'];
  var currentMode = 'card';
  document.getElementById('mode-card').onclick = function () { enterMode('card'); };
  document.getElementById('mode-list').onclick = function () { enterMode('list'); };
  document.getElementById('mode-radio').onclick = function () { enterMode('radio'); };
  document.getElementById('mode-quiz').onclick = function () { enterMode('quiz'); };
  document.getElementById('mode-para').onclick = function () { enterMode('para'); };
  document.getElementById('mode-pick').onclick = function () { enterMode('pick'); };
  function setMode(m) {
    currentMode = m;
    MODES.forEach(function (x) {
      document.getElementById('word-' + x + '-stage').style.display = x === m ? 'block' : 'none';
      document.getElementById('mode-' + x).className = 'btn btn-sm ' + (x === m ? 'btn-dark' : 'btn-ghost');
    });
    if (m !== 'radio') stopRadio(); // 离开随身听立刻停止播报
    // 随身听·口语与选词建表都不用词汇等级/话题两排 chips
    var hideChips = m === 'pick' || (m === 'radio' && radio.src === 'phrase');
    document.getElementById('level-chips').style.display = hideChips ? 'none' : '';
    document.getElementById('word-chips').style.display = hideChips ? 'none' : '';
  }
  function enterMode(m) {
    setMode(m);
    if (m === 'card') startCard(cardState.cat);
    else if (m === 'list') startList();
    else if (m === 'radio') startRadio();
    else if (m === 'quiz') startQuiz();
    else if (m === 'para') startPara();
    else if (m === 'pick') startPick();
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz() {
    var pool = currentWordPool(); // 与闪卡/列表/随身听同一选词口径（含自定义词表）
    quiz.list = shuffle(pool).slice(0, Math.min(10, pool.length));
    quiz.idx = 0; quiz.score = 0; quiz.answered = false;
    renderQuiz();
  }
  function normWord(s) { return s.trim().toLowerCase().replace(/[^a-z-]/g, ''); }
  function renderQuiz() {
    var w = quiz.list[quiz.idx], stage = document.getElementById('word-quiz-stage');
    stage.innerHTML =
      '<div class="study-bar"><span class="study-count">第 ' + (quiz.idx + 1) + ' / ' + quiz.list.length + ' 题 · 得分 ' + quiz.score + '</span>' +
      '<div class="progress-line"><i style="width:' + quiz.idx / quiz.list.length * 100 + '%"></i></div></div>' +
      '<div class="panel panel-pad">' +
        '<div class="quiz-q">' + w.pos + ' ' + w.cn + '</div>' +
        '<div class="quiz-hint">' + catName(w.cat) + ' · 根据中文释义拼写英文单词 <button class="btn btn-sm btn-ghost" id="q-speak" style="margin-left:8px">🔊 听音</button></div>' +
        '<input class="input" id="q-input" placeholder="输入英文单词后回车" autocomplete="off" autocapitalize="off" spellcheck="false">' +
        '<div class="quiz-feedback" id="q-fb"></div>' +
        '<div style="margin-top:16px"><button class="btn btn-primary" id="q-submit">提交</button></div>' +
      '</div>';
    var input = document.getElementById('q-input');
    input.focus();
    document.getElementById('q-speak').onclick = function () { speak(w.w); };
    function submit() {
      if (quiz.answered) { advance(); return; }
      var val = normWord(input.value);
      quiz.answered = true;
      var ok = val === normWord(w.w);
      input.classList.add(ok ? 'good' : 'bad');
      if (ok) quiz.score++;
      document.getElementById('q-fb').innerHTML = ok
        ? '<span style="color:var(--moss);font-weight:700">✓ 正确！</span> ' + w.w + ' ' + w.ph
        : '<span style="color:var(--cinnabar);font-weight:700">✗ 正确答案：' + w.w + '</span><br><span class="muted small">' + w.ex + '</span>';
      document.getElementById('q-submit').textContent = quiz.idx === quiz.list.length - 1 ? '查看成绩' : '下一题';
    }
    document.getElementById('q-submit').onclick = submit;
    input.onkeydown = function (e) { if (e.key === 'Enter') submit(); };
  }
  function advance() {
    quiz.answered = false;
    if (quiz.idx < quiz.list.length - 1) { quiz.idx++; renderQuiz(); }
    else {
      var pct = Math.round(quiz.score / quiz.list.length * 100);
      var s = loadStore(); s.quizBest = Math.max(s.quizBest || 0, quiz.score); saveStore({ quizBest: s.quizBest });
      var msg = pct >= 90 ? '出色，7 分词汇功底！' : pct >= 60 ? '不错，把错词再过一遍。' : '别灰心，回到闪卡模式多刷两轮。';
      document.getElementById('word-quiz-stage').innerHTML =
        '<div class="panel panel-pad score-hero"><div class="big">' + quiz.score + ' / ' + quiz.list.length + '</div>' +
        '<p>' + msg + '</p><div style="margin-top:18px;display:flex;gap:10px;justify-content:center">' +
        '<button class="btn btn-primary" id="q-again">再来一组</button>' +
        '<button class="btn btn-ghost" id="q-back">返回闪卡</button></div></div>';
      document.getElementById('q-again').onclick = startQuiz;
      document.getElementById('q-back').onclick = function () { setMode('card'); startCard(cardState.cat); };
    }
  }

  /* ---------- 同义替换测验 ---------- */
  var para = { list: [], idx: 0, score: 0, answered: false };
  function startPara() {
    para.list = shuffle(D.PARAPHRASE).slice(0, Math.min(10, D.PARAPHRASE.length));
    para.idx = 0; para.score = 0; para.answered = false;
    renderPara();
  }
  function renderPara() {
    var q = para.list[para.idx], stage = document.getElementById('word-para-stage');
    stage.innerHTML =
      '<div class="study-bar"><span class="study-count">第 ' + (para.idx + 1) + ' / ' + para.list.length + ' 题 · 得分 ' + para.score + '</span>' +
      '<div class="progress-line"><i style="width:' + para.idx / para.list.length * 100 + '%"></i></div></div>' +
      '<div class="panel panel-pad">' +
        '<div class="quiz-hint">选出与原句意思最接近的改写 <button class="btn btn-sm btn-ghost" id="p-speak" style="margin-left:8px">🔊 听原句</button></div>' +
        '<div class="para-orig">' + esc(q.orig) + '</div>' +
        '<div id="p-opts">' + q.opts.map(function (o, j) {
          return '<button class="opt-btn" data-j="' + j + '"><span class="opt-letter">' + String.fromCharCode(65 + j) + '.</span>' + esc(o) + '</button>';
        }).join('') + '</div>' +
        '<div class="quiz-feedback" id="p-fb"></div>' +
        '<div style="margin-top:14px"><button class="btn btn-primary" id="p-next" style="visibility:hidden">下一题</button></div>' +
      '</div>';
    document.getElementById('p-speak').onclick = function () { speak(q.orig); };
    var nextBtn = document.getElementById('p-next');
    nextBtn.textContent = para.idx === para.list.length - 1 ? '查看成绩' : '下一题';
    stage.querySelectorAll('.opt-btn').forEach(function (b) {
      b.onclick = function () {
        if (para.answered) return;
        para.answered = true;
        var pick = Number(b.dataset.j), ok = pick === q.a;
        if (ok) para.score++;
        stage.querySelectorAll('.opt-btn').forEach(function (x) {
          x.disabled = true;
          var j = Number(x.dataset.j);
          if (j === q.a) x.classList.add('correct');
          else if (j === pick) x.classList.add('wrong');
        });
        document.getElementById('p-fb').innerHTML =
          (ok ? '<span style="color:var(--moss);font-weight:700">✓ 正确！</span>' : '<span style="color:var(--cinnabar);font-weight:700">✗ 正确答案：' + String.fromCharCode(65 + q.a) + '</span>') +
          '<br><span class="muted small">' + esc(q.why) + '</span>';
        document.getElementById('p-fb').className = 'quiz-feedback q-why show';
        nextBtn.style.visibility = 'visible';
        nextBtn.focus();
      };
    });
    nextBtn.onclick = function () {
      para.answered = false;
      if (para.idx < para.list.length - 1) { para.idx++; renderPara(); }
      else {
        var pct = Math.round(para.score / para.list.length * 100);
        var s = loadStore(); s.paraBest = Math.max(s.paraBest || 0, para.score); saveStore({ paraBest: s.paraBest });
        var msg = pct >= 90 ? '出色，你已掌握雅思的底层逻辑！' : pct >= 60 ? '不错，注意偷换因果与过度绝对两类陷阱。' : '多刷几组，正确答案永远是「换说法不换意思」。';
        stage.innerHTML =
          '<div class="panel panel-pad score-hero"><div class="big">' + para.score + ' / ' + para.list.length + '</div>' +
          '<p>' + msg + '</p><div style="margin-top:18px;display:flex;gap:10px;justify-content:center">' +
          '<button class="btn btn-primary" id="p-again">再来一组</button>' +
          '<button class="btn btn-ghost" id="p-back">返回闪卡</button></div></div>';
        document.getElementById('p-again').onclick = startPara;
        document.getElementById('p-back').onclick = function () { setMode('card'); startCard(cardState.cat); };
      }
    };
  }

  /* ---------- 选词建表：4 档词库勾选 → 存成自定义词表，作为新 tab 学习 ---------- */
  var pickState = { level: '', kw: '', shown: 0 };
  var pickSelected = []; // 勾选的单词字符串（跨难度累计，草稿持久化 store.pickDraft）
  function startPick() {
    if (!PICK) {
      document.getElementById('word-pick-stage').innerHTML =
        '<div class="panel panel-pad">选词组件未加载，请刷新页面重试。</div>';
      return;
    }
    if (!pickState.level && VOCAB.LEVELS.length) pickState.level = VOCAB.LEVELS[0].id;
    pickSelected = pickDraft();
    pickState.kw = '';
    pickState.shown = 0;
    renderPick();
  }
  // 选词来源 = 按难度排序的 4 档词库 + 已有自定义词表（新 tab 里还能再挑词存成更新的 tab）
  var PICK_LEVEL_NAME = { primary: '① 小学', cet4: '② 四级', cet6: '③ 六级', ieltsfull: '④ 雅思高阶' };
  function pickSources() {
    var libs = VOCAB.LEVELS.map(function (l) {
      return { id: l.id, name: PICK_LEVEL_NAME[l.id] || l.name, count: (VOCAB.WORDS[l.id] || []).length, isSet: false };
    });
    var sets = getSets().map(function (s) {
      return { id: 'set:' + s.id, name: '🧺 ' + s.name, count: s.words.length, isSet: true };
    });
    return libs.concat(sets);
  }
  function pickWords() {
    var words = PICK.sourceWords(VOCAB, getSets(), pickState.level);
    return PICK.matchWordList(VOCAB_INDEX, words, pickState.kw);
  }
  // 单词 → 它所属的自建词表名（已入库的词在词格里点金标）
  function pickMembership() {
    var m = {};
    getSets().forEach(function (s) {
      s.words.forEach(function (w) { (m[w] = m[w] || []).push(s.name); });
    });
    return m;
  }
  function renderPick() {
    var stage = document.getElementById('word-pick-stage');
    var tabs = pickSources().map(function (l) {
      return '<button class="chip ' + (l.isSet ? 'chip-src-set ' : '') + (pickState.level === l.id ? 'on' : '') + '" data-plevel="' + l.id + '">' +
        esc(l.name) + ' ' + l.count + '</button>';
    }).join('');
    stage.innerHTML =
      '<div class="panel-pad" style="padding-bottom:0">' +
        '<p class="muted small" style="margin:0 0 10px">按难度分四档（① 小学 → ④ 雅思高阶）勾选单词，格子里英文完整显示、第二行是中文释义，点 🔊 直接发音；可跨档累计、可搜索；电脑上还能按住鼠标拖框批量选择。' +
        '勾完存成自己的词表，它会作为新标签出现在上方词库行最右边，闪卡 / 列表 / 随身听 / 拼写测验都能用；在自建词表里还能再挑词存成更新的词表，也能把选中的词从词表里移出（单词仍在原词库）。选择自动存草稿，关掉页面也不丢。</p>' +
        '<div class="chips" id="pick-levels">' + tabs + '</div>' +
        '<div class="listen-controls">' +
          '<input class="input" id="pick-search" placeholder="搜索英文或中文释义" autocomplete="off" style="max-width:280px">' +
          '<span class="muted small" id="pick-count"></span>' +
        '</div>' +
      '</div>' +
      '<div class="pick-grid" id="pick-grid"></div>' +
      '<div style="margin:8px 0 90px;text-align:center"><button class="btn btn-ghost btn-sm" id="pick-more" style="display:none">加载更多</button></div>' +
      '<div class="pick-bar" id="pick-bar"></div>';
    var input = document.getElementById('pick-search');
    input.value = pickState.kw;
    input.addEventListener('input', function (e) {
      pickState.kw = e.target.value;
      pickState.shown = 0;
      renderPickGrid();
    });
    document.getElementById('pick-more').onclick = function () {
      pickState.shown += PICK.PICK_CHUNK;
      renderPickGrid();
    };
    renderPickGrid();
    renderPickBar();
  }
  function renderPickGrid() {
    var words = pickWords();
    var box = document.getElementById('pick-grid');
    var slice = words.slice(0, pickState.shown + PICK.PICK_CHUNK);
    var membership = pickMembership();
    box.innerHTML = slice.map(function (w) {
      var on = pickSelected.indexOf(w) >= 0;
      var e = VOCAB_INDEX[w];
      var cn = e ? (e[3] || '') : '';
      var inSets = membership[w] || [];
      var title = w + (cn ? ' · ' + cn : '') + (inSets.length ? '（已在：' + inSets.join('、') + '）' : '');
      return '<div class="pick-word' + (on ? ' on' : '') + (!on && inSets.length ? ' in-set' : '') + '" data-pw="' + esc(w) + '" title="' + esc(title) + '">' +
        '<span class="pw-top"><span class="pw-en">' + esc(w) + '</span>' +
        '<span class="pw-speak" data-pspeak="' + esc(w) + '" title="朗读" role="button">🔊</span></span>' +
        '<span class="pw-cn">' + esc(cn) + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('pick-count').textContent = '共 ' + words.length + ' 词 · 已加载 ' + slice.length;
    var more = document.getElementById('pick-more');
    more.style.display = slice.length < words.length ? '' : 'none';
    more.textContent = '加载更多（还剩 ' + (words.length - slice.length) + '）';
  }
  function renderPickBar() {
    var bar = document.getElementById('pick-bar');
    var n = pickSelected.length;
    var preview = pickSelected.slice(0, 8).join(', ') + (n > 8 ? ' …' : '');
    var sets = getSets();
    var srcSetId = pickState.level.indexOf('set:') === 0 ? pickState.level.slice(4) : '';
    var srcSet = srcSetId ? findSet(srcSetId) : null;
    var appendHtml = sets.length
      ? sets.map(function (s) {
          return '<button class="btn btn-ghost btn-sm" data-pappend="' + s.id + '">＋ ' + esc(s.name) + '（' + s.words.length + '）</button>';
        }).join('')
      : '<span class="muted small">还没有自建词表</span>';
    bar.innerHTML =
      '<div class="pick-bar-main">' +
        '<b>🧺 已选 <span id="pick-n">' + n + '</span> 个</b>' +
        '<span class="muted small pick-preview" id="pick-preview">' + esc(preview || '点上方单词加入选择') + '</span>' +
      '</div>' +
      '<div class="pick-bar-actions">' +
        '<button class="btn btn-ghost btn-sm" id="pick-clear" ' + (n ? '' : 'disabled') + '>清空</button>' +
        (srcSet ? '<button class="btn btn-ghost btn-sm" id="pick-remove-set" ' + (n ? '' : 'disabled') + '>✂ 从「' + esc(srcSet.name) + '」移除</button>' : '') +
        appendHtml +
        '<button class="btn btn-primary btn-sm" id="pick-save" ' + (n ? '' : 'disabled') + '>💾 保存为新词表</button>' +
      '</div>';
    document.getElementById('pick-clear').onclick = function () {
      if (!pickSelected.length) return;
      if (confirm('清空已勾选的 ' + pickSelected.length + ' 个单词？')) {
        pickSelected = [];
        savePickDraft([]);
        renderPickGrid();
        renderPickBar();
      }
    };
    document.getElementById('pick-save').onclick = commitNewSet;
    var removeBtn = document.getElementById('pick-remove-set');
    if (removeBtn) removeBtn.onclick = removeFromCurrentSet;
    bar.querySelectorAll('[data-pappend]').forEach(function (b) {
      b.onclick = function () { appendToSet(b.dataset.pappend); };
    });
  }
  // 自建词表来源下：把选中词从该表移除（单词本身仍在原难度词库里）
  function removeFromCurrentSet() {
    if (pickState.level.indexOf('set:') !== 0 || !pickSelected.length) return;
    var id = pickState.level.slice(4);
    var s = findSet(id);
    if (!s) return;
    var cut = {};
    pickSelected.forEach(function (w) { cut[w] = true; });
    var remain = s.words.filter(function (w) { return !cut[w]; });
    var removed = s.words.length - remain.length;
    saveSets(getSets().map(function (x) { return x.id === id ? { id: x.id, name: x.name, words: remain } : x; }));
    pickSelected = [];
    savePickDraft([]);
    toast('已从「' + s.name + '」移除 ' + removed + ' 词（单词仍在原词库），剩 ' + remain.length);
    renderPick();
  }
  function commitNewSet() {
    if (!pickSelected.length) { toast('还没有勾选任何单词'); return; }
    var name = prompt('给新词表起个名字：', PICK.defaultSetName(getSets()));
    if (name === null) return;
    name = name.trim();
    if (!name) { toast('名称不能为空'); return; }
    var s = { id: 's' + Date.now().toString(36), name: name, words: pickSelected.slice() };
    saveSets(getSets().concat(s));
    savePickDraft([]);
    toast('已创建词表「' + name + '」，' + s.words.length + ' 词');
    cardState.level = 'set:' + s.id;
    cardState.cat = 'all';
    enterMode('card'); // 新词表作为新 tab 高亮，直接进入闪卡
  }
  function appendToSet(id) {
    var s = findSet(id);
    if (!s) return;
    if (!pickSelected.length) { toast('还没有勾选任何单词'); return; }
    var merged = PICK.mergeWords(s.words, pickSelected);
    var added = merged.length - s.words.length;
    saveSets(getSets().map(function (x) { return x.id === id ? { id: x.id, name: x.name, words: merged } : x; }));
    savePickDraft([]);
    toast('已加入「' + s.name + '」：新增 ' + added + ' 词，共 ' + merged.length + ' 词');
    pickSelected = [];
    renderPickGrid();
    renderPickBar();
  }
  var pickDragged = false; // 框选松手后的 click 是拖曳尾声，不再当单击
  document.getElementById('word-pick-stage').addEventListener('click', function (e) {
    if (pickDragged) { pickDragged = false; return; }
    var spk = e.target.closest('[data-pspeak]');
    if (spk) { e.stopPropagation(); speak(spk.dataset.pspeak); return; }
    var lv = e.target.closest('[data-plevel]');
    if (lv) {
      if (lv.dataset.plevel === pickState.level) return;
      pickState.level = lv.dataset.plevel;
      pickState.kw = '';
      pickState.shown = 0;
      renderPick();
      return;
    }
    var wb = e.target.closest('[data-pw]');
    if (wb) {
      var w = wb.dataset.pw;
      var i = pickSelected.indexOf(w);
      if (i >= 0) { pickSelected.splice(i, 1); wb.classList.remove('on'); }
      else { pickSelected.push(w); wb.classList.add('on'); }
      savePickDraft(pickSelected);
      renderPickBar();
    }
  });

  /* 框选（鼠标）：词格上按住拖出矩形，碰到的单词批量加入；
     起手按在已选词上则整框批量取消。触屏仍走点选（避免和滚屏打架）。 */
  var lasso = null;
  var LASSO_SLOP = 6;
  document.getElementById('word-pick-stage').addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('[data-pspeak]')) return; // 点喇叭不起框选
    var grid = e.target.closest('#pick-grid');
    if (!grid) return;
    pickDragged = false; // 新的按下开始：上一帧框选的吞 click 标记立即失效
    var startCell = e.target.closest('.pick-word');
    lasso = {
      sx: e.clientX, sy: e.clientY,
      removing: !!(startCell && startCell.classList.contains('on')),
      base: pickSelected.slice(),
      moved: false, grid: grid, el: null
    };
    e.preventDefault();
  });
  window.addEventListener('pointermove', function (e) {
    if (!lasso) return;
    if (!lasso.moved &&
        Math.abs(e.clientX - lasso.sx) < LASSO_SLOP &&
        Math.abs(e.clientY - lasso.sy) < LASSO_SLOP) return;
    if (!lasso.moved) {
      lasso.moved = true;
      lasso.el = document.createElement('div');
      lasso.el.className = 'pick-lasso';
      lasso.grid.appendChild(lasso.el);
    }
    var gr = lasso.grid.getBoundingClientRect();
    var x0 = Math.min(lasso.sx, e.clientX), y0 = Math.min(lasso.sy, e.clientY);
    var x1 = Math.max(lasso.sx, e.clientX), y1 = Math.max(lasso.sy, e.clientY);
    lasso.el.style.left = (x0 - gr.left) + 'px';
    lasso.el.style.top = (y0 - gr.top) + 'px';
    lasso.el.style.width = (x1 - x0) + 'px';
    lasso.el.style.height = (y1 - y0) + 'px';
    var cells = lasso.grid.querySelectorAll('.pick-word');
    var hit = [];
    cells.forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.left < x1 && r.right > x0 && r.top < y1 && r.bottom > y0) hit.push(c.dataset.pw);
    });
    // 以起手瞬间的选择集为基线：命中词整体加入/移除；新增顺序按格子顺序追加
    var hitSet = {};
    hit.forEach(function (w) { hitSet[w] = true; });
    var next;
    if (lasso.removing) {
      next = lasso.base.filter(function (w) { return !hitSet[w]; });
    } else {
      next = lasso.base.slice();
      var seen = {};
      next.forEach(function (w) { seen[w] = true; });
      hit.forEach(function (w) { if (!seen[w]) { seen[w] = true; next.push(w); } });
    }
    pickSelected = next;
    var sel = {};
    next.forEach(function (w) { sel[w] = true; });
    cells.forEach(function (c) { c.classList.toggle('on', !!sel[c.dataset.pw]); });
  });
  window.addEventListener('pointerup', function () {
    if (!lasso) return;
    if (lasso.moved) {
      if (lasso.el && lasso.el.parentNode) lasso.el.parentNode.removeChild(lasso.el);
      savePickDraft(pickSelected);
      renderPickGrid(); // 重建以恢复金标（已入库）等派生样式
      renderPickBar();
      pickDragged = true;
    }
    lasso = null;
  });

  /* ---------------- 听力 ---------------- */
  var lis = { level: 0, idx: 0, tries: 0, rate: 1, done: false };
  function listenList() { return lis.level ? allListening().filter(function (x) { return x.level === lis.level; }) : allListening(); }
  document.getElementById('listen-chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    lis.level = Number(b.dataset.level); lis.idx = 0; lis.tries = 0; lis.done = false;
    document.querySelectorAll('#listen-chips .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    renderListen();
  });
  function blanked(sentence, answer) {
    return esc(sentence).replace(esc(answer), '<span class="blank-word" id="listen-blank">______</span>');
  }
  function renderListen() {
    var list = listenList(), item = list[lis.idx], stage = document.getElementById('listen-stage');
    var reveal = lis.done;
    stage.innerHTML =
      '<div class="study-bar"><span class="study-count">' + (lis.idx + 1) + ' / ' + list.length + '</span>' +
      '<div class="progress-line"><i style="width:' + (lis.idx / list.length * 100) + '%"></i></div>' +
      '<span class="tag tag-red">难度 ' + '★'.repeat(item.level) + '</span></div>' +
      '<div class="panel panel-pad">' +
        '<div class="listen-controls">' +
          '<button class="btn btn-primary btn-sm" id="play-sentence">🔊 播放句子</button>' +
          '<div class="speed-pick">' +
            [0.8, 1, 1.2].map(function (r) {
              return '<button data-rate="' + r + '" class="' + (lis.rate === r ? 'on' : '') + '">' + (r === 1 ? '正常' : r + 'x') + '</button>';
            }).join('') +
          '</div>' +
          '<span class="tries">剩余播放次数 ' + (5 - lis.tries) + '</span>' +
        '</div>' +
        '<div class="listen-sentence" id="sentence-view">' + blanked(item.sentence, item.answer) + '</div>' +
        '<input class="input" id="listen-input" placeholder="输入听到的缺失单词" autocomplete="off" autocapitalize="off" spellcheck="false" style="max-width:340px">' +
        '<div class="quiz-feedback" id="listen-fb"></div>' +
        '<div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-sm" id="listen-submit">提交</button>' +
          (reveal ? '' : '<button class="btn btn-ghost btn-sm" id="listen-reveal">直接看答案</button>') +
          '<button class="btn btn-ghost btn-sm" id="listen-next">' + (lis.idx === list.length - 1 ? '回到第一题' : '下一句 →') + '</button>' +
        '</div>' +
      '</div>';
    var input = document.getElementById('listen-input');
    function play() {
      if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
      if (lis.tries >= 5) { toast('本句播放次数已用完'); return; }
      lis.tries++; speak(item.sentence, lis.rate);
      renderListenTries();
    }
    document.getElementById('play-sentence').onclick = play;
    document.querySelectorAll('.speed-pick button').forEach(function (b) {
      b.onclick = function () {
        // 只切换语速与高亮，不重渲染，保留已输入答案
        lis.rate = Number(b.dataset.rate);
        document.querySelectorAll('.speed-pick button').forEach(function (x) {
          x.classList.toggle('on', Number(x.dataset.rate) === lis.rate);
        });
      };
    });
    function renderListenTries() {
      var t = document.querySelector('.tries'); if (t) t.textContent = '剩余播放次数 ' + (5 - lis.tries);
    }
    function grade(okFlag) {
      if (lis.done) return;
      var val = normWord(input.value), ok = okFlag === true ? false : val === normWord(item.answer);
      lis.done = true;
      document.getElementById('sentence-view').innerHTML = esc(item.sentence).replace(esc(item.answer), '<span class="blank-word" style="border-color:var(--moss);color:var(--moss)">' + item.answer + '</span>');
      document.getElementById('listen-fb').innerHTML =
        (ok ? '<span style="color:var(--moss);font-weight:700">✓ 听写正确！</span>' : '<span style="color:var(--cinnabar);font-weight:700">✗ 正确答案：' + item.answer + '</span>') +
        '<br><span class="muted">' + item.cn + '</span>';
      if (ok) {
        var s = loadStore(); s.listenOk = Array.from(new Set((s.listenOk || []).concat([item.sentence]))); saveStore({ listenOk: s.listenOk });
      }
    }
    document.getElementById('listen-submit').onclick = function () {
      if (!input.value.trim()) { input.focus(); return; }
      grade();
    };
    input.onkeydown = function (e) { if (e.key === 'Enter') document.getElementById('listen-submit').click(); };
    var rev = document.getElementById('listen-reveal');
    if (rev) rev.onclick = function () {
      input.value = item.answer; grade(true);
    };
    document.getElementById('listen-next').onclick = function () {
      lis.idx = (lis.idx + 1) % list.length; lis.tries = 0; lis.done = false; renderListen();
    };
  }

  /* ---------------- 篇章听力（对话 + 短文讲座） ---------------- */
  var lp = { tab: 'dict', part: 0, ans: {}, playing: false, gen: 0, turn: -1, showText: false, rate: 1, watchdog: 0 };
  document.getElementById('listen-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    lp.tab = b.dataset.ltab;
    document.querySelectorAll('#listen-tabs .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    var isDict = lp.tab === 'dict';
    document.getElementById('listen-chips').style.display = isDict ? '' : 'none';
    document.getElementById('listen-stage').style.display = isDict ? '' : 'none';
    document.getElementById('listen-part-stage').style.display = isDict ? 'none' : '';
    stopPart();
    if (!isDict) { lp.part = 0; lp.showText = false; renderPart(); }
  });
  function partList() {
    return D.LISTEN_PARTS.filter(function (p) { return p.type === (lp.tab === 'lecture' ? 'lecture' : 'dialogue'); });
  }
  function partItems(p) {
    return p.type === 'dialogue' ? p.turns : p.paragraphs.map(function (t) { return { who: '', text: t }; });
  }
  function partAns() {
    if (!lp.ans[lp.part]) lp.ans[lp.part] = { pick: {}, graded: false, score: 0 };
    return lp.ans[lp.part];
  }
  function renderPart() {
    var list = partList(), p = list[lp.part], a = partAns();
    var s = loadStore(), doneMap = s.partOk || {};
    var stage = document.getElementById('listen-part-stage');
    var items = partItems(p);
    stage.innerHTML =
      '<div class="chips" style="margin-bottom:14px">' + list.map(function (x, i) {
        var done = doneMap[x.title];
        return '<button class="chip' + (i === lp.part ? ' on' : '') + '" data-part="' + i + '">' +
          esc(x.title) + (done != null ? ' · ' + done + '/' + x.questions.length + '✓' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="panel panel-pad">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">' +
          '<span class="tag tag-red">' + esc(p.scene) + '</span>' +
          '<span class="tag">' + '★'.repeat(p.level) + '</span>' +
        '</div>' +
        '<h3 style="margin:0 0 12px;font-family:var(--font-serif)">' + esc(p.title) + '</h3>' +
        '<div class="listen-controls">' +
          '<button class="btn btn-primary btn-sm" id="part-play">▶ 播放整篇</button>' +
          '<label class="small muted">语速 <select id="part-rate">' +
            [0.8, 1, 1.25].map(function (r) {
              return '<option value="' + r + '"' + (lp.rate === r ? ' selected' : '') + '>' + (r === 1 ? '常速' : r + 'x') + '</option>';
            }).join('') + '</select></label>' +
          '<button class="btn btn-ghost btn-sm" id="part-text-toggle">' + (lp.showText ? '🙈 隐藏原文' : '📖 显示原文') + '</button>' +
          '<span class="tries" id="part-progress">' + items.length + ' ' + (p.type === 'dialogue' ? '轮对话' : '段') + '</span>' +
        '</div>' +
        '<div id="part-transcript">' + (lp.showText ?
          items.map(function (t, i) {
            return '<div class="turn-row" data-turn="' + i + '">' +
              (t.who ? '<span class="turn-who who-' + t.who + '">' + t.who + '</span>' : '<span class="turn-who">§</span>') +
              '<span class="turn-text">' + esc(t.text) + '</span>' +
              '<button class="speak-btn turn-replay" data-turn="' + i + '" title="复读本句">🔊</button></div>';
          }).join('')
          : '<p class="muted small" style="margin:6px 0 0">原文已隐藏 —— 先专心听，听完或对答案时再点开对照。每句右侧 🔊 可单独复读。</p>') +
        '</div>' +
        '<div class="part-qs">' + p.questions.map(function (q, qi) {
          var pick = a.pick[qi];
          return '<div class="part-q">' +
            '<p class="part-q-t">' + (qi + 1) + '. ' + esc(q.q) + '</p>' +
            q.opts.map(function (o, oi) {
              var cls = 'part-opt';
              if (a.graded) {
                if (oi === q.ans) cls += ' ok';
                else if (pick === oi) cls += ' bad';
              }
              return '<label class="' + cls + '"><input type="radio" name="pq' + qi + '" value="' + oi + '"' +
                (pick === oi ? ' checked' : '') + (a.graded ? ' disabled' : '') + '> ' + esc(o) + '</label>';
            }).join('') +
            (a.graded ? '<p class="part-why">' + (pick === q.ans ? '✓ ' : '✗ ') + esc(q.why) + '</p>' : '') +
          '</div>';
        }).join('') + '</div>' +
        '<div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
          (a.graded
            ? '<span style="font-weight:700;color:' + (a.score === p.questions.length ? 'var(--moss)' : 'var(--cinnabar)') + '">得分 ' + a.score + ' / ' + p.questions.length + '</span>' +
              '<button class="btn btn-ghost btn-sm" id="part-retry">🔄 重做本篇</button>'
            : '<button class="btn btn-primary btn-sm" id="part-submit">提交答案</button>') +
        '</div>' +
      '</div>';
    stage.querySelectorAll('.chip[data-part]').forEach(function (b) {
      b.onclick = function () {
        stopPart(); lp.part = Number(b.dataset.part); lp.showText = false; renderPart();
      };
    });
    document.getElementById('part-play').onclick = function () {
      lp.playing ? (stopPart(), renderPart()) : playPart(0);
    };
    document.getElementById('part-rate').onchange = function () { lp.rate = parseFloat(this.value); };
    document.getElementById('part-text-toggle').onclick = function () { lp.showText = !lp.showText; renderPart(); };
    stage.querySelectorAll('.turn-replay').forEach(function (b) {
      b.onclick = function () { replayTurn(Number(b.dataset.turn)); };
    });
    stage.querySelectorAll('.part-q input[type=radio]').forEach(function (r) {
      r.onchange = function () { partAns().pick[Number(r.name.slice(2))] = Number(r.value); };
    });
    var sub = document.getElementById('part-submit');
    if (sub) sub.onclick = function () {
      var a2 = partAns();
      var unanswered = p.questions.filter(function (q, i) { return a2.pick[i] == null; }).length;
      if (unanswered) { toast('还有 ' + unanswered + ' 题未作答'); return; }
      var score = 0;
      p.questions.forEach(function (q, i) { if (a2.pick[i] === q.ans) score++; });
      a2.graded = true; a2.score = score;
      var st = loadStore(); st.partOk = st.partOk || {}; st.partOk[p.title] = score;
      saveStore({ partOk: st.partOk });
      renderPart();
    };
    var retry = document.getElementById('part-retry');
    if (retry) retry.onclick = function () {
      lp.ans[lp.part] = { pick: {}, graded: false, score: 0 };
      renderPart();
    };
  }
  function partVoice(who) {
    if (!who) return null;
    var gb = voices.filter(function (v) { return /en[-_]GB/i.test(v.lang); });
    var ens = voices.filter(function (v) { return /^en/i.test(v.lang); });
    var pool = gb.length > 1 ? gb : ens;
    return (who === 'B' ? pool[1] || pool[0] : pool[0]) || null;
  }
  function playPart(from) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    lp.playing = true; lp.gen++;
    speechSynthesis.cancel();
    playPartTurn(from, lp.gen);
    var pb = document.getElementById('part-play');
    if (pb) pb.innerHTML = '⏸ 停止播放';
  }
  function playPartTurn(i, gen) {
    var p = partList()[lp.part], items = partItems(p);
    if (!lp.playing || gen !== lp.gen) return;
    if (i >= items.length) {
      lp.playing = false; lp.turn = -1;
      setTimeout(renderPart, 0);
      return;
    }
    lp.turn = i;
    updateTurnHighlight();
    var it = items[i];
    var u = makeUtter(it.text, 'en', lp.rate);
    var v = partVoice(it.who);
    if (v) u.voice = v;
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      clearTimeout(lp.watchdog);
      setTimeout(function () { playPartTurn(i + 1, gen); }, 0);
    };
    u.onend = finish; u.onerror = finish;
    lp.watchdog = setTimeout(finish, Math.max(4000, it.text.length * 250));
    speechSynthesis.speak(u);
  }
  function updateTurnHighlight() {
    document.querySelectorAll('.turn-row').forEach(function (r, i) {
      r.classList.toggle('turn-cur', i === lp.turn);
    });
    var prog = document.getElementById('part-progress');
    if (prog && lp.turn >= 0) {
      var items = partItems(partList()[lp.part]);
      prog.textContent = '播放中 ' + (lp.turn + 1) + ' / ' + items.length;
    }
  }
  function replayTurn(i) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    stopPart();
    var it = partItems(partList()[lp.part])[i];
    lp.turn = i; updateTurnHighlight();
    var u = makeUtter(it.text, 'en', lp.rate);
    var v = partVoice(it.who);
    if (v) u.voice = v;
    u.onend = u.onerror = function () {
      setTimeout(function () { lp.turn = -1; updateTurnHighlight(); }, 0);
    };
    speechSynthesis.speak(u);
    var pb = document.getElementById('part-play');
    if (pb) pb.innerHTML = '▶ 播放整篇';
  }
  function stopPart() {
    if (!lp.playing && lp.turn < 0) return;
    lp.playing = false; lp.turn = -1; lp.gen++;
    clearTimeout(lp.watchdog);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  /* ---------------- 阅读 ---------------- */
  function renderReadingList() {
    var s = loadStore(), done = s.readDone || [];
    document.getElementById('reading-list').innerHTML =
      '<div class="passage-list">' + D.READING.map(function (p, i) {
        var best = s.readBest && s.readBest[p.id];
        return '<button class="panel passage-row" data-pid="' + p.id + '">' +
          '<span class="idx">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span style="flex:1"><b style="font-family:var(--font-serif);font-size:18px">' + p.title + '</b><br>' +
          '<span class="muted small">' + p.topic + ' · 建议 ' + p.minutes + ' 分钟 · ' + p.questions.length + ' 题</span></span>' +
          (done.indexOf(p.id) >= 0 ? '<span class="tag tag-green">已完成 · ' + (best || '?') + '/' + p.questions.length + '</span>' : '<span class="tag">未做</span>') +
        '</button>';
      }).join('') + '</div>';
    document.querySelectorAll('.passage-row').forEach(function (b) {
      b.onclick = function () { openPassage(b.dataset.pid); };
    });
  }
  var readingState = { id: null, answers: {} };
  function openPassage(pid) {
    readingState.id = pid; readingState.answers = {};
    document.getElementById('reading-list').style.display = 'none';
    var box = document.getElementById('reading-practice');
    box.style.display = 'block';
    renderPassage(false);
    window.scrollTo(0, 0);
  }
  function renderPassage(graded) {
    var p = D.READING.find(function (x) { return x.id === readingState.id; });
    var box = document.getElementById('reading-practice');
    box.innerHTML =
      '<div style="margin-bottom:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<button class="btn btn-ghost btn-sm" id="back-read">← 文章列表</button>' +
        '<span class="tag">' + p.topic + '</span><span class="muted small">建议用时 ' + p.minutes + ' 分钟</span>' +
        (graded ? '<button class="btn btn-dark btn-sm" id="redo-read">重新做</button>' : '<button class="btn btn-primary btn-sm" id="grade-read">提交批改</button>') +
        '<span id="read-score"></span>' +
      '</div>' +
      '<div class="reader-grid">' +
        '<article class="panel panel-pad passage-text"><h2>' + p.title + '</h2><p class="muted small" style="margin:4px 0 16px">ACADEMIC READING</p>' +
          p.paragraphs.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
        '</article>' +
        '<aside class="panel panel-pad reader-sticky"><h3 style="font-family:var(--font-serif);margin-bottom:8px">Questions 1–' + p.questions.length + '</h3>' +
          p.questions.map(function (q, i) {
            var chosen = readingState.answers[i];
            var body;
            if (q.type === 'tfng') {
              body = ['T', 'F', 'NG'].map(function (o) {
                var cls = graded ? (o === q.a ? 'correct' : (o === chosen && chosen !== q.a ? 'wrong' : '')) : '';
                return '<label class="opt ' + cls + '"><input type="radio" name="q' + i + '" value="' + o + '"' + (chosen === o ? ' checked' : '') +
                  (graded ? ' disabled' : '') + '><span><b>' + ({ T: 'TRUE', F: 'FALSE', NG: 'NOT GIVEN' }[o]) + '</b></span></label>';
              }).join('');
            } else {
              body = q.opts.map(function (o, j) {
                var letter = String.fromCharCode(65 + j);
                var cls = graded ? (letter === q.a ? 'correct' : (letter === chosen ? 'wrong' : '')) : '';
                return '<label class="opt ' + cls + '"><input type="radio" name="q' + i + '" value="' + letter + '"' + (chosen === letter ? ' checked' : '') +
                  (graded ? ' disabled' : '') + '><span>' + letter + '. ' + esc(o) + '</span></label>';
              }).join('');
            }
            return '<div class="q-item"><div class="q-stem"><span class="qn">' + (i + 1) + '.</span>' +
              (q.type === 'tfng' ? esc(q.q) + ' <span class="muted small">（TRUE / FALSE / NOT GIVEN）</span>' : esc(q.q)) + '</div>' +
              body + '<div class="q-why ' + (graded ? 'show' : '') + '"><b>答案 ' + q.a + '：</b>' + esc(q.why) + '</div></div>';
          }).join('') +
        '</aside>' +
      '</div>';
    document.getElementById('back-read').onclick = function () {
      box.style.display = 'none';
      document.getElementById('reading-list').style.display = 'block';
      renderReadingList();
    };
    box.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.onchange = function () {
        var name = r.name.slice(1);
        readingState.answers[name] = r.value;
      };
    });
    var gradeBtn = document.getElementById('grade-read');
    if (gradeBtn) gradeBtn.onclick = function () {
      var unanswered = p.questions.filter(function (_, i) { return !readingState.answers[i]; }).length;
      if (unanswered) { toast('还有 ' + unanswered + ' 题未作答'); return; }
      renderPassage(true);
      var score = p.questions.filter(function (q, i) { return readingState.answers[i] === q.a; }).length;
      document.getElementById('read-score').innerHTML = '<b style="color:var(--cinnabar)">得分 ' + score + ' / ' + p.questions.length + '</b>';
      var s = loadStore();
      s.readDone = Array.from(new Set((s.readDone || []).concat([p.id])));
      s.readBest = s.readBest || {}; s.readBest[p.id] = Math.max(s.readBest[p.id] || 0, score);
      saveStore({ readDone: s.readDone, readBest: s.readBest });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    var redo = document.getElementById('redo-read');
    if (redo) redo.onclick = function () { readingState.answers = {}; renderPassage(false); };
  }

  /* ---------------- 写作 ---------------- */
  var writing = { id: D.WRITING[0].id, remaining: 0, running: false, timerId: null };
  function wordCount(text) {
    var m = text.trim().match(/[A-Za-z0-9'’-]+/g);
    return m ? m.length : 0;
  }
  function renderWritingList() {
    document.getElementById('writing-list').innerHTML =
      D.WRITING.map(function (p) {
        var s = loadStore(), has = (s.drafts || {})[p.id];
        return '<button class="prompt-item ' + (p.id === writing.id ? 'on' : '') + '" data-wid="' + p.id + '">' +
          '<span class="tag">' + p.type + '</span> ' +
          '<b>' + (p.model ? '📝' : '🏗') + ' ' + p.typeCn + ' · ' + p.time + ' 分钟</b>' +
          '<div class="small" style="opacity:.75;margin-top:4px">' + esc(p.prompt.slice(0, 72)) + '…</div>' +
          (has ? '<div class="small" style="margin-top:4px;color:var(--cinnabar)">📌 有未完成草稿</div>' : '') +
        '</button>';
      }).join('');
    document.querySelectorAll('.prompt-item').forEach(function (b) {
      b.onclick = function () { stopTimer(); writing.id = b.dataset.wid; renderWritingList(); renderWritingWork(); };
    });
  }
  function stopTimer() {
    writing.running = false;
    if (writing.timerId) clearInterval(writing.timerId);
    writing.timerId = null;
  }
  function fmt(sec) {
    var m = Math.floor(sec / 60), r = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }
  function renderWritingWork() {
    var p = D.WRITING.find(function (x) { return x.id === writing.id; });
    var s = loadStore();
    var draft = (s.drafts || {})[p.id] || '';
    stopTimer();
    writing.remaining = p.time * 60;
    var box = document.getElementById('writing-work');
    box.innerHTML =
      '<div class="panel panel-pad">' +
        '<div style="margin-bottom:10px"><span class="tag tag-red">' + p.type + '</span> <span class="tag">' + p.typeCn + '</span></div>' +
        '<h2 style="font-family:var(--font-serif);font-size:20px;margin-bottom:6px">' + esc(p.prompt) + '</h2>' +
        '<p class="muted small">' + esc(p.promptCn) + '</p>' +
        (p.table ? '<table class="data-table"><caption class="small muted" style="caption-side:top;text-align:left;margin-bottom:6px">' + esc(p.table.caption) + '</caption>' +
          '<tr>' + p.table.head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' +
          p.table.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' : '') +
        '<div class="write-toolbar">' +
          '<span class="timer" id="w-timer">' + fmt(writing.remaining) + '</span>' +
          '<button class="btn btn-dark btn-sm" id="w-start">▶ 开始计时</button>' +
          '<button class="btn btn-ghost btn-sm" id="w-reset">↺ 重置</button>' +
          '<span class="word-count" id="w-count">字数 <b>' + wordCount(draft) + '</b> / ' + p.minWords + '</span>' +
        '</div>' +
        '<textarea class="write-area" id="w-text" placeholder="在此输入你的作文…（自动保存到本机）">' + esc(draft) + '</textarea>' +
        '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-sm" id="w-save">💾 保存草稿</button>' +
          '<button class="btn btn-ghost btn-sm" id="w-clear">清空</button>' +
          '<button class="btn btn-ghost btn-sm" id="w-toggle">📖 ' + (p.model ? '查看提纲 / 范文' : '查看提纲 / 句库') + '</button>' +
        '</div>' +
        '<div class="model-essay" id="w-model">' +
          '<h4>解题提纲</h4><ul class="outline-list">' + p.outline.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' +
          (p.model ? '<h4 style="margin-top:18px">7 分参考范文（约 ' + wordCount(p.model) + ' 词）</h4><p>' + esc(p.model) + '</p>' :
            '<div class="tip3" style="margin-top:14px"><b>本题练习说明：</b>本题提供完整提纲，请先独立完成，再用 Task 2 自评清单检查；写完后可找老师或 AI 批改。</div>') +
          '<h4 style="margin-top:18px">Task 2 自评清单</h4>' +
          '<ul class="checklist"><li>立场在开头与结尾一致出现</li><li>每个主体段有明确中心句</li><li>使用了衔接词但不堆砌</li><li>至少 2 个复杂句（定语从句/让步/条件）</li><li>检查第三人称单数、时态、冠词、复数</li><li>字数 ≥ ' + p.minWords + '</li></ul>' +
        '</div>' +
      '</div>';
    var area = document.getElementById('w-text'), wc = document.getElementById('w-count'), timerEl = document.getElementById('w-timer');
    function updateCount() {
      var n = wordCount(area.value);
      wc.innerHTML = '字数 <b>' + n + '</b> / ' + p.minWords;
      wc.classList.toggle('under', n < p.minWords);
    }
    updateCount();
    var saveTimer;
    area.oninput = function () {
      updateCount();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var st = loadStore(); st.drafts = st.drafts || {}; st.drafts[p.id] = area.value; saveStore({ drafts: st.drafts });
      }, 600);
    };
    document.getElementById('w-save').onclick = function () {
      var st = loadStore(); st.drafts = st.drafts || {}; st.drafts[p.id] = area.value; saveStore({ drafts: st.drafts });
      toast('草稿已保存');
    };
    document.getElementById('w-clear').onclick = function () {
      if (!confirm('确定清空这篇草稿？')) return;
      area.value = ''; updateCount();
      var st = loadStore(); st.drafts = st.drafts || {}; delete st.drafts[p.id]; saveStore({ drafts: st.drafts });
    };
    document.getElementById('w-toggle').onclick = function () {
      document.getElementById('w-model').classList.toggle('show');
    };
    document.getElementById('w-start').onclick = function () {
      if (writing.running) {
        writing.running = false; clearInterval(writing.timerId);
        this.textContent = '▶ 继续';
        return;
      }
      writing.running = true;
      this.textContent = '⏸ 暂停';
      writing.timerId = setInterval(function () {
        writing.remaining--;
        timerEl.textContent = fmt(Math.max(0, writing.remaining));
        timerEl.classList.toggle('danger', writing.remaining <= 300);
        if (writing.remaining <= 0) {
          stopTimer();
          document.getElementById('w-start').textContent = '⏰ 时间到';
          toast('⏰ 时间到！对照范文自评吧');
        }
      }, 1000);
    };
    document.getElementById('w-reset').onclick = function () {
      stopTimer(); writing.remaining = p.time * 60;
      timerEl.textContent = fmt(writing.remaining); timerEl.classList.remove('danger');
      document.getElementById('w-start').textContent = '▶ 开始计时';
    };
  }

  /* ---------------- 口语 ---------------- */
  function renderSpeaking() {
    document.getElementById('cue-grid').innerHTML = D.SPEAKING.part2.map(function (c) {
      return '<div class="cue-card" id="cue-' + c.id + '">' +
        '<h3>' + esc(c.cue) + '</h3><ul>You should say:' +
        c.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
        '<div class="cue-timer"><div class="phase" id="phase-' + c.id + '">准备 60 秒</div>' +
        '<div class="clock prep" id="clock-' + c.id + '">1:00</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0">' +
          '<button class="btn btn-dark btn-sm" data-act="prep" data-id="' + c.id + '">⏱ 开始准备</button>' +
          '<button class="btn btn-primary btn-sm" data-act="speak" data-id="' + c.id + '">🎙 开始录音作答</button>' +
        '</div>' +
        '<div id="rec-area-' + c.id + '"></div>' +
        '<details style="margin-top:10px"><summary class="small" style="cursor:pointer;color:var(--ink-soft)">📖 查看 7 分示范答案</summary>' +
        '<p style="white-space:pre-line;font-size:13.5px;color:var(--ink-soft);margin-top:10px;line-height:1.9">' + esc(c.model) + '</p></details>' +
      '</div>';
    }).join('');

    document.getElementById('part1-list').innerHTML = D.SPEAKING.part1.map(function (t) {
      return '<h3 style="font-family:var(--font-serif);margin:14px 0 6px">' + t.icon + ' ' + esc(t.topic) + '</h3>' +
        t.items.map(function (it) {
          return '<details class="faq"><summary>' + esc(it.q) + '</summary><div class="ans">' + esc(it.a) + '</div></details>';
        }).join('');
    }).join('');

    document.getElementById('part3-list').innerHTML = D.SPEAKING.part3.map(function (p, i) {
      return '<details class="faq" ' + (i === 0 ? 'open' : '') + '><summary>' + (i + 1) + '. ' + esc(p.q) + '</summary>' +
        '<div class="tip3"><b>答题骨架</b><ul>' + p.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></details>';
    }).join('');
  }

  var cueTimers = {};
  function clearCue(id) { if (cueTimers[id]) { clearInterval(cueTimers[id]); delete cueTimers[id]; } }
  document.getElementById('cue-grid').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.dataset.id, act = b.dataset.act;
    // 停掉所有题卡的计时器与录音（含本题卡重开），避免麦克风/计时器并行
    Object.keys(cueTimers).forEach(function (tid) { clearCue(tid); });
    stopAllRecorders();
    if (act === 'prep') runCueTimer(id, 60, 'prep', '准备中…');
    if (act === 'speak') { runCueTimer(id, 120, 'speak', '录音作答中'); startRecorder(id); }
  });
  function runCueTimer(id, secs, cls, label) {
    var clock = document.getElementById('clock-' + id), phaseEl = document.getElementById('phase-' + id);
    var left = secs;
    clock.className = 'clock ' + cls;
    phaseEl.textContent = label;
    clock.textContent = fmt(left);
    cueTimers[id] = setInterval(function () {
      left--;
      clock.textContent = fmt(Math.max(0, left));
      if (left <= 0) {
        clearCue(id);
        phaseEl.textContent = '时间到';
        clock.textContent = '00:00';
        if (cls === 'speak') stopRecorder(id);
        toast(cls === 'prep' ? '准备结束，开始作答！' : '⏰ 两分钟到！');
      }
    }, 1000);
  }

  /* MediaRecorder 录音 */
  var recs = {}, blobUrls = {};
  function startRecorder(id) {
    var area = document.getElementById('rec-area-' + id);
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      area.innerHTML = '<div class="tip3">当前浏览器不支持录音（file:// 下部分浏览器会限制麦克风），可改用手机计时自练。</div>';
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var chunks = [], mr = new MediaRecorder(stream);
      mr.ondataavailable = function (e) { chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
        // 释放本题卡上一条 blob URL，避免泄漏
        (blobUrls[id] || []).forEach(function (u) { URL.revokeObjectURL(u); });
        blobUrls[id] = [url];
        area.innerHTML = '<div style="text-align:center;margin-top:8px"><span class="small muted">回听你的作答：</span><br>' +
          '<audio controls src="' + url + '" style="margin-top:8px;width:100%"></audio></div>';
      };
      recs[id] = mr; mr.start();
      area.innerHTML = '<div style="text-align:center;color:var(--cinnabar);font-size:13.5px;margin-top:6px"><span class="rec-dot"></span>录音中…再次点击其他按钮会自动停止</div>';
    }).catch(function () {
      area.innerHTML = '<div class="tip3">麦克风权限被拒绝，可在浏览器地址栏允许麦克风后重试。</div>';
    });
  }
  function stopRecorder(id) { if (recs[id] && recs[id].state !== 'inactive') recs[id].stop(); }
  function stopAllRecorders() {
    Object.keys(recs).forEach(function (rid) { stopRecorder(rid); });
  }

  /* ---------------- 安卓 App：版本徽章 + 朗读诊断面板 ---------------- */
  function setupAndroidDiagnostics() {
    if (!window.AndroidTts || !AndroidTts.getAppVersion) return;
    var ver = '';
    try { ver = AndroidTts.getAppVersion() || ''; } catch (e) { return; }

    var badge = document.createElement('button');
    badge.className = 'app-diag-badge';
    badge.textContent = 'App v' + ver.replace('#', ' b') + ' · 🔊 朗读诊断';
    badge.onclick = openDiag;
    document.body.appendChild(badge);

    var mask = document.createElement('div');
    mask.className = 'app-diag-mask';
    mask.style.display = 'none';
    mask.innerHTML =
      '<div class="app-diag-panel">' +
        '<div class="app-diag-head"><b>朗读诊断</b><button class="btn btn-ghost btn-sm" id="diag-close">关闭</button></div>' +
        '<div id="diag-body" class="app-diag-body">读取中…</div>' +
        '<div class="app-diag-actions" id="diag-actions"></div>' +
      '</div>';
    document.body.appendChild(mask);
    document.getElementById('diag-close').onclick = function () { mask.style.display = 'none'; };
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.style.display = 'none'; });

    function row(label, val, bad) {
      return '<div class="diag-row' + (bad ? ' diag-bad' : '') + '"><span>' + esc(label) +
        '</span><b>' + esc(String(val)) + '</b></div>';
    }
    function langCodeText(c) {
      if (c === -99) return '未探测';
      if (c >= 0) return '✓ 可用 (' + c + ')';
      if (c === -1) return '✗ 缺语音数据 (-1)';
      if (c === -2) return '✗ 不支持 (-2)';
      return String(c);
    }
    function render() {
      var info;
      try { info = JSON.parse(AndroidTts.getTtsDebug()); } catch (e) { info = { error: String(e) }; }
      var html = '';
      if (info.error) {
        html = '<div class="diag-row diag-bad"><span>诊断错误</span><b>' + esc(info.error) + '</b></div>';
      } else {
        var volBad = info.mediaVol === 0;
        html += row('安装包版本', info.version);
        if (window.__androidTtsPolyfill) {
          var pfMode = window.__androidTtsPolyfill.getMode();
          html += row('朗读通道', pfMode === 'online'
            ? '🌐 在线语音（系统引擎失效，自动兜底中）'
            : '系统 TTS 引擎（失效会自动转在线）', pfMode === 'online');
          if (pfMode === 'online') {
            html += '<div class="diag-note diag-bad">系统引擎静默失效，朗读已自动改用在线语音（百度/有道，需联网）。'
              + '装好可用引擎并试播正常后，点下方「恢复系统引擎朗读」。</div>';
          }
        }
        html += row('TTS 引擎就绪', info.ready ? '✓ 是' : '✗ 否', !info.ready);
        html += row('初始化状态', info.initStatus + (info.initStatus === 0 ? '（SUCCESS）' : ''), info.initStatus !== 0);
        html += row('系统引擎', info.engine || '（默认）');
        html += row('英式英语', langCodeText(info.avail && info.avail.enGB));
        html += row('美式英语', langCodeText(info.avail && info.avail.enUS));
        html += row('普通话', langCodeText(info.avail && info.avail.zhCN));
        html += row('当前语言', info.currentLang + '（setLanguage rc=' + info.lastSetLangResult + '）');
        html += row('媒体音量', info.mediaVol + ' / ' + info.mediaMax, volBad);
        html += row('铃声模式', ['静音', '振动', '正常'][info.ringerMode] != null ? ['静音', '振动', '正常'][info.ringerMode] : info.ringerMode);
        html += row('安全区(px)', '上' + info.insets.t + ' 下' + info.insets.b + ' 左' + info.insets.l + ' 右' + info.insets.r,
          !(info.insets.t > 0));
        if (volBad) {
          html += '<div class="diag-note diag-bad">媒体音量为 0：TTS 走媒体声道会完全无声，点下面「媒体音量＋」或按机身音量键。</div>';
        }
        if (info.avail && info.avail.zhCN < 0) {
          html += '<div class="diag-note diag-bad">普通话语音不可用：点「系统 TTS 设置」换引擎或下载中文语音数据。</div>';
        }
        if (info.noStart) {
          html += '<div class="diag-note diag-bad">⚠ 引擎接单后 3 秒没有开始发声（' + esc(info.noStart) +
            '）：当前引擎已静默失效（云引擎常见，如讯飞语音云）。请在下方换一个引擎后再点试播。</div>';
        }
        html += '<div id="diag-engines"></div>';
        html += '<div class="diag-log-title">事件日志（最近）</div>';
        html += '<pre class="diag-log">' + esc(((info.events || []).slice(-14)).join('\n') || '（暂无）') + '</pre>';
      }
      document.getElementById('diag-body').innerHTML = html;
      renderEngines();
    }
    function renderEngines() {
      var box = document.getElementById('diag-engines');
      if (!box) return;
      if (!AndroidTts.getEnginesJson) { box.innerHTML = ''; return; }
      var list;
      try { list = JSON.parse(AndroidTts.getEnginesJson()); } catch (e) { list = null; }
      if (!list || !list.length) { box.innerHTML = '<div class="diag-note">未读到其它已安装引擎，可点「系统 TTS 设置」安装/启用。</div>'; return; }
      var h = '<div class="diag-log-title">已安装 TTS 引擎（点按钮直接切换，切完自动重连）</div><div class="diag-engines">';
      list.forEach(function (e) {
        h += '<button type="button" class="btn btn-sm ' + (e.current ? 'btn-dark' : 'btn-ghost') +
          '" data-pkg="' + encodeURIComponent(e.pkg) + '">' + esc(e.label) +
          (e.current ? ' ✓当前' : '　切换') + '</button>';
      });
      h += '</div>';
      box.innerHTML = h;
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
        b.onclick = function () {
          var pkg = decodeURIComponent(b.getAttribute('data-pkg'));
          b.disabled = true;
          b.textContent = '切换中…';
          try { AndroidTts.switchEngine(pkg); } catch (e) {}
          // 引擎重绑+初始化约 1-2.5s，到时刷新状态与引擎高亮
          setTimeout(function () { render(); }, 2600);
        };
      });
    }
    function btn(id, text, fn) {
      var b = document.createElement('button');
      b.className = 'btn btn-ghost btn-sm'; b.id = id; b.textContent = text;
      b.onclick = fn;
      document.getElementById('diag-actions').appendChild(b);
    }
    function openDiag() {
      mask.style.display = 'flex';
      document.getElementById('diag-actions').innerHTML = '';
      render();
      btn('diag-en', '🔊 英文试播(直连引擎)', function () {
        try { AndroidTts.ttsTest('Good morning. This is an English voice test.', 'en-GB'); } catch (e) {}
        setTimeout(render, 1200);
        setTimeout(render, 3600);   // 等 NO-START 看门狗结论
      });
      btn('diag-app-en', '🔊 应用朗读试播(当前通道)', function () {
        try {
          speechSynthesis.cancel();
          var au = new SpeechSynthesisUtterance('Good morning. This is the in-app voice test.');
          au.lang = 'en-GB';
          speechSynthesis.speak(au);
        } catch (e) {}
        setTimeout(render, 1600);
        setTimeout(render, 3600);
      });
      btn('diag-mode', '🌐 切换在线/系统朗读', function () {
        if (!window.__androidTtsPolyfill) return;
        var nowOnline = window.__androidTtsPolyfill.getMode() === 'online';
        window.__androidTtsPolyfill.setMode(nowOnline ? 'auto' : 'online');
        render();
        toast(nowOnline ? '已恢复系统引擎优先（下一句生效）' : '已强制在线语音朗读（需联网）');
      });
      btn('diag-zh', '🔊 中文试播', function () {
        try { AndroidTts.ttsTest('这是中文语音测试，一二三四五。', 'zh-CN'); } catch (e) {}
        setTimeout(render, 1200);
        setTimeout(render, 3600);
      });
      btn('diag-beep', '🔔 测试音（媒体声道）', function () {
        try { AndroidTts.playBeep(); } catch (e) {}
        setTimeout(render, 600);
      });
      btn('diag-volup', '媒体音量＋', function () { try { AndroidTts.volumeUp(); } catch (e) {} setTimeout(render, 300); });
      btn('diag-voldown', '媒体音量－', function () { try { AndroidTts.volumeDown(); } catch (e) {} setTimeout(render, 300); });
      btn('diag-refresh', '刷新状态', render);
      btn('diag-settings', '系统 TTS 设置', function () { try { AndroidTts.openTtsSettings(); } catch (e) {} });
    }
  }
  setupAndroidDiagnostics();

  /* ---------------- 初始化 ---------------- */
  renderWordChips();
  startCard('all');
  renderListen();
  renderReadingList();
  renderWritingList();
  renderWritingWork();
  renderSpeaking();
  renderDashboard();
  if (location.hash) {
    var h = location.hash.slice(1);
    if (document.getElementById('page-' + h)) go(h);
  }
})();
