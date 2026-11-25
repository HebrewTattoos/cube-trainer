/* Number-series engine (Zahlenreihen).
 *
 * Every question is built from a known rule family, then a built-in solver tries the usual IQ-test rules
 * (steady steps, growing steps, ratios, "x*a+b", sum of the two before, interleaved series, alternating
 * operations, primes, ...) on the numbers that are shown. A series is only used if every rule that fits
 * the shown numbers predicts the same next number, so there is exactly one defensible answer.
 */
(function (root) {
  'use strict';

  const LIM = 20000;
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131];

  // ---------- helpers ----------
  const ri = (a, b, rng) => a + Math.floor(rng() * (b - a + 1));
  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function weighted(pairs, rng) {
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let r = rng() * total;
    for (const [v, w] of pairs) {
      if (r < w) return v;
      r -= w;
    }
    return pairs[pairs.length - 1][0];
  }
  const seq = (L, f) => Array.from({ length: L }, (_, i) => f(i));
  function iter(L, x0, step) {
    const t = [x0];
    for (let i = 0; i < L - 1; i++) t.push(step(t[i], i));
    return t;
  }
  const sgn = (n) => (n > 0 ? '+' + n : '−' + -n);
  const addSub = (n) => (n > 0 ? 'add ' + n : 'subtract ' + -n);
  const plusMinus = (n) => (n > 0 ? 'plus ' + n : 'minus ' + -n);
  const startFor = (d, L, rng) => (d > 0 ? ri(1, 30, rng) : ri(30 + -d * L, 70 + -d * L, rng));

  // ---------- rule families (each returns the full series including the answer) ----------
  const FAM = {
    add(rng, L) {
      const d = ri(2, 12, rng) * (rng() < 0.2 ? -1 : 1);
      const s = d > 0 ? ri(1, 40, rng) : ri(90, 150, rng);
      return { terms: seq(L, (i) => s + i * d), rule: d > 0 ? 'Add ' + d + ' each time.' : 'Subtract ' + -d + ' each time.' };
    },
    mul(rng, L) {
      const r = pick([2, 3], rng);
      const s = ri(1, r === 3 ? 2 : 4, rng);
      return { terms: seq(L, (i) => s * Math.pow(r, i)), rule: 'Multiply by ' + r + ' each time.' };
    },
    div(rng, L) {
      const r = pick([2, 3], rng);
      const s = ri(1, 3, rng) * Math.pow(r, L - 1);
      return { terms: seq(L, (i) => s / Math.pow(r, i)), rule: 'Divide by ' + r + ' each time.' };
    },
    growdiff1(rng, L) {
      const d0 = ri(1, 3, rng);
      const t = iter(L, ri(1, 20, rng), (x, i) => x + d0 + i);
      return { terms: t, rule: 'The step grows by 1: +' + d0 + ', +' + (d0 + 1) + ', +' + (d0 + 2) + ', …' };
    },
    squares(rng, L) {
      const a = ri(1, 8, rng);
      return { terms: seq(L, (i) => (a + i) * (a + i)), rule: 'Square numbers: ' + a + '², ' + (a + 1) + '², ' + (a + 2) + '², …' };
    },
    altaddsub(rng, L) {
      const a = ri(4, 12, rng);
      const b = ri(1, a - 2, rng);
      const t = iter(L, ri(5, 30, rng), (x, i) => (i % 2 === 0 ? x + a : x - b));
      return { terms: t, rule: 'Alternately add ' + a + ' and subtract ' + b + '.' };
    },
    growdiff(rng, L) {
      const c = ri(2, 3, rng);
      const d0 = ri(1, 3, rng);
      const t = iter(L, ri(1, 15, rng), (x, i) => x + d0 + i * c);
      return { terms: t, rule: 'The step grows by ' + c + ': +' + d0 + ', +' + (d0 + c) + ', +' + (d0 + 2 * c) + ', …' };
    },
    lin(rng, L) {
      const a = pick([2, 3], rng);
      const b = pick([-3, -2, -1, 1, 2, 3, 4, 5], rng);
      const s = b < 0 ? ri(-b + 2, 8, rng) : ri(1, 5, rng);
      return { terms: iter(L, s, (x) => a * x + b), rule: 'Multiply by ' + a + ', then ' + addSub(b) + '.' };
    },
    altops(rng, L) {
      const a = pick([2, 3], rng);
      const b = ri(1, 9, rng) * (rng() < 0.25 ? -1 : 1);
      const mulFirst = rng() < 0.5;
      const t = iter(L, ri(2, 8, rng), (x, i) => ((i % 2 === 0) === mulFirst ? x * a : x + b));
      return { terms: t, rule: 'Alternately ' + (mulFirst ? 'multiply by ' + a + ' and ' + addSub(b) : addSub(b) + ' and multiply by ' + a) + '.' };
    },
    altmul(rng, L) {
      const [a, b] = pick([[2, 3], [3, 2], [2, 4], [4, 2]], rng);
      const t = iter(L, ri(1, 3, rng), (x, i) => (i % 2 === 0 ? x * a : x * b));
      return { terms: t, rule: 'Alternately multiply by ' + a + ' and by ' + b + '.' };
    },
    interAdd(rng, L) {
      const d1 = ri(2, 8, rng) * (rng() < 0.25 ? -1 : 1);
      let d2 = ri(2, 9, rng) * (rng() < 0.25 ? -1 : 1);
      if (d2 === d1) d2 += 1;
      const s1 = startFor(d1, L, rng);
      const s2 = startFor(d2, L, rng);
      const t = seq(L, (i) => (i % 2 === 0 ? s1 + (i / 2) * d1 : s2 + ((i - 1) / 2) * d2));
      return { terms: t, rule: 'Two interleaved series: the 1st, 3rd, 5th … number goes ' + sgn(d1) + ' each time, the 2nd, 4th, 6th … goes ' + sgn(d2) + '.' };
    },
    fib(rng, L) {
      const t = [ri(1, 5, rng), ri(1, 6, rng)];
      while (t.length < L) t.push(t[t.length - 1] + t[t.length - 2]);
      return { terms: t, rule: 'Each number is the sum of the two before it.' };
    },
    powc(rng, L) {
      const n0 = ri(1, 3, rng);
      const c = pick([-3, -2, -1, 1, 2, 3, 5], rng);
      return { terms: seq(L, (i) => Math.pow(2, n0 + i) + c), rule: 'Powers of 2, ' + plusMinus(c) + ' (2ⁿ ' + (c > 0 ? '+' : '−') + ' ' + Math.abs(c) + ').' };
    },
    sqc(rng, L) {
      const n0 = ri(1, 6, rng);
      const c = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7, 9], rng);
      return { terms: seq(L, (i) => (n0 + i) * (n0 + i) + c), rule: 'Square numbers, ' + plusMinus(c) + '.' };
    },
    interAddGeo(rng, L) {
      const d1 = ri(2, 7, rng) * (rng() < 0.25 ? -1 : 1);
      const s1 = startFor(d1, L, rng);
      const s2 = ri(1, 4, rng);
      const geoFirst = rng() < 0.5;
      const A = (k) => s1 + k * d1;
      const G = (k) => s2 * Math.pow(2, k);
      const t = seq(L, (i) => {
        const k = Math.floor(i / 2);
        const isFirstSeries = i % 2 === 0;
        return isFirstSeries === geoFirst ? G(k) : A(k);
      });
      return { terms: t, rule: 'Two interleaved series: one goes ' + sgn(d1) + ' each time, the other doubles each time.' };
    },
    diffgeo(rng, L) {
      const r = pick([2, 3], rng);
      const d0 = ri(1, 3, rng);
      const t = iter(L, ri(1, 10, rng), (x, i) => x + d0 * Math.pow(r, i));
      return { terms: t, rule: 'The step ' + (r === 2 ? 'doubles' : 'triples') + ' each time: +' + d0 + ', +' + d0 * r + ', +' + d0 * r * r + ', …' };
    },
    cube(rng, L) {
      const n0 = ri(1, 4, rng);
      const c = pick([0, 0, 1, -1, 2, -2, 3], rng);
      return { terms: seq(L, (i) => Math.pow(n0 + i, 3) + c), rule: 'Cube numbers' + (c ? ', ' + plusMinus(c) : '') + '.' };
    },
    pronic(rng, L) {
      const n0 = ri(1, 5, rng);
      return { terms: seq(L, (i) => (n0 + i) * (n0 + i + 1)), rule: 'n × (n + 1): ' + n0 + '×' + (n0 + 1) + ', ' + (n0 + 1) + '×' + (n0 + 2) + ', …' };
    },
    fibk(rng, L) {
      const k = pick([1, 2, 3, -1], rng);
      const t = [ri(1, 4, rng), ri(1, 5, rng)];
      while (t.length < L) t.push(t[t.length - 1] + t[t.length - 2] + k);
      return { terms: t, rule: 'Each number is the sum of the two before it, ' + plusMinus(k) + '.' };
    },
    primes(rng, L) {
      const i0 = ri(0, PRIMES.length - L, rng);
      return { terms: PRIMES.slice(i0, i0 + L), rule: 'Prime numbers.' };
    },
    sumsq(rng, L) {
      const off = ri(0, 2, rng);
      const t = iter(L, ri(1, 10, rng), (x, i) => x + (off + 1 + i) * (off + 1 + i));
      const q = [off + 1, off + 2, off + 3, off + 4].map((n) => '+' + n * n).join(', ');
      return { terms: t, rule: 'Add the square numbers: ' + q + ', …' };
    },
  };

  const PLAN = {
    easy:   { L: 7, fams: [['add', 3], ['mul', 2], ['div', 1], ['growdiff1', 2], ['squares', 2], ['altaddsub', 2]] },
    medium: { L: 8, fams: [['growdiff', 2], ['lin', 2], ['altops', 2], ['altmul', 1], ['interAdd', 3], ['fib', 2], ['powc', 1], ['sqc', 2], ['growdiff1', 1], ['squares', 1]] },
    hard:   { L: 8, fams: [['interAddGeo', 3], ['diffgeo', 2], ['cube', 2], ['pronic', 1], ['fibk', 2], ['primes', 1], ['sumsq', 2], ['lin', 1], ['altops', 2], ['interAdd', 1]] },
  };

  // ---------- the solver: every standard IQ-test rule that fits the shown numbers ----------
  const diffs = (a) => {
    const d = [];
    for (let i = 1; i < a.length; i++) d.push(a[i] - a[i - 1]);
    return d;
  };
  const allEq = (a) => a.every((v) => v === a[0]);

  // k-th differences constant -> extrapolate
  function polyNext(t, k, minTop) {
    const tab = [t];
    for (let j = 1; j <= k; j++) tab.push(diffs(tab[j - 1]));
    const top = tab[k];
    if (top.length < minTop || !allEq(top)) return null;
    let next = top[0];
    for (let l = k - 1; l >= 0; l--) next = tab[l][tab[l].length - 1] + next;
    return next;
  }
  // constant ratio
  function ratioNext(t, minLen) {
    if (t.length < minLen || t.some((v) => v === 0)) return null;
    for (let i = 1; i < t.length - 1; i++) if (t[i] * t[i] !== t[i - 1] * t[i + 1]) return null;
    const n = t.length;
    const num = t[n - 1] * t[n - 1];
    return num % t[n - 2] === 0 ? num / t[n - 2] : null;
  }
  // x -> a*x + b
  function linNext(t) {
    if (t.length < 4) return null;
    const d0 = t[1] - t[0];
    const d1 = t[2] - t[1];
    if (d0 === 0 || d1 % d0 !== 0) return null;
    const a = d1 / d0;
    const b = t[1] - a * t[0];
    for (let i = 0; i < t.length - 1; i++) if (t[i + 1] !== a * t[i] + b) return null;
    return a * t[t.length - 1] + b;
  }
  // sum of the two before, plus a constant
  function fibNext(t) {
    if (t.length < 5) return null;
    const k = t[2] - t[1] - t[0];
    for (let i = 2; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2] + k) return null;
    return t[t.length - 1] + t[t.length - 2] + k;
  }
  function subNexts(s) {
    const out = [];
    const a = polyNext(s, 1, 2);
    if (a !== null) out.push(a);
    const b = polyNext(s, 2, 2);
    if (b !== null) out.push(b);
    const c = ratioNext(s, 3);
    if (c !== null) out.push(c);
    return out;
  }
  // two interleaved series
  function interNext(t) {
    const A = t.filter((_, i) => i % 2 === 0);
    const B = t.filter((_, i) => i % 2 === 1);
    if (A.length < 3 || B.length < 3) return [];
    const nA = subNexts(A);
    const nB = subNexts(B);
    if (!nA.length || !nB.length) return [];
    return t.length % 2 === 0 ? nA : nB;
  }
  // steps that repeat with period 2 or 3
  function periodicNext(t) {
    const out = [];
    const d = diffs(t);
    for (const p of [2, 3]) {
      if (d.length < p + 3) continue;
      let ok = true;
      for (let i = p; i < d.length; i++) if (d[i] !== d[i - p]) ok = false;
      if (ok) out.push(t[t.length - 1] + d[d.length - p]);
    }
    return out;
  }
  // two operations (add or multiply) taking turns
  function altOpsNext(t) {
    const n = t.length;
    if (n < 6) return [];
    const phases = [[], []];
    for (let i = 0; i < n - 1; i++) phases[i % 2].push([t[i], t[i + 1]]);
    const fit = phases.map((ph) => {
      const f = {};
      const a = ph[0][1] - ph[0][0];
      if (ph.every(([x, y]) => y - x === a)) f.add = a;
      if (ph.every(([x]) => x !== 0)) {
        const [x0, y0] = ph[0];
        if (ph.every(([x, y]) => y * x0 === y0 * x)) f.mul = [y0, x0];
      }
      return f;
    });
    if (!fit.every((f) => f.add !== undefined || f.mul)) return [];
    const f = fit[(n - 1) % 2];
    const out = [];
    if (f.add !== undefined) out.push(t[n - 1] + f.add);
    if (f.mul) {
      const v = t[n - 1] * f.mul[0];
      if (v % f.mul[1] === 0) out.push(v / f.mul[1]);
    }
    return out;
  }
  // multiplier grows by a constant (x1, x2, x3 ...)
  function ratioArithNext(t) {
    if (t.length < 6 || t.some((v) => v === 0)) return null;
    const r = [];
    for (let i = 0; i < t.length - 1; i++) {
      if (t[i + 1] % t[i] !== 0) return null;
      r.push(t[i + 1] / t[i]);
    }
    const d = diffs(r);
    if (d.length < 3 || !allEq(d) || d[0] === 0) return null;
    return t[t.length - 1] * (r[r.length - 1] + d[0]);
  }
  // steps form a geometric series
  function diffGeoNext(t) {
    if (t.length < 5) return null;
    const nx = ratioNext(diffs(t), 4);
    return nx === null ? null : t[t.length - 1] + nx;
  }
  function primeNext(t) {
    const i = PRIMES.indexOf(t[0]);
    if (i < 0 || i + t.length >= PRIMES.length) return null;
    for (let j = 0; j < t.length; j++) if (PRIMES[i + j] !== t[j]) return null;
    return PRIMES[i + t.length];
  }

  function predictions(t) {
    const out = [];
    const push = (v) => { if (v !== null && v !== undefined && Number.isFinite(v)) out.push(v); };
    [1, 2, 3].forEach((k) => push(polyNext(t, k, 3)));
    push(ratioNext(t, 4));
    push(linNext(t));
    push(fibNext(t));
    interNext(t).forEach(push);
    periodicNext(t).forEach(push);
    altOpsNext(t).forEach(push);
    push(ratioArithNext(t));
    push(diffGeoNext(t));
    push(primeNext(t));
    return out;
  }

  // ---------- wrong answers: typical slips ----------
  function makeOptions(t, ans, level, rng) {
    const n = t.length;
    const last = t[n - 1];
    const prev = t[n - 2];
    const prev2 = t[n - 3];
    const nonNeg = level !== 'hard';
    const chosen = new Set([ans]);
    const valid = (v) => Number.isInteger(v) && !chosen.has(v) && Math.abs(v) <= 99999 && (!nonNeg || v >= 0);
    const take = (list, max) => {
      for (const v of list) {
        if (chosen.size >= max) break;
        if (valid(v)) chosen.add(v);
      }
    };
    const rev = Math.abs(ans) >= 10 ? parseInt(String(Math.abs(ans)).split('').reverse().join(''), 10) * Math.sign(ans || 1) : null;
    const slips = [
      last + (last - prev),           // repeat the last step
      last + (prev - prev2),          // repeat the step before
      prev !== 0 && last % prev === 0 ? last * (last / prev) : null, // repeat the last ratio
      2 * ans - last,                 // step applied twice
      rev,
    ].filter((v) => v !== null);
    take(shuffle(slips, rng).slice(0, 2), 3);
    take(shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + 3, ans - 3, ans + 10, ans - 10], rng), 5);
    for (let k = 4; chosen.size < 5 && k < 60; k++) take([ans + k, ans - k], 5);
    const wrong = Array.from(chosen).filter((v) => v !== ans);
    return shuffle([ans].concat(wrong), rng);
  }

  function makeQuestion(level, rng) {
    rng = rng || Math.random;
    const plan = PLAN[level];
    if (!plan) throw new Error('unknown level ' + level);
    for (let attempt = 0; attempt < 600; attempt++) {
      const name = weighted(plan.fams, rng);
      const g = FAM[name](rng, plan.L);
      if (!g) continue;
      const t = g.terms;
      if (!t.every((v) => Number.isInteger(v) && Math.abs(v) <= LIM)) continue;
      if (level !== 'hard' && t.some((v) => v < 0)) continue;
      if (new Set(t).size < 4) continue;
      const shown = t.slice(0, -1);
      const ans = t[t.length - 1];
      const preds = new Set(predictions(shown));
      if (preds.size !== 1 || !preds.has(ans)) continue;
      const options = makeOptions(shown, ans, level, rng);
      if (options.length !== 5) continue;
      return {
        kind: 'series', level, family: name, terms: shown, value: ans, options, answer: options.indexOf(ans),
        rule: g.rule, explain: g.rule + ' So the missing number is ' + ans + '.',
      };
    }
    throw new Error('could not build a series for ' + level);
  }

  // Independent check: exactly one answer fits the shown numbers, and it is the keyed one.
  function verifyQuestion(q) {
    const preds = new Set(predictions(q.terms));
    return (
      preds.size === 1 && preds.has(q.value) &&
      q.options.length === 5 && new Set(q.options).size === 5 &&
      q.options[q.answer] === q.value
    );
  }

  const api = { makeQuestion, verifyQuestion, predictions, PLAN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SeriesEngine = api;
})(typeof self !== 'undefined' ? self : this);
