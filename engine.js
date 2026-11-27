/* Cube Trainer engine: cubes, rotations, question generation, SVG rendering.
 *
 * A cube is an array of six faces: { id, sym, n, w }
 *   n = outward normal (unit axis vector), w = direction the symbol's "up" points to (unit axis vector, w ⟂ n).
 * Whole-cube turns are the 24 proper rotation matrices, applied to n and w.
 * A question is "possible" for a view if some rotation of the sample cube produces that exact view,
 * so every answer key is computed, never hand-written.
 */
(function (root) {
  'use strict';

  // ---------- small vector helpers ----------
  const eq = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  const neg = (a) => [0 - a[0], 0 - a[1], 0 - a[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const mul = (R, v) => [dot(R[0], v), dot(R[1], v), dot(R[2], v)];

  // The 24 rotations of the cube (signed permutation matrices with determinant +1).
  const ROTS = (() => {
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const parity = [1, -1, -1, 1, 1, -1];
    const out = [];
    perms.forEach((p, pi) => {
      for (let s = 0; s < 8; s++) {
        const sg = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1];
        if (parity[pi] * sg[0] * sg[1] * sg[2] !== 1) continue;
        const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < 3; i++) R[i][p[i]] = sg[i];
        out.push(R);
      }
    });
    return out;
  })();

  const NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const perpendiculars = (n) => NORMALS.filter((m) => dot(m, n) === 0);

  // ---------- symbols (drawn in a [-1,1] square, y pointing down) ----------
  // order = how many quarter-turn positions look different (1 = fully symmetric, 2 = 180° symmetric, 4 = none)
  const SYMBOLS = {
    ring:  { order: 1, svg: '<circle r=".34" class="s"/>' },
    dot:   { order: 1, svg: '<circle r=".3" class="f"/>' },
    grid:  { order: 1, svg: '<path d="M-1 0H1M0 -1V1" class="s"/>' },
    cross: { order: 1, svg: '<path d="M-1 -1L1 1M-1 1L1 -1" class="s"/>' },
    block: { order: 1, svg: '<rect x="-.3" y="-.3" width=".6" height=".6" class="f"/>' },
    bar:   { order: 2, svg: '<path d="M-1 0H1" class="s"/>' },
    diag:  { order: 2, svg: '<path d="M-1 -1L1 1" class="s"/>' },
    bars:  { order: 2, svg: '<path d="M-1 -.38H1M-1 .38H1" class="s"/>' },
    pair:  { order: 2, svg: '<circle cx="-.45" r=".2" class="s"/><circle cx=".45" r=".2" class="s"/>' },
    trio:  { order: 2, svg: '<circle cx="-.5" cy="-.5" r=".18" class="s"/><circle r=".18" class="s"/><circle cx=".5" cy=".5" r=".18" class="s"/>' },
    half:  { order: 4, svg: '<path d="M-1 -1L-1 1L1 1Z" class="f"/>' },
    arrow: { order: 4, svg: '<path d="M-.7 -.7L-.7 .7L.8 0Z" class="f"/>' },
    elbow: { order: 4, svg: '<path d="M-1 0H0V-1" class="s"/>' },
  };
  const SYM_NAMES = Object.keys(SYMBOLS);
  const SYMMETRIC = SYM_NAMES.filter((s) => SYMBOLS[s].order === 1);
  const ORIENTED = SYM_NAMES.filter((s) => SYMBOLS[s].order > 1);

  const LEVELS = {
    // oriented = how many of the six faces carry a symbol whose turn matters
    easy:   { oriented: 2, shared: [[3, 0.35], [2, 0.65]],            mut: { replace: 0.45, swap: 0.45 } },
    medium: { oriented: 3, shared: [[2, 0.6], [1, 0.4]],              mut: { replace: 0.25, swap: 0.35 } },
    hard:   { oriented: 4, shared: [[1, 0.7], [0, 0.3]],              mut: { replace: 0.1,  swap: 0.3 } },
  };

  // ---------- random helpers ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function weighted(pairs, rng) {
    let r = rng();
    for (const [v, w] of pairs) {
      if (r < w) return v;
      r -= w;
    }
    return pairs[pairs.length - 1][0];
  }

  // ---------- cube state ----------
  const VIEW = [
    { pos: 'top',   n: [0, 0, 1],  up: [0, 1, 0] },
    { pos: 'front', n: [0, -1, 0], up: [0, 0, 1] },
    { pos: 'right', n: [1, 0, 0],  up: [0, 0, 1] },
  ];

  const rotate = (state, R) => state.map((f) => ({ id: f.id, sym: f.sym, n: mul(R, f.n), w: mul(R, f.w) }));
  const faceAt = (state, n) => state.find((f) => eq(f.n, n));
  const clone = (state) => state.map((f) => ({ id: f.id, sym: f.sym, n: f.n.slice(), w: f.w.slice() }));

  // Quarter turns of the symbol relative to "screen up" on a given visible face.
  function quarterTurns(face, vp) {
    const U = vp.up;
    const Rt = cross(U, vp.n);
    if (eq(face.w, U)) return 0;
    if (eq(face.w, Rt)) return 1;
    if (eq(face.w, neg(U))) return 2;
    return 3;
  }

  // What the eye can tell apart: symbol + its turn, modulo the symbol's own symmetry.
  function signature(state) {
    return VIEW.map((vp) => {
      const f = faceAt(state, vp.n);
      return f.sym + ':' + (quarterTurns(f, vp) % SYMBOLS[f.sym].order);
    }).join('|');
  }
  const visibleIds = (state) => VIEW.map((vp) => faceAt(state, vp.n).id);

  // What a solver can know from the sample alone: the three faces seen are known, the three hidden faces
  // are unknown symbols (anything except the three seen). A view is only "possible" if some turn fits that.
  function faceSig(face, vp) {
    return face.sym + ':' + (quarterTurns(face, vp) % SYMBOLS[face.sym].order);
  }
  function possibleFromSample(S, V) {
    const known = new Set(visibleIds(S));
    const knownSyms = new Set(VIEW.map((vp) => faceAt(S, vp.n).sym));
    return ROTS.some((R) => VIEW.every((vp) => {
      const vf = faceAt(V, vp.n);
      const f = S.find((g) => eq(mul(R, g.n), vp.n));
      if (known.has(f.id)) return faceSig({ sym: f.sym, w: mul(R, f.w) }, vp) === faceSig(vf, vp);
      return !knownSyms.has(vf.sym);
    }));
  }

  function pickSymbols(level, rng) {
    const k = LEVELS[level].oriented;
    const o = shuffle(ORIENTED.slice(), rng).slice(0, k);
    const s = shuffle(SYMMETRIC.slice(), rng).slice(0, 6 - k);
    return shuffle(o.concat(s), rng);
  }

  function randomCube(syms, rng) {
    return NORMALS.map((n, i) => ({ id: i, sym: syms[i], n: n.slice(), w: pick(perpendiculars(n), rng).slice() }));
  }

  // Build a wrong view out of the right one: swap, replace or twist a symbol.
  function mutate(A, level, rng) {
    const B = clone(A);
    const vis = VIEW.map((vp) => faceAt(B, vp.n));
    const hid = B.filter((f) => !vis.includes(f));
    const m = LEVELS[level].mut;
    const r = rng();
    const kind = r < m.replace ? 'replace' : r < m.replace + m.swap ? 'swap' : 'twist';
    if (kind === 'replace') {
      pick(vis, rng).sym = pick(hid, rng).sym;
    } else if (kind === 'swap') {
      const idx = shuffle([0, 1, 2], rng);
      const a = vis[idx[0]];
      const b = vis[idx[1]];
      const t = a.sym;
      a.sym = b.sym;
      b.sym = t;
    } else {
      const cand = vis.filter((f) => SYMBOLS[f.sym].order > 1);
      if (!cand.length) return null;
      const f = pick(cand, rng);
      const c = cross(f.n, f.w);
      f.w = rng() < 0.5 ? c : neg(c);
    }
    return B;
  }

  function makeQuestion(level, rng) {
    rng = rng || Math.random;
    if (!LEVELS[level]) throw new Error('unknown level ' + level);
    for (let attempt = 0; attempt < 400; attempt++) {
      const S = randomCube(pickSymbols(level, rng), rng);
      const sampleSig = signature(S);
      const rotated = ROTS.map((R) => rotate(S, R));
      const sampleIds = visibleIds(S);

      const wantShared = weighted(LEVELS[level].shared, rng);
      const cands = rotated.filter((A) => {
        if (signature(A) === sampleSig) return false;
        return visibleIds(A).filter((id) => sampleIds.includes(id)).length === wantShared;
      });
      if (!cands.length) continue;
      const A = pick(cands, rng);

      const taken = new Set([signature(A)]);
      const wrong = [];
      for (let t = 0; t < 300 && wrong.length < 3; t++) {
        const B = mutate(A, level, rng);
        if (!B) continue;
        const sg = signature(B);
        // a wrong option must contradict the sample itself, not just the hidden faces
        if (possibleFromSample(S, B) || taken.has(sg)) continue;
        taken.add(sg);
        wrong.push(B);
      }
      if (wrong.length < 3) continue;

      const options = shuffle([{ state: A, correct: true }].concat(wrong.map((b) => ({ state: b, correct: false }))), rng);
      return { level, sample: S, options, answer: options.findIndex((o) => o.correct), shared: wantShared };
    }
    throw new Error('could not build a question for ' + level);
  }

  // Independent check used by the tests: exactly one option is a real turn of the sample.
  function verifyQuestion(q) {
    const possible = new Set(ROTS.map((R) => signature(rotate(q.sample, R))));
    const sigs = q.options.map((o) => signature(o.state));
    const syms = (st) => VIEW.map((vp) => faceAt(st, vp.n).sym);
    const fromSample = q.options.map((o) => possibleFromSample(q.sample, o.state));
    return (
      q.options.length === 4 &&
      new Set(sigs).size === 4 &&
      // sample alone decides: exactly one option fits, it is the keyed one and a true turn of the cube
      fromSample.filter(Boolean).length === 1 &&
      fromSample[q.answer] &&
      possible.has(sigs[q.answer]) &&
      [q.sample].concat(q.options.map((o) => o.state)).every((st) => new Set(syms(st)).size === 3)
    );
  }

  // ---------- rendering (oblique view like the book: front square, top and right skewed) ----------
  const S = 100;
  const DX = 44;
  const DY = -38;
  const projLin = (v) => [v[0] * S + v[1] * DX, -v[2] * S + v[1] * DY];
  const proj = projLin;
  const f2 = (x) => (Math.round(x * 100) / 100).toString();

  function renderCube(state, opts) {
    opts = opts || {};
    const fills = { top: 'var(--f-top, #fff)', front: 'var(--f-front, #f6f5f0)', right: 'var(--f-right, #e4e2da)' };
    let out = '<svg class="cube" viewBox="-78 -74 156 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.label || 'cube') + '">';
    VIEW.forEach((vp) => {
      const f = faceAt(state, vp.n);
      const n = vp.n;
      const w = f.w;
      const r = cross(w, n);
      const c = [n[0] * 0.5, n[1] * 0.5, n[2] * 0.5];
      // face polygon from the screen-aligned frame of the position (independent of symbol turn)
      const R0 = cross(vp.up, n);
      const corner = (sa, sb) => proj([
        c[0] + 0.5 * (sa * R0[0] + sb * vp.up[0]),
        c[1] + 0.5 * (sa * R0[1] + sb * vp.up[1]),
        c[2] + 0.5 * (sa * R0[2] + sb * vp.up[2]),
      ]);
      const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map((p) => f2(p[0]) + ',' + f2(p[1])).join(' ');
      out += '<polygon class="face" points="' + pts + '" fill="' + fills[vp.pos] + '"/>';
      // symbol: local (a,b) -> c + 0.5*a*r + 0.5*b*(-w)
      const A = projLin([0.5 * r[0], 0.5 * r[1], 0.5 * r[2]]);
      const B = projLin([-0.5 * w[0], -0.5 * w[1], -0.5 * w[2]]);
      const T = proj(c);
      out += '<g transform="matrix(' + [A[0], A[1], B[0], B[1], T[0], T[1]].map(f2).join(' ') + ')">' + SYMBOLS[f.sym].svg + '</g>';
    });
    return out + '</svg>';
  }

  const api = {
    ROTS, SYMBOLS, LEVELS, VIEW, NORMALS, makeQuestion, verifyQuestion, renderCube, signature, rotate, randomCube, mulberry32,
    // building blocks for other modules (e.g. net folding)
    faceAt, quarterTurns, possibleFromSample, mutate, clone, eq, neg, cross, mul,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CubeEngine = api;
})(typeof self !== 'undefined' ? self : this);
