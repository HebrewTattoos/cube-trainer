/* Verbal & verbal-reasoning modules (task text is German, app chrome is English).
 *
 * Modules: analogies, similarities, classification, sentences, synonyms, anagrams, vocabulary, knowledge (domain "verbal"),
 *          syllogisms, ranking (domain "reasoning").
 * Data lives in mod-verbal-data.js (load it first in the browser). Every question is built from curated data plus an
 * explicit check that the wrong options are provably wrong (blacklists, disjoint categories, letter counts, model checking,
 * brute force over all orderings). The test file tests/verbal.test.js re-verifies all of this independently.
 */
(function (root) {
  'use strict';
  const T = root.Trainer || require('./core.js');
  const D = root.VerbalData || require('./mod-verbal-data.js');
  const { ri, pick, shuffle, sample, esc } = T.util;

  // ---------- shared helpers ----------
  // weighted pick of an array of [value, weight]
  const wpick = (pairs, rng) => T.util.weighted(pairs, rng);
  const isLower = (s) => s[0] === s[0].toLowerCase() && s[0] !== s[0].toUpperCase();
  // Build a multiple-choice question body: correct answer + wrong answers (deduplicated) -> {options, answer}.
  function mc(correct, wrongs, rng, k) {
    const seen = new Set([correct]);
    const w = [];
    shuffle(wrongs.slice(), rng).forEach((x) => { if (!seen.has(x)) { seen.add(x); w.push(x); } });
    const opts = shuffle([correct].concat(w.slice(0, (k || 5) - 1)), rng);
    return { options: opts, answer: opts.indexOf(correct) };
  }
  const allShort = (arr, n) => arr.every((s) => String(s).length <= (n || 16));
  const lvIdx = (level) => ({ easy: 0, medium: 1, hard: 2 }[level]);
  const ORD = ['', 'erster', 'zweiter', 'dritter', 'vierter', 'fünfter', 'sechster'];

  // ======================================================================================
  // 1. ANALOGIES
  // ======================================================================================
  const ANA = D.analogies;
  const ANA_RELS = Object.keys(ANA);
  // words that appear together with a word in any pair of any relation (never allowed as distractor for that word)
  const anaNeigh = Object.create(null);
  const addNeigh = (a, b) => { (anaNeigh[a] = anaNeigh[a] || new Set()).add(b); };
  ANA_RELS.forEach((r) => ANA[r].pairs.forEach((p) => {
    const all = [p.a].concat(p.ok);
    all.forEach((x) => all.forEach((y) => { if (x !== y) addNeigh(x, y); }));
  }));
  // words related through the synonym bank
  const synRel = Object.create(null);
  D.syn.forEach((e) => {
    const all = [e.head].concat(e.syn, e.ant, e.forb);
    all.forEach((x) => all.forEach((y) => { if (x !== y) (synRel[x] = synRel[x] || new Set()).add(y); }));
  });
  const ANA_B_ALL = [];
  ANA_RELS.forEach((r) => ANA[r].pairs.forEach((p) => ANA_B_ALL.push(p.b)));
  function anaForbidden(c, ok) {
    const s = new Set(ok);
    (anaNeigh[c] || []).forEach((x) => s.add(x));
    (synRel[c] || []).forEach((x) => s.add(x));
    return s;
  }
  const ANA_WEIGHTS = {
    easy: (r) => (r.lv.indexOf(1) >= 0 ? 3 : 0.4),
    medium: (r) => (r.lv.indexOf(2) >= 0 ? 3 : 0.8),
    hard: (r) => (r.lv.indexOf(3) >= 0 ? 3 : 1.2),
  };
  function makeAnalogy(level, rng) {
    const relPairs = ANA_RELS.map((k) => [ANA[k], ANA_WEIGHTS[level](ANA[k])]);
    for (let guard = 0; guard < 50; guard++) {
      const rel = wpick(relPairs, rng);
      const pool = rel.pairs.filter((p) => (level === 'hard' ? true : !p.hard) || rng() < 0.15);
      if (pool.length < 2) continue;
      const p1 = pick(pool, rng), p2 = pick(pool, rng);
      if (p1 === p2) continue;
      const stem = new Set([p1.a, p1.b, p2.a, p2.b]);
      if (stem.size < 4) continue;
      // the stem must not accidentally be ambiguous: the answer for p2.a is exactly the bank answer; p1.b must not be valid for p2.a
      if (p2.ok.indexOf(p1.b) >= 0 || p1.ok.indexOf(p2.b) >= 0 || p1.ok.indexOf(p2.a) >= 0) continue;
      const forb = anaForbidden(p2.a, p2.ok);
      stem.forEach((x) => forb.add(x));
      const lower = isLower(p2.b);
      const ok = (w) => !forb.has(w) && isLower(w) === lower;
      const same = shuffle(rel.pairs.map((p) => p.b).filter(ok), rng);
      const sameA = shuffle(rel.pairs.map((p) => p.a).filter(ok), rng);
      const other = shuffle(ANA_B_ALL.filter(ok), rng);
      const cand = [];
      const take = (arr, n) => { for (const w of arr) { if (n <= 0) break; if (cand.indexOf(w) < 0) { cand.push(w); n--; } } };
      take(same, 2); take(sameA, 1); take(other, 4);
      if (cand.length < 4) continue;
      const built = mc(p2.b, cand, rng, 5);
      if (built.options.length < 5) continue;
      return {
        lang: 'de',
        prompt: 'Welches Wort ergänzt die Analogie?',
        stimulus: '<div class="plain" style="font-size:1.4em;text-align:center">' + esc(p1.a) + ' : ' + esc(p1.b) + ' = ' + esc(p2.a) + ' : ?</div>',
        stimulusClass: 'plain',
        options: built.options, answer: built.answer,
        optionStyle: allShort(built.options, 18) ? 'grid' : 'text',
        explain: esc0(p1.a) + ' und ' + esc0(p1.b) + ' stehen im Verhältnis „' + rel.name + '“. Genauso gehört zu ' + p2.a + ' das Wort „' + p2.b + '“.',
        meta: { rel: rel.id, A: p1.a, B: p1.b, C: p2.a, answer: p2.b, valid: p2.ok.slice() },
      };
    }
    throw new Error('analogy generation failed');
  }
  function esc0(s) { return String(s); }

  // ======================================================================================
  // category engine (similarities + classification)
  // ======================================================================================
  const CATS = D.cats;
  const CAT_LABELS = Object.keys(CATS);
  const children = {};
  CAT_LABELS.forEach((l) => CATS[l].parents.forEach((p) => { (children[p] = children[p] || []).push(l); }));
  const ancCache = {};
  function ancestors(l) {
    if (ancCache[l]) return ancCache[l];
    const s = new Set([l]);
    CATS[l].parents.forEach((p) => ancestors(p).forEach((x) => s.add(x)));
    ancCache[l] = s;
    return s;
  }
  const wordTags = Object.create(null);   // word -> Set of tags (closure)
  CAT_LABELS.forEach((l) => CATS[l].direct.forEach((w) => {
    const s = (wordTags[w] = wordTags[w] || new Set());
    ancestors(l).forEach((t) => s.add(t));
  }));
  const tagMembers = Object.create(null); // tag -> words (closure)
  Object.keys(wordTags).forEach((w) => wordTags[w].forEach((t) => { (tagMembers[t] = tagMembers[t] || []).push(w); }));
  const AMBIG = new Set(D.simAmbiguous);
  const simMembers = Object.create(null);
  Object.keys(tagMembers).forEach((t) => { simMembers[t] = tagMembers[t].filter((w) => !AMBIG.has(w)); });
  const SIM_TAGS = Object.keys(simMembers).filter((t) => simMembers[t].length >= 3);
  const LEAVES = CAT_LABELS.filter((l) => CATS[l].leaf);
  const noPair = (a, b) => D.noPair.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const ODD_AMB = new Set(D.oddAmbiguous);

  // ======================================================================================
  // 2. SIMILARITIES
  // ======================================================================================
  function makeSimilarity(level, rng) {
    const k = level === 'hard' ? 3 : 2;
    for (let guard = 0; guard < 80; guard++) {
      let pool;
      if (level === 'easy') pool = SIM_TAGS.filter((t) => !children[t] && simMembers[t].length >= 4);
      else if (level === 'medium') pool = SIM_TAGS.filter((t) => simMembers[t].length >= 3);
      else pool = SIM_TAGS.filter((t) => children[t] || simMembers[t].length >= 5);
      if (!pool.length) pool = SIM_TAGS;
      const T0 = pick(pool, rng);
      let words = [];
      const kids = (children[T0] || []).filter((c) => simMembers[c] && simMembers[c].length);
      if (kids.length && level !== 'easy') {
        shuffle(kids.slice(), rng).forEach((c) => { if (words.length < k) words.push(pick(simMembers[c].filter((w) => words.indexOf(w) < 0), rng)); });
      }
      const rest = shuffle(simMembers[T0].filter((w) => words.indexOf(w) < 0), rng);
      while (words.length < k && rest.length) words.push(rest.pop());
      words = words.filter(Boolean);
      if (words.length < k || new Set(words).size < k) continue;
      // intersection of all tag sets
      let inter = null;
      words.forEach((w) => { inter = inter ? new Set([...inter].filter((t) => wordTags[w].has(t))) : new Set(wordTags[w]); });
      if (!inter.has(T0)) continue;
      const blocked = new Set();
      words.forEach((w) => wordTags[w].forEach((t) => blocked.add(t)));
      const bad = (t) => {
        if (inter.has(t) || t === T0) return true;
        const nw = D.noWith[t];
        return nw ? nw.some((x) => blocked.has(x)) : false;
      };
      const fam = CATS[T0].fam;
      const cands = shuffle(SIM_TAGS.filter((t) => !bad(t)), rng);
      const tempting = cands.filter((t) => CATS[t].fam === fam);
      const other = cands.filter((t) => CATS[t].fam !== fam);
      const chosen = tempting.slice(0, 2).concat(other.slice(0, 2));
      for (const t of tempting.slice(2).concat(other.slice(2))) { if (chosen.length >= 4) break; if (chosen.indexOf(t) < 0) chosen.push(t); }
      if (chosen.length < 4) continue;
      const lead = k === 2 ? 'Beides sind ' : 'Alle drei sind ';
      const text = (t) => lead + t + '.';
      const built = mc(text(T0), chosen.map(text), rng, 5);
      const names = k === 2 ? words[0] + ' und ' + words[1] : words[0] + ', ' + words[1] + ' und ' + words[2];
      return {
        lang: 'de',
        prompt: 'Was haben ' + names + ' gemeinsam?',
        options: built.options, answer: built.answer, optionStyle: 'text',
        explain: names + ' sind ' + (k === 2 ? 'beides ' : 'alle drei ') + T0 + '. Die anderen Aussagen treffen nicht auf alle zu.',
        meta: { words, target: T0, distractors: chosen },
      };
    }
    throw new Error('similarity generation failed');
  }

  // ======================================================================================
  // 3. CLASSIFICATION (odd word out + umbrella term)
  // ======================================================================================
  function leafMembers(l) { return tagMembers[l] || []; }
  const ODD_FAMS = {};
  LEAVES.forEach((l) => { (ODD_FAMS[CATS[l].fam] = ODD_FAMS[CATS[l].fam] || []).push(l); });
  function pickOtherLeaf(L, level, rng) {
    const ok = LEAVES.filter((m) => m !== L && !noPair(L, m));
    if (level === 'hard') {
      const near = (D.near[L] || []).filter((m) => ok.indexOf(m) >= 0);
      if (near.length) return pick(near, rng);
      const sameFam = ok.filter((m) => CATS[m].fam === CATS[L].fam);
      if (sameFam.length) return pick(sameFam, rng);
    }
    if (level === 'easy') {
      const far = ok.filter((m) => CATS[m].fam !== CATS[L].fam);
      if (far.length) return pick(far, rng);
    }
    return pick(ok, rng);
  }
  function makeClassification(level, rng) {
    const L = pick(LEAVES, rng);
    if (rng() < 0.72) {
      // odd word out
      const M = pickOtherLeaf(L, level, rng);
      const four = sample(leafMembers(L), 4, rng);
      const oddPool = leafMembers(M).filter((w) => !ODD_AMB.has(w) && leafMembers(L).indexOf(w) < 0);
      const odd = pick(oddPool, rng);
      const opts = shuffle(four.concat([odd]), rng);
      return {
        lang: 'de',
        prompt: 'Welches Wort passt nicht zu den anderen?',
        options: opts, answer: opts.indexOf(odd), optionStyle: 'grid',
        explain: 'Vier Wörter gehören zu: ' + L + '. „' + odd + '“ gehört zu: ' + M + '.',
        meta: { variant: 'odd', cat: L, odd, other: M, four },
      };
    }
    // umbrella term
    const n = level === 'easy' ? 3 : (rng() < 0.5 ? 3 : 4);
    const words = sample(leafMembers(L), n, rng);
    const candidates = LEAVES.filter((m) => m !== L && !noPair(L, m));
    let wrong;
    if (level === 'hard') {
      const near = (D.near[L] || []).filter((m) => candidates.indexOf(m) >= 0);
      const sameFam = candidates.filter((m) => CATS[m].fam === CATS[L].fam && near.indexOf(m) < 0);
      wrong = shuffle(near, rng).concat(shuffle(sameFam, rng));
    } else if (level === 'easy') {
      wrong = shuffle(candidates.filter((m) => CATS[m].fam !== CATS[L].fam), rng);
    } else wrong = shuffle(candidates, rng);
    wrong = wrong.concat(shuffle(candidates, rng));
    const built = mc(L, wrong, rng, 5);
    return {
      lang: 'de',
      prompt: 'Welcher Oberbegriff passt zu: ' + words.join(', ') + '?',
      options: built.options, answer: built.answer, optionStyle: allShort(built.options, 14) ? 'grid' : 'text',
      explain: words.join(', ') + ' sind alle ' + L + '. Die anderen Begriffe passen zu keinem dieser Wörter.',
      meta: { variant: 'umbrella', cat: L, words },
    };
  }

  // ======================================================================================
  // 4. SENTENCES
  // ======================================================================================
  const SENT_BY = { easy: [], medium: [], hard: [] };
  D.sentences.forEach((s) => SENT_BY[['easy', 'medium', 'hard'][s.lvl - 1]].push(s));
  function makeSentence(level, rng) {
    const pairs = level === 'easy' ? [[1, 8], [2, 2]] : level === 'medium' ? [[2, 8], [1, 1], [3, 2]] : [[3, 8], [2, 3]];
    const lv = wpick(pairs, rng);
    const item = pick(SENT_BY[['easy', 'medium', 'hard'][lv - 1]], rng);
    const wrong4 = sample(item.wrong, 4, rng);
    const opts = shuffle([item.answer].concat(wrong4.map((w) => w.w)), rng);
    const why = pick(wrong4, rng);
    return {
      lang: 'de',
      prompt: 'Welches Wort ergänzt den Satz richtig?',
      stimulus: '<div style="font-size:1.2em;line-height:1.5">' + esc(item.text) + '</div>',
      stimulusClass: 'plain',
      options: opts, answer: opts.indexOf(item.answer),
      optionStyle: allShort(opts, 12) ? 'grid' : 'text',
      explain: 'Richtig ist „' + item.answer + '“. Zum Beispiel „' + why.w + '“ passt nicht: ' + why.why,
      meta: { id: item.id, wrong: wrong4.map((w) => w.w) },
    };
  }

  // ======================================================================================
  // 5. SYNONYMS / ANTONYMS
  // ======================================================================================
  const SYN = D.syn;
  const synFam = Object.create(null); // word -> Set of every word that shares a line with it (strict "related" graph)
  SYN.forEach((e) => {
    const all = [e.head].concat(e.syn, e.ant, e.forb);
    all.forEach((x) => { const s = (synFam[x] = synFam[x] || new Set()); all.forEach((y) => s.add(y)); });
  });
  const SYN_WORDS = { a: new Set(), n: new Set(), v: new Set() };
  SYN.forEach((e) => { SYN_WORDS[e.pos].add(e.head); e.syn.concat(e.ant).forEach((w) => SYN_WORDS[e.pos].add(w)); });
  const SYN_WORDS_ARR = { a: [...SYN_WORDS.a], n: [...SYN_WORDS.n], v: [...SYN_WORDS.v] };
  function makeSynonym(level, rng) {
    const w = level === 'easy' ? [[1, 8], [2, 2]] : level === 'medium' ? [[2, 7], [1, 1.5], [3, 1.5]] : [[3, 7], [2, 3]];
    for (let guard = 0; guard < 60; guard++) {
      const lv = wpick(w, rng);
      const e = pick(SYN.filter((x) => x.lvl === lv), rng);
      const wantAnt = e.ant.length && rng() < 0.4;
      const correct = pick(wantAnt ? e.ant : e.syn, rng);
      const bad = new Set([e.head, correct]);
      (synFam[e.head] || []).forEach((x) => bad.add(x));
      (synFam[correct] || []).forEach((x) => bad.add(x));
      const pool = SYN_WORDS_ARR[e.pos].filter((x) => !bad.has(x) && isLower(x) === isLower(e.head));
      if (pool.length < 4) continue;
      const built = mc(correct, sample(pool, 6, rng), rng, 5);
      return {
        lang: 'de',
        prompt: wantAnt ? 'Welches Wort bedeutet das Gegenteil von „' + e.head + '“?' : 'Welches Wort hat die gleiche Bedeutung wie „' + e.head + '“?',
        options: built.options, answer: built.answer, optionStyle: allShort(built.options, 18) ? 'grid' : 'text',
        explain: wantAnt ? '„' + correct + '“ ist das Gegenteil von „' + e.head + '“.' : '„' + correct + '“ ist ein Synonym von „' + e.head + '“.',
        meta: { head: e.head, kind: wantAnt ? 'ant' : 'syn', answer: correct },
      };
    }
    throw new Error('synonym generation failed');
  }

  // ======================================================================================
  // 6. ANAGRAMS
  // ======================================================================================
  const ANAG = D.anag;
  const ANAG_CATS = Object.keys(ANAG);
  const KNOWN_WORDS = new Set();
  ANAG_CATS.forEach((c) => ANAG[c].forEach((w) => KNOWN_WORDS.add(w.toLowerCase())));
  Object.keys(wordTags).forEach((w) => KNOWN_WORDS.add(w.toLowerCase()));
  SYN.forEach((e) => [e.head].concat(e.syn, e.ant).forEach((w) => KNOWN_WORDS.add(w.toLowerCase())));
  D.vocab.forEach((v) => KNOWN_WORDS.add(v.word.toLowerCase()));
  const sortedLetters = (w) => w.toLowerCase().split('').sort().join('');
  const LEN_RANGE = { easy: [4, 5], medium: [6, 7], hard: [8, 10] };
  function scramble(word, rng) {
    const letters = word.toLowerCase().split('');
    const n = letters.length;
    for (let tries = 0; tries < 200; tries++) {
      const s = shuffle(letters.slice(), rng);
      let moved = 0;
      for (let i = 0; i < n; i++) if (s[i] !== letters[i]) moved++;
      const str = s.join('');
      if (moved >= Math.ceil(n * 0.7) && str !== word.toLowerCase() && !KNOWN_WORDS.has(str)) return str;
    }
    return null;
  }
  function makeAnagram(level, rng) {
    const [lo, hi] = LEN_RANGE[level];
    for (let guard = 0; guard < 80; guard++) {
      const cat = pick(ANAG_CATS, rng);
      const words = ANAG[cat].filter((w) => w.length >= lo && w.length <= hi);
      if (!words.length) continue;
      const word = pick(words, rng);
      const sc = scramble(word, rng);
      if (!sc) continue;
      const key = sortedLetters(word);
      const same = shuffle(ANAG[cat].filter((w) => w !== word && sortedLetters(w) !== key && Math.abs(w.length - word.length) <= 2), rng);
      const far = shuffle(ANAG[cat].filter((w) => w !== word && sortedLetters(w) !== key), rng);
      const wrong = same.slice(0, 4).concat(far);
      const built = mc(word, wrong, rng, 5);
      if (built.options.length < 5) continue;
      return {
        lang: 'de',
        prompt: 'Ordnen Sie die Buchstaben (Kategorie: ' + cat + '): ' + sc.toUpperCase(),
        options: built.options, answer: built.answer, optionStyle: 'grid',
        typedAnswer: word,
        explain: 'Die Buchstaben ' + sc.toUpperCase() + ' ergeben das Wort „' + word + '“.',
        meta: { word, scramble: sc, cat },
      };
    }
    throw new Error('anagram generation failed');
  }

  // ======================================================================================
  // 7. VOCABULARY
  // ======================================================================================
  const VOC = D.vocab;
  const VOC_BY = { easy: [], medium: [], hard: [] };
  VOC.forEach((v) => VOC_BY[['easy', 'medium', 'hard'][v.lvl - 1]].push(v));
  const MISS_EASY = new Set(['Maschine', 'vielleicht', 'Standard', 'Wahrheit', 'Nachbar', 'Mannschaft', 'Thema', 'Theater', 'Adresse', 'Paket', 'Quelle', 'Rücksicht', 'Entschuldigung', 'pünktlich', 'Tabelle', 'Millionen', 'Ahnung', 'Fieber', 'Interesse', 'Prozent']);
  const MISS_HARD = new Set(['Rhythmus', 'Rhabarber', 'Labyrinth', 'Syndrom', 'Symmetrie', 'Hypothese', 'Konkurrenz', 'Satellit', 'Kommissar', 'Ingenieur', 'Lexikon', 'Sekretär', 'Existenz', 'Lawine', 'Vegetarier', 'Philosophie', 'Katastrophe', 'Atmosphäre', 'Quittung', 'Akkord', 'Diktat']);
  const MISS = D.misspell;
  const MISS_CORRECT = MISS.map((p) => p[0]);
  function missLevel(c) { return MISS_EASY.has(c) ? 'easy' : MISS_HARD.has(c) ? 'hard' : 'medium'; }
  function makeVocabulary(level, rng) {
    const r = rng();
    const pm = level === 'easy' ? 0.25 : level === 'medium' ? 0.2 : 0.2;
    if (r < pm) {
      // misspelled word
      let pool = MISS.filter((p) => missLevel(p[0]) === level);
      if (pool.length < 5) pool = MISS;
      const p = pick(pool, rng);
      const goods = sample(MISS_CORRECT.filter((c) => c !== p[0]), 4, rng);
      const opts = shuffle(goods.concat([p[1]]), rng);
      return {
        lang: 'de',
        prompt: 'Welches Wort ist falsch geschrieben?',
        options: opts, answer: opts.indexOf(p[1]), optionStyle: 'grid',
        explain: 'Richtig geschrieben heißt es „' + p[0] + '“, nicht „' + p[1] + '“.',
        meta: { variant: 'miss', correct: p[0], wrong: p[1], goods },
      };
    }
    const pairs = level === 'easy' ? [[1, 7], [2, 3]] : level === 'medium' ? [[2, 7], [1, 1.5], [3, 1.5]] : [[3, 7], [2, 3]];
    const lv = wpick(pairs, rng);
    const v = pick(VOC.filter((x) => x.lvl === lv), rng);
    const others = VOC.filter((x) => x.grp !== v.grp && x.word !== v.word && isLower(x.def) === isLower(v.def));
    if (rng() < 0.62) {
      const built = mc(v.def, sample(others, 6, rng).map((x) => x.def), rng, 5);
      return {
        lang: 'de',
        prompt: 'Was bedeutet „' + v.word + '“?',
        options: built.options, answer: built.answer, optionStyle: 'text',
        explain: '„' + v.word + '“ bedeutet: ' + v.def + '.',
        meta: { variant: 'def', word: v.word, grp: v.grp },
      };
    }
    const built = mc(v.word, sample(others, 6, rng).map((x) => x.word), rng, 5);
    return {
      lang: 'de',
      prompt: 'Welches Wort ist ein Fremdwort oder gehobenes Wort für: ' + v.def + '?',
      options: built.options, answer: built.answer, optionStyle: 'grid',
      explain: '„' + v.word + '“ bedeutet: ' + v.def + '.',
      meta: { variant: 'rev', word: v.word, grp: v.grp },
    };
  }

  // ======================================================================================
  // 8. GENERAL KNOWLEDGE
  // ======================================================================================
  const KN_BY = { easy: [], medium: [], hard: [] };
  D.knowledge.forEach((k) => KN_BY[['easy', 'medium', 'hard'][k.lvl - 1]].push(k));
  function makeKnowledge(level, rng) {
    const pairs = level === 'easy' ? [[1, 8], [2, 2]] : level === 'medium' ? [[2, 7], [1, 1.5], [3, 1.5]] : [[3, 7], [2, 3]];
    const lv = wpick(pairs, rng);
    const it = pick(KN_BY[['easy', 'medium', 'hard'][lv - 1]], rng);
    const built = mc(it.answer, sample(it.wrong, 6, rng), rng, 5);
    return {
      lang: 'de',
      prompt: it.q,
      options: built.options, answer: built.answer,
      optionStyle: allShort(built.options, 20) ? 'grid' : 'text',
      explain: 'Richtig ist: ' + it.answer + '. (Thema: ' + it.topic + ')',
      meta: { id: it.id, topic: it.topic },
    };
  }

  // ======================================================================================
  // 9. SYLLOGISMS (exhaustive model checking over the 8 Venn regions of 3 terms)
  // ======================================================================================
  // statement = { t: 'A'|'E'|'I'|'O', x, y } with terms 0..2; region r (0..7) has bit i set iff it lies in term i.
  function stmtMask(s) {
    // universal: mask of regions that are FORBIDDEN; existential: mask of regions that WITNESS the statement
    let m = 0;
    for (let r = 0; r < 8; r++) {
      const inx = (r >> s.x) & 1, iny = (r >> s.y) & 1;
      if (s.t === 'A' && inx && !iny) m |= 1 << r;
      if (s.t === 'E' && inx && iny) m |= 1 << r;
      if (s.t === 'I' && inx && iny) m |= 1 << r;
      if (s.t === 'O' && inx && !iny) m |= 1 << r;
    }
    return m;
  }
  const holds = (s, model) => ((s.t === 'A' || s.t === 'E') ? (model & stmtMask(s)) === 0 : (model & stmtMask(s)) !== 0);
  // returns 'follows' | 'contradicts' | 'open' | null (premises unsatisfiable)
  function syllogismVerdict(premises, concl) {
    let any = false, allT = true, allF = true;
    for (let model = 0; model < 256; model++) {
      let ok = true;
      for (const p of premises) { if (!holds(p, model)) { ok = false; break; } }
      if (!ok) continue;
      any = true;
      if (holds(concl, model)) allF = false; else allT = false;
      if (!allT && !allF) return 'open';
    }
    if (!any) return null;
    return allT ? 'follows' : 'contradicts';
  }
  const SYL_OPTIONS = ['Die Schlussfolgerung folgt zwingend.', 'Die Schlussfolgerung widerspricht den Aussagen.', 'Die Schlussfolgerung ist nicht entscheidbar.'];
  const SYL_KEYS = ['follows', 'contradicts', 'open'];
  function sylText(s, terms) {
    const X = terms[s.x], Y = terms[s.y];
    const art = 'ein';
    if (s.t === 'A') return 'Alle ' + X[2] + ' sind ' + Y[2] + '.';
    if (s.t === 'E') return 'Kein ' + X[0] + ' ist ' + art + ' ' + Y[0] + '.';
    if (s.t === 'I') return 'Einige ' + X[2] + ' sind ' + Y[2] + '.';
    return 'Einige ' + X[2] + ' sind keine ' + Y[2] + '.';
  }
  const stmtKey = (s) => s.t + s.x + s.y;
  function randStmt(x, y, w, rng) { return { t: wpick(w, rng), x, y }; }
  function makeSyllogism(level, rng) {
    const target = Math.floor(rng() * 3);
    const triple = pick(D.sylTerms, rng);
    const perm = shuffle([0, 1, 2], rng);
    const terms = perm.map((i) => triple[i]);
    const wEasy = [['A', 5], ['E', 3], ['I', 2], ['O', 1]];
    const wAll = [['A', 3], ['E', 3], ['I', 3], ['O', 3]];
    let last = null;
    for (let guard = 0; guard < 400; guard++) {
      let premises, concl;
      if (level === 'easy') {
        // chain X-Y, Y-Z (clear syllogistic structure), conclusion about X and Z
        const swap = rng() < 0.5;
        premises = [randStmt(0, 1, wEasy, rng), randStmt(1, 2, wEasy, rng)];
        if (swap) premises.reverse();
        concl = randStmt(rng() < 0.5 ? 0 : 2, null, wAll, rng);
        concl.y = concl.x === 0 ? 2 : 0;
      } else if (level === 'medium') {
        const mid = ri(0, 2, rng);
        const e = [0, 1, 2].filter((i) => i !== mid);
        const dir = () => (rng() < 0.5);
        const p1 = dir() ? { x: e[0], y: mid } : { x: mid, y: e[0] };
        const p2 = dir() ? { x: e[1], y: mid } : { x: mid, y: e[1] };
        premises = [Object.assign(p1, { t: wpick(wAll, rng) }), Object.assign(p2, { t: wpick(wAll, rng) })];
        const c = dir() ? { x: e[0], y: e[1] } : { x: e[1], y: e[0] };
        concl = Object.assign(c, { t: wpick(wAll, rng) });
      } else {
        const pairs = [[0, 1], [1, 2], [0, 2]].map((p) => (rng() < 0.5 ? p : [p[1], p[0]]));
        shuffle(pairs, rng);
        premises = [0, 1, 2].map((i) => Object.assign({ x: pairs[i][0], y: pairs[i][1] }, { t: wpick(wAll, rng) }));
        const pc = pick([[0, 1], [1, 2], [0, 2]], rng);
        concl = Object.assign(rng() < 0.5 ? { x: pc[0], y: pc[1] } : { x: pc[1], y: pc[0] }, { t: wpick(wAll, rng) });
      }
      // no trivial restatement of a premise
      if (premises.some((p) => stmtKey(p) === stmtKey(concl))) continue;
      if (level !== 'easy' && premises.some((p) => p.x === concl.x && p.y === concl.y)) { if (level === 'medium') continue; }
      if (new Set(premises.map(stmtKey)).size < premises.length) continue;
      const v = syllogismVerdict(premises, concl);
      if (v === null) continue;
      last = { premises, concl, v };
      if (v !== SYL_KEYS[target]) continue;
      return buildSyllogism(premises, concl, v, terms);
    }
    if (last) return buildSyllogism(last.premises, last.concl, last.v, terms);
    throw new Error('syllogism generation failed');
  }
  function buildSyllogism(premises, concl, v, terms) {
    const lines = premises.map((p) => '<li>' + esc(sylText(p, terms)) + '</li>').join('');
    const stimulus = '<div style="line-height:1.55"><p style="margin:0 0 .5em;opacity:.8">Nehmen Sie die Aussagen als wahr an.</p>' +
      '<ul style="margin:0 0 .6em;padding-left:1.2em">' + lines + '</ul>' +
      '<p style="margin:0"><b>Schlussfolgerung:</b> ' + esc(sylText(concl, terms)) + '</p></div>';
    const ex = {
      follows: 'In jeder denkbaren Situation, in der die Aussagen wahr sind, ist auch die Schlussfolgerung wahr.',
      contradicts: 'In jeder denkbaren Situation, in der die Aussagen wahr sind, ist die Schlussfolgerung falsch.',
      open: 'Es gibt Situationen, in denen die Aussagen und die Schlussfolgerung wahr sind, und andere, in denen die Schlussfolgerung falsch ist.',
    }[v];
    return {
      lang: 'de', prompt: 'Wie verhält sich die Schlussfolgerung zu den Aussagen?',
      stimulus, stimulusClass: 'plain',
      options: SYL_OPTIONS.slice(), answer: SYL_KEYS.indexOf(v), optionStyle: 'text',
      explain: ex,
      meta: { premises, concl, terms: terms.map((t) => t[2]), verdict: v },
    };
  }

  // ======================================================================================
  // 10. RANKING (all permutations are enumerated; clue set + question must have one answer)
  // ======================================================================================
  const NAMES = ['Anna', 'Ben', 'Clara', 'Dora', 'Eva', 'Felix', 'Gustav', 'Hanna', 'Jonas', 'Klara', 'Leon', 'Mia', 'Noah', 'Paula', 'Rosa', 'Tim', 'Uwe', 'Vera', 'Lena', 'Max'];
  const PERMS = {};
  function perms(n) {
    if (PERMS[n]) return PERMS[n];
    const out = [];
    const a = Array.from({ length: n }, (_, i) => i);
    (function rec(k) {
      if (k === n) { const pos = new Array(n); a.forEach((p, i) => { pos[p] = i; }); out.push(pos); return; }
      for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(k + 1); [a[k], a[i]] = [a[i], a[k]]; }
    })(0);
    PERMS[n] = out;
    return out;
  }
  // dimensions. pos[i] = rank of person i (0 = top / front)
  const DIMS = {
    size: { noun: 'Größe', gt: (a, b) => a + ' ist größer als ' + b, lt: (a, b) => a + ' ist kleiner als ' + b, both_hi: (x, ys) => x + ' ist größer als ' + ys, both_lo: (x, ys) => x + ' ist kleiner als ' + ys, mid: (x, hi, lo) => x + ' ist kleiner als ' + hi + ', aber größer als ' + lo, top: 'Wer ist am größten?', bot: 'Wer ist am kleinsten?', start: 'der größten', cnt: (x) => 'Wie viele Personen sind größer als ' + x + '?', between: (a, b) => 'Wer ist kleiner als ' + a + ', aber größer als ' + b + '?' },
    age: { noun: 'Alter', gt: (a, b) => a + ' ist älter als ' + b, lt: (a, b) => a + ' ist jünger als ' + b, both_hi: (x, ys) => x + ' ist älter als ' + ys, both_lo: (x, ys) => x + ' ist jünger als ' + ys, mid: (x, hi, lo) => x + ' ist jünger als ' + hi + ', aber älter als ' + lo, top: 'Wer ist am ältesten?', bot: 'Wer ist am jüngsten?', start: 'der ältesten', cnt: (x) => 'Wie viele Personen sind älter als ' + x + '?', between: (a, b) => 'Wer ist jünger als ' + a + ', aber älter als ' + b + '?' },
    speed: { noun: 'Geschwindigkeit', gt: (a, b) => a + ' ist schneller als ' + b, lt: (a, b) => a + ' ist langsamer als ' + b, both_hi: (x, ys) => x + ' ist schneller als ' + ys, both_lo: (x, ys) => x + ' ist langsamer als ' + ys, mid: (x, hi, lo) => x + ' ist langsamer als ' + hi + ', aber schneller als ' + lo, top: 'Wer ist am schnellsten?', bot: 'Wer ist am langsamsten?', start: 'der schnellsten', cnt: (x) => 'Wie viele Personen sind schneller als ' + x + '?', between: (a, b) => 'Wer ist langsamer als ' + a + ', aber schneller als ' + b + '?' },
    salary: { noun: 'Gehalt', gt: (a, b) => a + ' verdient mehr als ' + b, lt: (a, b) => a + ' verdient weniger als ' + b, both_hi: (x, ys) => x + ' verdient mehr als ' + ys, both_lo: (x, ys) => x + ' verdient weniger als ' + ys, mid: (x, hi, lo) => x + ' verdient weniger als ' + hi + ', aber mehr als ' + lo, top: 'Wer verdient am meisten?', bot: 'Wer verdient am wenigsten?', start: 'dem höchsten Gehalt', cnt: (x) => 'Wie viele Personen verdienen mehr als ' + x + '?', between: (a, b) => 'Wer verdient weniger als ' + a + ', aber mehr als ' + b + '?' },
    weight: { noun: 'Gewicht', gt: (a, b) => a + ' ist schwerer als ' + b, lt: (a, b) => a + ' ist leichter als ' + b, both_hi: (x, ys) => x + ' ist schwerer als ' + ys, both_lo: (x, ys) => x + ' ist leichter als ' + ys, mid: (x, hi, lo) => x + ' ist leichter als ' + hi + ', aber schwerer als ' + lo, top: 'Wer ist am schwersten?', bot: 'Wer ist am leichtesten?', start: 'der schwersten', cnt: (x) => 'Wie viele Personen sind schwerer als ' + x + '?', between: (a, b) => 'Wer ist leichter als ' + a + ', aber schwerer als ' + b + '?' },
    row: { noun: 'Reihe', row: true, gt: (a, b) => a + ' steht vor ' + b, lt: (a, b) => a + ' steht hinter ' + b, both_hi: (x, ys) => x + ' steht vor ' + ys, both_lo: (x, ys) => x + ' steht hinter ' + ys, mid: (x, hi, lo) => x + ' steht hinter ' + hi + ', aber vor ' + lo, top: 'Wer steht ganz vorne?', bot: 'Wer steht ganz hinten?', cnt: (x) => 'Wie viele Personen stehen vor ' + x + '?', between: (a, b) => 'Wer steht zwischen ' + a + ' und ' + b + '?' },
  };
  const DIM_KEYS = Object.keys(DIMS);
  // atom: {k:'gt', a, b}  rank(a) < rank(b);  {k:'adj', a, b} rank(b) = rank(a)+1;  {k:'abs', a, p}
  const atomHolds = (at, pos) => (at.k === 'gt' ? pos[at.a] < pos[at.b] : at.k === 'adj' ? pos[at.b] === pos[at.a] + 1 : pos[at.a] === at.p);
  function consistent(n, atoms) {
    return perms(n).filter((pos) => atoms.every((at) => atomHolds(at, pos)));
  }
  // question spec: { kind, ... , ask(pos) -> string }
  function qAnswerSet(n, atoms, q) {
    const set = consistent(n, atoms);
    if (!set.length) return null;
    const first = q.ans(set[0]);
    for (const pos of set) if (q.ans(pos) !== first) return { ok: false, set };
    return { ok: true, set, value: first };
  }
  function atomText(at, dim, nm, flip) {
    if (at.k === 'gt') return (flip ? dim.lt(nm[at.b], nm[at.a]) : dim.gt(nm[at.a], nm[at.b])) + '.';
    if (at.k === 'adj') return flip ? nm[at.b] + ' steht direkt hinter ' + nm[at.a] + '.' : nm[at.a] + ' steht direkt vor ' + nm[at.b] + '.';
    return nm[at.a] + ' steht an ' + ORD[at.p + 1] + ' Stelle.';
  }
  function joinNames(a) { return a.length === 2 ? a[0] + ' und ' + a[1] : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1]; }
  function makeRanking(level, rng) {
    for (let guard = 0; guard < 60; guard++) {
      const n = level === 'easy' ? ri(3, 4, rng) : level === 'medium' ? ri(4, 5, rng) : (rng() < 0.55 ? 5 : 6);
      const dimKey = pick(DIM_KEYS, rng);
      const dim = DIMS[dimKey];
      const nm = sample(NAMES, n, rng);
      const truth = shuffle(Array.from({ length: n }, (_, i) => i), rng);   // truth[r] = person at rank r
      const rank = new Array(n); truth.forEach((p, r) => { rank[p] = r; });
      // question
      const kinds = level === 'easy' ? [['ext', 7], ['nth', 3]] : level === 'medium' ? [['ext', 3], ['nth', 4], ['cnt', n >= 5 ? 3 : 0], ['btw', n >= 4 ? 2 : 0]] : [['ext', 1], ['nth', 4], ['cnt', n >= 5 ? 3 : 0], ['btw', 3]];
      const kind = wpick(kinds.filter((x) => x[1] > 0), rng);
      let q;
      if (kind === 'ext') {
        const top = rng() < 0.5;
        q = { text: top ? dim.top : dim.bot, ans: (pos) => nm[pos.indexOf(top ? 0 : n - 1)], type: 'name' };
      } else if (kind === 'nth') {
        const p = ri(1, n - 2, rng);   // 0-based rank, not the extremes (those are 'ext')
        const pp = level === 'easy' && rng() < 0.5 ? 0 : p;
        const txt = dim.row ? 'Wer steht an ' + ORD[pp + 1] + ' Stelle?' : 'Ordnet man alle nach ' + dim.noun + ' (beginnend mit ' + dim.start + ' Person), wer steht an ' + ORD[pp + 1] + ' Stelle?';
        q = { text: txt, ans: (pos) => nm[pos.indexOf(pp)], type: 'name' };
      } else if (kind === 'cnt') {
        const x = ri(1, n - 2, rng);
        const person = truth[x];
        q = { text: dim.cnt(nm[person]), ans: (pos) => String(pos[person]), type: 'num' };
      } else {
        // exactly one person between a and b in the true order
        const r1 = ri(0, n - 3, rng);
        const a = truth[r1], b = truth[r1 + 2];
        const lowFirst = rng() < 0.5;
        const text = dim.row ? dim.between(nm[lowFirst ? a : b], nm[lowFirst ? b : a]) : dim.between(nm[a], nm[b]);
        q = { text, ans: (pos) => { const lo = Math.min(pos[a], pos[b]), hi = Math.max(pos[a], pos[b]); const mid = []; for (let r = lo + 1; r < hi; r++) mid.push(r); return mid.length === 1 ? nm[pos.indexOf(mid[0])] : 'x' + mid.length; }, type: 'name' };
      }
      // atom pool (true statements)
      const pool = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pool.push({ k: 'gt', a: truth[i], b: truth[j] });
      if (dim.row) {
        for (let i = 0; i + 1 < n; i++) pool.push({ k: 'adj', a: truth[i], b: truth[i + 1] });
        if (level === 'easy') for (let i = 0; i < n; i++) pool.push({ k: 'abs', a: truth[i], p: i });
      }
      shuffle(pool, rng);
      // grow until determined (prefer pairs of neighbours so that chains form)
      const sorted = pool.slice().sort((x, y) => {
        const dx = x.k === 'gt' ? Math.abs(rank[x.a] - rank[x.b]) : 1, dy = y.k === 'gt' ? Math.abs(rank[y.a] - rank[y.b]) : 1;
        return (level === 'easy' ? 0 : dx - dy) + (rng() - 0.5) * 2.5;
      });
      let atoms = [];
      let res = null;
      for (const at of sorted) {
        atoms.push(at);
        res = qAnswerSet(n, atoms, q);
        if (res && res.ok) break;
      }
      if (!res || !res.ok) continue;
      if (level !== 'easy') {
        shuffle(atoms.slice(), rng).forEach((at) => {
          const rest = atoms.filter((x) => x !== at);
          const r2 = qAnswerSet(n, rest, q);
          if (r2 && r2.ok) atoms = rest;
        });
      }
      if (atoms.length < n - 1 && level === 'hard') continue;
      if (level === 'easy' && atoms.length > n + 1) continue;
      // render clues (merge compatible pairs into one sentence for variety)
      const used = new Set();
      const sentences = [];
      const wantMerge = level === 'easy' ? 0.15 : level === 'medium' ? 0.4 : 0.6;
      shuffle(atoms.slice(), rng).forEach((at) => {
        if (used.has(at)) return;
        used.add(at);
        if (at.k === 'gt' && rng() < wantMerge) {
          // find another unused gt atom sharing a subject so that one sentence expresses both
          for (const bt of atoms) {
            if (used.has(bt) || bt.k !== 'gt') continue;
            // x above y and x above z
            if (at.a === bt.a && at.b !== bt.b) { used.add(bt); sentences.push(dim.both_hi(nm[at.a], nm[at.b] + ' und ' + nm[bt.b]) + '.'); return; }
            // x below y and x below z
            if (at.b === bt.b && at.a !== bt.a) { used.add(bt); sentences.push(dim.both_lo(nm[at.b], nm[at.a] + ' und ' + nm[bt.a]) + '.'); return; }
            // y above x and x above z  (x is between)
            if (at.b === bt.a && at.a !== bt.b) { used.add(bt); sentences.push(dim.mid(nm[at.b], nm[at.a], nm[bt.b]) + '.'); return; }
            if (bt.b === at.a && bt.a !== at.b) { used.add(bt); sentences.push(dim.mid(nm[at.a], nm[bt.a], nm[at.b]) + '.'); return; }
          }
        }
        sentences.push(atomText(at, dim, nm, at.k !== 'abs' && rng() < 0.5));
      });
      shuffle(sentences, rng);
      // options
      const numeric = q.type === 'num';
      let correct, wrong;
      if (numeric) { correct = res.value; wrong = Array.from({ length: n }, (_, i) => String(i)).filter((x) => x !== correct); }
      else { correct = res.value; wrong = nm.filter((x) => x !== correct); }
      if (!numeric && n < 5) wrong = wrong.concat(['Das lässt sich nicht eindeutig bestimmen.', 'Keine der genannten Personen.']);
      const built = mc(correct, wrong, rng, Math.min(6, Math.max(5, n)));
      if (built.options.length < 5) continue;
      // explanation (full order only if the clues pin it down uniquely)
      const full = res.set.length === 1 ? res.set[0] : null;
      let expl = 'Aus den Aussagen folgt eindeutig: ' + correct + '.';
      if (full) {
        const order = truth.map((p) => nm[p]);
        const orderTxt = dim.row ? order.join(' – ') : order.join(' > ');
        expl = 'Die Reihenfolge ist eindeutig' + (dim.row ? ' (von vorne nach hinten): ' : ' (' + dim.noun + ', von oben nach unten): ') + orderTxt + '. Antwort: ' + correct + '.';
      }
      const stim = '<div style="line-height:1.55"><ul style="margin:0;padding-left:1.2em">' + sentences.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></div>';
      return {
        lang: 'de',
        prompt: q.text,
        stimulus: stim, stimulusClass: 'plain',
        options: built.options, answer: built.answer,
        optionStyle: numeric || allShort(built.options, 8) ? 'grid' : 'text',
        explain: expl,
        meta: { n, dim: dimKey, names: nm, atoms: atoms.map((a) => Object.assign({}, a)), kindQ: kind, qtext: q.text, value: correct, numeric },
      };
    }
    throw new Error('ranking generation failed');
  }

  // ======================================================================================
  // registration
  // ======================================================================================
  const verbalInternals = { D, wordTags, tagMembers, simMembers, SIM_TAGS, LEAVES, children, anaForbidden, anaNeigh, synFam, syllogismVerdict, holds, stmtMask, perms, atomHolds, DIMS, NAMES, sortedLetters, KNOWN_WORDS, MISS_CORRECT, MISS, SENT_BY, KN_BY, VOC_BY, SYL_OPTIONS, SYL_KEYS, ancestors, noPair };
  T.verbal = verbalInternals;

  T.register({
    id: 'analogies', name: 'Word analogies', de: 'Wortanalogien', domain: 'verbal', n: 10, secs: 360, refSecs: 25, learn: 0.5, options: 5,
    learnNote: '',
    tips: [
      'Name the relation of the first pair in one phrase ("whole - part", "animal - young") before you look at the options.',
      'Check the direction: "Hand : Finger" is whole to part, so the answer must also go from the whole to its part.',
      'Say the full sentence with the candidate in it ("Fuss is to Zeh as Hand is to Finger") to test it.',
      'Wrong options are often words from the same topic but a different relation, so eliminate by relation, not by topic.',
      'If two options seem to fit, pick the one that is the most typical, defining example of the relation.',
    ],
    desc: {
      easy: 'Common relations (part-whole, category, opposites, animal young) with everyday words.',
      medium: 'Adds tool - action, place - activity, material - product and animal sounds or homes.',
      hard: 'Cause and effect, degrees of intensity and profession - object, with rarer vocabulary.',
    },
    make: makeAnalogy,
  });
  T.register({
    id: 'similarities', name: 'Similarities', de: 'Gemeinsamkeiten', domain: 'verbal', n: 10, secs: 300, refSecs: 25, learn: 0.5, options: 5,
    tips: [
      'Find the most specific category both words belong to, then check each option against it.',
      'A statement must be true for ALL words shown; one counter-example rules an option out.',
      'Options from the same topic are often only half right (true for one word, not for the other).',
      'Think in layers (apple - fruit - food - plant product) and match the layer the options use.',
    ],
    desc: {
      easy: 'Two words from a clear everyday category, such as fruit or tools.',
      medium: 'Two words from different sub-groups of one broader category.',
      hard: 'Three words from different sub-groups; the shared category is broad.',
    },
    make: makeSimilarity,
  });
  T.register({
    id: 'classification', name: 'Odd word out', de: 'Wortklassifikation', domain: 'verbal', n: 10, secs: 300, refSecs: 20, learn: 0.5, options: 5,
    tips: [
      'Name the group that four of the words share, then pick the one that is left over.',
      'Categories here never overlap, so the odd word really belongs to a different group.',
      'In the umbrella-term version, test each candidate term against every word, not just the first.',
      'On hard levels the odd word comes from a similar domain (tools vs. kitchen utensils), so be precise about the category.',
    ],
    desc: {
      easy: 'The odd word comes from a clearly different domain.',
      medium: 'The odd word comes from any other category; umbrella terms of 3-4 words.',
      hard: 'The odd word comes from a close, easily confused domain.',
    },
    make: makeClassification,
  });
  T.register({
    id: 'sentences', name: 'Sentence completion', de: 'Satzergänzung', domain: 'verbal', n: 10, secs: 360, refSecs: 30, learn: 0.5, options: 5,
    tips: [
      'Read the whole sentence first and decide what relation the gap expresses (reason, contrast, purpose, result).',
      'Check grammar before meaning: case, verb form, word order and fixed prepositions eliminate options quickly.',
      'For connectors, put the candidate in and ask whether the two parts really relate that way.',
      'Proverbs and fixed expressions have exactly one correct wording; trust the form you know.',
    ],
    desc: {
      easy: 'Everyday sentences with basic connectors, cases and verb forms.',
      medium: 'Fixed expressions, proverbs and subtler logical connectors.',
      hard: 'Demanding grammar (genitive, infinitive clauses) and precise word choice.',
    },
    make: makeSentence,
  });
  T.register({
    id: 'synonyms', name: 'Synonyms & antonyms', de: 'Synonyme/Antonyme', domain: 'verbal', n: 10, secs: 300, refSecs: 20, learn: 0.4, options: 5,
    tips: [
      'Read the instruction twice: same meaning or opposite meaning?',
      'Use the word in a short sentence and swap in each option to feel which one fits.',
      'Words of the same word class are offered, so decide by meaning, not by form.',
      'For rarer words, look at word parts (prefix, stem) to narrow the meaning.',
    ],
    desc: {
      easy: 'Everyday adjectives, nouns and verbs.',
      medium: 'Less common words and finer shades of meaning.',
      hard: 'Formal and foreign words such as "prägnant" or "subtil".',
    },
    make: makeSynonym,
  });
  T.register({
    id: 'anagrams', name: 'Anagrams', de: 'Anagramme', domain: 'verbal', n: 10, secs: 300, refSecs: 30, learn: 0.7, options: 5,
    tips: [
      'Use the category: it removes most candidate words immediately.',
      'Count the letters and compare with the options; the length must match exactly.',
      'Look for typical clusters (SCH, CH, EI, ER, UNG) and for the first and last letters.',
      'Check the rarest letters first (Z, K, V, Ä, Ö, Ü) and see which option contains them.',
    ],
    desc: {
      easy: 'Words of 4-5 letters.',
      medium: 'Words of 6-7 letters.',
      hard: 'Words of 8-10 letters.',
    },
    make: makeAnagram,
  });
  T.register({
    id: 'vocabulary', name: 'Vocabulary', de: 'Wortschatz', domain: 'verbal', n: 10, secs: 360, refSecs: 25, learn: 0.4, options: 5,
    tips: [
      'Break unfamiliar words into prefix, stem and suffix (e.g. "re-", "-ation") and use Latin or English cognates.',
      'Eliminate definitions that clearly describe a different word class or a different topic.',
      'For spelling tasks, check double consonants, "ph/f", "th/t" and "ie/i" first.',
      'Beware of near misses: a definition that is partly right is often the trap.',
    ],
    desc: {
      easy: 'Common loan words and formal words.',
      medium: 'Educated vocabulary and abstract terms.',
      hard: 'Rare loan words, technical terms and tricky spellings.',
    },
    make: makeVocabulary,
  });
  T.register({
    id: 'knowledge', name: 'General knowledge', de: 'Allgemeinwissen', domain: 'verbal', n: 10, secs: 360, refSecs: 25, learn: 0.3, options: 5,
    tips: [
      'Eliminate options that are clearly wrong (wrong century, wrong country, wrong order of magnitude) before you decide.',
      'For dates, anchor on a few known events and place the question around them.',
      'Do not overthink common-sense items; the first answer that fits well is usually right.',
      'Learning is cumulative: review the explanation after each wrong answer.',
    ],
    desc: {
      easy: 'Common school knowledge.',
      medium: 'Broader general education.',
      hard: 'Demanding but fair facts from all areas.',
    },
    make: makeKnowledge,
  });
  T.register({
    id: 'syllogisms', name: 'Syllogisms', de: 'Schlussfolgern', domain: 'reasoning', n: 10, secs: 420, refSecs: 40, learn: 0.8, options: 3,
    tips: [
      'Treat the statements as the only facts; ignore what you know about the real world.',
      'Draw three overlapping circles and ask: is the conclusion true in EVERY way the circles can be filled?',
      '"Some A are B" only claims that at least one such thing exists; "All" and "No" claim nothing about existence.',
      'If you can build one picture where the conclusion holds and another where it fails, the answer is "not decidable".',
      '"Contradicts" means the conclusion is false in every possible picture, not just in the one you drew first.',
    ],
    desc: {
      easy: 'Two premises in a clear chain (like "all A are B, all B are C").',
      medium: 'Two premises with any combination of "all", "no", "some" and "some not".',
      hard: 'Three premises and tricky "some" cases.',
    },
    make: makeSyllogism,
  });
  T.register({
    id: 'ranking', name: 'Ordering puzzles', de: 'Reihenfolgen', domain: 'reasoning', n: 10, secs: 420, refSecs: 40, learn: 0.8, options: 5,
    tips: [
      'Write the people as a line and place each clue on it as you read; redraw when a clue links two groups.',
      'Convert every clue to the same direction ("bigger than") before you combine them.',
      'Count carefully for "how many" questions: the people above a person are exactly his or her rank minus one.',
      'Every clue is needed on hard levels; if a name never appears in a clue, it is placed by the others.',
    ],
    desc: {
      easy: 'Three or four people and short, direct comparisons.',
      medium: 'Four or five people with combined clues and counting questions.',
      hard: 'Five or six people, minimal clue sets and "between" questions.',
    },
    make: makeRanking,
  });
})(typeof self !== 'undefined' ? self : this);
