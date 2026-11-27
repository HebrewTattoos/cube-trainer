/* Numerical & technical modules: arith, wordprob, nummatrix, numanalogy, charts, technical.
 * Every answer is computed from the data that is drawn/printed; each module either solves its own question
 * with an exhaustive hypothesis solver (nummatrix, numanalogy, technical circuits) or builds it so the key is
 * the result of the same arithmetic the explanation shows. Each question carries a non-enumerable `meta` field
 * with the underlying data so tests can re-derive the answer independently.
 */
(function (root) {
  'use strict';
  const T = root.Trainer || require('./core.js');
  const { ri, pick, shuffle, weighted, sample, esc } = T.util;

  // ---------- shared helpers ----------
  const round2 = (v) => Math.round(v * 100) / 100;
  const isDec2 = (v) => Number.isFinite(v) && Math.abs(v * 100 - Math.round(v * 100)) < 1e-7;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const fmtNum = (v) => { const r = round2(v); const s = String(Math.abs(r)).replace('.', ','); return (r < 0 ? '−' : '') + s; };
  const dotStr = (v) => String(round2(v));
  const eur = (v) => { const r = round2(v); return (Number.isInteger(r) ? fmtNum(r) : (r < 0 ? '−' : '') + Math.abs(r).toFixed(2).replace('.', ',')) + ' €'; };
  const attachMeta = (q, meta) => { Object.defineProperty(q, 'meta', { value: meta, enumerable: false, writable: true }); return q; };
  const LETTERS = 'ABCDEFGH';

  // Build a numeric multiple-choice set: the answer, typical slips (provably != answer) and filler.
  // Returns { options:[text], answer:index } or null when not enough distinct wrong values exist.
  function numMC(rng, ans, slips, fmt, o) {
    o = o || {};
    const n = o.n || 5;
    const ok = o.ok || ((v) => (ans < 0 ? true : v >= 0));
    const seen = new Set([round2(ans)]);
    const wrong = [];
    const add = (v) => {
      if (wrong.length >= n - 1 || typeof v !== 'number' || !Number.isFinite(v)) return;
      v = round2(v);
      if (seen.has(v) || !ok(v) || Math.abs(v) > 1e7) return;
      seen.add(v);
      wrong.push(v);
    };
    shuffle(slips.slice(), rng).forEach(add);
    const steps = o.steps || (Number.isInteger(ans)
      ? [1, -1, 2, -2, 10, -10, 3, -3, 5, -5, 20, -20, 4, -4, 100, -100, 7, -7]
      : [0.5, -0.5, 1, -1, 0.1, -0.1, 2, -2, 5, -5, 0.25, -0.25, 10, -10, 0.2, -0.2]);
    shuffle(steps.slice(0, 6), rng).concat(steps.slice(6)).forEach((s) => add(ans + s));
    if (wrong.length < n - 1) return null;
    const items = [{ v: ans, c: true }].concat(wrong.map((v) => ({ v, c: false })));
    shuffle(items, rng);
    return { options: items.map((x) => fmt(x.v)), answer: items.findIndex((x) => x.c) };
  }
  // Same for arbitrary text options (caller guarantees distinct semantic values).
  function textMC(rng, correct, wrongs, n) {
    n = n || 5;
    const seen = new Set([correct]);
    const w = [];
    wrongs.forEach((t) => { if (!seen.has(t) && w.length < n - 1) { seen.add(t); w.push(t); } });
    if (w.length < n - 1) return null;
    const items = [{ t: correct, c: true }].concat(w.map((t) => ({ t, c: false })));
    shuffle(items, rng);
    return { options: items.map((x) => x.t), answer: items.findIndex((x) => x.c) };
  }
  function retry(fn, label) {
    return function (level, rng) {
      for (let i = 0; i < 400; i++) {
        const q = fn(level, rng);
        if (q) return q;
      }
      throw new Error(label + ': could not build a question for ' + level);
    };
  }

  // ---------- exact rationals ----------
  const Q = (n, d) => {
    d = d === undefined ? 1 : d;
    if (d === 0) throw new Error('division by zero');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  };
  const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qsub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const qdiv = (a, b) => Q(a.n * b.d, a.d * b.n);
  const qeq = (a, b) => a.n === b.n && a.d === b.d;
  const qnum = (a) => a.n / a.d;
  const qpow = (a, e) => { let r = Q(1); for (let i = 0; i < e; i++) r = qmul(r, a); return r; };
  const qfrac = (a) => (a.d === 1 ? String(a.n) : a.n + '/' + a.d);

  // =====================================================================================================
  // 1. arith - mental arithmetic
  // =====================================================================================================
  // Expression trees: seq = [operand, op, operand, ...]; operand = number | {br:seq} | {pw:[base,e]} | {rt:r} (sqrt of r*r)
  //   | {fr:[n,d]} | {dc:x} | {pc:[p,N]} (p % von N)
  const SUP = { 2: '²', 3: '³' };
  function opVal(x, mode) {
    if (typeof x === 'number') return Q(x);
    if (x.br) return evalSeq(x.br, mode);
    if (x.pw) return qpow(opVal(x.pw[0], mode), x.pw[1]);
    if (x.rt !== undefined) return Q(x.rt);
    if (x.fr) return Q(x.fr[0], x.fr[1]);
    if (x.dc !== undefined) return Q(Math.round(x.dc * 100), 100);
    if (x.pc) return qmul(Q(x.pc[0], 100), Q(x.pc[1]));
    throw new Error('bad operand');
  }
  function evalSeq(seq, mode) {
    if (mode === 'ltr') {
      let acc = opVal(seq[0], mode);
      for (let i = 1; i < seq.length; i += 2) {
        const v = opVal(seq[i + 1], mode), op = seq[i];
        acc = op === '+' ? qadd(acc, v) : op === '−' ? qsub(acc, v) : op === '×' ? qmul(acc, v) : qdiv(acc, v);
      }
      return acc;
    }
    let sum = Q(0), term = opVal(seq[0], mode), sign = 1;
    for (let i = 1; i < seq.length; i += 2) {
      const op = seq[i], v = opVal(seq[i + 1], mode);
      if (op === '×') term = qmul(term, v);
      else if (op === '÷') term = qdiv(term, v);
      else { sum = sign > 0 ? qadd(sum, term) : qsub(sum, term); sign = op === '+' ? 1 : -1; term = v; }
    }
    return sign > 0 ? qadd(sum, term) : qsub(sum, term);
  }
  const flatten = (seq) => {
    const out = [];
    seq.forEach((x, i) => {
      if (i % 2 === 1) out.push(x);
      else if (x && typeof x === 'object' && x.br) out.push(...flatten(x.br));
      else out.push(x);
    });
    return out;
  };
  function showOp(x) {
    if (typeof x === 'number') return String(x);
    if (x.br) return '(' + showSeq(x.br) + ')';
    if (x.pw) return (typeof x.pw[0] === 'number' ? String(x.pw[0]) : showOp(x.pw[0])) + SUP[x.pw[1]];
    if (x.rt !== undefined) return '√' + x.rt * x.rt;
    if (x.fr) return x.fr[0] + '/' + x.fr[1];
    if (x.dc !== undefined) return fmtNum(x.dc);
    if (x.pc) return x.pc[0] + ' % von ' + x.pc[1];
    return '?';
  }
  const showSeq = (seq) => seq.map((x, i) => (i % 2 ? x : showOp(x))).join(' ');

  const exprHTML = (s) => '<div class="expr" style="font-size:1.9em;font-weight:700;text-align:center;line-height:1.3;padding:.3em 0">' + esc(s) + '</div>';

  // Finish a rational-valued arithmetic question.
  // rep: 'int' | 'num' (decimal answer, <= 2 decimals) | 'frac' (reduced fraction)
  function ratQuestion(rng, o) {
    const ans = o.ans;
    let mc;
    if (o.rep === 'frac') {
      if (ans.d === 1 || ans.n <= 0) return null;
      const seen = [ans];
      const wrong = [];
      const add = (r) => {
        if (!r || wrong.length >= 4 || r.d === 1 || r.n <= 0 || r.d > 400 || r.n > 400) return;
        if (seen.some((s) => qeq(s, r))) return;
        seen.push(r);
        wrong.push(r);
      };
      shuffle((o.slips || []).filter(Boolean), rng).forEach(add);
      const fill = shuffle([Q(ans.n + 1, ans.d), Q(ans.n - 1, ans.d), Q(ans.n, ans.d + 1), Q(ans.n, ans.d - 1), Q(ans.d, ans.n), Q(ans.n + 2, ans.d), Q(ans.n, ans.d + 2), Q(ans.n * 2 + 1, ans.d * 2)], rng);
      fill.forEach((r) => { try { add(r); } catch (e) { /* skip */ } });
      if (wrong.length < 4) return null;
      const items = [{ r: ans, c: true }].concat(wrong.map((r) => ({ r, c: false })));
      shuffle(items, rng);
      mc = { options: items.map((x) => qfrac(x.r)), answer: items.findIndex((x) => x.c) };
    } else {
      const v = qnum(ans);
      if (!isDec2(v)) return null;
      const slips = (o.slips || []).filter(Boolean).map(qnum).filter((x) => isDec2(x) && (o.rep !== 'int' || Number.isInteger(x)));
      mc = numMC(rng, v, slips, fmtNum);
      if (!mc) return null;
    }
    const typed = o.rep === 'frac' ? [qfrac(ans)] : [dotStr(qnum(ans))];
    if (o.rep === 'frac' && isDec2(qnum(ans))) typed.push(dotStr(qnum(ans)));
    const q = {
      kind: 'mc', lang: 'de', stimulus: exprHTML(o.text), prompt: o.prompt || 'Ergebnis?',
      options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: typed,
      explain: o.explain,
    };
    return attachMeta(q, { kind: 'expr', rep: o.rep, text: o.text });
  }

  // ---- easy ----
  function arEasy(rng) {
    let seq;
    if (rng() < 0.3) {
      // (a + b) × c ± d  or  a × (b − c) + d  with brackets
      const a = ri(2, 15, rng), b = ri(2, 12, rng), c = ri(2, 9, rng), d = ri(2, 30, rng);
      const bo = pick(['+', '−'], rng), lo = pick(['+', '−'], rng);
      if (bo === '−' && a <= b) return null;
      seq = rng() < 0.5 ? [{ br: [a, bo, b] }, '×', c, lo, d] : [d, lo === '+' ? '+' : '+', c, '×', { br: [a, bo, b] }];
    } else {
      const nOps = ri(2, 3, rng);
      const ops = [];
      for (let i = 0; i < nOps; i++) ops.push(weighted([['+', 3], ['−', 3], ['×', 3]], rng));
      if (!ops.includes('×')) ops[ri(0, nOps - 1, rng)] = '×';
      seq = [];
      for (let i = 0; i <= nOps; i++) {
        const mul = (i > 0 && ops[i - 1] === '×') || (i < nOps && ops[i] === '×');
        seq.push(mul ? ri(2, 9, rng) : ri(4, 60, rng));
        if (i < nOps) seq.push(ops[i]);
      }
    }
    const std = evalSeq(seq, 'std'), ltr = evalSeq(seq, 'ltr'), flat = evalSeq(flatten(seq), 'ltr');
    const v = qnum(std);
    if (v < 0 || v > 999) return null;
    if (qeq(std, ltr) && rng() < 0.85) return null;
    const alt = seq.map((x, i) => (i % 2 && x === '−' ? '+' : x));
    const slips = [ltr, flat, evalSeq(alt, 'std'), Q(v + 10), Q(v - 10), Q(v + 1), Q(v - 1)];
    const text = showSeq(seq);
    const hint = seq.some((x) => x && x.br) ? 'Erst die Klammer, dann Punkt vor Strich.' : 'Punkt vor Strich.';
    return ratQuestion(rng, { ans: std, slips, rep: 'int', text, explain: hint + ' ' + text + ' = ' + v + '.' });
  }

  // ---- medium ----
  function arPercent(rng) {
    const p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90], rng);
    const N = ri(2, 30, rng) * 20;
    const variant = ri(0, 2, rng);
    let seq, slips;
    const part = { pc: [p, N] };
    const pv = qnum(opVal(part));
    if (variant === 0) {
      seq = [part];
      slips = [Q(N - pv), Q(pv * 10), Q(pv / 10), Q(N * p / 10), Q(N / p)];
    } else {
      const N2 = ri(5, 25, rng) * 10;
      const op = variant === 1 ? '+' : '−';
      if (op === '−' && N2 <= pv) return null;
      seq = [N2, op, part];
      const base = op === '+' ? N2 + N : N2 - N;
      slips = [Q((N2 + N) * p / 100), Q(op === '+' ? N2 + pv * 10 : N2 - pv * 10), Q(op === '+' ? N2 + N - pv : N2 - pv + N), Q(op === '+' ? N2 - pv : N2 + pv), Q(base)];
    }
    const text = showSeq(seq);
    const ans = evalSeq(seq, 'std');
    return ratQuestion(rng, { ans, slips, rep: Number.isInteger(qnum(ans)) ? 'int' : 'num', text, explain: p + ' % von ' + N + ' = ' + N + ' × ' + p + ' ÷ 100 = ' + fmtNum(pv) + (variant ? '. Ergebnis: ' + fmtNum(qnum(ans)) + '.' : '.') });
  }
  function arFraction(rng) {
    const v = ri(0, 3, rng);
    let seq, slips, rep, prompt, explain;
    if (v === 0) { // fraction × fraction
      const b = ri(2, 9, rng), d = ri(2, 9, rng), a = ri(1, b - 1, rng), c = ri(1, d - 1, rng);
      if (b === d) return null;
      seq = [{ fr: [a, b] }, '×', { fr: [c, d] }];
      slips = [Q(a * d, b * c), Q(a + c, b + d), Q(a * c, b + d), Q(a * c, Math.max(b, d)), Q(a + c, b * d)];
      rep = 'frac'; prompt = 'Ergebnis? (als gekürzter Bruch)';
      explain = 'Zähler mal Zähler, Nenner mal Nenner: ' + a * c + '/' + b * d + ', gekürzt ';
    } else if (v === 1) { // fraction + fraction, related denominators
      const dens = [2, 3, 4, 5, 6, 8, 10, 12];
      const b = pick(dens, rng);
      const multiples = dens.filter((x) => x !== b && (x % b === 0 || b % x === 0));
      if (!multiples.length) return null;
      const d = pick(multiples, rng), a = ri(1, b - 1, rng), c = ri(1, d - 1, rng);
      seq = [{ fr: [a, b] }, pick(['+', '+', '−'], rng), { fr: [c, d] }];
      const sub = seq[1] === '−';
      if (sub && a * d <= c * b) return null;
      slips = [Q(sub ? a - c : a + c, sub ? Math.max(b, d) : b + d), Q(sub ? a - c : a + c, b * d), Q(sub ? a * d + c * b : a * d - c * b, b * d), Q(sub ? a - c : a + c, Math.min(b, d))];
      rep = 'frac'; prompt = 'Ergebnis? (als gekürzter Bruch)';
      explain = 'Gemeinsamer Nenner ' + (b * d / gcd(b, d)) + ': Ergebnis ';
    } else if (v === 2) { // fraction ± decimal -> decimal
      const b = pick([2, 4, 5, 10, 20, 25], rng), a = ri(1, b - 1, rng);
      const dcv = ri(1, 9, rng) / 10;
      seq = [{ fr: [a, b] }, pick(['+', '+', '−'], rng), { dc: dcv }];
      if (seq[1] === '−' && a / b <= dcv) return null;
      const f = a / b;
      slips = [Q(Math.round((seq[1] === '+' ? f * 100 - dcv * 100 : f * 100 + dcv * 100)), 100), Q(Math.round((f + dcv) * 10), 10), Q(Math.round(Math.abs(f - dcv) * 100 + 10), 100), Q(Math.round(f * 100 + (seq[1] === '+' ? 1 : -1) * dcv * 10), 100)];
      rep = 'num'; prompt = 'Ergebnis? (als Dezimalzahl)';
      explain = a + '/' + b + ' = ' + fmtNum(f) + '. Ergebnis ';
    } else { // fraction of a whole number
      const b = pick([3, 4, 5, 6, 8, 10], rng), a = ri(1, b - 1, rng), N = b * ri(2, 20, rng);
      seq = [{ fr: [a, b] }, '×', N];
      slips = [Q(N * b, a), Q(N + a, b), Q(N - N * a / b), Q(N / b), Q(a * N)];
      rep = 'int'; prompt = 'Ergebnis?';
      explain = N + ' ÷ ' + b + ' × ' + a + ' = ';
    }
    const ans = evalSeq(seq, 'std');
    const text = showSeq(seq);
    if (rep === 'num' && !isDec2(qnum(ans))) return null;
    const res = rep === 'frac' ? qfrac(ans) : fmtNum(qnum(ans));
    return ratQuestion(rng, { ans, slips, rep, prompt, text, explain: explain + res + '.' });
  }
  function arPower(rng) {
    const v = ri(0, 3, rng);
    let seq, slips, expl;
    if (v === 0) {
      const x = ri(2, 12, rng), r = ri(2, 15, rng);
      seq = [{ pw: [x, 2] }, pick(['+', '−'], rng), { rt: r }];
      const s = seq[1] === '+' ? 1 : -1;
      slips = [Q(2 * x + s * r), Q(x * x + s * r * r), Q(x * x + s * r * r / 2), Q(2 * x + s * r * r / 2), Q(x * x * s * r)];
      expl = x + '² = ' + x * x + ' und √' + r * r + ' = ' + r;
    } else if (v === 1) {
      const x = ri(2, 5, rng), y = ri(2, 9, rng);
      const o = pick(['+', '−'], rng);
      seq = [{ pw: [x, 3] }, o, { pw: [y, 2] }];
      slips = [Q(3 * x + (o === '+' ? 1 : -1) * 2 * y), Q(x * x + (o === '+' ? 1 : -1) * y * y), Q(x * x * x * (o === '+' ? 1 : -1) * 2 * y), Q(x * 3 + (o === '+' ? 1 : -1) * y * y)];
      expl = x + '³ = ' + x * x * x + ' und ' + y + '² = ' + y * y;
    } else if (v === 2) {
      const a = ri(1, 9, rng), b = ri(2, 9, rng);
      const o = pick(['+', '−'], rng);
      if (o === '−' && a <= b) return null;
      seq = [{ pw: [{ br: [a, o, b] }, 2] }];
      slips = [Q(a * a + (o === '+' ? 1 : -1) * b * b), Q(2 * (o === '+' ? a + b : a - b)), Q(a * a + (o === '+' ? 1 : -1) * 2 * a * b), Q(a * a + (o === '+' ? 1 : -1) * 2 * a * b + 2 * b * b)];
      expl = 'Erst die Klammer: (' + a + ' ' + o + ' ' + b + ') = ' + (o === '+' ? a + b : a - b) + ', dann quadrieren';
    } else {
      const r = ri(3, 14, rng), x = ri(2, 5, rng);
      seq = [{ rt: r }, '×', { pw: [x, 2] }];
      slips = [Q(r * 2 * x), Q(r * r * x * x), Q(r * r / 2 * x * x), Q(r + x * x), Q(r * x)];
      expl = '√' + r * r + ' = ' + r + ' und ' + x + '² = ' + x * x;
    }
    const ans = evalSeq(seq, 'std');
    if (qnum(ans) < 0 || qnum(ans) > 999) return null;
    const text = showSeq(seq);
    return ratQuestion(rng, { ans, slips, rep: 'int', text, explain: expl + '. Ergebnis: ' + qnum(ans) + '.' });
  }
  function arDivRem(rng) {
    const d = ri(3, 19, rng), quo = ri(3, 30, rng), rem = ri(1, d - 1, rng), a = d * quo + rem;
    const ask = rng() < 0.55 ? 'rem' : 'quot';
    const ans = ask === 'rem' ? rem : quo;
    const slips = ask === 'rem' ? [quo, d - rem, rem + 1, rem - 1, d - 1 === rem ? 0 : d - 1, a % (d + 1)] : [quo + 1, quo - 1, Math.round(a / d), rem, quo * 10 / 10 + 2];
    const mc = numMC(rng, ans, slips, fmtNum);
    if (!mc) return null;
    const q = {
      kind: 'mc', lang: 'de', stimulus: exprHTML(a + ' ÷ ' + d),
      prompt: ask === 'rem' ? 'Welchen Rest lässt die Division?' : 'Wie groß ist der ganzzahlige Quotient (ohne Rest)?',
      options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [String(ans)],
      explain: d + ' × ' + quo + ' = ' + d * quo + ' und ' + a + ' − ' + d * quo + ' = ' + rem + ', also ' + quo + ' Rest ' + rem + '.',
    };
    return attachMeta(q, { kind: 'divrem', ask, text: a + ' ÷ ' + d });
  }

  // ---- hard ----
  function randBr(rng, depth) {
    const n = ri(2, 3, rng), seq = [];
    for (let i = 0; i < n; i++) {
      seq.push(depth < 2 && i > 0 && rng() < 0.3 ? { br: randBr(rng, depth + 1) } : ri(2, 14, rng));
      if (i < n - 1) seq.push(weighted([['+', 3], ['−', 3], ['×', 2]], rng));
    }
    return seq;
  }
  function arNested(rng) {
    if (rng() < 0.2) { // exact division inside brackets
      const c = ri(2, 9, rng), m = ri(2, 12, rng), S = c * m, a = ri(1, S - 1, rng), b = S - a, d = ri(2, 9, rng), e = ri(2, 9, rng);
      const seq = [{ br: [a, '+', b] }, '÷', c, pick(['+', '−'], rng), d, '×', e];
      return finishNested(rng, seq);
    }
    const L = ri(3, 4, rng), seq = [];
    let hasBr = false;
    for (let i = 0; i < L; i++) {
      const useBr = rng() < 0.55 || (i === L - 1 && !hasBr);
      if (useBr) { hasBr = true; seq.push({ br: randBr(rng, 1) }); } else seq.push(ri(2, 12, rng));
      if (i < L - 1) seq.push(weighted([['+', 3], ['−', 3], ['×', 3]], rng));
    }
    return finishNested(rng, seq);
  }
  function finishNested(rng, seq) {
    const text = showSeq(seq);
    if (text.length > 44) return null;
    const std = evalSeq(seq, 'std');
    const v = qnum(std);
    if (!Number.isInteger(v) || v < -20 || v > 999) return null;
    if (qeq(evalSeq(flatten(seq), 'std'), std)) return null;
    const slips = [evalSeq(seq, 'ltr'), evalSeq(flatten(seq), 'std'), evalSeq(flatten(seq), 'ltr')];
    if (new Set(slips.map(qnum).concat([v])).size < 3) return null;
    return ratQuestion(rng, { ans: std, slips, rep: 'int', text, explain: 'Klammern von innen nach außen auflösen, dann Punkt vor Strich: ' + text + ' = ' + v + '.' });
  }
  function arChain(rng) {
    const S = pick([40, 60, 80, 100, 120, 150, 160, 200, 240, 250, 300, 400, 500, 800], rng);
    const k = rng() < 0.6 ? 2 : 3;
    const ps = [];
    for (let i = 0; i < k; i++) ps.push(pick([5, 10, 15, 20, 25, 30, 40, 50], rng) * (rng() < 0.5 ? 1 : -1));
    let val = S;
    for (const p of ps) val = val * (100 + p) / 100;
    if (!isDec2(val) || val <= 0 || Math.abs(val - S) < 1e-9 || val > 2000) return null;
    const sum = ps.reduce((a, b) => a + b, 0);
    const slips = [S * (100 + sum) / 100, S * (100 + ps[ps.length - 1]) / 100, S * ps.reduce((a, p) => a * (100 + Math.abs(p)) / 100, 1), S + ps.reduce((a, p) => a + p, 0), val + (ps[0] > 0 ? 5 : -5)];
    const sg = (p) => (p > 0 ? '+' : '−') + Math.abs(p) + ' %';
    const text = S + ' → ' + ps.map(sg).join(' → ');
    const steps = [];
    let cur = S;
    ps.forEach((p) => { const nx = cur * (100 + p) / 100; steps.push(fmtNum(cur) + ' × ' + (100 + p) / 100 + ' = ' + fmtNum(nx)); cur = nx; });
    const q = {
      kind: 'mc', lang: 'de', stimulus: exprHTML(text), prompt: 'Endwert? (jede Änderung bezieht sich auf den Wert davor)',
      explain: 'Prozente nacheinander anwenden, nicht addieren: ' + steps.join('; ').replace(/(\d)\.(\d)/g, '$1,$2') + '.',
    };
    const mc = numMC(rng, round2(val), slips, fmtNum);
    if (!mc) return null;
    Object.assign(q, { options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(val)] });
    return attachMeta(q, { kind: 'chain', text });
  }
  function arFracHard(rng) {
    const dens = [3, 4, 5, 6, 7, 8, 9, 12, 15];
    const fr = () => { const d = pick(dens, rng); return { fr: [ri(1, d - 1, rng), d] }; };
    const v = ri(0, 3, rng);
    let seq;
    if (v === 0) seq = [fr(), pick(['+', '−'], rng), fr()];
    else if (v === 1) seq = [fr(), '÷', fr()];
    else if (v === 2) seq = [{ br: [fr(), '+', fr()] }, '×', fr()];
    else seq = [fr(), '−', fr(), '+', fr()];
    const ans = evalSeq(seq, 'std');
    if (qnum(ans) <= 0 || qnum(ans) > 6) return null;
    const text = showSeq(seq);
    const a = seq[0].fr || (seq[0].br && seq[0].br[0].fr), c = seq[2].fr || (seq[2].br ? null : null);
    const nums = flatten(seq).filter((x) => x && x.fr);
    const slips = [];
    if (nums.length >= 2) {
      const f1 = nums[0].fr, f2 = nums[1].fr;
      slips.push(Q(f1[0] + f2[0], f1[1] + f2[1]), Q(f1[0] * f2[0], f1[1] + f2[1]), Q(f1[0] + f2[0], f1[1] * f2[1]), Q(f1[0] * f2[1], f1[1] * f2[0]), Q(Math.abs(f1[0] - f2[0]), Math.abs(f1[1] - f2[1]) || 1));
      slips.push(evalSeq(seq, 'ltr'), evalSeq(flatten(seq), 'ltr'));
      if (v === 1) slips.push(Q(f1[0] * f2[0], f1[1] * f2[1]));
    }
    const dec = isDec2(qnum(ans)) && rng() < 0.7;
    const rep = dec ? 'num' : 'frac';
    if (rep === 'frac' && ans.d === 1) return null;
    const how = v === 1 ? 'Durch einen Bruch teilen heißt: mit dem Kehrwert multiplizieren.' : v === 2 ? 'Erst die Klammer mit gemeinsamem Nenner, dann multiplizieren.' : 'Auf den gemeinsamen Nenner bringen.';
    return ratQuestion(rng, {
      ans, slips, rep, text, prompt: dec ? 'Ergebnis? (als Dezimalzahl)' : 'Ergebnis? (als gekürzter Bruch)',
      explain: how + ' ' + text + ' = ' + (dec ? fmtNum(qnum(ans)) : qfrac(ans)) + '.',
    });
  }
  // Expressions to compare: value close together, text distinct, values distinct.
  function simpleExpr(rng) {
    const t = ri(0, 5, rng);
    let seq;
    if (t === 0) seq = [ri(3, 12, rng), '×', ri(3, 12, rng), pick(['+', '−'], rng), ri(2, 30, rng)];
    else if (t === 1) seq = [{ pw: [ri(5, 15, rng), 2] }, pick(['+', '−'], rng), ri(2, 40, rng)];
    else if (t === 2) seq = [{ br: [ri(5, 30, rng), pick(['+', '−'], rng), ri(2, 20, rng)] }, '×', ri(2, 5, rng)];
    else if (t === 3) seq = [ri(10, 60, rng), '+', { pc: [pick([10, 20, 25, 30, 40, 50, 75], rng), ri(2, 15, rng) * 20] }];
    else if (t === 4) seq = [ri(3, 9, rng), '×', ri(3, 9, rng), '+', ri(3, 9, rng), '×', ri(3, 9, rng)];
    else seq = [{ pw: [ri(2, 4, rng), 3] }, '×', ri(2, 6, rng), pick(['+', '−'], rng), ri(1, 25, rng)];
    return { text: showSeq(seq), val: evalSeq(seq, 'std') };
  }
  function arCompare(rng) {
    const pool = [];
    const anchor = ri(40, 160, rng);
    for (let i = 0; i < 80 && pool.length < 5; i++) {
      const e = simpleExpr(rng);
      const v = qnum(e.val);
      if (!Number.isInteger(v) || Math.abs(v - anchor) > 18 || v < 10) continue;
      if (pool.some((p) => p.text === e.text || qnum(p.val) === v)) continue;
      pool.push(e);
    }
    if (pool.length < 5) return null;
    const dir = rng() < 0.5 ? 'max' : 'min';
    const sorted = pool.slice().sort((x, y) => qnum(x.val) - qnum(y.val));
    const best = dir === 'max' ? sorted[4] : sorted[0];
    shuffle(pool, rng);
    const q = {
      kind: 'mc', lang: 'de', prompt: dir === 'max' ? 'Welcher Ausdruck hat den größten Wert?' : 'Welcher Ausdruck hat den kleinsten Wert?',
      options: pool.map((p) => p.text), answer: pool.indexOf(best), optionStyle: 'text',
      explain: pool.map((p) => p.text + ' = ' + qnum(p.val)).join('; ') + '. ' + (dir === 'max' ? 'Größter' : 'Kleinster') + ' Wert: ' + qnum(best.val) + '.',
    };
    return attachMeta(q, { kind: 'compare', dir });
  }

  const ARITH = {
    easy: (rng) => arEasy(rng),
    medium: (rng) => weighted([[arPercent, 3], [arFraction, 3], [arPower, 2], [arDivRem, 2]], rng)(rng),
    hard: (rng) => weighted([[arNested, 4], [arChain, 3], [arFracHard, 3], [arCompare, 2]], rng)(rng),
  };

  T.register({
    id: 'arith', name: 'Arithmetic', de: 'Rechenaufgaben', domain: 'numerical', n: 10, secs: 300, refSecs: 20, learn: 1.0, options: 5,
    tips: [
      'Order of operations: brackets first, then multiplication and division, then addition and subtraction.',
      'For percentages, find 10 % first (move the decimal point) and build the rest from it.',
      'With fractions, bring everything to a common denominator and reduce at the end.',
      'Estimate first: round the numbers and eliminate options that are far off.',
      'Check the form the answer is asked in (fraction, decimal, remainder) before you pick.',
    ],
    desc: {
      easy: 'Add, subtract and multiply small numbers where the order of operations matters.',
      medium: 'Percentages, simple fractions, powers and roots, and division with remainder.',
      hard: 'Nested brackets, percentage chains, fractions with unlike denominators and comparing expressions.',
    },
    make: retry((level, rng) => (ARITH[level] || ARITH.easy)(rng), 'arith'),
  });

  // =====================================================================================================
  // 2. wordprob - German word problems
  // =====================================================================================================
  const NAMES = [['Anna', 'f'], ['Ben', 'm'], ['Clara', 'f'], ['David', 'm'], ['Eva', 'f'], ['Felix', 'm'], ['Greta', 'f'], ['Hannes', 'm'],
    ['Ida', 'f'], ['Jonas', 'm'], ['Lena', 'f'], ['Lukas', 'm'], ['Mia', 'f'], ['Noah', 'm'], ['Paula', 'f'], ['Tim', 'm'], ['Sophie', 'f'], ['Jan', 'm']];
  const names = (k, rng) => sample(NAMES, k, rng);
  const PRON = { f: { s: 'sie', S: 'Sie' }, m: { s: 'er', S: 'Er' } };
  const fmtU = (v, unit) => (unit === '€' ? eur(v) : unit === '%' ? fmtNum(v) + ' %' : fmtNum(v) + (unit ? ' ' + unit : ''));
  const hhmm = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const dec2 = (v) => Number.isFinite(v) && isDec2(v);

  const WP = {};
  // each template: (lv, rng) => { story, ask, ans, unit, wrongs, explain, p, [fmt, typed, steps, ok] } or null

  WP.dist = (lv, rng) => {
    const veh = pick([['Ein Auto', 'das Auto', [60, 70, 80, 90, 100, 110, 120]], ['Ein Radfahrer', 'der Radfahrer', [12, 15, 18, 20, 24, 25]], ['Ein Zug', 'der Zug', [80, 100, 120, 140, 160]], ['Ein Bus', 'der Bus', [40, 50, 60, 70, 80]]], rng);
    const [ind, def, speeds] = veh;
    if (lv === 'easy') {
      const v = pick(speeds, rng), t = ri(2, 6, rng);
      return { story: `${ind} fährt ${t} Stunden lang mit einer gleichbleibenden Geschwindigkeit von ${v} km/h.`, ask: `Wie viele Kilometer legt ${def} in dieser Zeit zurück?`, ans: v * t, unit: 'km', wrongs: [v + t, round2(v / t), v * (t + 1), v * (t - 1), v * t * 2],
        explain: `Strecke = Geschwindigkeit × Zeit: ${v} km/h × ${t} h = ${v * t} km.`, p: { v, t } };
    }
    if (lv === 'medium') {
      if (rng() < 0.5) {
        const v = pick(speeds, rng), m = pick([12, 15, 20, 24, 30, 36, 40, 45, 48], rng), s = v * m / 60;
        if (!dec2(s)) return null;
        return { story: `${ind} legt ${fmtNum(s)} km in ${m} Minuten zurück und fährt dabei gleichmäßig schnell.`, ask: `Wie hoch ist die Geschwindigkeit in km/h?`, ans: v, unit: 'km/h', wrongs: [round2(s / m), s * m, round2(s * 100 / m), round2(60 / m * 10), round2(s / 60 * m)],
          explain: `${m} Minuten sind ${fmtNum(m / 60)} Stunden. Geschwindigkeit = ${fmtNum(s)} km ÷ ${fmtNum(m / 60)} h = ${v} km/h.`, p: { s, m } };
      }
      const v = pick(speeds, rng), m = pick([12, 18, 24, 30, 36, 42, 45, 54], rng), s = v * m / 60;
      if (!dec2(s) || s < 2) return null;
      return { story: `${ind} fährt mit einer gleichbleibenden Geschwindigkeit von ${v} km/h und soll eine Strecke von ${fmtNum(s)} km zurücklegen.`, ask: `Wie viele Minuten dauert die Fahrt?`, ans: m, unit: 'min', wrongs: [round2(s / v), round2(s * v), round2(s / v * 100), round2(60 / v * s * 2), m + 10, round2(v / s)],
        explain: `Zeit = Strecke ÷ Geschwindigkeit = ${fmtNum(s)} km ÷ ${v} km/h = ${fmtNum(s / v)} h = ${m} Minuten.`, p: { v, s } };
    }
    if (rng() < 0.5) { // two cyclists meet
      const v1 = ri(14, 24, rng), v2 = ri(14, 24, rng), tm = pick([15, 20, 30, 45, 60, 75, 90], rng), d = (v1 + v2) * tm / 60;
      if (!dec2(d) || v1 === v2) return null;
      return { story: `Zwei Orte sind ${fmtNum(d)} km voneinander entfernt. Um 9:00 Uhr fährt von jedem Ort aus ein Radfahrer dem anderen entgegen, der eine mit ${v1} km/h, der andere mit ${v2} km/h.`, ask: 'Nach wie vielen Minuten treffen sich die beiden?', ans: tm, unit: 'min',
        wrongs: [round2(d / v1 * 60), round2(d / v2 * 60), round2(d / Math.abs(v1 - v2) * 60), round2(d / ((v1 + v2) / 2) * 60), round2(d / (v1 + v2) * 100)],
        explain: `Die Geschwindigkeiten addieren sich: ${v1} + ${v2} = ${v1 + v2} km/h. Zeit = ${fmtNum(d)} km ÷ ${v1 + v2} km/h = ${fmtNum(d / (v1 + v2))} h = ${tm} Minuten.`, p: { d, v1, v2, start: 9 } };
    }
    const pairs = [[30, 60], [40, 60], [60, 90], [20, 30], [60, 120], [50, 75], [45, 90], [40, 120]];
    const [v1, v2] = pick(pairs, rng);
    const avg = 2 * v1 * v2 / (v1 + v2);
    if (!dec2(avg)) return null;
    return { story: `${ind} fährt eine Strecke hin mit ${v1} km/h und auf demselben Weg zurück mit ${v2} km/h.`, ask: 'Wie hoch ist die Durchschnittsgeschwindigkeit für Hin- und Rückweg zusammen?', ans: avg, unit: 'km/h',
      wrongs: [(v1 + v2) / 2, v1 + v2, round2(Math.sqrt(v1 * v2)), Math.abs(v1 - v2), round2(avg + 5)],
      explain: `Strecke s je Richtung: Gesamtzeit = s/${v1} + s/${v2}, Gesamtstrecke = 2s. Durchschnitt = 2 × ${v1} × ${v2} ÷ (${v1} + ${v2}) = ${fmtNum(avg)} km/h (nicht das einfache Mittel).`, p: { v1, v2 } };
  };

  const ITEMS = [['Eine Jacke', 'die Jacke'], ['Ein Rucksack', 'der Rucksack'], ['Ein Fahrrad', 'das Fahrrad'], ['Eine Kamera', 'die Kamera'], ['Ein Fernseher', 'der Fernseher'], ['Ein Sofa', 'das Sofa'], ['Eine Uhr', 'die Uhr']];
  WP.disc = (lv, rng) => {
    const [ind, def] = pick(ITEMS, rng);
    const P = pick([40, 60, 80, 100, 120, 150, 160, 200, 240, 250, 300, 400, 600], rng);
    const p = pick([10, 20, 25, 30, 40, 50], rng);
    if (lv === 'easy') {
      const d = P * p / 100;
      return { story: `${ind} kostet ${eur(P)}. Im Schlussverkauf wird der Preis um ${p} % gesenkt.`, ask: 'Wie viel Euro beträgt der Preisnachlass?', ans: d, unit: '€', wrongs: [P - d, P * p, round2(P / p), P + d, d * 2],
        explain: `${p} % von ${P} € = ${P} € × ${p} ÷ 100 = ${eur(d)}.`, p: { P, p } };
    }
    if (lv === 'medium') {
      const r = P * (100 - p) / 100;
      return { story: `${ind} kostet ${eur(P)}. Im Schlussverkauf wird der Preis um ${p} % gesenkt.`, ask: `Wie viel kostet ${def} nach der Preissenkung?`, ans: r, unit: '€', wrongs: [P * p / 100, P + P * p / 100, P - p, round2(P / (1 + p / 100)), r + 10],
        explain: `Neuer Preis = ${P} € × (100 − ${p}) ÷ 100 = ${eur(r)}.`, p: { P, p } };
    }
    if (rng() < 0.5) {
      const r = P * (100 - p) / 100;
      if (!dec2(r)) return null;
      return { story: `Nach einem Rabatt von ${p} % kostet ${ind.charAt(0).toLowerCase() + ind.slice(1)} nur noch ${eur(r)}.`, ask: 'Wie hoch war der ursprüngliche Preis?', ans: P, unit: '€',
        wrongs: [r * (100 + p) / 100, r + p, r + r * p / 100, r / p * 10, P + 20],
        explain: `${eur(r)} entsprechen ${100 - p} % des alten Preises. 1 % = ${fmtNum(r / (100 - p))} €, 100 % = ${eur(P)}.`, p: { r, p } };
    }
    const p2 = pick([10, 20, 25, 50], rng), fin = P * (100 - p) / 100 * (100 - p2) / 100;
    if (!dec2(fin) || p === p2) return null;
    return { story: `${ind} kostet ${eur(P)}. Zuerst wird der Preis um ${p} % gesenkt, an der Kasse gibt es auf den reduzierten Preis noch einmal ${p2} % Rabatt.`, ask: 'Wie viel muss man am Ende zahlen?', ans: fin, unit: '€',
      wrongs: [P * (100 - p - p2) / 100, P * (100 - p2) / 100, P * (100 - p) / 100, P - p - p2, fin + 5],
      explain: `Erst ${P} € × ${(100 - p) / 100} = ${eur(P * (100 - p) / 100)}, dann × ${(100 - p2) / 100} = ${eur(fin)}. Die Rabatte werden nicht addiert.`.replace(/(\d)\.(\d)/g, '$1,$2'), p: { P, p, p2 } };
  };

  WP.vat = (lv, rng) => {
    const rate = pick([19, 19, 7], rng), N = pick([20, 40, 50, 80, 100, 120, 150, 200, 250, 300, 450, 500], rng);
    const vat = N * rate / 100, G = N + vat;
    const thing = pick(['Eine Rechnung über Büromaterial', 'Ein Laptop', 'Eine Handwerkerleistung', 'Eine Lieferung Druckerpapier'], rng);
    if (lv === 'easy') return { story: `${thing} hat einen Nettobetrag von ${eur(N)}. Die Umsatzsteuer beträgt ${rate} %.`, ask: 'Wie hoch ist die Umsatzsteuer in Euro?', ans: vat, unit: '€', wrongs: [G, N - vat, N * rate, round2(N / rate), vat * 2],
      explain: `${rate} % von ${eur(N)} = ${eur(vat)}.`, p: { N, rate } };
    if (lv === 'medium') return { story: `${thing} hat einen Nettobetrag von ${eur(N)}. Die Umsatzsteuer beträgt ${rate} %.`, ask: 'Wie hoch ist der Bruttobetrag?', ans: G, unit: '€', wrongs: [vat, N - vat, N + rate, N * (1 + rate), G + 10],
      explain: `Brutto = Netto + Umsatzsteuer = ${eur(N)} + ${eur(vat)} = ${eur(G)}.`, p: { N, rate } };
    return { story: `${thing} kostet brutto ${eur(G)} (inklusive ${rate} % Umsatzsteuer).`, ask: 'Wie hoch ist der Nettobetrag?', ans: N, unit: '€', wrongs: [G - G * rate / 100, G - rate, G / (1 + rate / 100) + 10, G * rate / 100, G - vat * 2],
      explain: `Brutto = ${100 + rate} % des Nettos. Netto = ${eur(G)} ÷ ${(100 + rate) / 100} = ${eur(N)}. (Nicht ${rate} % vom Bruttobetrag abziehen.)`.replace(/(\d)\.(\d)/g, '$1,$2'), p: { G, rate } };
  };

  WP.interest = (lv, rng) => {
    const K = pick([500, 800, 1000, 1200, 1500, 2000, 2400, 3000, 4000, 5000], rng), p = pick([1, 1.5, 2, 2.5, 3, 4, 5], rng), nm = names(1, rng)[0][0];
    if (lv === 'easy') {
      const z = K * p / 100;
      if (!dec2(z)) return null;
      return { story: `${nm} legt ${eur(K)} für ein Jahr zu einem einfachen Zinssatz von ${fmtNum(p)} % pro Jahr an.`, ask: 'Wie viel Zinsen gibt es nach einem Jahr?', ans: z, unit: '€', wrongs: [K + z, K * p, round2(K / p), z * 2, round2(z / 12)],
        explain: `Zinsen = ${eur(K)} × ${fmtNum(p)} ÷ 100 = ${eur(z)}.`, p: { K, p } };
    }
    if (lv === 'medium') {
      const m = pick([3, 4, 6, 8, 9], rng), z = K * p * m / 1200;
      if (!dec2(z)) return null;
      return { story: `${nm} legt ${eur(K)} für ${m} Monate zu einem Zinssatz von ${fmtNum(p)} % pro Jahr an (einfache Verzinsung).`, ask: 'Wie viel Zinsen sind das nach diesen Monaten?', ans: z, unit: '€', wrongs: [K * p / 100, K * p * m / 100, round2(K * p / 100 * m / 6), round2(K * p / 100 / m), z * 2],
        explain: `Jahreszinsen: ${eur(K * p / 100)}. Für ${m} von 12 Monaten: ${eur(K * p / 100)} × ${m} ÷ 12 = ${eur(z)}.`, p: { K, p, m } };
    }
    if (rng() < 0.5) {
      const n = ri(2, 4, rng), E = K * (1 + p * n / 100);
      if (!dec2(E)) return null;
      return { story: `${nm} legt ${eur(K)} für ${n} Jahre zu einem einfachen Zinssatz von ${fmtNum(p)} % pro Jahr an. Die Zinsen werden am Ende ausgezahlt, nicht zwischendurch verzinst.`, ask: 'Wie hoch ist das Guthaben nach dieser Zeit (Kapital plus Zinsen)?', ans: E, unit: '€',
        wrongs: [K * p * n / 100, K * Math.pow(1 + p / 100, n), K * (1 + p / 100), K + p * n, E + K * p / 100],
        explain: `Zinsen für ${n} Jahre: ${eur(K)} × ${fmtNum(p)} ÷ 100 × ${n} = ${eur(K * p * n / 100)}. Guthaben: ${eur(E)}.`, p: { K, p, n } };
    }
    const n = ri(2, 5, rng), z = K * p * n / 100;
    if (!dec2(z)) return null;
    return { story: `Ein Sparbetrag bringt bei einem einfachen Zinssatz von ${fmtNum(p)} % pro Jahr in ${n} Jahren genau ${eur(z)} Zinsen.`, ask: 'Wie hoch ist der Sparbetrag?', ans: K, unit: '€', wrongs: [round2(z / p), round2(z * p / 100), round2(z * 100 / p), round2(z / n * 10), K + 500],
      explain: `Zinsen pro Jahr: ${eur(z)} ÷ ${n} = ${eur(z / n)}. Das sind ${fmtNum(p)} % des Betrags, also ${eur(z / n)} × 100 ÷ ${fmtNum(p)} = ${eur(K)}.`, p: { z, p, n } };
  };

  WP.ratio = (lv, rng) => {
    if (lv === 'easy') {
      const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 2], [2, 5], [3, 5]], rng), T = (a + b) * ri(2, 12, rng);
      const [x, y] = pick([['Saft', 'Wasser'], ['Sirup', 'Wasser'], ['Rot', 'Weiß']], rng);
      if (x === 'Rot') return { story: `Eine Wandfarbe wird aus roter und weißer Farbe im Verhältnis ${a} : ${b} gemischt. Insgesamt werden ${T} Liter angemischt.`, ask: 'Wie viel Liter weiße Farbe werden benötigt?', ans: T * b / (a + b), unit: 'l', wrongs: [T * a / (a + b), round2(T / b), T - b, T * b / a, round2(T / (a + b))],
        explain: `Insgesamt ${a} + ${b} = ${a + b} Teile. Ein Teil: ${T} l ÷ ${a + b} = ${T / (a + b)} l. Weiß: ${b} Teile = ${T * b / (a + b)} l.`, p: { a, b, T } };
      return { story: `${x} und ${y} werden im Verhältnis ${a} : ${b} gemischt. Insgesamt sollen ${T} Liter Getränk entstehen.`, ask: `Wie viel Liter ${y} werden benötigt?`, ans: T * b / (a + b), unit: 'l', wrongs: [T * a / (a + b), round2(T / b), T - b, T * b / a, round2(T / (a + b))],
        explain: `Insgesamt ${a} + ${b} = ${a + b} Teile. Ein Teil: ${T} l ÷ ${a + b} = ${T / (a + b)} l. ${y}: ${b} Teile = ${T * b / (a + b)} l.`, p: { a, b, T } };
    }
    if (lv === 'medium') {
      const [a, b, c] = pick([[2, 3, 5], [1, 2, 3], [1, 3, 4], [2, 2, 3], [3, 4, 5], [1, 1, 2]], rng), s = a + b + c, G = s * pick([100, 150, 200, 250, 300, 50], rng);
      const ns = names(3, rng).map((x) => x[0]);
      const lastIsMax = c >= a && c >= b;
      return { story: `${ns[0]}, ${ns[1]} und ${ns[2]} teilen sich einen Gewinn von ${eur(G)} im Verhältnis ${a} : ${b} : ${c} (in dieser Reihenfolge).`, ask: `Wie viel Euro erhält ${ns[2]}?`, ans: G * c / s, unit: '€',
        wrongs: [G * a / s, G * b / s, G / s, G * c / (a + b), G / c], explain: `Insgesamt ${s} Teile. Ein Teil: ${eur(G)} ÷ ${s} = ${eur(G / s)}. ${ns[2]} bekommt ${c} Teile = ${eur(G * c / s)}.${lastIsMax ? '' : ''}`, p: { a, b, c, G } };
    }
    if (rng() < 0.5) {
      const x = ri(2, 6, rng), y = ri(2, 6, rng), p1 = pick([4, 5, 6, 8, 9], rng), p2 = p1 + pick([2, 3, 4, 5], rng), tot = (x * p1 + y * p2) / (x + y);
      if (!dec2(tot) || x === y) return null;
      return { story: `${x} kg Kaffee zu ${eur(p1)} pro kg werden mit ${y} kg Kaffee zu ${eur(p2)} pro kg gemischt.`, ask: 'Wie viel kostet 1 kg der Mischung?', ans: tot, unit: '€', wrongs: [(p1 + p2) / 2, p1 + p2, x * p1 + y * p2, round2((x * p1 + y * p2) / 2), round2(tot + 1)],
        explain: `Gesamtpreis: ${x} × ${p1} + ${y} × ${p2} = ${x * p1 + y * p2} €. Gesamtmenge: ${x + y} kg. Preis je kg: ${eur(tot)}. (Nicht einfach der Mittelwert der Preise.)`, p: { x, y, p1, p2 } };
    }
    const [a, b] = pick([[3, 5], [2, 3], [4, 5], [3, 4], [5, 7]], rng), k = ri(3, 12, rng), B = a * k;
    return { story: `In einer Gruppe verhalten sich Jungen zu Mädchen wie ${a} : ${b}. Es sind ${B} Jungen in der Gruppe.`, ask: 'Wie viele Kinder sind es insgesamt?', ans: (a + b) * k, unit: '', wrongs: [b * k, B + b, B * (a + b), round2(B / (a + b)), (a + b) * k + a],
      explain: `${B} Jungen entsprechen ${a} Teilen, also ein Teil = ${k}. Insgesamt ${a + b} Teile: ${(a + b) * k} Kinder.`, p: { a, b, B } };
  };

  WP.work = (lv, rng) => {
    if (lv === 'easy') {
      const a = pick([20, 30, 40, 50, 60], rng), b = a + pick([10, 20], rng), h = ri(2, 6, rng);
      return { story: `Maschine A stellt ${a} Teile pro Stunde her, Maschine B stellt ${b} Teile pro Stunde her.`, ask: `Wie viele Teile stellen beide Maschinen zusammen in ${h} Stunden her?`, ans: (a + b) * h, unit: 'Teile',
        wrongs: [a + b, a * h, b * h, (a + b) / 2 * h, a * b * h / 100], explain: `Zusammen ${a} + ${b} = ${a + b} Teile pro Stunde. In ${h} Stunden: ${a + b} × ${h} = ${(a + b) * h} Teile.`, p: { a, b, h } };
    }
    if (lv === 'medium') {
      const a = pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30], rng), b = pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30], rng), t = a * b / (a + b);
      if (a === b || !dec2(t)) return null;
      const [n1, n2] = names(2, rng).map((x) => x[0]);
      return { story: `${n1} würde einen Garten allein in ${a} Stunden umgraben, ${n2} allein in ${b} Stunden. Beide arbeiten gleichzeitig und gleich schnell wie allein.`, ask: 'Wie viele Stunden brauchen die beiden zusammen?', ans: t, unit: 'h', wrongs: [(a + b) / 2, a + b, a * b, round2(Math.abs(a - b)), round2(t + 1)],
        explain: `Pro Stunde schaffen sie 1/${a} + 1/${b} = ${a + b}/${a * b} des Gartens. Zeit = ${a * b}/${a + b} h = ${fmtNum(t)} h.`, p: { a, b } };
    }
    const tri = pick([[12, 6, 4], [6, 3, 2], [10, 15, 30], [20, 30, 60], [8, 8, 4], [12, 12, 6], [6, 12, 12], [4, 6, 12], [15, 15, 10]], rng), [a, b, c] = tri, t = 1 / (1 / a + 1 / b + 1 / c);
    if (rng() < 0.5 && dec2(t)) {
      return { story: `Drei Pumpen leeren einen Teich. Die erste würde allein ${a} Stunden brauchen, die zweite ${b} Stunden und die dritte ${c} Stunden.`, ask: 'Wie viele Stunden brauchen alle drei zusammen?', ans: t, unit: 'h', wrongs: [(a + b + c) / 3, a + b + c, round2(t * 2), Math.min(a, b, c), round2(t + 1)],
        explain: `Zusammen schaffen sie pro Stunde 1/${a} + 1/${b} + 1/${c} = 1/${fmtNum(t)} des Teichs, also dauert es ${fmtNum(t)} Stunden.`, p: { a, b, c } };
    }
    const A = pick([6, 8, 10, 12], rng), B = pick([4, 6, 8, 12], rng), tt = pick([1, 2, 3], rng);
    const rest = 1 - tt / A, tot = tt + rest / (1 / A + 1 / B);
    if (rest <= 0 || !dec2(tot) || A === B) return null;
    return { story: `Eine Maschine A würde einen Auftrag allein in ${A} Stunden erledigen, Maschine B allein in ${B} Stunden. A startet allein, nach ${tt} Stunde${tt > 1 ? 'n' : ''} schaltet sich B dazu.`, ask: 'Wie viele Stunden nach dem Start von A ist der Auftrag erledigt?', ans: tot, unit: 'h',
      wrongs: [round2(A * B / (A + B) + tt), round2(A * B / (A + B)), (A + B) / 2, round2(tt + A * B / (A + B) * 1.5), round2(tot + 1)],
      explain: `Nach ${tt} h hat A ${tt}/${A} geschafft, es bleibt ${fmtNum(rest)} des Auftrags. Gemeinsam schaffen sie ${fmtNum(1 / A + 1 / B)} pro Stunde: ${fmtNum(rest / (1 / A + 1 / B))} h. Insgesamt ${fmtNum(tot)} h.`, p: { A, B, tt } };
  };

  WP.avg = (lv, rng) => {
    if (lv === 'easy') {
      const n = pick([4, 5], rng), arr = Array.from({ length: n }, () => ri(10, 28, rng)), s = arr.reduce((a, b) => a + b, 0);
      if (!dec2(s / n)) return null;
      return { story: `An ${n} Tagen wurden folgende Höchsttemperaturen gemessen (in °C): ${arr.join(', ')}.`, ask: 'Wie hoch ist die Durchschnittstemperatur?', ans: s / n, unit: '°C', wrongs: [s, arr[Math.floor(n / 2)], Math.max(...arr), round2((Math.max(...arr) + Math.min(...arr)) / 2), round2(s / (n + 1))],
        explain: `Summe: ${arr.join(' + ')} = ${s}. Durchschnitt: ${s} ÷ ${n} = ${fmtNum(s / n)} °C.`, p: { arr } };
    }
    if (lv === 'medium') {
      const m = pick([4, 5, 6], rng), avg = ri(65, 90, rng), last = ri(55, 98, rng), arr = [];
      let rest = avg * m - last;
      const cnt = m - 1;
      for (let i = 0; i < cnt - 1; i++) { const x = ri(55, 98, rng); arr.push(x); rest -= x; }
      arr.push(rest);
      if (arr.some((x) => x < 40 || x > 100)) return null;
      return { story: `Bei ${m} Tests hat ${names(1, rng)[0][0]} im Durchschnitt ${avg} Punkte erreicht. Die ersten ${cnt} Ergebnisse waren ${arr.join(', ')} Punkte.`, ask: `Wie viele Punkte gab es im letzten Test?`, ans: last, unit: 'Punkte',
        wrongs: [avg, round2((avg + arr[0]) / 2), avg * m, round2(arr.reduce((a, b) => a + b, 0) / cnt), last + 5], explain: `Gesamtpunkte: ${m} × ${avg} = ${avg * m}. Bisher: ${arr.join(' + ')} = ${avg * m - last}. Letzter Test: ${avg * m} − ${avg * m - last} = ${last}.`, p: { m, avg, arr } };
    }
    const n1 = ri(10, 30, rng), n2 = ri(10, 30, rng), m1 = ri(60, 85, rng), m2 = ri(60, 85, rng), t = (n1 * m1 + n2 * m2) / (n1 + n2);
    if (!dec2(t) || n1 === n2 || m1 === m2) return null;
    return { story: `In Klasse A schreiben ${n1} Schüler eine Arbeit mit einem Durchschnitt von ${m1} Punkten, in Klasse B schreiben ${n2} Schüler dieselbe Arbeit mit einem Durchschnitt von ${m2} Punkten.`, ask: 'Wie hoch ist der Durchschnitt aller Schüler zusammen?', ans: t, unit: 'Punkte',
      wrongs: [(m1 + m2) / 2, round2(t + 2), round2((n1 + n2) / 2), round2((n1 * m1 + n2 * m2) / 2), m1 > m2 ? m1 : m2],
      explain: `Gesamtpunkte: ${n1} × ${m1} + ${n2} × ${m2} = ${n1 * m1 + n2 * m2}. Schüler: ${n1 + n2}. Durchschnitt: ${fmtNum(t)} Punkte (nicht das einfache Mittel von ${m1} und ${m2}).`, p: { n1, m1, n2, m2 } };
  };

  WP.unit = (lv, rng) => {
    if (lv === 'easy') {
      const g = pick([250, 500, 200, 400, 750], rng), P = pick([1.2, 1.8, 2.4, 3.2, 4.5, 6, 9, 2.5, 3.5], rng), perKg = P * 1000 / g;
      if (!dec2(perKg)) return null;
      return { story: `Eine Packung Nudeln mit ${g} g kostet ${eur(P)}.`, ask: 'Wie viel kostet 1 kg zu diesem Preis?', ans: perKg, unit: '€', wrongs: [P * g / 1000, P * g, round2(P / g), perKg * 2, perKg + 1], explain: `1 kg = 1000 g = ${fmtNum(1000 / g)} Packungen. ${eur(P)} × ${fmtNum(1000 / g)} = ${eur(perKg)}.`, p: { g, P } };
    }
    if (lv === 'medium') {
      const gA = pick([250, 500, 750], rng), kA = pick([2.5, 3, 3.5, 4], rng), PA = kA * gA / 1000, kB = kA + pick([0.2, 0.3, 0.4, 0.5, -0.2, -0.3], rng), gB = 1000, PB = kB * gB / 1000;
      if (!dec2(PA) || !dec2(PB) || Math.abs(kA - kB) < 0.05) return null;
      return { story: `Kaffee im Angebot A: ${gA} g für ${eur(PA)}. Kaffee im Angebot B: 1 kg für ${eur(PB)}.`, ask: 'Um wie viel Euro unterscheiden sich die Preise pro Kilogramm?', ans: Math.abs(kA - kB), unit: '€', wrongs: [Math.abs(PA - PB), Math.abs(kA - kB) * 10, Math.abs(kA - kB) / 2, round2(PA + PB), round2(kA + kB)],
        explain: `Angebot A: ${eur(PA)} × ${1000 / gA} = ${eur(kA)} pro kg. Angebot B: ${eur(kB)} pro kg. Unterschied: ${eur(Math.abs(kA - kB))}.`, p: { gA, PA, gB: 1, PB } };
    }
    const k = pick([4, 5, 6], rng), nBuy = k * ri(2, 4, rng), pr = pick([1.2, 1.5, 2, 2.5, 0.8], rng), pay = nBuy / k * (k - 1) * pr;
    if (!dec2(pay)) return null;
    return { story: `Ein Supermarkt wirbt: „${k} zum Preis von ${k - 1}“. Ein einzelnes Eis kostet ${eur(pr)}. ${names(1, rng)[0][0]} kauft ${nBuy} Eis.`, ask: 'Wie viel muss bezahlt werden?', ans: pay, unit: '€', wrongs: [nBuy * pr, (nBuy - 1) * pr, round2(nBuy * pr * (k - 1) / k + pr), (nBuy / k) * pr, round2(pay + pr)],
      explain: `Je ${k} Eis zahlt man nur ${k - 1}. ${nBuy} Eis = ${nBuy / k} Päckchen zu je ${k - 1} × ${eur(pr)} = ${eur((k - 1) * pr)}. Gesamt ${eur(pay)}.`, p: { k, kk: k - 1, pr, nBuy } };
  };

  WP.age = (lv, rng) => {
    const [[nm, g]] = names(1, rng), fam = pick(['Vater', 'Mutter'], rng);
    if (lv === 'easy') {
      const a = ri(6, 16, rng), k = ri(2, 4, rng), x = ri(3, 8, rng);
      return { story: `${nm} ist ${a} Jahre alt. ${g === 'f' ? 'Ihre' : 'Seine'} Mutter ist ${k}-mal so alt.`, ask: 'Wie alt ist die Mutter in ' + x + ' Jahren?', ans: a * k + x, unit: 'Jahre', wrongs: [a * k, a + x, a * k * x, (a + x) * k, a * k - x],
        explain: `Heute: ${a} × ${k} = ${a * k} Jahre. In ${x} Jahren: ${a * k} + ${x} = ${a * k + x} Jahre.`, p: { a, k, x } };
    }
    if (lv === 'medium') {
      const D = ri(4, 14, rng) * 2, kid = ri(5, 20, rng), S = 2 * kid + D;
      return { story: `${fam === 'Vater' ? 'Ein Vater' : 'Eine Mutter'} und ${fam === 'Vater' ? 'sein' : 'ihr'} Kind sind zusammen ${S} Jahre alt. Der Altersunterschied beträgt ${D} Jahre.`, ask: 'Wie alt ist das Kind?', ans: kid, unit: 'Jahre', wrongs: [kid + D, S / 2, S - D, kid + D / 2, S - D / 2],
        explain: `Zwei gleiche Teile plus Unterschied: (${S} − ${D}) ÷ 2 = ${kid} Jahre.`, p: { S, D } };
    }
    if (rng() < 0.5) {
      const x = ri(3, 12, rng), D = x + ri(4, 30, rng), s = D - x;
      return { story: `${fam === 'Vater' ? 'Ein Vater' : 'Eine Mutter'} ist heute ${D} Jahre älter als ${fam === 'Vater' ? 'sein' : 'ihr'} Kind. In ${x} Jahren wird ${fam === 'Vater' ? 'er' : 'sie'} doppelt so alt sein wie das Kind.`, ask: 'Wie alt ist das Kind heute?', ans: s, unit: 'Jahre', wrongs: [D, D + x, D / 2, D - x * 2, x],
        explain: `Wenn ein Elternteil doppelt so alt ist, entspricht das Alter des Kindes genau dem Altersunterschied: in ${x} Jahren ist das Kind ${D} Jahre alt. Heute: ${D} − ${x} = ${s} Jahre.`, p: { D, x, _f: 2 } };
    }
    const x = ri(3, 10, rng), D = ri(4, 20, rng) * 2, s = D / 2 + x;
    return { story: `${fam === 'Vater' ? 'Ein Vater' : 'Eine Mutter'} ist heute ${D} Jahre älter als ${fam === 'Vater' ? 'sein' : 'ihr'} Kind. Vor ${x} Jahren war ${fam === 'Vater' ? 'er' : 'sie'} dreimal so alt wie das Kind.`, ask: 'Wie alt ist das Kind heute?', ans: s, unit: 'Jahre', wrongs: [D / 2, D, D / 2 - x, D + x, x * 3],
      explain: `Vor ${x} Jahren: Kind = k, Elternteil = 3k, Unterschied 2k = ${D}, also k = ${D / 2}. Heute: ${D / 2} + ${x} = ${s} Jahre.`, p: { D, x, _f: 3 } };
  };

  const FX = [['US-Dollar', '$', [1.05, 1.08, 1.1, 1.12, 1.15, 1.2]], ['britische Pfund', '£', [0.82, 0.84, 0.85, 0.86, 0.88]], ['Schweizer Franken', 'CHF', [0.92, 0.94, 0.95, 0.96, 0.98]], ['Zloty', 'PLN', [4.2, 4.3, 4.4, 4.5]], ['japanische Yen', '¥', [150, 155, 160, 165]]];
  WP.fx = (lv, rng) => {
    const [cur, sym, rates] = pick(FX, rng), r = pick(rates, rng), E = pick([20, 50, 80, 100, 120, 150, 200, 250, 400], rng), X = E * r;
    if (!dec2(X)) return null;
    const rt = `1 € = ${fmtNum(r)} ${sym}`;
    if (lv === 'easy') return { story: `Bei einer Reise gilt der Wechselkurs ${rt}.`, ask: `Wie viele ${sym} erhält man für ${E} €?`, ans: X, unit: sym, wrongs: [round2(E / r), E + r, round2(E * r * 10), round2(X + r), round2(E / r + 10)], explain: `${E} € × ${fmtNum(r)} = ${fmtNum(X)} ${sym}.`, p: { r, E } };
    if (lv === 'medium') return { story: `Der Wechselkurs beträgt ${rt}. ${names(1, rng)[0][0]} hat ${fmtNum(X)} ${sym} übrig und möchte alles in Euro zurücktauschen (ohne Gebühren).`, ask: 'Wie viel Euro erhält man?', ans: E, unit: '€', wrongs: [round2(X * r), round2(X - r), round2(X / (r * 10)), E + 10, round2(X * 0.9)],
      explain: `Rückrechnung: ${fmtNum(X)} ${sym} ÷ ${fmtNum(r)} = ${E} €.`, p: { r, X } };
    const [cur2, sym2, rates2] = pick(FX.filter((f) => f[1] !== sym), rng), r2 = pick(rates2, rng), Y = E * r2;
    if (!dec2(Y)) return null;
    return { story: `Es gilt ${rt} und 1 € = ${fmtNum(r2)} ${sym2}. ${names(1, rng)[0][0]} besitzt ${fmtNum(X)} ${sym} und tauscht sie über Euro in ${sym2} um (ohne Gebühren).`, ask: `Wie viele ${sym2} erhält man?`, ans: Y, unit: sym2, wrongs: [round2(X * r2), round2(X / r2), round2(X * r / r2), round2(X * r * r2), round2(Y + 10 * r2)],
      explain: `Zuerst in Euro: ${fmtNum(X)} ÷ ${fmtNum(r)} = ${E} €. Dann in ${sym2}: ${E} × ${fmtNum(r2)} = ${fmtNum(Y)} ${sym2}.`, p: { r, X, r2 } };
  };

  WP.dreisatz = (lv, rng) => {
    if (lv === 'easy') {
      const n = ri(3, 8, rng), n2 = ri(9, 15, rng), u = pick([0.5, 0.8, 1.2, 1.5, 2, 2.5, 3], rng), P = n * u;
      return { story: `${n} Hefte kosten zusammen ${eur(P)}.`, ask: `Wie viel kosten ${n2} Hefte zum gleichen Preis je Heft?`, ans: n2 * u, unit: '€', wrongs: [P + n2 - n, round2(P * n2), round2(P / n2), P * (n2 - n), round2(n2 * u + u)], explain: `1 Heft: ${eur(P)} ÷ ${n} = ${eur(u)}. ${n2} Hefte: ${eur(u)} × ${n2} = ${eur(n2 * u)}.`, p: { n, P, n2 } };
    }
    if (lv === 'medium') {
      const k = pick([3, 4, 5, 6, 8, 10], rng), d = pick([12, 15, 18, 20, 24, 30], rng), k2 = pick([2, 3, 4, 5, 6, 9, 12, 15], rng), r = k * d / k2;
      if (k === k2 || !dec2(r)) return null;
      return { story: `${k} Arbeiter brauchen für eine Baustelle ${d} Tage. Alle arbeiten gleich schnell.`, ask: `Wie viele Tage brauchen ${k2} Arbeiter?`, ans: r, unit: 'Tage', wrongs: [round2(d * k2 / k), d + k2 - k, d - (k2 - k), round2(d / k2), round2(r + 2)],
        explain: `Weniger Arbeiter brauchen länger, mehr Arbeiter kürzer (umgekehrte Proportionalität): ${k} × ${d} = ${k * d} Arbeitertage; ${k * d} ÷ ${k2} = ${fmtNum(r)} Tage.`, p: { k, d, k2 } };
    }
    const m = pick([2, 3, 4, 5], rng), h = pick([4, 6, 8], rng), n = m * h * pick([10, 15, 20, 25], rng), m2 = pick([2, 3, 4, 6, 8], rng), h2 = pick([3, 5, 6, 8, 10], rng), r = n / (m * h) * m2 * h2;
    if (m === m2 || !dec2(r)) return null;
    return { story: `${m} gleiche Maschinen stellen in ${h} Stunden ${n} Teile her.`, ask: `Wie viele Teile stellen ${m2} dieser Maschinen in ${h2} Stunden her?`, ans: r, unit: 'Teile', wrongs: [round2(n / m * m2), round2(n / h * h2), round2(n * m2 / m), round2(n * h2 / h), round2(r + n / (m * h))],
      explain: `Pro Maschine und Stunde: ${n} ÷ (${m} × ${h}) = ${fmtNum(n / (m * h))} Teile. Dann: ${fmtNum(n / (m * h))} × ${m2} × ${h2} = ${fmtNum(r)} Teile.`, p: { m, h, n, m2, h2 } };
  };

  WP.tank = (lv, rng) => {
    if (lv === 'easy') {
      const r = pick([10, 15, 20, 25, 30, 40, 50], rng), t = ri(8, 40, rng), V = r * t;
      return { story: `Ein Wassertank fasst ${V} Liter. Er wird durch einen Zulauf mit ${r} Litern pro Minute gefüllt.`, ask: 'Wie viele Minuten dauert es, bis der leere Tank voll ist?', ans: t, unit: 'min', wrongs: [round2(r / V * 100), V - r, V * r, t + 10, round2(V / r / 2)], explain: `Zeit = ${V} l ÷ ${r} l/min = ${t} Minuten.`, p: { V, r } };
    }
    if (lv === 'medium') {
      const out = pick([5, 8, 10, 12], rng), inn = out + pick([10, 15, 20, 25], rng), t = ri(10, 40, rng), V = (inn - out) * t;
      return { story: `Ein Becken fasst ${V} Liter. Der Zulauf bringt ${inn} Liter pro Minute, gleichzeitig fließen durch den Abfluss ${out} Liter pro Minute ab. Das Becken ist zu Beginn leer.`, ask: 'Nach wie vielen Minuten ist das Becken voll?', ans: t, unit: 'min', wrongs: [round2(V / inn), round2(V / (inn + out)), round2(V / out), t + 5, round2(V / inn * 1.2)],
        explain: `Netto füllen sich ${inn} − ${out} = ${inn - out} Liter pro Minute. Zeit = ${V} ÷ ${inn - out} = ${t} Minuten.`, p: { V, inn, out } };
    }
    const a = pick([2, 3, 4, 5, 6], rng), b = pick([6, 8, 10, 12, 15, 20], rng), t = a * b / (b - a);
    if (b <= a || !dec2(t)) return null;
    return { story: `Ein Schwimmbecken wird durch ein Rohr in ${a} Stunden gefüllt. Bei offenem Abfluss würde es in ${b} Stunden leerlaufen. Zu Beginn ist es leer, Rohr und Abfluss sind gleichzeitig geöffnet.`, ask: 'Nach wie vielen Stunden ist das Becken voll?', ans: t, unit: 'h', wrongs: [b - a, round2(a * b / (a + b)), a + b, round2(t + 1), round2((a + b) / 2)],
      explain: `Pro Stunde: 1/${a} − 1/${b} = ${b - a}/${a * b} des Beckens. Zeit = ${a * b}/${b - a} h = ${fmtNum(t)} h.`, p: { a, b } };
  };

  WP.relchg = (lv, rng) => {
    if (lv === 'easy') {
      const A = pick([40, 50, 60, 80, 100, 120, 200], rng), pct = pick([10, 20, 25, 50, 100], rng), B = A * (100 + pct) / 100;
      if (!dec2(B)) return null;
      return { story: `Der Preis eines Artikels steigt von ${eur(A)} auf ${eur(B)}.`, ask: 'Um wie viel Prozent ist der Preis gestiegen?', ans: pct, unit: '%', wrongs: [B - A, round2((B - A) / B * 100), pct + 5, round2(B / A * 100), pct * 2],
        explain: `Anstieg: ${eur(B)} − ${eur(A)} = ${eur(B - A)}. Bezogen auf den alten Preis: ${fmtNum(B - A)} ÷ ${A} = ${pct} %.`, p: { A, B } };
    }
    if (lv === 'medium') {
      const A = pick([50, 80, 100, 150, 200, 250, 400, 500], rng), pct = pick([10, 20, 25, 30, 40, 50, 60], rng), B = A * (100 - pct) / 100;
      if (!dec2(B)) return null;
      return { story: `Die Zahl der Besucher eines Museums sinkt von ${A} auf ${fmtNum(B)} pro Tag.`, ask: 'Um wie viel Prozent ist die Besucherzahl gesunken?', ans: pct, unit: '%', wrongs: [A - B, round2((A - B) / B * 100), pct + 5, round2(B / A * 100), pct - 5],
        explain: `Rückgang: ${A} − ${fmtNum(B)} = ${fmtNum(A - B)}. Bezogen auf den Ausgangswert ${A}: ${fmtNum(A - B)} ÷ ${A} = ${pct} %.`, p: { A, B } };
    }
    if (rng() < 0.6) {
      const p = pick([25, 100, 150, 300, 400], rng), ans = 100 * p / (100 + p);
      if (!dec2(ans)) return null;
      return { story: `Ein Preis wird um ${p} % erhöht. Danach soll er wieder auf den ursprünglichen Wert gesenkt werden.`, ask: 'Um wie viel Prozent muss der erhöhte Preis gesenkt werden?', ans, unit: '%', wrongs: [p, round2(p / 2), round2(100 - p), round2(ans + 5), round2(ans - 5)],
        explain: `Alter Preis 100, neuer Preis ${100 + p}. Rückgang um ${p} in Bezug auf ${100 + p}: ${p} ÷ ${100 + p} = ${fmtNum(ans)} %. (Nicht ${p} %!)`, p: { p, _v: 'back' } };
    }
    const p = pick([10, 20, 25, 30, 40, 50], rng), fin = (100 + p) * (100 - p) / 100;
    return { story: `Eine Aktie steigt an einem Tag um ${p} % und fällt am nächsten Tag um ${p} %.`, ask: 'Wie viel Prozent des ursprünglichen Wertes ist sie danach noch wert?', ans: fin, unit: '%', wrongs: [100, round2(100 - p), round2(100 + p), round2(fin + 2 * p / 10), round2(fin - 1)],
      explain: `Start 100 %. Nach dem Anstieg ${100 + p} %. Danach ${100 + p} % × ${(100 - p) / 100} = ${fmtNum(fin)} %.`.replace(/(\d)\.(\d)/g, '$1,$2'), p: { p, _v: 'updown' } };
  };

  WP.comb = (lv, rng) => {
    if (lv === 'easy') {
      const a = ri(3, 6, rng), b = ri(2, 5, rng);
      return { story: `${names(1, rng)[0][0]} hat ${a} verschiedene T-Shirts und ${b} verschiedene Hosen und kombiniert jeweils ein T-Shirt mit einer Hose.`, ask: 'Wie viele verschiedene Kombinationen gibt es?', ans: a * b, unit: '', wrongs: [a + b, a * b * 2, a * (b + 1), a * a * b, a * b - a],
        explain: `Jedes der ${a} T-Shirts lässt sich mit jeder der ${b} Hosen kombinieren: ${a} × ${b} = ${a * b}.`, p: { a, b } };
    }
    if (lv === 'medium') {
      const n = ri(5, 12, rng);
      if (rng() < 0.5) return { story: `Bei einem Treffen begrüßen sich ${n} Personen. Jede Person schüttelt jeder anderen genau einmal die Hand.`, ask: 'Wie viele Händedrücke gibt es insgesamt?', ans: n * (n - 1) / 2, unit: '', wrongs: [n * (n - 1), n * n, n * (n - 1) / 2 + n, n * (n + 1) / 2, n - 1],
        explain: `Jeder schüttelt ${n - 1} Händen, das sind ${n} × ${n - 1} = ${n * (n - 1)}; jeder Händedruck wurde dabei doppelt gezählt: ${n * (n - 1) / 2}.`, p: { n, _v: 'hands' } };
      return { story: `Ein Verein mit ${n} Mitgliedern wählt eine Vorsitzende oder einen Vorsitzenden und danach eine Stellvertretung. Niemand kann beide Ämter haben.`, ask: 'Wie viele verschiedene Besetzungen sind möglich?', ans: n * (n - 1), unit: '', wrongs: [n * (n - 1) / 2, n * n, n + (n - 1), n * (n - 2), n * (n - 1) + n],
        explain: `Für das erste Amt gibt es ${n} Möglichkeiten, für das zweite ${n - 1}: ${n} × ${n - 1} = ${n * (n - 1)}.`, p: { n, _v: 'roles' } };
    }
    const k = rng() < 0.5 ? 0 : 1;
    if (k === 0) { const a = ri(3, 5, rng), b = ri(2, 4, rng), c = ri(2, 4, rng); return { story: `Ein Menü besteht aus einer Vorspeise (${a} Auswahlmöglichkeiten), einem Hauptgericht (${b} Möglichkeiten) und einem Dessert (${c} Möglichkeiten).`, ask: 'Wie viele verschiedene Menüs lassen sich zusammenstellen?', ans: a * b * c, unit: '', wrongs: [a + b + c, a * b + c, a * b * c * 2, (a + b) * c, a * b * c - a],
      explain: `${a} × ${b} × ${c} = ${a * b * c}.`, p: { a, b, c } }; }
    const n = ri(5, 8, rng);
    return { story: `${n} Läuferinnen nehmen an einem Rennen teil. Die ersten drei erhalten Medaillen (Gold, Silber, Bronze). Es gibt keine gleichzeitigen Zieleinläufe.`, ask: 'Wie viele verschiedene Medaillenverteilungen sind möglich?', ans: n * (n - 1) * (n - 2), unit: '', wrongs: [n * (n - 1) * (n - 2) / 6, n * 3, n * n * n, n * (n - 1), n * (n - 1) * (n - 2) / 2],
      explain: `Gold: ${n} Möglichkeiten, Silber: ${n - 1}, Bronze: ${n - 2}. Zusammen ${n} × ${n - 1} × ${n - 2} = ${n * (n - 1) * (n - 2)}.`, p: { n, _v: 'podium' } };
  };

  WP.time = (lv, rng) => {
    const h = ri(6, 22, rng), m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], rng);
    const t0 = h * 60 + m;
    if (lv === 'easy') {
      const dur = pick([55, 70, 85, 95, 105, 115, 130, 145, 160], rng), t1 = t0 + dur;
      if (t1 >= 1440) return null;
      return { story: `Ein Film beginnt um ${h}:${String(m).padStart(2, '0')} Uhr und endet um ${Math.floor(t1 / 60)}:${String(t1 % 60).padStart(2, '0')} Uhr.`, ask: 'Wie viele Minuten dauert der Film?', ans: dur, unit: 'min', wrongs: [dur + 10, dur - 10, dur + 60, dur - 5, Math.floor(dur / 60) * 100 + dur % 60].filter((x) => x > 0),
        explain: `Von ${h}:${String(m).padStart(2, '0')} Uhr bis ${Math.floor(t1 / 60)}:${String(t1 % 60).padStart(2, '0')} Uhr sind ${Math.floor(dur / 60)} Stunden und ${dur % 60} Minuten, also ${dur} Minuten.`, p: { h, m, h2: Math.floor(t1 / 60), m2: t1 % 60 } };
    }
    if (lv === 'medium') {
      const dh = ri(1, 4, rng), dm = pick([10, 15, 25, 35, 40, 50], rng), t1 = t0 + dh * 60 + dm;
      if (t1 >= 1440) return null;
      return { story: `Ein Zug fährt um ${h}:${String(m).padStart(2, '0')} Uhr ab. Die Fahrt dauert ${dh} Stunden und ${dm} Minuten.`, ask: 'Wann kommt der Zug an?', ans: t1, unit: '', fmt: (v) => hhmm(v) + ' Uhr', typed: [hhmm(t1), hhmm(t1).replace(/^0/, '')],
        wrongs: [t0 + dh * 60, t0 + dh * 60 + dm + 60, t0 + dh * 100 + dm, t0 + dh * 60 + dm - 10, t0 + (dh + 1) * 60 + dm].map((x) => ((x % 1440) + 1440) % 1440), steps: [10, -10, 60, -60, 30, -30, 5, -5, 20, -20],
        explain: `${h}:${String(m).padStart(2, '0')} Uhr + ${dh} h ${dm} min = ${hhmm(t1)} Uhr.`, p: { h, m, dh, dm } };
    }
    const dh = ri(7, 14, rng), dm = pick([10, 20, 25, 35, 40, 50], rng), tz = pick([-9, -8, -7, -6, -5, 5, 6, 7, 8, 9], rng), t1 = t0 + dh * 60 + dm + tz * 60;
    const ort = tz < 0 ? pick([['New York', -6], ['Chicago', -7], ['Toronto', -6]], rng) : pick([['Singapur', 7], ['Peking', 7], ['Tokio', 8]], rng);
    const hd = Math.abs(tz);
    const where = tz < 0 ? 'früher' : 'später';
    const ans = ((t1 % 1440) + 1440) % 1440;
    return { story: `Ein Flugzeug startet in Frankfurt um ${h}:${String(m).padStart(2, '0')} Uhr (Ortszeit). Der Flug dauert ${dh} Stunden und ${dm} Minuten. Am Zielort ist es ${hd} Stunden ${where} als in Frankfurt.`, ask: 'Wie spät ist es bei der Landung am Zielort (Ortszeit)?', ans, unit: '', fmt: (v) => hhmm(v) + ' Uhr', typed: [hhmm(ans), hhmm(ans).replace(/^0/, '')],
      wrongs: [t0 + dh * 60 + dm, t0 + dh * 60 + dm - tz * 60, t0 + dh * 60 + tz * 60, t0 + dh * 60 + dm + 60 * (tz < 0 ? -1 : 1) * (hd - 1), t0 + tz * 60 + dm].map((x) => ((x % 1440) + 1440) % 1440), steps: [60, -60, 30, -30, 120, -120, 10, -10],
      explain: `Landung nach Frankfurter Zeit: ${h}:${String(m).padStart(2, '0')} + ${dh} h ${dm} min = ${hhmm(t0 + dh * 60 + dm)} Uhr. Zeitunterschied ${tz < 0 ? '−' : '+'}${hd} h: ${hhmm(ans)} Uhr Ortszeit.`, p: { h, m, dh, dm, hd }, tzSign: tz < 0 ? -1 : 1 };
  };

  const WP_LEVELS = {
    easy: [['dist', 2], ['disc', 2], ['vat', 1.5], ['interest', 1], ['ratio', 2], ['work', 1], ['avg', 1.5], ['unit', 1.5], ['age', 1.5], ['fx', 1.5], ['dreisatz', 2], ['tank', 1.5], ['relchg', 1.5], ['comb', 2], ['time', 2]],
  };
  WP_LEVELS.medium = WP_LEVELS.easy;
  WP_LEVELS.hard = WP_LEVELS.easy;

  T.register({
    id: 'wordprob', name: 'Word problems', de: 'Textaufgaben', domain: 'numerical', n: 10, secs: 480, refSecs: 45, learn: 0.8, options: 5,
    tips: [
      'Underline the question and the numbers, then write down which quantity you are asked for.',
      'Percentages always refer to a base value: decide what the 100 % is before you calculate.',
      'Reduce rate problems to one unit first (per hour, per item, per kg), then scale up.',
      'For work and flow problems add the rates (per hour), not the times.',
      'Reasonableness check: is the result in the right ballpark and the right unit?',
    ],
    desc: {
      easy: 'One-step German word problems: distance, discount, VAT, ratios, averages and proportions.',
      medium: 'Two-step problems such as discounted prices, interest for months, shared profits and work together.',
      hard: 'Multi-step problems: percentage traps, average speed, mixtures, work rates, time zones and combinatorics.',
    },
    make(level, rng) {
      for (let i = 0; i < 600; i++) {
        const name = weighted(WP_LEVELS[level] || WP_LEVELS.easy, rng);
        const r = WP[name](level, rng);
        if (!r || !(r.ans === r.ans) || !isFinite(r.ans)) continue;
        const fmt = r.fmt || ((v) => fmtU(v, r.unit));
        const wrongs = (r.wrongs || []).filter((x) => typeof x === 'number');
        const opts = { ok: r.fmt ? (v) => v >= 0 && v < 1440 : (v) => v > 0, steps: r.steps };
        if (!dec2(r.ans)) continue;
        const mc = numMC(rng, r.ans, wrongs.filter((x) => dec2(x) || r.fmt), fmt, opts);
        if (!mc) continue;
        const q = {
          kind: 'mc', lang: 'de', stimulus: '<p style="margin:0;line-height:1.5">' + esc(r.story) + '</p>', prompt: r.ask,
          options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: r.typed || [dotStr(r.ans)],
          explain: r.explain.replace(/\s+/g, ' ').replace(/(\d)\.(\d)/g, '$1,$2'),
        };
        return attachMeta(q, { tpl: name, p: r.p, ans: r.ans, tzSign: r.tzSign });
      }
      throw new Error('wordprob: could not build a question for ' + level);
    },
  });

  // =====================================================================================================
  // 3. nummatrix - 3x3 number matrices with one missing cell
  // =====================================================================================================
  // A rule form F maps (a, b, t) -> third number of a line. t is a small parameter (constant or multiplier) that
  // may change linearly from line to line (t = t0 + beta * lineIndex, beta integer).
  const NM_VMAX = 500;
  const NM_FORMS = (() => {
    const F = [];
    const term = (k, w) => (k === 1 ? w : k + ' × ' + w);
    const tail = (t) => (t === 0 ? '' : t > 0 ? ' + ' + t : ' − ' + -t);
    const tr = (lo, hi) => { const a = []; for (let i = lo; i <= hi; i++) a.push(i); return a; };
    for (const p of [-3, -2, -1, 1, 2, 3]) for (const q of [-3, -2, -1, 1, 2, 3]) {
      F.push({ id: 'lin' + p + ',' + q, tr: tr(-9, 9), f: (a, b, t) => p * a + q * b + t, in: [2, 30],
        desc: (t, w) => (p < 0 ? '−' : '') + term(Math.abs(p), w[0]) + (q < 0 ? ' − ' : ' + ') + term(Math.abs(q), w[1]) + tail(t) });
    }
    F.push({ id: 'mul', tr: tr(-9, 9), f: (a, b, t) => a * b + t, in: [2, 9], desc: (t, w) => w[0] + ' × ' + w[1] + tail(t) });
    for (const q of [-2, -1, 1, 2]) {
      F.push({ id: 'sqa' + q, tr: tr(-9, 9), f: (a, b, t) => a * a + q * b + t, in: [2, 12], desc: (t, w) => w[0] + '² ' + (q < 0 ? '− ' : '+ ') + term(Math.abs(q), w[1]) + tail(t) });
      F.push({ id: 'sqb' + q, tr: tr(-9, 9), f: (a, b, t) => b * b + q * a + t, in: [2, 12], desc: (t, w) => w[1] + '² ' + (q < 0 ? '− ' : '+ ') + term(Math.abs(q), w[0]) + tail(t) });
    }
    F.push({ id: 'sqdiff', tr: tr(-9, 9), f: (a, b, t) => a * a - b * b + t, in: [2, 12], desc: (t, w) => w[0] + '² − ' + w[1] + '²' + tail(t) });
    // multiplier forms: t is the coefficient
    F.push({ id: 'cb+', tr: tr(-3, 9), f: (a, b, t) => a + t * b, in: [2, 25], desc: (t, w) => w[0] + (t < 0 ? ' − ' : ' + ') + term(Math.abs(t), w[1]) });
    F.push({ id: 'ca+', tr: tr(-3, 9), f: (a, b, t) => t * a + b, in: [2, 25], desc: (t, w) => term(t, w[0]) + ' + ' + w[1] });
    F.push({ id: 'ca-', tr: tr(-3, 9), f: (a, b, t) => t * a - b, in: [2, 25], desc: (t, w) => term(t, w[0]) + ' − ' + w[1] });
    F.push({ id: 'cb-', tr: tr(-3, 9), f: (a, b, t) => a - t * b, in: [2, 25], desc: (t, w) => w[0] + ' − ' + term(t, w[1]) });
    F.push({ id: 'div', tr: [0], f: (a, b) => (b !== 0 && a % b === 0 ? a / b : NaN), in: [2, 9], desc: (t, w) => w[0] + ' ÷ ' + w[1] });
    F.push({ id: 'mean', tr: [0], f: (a, b) => ((a + b) % 2 === 0 ? (a + b) / 2 : NaN), in: [2, 40], desc: (t, w) => '(' + w[0] + ' + ' + w[1] + ') ÷ 2' });
    return F;
  })();
  const NM_BY_ID = {};
  NM_FORMS.forEach((f) => { NM_BY_ID[f.id] = f; });

  // All values the missing cell can take under any hypothesis that fits every complete line.
  function nmPredict(g, mr, mc) {
    const preds = new Set();
    for (const orient of ['row', 'col']) {
      const line = (j) => (orient === 'row' ? [g[j][0], g[j][1], g[j][2]] : [g[0][j], g[1][j], g[2][j]]);
      const mLine = orient === 'row' ? mr : mc, mPos = orient === 'row' ? mc : mr;
      const complete = [0, 1, 2].filter((j) => j !== mLine);
      const [i, j] = complete;
      for (const F of NM_FORMS) {
        const ts = complete.map((k) => { const [a, b, c] = line(k); return F.tr.filter((t) => F.f(a, b, t) === c); });
        if (!ts[0].length || !ts[1].length) continue;
        for (const t1 of ts[0]) for (const t2 of ts[1]) {
          const d = j - i;
          if ((t2 - t1) % d !== 0) continue;
          const beta = (t2 - t1) / d;
          if (Math.abs(beta) > 5) continue;
          const tm = t1 + beta * (mLine - i);
          if (F.tr.indexOf(tm) < 0) continue;
          const ln = line(mLine);
          if (mPos === 2) {
            const v = F.f(ln[0], ln[1], tm);
            if (Number.isInteger(v) && v >= 0 && v <= NM_VMAX) preds.add(v);
          } else {
            for (let v = 0; v <= NM_VMAX; v++) {
              const x = ln.slice();
              x[mPos] = v;
              if (F.f(x[0], x[1], tm) === x[2]) preds.add(v);
            }
          }
        }
      }
    }
    return preds;
  }

  function nmBuild(rng, level) {
    let grid, how;
    const inRange = (F, r) => ri(F.in[0], F.in[1], r);
    const finish = (rows, hint) => { grid = rows; how = hint; };
    const buildRows = (F, tOf) => {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const a = inRange(F, rng), b = inRange(F, rng), t = tOf(r), c = F.f(a, b, t);
        if (!Number.isInteger(c)) return null;
        rows.push([a, b, c]);
      }
      return rows;
    };
    const rowsOK = (rows) => rows && rows.every((r) => r.every((v) => Number.isInteger(v) && v >= 1 && v <= 400));
    if (level === 'easy') {
      const id = pick(['lin1,1', 'lin1,-1', 'mul', 'lin1,1'], rng), F = NM_BY_ID[id];
      const rows = buildRows(F, () => 0);
      if (!rowsOK(rows)) return null;
      finish(rows, { F, tOf: () => 0, orient: 'row' });
    } else if (level === 'medium') {
      const id = pick(['lin2,1', 'lin1,2', 'lin3,-1', 'lin2,-1', 'sqa-1', 'sqa1', 'mul', 'lin1,1', 'lin1,-1', 'lin3,1', 'lin1,3', 'sqdiff', 'div', 'mean'], rng), F = NM_BY_ID[id];
      let t = F.tr.length > 1 ? ri(-9, 9, rng) : 0;
      if (id === 'mul' || id === 'lin1,1' || id === 'lin1,-1') t = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7], rng);
      else if (id.indexOf('sq') === 0 || id.indexOf('lin') === 0) t = rng() < 0.5 ? 0 : ri(-5, 5, rng);
      let rows;
      if (id === 'div') {
        rows = [];
        for (let r = 0; r < 3; r++) { const b = ri(2, 9, rng), c = ri(2, 12, rng); rows.push([b * c, b, c]); }
      } else if (id === 'mean') {
        rows = [];
        for (let r = 0; r < 3; r++) { const a = ri(2, 40, rng) * 2, c = ri(2, 40, rng) * 2 - 0; rows.push([a, 2 * c - a, c]); }
        if (rows.some((x) => x[1] < 1)) return null;
      } else rows = buildRows(F, () => t);
      if (!rowsOK(rows)) return null;
      finish(rows, { F, tOf: () => t, orient: rng() < 0.4 ? 'col' : 'row' });
    } else if (rng() < 0.55) {
      const id = pick(['cb+', 'ca+', 'ca-', 'cb-', 'lin1,1', 'mul', 'lin2,1', 'lin1,-1', 'sqa-1'], rng), F = NM_BY_ID[id];
      const beta = pick([1, 1, 2, -1, 2, 3], rng);
      const isCoef = id[0] === 'c';
      const t0 = isCoef ? (beta > 0 ? ri(1, 3, rng) : ri(4, 8, rng)) : ri(-4, 4, rng);
      const rows = buildRows(F, (r) => t0 + beta * r);
      if (!rowsOK(rows)) return null;
      finish(rows, { F, tOf: (r) => t0 + beta * r, orient: rng() < 0.4 ? 'col' : 'row', beta });
    } else {
      // the same rule works along rows AND columns (linear or product rule)
      const id = pick(['lin1,1', 'lin1,-1', 'lin2,1', 'lin1,2', 'mul', 'lin1,1', 'lin3,-1'], rng), F = NM_BY_ID[id];
      const t = id === 'mul' ? 0 : pick([0, 0, 1, -1, 2], rng);
      const a = [[0, 0], [0, 0], [0, 0]];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) a[r][c] = inRange(F, rng);
      for (let r = 0; r < 2; r++) a[r][2] = F.f(a[r][0], a[r][1], t);
      for (let c = 0; c < 2; c++) a[2][c] = F.f(a[0][c], a[1][c], t);
      a[2][2] = F.f(a[2][0], a[2][1], t);
      if (a[2][2] !== F.f(a[0][2], a[1][2], t)) return null;
      if (!rowsOK(a)) return null;
      finish(a, { F, tOf: () => t, orient: 'row', both: true });
    }
    // orientation: the rule may run down the columns instead
    if (how.orient === 'col') grid = [0, 1, 2].map((r) => [0, 1, 2].map((c) => grid[c][r]));
    // missing cell
    let mr, mc;
    if (level === 'easy') { mc = how.orient === 'col' ? ri(0, 2, rng) : 2; mr = how.orient === 'col' ? 2 : ri(0, 2, rng); }
    else if (level === 'medium' && rng() < 0.65) { mc = how.orient === 'col' ? ri(0, 2, rng) : 2; mr = how.orient === 'col' ? 2 : ri(0, 2, rng); }
    else { mr = ri(0, 2, rng); mc = ri(0, 2, rng); }
    const ans = grid[mr][mc];
    const preds = nmPredict(grid, mr, mc);
    if (preds.size !== 1 || !preds.has(ans)) return null;
    // slips: other simple rules applied to the incomplete line
    const slips = [];
    const ln = (how.orient === 'row' ? grid[mr] : [grid[0][mc], grid[1][mc], grid[2][mc]]);
    const [x0, x1, x2] = ln;
    const pos = how.orient === 'row' ? mc : mr;
    if (pos === 2) slips.push(x0 + x1, x0 * x1, Math.abs(x0 - x1), x0 + x1 + 1, x0 + x1 - 1, 2 * x0 + x1, x0 + 2 * x1);
    else if (pos === 1) slips.push(x2 - x0, x2 + x0, Math.round(x2 / x0), x0 * 2 - x2, x2 - 1, x2 + 1);
    else slips.push(x2 - x1, x2 + x1, Math.round(x2 / x1), x1 * 2 - x2, x2 - 1, x2 + 1);
    return { grid, mr, mc, ans, how, slips };
  }

  function nmExplain(b) {
    const { how, grid, mr, mc, ans } = b;
    const col = how.orient === 'col';
    const words = col ? ['top', 'middle'] : ['first', 'second'];
    const ln = col ? [0, 1, 2].map((r) => grid[r][mc]) : grid[mr];
    const lineIdx = col ? mc : mr;
    const t = how.tOf(lineIdx);
    const unit = col ? 'column' : 'row';
    const third = col ? 'bottom' : 'third';
    let s = 'In every ' + unit + ', the ' + third + ' number = ' + how.F.desc(how.tOf(0), words) + '.';
    if (how.beta) s = 'The rule changes steadily from ' + unit + ' to ' + unit + ' (' + [0, 1, 2].map((k) => unit + ' ' + (k + 1) + ': ' + third + ' = ' + how.F.desc(how.tOf(k), words)).join('; ') + ').';
    if (how.both) s = 'The same rule holds along every row and every column: the last number of a line = ' + how.F.desc(t, ['first', 'second']) + ' (rows) and = ' + how.F.desc(t, ['top', 'middle']) + ' (columns).';
    return s + ' The missing number is ' + ans + '.';
  }
  const nmTable = (g, mr, mc) => '<table class="nm">' + g.map((row, r) => '<tr>' + row.map((v, c) => (r === mr && c === mc ? '<td class="q">?</td>' : '<td>' + v + '</td>')).join('') + '</tr>').join('') + '</table>';

  T.register({
    id: 'nummatrix', name: 'Number matrices', de: 'Zahlenmatrizen', domain: 'numerical', n: 10, secs: 360, refSecs: 35, learn: 0.8, options: 5,
    tips: [
      'Look at a complete row first: test sum, difference and product of the first two numbers against the third.',
      'If rows do not work, try the columns, or both: some grids obey the same rule in both directions.',
      'Check the rule on a second complete line before you trust it.',
      'If the numbers grow fast, think multiplication or squares; if they change slowly, think addition.',
      'When the rule changes from line to line, look for a steady pattern in the changing part.',
    ],
    desc: {
      easy: 'One rule across every row: add, subtract or multiply the first two numbers.',
      medium: 'Weighted sums, squares, constants and rules that run down the columns instead of across.',
      hard: 'The changing part grows from line to line, or one rule works along rows and columns at once.',
    },
    make: retry((level, rng) => {
      const b = nmBuild(rng, level);
      if (!b) return null;
      const mc = numMC(rng, b.ans, b.slips, String, { ok: (v) => v >= 0 && v <= 999 });
      if (!mc) return null;
      const q = {
        kind: 'mc', stimulus: nmTable(b.grid, b.mr, b.mc), prompt: 'Which number replaces the ? so that the rule holds?',
        options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [String(b.ans)], explain: nmExplain(b),
      };
      return attachMeta(q, { grid: b.grid, mr: b.mr, mc: b.mc, ans: b.ans });
    }, 'nummatrix'),
  });

  // =====================================================================================================
  // 4. numanalogy - input/output tables and "a : b = c : d = e : ?"
  // =====================================================================================================
  const dsum = (x) => String(Math.abs(x)).split('').reduce((s, c) => s + Number(c), 0);
  const drev = (x) => Number(String(Math.abs(x)).split('').reverse().join('')) * (x < 0 ? -1 : 1);
  const FA_BASES = [
    { g: (x) => x, ps: [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { g: (x) => x * x * x, ps: [-1, 1, 2, 3] },
    { g: (x) => Math.pow(2, x), ps: [-1, 0.5, 1, 2, 3, 5] },
    { g: (x) => Math.pow(3, x), ps: [-1, 1, 2] },
    { g: dsum, ps: [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { g: drev, ps: [-1, 0.5, 1, 2, 3, 4] },
    { g: (x) => x + dsum(x), ps: [1, 2] },
    { g: (x) => x - dsum(x), ps: [0.5, 1] },
    { g: (x) => x * dsum(x), ps: [1, 2] },
    { g: (x) => x + drev(x), ps: [1, 2] },
    { g: (x) => x * (x + 1) * (x + 2), ps: [1, 0.5] },
    { g: (x) => x * x * x - x, ps: [1, 0.5] },
  ];
  // every hypothesis p*g(x) + q (|q| <= 60) or c*x^2 + l*x + q that fits all shown pairs -> predicted output for xq
  function faPredict(pairs, xq) {
    const out = new Set();
    const [x0, y0] = pairs[0];
    const fit = (g, p) => {
      const q = y0 - p * g(x0);
      if (!Number.isInteger(q) || Math.abs(q) > 60) return;
      for (let i = 1; i < pairs.length; i++) if (p * g(pairs[i][0]) + q !== pairs[i][1]) return;
      const v = p * g(xq) + q;
      if (Number.isInteger(v) && Math.abs(v) < 1e6) out.add(v);
    };
    FA_BASES.forEach((b) => b.ps.forEach((p) => fit(b.g, p)));
    for (const c of [0.5, 1, 2, 3, -1, -2]) for (let l = -14; l <= 14; l++) fit((x) => c * x * x + l * x, 1);
    return out;
  }

  const FAMS = [
    { id: 'add', lv: ['easy'], an: true, gen: (r) => { const k = ri(2, 15, r); return { f: (x) => x + k, desc: 'n + ' + k, xr: [1, 20] }; } },
    { id: 'mul', lv: ['easy'], an: true, gen: (r) => { const k = ri(2, 9, r); return { f: (x) => x * k, desc: 'n × ' + k, xr: [1, 12] }; } },
    { id: 'ksub', lv: ['easy'], an: true, gen: (r) => { const k = ri(20, 40, r); return { f: (x) => k - x, desc: k + ' − n', xr: [1, 19] }; } },
    { id: 'half', lv: ['easy'], an: true, gen: () => ({ f: (x) => x / 2, desc: 'n ÷ 2', xr: [1, 30], step: 2 }) },
    { id: 'sub', lv: ['easy'], an: true, gen: (r) => { const k = ri(2, 12, r); return { f: (x) => x - k, desc: 'n − ' + k, xr: [14, 50] }; } },
    { id: 'lin2', lv: ['medium'], an: true, gen: (r) => { const k = ri(2, 6, r), m = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7], r); return { f: (x) => x * k + m, desc: 'n × ' + k + (m > 0 ? ' + ' + m : ' − ' + -m), xr: [1, 12] }; } },
    { id: 'sq', lv: ['medium'], an: true, gen: (r) => { const k = pick([0, 0, -3, -2, -1, 1, 2, 3, 5], r); return { f: (x) => x * x + k, desc: 'n²' + (k > 0 ? ' + ' + k : k < 0 ? ' − ' + -k : ''), xr: [2, 12] }; } },
    { id: 'pron', lv: ['medium'], an: false, gen: () => ({ f: (x) => x * (x + 1), desc: 'n × (n + 1)', xr: [1, 12] }) },
    { id: 'cube', lv: ['medium'], an: true, gen: () => ({ f: (x) => x * x * x, desc: 'n³', xr: [1, 7] }) },
    { id: 'sqm', lv: ['medium'], an: false, gen: (r) => { const k = ri(2, 3, r); return { f: (x) => k * x * x, desc: k + ' × n²', xr: [1, 9] }; } },
    { id: 'lin3', lv: ['medium', 'hard'], an: false, gen: (r) => { const k = ri(6, 12, r), m = pick([-7, -5, -3, 2, 4, 6, 9], r); return { f: (x) => x * k + m, desc: 'n × ' + k + (m > 0 ? ' + ' + m : ' − ' + -m), xr: [1, 15] }; } },
    { id: 'pow2', lv: ['hard'], an: false, gen: (r) => { const k = pick([-3, -2, -1, 1, 2, 3, 5], r); return { f: (x) => Math.pow(2, x) + k, desc: '2ⁿ' + (k > 0 ? ' + ' + k : ' − ' + -k), xr: [1, 9] }; } },
    { id: 'pow3', lv: ['hard'], an: false, gen: (r) => { const k = pick([-2, -1, 0, 1, 2], r); return { f: (x) => Math.pow(3, x) + k, desc: '3ⁿ' + (k > 0 ? ' + ' + k : k < 0 ? ' − ' + -k : ''), xr: [1, 6] }; } },
    { id: 'nn1', lv: ['hard'], an: false, gen: () => ({ f: (x) => x * x - x, desc: 'n² − n', xr: [2, 12] }) },
    { id: 'cubek', lv: ['hard'], an: false, gen: (r) => { const k = pick([-3, -2, -1, 1, 2, 3, 4], r); return { f: (x) => x * x * x + k, desc: 'n³' + (k > 0 ? ' + ' + k : ' − ' + -k), xr: [1, 7] }; } },
    { id: 'tri', lv: ['hard'], an: false, gen: () => ({ f: (x) => x * (x + 1) / 2, desc: 'n × (n + 1) ÷ 2', xr: [2, 14] }) },
    { id: 'sq2', lv: ['hard'], an: false, gen: (r) => { const k = pick([-4, -2, 1, 3, 5], r); return { f: (x) => 2 * x * x + k, desc: '2 × n² ' + (k > 0 ? '+ ' + k : '− ' + -k), xr: [2, 10] }; } },
    { id: 'dsadd', lv: ['hard'], an: true, gen: () => ({ f: (x) => x + dsum(x), desc: 'n + (digit sum of n)', xr: [11, 98], digits: true }) },
    { id: 'dsmul', lv: ['hard'], an: true, gen: (r) => { const k = ri(2, 5, r); return { f: (x) => dsum(x) * k, desc: '(digit sum of n) × ' + k, xr: [12, 98], digits: true }; } },
    { id: 'rev', lv: ['medium', 'hard'], an: true, gen: () => ({ f: (x) => drev(x), desc: 'reverse the digits of n', xr: [12, 98], digits: true, norev: true }) },
    { id: 'revk', lv: ['hard'], an: true, gen: (r) => { const k = pick([1, 2, 5, 9, 10], r); return { f: (x) => drev(x) + k, desc: '(n reversed) + ' + k, xr: [12, 98], digits: true, norev: true }; } },
    { id: 'dsq', lv: ['hard'], an: false, gen: () => ({ f: (x) => x - dsum(x), desc: 'n − (digit sum of n)', xr: [11, 98], digits: true }) },
  ];

  function faDistinctInputs(rng, g, k) {
    const step = g.step || 1, xs = [];
    let guard = 0;
    while (xs.length < k && guard++ < 60) {
      let x = ri(Math.ceil(g.xr[0] / step), Math.floor(g.xr[1] / step), rng) * step;
      if (g.digits) { const t = ri(1, 9, rng), u = ri(0, 9, rng); x = t * 10 + u; if (g.norev && u === 0) continue; if (x < g.xr[0] || x > g.xr[1]) continue; }
      if (!xs.includes(x)) xs.push(x);
    }
    return xs.length === k ? xs : null;
  }
  function faSlips(pairs, xq, ans) {
    const s = [];
    const [xa, ya] = pairs[pairs.length - 1], [xb, yb] = pairs[pairs.length - 2];
    if (xa !== xb) { const sl = (ya - yb) / (xa - xb); s.push(ya + sl * (xq - xa)); }
    if (xa !== 0) s.push(ya / xa * xq);
    s.push(ya + (xq - xa), yb + (xq - xb), ya * 2 - yb, drev(ans), ans + 1, ans - 1, ans + 10, ans - 10);
    return s.filter((v) => Number.isInteger(v));
  }

  function faBuild(rng, level, analogy) {
    const pool = FAMS.filter((f) => f.lv.includes(level) && (!analogy || f.an));
    const fam = pick(pool, rng), g = fam.gen(rng);
    const npairs = analogy ? 2 : 3;
    for (let np = npairs; np <= 3; np++) {
      const xs = faDistinctInputs(rng, g, np + 1);
      if (!xs) return null;
      if (!analogy || level === 'easy') xs.sort((a, b) => a - b);
      else if (level === 'medium' && rng() < 0.5) xs.sort((a, b) => a - b);
      const xq = xs[np];
      const pairs = xs.slice(0, np).map((x) => [x, g.f(x)]);
      const ans = g.f(xq);
      if (pairs.some((p) => !Number.isInteger(p[1]) || Math.abs(p[1]) > 5000) || !Number.isInteger(ans) || Math.abs(ans) > 5000) return null;
      if (pairs.some((p) => p[1] === p[0]) && rng() < 0.9) return null;
      if (new Set(pairs.map((p) => p[1])).size < np) return null;
      const preds = faPredict(pairs, xq);
      if (preds.size === 1 && preds.has(ans)) return { fam, g, pairs, xq, ans, analogy };
      if (!analogy) return null;
    }
    return null;
  }
  const fnum = (v) => (v < 0 ? '−' + -v : String(v));

  T.register({
    id: 'numanalogy', name: 'Number analogies', de: 'Zahlenanalogien', domain: 'numerical', n: 10, secs: 300, refSecs: 25, learn: 0.9, options: 5,
    tips: [
      'Compare input and output: does the output grow by a constant (add), by a factor (multiply) or faster (squares, powers)?',
      'Test your rule on every given pair, not just the first one.',
      'Squares and cubes are easy to spot: 1, 4, 9, 16 ... or 1, 8, 27, 64 ...',
      'For two-digit numbers think about the digits: reverse them or add them up.',
      'In "a : b = c : ?" the relation between a and b is the same as between c and the answer.',
    ],
    desc: {
      easy: 'Find a simple rule that maps each number to its partner: add, multiply, halve or subtract from a constant.',
      medium: 'Two-step rules, squares, cubes and n × (n + 1), in tables and as analogies.',
      hard: 'Powers, digit sums, reversed digits and mixed rules; only one rule fits the shown pairs.',
    },
    make: retry((level, rng) => {
      const analogy = rng() < (level === 'easy' ? 0.3 : 0.4);
      const b = faBuild(rng, level, analogy);
      if (!b) return null;
      const { pairs, xq, ans, g } = b;
      const mc = numMC(rng, ans, faSlips(pairs, xq, ans), fnum, { ok: (v) => (level === 'hard' || ans < 0 ? true : v >= 0) });
      if (!mc) return null;
      const stim = b.analogy
        ? '<div class="fa" style="font-size:1.6em;font-weight:700;text-align:center;line-height:1.6">' + pairs.map((p) => p[0] + ' : ' + fnum(p[1])).join(' = ') + ' = ' + xq + ' : ?</div>'
        : '<div class="fa" style="font-size:1.6em;font-weight:700;text-align:center;line-height:1.7">' + pairs.map((p) => '<div>' + p[0] + ' → ' + fnum(p[1]) + '</div>').join('') + '<div>' + xq + ' → ?</div></div>';
      const q = {
        kind: 'mc', stimulus: stim, prompt: b.analogy ? 'Which number completes the analogy?' : 'Which number does the same rule give for ' + xq + '?',
        options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [String(ans)],
        explain: 'Rule: ' + g.desc + '. Check: ' + pairs.map((p) => p[0] + ' → ' + fnum(p[1])).join(', ') + '. So ' + xq + ' → ' + fnum(ans) + '.',
      };
      return attachMeta(q, { pairs, xq, ans, analogy: b.analogy, fam: b.fam.id });
    }, 'numanalogy'),
  });

  // =====================================================================================================
  // 5. charts - read bar/line charts and tables (German)
  // =====================================================================================================
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MON3 = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const DAY2 = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const SEASON = [1, 2, 6, 10, 15, 18, 21, 20, 16, 11, 6, 2];
  const CH = { W: 360, H: 216, x0: 46, x1: 346, yTop: 52, yBot: 190, charW: 6.6 };
  const NICE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500];
  const SERIES_PAIRS = {
    years: { names: ['2023', '2024'], inS: (n) => 'im Jahr ' + n },
    branches: { names: ['Filiale A', 'Filiale B'], inS: (n) => 'in ' + n },
    weeks: { names: ['Woche 1', 'Woche 2'], inS: (n) => 'in ' + n },
  };
  const THEMES = [
    { id: 'umsatz', art: 'der', dat: 'dem', noun: 'Umsatz', which: 'In welchem Monat', at: (c) => 'im ' + c.full, unit: 'Tsd. €', title: 'Umsatz pro Monat in Tsd. €', prev: 'dem Vormonat', kind: 'time', n: [5, 6], q: 5, qe: 10, lo: 20, hi: 160, pairs: ['years', 'branches'],
      cats: (r, n) => { const s = ri(0, 12 - n, r); return MONTHS.slice(s, s + n).map((f, i) => ({ lab: MON3[s + i], full: f })); } },
    { id: 'besucher', art: 'die', dat: 'der', noun: 'Besucherzahl', which: 'An welchem Wochentag', at: (c) => 'am ' + c.full, unit: 'Besucher', title: 'Besucher pro Wochentag', prev: 'dem Vortag', kind: 'time', n: [5, 6, 7], q: 20, qe: 50, lo: 100, hi: 800, pairs: ['weeks'],
      cats: (r, n) => { const s = ri(0, 7 - n, r); return DAYS.slice(s, s + n).map((f, i) => ({ lab: DAY2[s + i], full: f })); } },
    { id: 'temp', art: 'die', dat: 'der', noun: 'Durchschnittstemperatur', which: 'In welchem Monat', at: (c) => 'im ' + c.full, unit: '°C', title: 'Durchschnittstemperatur pro Monat in °C', prev: 'dem Vormonat', kind: 'time', n: [6], q: 1, qe: 5, lo: 3, hi: 28, noPct: true, season: true,
      cats: (r, n) => { const s = ri(2, 5, r); return MONTHS.slice(s, s + n).map((f, i) => ({ lab: MON3[s + i], full: f, m: s + i })); } },
    { id: 'region', art: 'der', dat: 'dem', noun: 'Umsatz', which: 'In welcher Region', at: (c) => 'in der Region ' + c.full, unit: 'Mio. €', title: 'Umsatz nach Region in Mio. €', kind: 'nominal', n: [5], q: 1, qe: 5, lo: 10, hi: 60, pairs: ['years'],
      cats: (r) => shuffle(['Nord', 'Süd', 'Ost', 'West', 'Mitte'], r).map((f) => ({ lab: f, full: f })) },
    { id: 'drinks', art: 'der', dat: 'dem', noun: 'Absatz', which: 'Bei welchem Getränk', at: (c) => 'bei ' + c.full, unit: 'Tsd. Flaschen', title: 'Absatz nach Getränk in Tsd. Flaschen', kind: 'nominal', n: [5], q: 5, qe: 10, lo: 10, hi: 80, pairs: ['years', 'branches'],
      cats: (r) => sample(['Wasser', 'Saft', 'Limo', 'Cola', 'Tee', 'Milch', 'Bier'], 5, r).map((f) => ({ lab: f, full: f })) },
    { id: 'years', art: 'die', dat: 'der', noun: 'Einwohnerzahl', which: 'In welchem Jahr', at: (c) => 'im Jahr ' + c.full, unit: 'Tsd. Einwohner', title: 'Einwohnerzahl in Tsd.', prev: 'dem Vorjahr', kind: 'time', n: [5, 6], q: 5, qe: 10, lo: 50, hi: 150,
      cats: (r, n) => { const s = ri(2016, 2020, r); return Array.from({ length: n }, (_, i) => ({ lab: String(s + i), full: String(s + i) })); } },
  ];

  const niceStep = (max) => NICE_STEPS.find((s) => Math.ceil(max / s) <= 8);
  const r2 = (v) => Math.round(v * 100) / 100;

  // Draw a bar / grouped-bar / line chart. Returns { svg, geo } where geo lists every drawn number and position.
  function drawChart(c) {
    const { kind, title, cats, series, showVals } = c;
    const n = cats.length;
    const max = Math.max(...series.map((s) => Math.max(...s.vals)));
    const step = niceStep(max), axisMax = Math.ceil(max / step) * step;
    const plotH = CH.yBot - CH.yTop, slot = (CH.x1 - CH.x0) / n;
    const yOf = (v) => r2(CH.yBot - (v / axisMax) * plotH);
    const geo = { vb: [CH.W, CH.H], x0: CH.x0, x1: CH.x1, yTop: CH.yTop, yBot: CH.yBot, axisMax, step, ticks: [], bars: [], pts: [], catLabels: [], valLabels: [], legend: [], titleW: title.length * 7.4 };
    let g = '';
    g += '<text x="8" y="16" font-size="12" font-weight="700" fill="var(--ink)">' + esc(title) + '</text>';
    if (series.length > 1) {
      let lx = CH.x0;
      series.forEach((s, k) => {
        g += '<rect x="' + lx + '" y="23" width="10" height="10" fill="' + (k === 0 ? 'var(--accent)' : 'var(--soft)') + '" stroke="var(--ink)" stroke-width="1"/>';
        g += '<text x="' + (lx + 14) + '" y="32" font-size="11" fill="var(--ink)">' + esc(s.name) + '</text>';
        geo.legend.push({ x: lx, w: 14 + s.name.length * CH.charW });
        lx += 14 + s.name.length * CH.charW + 18;
      });
    }
    for (let v = 0; v <= axisMax; v += step) {
      const y = yOf(v);
      geo.ticks.push({ v, y });
      g += '<line x1="' + CH.x0 + '" x2="' + CH.x1 + '" y1="' + y + '" y2="' + y + '" stroke="var(--soft)" stroke-width="1"' + (v === 0 ? ' opacity="0"' : '') + '/>';
      g += '<text x="' + (CH.x0 - 6) + '" y="' + r2(y + 3.5) + '" font-size="10" text-anchor="end" fill="var(--ink)" data-tick="' + v + '">' + v + '</text>';
    }
    g += '<path d="M' + CH.x0 + ' ' + CH.yTop + 'V' + CH.yBot + 'H' + CH.x1 + '" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round"/>';
    if (kind === 'line') {
      const s = series[0];
      const pts = s.vals.map((v, i) => ({ i, v, x: r2(CH.x0 + (i + 0.5) * slot), y: yOf(v) }));
      g += '<polyline points="' + pts.map((p) => p.x + ',' + p.y).join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      pts.forEach((p) => {
        g += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3.5" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.8" data-v="' + p.v + '" data-i="' + p.i + '"/>';
        geo.pts.push({ s: 0, i: p.i, v: p.v, x: p.x, y: p.y });
        if (showVals) { const ty = r2(p.y - 8); g += '<text x="' + p.x + '" y="' + ty + '" font-size="10" text-anchor="middle" fill="var(--ink)">' + p.v + '</text>'; geo.valLabels.push({ x: p.x, y: ty, w: String(p.v).length * 6, text: String(p.v), bw: 20 }); }
      });
    } else {
      const k = series.length;
      const bw = k === 1 ? Math.min(slot * 0.58, 36) : Math.min(slot * 0.38, 24);
      series.forEach((s, si) => {
        s.vals.forEach((v, i) => {
          const x = r2(CH.x0 + i * slot + (slot - bw * k) / 2 + si * bw), h = r2((v / axisMax) * plotH), y = r2(CH.yBot - h);
          g += '<rect x="' + x + '" y="' + y + '" width="' + r2(bw) + '" height="' + h + '" fill="' + (si === 0 ? 'var(--accent)' : 'var(--soft)') + '" stroke="var(--ink)" stroke-width="1.2" data-v="' + v + '" data-s="' + si + '" data-i="' + i + '"/>';
          geo.bars.push({ s: si, i, v, x, y, w: r2(bw), h });
          if (showVals) { const tx = r2(x + bw / 2), ty = r2(y - 3); g += '<text x="' + tx + '" y="' + ty + '" font-size="10" text-anchor="middle" fill="var(--ink)">' + v + '</text>'; geo.valLabels.push({ x: tx, y: ty, w: String(v).length * 6, text: String(v), bw: r2(bw) }); }
        });
      });
    }
    cats.forEach((cname, i) => {
      const x = r2(CH.x0 + (i + 0.5) * slot);
      g += '<text x="' + x + '" y="206" font-size="11" text-anchor="middle" fill="var(--ink)">' + esc(cname.lab) + '</text>';
      geo.catLabels.push({ x, w: cname.lab.length * CH.charW, text: cname.lab, slot });
    });
    const svg = '<svg class="fig" viewBox="0 0 ' + CH.W + ' ' + CH.H + '" font-family="system-ui, -apple-system, sans-serif" role="img" aria-label="' + esc(title) + '">' + g + '</svg>';
    return { svg, geo };
  }
  function drawTable(c) {
    const head = '<tr><th></th>' + c.cats.map((x) => '<th>' + esc(x.lab) + '</th>').join('') + '</tr>';
    const rows = c.series.map((s) => '<tr><th>' + esc(c.series.length > 1 ? s.name : c.unit) + '</th>' + s.vals.map((v) => '<td>' + v + '</td>').join('') + '</tr>').join('');
    return '<table class="dt"><caption>' + esc(c.title) + '</caption><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
  }

  function genVals(rng, th, n, level, cats) {
    const q = level === 'easy' ? th.qe : th.q;
    const vals = [];
    let guard = 0;
    while (vals.length < n && guard++ < 200) {
      let v;
      if (th.season) { const base = SEASON[cats[vals.length].m]; v = Math.max(th.lo, Math.round((base + ri(-3, 3, rng)) / q) * q); }
      else v = ri(Math.ceil(th.lo / q), Math.floor(th.hi / q), rng) * q;
      if (!vals.includes(v)) vals.push(v);
    }
    return vals.length === n ? vals : null;
  }
  const half = (vals) => { const s = niceStep(Math.max(...vals)); return vals.every((v) => (v * 2) % s === 0); };

  const qSteps = (q) => [q, -q, 2 * q, -2 * q, 3 * q, -3 * q, 5 * q, -5 * q, 10 * q, -10 * q, q / 2, -q / 2];
  function catMC(rng, th, cats, ansIdx, pref) {
    const order = (pref || []).concat(shuffle(cats.map((_, i) => i), rng)).filter((i) => i !== ansIdx);
    const seen = new Set();
    const picks = [];
    order.forEach((i) => { if (!seen.has(i) && picks.length < 4) { seen.add(i); picks.push(i); } });
    if (picks.length < 4) return null;
    const items = shuffle([ansIdx].concat(picks), rng);
    return { options: items.map((i) => cats[i].full), answer: items.indexOf(ansIdx), idx: items };
  }

  function chartsBuild(level, rng) {
    const qtype = weighted({
      easy: [['read', 5], ['maxcat', 2], ['mincat', 1.5]],
      medium: [['diff', 3], ['sum', 2], ['mean', 1.5], ['total', 1], ['rank', 2], ['inc', 2], ['gread', 2], ['gdiff', 2], ['gtotal', 1]],
      hard: [['pct', 3], ['share', 3], ['gpct', 2], ['gmaxdiff', 2], ['combo', 2.5], ['pctchain', 0]],
    }[level], rng);
    const isG = qtype[0] === 'g', isCombo = qtype === 'combo';
    let pool = THEMES.filter((t) => (!isG || t.pairs) && (!isCombo || t.id === 'umsatz') && (!['inc', 'pct'].includes(qtype) || t.kind === 'time') && (!['pct', 'share', 'gpct'].includes(qtype) || !t.noPct));
    if (qtype === 'inc') pool = pool.filter((t) => t.n.includes(6));
    if (qtype === 'gmaxdiff' || qtype === 'maxcat' || qtype === 'mincat' || qtype === 'rank') pool = pool.filter((t) => t.n.some((x) => x >= 5));
    const th = pick(pool, rng);
    let n = pick(th.n.filter((x) => (qtype === 'inc' ? x >= 6 : x >= 5)), rng);
    if (isG || isCombo) n = Math.min(n, 5);
    const cats = th.cats(rng, n);
    const nser = isG ? 2 : 1;
    const series = [];
    for (let s = 0; s < nser; s++) {
      const v = genVals(rng, th, n, level, cats);
      if (!v) return null;
      series.push({ name: '', vals: v });
    }
    let pair = null;
    if (isG) {
      pair = SERIES_PAIRS[pick(th.pairs, rng)];
      series.forEach((s, k) => { s.name = pair.names[k]; });
      // the two series must differ everywhere, so that "who is higher" is unambiguous
      if (series[0].vals.some((v, i) => v === series[1].vals[i])) return null;
    }
    // kind of display
    let kind;
    if (level === 'easy') kind = weighted([['bar', 4], [th.kind === 'time' ? 'line' : 'bar', 2], ['table', 1]], rng);
    else if (isG) kind = weighted([['bar', 4], ['table', 1]], rng);
    else kind = weighted([['bar', 4], [th.kind === 'time' ? 'line' : 'bar', 2], ['table', 1]], rng);
    if (isCombo) kind = 'bar';
    const labelled = level !== 'easy' || kind === 'table';
    if (level === 'easy' && kind !== 'table' && !half(series[0].vals)) return null;
    const fmtV = (v) => fmtU(v, th.unit);
    const V = series[0].vals;
    const sorted = V.map((v, i) => i).sort((a, b) => V[b] - V[a]);
    const nm = (i) => th.at(cats[i]);
    const nounPhrase = th.art + ' ' + th.noun;
    let r = null; // { prompt, kindAns:'num'|'cat', ans, unit, slips, explain, qm }
    const q = level === 'easy' ? th.qe : th.q;
    if (qtype === 'read') {
      const i = ri(0, n - 1, rng);
      r = { prompt: `Wie hoch ist ${nounPhrase} ${nm(i)}?`, num: V[i], slips: [V[i - 1], V[i + 1], V[(i + 2) % n], V[i] + niceStep(Math.max(...V)) / 2, V[i] - niceStep(Math.max(...V)) / 2].filter((x) => x !== undefined), unit: th.unit,
        explain: `Abgelesen ${nm(i)}: ${fmtV(V[i])}.`, qm: { qt: 'read', i } };
    } else if (qtype === 'maxcat' || qtype === 'mincat') {
      const top = qtype === 'maxcat', ai = top ? sorted[0] : sorted[n - 1];
      const mc = catMC(rng, th, cats, ai, top ? sorted.slice(1) : sorted.slice().reverse().slice(1));
      if (!mc) return null;
      r = { prompt: `${th.which} ist ${nounPhrase} am ${top ? 'höchsten' : 'niedrigsten'}?`, mcCat: mc, explain: `${top ? 'Höchster' : 'Niedrigster'} Wert: ${fmtV(V[ai])} (${cats[ai].full}).`, qm: { qt: qtype } };
    } else if (qtype === 'rank') {
      const top = rng() < 0.5, ai = top ? sorted[1] : sorted[n - 2];
      const mc = catMC(rng, th, cats, ai, top ? [sorted[0], sorted[2]] : [sorted[n - 1], sorted[n - 3]]);
      if (!mc) return null;
      r = { prompt: `${th.which} ist ${nounPhrase} am ${top ? 'zweithöchsten' : 'zweitniedrigsten'}?`, mcCat: mc, explain: `Sortiert nach Größe: ${sorted.map((k) => cats[k].full + ' ' + V[k]).join(', ')}. Der ${top ? 'zweithöchste' : 'zweitniedrigste'} Wert liegt ${nm(ai)}.`, qm: { qt: top ? 'rank2hi' : 'rank2lo' } };
    } else if (qtype === 'diff') {
      const [a, b] = sample([...Array(n).keys()], 2, rng);
      const hi = V[a] > V[b] ? a : b, lo = hi === a ? b : a;
      r = { prompt: `Um wie viel ist ${nounPhrase} ${nm(hi)} höher als ${nm(lo)}?`, num: V[hi] - V[lo], slips: [V[hi] + V[lo], V[hi], V[lo], V[hi] - V[lo] + q, V[hi] - V[lo] - q], unit: th.unit, steps: qSteps(q),
        explain: `${nm(hi)}: ${fmtV(V[hi])}; ${nm(lo)}: ${fmtV(V[lo])}. Differenz: ${V[hi]} − ${V[lo]} = ${V[hi] - V[lo]} ${th.unit}.`, qm: { qt: 'diff', hi, lo } };
    } else if (qtype === 'sum') {
      const [a, b] = sample([...Array(n).keys()], 2, rng);
      r = { prompt: `Wie hoch ist ${nounPhrase} ${nm(a)} und ${nm(b)} zusammen?`, num: V[a] + V[b], slips: [Math.abs(V[a] - V[b]), V[a], V[b], V[a] + V[b] + q, V[a] + V[b] - q], unit: th.unit, steps: qSteps(q),
        explain: `${V[a]} + ${V[b]} = ${V[a] + V[b]} ${th.unit}.`, qm: { qt: 'sum', a, b } };
    } else if (qtype === 'total') {
      const S = V.reduce((x, y) => x + y, 0);
      r = { prompt: 'Wie hoch ist die Summe aller dargestellten Werte?', num: S, slips: [S - V[0], S + q, S - q, S - Math.max(...V), S + Math.min(...V)], unit: th.unit, steps: qSteps(q), explain: `${V.join(' + ')} = ${S} ${th.unit}.`, qm: { qt: 'total' } };
    } else if (qtype === 'mean') {
      const S = V.reduce((x, y) => x + y, 0), m = S / n;
      if (!isDec2(m) || Number.isInteger(m) === false && rng() < 0.7) return null;
      r = { prompt: 'Wie hoch ist der Durchschnitt aller dargestellten Werte?', num: m, slips: [S, S / (n - 1), S / (n + 1), (Math.max(...V) + Math.min(...V)) / 2, V.slice().sort((x, y) => x - y)[Math.floor(n / 2)]], unit: th.unit, steps: qSteps(q),
        explain: `Summe ${S}, geteilt durch ${n} Werte: ${fmtNum(m)} ${th.unit}.`, qm: { qt: 'mean' } };
    } else if (qtype === 'inc') {
      const dif = V.map((v, i) => (i ? v - V[i - 1] : -1e9));
      const up = rng() < 0.6, key = up ? dif.slice(1).slice().sort((a, b) => b - a) : dif.slice(1).slice().sort((a, b) => a - b);
      if (key[0] === key[1]) return null;
      const ai = dif.indexOf(key[0]);
      if (up && key[0] <= 0) return null;
      if (!up && key[0] >= 0) return null;
      const order = dif.map((d, i) => i).filter((i) => i > 0).sort((a, b) => (up ? dif[b] - dif[a] : dif[a] - dif[b]));
      const mc = catMC(rng, th, cats.map((c, i) => c), ai, order.slice(1));
      if (!mc) return null;
      // option 0 can not be the first category (it has no predecessor)
      if (mc.idx.includes(0)) {
        const items = shuffle(order.slice(0, 5).filter((i) => i !== ai).slice(0, 4).concat([ai]), rng);
        if (items.length < 5) return null;
        mc.options = items.map((i) => cats[i].full); mc.answer = items.indexOf(ai); mc.idx = items;
      }
      r = { prompt: `${th.which} ${up ? 'stieg' : 'sank'} ${nounPhrase} gegenüber ${th.prev} am stärksten?`,
        mcCat: mc, explain: `Veränderung gegenüber ${th.prev}: ${dif.map((d, i) => (i ? cats[i].full + ' ' + (d > 0 ? '+' : '−') + Math.abs(d) : null)).filter(Boolean).join(', ')}. ${up ? 'Größter Anstieg' : 'Stärkster Rückgang'}: ${cats[ai].full}.`, qm: { qt: up ? 'incmax' : 'decmax' } };
    } else if (qtype === 'pct') {
      const cand = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const p = (V[j] - V[i]) / V[i] * 100; if (Math.abs(p - Math.round(p)) < 1e-9 && Math.abs(p) >= 5 && Math.abs(p) <= 300 && V[i] !== V[j]) cand.push([i, j]); }
      if (!cand.length) return null;
      const [i, j] = pick(cand, rng), p = Math.abs((V[j] - V[i]) / V[i] * 100), up = V[j] > V[i];
      r = { prompt: `Um wie viel Prozent ist ${nounPhrase} von ${cats[i].full} auf ${cats[j].full} ${up ? 'gestiegen' : 'gesunken'}?`, num: p, slips: [Math.abs(V[j] - V[i]), r2(Math.abs((V[j] - V[i]) / V[j] * 100)), r2(V[j] / V[i] * 100), r2(V[i] / V[j] * 100), p + 5, p - 5, p * 2], unit: '%', steps: [5, -5, 10, -10, 2, -2, 1, -1, 20, -20],
        explain: `Änderung: ${V[j]} − ${V[i]} = ${V[j] - V[i]}. Bezogen auf den Ausgangswert ${V[i]} (${cats[i].full}): ${Math.abs(V[j] - V[i])} ÷ ${V[i]} = ${fmtNum(p / 100)} = ${fmtNum(p)} %.`, qm: { qt: 'pct', i, j } };
    } else if (qtype === 'share') {
      const S = V.reduce((x, y) => x + y, 0), cand = [];
      V.forEach((v, i) => { const p = v / S * 100; if (Math.abs(p - Math.round(p)) < 1e-9 && p >= 5) cand.push(i); });
      if (!cand.length) return null;
      const i = pick(cand, rng), p = V[i] / S * 100;
      r = { prompt: `Wie viel Prozent der Summe aller dargestellten Werte entfallen auf ${cats[i].full}?`, num: p, slips: [r2(V[i] / Math.max(...V) * 100), r2(V[i] / (S - V[i]) * 100), p + 5, p - 5, r2(100 - p)], unit: '%', steps: [5, -5, 10, -10, 2, -2, 1, -1],
        explain: `Summe aller Werte: ${V.join(' + ')} = ${S}. Anteil: ${V[i]} ÷ ${S} = ${fmtNum(p / 100)} = ${fmtNum(p)} %.`, qm: { qt: 'share', i } };
    } else if (qtype === 'gread') {
      const i = ri(0, n - 1, rng), s = ri(0, 1, rng);
      r = { prompt: `Wie hoch ist ${nounPhrase} ${nm(i)} ${pair.inS(pair.names[s])}?`, num: series[s].vals[i], slips: [series[1 - s].vals[i], series[s].vals[(i + 1) % n], series[s].vals[(i + n - 1) % n]], unit: th.unit, steps: qSteps(q),
        explain: `Der Balken ${nm(i)} ${pair.inS(pair.names[s])} zeigt ${fmtV(series[s].vals[i])}.`, qm: { qt: 'gread', i, s } };
    } else if (qtype === 'gdiff') {
      const i = ri(0, n - 1, rng), a = series[0].vals[i], b = series[1].vals[i], hi = a > b ? 0 : 1;
      r = { prompt: `Um wie viel ist ${nounPhrase} ${nm(i)} ${pair.inS(pair.names[hi])} höher als ${pair.inS(pair.names[1 - hi])}?`, num: Math.abs(a - b), slips: [a + b, Math.max(a, b), Math.min(a, b), Math.abs(a - b) + q, Math.abs(a - b) - q], unit: th.unit, steps: qSteps(q),
        explain: `${pair.names[hi]}: ${Math.max(a, b)}, ${pair.names[1 - hi]}: ${Math.min(a, b)}. Differenz: ${Math.abs(a - b)} ${th.unit}.`, qm: { qt: 'gdiff', i } };
    } else if (qtype === 'gtotal') {
      const s = ri(0, 1, rng), S = series[s].vals.reduce((x, y) => x + y, 0), S2 = series[1 - s].vals.reduce((x, y) => x + y, 0);
      r = { prompt: `Wie hoch ist die Summe aller Werte ${pair.inS(pair.names[s])}?`, num: S, slips: [S2, S + S2, Math.abs(S - S2), S + q, S - q, S - Math.max(...series[s].vals)], unit: th.unit, steps: qSteps(q), explain: `${series[s].vals.join(' + ')} = ${S} ${th.unit}.`, qm: { qt: 'gtotal', s } };
    } else if (qtype === 'gpct') {
      const cand = [];
      for (let i = 0; i < n; i++) for (const s1 of [0, 1]) { const a = series[s1].vals[i], b = series[1 - s1].vals[i], p = (b - a) / a * 100; if (Math.abs(p - Math.round(p)) < 1e-9 && Math.abs(p) >= 5 && Math.abs(p) <= 200) cand.push([i, s1]); }
      if (!cand.length) return null;
      const [i, s1] = pick(cand, rng), s2 = 1 - s1, a = series[s1].vals[i], b = series[s2].vals[i], p = Math.abs((b - a) / a * 100);
      r = { prompt: `Um wie viel Prozent liegt ${nounPhrase} ${nm(i)} ${pair.inS(pair.names[s2])} ${b > a ? 'über' : 'unter'} ${th.dat} ${th.noun} ${pair.inS(pair.names[s1])}?`, num: p, slips: [Math.abs(b - a), r2(Math.abs((b - a) / b * 100)), r2(b / a * 100), p + 5, p - 5, p * 2], unit: '%', steps: [5, -5, 10, -10, 2, -2, 1, -1, 20, -20],
        explain: `Differenz: |${b} − ${a}| = ${Math.abs(b - a)}. Bezugswert ist ${a} (${pair.names[s1]}): ${Math.abs(b - a)} ÷ ${a} = ${fmtNum(p)} %.`, qm: { qt: 'gpct', i, s1 } };
    } else if (qtype === 'gmaxdiff') {
      const d = series[0].vals.map((v, i) => Math.abs(v - series[1].vals[i])), top = d.slice().sort((a, b) => b - a);
      if (top[0] === top[1]) return null;
      const ai = d.indexOf(top[0]);
      const mc = catMC(rng, th, cats, ai, d.map((_, i) => i).sort((a, b) => d[b] - d[a]).slice(1));
      if (!mc) return null;
      r = { prompt: `${th.which} ist der Unterschied zwischen ${pair.names[0]} und ${pair.names[1]} am größten?`, mcCat: mc, explain: `Unterschiede: ${cats.map((c, i) => c.full + ' ' + d[i]).join(', ')}. Am größten: ${cats[ai].full} (${d[ai]}).`, qm: { qt: 'gmaxdiff' } };
    } else if (qtype === 'combo') {
      // second chart: staff; first chart (series[0]) = revenue = staff * revenue-per-person
      const staff = [], rev = [];
      for (let i = 0; i < n; i++) { const m = ri(4, 16, rng), k = ri(5, 14, rng); staff.push(m); rev.push(m * k); }
      if (new Set(rev).size < n || Math.max(...rev) > 220) return null;
      const per = rev.map((v, i) => v / staff[i]);
      if (!per.every(Number.isInteger)) return null;
      series[0].vals = rev;
      const second = { name: '', vals: staff };
      if (rng() < 0.5) {
        const i = ri(0, n - 1, rng);
        r = { prompt: `Wie hoch ist der Umsatz je Mitarbeiter ${nm(i)} (in Tsd. €)?`, num: per[i], slips: [rev[i] - staff[i], r2(staff[i] / rev[i] * 100), rev[i] / 10, per[i] + 1, per[i] - 1, per[i] * 2], unit: 'Tsd. €', steps: [1, -1, 2, -2, 3, -3, 5, -5],
          explain: `Umsatz ${nm(i)}: ${rev[i]} Tsd. €; Mitarbeiter: ${staff[i]}. Umsatz je Mitarbeiter: ${rev[i]} ÷ ${staff[i]} = ${per[i]} Tsd. €.`, qm: { qt: 'combo1', i }, second };
      } else {
        const top = per.slice().sort((a, b) => b - a);
        if (top[0] === top[1]) return null;
        const ai = per.indexOf(top[0]);
        const mc = catMC(rng, th, cats, ai, [rev.indexOf(Math.max(...rev)), ...staff.map((_, k) => k)].filter((k) => k !== ai));
        if (!mc) return null;
        r = { prompt: 'In welchem Monat ist der Umsatz je Mitarbeiter am höchsten?', mcCat: mc, explain: `Umsatz je Mitarbeiter: ${cats.map((c, i) => c.full + ' ' + rev[i] + ' ÷ ' + staff[i] + ' = ' + per[i]).join('; ')}. Am höchsten: ${cats[ai].full}.`, qm: { qt: 'combo2' }, second };
      }
    }
    if (!r) return null;
    // ----- charts / stimulus -----
    const base = { kind, title: th.title, cats, series, unit: th.unit, showVals: labelled };
    const specs = [base];
    if (r.second) specs.push({ kind: 'bar', title: 'Mitarbeiter pro Monat', cats, series: [r.second], unit: 'Mitarbeiter', showVals: true });
    const drawn = specs.map((s) => (s.kind === 'table' ? { html: drawTable(s), geo: null } : (() => { const d = drawChart(s); return { html: d.svg, geo: d.geo }; })()));
    const stimulus = drawn.map((d) => d.html).join(kind === 'table' ? '' : '');
    // ----- answer options -----
    let mc;
    if (r.mcCat) mc = r.mcCat;
    else {
      const fmt = (v) => fmtU(v, r.unit);
      mc = numMC(rng, r.num, (r.slips || []).filter((x) => typeof x === 'number' && isDec2(x) && (r.unit !== '%' || Number.isInteger(x))), fmt, { steps: r.steps });
    }
    if (!mc) return null;
    const out = {
      kind: 'mc', lang: 'de', stimulus, stimulusClass: kind === 'table' ? undefined : 'paper', prompt: r.prompt,
      options: mc.options, answer: mc.answer, optionStyle: r.mcCat ? 'grid' : 'grid', explain: r.explain,
    };
    if (kind === 'table') delete out.stimulusClass;
    if (r.num !== undefined) out.typedAnswer = [dotStr(r.num)];
    const meta = { qt: r.qm.qt, qm: r.qm, kind, cats: cats.map((c) => c.full), labels: cats.map((c) => c.lab), series: series.map((s) => s.vals.slice()), second: r.second ? r.second.vals.slice() : null, unit: th.unit, geos: drawn.map((d) => d.geo), easyHalf: level === 'easy' && kind !== 'table', num: r.num, catAns: r.mcCat ? r.mcCat.idx[r.mcCat.answer] : null, themeId: th.id, labelled, nCharts: specs.length };
    return { q: out, meta };
  }

  T.register({
    id: 'charts', name: 'Charts & tables', de: 'Diagramme lesen', domain: 'numerical', n: 10, secs: 480, refSecs: 45, learn: 0.8, options: 5,
    tips: [
      'Read the title, the axis labels and the unit first: the same bar can mean thousands or millions.',
      'Find the value of one gridline step, then read bars between the lines.',
      'For percentage change, divide the difference by the starting value, not by the new value.',
      'For a share of the total, add all values first, then divide the single value by the sum.',
      'Cross out options that are the wrong size by a factor of 10 or that mix up two bars.',
    ],
    desc: {
      easy: 'Read single values and find the highest or lowest bar in bar charts, line charts and tables.',
      medium: 'Differences, sums, averages, rankings and the biggest rise, also with two data series.',
      hard: 'Percentage change, share of the total, gaps between two series and combining two charts.',
    },
    make: retry((level, rng) => {
      const b = chartsBuild(level, rng);
      if (!b) return null;
      return attachMeta(b.q, b.meta);
    }, 'charts'),
  });

  // =====================================================================================================
  // 6. technical - gears, levers, pulleys, hydraulics, circuits (German)
  // =====================================================================================================
  const svgWrap = (w, h, body, label) => '<svg class="fig" viewBox="0 0 ' + r2(w) + ' ' + r2(h) + '" font-family="system-ui, -apple-system, sans-serif" role="img" aria-label="' + esc(label) + '">' + body + '</svg>';
  const tx = (x, y, s, o) => { o = o || {}; return '<text x="' + r2(x) + '" y="' + r2(y) + '" font-size="' + (o.size || 12) + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + ' fill="var(--ink)">' + esc(s) + '</text>'; };
  const uml = (v, one, many) => fmtNum(v) + ' ' + (v === 1 ? one : many);

  // ---------- gears ----------
  const GEAR_C = 2.0;
  function gearPath(cx, cy, R, teeth, phi) {
    const p = 2 * Math.PI / teeth, pts = [], ro = R + 3.2, rr = R - 3.2;
    for (let k = 0; k < teeth; k++) {
      const th = phi + k * p;
      [[-0.30, rr], [-0.15, ro], [0.15, ro], [0.30, rr]].forEach(([f, rad]) => {
        const a = th + f * p;
        pts.push(r2(cx + rad * Math.cos(a)) + ' ' + r2(cy + rad * Math.sin(a)));
      });
    }
    return 'M' + pts.join('L') + 'Z';
  }
  function arcArrow(cx, cy, rad, dirCw) {
    const a0 = -160 * Math.PI / 180, a1 = -20 * Math.PI / 180;
    const from = dirCw ? a0 : a1, to = dirCw ? a1 : a0;
    const P = (a) => [r2(cx + rad * Math.cos(a)), r2(cy + rad * Math.sin(a))];
    const [sx, sy] = P(from), [ex, ey] = P(to);
    const tan = dirCw ? [-Math.sin(to), Math.cos(to)] : [Math.sin(to), -Math.cos(to)];
    const nrm = [-tan[1], tan[0]], hl = 8, hw = 4.5;
    const tip = [ex + tan[0] * 3, ey + tan[1] * 3];
    const b1 = [ex - tan[0] * hl + nrm[0] * hw, ey - tan[1] * hl + nrm[1] * hw], b2 = [ex - tan[0] * hl - nrm[0] * hw, ey - tan[1] * hl - nrm[1] * hw];
    return '<path data-dir="' + (dirCw ? 'cw' : 'ccw') + '" d="M' + sx + ' ' + sy + 'A' + r2(rad) + ' ' + r2(rad) + ' 0 0 ' + (dirCw ? 1 : 0) + ' ' + ex + ' ' + ey + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M' + r2(tip[0]) + ' ' + r2(tip[1]) + 'L' + r2(b1[0]) + ' ' + r2(b1[1]) + 'L' + r2(b2[0]) + ' ' + r2(b2[1]) + 'Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="1" stroke-linejoin="round"/>';
  }
  // gears: [{T, shaftWithPrev}] ; dirCw: direction of the first gear. Returns { svg, geo }
  function drawGears(gears, dirCw) {
    const m = 10, G = [];
    gears.forEach((g, i) => {
      const R = GEAR_C * g.T;
      let cx;
      if (i === 0) cx = m + R;
      else if (g.shaft) cx = G[i - 1].cx + G[i - 1].R + 16 + R;
      else cx = G[i - 1].cx + G[i - 1].R + R;
      G.push({ L: LETTERS[i], T: g.T, R, cx, shaft: !!g.shaft, mesh: i > 0 && !g.shaft });
    });
    const maxR = Math.max(...G.map((g) => g.R)), cy = r2(maxR + m + 4);
    // phases so that tooth meets gap
    G.forEach((g, i) => {
      const p = 2 * Math.PI / g.T;
      if (i === 0 || g.shaft) g.phi = 0;
      else {
        const prev = G[i - 1], pp = 2 * Math.PI / prev.T, u = ((-prev.phi / pp) % 1 + 1) % 1;
        g.phi = Math.PI - p * (0.5 - u);
      }
      g.dir = i === 0 ? !!dirCw : g.shaft ? G[i - 1].dir : !G[i - 1].dir;
    });
    const W = G[G.length - 1].cx + G[G.length - 1].R + m + 4, H = 2 * maxR + 2 * (m + 4);
    let s = '';
    G.forEach((g, i) => { if (g.shaft) s += '<path d="M' + r2(G[i - 1].cx) + ' ' + cy + 'H' + r2(g.cx) + '" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>'; });
    G.forEach((g, i) => {
      s += '<g class="gear" data-l="' + g.L + '" data-t="' + g.T + '" data-cx="' + r2(g.cx) + '" data-cy="' + cy + '" data-r="' + r2(g.R) + '">';
      s += '<path d="' + gearPath(g.cx, cy, g.R, g.T, g.phi) + '" fill="var(--soft)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>';
      s += tx(g.cx, cy + 1, g.L, { size: 16, weight: 700 }) + tx(g.cx, cy + 15, g.T + ' Z.', { size: 11 });
      s += '</g>';
    });
    s += arcArrow(G[0].cx, cy, G[0].R * 0.76, G[0].dir);
    G.forEach((g) => { g.cy = cy; });
    return { svg: svgWrap(W, H, s, 'Zahnräder'), geo: { gears: G.map((g) => ({ L: g.L, T: g.T, R: g.R, cx: r2(g.cx), cy, shaft: g.shaft, mesh: g.mesh })), W, H }, dirs: G.map((g) => g.dir), width: W };
  }
  const GT = [12, 14, 15, 16, 18, 20, 24, 30, 36, 40];
  const dirWord = (cw) => (cw ? 'im Uhrzeigersinn' : 'gegen den Uhrzeigersinn');
  const setStr = (arr) => (arr.length ? arr.map((i) => LETTERS[i]).join(', ') : 'keines');

  function techGearDir(level, rng) {
    const n = level === 'easy' ? ri(3, 4, rng) : ri(4, 6, rng);
    const gears = Array.from({ length: n }, () => ({ T: pick(GT.filter((t) => t <= (n > 4 ? 24 : 36)), rng) }));
    const cw = rng() < 0.5;
    const d = drawGears(gears, cw);
    if (d.width > 470) return null;
    const askCw = rng() < 0.5;
    const idx = d.dirs.map((x, i) => i).filter((i) => d.dirs[i] === askCw);
    if (idx.length === 0 || idx.length === n) return null;
    const comp = d.dirs.map((x, i) => i).filter((i) => d.dirs[i] !== askCw);
    const alt = [];
    const toggle = (set, k) => (set.includes(k) ? set.filter((x) => x !== k) : set.concat([k]).sort((a, b) => a - b));
    for (let k = 0; k < n; k++) alt.push(toggle(idx, k));
    alt.push(comp, Array.from({ length: n }, (_, i) => i), [0], [n - 1], idx.slice(0, -1));
    const key = (a) => a.join(',');
    const wrongs = shuffle(alt.filter((a) => a.length && key(a) !== key(idx)), rng).map(setStr);
    const mc = textMC(rng, setStr(idx), wrongs, 5);
    if (!mc) return null;
    const q = {
      kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: `Zahnrad A dreht sich in Pfeilrichtung. Welche Zahnräder drehen sich ${dirWord(askCw)}?`,
      options: mc.options, answer: mc.answer, optionStyle: 'grid',
      explain: `Ineinandergreifende Zahnräder drehen sich gegensinnig. A dreht ${dirWord(cw)}, B ${dirWord(!cw)}, und so weiter abwechselnd: ${d.dirs.map((x, i) => LETTERS[i] + ' ' + (x ? 'rechtsherum' : 'linksherum')).join(', ')}. ${dirWord(askCw).replace(/^./, (c) => c.toUpperCase())}: ${setStr(idx)}.`,
    };
    return attachMeta(q, { tp: 'geardir', gears: d.geo.gears, firstCw: cw, askCw, ans: idx, geo: d.geo });
  }
  function techGearRatio(level, rng) {
    const n = level === 'medium' ? ri(2, 3, rng) : ri(3, 5, rng);
    const gears = Array.from({ length: n }, () => ({ T: pick(GT.filter((t) => t <= 30), rng) }));
    const first = gears[0].T, last = gears[n - 1].T, turns = pick([2, 3, 4, 5, 6, 8, 9, 10, 12], rng);
    const ans = turns * first / last;
    if (!dec2(ans) || ans < 0.5 || ans > 40 || first === last) return null;
    const d = drawGears(gears, rng() < 0.5);
    if (d.width > 470) return null;
    const mid = n > 2 ? gears[1].T : first;
    const slips = [turns * last / first, turns * first / mid, turns * mid / last, turns + (last - first), turns * (first + last) / last, round2(turns * first / last + 1), turns];
    const mc = numMC(rng, ans, slips.filter(dec2), (v) => uml(v, 'Umdrehung', 'Umdrehungen'), { steps: [1, -1, 2, -2, 0.5, -0.5, 3, -3] });
    if (!mc) return null;
    const L = LETTERS[n - 1];
    const q = {
      kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: `Zahnrad A (${first} Zähne) macht ${turns} Umdrehungen. Wie viele Umdrehungen macht Zahnrad ${L} (${last} Zähne)?`,
      options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)],
      explain: `Zwischenräder ändern nur die Drehrichtung, nicht das Übersetzungsverhältnis. Es zählt nur A und ${L}: ${turns} × ${first} ÷ ${last} = ${fmtNum(ans)} Umdrehungen. (Gleich viele Zähne laufen an der Berührungsstelle vorbei.)`,
    };
    return attachMeta(q, { tp: 'gearratio', gears: d.geo.gears, turns, ans, geo: d.geo });
  }
  function techGearCompound(level, rng) {
    const TA = pick([12, 15, 16, 18, 20, 24], rng), TB = pick([24, 30, 36, 40, 18, 20], rng), TC = pick([12, 14, 15, 16, 20, 24], rng), TD = pick([24, 30, 36, 40, 18, 20, 16], rng);
    const turns = pick([4, 6, 8, 9, 10, 12, 15, 20], rng);
    const ans = turns * (TA / TB) * (TC / TD);
    if (!dec2(ans) || ans < 0.5 || ans > 60 || TA === TB || TC === TD) return null;
    const cw = rng() < 0.5;
    const d = drawGears([{ T: TA }, { T: TB }, { T: TC, shaft: true }, { T: TD }], cw);
    if (d.width > 480) return null;
    const dirD = d.dirs[3];
    const inv1 = turns * (TB / TA) * (TC / TD), inv2 = turns * (TA / TB) * (TD / TC), both = turns * (TB / TA) * (TD / TC), only1 = turns * TA / TB, skip = turns * TA / TD;
    const fmt = (v, c) => uml(v, 'Umdrehung', 'Umdrehungen') + ' ' + dirWord(c);
    const key = (v, c) => fmt(v, c);
    const wrongs = [];
    [ans, inv1, inv2, both, only1, skip, turns].forEach((v) => { if (dec2(v)) [dirD, !dirD].forEach((c) => { if (!(round2(v) === round2(ans) && c === dirD)) wrongs.push([round2(v), c]); }); });
    // typical: right number, wrong direction first; then wrong number, right direction
    const ordered = shuffle(wrongs.slice(), rng).sort((a, b) => ((a[0] === round2(ans)) ? -1 : 0) - ((b[0] === round2(ans)) ? -1 : 0) || ((a[1] === dirD) ? 0 : 1) - ((b[1] === dirD) ? 0 : 1)).map((w) => key(w[0], w[1]));
    const mc = textMC(rng, key(round2(ans), dirD), ordered.slice(0, 40), 5);
    if (!mc) return null;
    const q = {
      kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper',
      prompt: `A (${TA} Zähne) greift in B (${TB} Zähne). B und C (${TC} Zähne) sitzen auf derselben Welle. C greift in D (${TD} Zähne). A macht ${turns} Umdrehungen. Wie dreht sich D?`,
      options: mc.options, answer: mc.answer, optionStyle: 'text',
      explain: `Erste Stufe: A → B: ${turns} × ${TA} ÷ ${TB} = ${fmtNum(turns * TA / TB)} Umdrehungen. C dreht mit B (gleiche Welle) gleich schnell und in dieselbe Richtung. Zweite Stufe: C → D: ${fmtNum(turns * TA / TB)} × ${TC} ÷ ${TD} = ${fmtNum(ans)} Umdrehungen. Richtung: A ${dirWord(cw)}, B ${dirWord(!cw)}, C ${dirWord(!cw)}, D ${dirWord(dirD)}.`.replace(/(\d)\.(\d)/g, '$1,$2'),
    };
    return attachMeta(q, { tp: 'gearcomp', gears: d.geo.gears, firstCw: cw, turns, ans: round2(ans), dirD, geo: d.geo });
  }

  // ---------- levers ----------
  const LV = { cx: 180, sc: 2.5, beamY: 112 };
  function drawLever(left, right, opts) {
    // left/right: [{F: number|null, d: number|null, trueF, trueD}] ; positions use the true distance
    const sides = [[left, -1], [right, 1]];
    const maxK = Math.max(left.length, right.length);
    const boxTop = (k) => 148 + 38 * k, dimY = (k) => 148 + 38 * maxK + 8 + 20 * k;
    const H = dimY(maxK - 1) + 30, W = 360;
    let s = '';
    const bx1 = LV.cx - 62 * LV.sc, bx2 = LV.cx + 62 * LV.sc;
    s += '<rect x="' + r2(bx1) + '" y="' + (LV.beamY - 4) + '" width="' + r2(bx2 - bx1) + '" height="8" rx="2" fill="var(--soft)" stroke="var(--ink)" stroke-width="1.8"/>';
    s += '<path d="M' + (LV.cx - 15) + ' 142L' + LV.cx + ' ' + (LV.beamY + 4) + 'L' + (LV.cx + 15) + ' 142Z" fill="var(--soft)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>';
    s += '<path d="M' + (LV.cx - 40) + ' 142H' + (LV.cx + 40) + '" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>';
    const geo = { cx: LV.cx, sc: LV.sc, items: [], W, H };
    sides.forEach(([arr, sg]) => {
      arr.forEach((w, k) => {
        const x = r2(LV.cx + sg * w.trueD * LV.sc), top = boxTop(k);
        s += '<path d="M' + x + ' ' + (LV.beamY + 4) + 'V' + top + '" stroke="var(--ink)" stroke-width="1.8"/>';
        s += '<g class="wt" data-side="' + (sg < 0 ? 'L' : 'R') + '" data-k="' + k + '" data-x="' + x + '" data-d="' + w.trueD + '" data-f="' + w.trueF + '">';
        s += '<rect x="' + r2(x - 22) + '" y="' + top + '" width="44" height="26" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.8"/>';
        s += tx(x, top + 18, (w.F === null ? '?' : w.F) + ' N', { size: 13, weight: 700 });
        s += '</g>';
        const dy = dimY(k);
        s += '<path d="M' + LV.cx + ' ' + dy + 'H' + x + 'M' + LV.cx + ' ' + (dy - 4) + 'V' + (dy + 4) + 'M' + x + ' ' + (dy - 4) + 'V' + (dy + 4) + '" stroke="var(--ink)" stroke-width="1.2" fill="none"/>';
        s += tx(x, dy + 15, (w.D === null ? '?' : w.D) + ' cm', { size: 11 });
        geo.items.push({ side: sg < 0 ? 'L' : 'R', k, x, trueD: w.trueD, trueF: w.trueF, shownF: w.F, shownD: w.D, boxX: [r2(x - 22), r2(x + 22)], boxTop: top, labelW: ((w.D === null ? 1 : String(w.D).length) + 3) * 6.2, dimY: dy });
      });
    });
    return { svg: svgWrap(W, H, s, 'Hebel mit Gewichten'), geo };
  }
  const lvSep = (arr) => arr.every((w, i) => arr.every((v, j) => i === j || Math.abs(w.trueD - v.trueD) >= 10));
  function techLever(level, rng) {
    const vt = level === 'easy' ? pick(['missF', 'side'], rng) : level === 'medium' ? pick(['missF', 'missD', 'side', 'missD'], rng) : pick(['two', 'twoD', 'side2'], rng);
    const Fs = [10, 20, 30, 40, 50, 60, 80, 100], Ds = [10, 15, 20, 25, 30, 40, 45, 50, 60];
    let left, right, torqL, torqR, ask, ans, unit, prompt, explain, wrongs, opts = {};
    const F1 = pick(Fs, rng), d1 = pick(Ds, rng);
    if (vt === 'missF') {
      const d2 = pick(Ds.filter((d) => d !== d1), rng), f2 = F1 * d1 / d2;
      if (!Number.isInteger(f2) || f2 > 200 || f2 === F1) return null;
      left = [{ F: F1, D: d1, trueF: F1, trueD: d1 }]; right = [{ F: null, D: d2, trueF: f2, trueD: d2 }];
      ans = f2; unit = 'N'; prompt = 'Der masselose Hebel ist im Gleichgewicht. Wie groß ist die Kraft auf der rechten Seite?';
      wrongs = [F1 + d1 - d2, F1 * d2 / d1, F1 * d1 / (d1 + d2), F1 - (d2 - d1), F1, F1 * d1, F1 + f2];
      explain = `Drehmoment links = Drehmoment rechts: ${F1} N × ${d1} cm = F × ${d2} cm. F = ${F1 * d1} ÷ ${d2} = ${f2} N.`;
    } else if (vt === 'missD') {
      const f2 = pick(Fs.filter((f) => f !== F1), rng), d2 = F1 * d1 / f2;
      if (!Number.isInteger(d2) || d2 > 60 || d2 < 10 || d2 === d1) return null;
      left = [{ F: F1, D: d1, trueF: F1, trueD: d1 }]; right = [{ F: f2, D: null, trueF: f2, trueD: d2 }];
      ans = d2; unit = 'cm'; prompt = 'Der masselose Hebel ist im Gleichgewicht. In welchem Abstand vom Drehpunkt hängt das rechte Gewicht?';
      wrongs = [d1 + F1 - f2, F1 * d1 / f2 * 2, f2 * d1 / F1, d1, F1 * d1 / (F1 + f2), d1 * 2];
      explain = `Drehmoment links = Drehmoment rechts: ${F1} N × ${d1} cm = ${f2} N × d. d = ${F1 * d1} ÷ ${f2} = ${d2} cm.`;
    } else if (vt === 'side') {
      const f2 = pick(Fs, rng), d2 = pick(Ds, rng);
      if (rng() < 0.3 && F1 * d1 !== f2 * d2) { /* ok */ }
      left = [{ F: F1, D: d1, trueF: F1, trueD: d1 }]; right = [{ F: f2, D: d2, trueF: f2, trueD: d2 }];
      const ml = F1 * d1, mr = f2 * d2;
      opts = { side: true };
      const res = ml > mr ? 0 : ml < mr ? 1 : 2;
      const texts = ['Die linke Seite senkt sich.', 'Die rechte Seite senkt sich.', 'Der Hebel bleibt im Gleichgewicht.'];
      const items = shuffle([0, 1, 2], rng);
      const q = { kind: 'mc', lang: 'de', prompt: 'Der Hebel ist masselos. Was geschieht?', options: items.map((i) => texts[i]), answer: items.indexOf(res), optionStyle: 'text',
        explain: `Links: ${F1} N × ${d1} cm = ${ml}. Rechts: ${f2} N × ${d2} cm = ${mr}. ${res === 2 ? 'Beide Drehmomente sind gleich: Gleichgewicht.' : 'Das größere Drehmoment gewinnt: ' + (res === 0 ? 'links' : 'rechts') + ' senkt sich.'}` };
      const d = drawLever(left, right);
      q.stimulus = d.svg; q.stimulusClass = 'paper';
      return attachMeta(q, { tp: 'leverside', geo: d.geo, left: [[F1, d1]], right: [[f2, d2]], res });
    } else if (vt === 'two' || vt === 'twoD') {
      // left: F1 at d1 ; right: F2 at d2 and unknown at d3
      const f2 = pick(Fs, rng), d2 = pick(Ds, rng), d3 = pick(Ds.filter((d) => Math.abs(d - d2) >= 10), rng);
      const rest = F1 * d1 - f2 * d2;
      if (rest <= 0) return null;
      if (vt === 'two') {
        const f3 = rest / d3;
        if (!Number.isInteger(f3) || f3 > 200) return null;
        left = [{ F: F1, D: d1, trueF: F1, trueD: d1 }]; right = [{ F: f2, D: d2, trueF: f2, trueD: d2 }, { F: null, D: d3, trueF: f3, trueD: d3 }];
        ans = f3; unit = 'N'; prompt = 'Der masselose Hebel ist im Gleichgewicht. Wie groß ist die unbekannte Kraft rechts?';
        wrongs = [F1 * d1 / d3, (F1 * d1 + f2 * d2) / d3, F1 - f2, F1 * d1 / (d2 + d3), f3 + f2, (F1 - f2) * d1 / d3];
        explain = `Links: ${F1} × ${d1} = ${F1 * d1}. Rechts bekannt: ${f2} × ${d2} = ${f2 * d2}. Es fehlen ${F1 * d1} − ${f2 * d2} = ${rest}, also F × ${d3} = ${rest}, F = ${f3} N.`;
      } else {
        const f3 = pick(Fs, rng), d3b = rest / f3;
        if (!Number.isInteger(d3b) || d3b < 10 || d3b > 60 || Math.abs(d3b - d2) < 10) return null;
        left = [{ F: F1, D: d1, trueF: F1, trueD: d1 }]; right = [{ F: f2, D: d2, trueF: f2, trueD: d2 }, { F: f3, D: null, trueF: f3, trueD: d3b }];
        ans = d3b; unit = 'cm'; prompt = 'Der masselose Hebel ist im Gleichgewicht. In welchem Abstand vom Drehpunkt hängt das zweite rechte Gewicht?';
        wrongs = [F1 * d1 / f3, (F1 * d1 + f2 * d2) / f3, d1 - d2, F1 * d1 / (f2 + f3), d3b + d2, (F1 - f2) * d1 / f3];
        explain = `Links: ${F1} × ${d1} = ${F1 * d1}. Rechts bekannt: ${f2} × ${d2} = ${f2 * d2}. Es fehlen ${rest}, also ${f3} × d = ${rest}, d = ${d3b} cm.`;
      }
    } else { // side2: two weights each side
      const f2 = pick(Fs, rng), d2 = pick(Ds, rng), f3 = pick(Fs, rng), d3 = pick(Ds, rng), f4 = pick(Fs, rng), d4 = pick(Ds, rng);
      left = [{ F: F1, D: d1, trueF: F1, trueD: d1 }, { F: f2, D: d2, trueF: f2, trueD: d2 }]; right = [{ F: f3, D: d3, trueF: f3, trueD: d3 }, { F: f4, D: d4, trueF: f4, trueD: d4 }];
      if (!lvSep(left) || !lvSep(right)) return null;
      const ml = F1 * d1 + f2 * d2, mr = f3 * d3 + f4 * d4;
      const res = ml > mr ? 0 : ml < mr ? 1 : 2;
      const texts = ['Die linke Seite senkt sich.', 'Die rechte Seite senkt sich.', 'Der Hebel bleibt im Gleichgewicht.'];
      const items = shuffle([0, 1, 2], rng);
      const q = { kind: 'mc', lang: 'de', prompt: 'Der Hebel ist masselos. Was geschieht?', options: items.map((i) => texts[i]), answer: items.indexOf(res), optionStyle: 'text',
        explain: `Links: ${F1} × ${d1} + ${f2} × ${d2} = ${ml}. Rechts: ${f3} × ${d3} + ${f4} × ${d4} = ${mr}. ${res === 2 ? 'Gleichgewicht.' : (res === 0 ? 'Links' : 'Rechts') + ' ist das Drehmoment größer, diese Seite senkt sich.'}` };
      const d = drawLever(left, right);
      q.stimulus = d.svg; q.stimulusClass = 'paper';
      return attachMeta(q, { tp: 'leverside', geo: d.geo, left: [[F1, d1], [f2, d2]], right: [[f3, d3], [f4, d4]], res });
    }
    if (!lvSep(left) || !lvSep(right)) return null;
    const mc = numMC(rng, ans, wrongs.filter(dec2), (v) => fmtNum(v) + ' ' + unit, { steps: unit === 'N' ? [5, -5, 10, -10, 20, -20, 2, -2] : [5, -5, 10, -10, 2.5, -2.5, 15, -15] });
    if (!mc) return null;
    const d = drawLever(left, right);
    const q = { kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt, options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)], explain };
    return attachMeta(q, { tp: 'levernum', geo: d.geo, left: left.map((w) => [w.trueF, w.trueD]), right: right.map((w) => [w.trueF, w.trueD]), unknown: (right.concat(left)).find((w) => w.F === null || w.D === null) ? (right.concat(left).find((w) => w.F === null) ? 'F' : 'D') : null, ans });
  }

  // ---------- pulleys ----------
  function drawPulley(n, load, unitLoad) {
    const R = 10, lane = 2 * R, pitch = lane, L = 110, yTop = 58, yBot = yTop + L;
    const modeA = n % 2 === 0; // A: dead end on the ceiling (even n); B: dead end on the lower block (odd n)
    const lx = (k) => 70 + (k - 1) * lane; // x of lane k (k = 1..n+1)
    const dirDown = (k) => (modeA ? k % 2 === 1 : k % 2 === 0); // segment k runs downward?
    let s = '', geo = { segs: [], pulleys: [], n };
    const W = 360, H = yBot + 100;
    // ceiling
    const cx0 = lx(1) - 24, cx1 = lx(n + 1) + 24;
    s += '<rect x="' + (cx0 - 6) + '" y="8" width="' + (cx1 - cx0 + 12) + '" height="9" fill="var(--soft)" stroke="var(--ink)" stroke-width="1.5"/>';
    // pulleys
    const pul = [];
    for (let k = 1; k <= n; k++) {
      const top = !dirDown(k); // segment k ends at the top -> rope goes over a top pulley to lane k+1
      pul.push({ k, top, cx: (lx(k) + lx(k + 1)) / 2, cy: top ? yTop : yBot, free: k === n });
    }
    // k = n: the last segment is always "up" by construction (see modes), pulley with the free end
    const bottomAx = [];
    pul.forEach((p) => {
      if (p.top) s += '<path d="M' + p.cx + ' 17V' + (p.cy - R) + '" stroke="var(--ink)" stroke-width="1.8"/>';
      else bottomAx.push(p.cx);
    });
    if (modeA) { s += '<path d="M' + lx(1) + ' 17V' + yTop + '" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><circle cx="' + lx(1) + '" cy="17" r="3" fill="var(--ink)"/>'; }
    // lower block bar
    const bx = bottomAx.concat(modeA ? [] : [lx(1)]);
    const bxMin = Math.min(...bx) - 14, bxMax = Math.max(...bx) + 14;
    const barMin = Math.min(bxMin, bxMax - 28), mid = (bxMin + bxMax) / 2;
    s += '<path d="M' + r2(barMin) + ' ' + yBot + 'H' + r2(bxMax) + '" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="M' + r2(mid) + ' ' + yBot + 'V' + (yBot + 34) + '" stroke="var(--ink)" stroke-width="2"/>';
    s += '<rect x="' + r2(mid - 36) + '" y="' + (yBot + 34) + '" width="72" height="32" rx="4" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>';
    s += tx(mid, yBot + 55, load + ' ' + unitLoad, { size: 14, weight: 700 });
    // wheels
    pul.forEach((p) => {
      s += '<g class="pl" data-top="' + (p.top ? 1 : 0) + '" data-cx="' + r2(p.cx) + '"><circle cx="' + r2(p.cx) + '" cy="' + p.cy + '" r="' + R + '" fill="var(--soft)" stroke="var(--ink)" stroke-width="1.5"/><circle cx="' + r2(p.cx) + '" cy="' + p.cy + '" r="2.5" fill="var(--ink)"/></g>';
      geo.pulleys.push({ cx: r2(p.cx), cy: p.cy, top: p.top });
    });
    // rope: segments
    for (let k = 1; k <= n; k++) {
      s += '<path class="seg" data-k="' + k + '" d="M' + lx(k) + ' ' + yTop + 'V' + yBot + '" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" fill="none"/>';
      geo.segs.push({ k, x: lx(k), y0: yTop, y1: yBot });
    }
    // rope arcs over the wheels
    for (let k = 1; k <= n; k++) {
      const p = pul[k - 1];
      s += '<path d="M' + lx(k) + ' ' + p.cy + 'A' + R + ' ' + R + ' 0 0 ' + (p.top ? 1 : 0) + ' ' + lx(k + 1) + ' ' + p.cy + '" stroke="var(--accent)" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    if (!modeA) s += '<path d="M' + lx(1) + ' ' + yBot + 'V' + (yBot + 6) + '" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>';
    // free end (pulled downwards)
    const fx = lx(n + 1);
    s += '<path class="free" d="M' + fx + ' ' + yTop + 'V' + (yBot + 10) + '" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" fill="none"/>';
    s += '<path d="M' + fx + ' ' + (yBot + 24) + 'L' + (fx - 6) + ' ' + (yBot + 10) + 'L' + (fx + 6) + ' ' + (yBot + 10) + 'Z" fill="var(--accent)" stroke="var(--accent)" stroke-linejoin="round"/>';
    s += tx(fx + 12, yBot - 20, 'F = ?', { size: 14, weight: 700, anchor: 'start' });
    return { svg: svgWrap(W, H, s, 'Flaschenzug'), geo };
  }
  function techPulley(level, rng) {
    const n = level === 'easy' ? ri(1, 3, rng) : level === 'medium' ? ri(2, 4, rng) : ri(3, 6, rng);
    const vt = level === 'hard' ? weighted([['force', 2], ['rope', 2], ['kg', 2]], rng) : level === 'medium' ? weighted([['force', 3], ['rope', 1]], rng) : 'force';
    let load, unitLoad = 'N', prompt, ans, unit, wrongs, explain, steps;
    if (vt === 'force') {
      const f = pick([10, 15, 20, 25, 30, 40, 50, 60], rng);
      load = f * n; ans = f; unit = 'N';
      prompt = `Die Last wiegt ${load} N. Seil und Rollen sind masselos, Reibung wird vernachlässigt. Mit welcher Kraft F muss man mindestens ziehen, um die Last langsam zu heben?`;
      wrongs = [load / (n + 1), n > 1 ? load / (n - 1) : load * 2, load, load * n, load / 2, load / (n + 2)];
      explain = `Die Last hängt an ${n} tragenden Seilstücken (die zwischen den Rollen). Jedes trägt ${load} ÷ ${n} = ${f} N. Das Seilende, an dem man zieht, trägt nicht mit.`;
      steps = [5, -5, 10, -10, 2, -2, 15, -15];
    } else if (vt === 'kg') {
      const f = pick([20, 30, 40, 50, 60, 80], rng);
      load = f * n / 10; unitLoad = 'kg'; ans = f; unit = 'N';
      if (!Number.isInteger(load)) return null;
      prompt = `Die Last hat eine Masse von ${load} kg (g = 10 N/kg). Seil und Rollen sind masselos, Reibung wird vernachlässigt. Welche Zugkraft F ist mindestens nötig?`;
      wrongs = [load / n, load * 10 / (n + 1), load * 10 / (n - 1), load * 10, load * 10 / 2, load * 10 * n];
      explain = `Gewichtskraft: ${load} kg × 10 N/kg = ${load * 10} N. Verteilt auf ${n} tragende Seilstücke: ${load * 10} ÷ ${n} = ${f} N.`;
      steps = [5, -5, 10, -10, 20, -20];
    } else {
      const h = pick([0.5, 1, 1.5, 2, 3], rng);
      load = pick([40, 60, 80, 120, 150], rng);
      ans = n * h; unit = 'm';
      prompt = `Die Last (${load} N) soll um ${fmtNum(h)} m angehoben werden. Wie viel Seil muss man dafür durch die Hand ziehen?`;
      wrongs = [h / n, h * (n - 1), h * (n + 1), h, load * h, h * n * 2];
      explain = `Jedes der ${n} tragenden Seilstücke muss um ${fmtNum(h)} m kürzer werden, es müssen also ${n} × ${fmtNum(h)} m = ${fmtNum(ans)} m Seil gezogen werden (Kraft wird gespart, Weg verlängert).`;
      steps = [0.5, -0.5, 1, -1, 2, -2];
    }
    const d = drawPulley(n, load, unitLoad);
    const mc = numMC(rng, ans, wrongs.filter(dec2).map(round2), (v) => fmtNum(v) + ' ' + unit, { steps });
    if (!mc) return null;
    const q = { kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt, options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)], explain: explain.replace(/(\d)\.(\d)/g, '$1,$2') };
    return attachMeta(q, { tp: 'pulley', n, vt, load, ans, geo: d.geo, h: vt === 'rope' ? ans / n : null });
  }

  // ---------- hydraulics and water pressure ----------
  function drawPress(A1, A2, F1, Fshown, loadF) {
    const k = 11, w1 = r2(k * Math.sqrt(A1)), w2 = r2(k * Math.sqrt(A2)), gap = 36;
    const x1 = 30, x2 = x1 + w1 + gap, W = x2 + w2 + 90, y0 = 70, hh = 100;
    let s = '';
    // cylinders and fluid
    s += '<path d="M' + x1 + ' ' + y0 + 'V' + (y0 + hh) + 'H' + r2(x2 + w2) + 'V' + y0 + '" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/>';
    s += '<path d="M' + r2(x1 + w1) + ' ' + y0 + 'V' + (y0 + hh - 22) + 'H' + x2 + 'V' + y0 + '" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/>';
    s += '<path d="M' + x1 + ' ' + (y0 + 28) + 'H' + r2(x1 + w1) + 'V' + (y0 + hh - 22) + 'H' + x2 + 'V' + (y0 + 28) + 'H' + r2(x2 + w2) + 'V' + (y0 + hh) + 'H' + x1 + 'Z" fill="var(--soft)" opacity="0.55"/>';
    // pistons
    s += '<g class="pis" data-side="L" data-w="' + w1 + '" data-a="' + A1 + '"><rect x="' + x1 + '" y="' + (y0 + 14) + '" width="' + w1 + '" height="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/></g>';
    s += '<g class="pis" data-side="R" data-w="' + w2 + '" data-a="' + A2 + '"><rect x="' + x2 + '" y="' + (y0 + 14) + '" width="' + w2 + '" height="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/></g>';
    s += '<path d="M' + r2(x1 + w1 / 2) + ' ' + (y0 + 14) + 'V' + (y0 - 18) + '" stroke="var(--ink)" stroke-width="2"/>';
    s += '<path d="M' + r2(x2 + w2 / 2) + ' ' + (y0 + 14) + 'V' + (y0 - 18) + '" stroke="var(--ink)" stroke-width="2"/>';
    // force arrow left (down), load box right
    const ax = r2(x1 + w1 / 2);
    s += '<path d="M' + ax + ' 14V' + (y0 - 20) + '" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><path d="M' + ax + ' ' + (y0 - 12) + 'L' + (ax - 6) + ' ' + (y0 - 26) + 'L' + (ax + 6) + ' ' + (y0 - 26) + 'Z" fill="var(--accent)" stroke="var(--accent)" stroke-linejoin="round"/>';
    s += tx(ax + 10, 28, Fshown, { size: 13, weight: 700, anchor: 'start' });
    const bx = r2(x2 + w2 / 2);
    s += '<rect x="' + r2(bx - 32) + '" y="' + (y0 - 52) + '" width="64" height="34" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>' + tx(bx, y0 - 30, loadF, { size: 13, weight: 700 });
    s += tx(ax, y0 + hh + 18, 'A₁ = ' + A1 + ' cm²', { size: 12 }) + tx(bx, y0 + hh + 18, 'A₂ = ' + A2 + ' cm²', { size: 12 });
    return { svg: svgWrap(W, y0 + hh + 30, s, 'Hydraulische Presse'), geo: { w1, w2, A1, A2, k } };
  }
  function drawDiver(h) {
    const sc = 2.2, y0 = 40, W = 300, H = y0 + 60 * sc + 30;
    let s = '';
    s += '<rect x="30" y="' + y0 + '" width="170" height="' + r2(60 * sc) + '" fill="var(--soft)" opacity="0.5" stroke="var(--ink)" stroke-width="2"/>';
    s += '<path d="M24 ' + y0 + 'H206" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>';
    for (let d = 0; d <= 60; d += 10) {
      const y = r2(y0 + d * sc);
      s += '<path d="M218 ' + y + 'H228" stroke="var(--ink)" stroke-width="1.8"/>' + tx(234, y + 4, d + ' m', { size: 11, anchor: 'start' });
    }
    const yd = r2(y0 + h * sc);
    s += '<g class="dv" data-h="' + h + '" data-y="' + yd + '"><circle cx="115" cy="' + yd + '" r="8" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/></g>';
    s += '<path d="M115 ' + y0 + 'V' + (yd - 10) + '" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 4"/>';
    s += tx(126, r2((y0 + yd) / 2 + 4), 'h = ' + h + ' m', { size: 13, weight: 700, anchor: 'start' });
    s += tx(30, 22, 'Wasseroberfläche', { size: 11, anchor: 'start' });
    return { svg: svgWrap(W, H, s, 'Taucher unter Wasser'), geo: { sc, y0, h, yd } };
  }
  function techHydro(level, rng) {
    const vt = pick(['force', 'force', 'path', 'press', 'water', 'water'], rng);
    if (vt === 'water') {
      const h = pick([10, 15, 20, 25, 30, 40, 50], rng), ans = 1 + h / 10;
      const d = drawDiver(h);
      const wrongs = [h / 10, h, 1 + h, ans * 2, 1 + h / 100, 1 + h / 5];
      const mc = numMC(rng, ans, wrongs.filter(dec2).map(round2), (v) => fmtNum(v) + ' bar', { steps: [0.5, -0.5, 1, -1, 2, -2, 5, -5] });
      if (!mc) return null;
      const q = { kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: 'Der Luftdruck an der Wasseroberfläche beträgt 1 bar. Pro 10 m Wassertiefe steigt der Druck um 1 bar. Wie groß ist der gesamte Druck auf den Taucher?', options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)],
        explain: `Wasserdruck in ${h} m Tiefe: ${h} ÷ 10 = ${fmtNum(h / 10)} bar. Dazu kommt der Luftdruck von 1 bar: ${fmtNum(ans)} bar.` };
      return attachMeta(q, { tp: 'water', h, ans, geo: d.geo });
    }
    const A1 = pick([2, 4, 5, 8, 10], rng), A2 = pick([20, 25, 40, 50, 80, 100], rng);
    if (A2 / A1 < 4) return null;
    const F1 = pick([10, 20, 25, 30, 40, 50, 60], rng);
    if (vt === 'force') {
      const ans = F1 * A2 / A1;
      if (!Number.isInteger(ans) || ans > 3000) return null;
      const d = drawPress(A1, A2, F1, 'F₁ = ' + F1 + ' N', 'F₂ = ?');
      const wrongs = [F1 * A1 / A2, F1 + A2 - A1, F1 * A2, F1 / A1 * A2 / 2, F1 * (A2 - A1), F1 / A1];
      const mc = numMC(rng, ans, wrongs.filter(dec2).map(round2), (v) => fmtNum(v) + ' N', { steps: [10, -10, 20, -20, 50, -50, 5, -5] });
      if (!mc) return null;
      const q = { kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: `Eine hydraulische Presse: Auf den kleinen Kolben (${A1} cm²) wirkt F₁ = ${F1} N. Welche Kraft F₂ entsteht am großen Kolben (${A2} cm²)?`, options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)],
        explain: `Der Druck ist überall gleich: p = ${F1} N ÷ ${A1} cm² = ${fmtNum(F1 / A1)} N/cm². Am großen Kolben: F₂ = p × ${A2} cm² = ${fmtNum(ans)} N.` };
      return attachMeta(q, { tp: 'hydroforce', A1, A2, F1, ans, geo: d.geo });
    }
    if (vt === 'press') {
      const ans = F1 / A1;
      if (!dec2(ans)) return null;
      const d = drawPress(A1, A2, F1, 'F₁ = ' + F1 + ' N', 'F₂ = ?');
      const wrongs = [F1 * A1, F1 / A2, F1 * A2 / A1, F1 + A1, F1 - A1, A1 / F1];
      const mc = numMC(rng, ans, wrongs.filter(dec2).map(round2), (v) => fmtNum(v) + ' N/cm²', { steps: [0.5, -0.5, 1, -1, 2, -2, 5, -5] });
      if (!mc) return null;
      const q = { kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: `Auf den kleinen Kolben (${A1} cm²) wirkt F₁ = ${F1} N. Wie groß ist der Druck in der Flüssigkeit?`, options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)],
        explain: `Druck = Kraft ÷ Fläche = ${F1} N ÷ ${A1} cm² = ${fmtNum(ans)} N/cm².` };
      return attachMeta(q, { tp: 'hydropress', A1, A2, F1, ans, geo: d.geo });
    }
    const s1 = pick([5, 10, 15, 20, 25], rng), ans = s1 * A1 / A2;
    if (!dec2(ans)) return null;
    const d = drawPress(A1, A2, F1, 'F₁ = ' + F1 + ' N', 'Last');
    const wrongs = [s1 * A2 / A1, s1, s1 + A2 - A1, s1 * A1, ans * 2, s1 / 2];
    const mc = numMC(rng, ans, wrongs.filter(dec2).map(round2), (v) => fmtNum(v) + ' cm', { steps: [0.5, -0.5, 1, -1, 2, -2, 0.25, -0.25] });
    if (!mc) return null;
    const q = { kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: `Der kleine Kolben (${A1} cm²) wird um ${s1} cm nach unten gedrückt. Um wie viel hebt sich der große Kolben (${A2} cm²)?`, options: mc.options, answer: mc.answer, optionStyle: 'grid', typedAnswer: [dotStr(ans)],
      explain: `Die verdrängte Flüssigkeit hat auf beiden Seiten dasselbe Volumen: ${A1} cm² × ${s1} cm = ${A2} cm² × s. s = ${A1 * s1} ÷ ${A2} = ${fmtNum(ans)} cm.` };
    return attachMeta(q, { tp: 'hydropath', A1, A2, s1, ans, geo: d.geo });
  }

  // ---------- circuits ----------
  // structure: items = [ {t:'b'} | {t:'s', open} | {t:'p', br:[ [elem...], ... ]} ]  (elem = {t:'b'} | {t:'s', open})
  // Evaluate: bulbs of unit resistance, closed switch = wire, open switch = gap, ideal battery.
  function ckGraph(items, mode) {
    const edges = []; // {a,b,kind:'bulb'|'wire', id}
    let node = 0, bi = 0, si = 0;
    const nn = () => node++;
    const plus = nn();
    let cur = plus;
    const addElem = (e, a, b, ids) => {
      if (e.t === 'b') { edges.push({ a, b, kind: 'bulb', id: e.id }); }
      else {
        const open = mode === 'allclosed' ? false : mode === 'allopen' ? true : e.open;
        if (!open) edges.push({ a, b, kind: mode === 'swbulb' ? 'res' : 'wire', id: e.id });
      }
    };
    const addChain = (chain, a, b) => {
      let prev = a;
      chain.forEach((e, k) => { const nx = k === chain.length - 1 ? b : nn(); addElem(e, prev, nx); prev = nx; });
    };
    items.forEach((it) => {
      const nx = nn();
      if (it.t === 'p') {
        if (mode === 'noparallel') { let p = cur; it.br.forEach((ch) => ch.forEach((e, k) => { const q2 = nn(); addElem(e, p, q2); p = q2; })); edges.push({ a: p, b: nx, kind: 'wire' }); }
        else it.br.forEach((ch) => addChain(ch, cur, nx));
      } else addElem(it, cur, nx);
      cur = nx;
    });
    return { edges, plus, minus: cur, nodes: node };
  }
  function ckSolve(items, mode) {
    const g = ckGraph(items, mode);
    // merge wire edges
    const par = Array.from({ length: g.nodes }, (_, i) => i);
    const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    g.edges.filter((e) => e.kind === 'wire').forEach((e) => { par[find(e.a)] = find(e.b); });
    const P = find(g.plus), M = find(g.minus);
    if (P === M) return null; // battery shorted
    const res = g.edges.filter((e) => e.kind !== 'wire').map((e) => ({ a: find(e.a), b: find(e.b), id: e.id, kind: e.kind }));
    // reachable from P or M through resistive edges
    const adj = new Map();
    res.forEach((e) => { [[e.a, e.b], [e.b, e.a]].forEach(([u, v]) => { if (!adj.has(u)) adj.set(u, []); adj.get(u).push(v); }); });
    const seen = new Set([P, M]);
    const st = [P, M];
    while (st.length) { const u = st.pop(); (adj.get(u) || []).forEach((v) => { if (!seen.has(v)) { seen.add(v); st.push(v); } }); }
    const unk = Array.from(seen).filter((x) => x !== P && x !== M);
    const idx = new Map(unk.map((x, i) => [x, i]));
    const nU = unk.length, A = Array.from({ length: nU }, () => new Array(nU + 1).fill(0));
    const edgesIn = res.filter((e) => seen.has(e.a) && seen.has(e.b));
    edgesIn.forEach((e) => {
      [[e.a, e.b], [e.b, e.a]].forEach(([u, v]) => {
        if (!idx.has(u)) return;
        const i = idx.get(u);
        A[i][i] += 1;
        if (idx.has(v)) A[i][idx.get(v)] -= 1;
        else if (v === P) A[i][nU] += 1;
      });
    });
    // gaussian elimination
    for (let c = 0; c < nU; c++) {
      let p = c;
      for (let r = c + 1; r < nU; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12) continue;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < nU; r++) if (r !== c) { const f = A[r][c] / A[c][c]; if (f) for (let k = c; k <= nU; k++) A[r][k] -= f * A[c][k]; }
    }
    const V = new Map([[P, 1], [M, 0]]);
    unk.forEach((x, i) => V.set(x, Math.abs(A[i][i]) < 1e-12 ? 0 : A[i][nU] / A[i][i]));
    const lit = [];
    res.forEach((e) => { if (e.kind === 'bulb' && V.has(e.a) && V.has(e.b) && Math.abs(V.get(e.a) - V.get(e.b)) > 1e-9) lit.push(e.id); });
    return lit.sort((a, b) => a - b);
  }
  function ckLabel(items) { // assign ids in drawing order
    let b = 0, s = 0;
    const lab = (e) => { if (e.t === 'b') e.id = ++b; else e.id = ++s; };
    items.forEach((it) => { if (it.t === 'p') it.br.forEach((ch) => ch.forEach(lab)); else lab(it); });
    return { bulbs: b, switches: s };
  }
  function ckRandom(level, rng) {
    const sw = () => ({ t: 's', open: rng() < 0.5 });
    const bu = () => ({ t: 'b' });
    let items;
    if (level === 'easy') {
      items = shuffle([bu(), bu(), bu(), sw()], rng);
      if (rng() < 0.4) items.push(sw());
    } else if (level === 'medium') {
      const brs = [[bu()].concat(rng() < 0.5 ? [sw()] : []), [bu()].concat(rng() < 0.5 ? [sw()] : [])];
      brs.forEach((b, i) => { if (rng() < 0.5) b.reverse(); });
      items = shuffle([{ t: 'p', br: brs }, bu(), rng() < 0.7 ? sw() : bu()], rng);
    } else {
      const nb = rng() < 0.4 ? 3 : 2;
      const brs = [];
      for (let i = 0; i < nb; i++) {
        const k = rng();
        brs.push(k < 0.3 ? [sw()] : k < 0.65 ? [bu()] : k < 0.85 ? [bu(), sw()] : [sw(), bu()]);
      }
      if (!brs.some((b) => b.some((e) => e.t === 'b'))) brs[0].push(bu());
      items = shuffle([{ t: 'p', br: brs }, bu(), rng() < 0.6 ? sw() : bu()], rng);
      if (rng() < 0.35) items.push(rng() < 0.5 ? sw() : bu());
    }
    return items;
  }
  const ckW = (it) => (it.t === 'p' ? Math.max(...it.br.map((ch) => ch.length)) * 56 + 26 : 56);
  function drawCircuit(items) {
    const maxB = Math.max(1, ...items.map((it) => (it.t === 'p' ? it.br.length : 1)));
    const dy = 56, yT = 46, yBt = yT + (maxB - 1) * dy + 50, xL = 36;
    const totalW = items.reduce((a, it) => a + ckW(it), 0);
    const xR = xL + 18 + totalW + 14, W = xR + 26, H = yBt + 28;
    let s = '';
    const geo = { bulbs: [], sws: [], W, H };
    const wire = (d) => { s += '<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'; };
    const bulb = (x, y, id) => {
      s += '<g class="bu" data-bulb="L' + id + '"><circle cx="' + r2(x) + '" cy="' + y + '" r="13" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>' +
        '<path d="M' + r2(x - 9) + ' ' + (y - 9) + 'L' + r2(x + 9) + ' ' + (y + 9) + 'M' + r2(x + 9) + ' ' + (y - 9) + 'L' + r2(x - 9) + ' ' + (y + 9) + '" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round"/></g>' + tx(x, y - 19, 'L' + id, { size: 11 });
      geo.bulbs.push({ id, x: r2(x), y });
    };
    const swit = (x, y, e) => {
      s += '<g class="sw" data-sw="S' + e.id + '" data-open="' + (e.open ? 1 : 0) + '"><circle cx="' + r2(x - 14) + '" cy="' + y + '" r="3" fill="var(--ink)"/><circle cx="' + r2(x + 14) + '" cy="' + y + '" r="3" fill="var(--ink)"/>' +
        (e.open ? '<path d="M' + r2(x - 14) + ' ' + y + 'L' + r2(x + 10) + ' ' + (y - 15) + '" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>' : '<path d="M' + r2(x - 14) + ' ' + y + 'H' + r2(x + 14) + '" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>') + '</g>' + tx(x, y + 24, 'S' + e.id, { size: 11 });
      geo.sws.push({ id: e.id, open: !!e.open, x: r2(x), y });
    };
    const elem = (e, x, y) => (e.t === 'b' ? bulb(x, y, e.id) : swit(x, y, e));
    // outer frame
    wire('M' + xL + ' ' + yT + 'V' + (yBt) + 'H' + xR + 'V' + yT);
    // battery on the left wire
    const by = (yT + yBt) / 2;
    s += '<path d="M' + xL + ' ' + yT + 'V' + r2(by - 9) + '" stroke="var(--bg, var(--paper))" stroke-width="0"/>';
    s += '<rect x="' + (xL - 14) + '" y="' + r2(by - 8) + '" width="28" height="16" fill="var(--paper)" stroke="none"/>';
    s += '<path d="M' + (xL - 14) + ' ' + r2(by - 5) + 'H' + (xL + 14) + '" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>';
    s += '<path d="M' + (xL - 8) + ' ' + r2(by + 5) + 'H' + (xL + 8) + '" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>';
    s += tx(xL + 22, by - 3, '+', { size: 12, anchor: 'start' });
    // top wire items
    let x = xL;
    items.forEach((it) => {
      const w = ckW(it), x0 = x, x1 = x + w;
      if (it.t !== 'p') {
        const mid = (x0 + x1) / 2;
        wire('M' + r2(x0 === xL ? xL : x0) + ' ' + yT + 'H' + r2(mid - 14));
        wire('M' + r2(mid + 14) + ' ' + yT + 'H' + r2(x1));
        elem(it, mid, yT);
      } else {
        const m = it.br.length, ya = yT, yb = yT + (m - 1) * dy;
        const xa = x0 + 8, xb = x1 - 8;
        wire('M' + r2(x0) + ' ' + yT + 'H' + r2(xa));
        wire('M' + r2(xb) + ' ' + yT + 'H' + r2(x1));
        wire('M' + r2(xa) + ' ' + ya + 'V' + yb);
        wire('M' + r2(xb) + ' ' + ya + 'V' + yb);
        it.br.forEach((ch, j) => {
          const yy = yT + j * dy, span = xb - xa, step = span / ch.length;
          let px = xa;
          ch.forEach((e, k) => {
            const cx = xa + step * (k + 0.5);
            wire('M' + r2(px) + ' ' + yy + 'H' + r2(cx - 14));
            elem(e, cx, yy);
            px = cx + 14;
          });
          wire('M' + r2(px) + ' ' + yy + 'H' + r2(xb));
        });
      }
      x = x1;
    });
    wire('M' + r2(x) + ' ' + yT + 'H' + xR);
    return { svg: svgWrap(W, H, s, 'Stromkreis'), geo };
  }
  function techCircuit(level, rng) {
    const items = ckRandom(level, rng);
    const cnt = ckLabel(items);
    if (cnt.bulbs < 3 || cnt.bulbs > 4) return null;
    if (items.reduce((a, it) => a + ckW(it), 0) > 330) return null;
    const lit = ckSolve(items, 'normal');
    if (!lit) return null;
    const nb = cnt.bulbs;
    if (level !== 'easy' && (lit.length === 0 || lit.length === nb) && rng() < 0.9) return null;
    const str = (a) => (a.length === 0 ? 'keine' : a.length === nb ? 'alle' : a.map((i) => 'L' + i).join(', '));
    const all = Array.from({ length: nb }, (_, i) => i + 1);
    const cands = [];
    ['allclosed', 'allopen', 'swbulb', 'noparallel'].forEach((m) => { const r = ckSolve(items, m); if (r) cands.push(r); });
    cands.push(all.filter((i) => !lit.includes(i)), all, []);
    for (let k = 1; k <= nb; k++) cands.push(lit.includes(k) ? lit.filter((x) => x !== k) : lit.concat([k]).sort((a, b) => a - b));
    const wrongs = shuffle(cands.filter((c) => c.join() !== lit.join()), rng).map(str);
    const mc = textMC(rng, str(lit), wrongs, 5);
    if (!mc) return null;
    const d = drawCircuit(items);
    const swDesc = d.geo.sws.map((s) => 'S' + s.id + ' ' + (s.open ? 'offen' : 'geschlossen')).join(', ');
    const q = {
      kind: 'mc', lang: 'de', stimulus: d.svg, stimulusClass: 'paper', prompt: 'Alle Lampen sind gleich, die Batterie ist ideal. Welche Lampen leuchten?',
      options: mc.options, answer: mc.answer, optionStyle: 'grid',
      explain: `Schalterstellungen: ${swDesc || 'keine Schalter'}. Eine Lampe leuchtet nur, wenn ein geschlossener Stromweg durch sie führt und der Strom nicht an ihr vorbeigeleitet wird (Kurzschluss durch einen geschlossenen Schalter parallel zur Lampe). Es leuchten: ${str(lit)}.`,
    };
    return attachMeta(q, { tp: 'circuit', items: JSON.parse(JSON.stringify(items)), lit, nb, geo: d.geo });
  }

  const TECH = {
    easy: [[techGearDir, 4], [techLever, 4], [techPulley, 2], [techCircuit, 2]],
    medium: [[techGearRatio, 3], [techGearDir, 1], [techLever, 3], [techPulley, 3], [techCircuit, 2], [techHydro, 1.5]],
    hard: [[techGearCompound, 3], [techGearRatio, 1.5], [techLever, 2.5], [techPulley, 2.5], [techCircuit, 3], [techHydro, 3]],
  };
  T.register({
    id: 'technical', name: 'Technical understanding', de: 'Technisches Verständnis', domain: 'reasoning', n: 10, secs: 420, refSecs: 35, learn: 0.8, options: 5,
    tips: [
      'Meshing gears always turn in opposite directions; gears on one shaft turn together.',
      'Speed ratio depends only on the first and the last gear of a simple chain; idler gears only flip the direction.',
      'Lever law: force × distance on the left equals force × distance on the right.',
      'In a pulley system count the rope segments that carry the load; the force is the load divided by that number, the rope path is multiplied by it.',
      'In circuits look for complete loops: an open switch breaks a branch, and a closed switch next to a lamp bypasses it.',
    ],
    desc: {
      easy: 'Gear directions, simple levers, one pulley and series circuits.',
      medium: 'Gear ratios, missing weights or distances on levers, small pulley systems, parallel circuits and a first hydraulic press.',
      hard: 'Gear trains with a shared shaft, levers with several weights, block and tackle, hydraulics and circuits with shorted lamps.',
    },
    make: retry((level, rng) => weighted(TECH[level] || TECH.easy, rng)(level, rng), 'technical'),
  });
})(typeof self !== "undefined" ? self : this);
