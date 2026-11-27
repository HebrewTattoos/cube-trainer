/* Figural reasoning modules: matrices, figure series, odd one out, net folding, mirror & rotation, hidden figures.
 *
 * Every question is built from a known rule, then a built-in solver re-derives the answer from what is shown and
 * the question is only used when exactly one answer survives (see the verify notes at each module).
 * All drawings are inline SVG that uses only the CSS variables --ink, --paper, --soft and --accent.
 * Each question carries a `meta` object with the raw data so tests can re-solve it independently.
 */
(function (root) {
  'use strict';
  const T = root.Trainer || require('./core.js');
  const CE = root.CubeEngine || require('./engine.js');
  const { ri, pick, shuffle, sample } = T.util;

  // ====================================================================================================
  // drawing helpers
  // ====================================================================================================
  const f2 = (x) => String(Math.round(x * 100) / 100 + 0);
  const INK = 'var(--ink)', PAPER = 'var(--paper)', SOFT = 'var(--soft)', ACC = 'var(--accent)';
  const svg = (vb, body, label, style) =>
    '<svg class="fig" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label + '"' +
    (style ? ' style="' + style + '"' : '') + '>' + body + '</svg>';
  const polyPts = (cx, cy, r, n, rot) => Array.from({ length: n }, (_, i) => {
    const a = (rot || 0) + (i * 2 * Math.PI) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const ptsAttr = (pts) => pts.map((p) => f2(p[0]) + ',' + f2(p[1])).join(' ');
  const rangeArr = (n) => Array.from({ length: n }, (_, i) => i);

  // Parallel hatch lines clipped to a convex polygon (no ids / patterns, so it survives any export).
  function hatchPath(pts, sp, ang) {
    const a = (ang * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
    let lo = Infinity, hi = -Infinity;
    for (const p of pts) {
      const t = p[0] * nx + p[1] * ny;
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
    let d = '';
    for (let k = Math.ceil(lo / sp + 1e-6); k * sp < hi - 1e-6; k++) {
      const t = k * sp;
      let mn = Infinity, mx = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        const a1 = p[0] * nx + p[1] * ny - t, a2 = q[0] * nx + q[1] * ny - t;
        if (a1 * a2 > 0 || (a1 === 0 && a2 === 0)) continue;
        const s = a1 / (a1 - a2);
        const al = (p[0] + s * (q[0] - p[0])) * ux + (p[1] + s * (q[1] - p[1])) * uy;
        if (al < mn) mn = al;
        if (al > mx) mx = al;
      }
      if (mx - mn > 0.5) d += 'M' + f2(t * nx + mn * ux) + ' ' + f2(t * ny + mn * uy) + 'L' + f2(t * nx + mx * ux) + ' ' + f2(t * ny + mx * uy);
    }
    return d;
  }
  // fill: 0 empty, 1 hatched, 2 solid
  function fillBody(shapeTag, pts, fill, sw, hsp) {
    if (fill === 2) return shapeTag(INK, INK, sw);
    let s = shapeTag(PAPER, INK, sw);
    if (fill === 1) {
      const d = hatchPath(pts, hsp, 45);
      if (d) s += '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + f2(sw * 0.55) + '" stroke-linecap="round"/>';
    }
    return s;
  }
  function polyShape(pts, fill, sw, hsp) {
    return fillBody((fc, sc, w) => '<polygon points="' + ptsAttr(pts) + '" fill="' + fc + '" stroke="' + sc + '" stroke-width="' + f2(w) + '" stroke-linejoin="round"/>', pts, fill, sw, hsp);
  }
  function circleShape(cx, cy, r, fill, sw, hsp) {
    return fillBody((fc, sc, w) => '<circle cx="' + f2(cx) + '" cy="' + f2(cy) + '" r="' + f2(r) + '" fill="' + fc + '" stroke="' + sc + '" stroke-width="' + f2(w) + '"/>', polyPts(cx, cy, r, 24, 0), fill, sw, hsp);
  }
  const frameRect = (x, y, w, h, extra) => '<rect x="' + f2(x) + '" y="' + f2(y) + '" width="' + f2(w) + '" height="' + f2(h) + '" rx="5" fill="' + PAPER + '" stroke="' + SOFT + '" stroke-width="1.6"' + (extra || '') + '/>';
  const qMark = (x, y, size) => '<text x="' + f2(x) + '" y="' + f2(y + size * 0.35) + '" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="' + size + '" fill="' + ACC + '">?</text>';

  // ====================================================================================================
  // 1. MATRICES
  // ====================================================================================================
  const M_ATTR = ['shape', 'fill', 'size', 'count', 'rot'];
  const M_DOM = [3, 3, 3, 3, 4];
  const M_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon'];
  const M_R = [20, 29, 38];
  const M_CF = [1, 0.6, 0.4];
  const M_CX = [[0], [-25, 25], [-33, 0, 33]];
  const SHAPE_K = { circle: 1, square: 1.25, triangle: 1.15, diamond: 1.1, pentagon: 1.05, hexagon: 1.05 };
  const M_LABEL = { shape: 'Shape', fill: 'Shading', size: 'Size', count: 'Number', rot: 'Line angle' };
  const M_RULES_ALL = ['rowconst', 'colconst', 'latin', 'progrow', 'progcol'];
  const M_LEV = {
    easy:   { attrs: ['shape', 'fill', 'size', 'count'], k: 2, rules: ['rowconst', 'colconst', 'progrow', 'progcol'], distinct: true, sameStart: true, maxChange: 1 },
    medium: { attrs: ['shape', 'fill', 'size', 'count'], k: 3, rules: M_RULES_ALL, distinct: false, sameStart: true, maxChange: 2 },
    hard:   { attrs: M_ATTR, k: 4, rules: M_RULES_ALL, distinct: false, sameStart: false, maxChange: 2 },
  };

  function shapeAt(kind, cx, cy, r, fill, sw) {
    const hsp = Math.max(3.4, r * 0.28);
    if (kind === 'circle') return circleShape(cx, cy, r, fill, sw, hsp);
    const R = r * SHAPE_K[kind];
    let pts;
    if (kind === 'square') pts = polyPts(cx, cy, R, 4, Math.PI / 4);
    else if (kind === 'diamond') pts = polyPts(cx, cy, R, 4, 0);
    else if (kind === 'triangle') pts = polyPts(cx, cy + R * 0.25, R, 3, 0);
    else if (kind === 'pentagon') pts = polyPts(cx, cy + R * 0.1, R, 5, 0);
    else pts = polyPts(cx, cy, R, 6, 0);
    return polyShape(pts, fill, sw, hsp);
  }
  // v = [shape, fill, size, count, rot]; cfg = { shapes:[3 names], needle:bool }
  function renderMCell(v, cfg) {
    const kind = cfg.shapes[v[0]], fill = v[1], cnt = v[3];
    const r = M_R[v[2]] * M_CF[cnt];
    let s = '';
    for (const x of M_CX[cnt]) {
      s += shapeAt(kind, x, 0, r, fill, cnt === 0 ? 2.5 : 2.2);
      if (cfg.needle) {
        const a = (v[4] * Math.PI) / 4, L = r * 0.72;
        s += '<path d="M' + f2(x - L * Math.cos(a)) + ' ' + f2(0 - L * Math.sin(a)) + 'L' + f2(x + L * Math.cos(a)) + ' ' + f2(L * Math.sin(a)) + '" fill="none" stroke="' + (fill === 2 ? PAPER : INK) + '" stroke-width="2.2" stroke-linecap="round"/>';
      }
    }
    return s;
  }

  // Attribute-wise solver: every rule hypothesis that fits the 8 visible values of one attribute predicts a value
  // for the missing cell (g[2][2]). Returns the set of predicted values (those inside the attribute's range).
  function predictAttr(g, m) {
    const out = new Set();
    const inD = (v) => v >= 0 && v < m;
    const mod = (v) => ((v % m) + m) % m;
    const uni = (a) => a.every((x) => x === a[0]);
    const perm3 = (a) => new Set(a).size === 3;
    const same3 = (a, b) => a.every((x) => b.includes(x));
    // constant everywhere
    if (uni([g[0][0], g[0][1], g[0][2], g[1][0], g[1][1], g[1][2], g[2][0], g[2][1]])) out.add(g[0][0]);
    // constant along rows / down columns
    if (uni(g[0]) && uni(g[1]) && g[2][0] === g[2][1]) out.add(g[2][0]);
    if (g[0][0] === g[1][0] && g[0][0] === g[2][0] && g[0][1] === g[1][1] && g[0][1] === g[2][1] && g[0][2] === g[1][2]) out.add(g[0][2]);
    // every row / column holds the same three different values
    if (perm3(g[0]) && perm3(g[1]) && same3(g[1], g[0]) && g[2][0] !== g[2][1] && g[0].includes(g[2][0]) && g[0].includes(g[2][1])) {
      out.add(g[0].find((x) => x !== g[2][0] && x !== g[2][1]));
    }
    const c0 = [g[0][0], g[1][0], g[2][0]], c1 = [g[0][1], g[1][1], g[2][1]], c2 = [g[0][2], g[1][2]];
    if (perm3(c0) && perm3(c1) && same3(c1, c0) && c2[0] !== c2[1] && c0.includes(c2[0]) && c0.includes(c2[1])) {
      out.add(c0.find((x) => x !== c2[0] && x !== c2[1]));
    }
    // arithmetic progression along rows / down columns (linear and cyclic)
    const rowAP = (r) => g[r][1] - g[r][0] === g[r][2] - g[r][1];
    const rowAPm = (r) => mod(g[r][1] - g[r][0] - (g[r][2] - g[r][1])) === 0;
    if (rowAP(0) && rowAP(1) && inD(2 * g[2][1] - g[2][0])) out.add(2 * g[2][1] - g[2][0]);
    if (rowAPm(0) && rowAPm(1)) out.add(mod(2 * g[2][1] - g[2][0]));
    if (g[1][0] - g[0][0] === g[2][0] - g[1][0] && g[1][1] - g[0][1] === g[2][1] - g[1][1] && inD(2 * g[1][2] - g[0][2])) out.add(2 * g[1][2] - g[0][2]);
    if (mod(g[1][0] - g[0][0] - (g[2][0] - g[1][0])) === 0 && mod(g[1][1] - g[0][1] - (g[2][1] - g[1][1])) === 0) out.add(mod(2 * g[1][2] - g[0][2]));
    // third = first + second (counting values from 1)
    if (g[0][2] === g[0][0] + g[0][1] + 1 && g[1][2] === g[1][0] + g[1][1] + 1 && inD(g[2][0] + g[2][1] + 1)) out.add(g[2][0] + g[2][1] + 1);
    if (g[2][0] === g[0][0] + g[1][0] + 1 && g[2][1] === g[0][1] + g[1][1] + 1 && inD(g[0][2] + g[1][2] + 1)) out.add(g[0][2] + g[1][2] + 1);
    return out;
  }

  function genGrid(rule, m, sameStart, rng) {
    const g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const range = rangeArr(m);
    if (rule === 'rowconst' || rule === 'colconst') {
      const a = sample(range, 3, rng);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r][c] = a[rule === 'rowconst' ? r : c];
    } else if (rule === 'latin') {
      const p = sample(range, 3, rng), s = pick([1, 2], rng);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r][c] = p[(c + s * r) % 3];
    } else {
      const d = rng() < 0.5 ? 1 : -1;
      const allowed = range.filter((st) => st + 2 * d >= 0 && st + 2 * d < m);
      const first = pick(allowed, rng);
      const st = [0, 1, 2].map(() => (sameStart ? first : pick(allowed, rng)));
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r][c] = rule === 'progrow' ? st[r] + c * d : st[c] + r * d;
    }
    return g;
  }

  function valueName(a, v, cfg) {
    if (a === 'shape') return cfg.shapes[v];
    if (a === 'fill') return ['empty', 'hatched', 'solid'][v];
    if (a === 'size') return ['small', 'medium', 'large'][v];
    if (a === 'count') return String(v + 1);
    return ['0°', '45°', '90°', '135°'][v];
  }
  function ruleText(a, rule, g, cfg) {
    const L = M_LABEL[a];
    const names = (arr) => arr.map((v) => valueName(a, v, cfg)).join(' → ');
    if (rule === 'rowconst') return L.toLowerCase() + ' stays the same along each row';
    if (rule === 'colconst') return L.toLowerCase() + ' stays the same down each column';
    if (rule === 'latin') return L.toLowerCase() + ' uses its three values once in every row and column';
    if (rule === 'progrow') return L.toLowerCase() + ' moves one step per column (first row: ' + names(g[0]) + ')';
    return L.toLowerCase() + ' moves one step per row (first column: ' + names([g[0][0], g[1][0], g[2][0]]) + ')';
  }

  function makeMatrix(level, rng) {
    const L = M_LEV[level];
    for (let attempt = 0; attempt < 400; attempt++) {
      const active = sample(L.attrs, L.k, rng).sort((a, b) => M_ATTR.indexOf(a) - M_ATTR.indexOf(b));
      let rules;
      if (L.distinct) rules = sample(L.rules, L.k, rng);
      else {
        rules = active.map(() => pick(L.rules, rng));
        if (new Set(rules).size < 2) continue;
      }
      const cfg = { shapes: sample(M_SHAPES, 3, rng), needle: active.includes('rot') };
      const grids = M_ATTR.map((a, ai) => {
        const k = active.indexOf(a);
        if (k >= 0) return genGrid(rules[k], M_DOM[ai], L.sameStart, rng);
        const v = a === 'count' || a === 'rot' ? 0 : ri(0, 2, rng);
        return [[v, v, v], [v, v, v], [v, v, v]];
      });
      // solver: every attribute must have exactly one predicted value and it is the intended one
      let ok = true;
      for (let ai = 0; ai < 5 && ok; ai++) {
        const preds = predictAttr(grids[ai], M_DOM[ai]);
        ok = preds.size === 1 && preds.has(grids[ai][2][2]);
      }
      if (!ok) continue;
      const cell = (r, c) => M_ATTR.map((_, ai) => grids[ai][r][c]);
      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (r * 3 + c < 8) cells.push(cell(r, c));
      const ans = cell(2, 2);
      // distractors: change 1 (or 2) active attributes to a value that is not the (unique) predicted one
      const seen = M_ATTR.map((_, ai) => Array.from(new Set(cells.map((v) => v[ai]))));
      const taken = new Set([ans.join()]);
      const wrong = [];
      for (let t = 0; t < 300 && wrong.length < 4; t++) {
        const nCh = L.maxChange === 1 || t < 50 ? 1 : rng() < 0.55 ? 1 : 2;
        const v = ans.slice();
        sample(active, nCh, rng).forEach((a) => {
          const ai = M_ATTR.indexOf(a);
          const pool = (rng() < 0.7 ? seen[ai] : rangeArr(M_DOM[ai])).filter((x) => x !== ans[ai]);
          v[ai] = pick(pool.length ? pool : rangeArr(M_DOM[ai]).filter((x) => x !== ans[ai]), rng);
        });
        const key = v.join();
        if (taken.has(key)) continue;
        taken.add(key);
        wrong.push(v);
      }
      if (wrong.length < 4) continue;
      const opts = shuffle([{ v: ans, ok: true }].concat(wrong.map((v) => ({ v, ok: false }))), rng);
      const options = opts.map((o) => o.v);
      // drawing
      let body = '';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = 4 + c * 106, y = 4 + r * 106;
          if (r === 2 && c === 2) {
            body += '<rect x="' + x + '" y="' + y + '" width="100" height="100" rx="5" fill="' + PAPER + '" stroke="' + ACC + '" stroke-width="2" stroke-dasharray="6 5"/>' + qMark(x + 50, y + 50, 46);
          } else {
            body += frameRect(x, y, 100, 100) + '<g transform="translate(' + (x + 50) + ' ' + (y + 50) + ')">' + renderMCell(cell(r, c), cfg) + '</g>';
          }
        }
      }
      const stimulus = svg('0 0 320 320', body, 'matrix of figures with the bottom right cell missing', 'max-width:340px;margin:0 auto');
      const mk = (v) => svg('-54 -54 108 108', '<rect x="-50" y="-50" width="100" height="100" rx="5" fill="' + PAPER + '" stroke="' + SOFT + '" stroke-width="1.6"/>' + renderMCell(v, cfg), 'option');
      const names = active.map((a) => M_LABEL[a].toLowerCase() + ' ' + valueName(a, ans[M_ATTR.indexOf(a)], cfg));
      const explain = 'Rules: ' + active.map((a, k) => ruleText(a, rules[k], grids[M_ATTR.indexOf(a)], cfg)).join('; ') + '. So the missing figure has ' + names.join(', ') + '.';
      return {
        prompt: 'Which figure completes the matrix?',
        stimulus, stimulusClass: 'paper', optionStyle: 'figure',
        options: options.map((v) => ({ html: mk(v) })),
        answer: opts.findIndex((o) => o.ok),
        explain,
        meta: { cfg, active, rules, cells, options, answerVec: ans, dom: M_DOM },
      };
    }
    throw new Error('could not build a matrix for ' + level);
  }

  // ====================================================================================================
  // 2. FIGURE SERIES
  // ====================================================================================================
  const FS = {
    arrow: { m: 8, steps: [1, 2, 3, -1, -2, -3], lin: false, styles: 3 },
    dot:   { m: 8, steps: [1, 2, 3, -1, -2, -3], lin: false, styles: 2 },
    bars:  { m: 5, steps: [1, 2, -1, -2], lin: true, styles: 2 },
    fill:  { m: 3, steps: [1, -1], lin: false, styles: 3 },
    grow:  { m: 5, steps: [1, 2, -1, -2], lin: true, styles: 3 },
  };
  const FS_LAY = [null, [[0, 0, 40]], [[-25, 0, 21], [25, 0, 21]], [[-25, -24, 21], [25, -24, 21], [0, 24, 21]]];
  const FS_SLOT = [null, [''], ['left box', 'right box'], ['top left box', 'top right box', 'bottom box']];
  const FS_LEV = {
    easy:   { n: 1, kinds: ['arrow', 'dot', 'bars', 'grow'], linSteps: [1, -1] },
    medium: { n: 2, kinds: ['arrow', 'dot', 'bars', 'fill', 'grow'], linSteps: [1, 2, -1, -2] },
    hard:   { n: 3, kinds: ['arrow', 'dot', 'bars', 'fill', 'grow'], linSteps: [1, 2, -1, -2] },
  };
  const DOTP = [[-0.8, -0.8], [0, -0.8], [0.8, -0.8], [0.8, 0], [0.8, 0.8], [0, 0.8], [-0.8, 0.8], [-0.8, 0]];

  // unit-box drawing of one track value (box is [-1,1]^2, w = stroke width in unit coordinates)
  function drawTrack(kind, v, style, w) {
    const sw = f2(w);
    if (kind === 'arrow') {
      const rot = 'rotate(' + v * 45 + ')';
      if (style === 0) return '<polygon points="0,-0.85 0.55,0.6 0,0.2 -0.55,0.6" fill="' + INK + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" transform="' + rot + '"/>';
      if (style === 1) return '<polygon points="0,-0.85 0.62,0.55 -0.62,0.55" fill="' + INK + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" transform="' + rot + '"/>';
      return '<path d="M0 0.75V-0.8M-0.42 -0.38L0 -0.8L0.42 -0.38" fill="none" stroke="' + INK + '" stroke-width="' + f2(w * 1.2) + '" stroke-linecap="round" stroke-linejoin="round" transform="' + rot + '"/>';
    }
    if (kind === 'dot') {
      const p = DOTP[v];
      return '<rect x="-0.8" y="-0.8" width="1.6" height="1.6" fill="none" stroke="' + INK + '" stroke-width="' + f2(w * 0.55) + '"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="0.22" fill="' + (style ? ACC : INK) + '" stroke="' + INK + '" stroke-width="' + f2(w * 0.55) + '"/>';
    }
    if (kind === 'bars') {
      let s = '';
      for (let k = 0; k <= v; k++) {
        const t = -0.76 + 0.38 * k;
        s += '<path d="' + (style === 0 ? 'M' + f2(t) + ' -0.6V0.6' : 'M-0.6 ' + f2(t) + 'H0.6') + '" fill="none" stroke="' + INK + '" stroke-width="' + f2(w * 1.1) + '" stroke-linecap="round"/>';
      }
      return s;
    }
    if (kind === 'fill') {
      if (style === 0) return circleShape(0, 0, 0.68, v, w, 0.24);
      if (style === 1) return polyShape(polyPts(0, 0, 0.9, 4, Math.PI / 4), v, w, 0.24);
      return polyShape(polyPts(0, 0.2, 0.9, 3, 0), v, w, 0.24);
    }
    // grow
    const h = 0.22 + 0.16 * v;
    const o = 'fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"';
    if (style === 0) return '<rect x="' + f2(-h) + '" y="' + f2(-h) + '" width="' + f2(2 * h) + '" height="' + f2(2 * h) + '" ' + o + '/>';
    if (style === 1) return '<circle r="' + f2(h * 1.1) + '" ' + o + '/>';
    return '<polygon points="' + ptsAttr(polyPts(0, 0, h * 1.3, 4, 0)) + '" ' + o + '/>';
  }
  // trk: [{kind, style}] one per track; vals: one value per track
  function renderFig(vals, trk) {
    const n = trk.length, lay = FS_LAY[n];
    let s = '';
    trk.forEach((t, i) => {
      const c = lay[i];
      if (n > 1) s += '<rect x="' + (c[0] - c[2] - 2) + '" y="' + (c[1] - c[2] - 2) + '" width="' + (2 * c[2] + 4) + '" height="' + (2 * c[2] + 4) + '" rx="3" fill="none" stroke="' + SOFT + '" stroke-width="1.5"/>';
      s += '<g transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')">' + drawTrack(t.kind, vals[i], t.style, 2.5 / c[2]) + '</g>';
    });
    return s;
  }

  // Solver for one track: all natural hypotheses on the 5 shown values predict the 6th; returns the set of predictions.
  function seriesPredict(vals, m, lin) {
    const out = new Set();
    const mod = (x) => ((x % m) + m) % m;
    const n = vals.length;
    const d = [];
    for (let i = 1; i < n; i++) d.push(vals[i] - vals[i - 1]);
    const dm = d.map(mod);
    const last = vals[n - 1];
    // steady step, wrapping around the range
    if (dm.every((x) => x === dm[0])) out.add(mod(last + dm[0]));
    // steady step without wrapping (linear)
    if (lin && d.every((x) => x === d[0]) && last + d[0] >= 0 && last + d[0] < m) out.add(last + d[0]);
    // steps that alternate / repeat every 3 / change by a constant amount
    if (n >= 5 && dm[0] === dm[2] && dm[1] === dm[3]) out.add(mod(last + dm[0]));
    if (n >= 5 && dm[0] === dm[3]) out.add(mod(last + dm[1]));
    if (n >= 5 && mod(dm[1] - dm[0]) === mod(dm[2] - dm[1]) && mod(dm[2] - dm[1]) === mod(dm[3] - dm[2])) out.add(mod(last + dm[3] + (dm[1] - dm[0])));
    // the values repeat with a short period
    for (let p = 1; p <= 3; p++) {
      let ok = true;
      for (let i = p; i < n; i++) if (vals[i] !== vals[i - p]) ok = false;
      if (ok) out.add(vals[n - p]);
    }
    if (lin) {
      // bounce at the ends / stop at the ends
      const stepB = d[0];
      if (stepB !== 0) {
        let pos = vals[0], dir = stepB, ok = true;
        const seq = [pos];
        for (let i = 1; i <= n; i++) {
          let nx = pos + dir;
          if (nx < 0 || nx >= m) { dir = -dir; nx = pos + dir; }
          pos = nx;
          seq.push(pos);
        }
        for (let i = 0; i < n; i++) if (seq[i] !== vals[i]) ok = false;
        if (ok) out.add(seq[n]);
        const seq2 = [vals[0]];
        for (let i = 1; i <= n; i++) seq2.push(Math.max(0, Math.min(m - 1, seq2[i - 1] + stepB)));
        let ok2 = true;
        for (let i = 0; i < n; i++) if (seq2[i] !== vals[i]) ok2 = false;
        if (ok2) out.add(seq2[n]);
      }
    }
    return out;
  }

  function describeTrack(kind, step) {
    const a = Math.abs(step), cw = step > 0;
    if (kind === 'arrow') return 'the arrow turns ' + a * 45 + '° ' + (cw ? 'clockwise' : 'counter-clockwise') + ' each figure';
    if (kind === 'dot') return 'the dot jumps ' + a + ' place' + (a > 1 ? 's' : '') + ' ' + (cw ? 'clockwise' : 'counter-clockwise') + ' around the square';
    if (kind === 'bars') return 'the number of bars ' + (cw ? 'rises' : 'falls') + ' by ' + a + ' each figure (counting 1 to 5 and around again)';
    if (kind === 'fill') return 'the shading cycles ' + (cw ? 'empty, hatched, solid' : 'solid, hatched, empty') + ' and repeats';
    return 'the shape ' + (cw ? 'grows' : 'shrinks') + ' by ' + a + ' size step' + (a > 1 ? 's' : '') + ' each figure (the five sizes run around in a cycle)';
  }

  function makeFigSeries(level, rng) {
    const L = FS_LEV[level];
    for (let attempt = 0; attempt < 400; attempt++) {
      const kinds = sample(L.kinds, L.n, rng);
      const trk = kinds.map((kind) => {
        const def = FS[kind];
        return {
          kind, style: ri(0, def.styles - 1, rng), m: def.m,
          step: pick(def.lin ? L.linSteps : def.steps, rng), v0: ri(0, def.m - 1, rng),
        };
      });
      if (L.n > 1 && new Set(trk.map((t) => t.step)).size < 2) continue;
      const seqs = trk.map((t) => rangeArr(6).map((i) => (((t.v0 + i * t.step) % t.m) + t.m) % t.m));
      let ok = true;
      trk.forEach((t, k) => {
        const preds = seriesPredict(seqs[k].slice(0, 5), t.m, FS[t.kind].lin);
        if (!(preds.size === 1 && preds.has(seqs[k][5]))) ok = false;
      });
      if (!ok) continue;
      const figs = rangeArr(6).map((i) => seqs.map((s) => s[i]));
      const ans = figs[5];
      // distractors: exactly one track gets a wrong value
      const taken = new Set([ans.join()]);
      const wrong = [];
      for (let t = 0; t < 300 && wrong.length < 4; t++) {
        const k = ri(0, L.n - 1, rng), tk = trk[k];
        const slips = [figs[4][k], (ans[k] + tk.step + tk.m) % tk.m, (ans[k] + 1) % tk.m, (ans[k] + tk.m - 1) % tk.m, (figs[3][k])];
        const pool = (rng() < 0.6 ? slips : rangeArr(tk.m)).filter((x) => x !== ans[k]);
        if (!pool.length) continue;
        const v = ans.slice();
        v[k] = pick(pool, rng);
        const key = v.join();
        if (taken.has(key)) continue;
        taken.add(key);
        wrong.push(v);
      }
      if (wrong.length < 4) continue;
      const opts = shuffle([{ v: ans, ok: true }].concat(wrong.map((v) => ({ v, ok: false }))), rng);
      const tinfo = trk.map((t) => ({ kind: t.kind, style: t.style }));
      let body = '';
      for (let i = 0; i < 6; i++) {
        const x = 54 + (i % 3) * 112, y = 54 + Math.floor(i / 3) * 112;
        if (i === 5) {
          body += '<rect x="' + (x - 50) + '" y="' + (y - 50) + '" width="100" height="100" rx="5" fill="' + PAPER + '" stroke="' + ACC + '" stroke-width="2" stroke-dasharray="6 5"/>' + qMark(x, y, 44);
        } else {
          body += frameRect(x - 50, y - 50, 100, 100) + '<g transform="translate(' + x + ' ' + y + ')">' + renderFig(figs[i], tinfo) + '</g>' +
            '<text x="' + (x - 44) + '" y="' + (y + 45) + '" font-family="sans-serif" font-size="12" fill="' + INK + '" opacity="0.55">' + (i + 1) + '</text>';
        }
      }
      const stimulus = svg('0 0 332 220', body, 'series of five figures, the sixth is missing', 'max-width:360px;margin:0 auto');
      const mk = (v) => svg('-54 -54 108 108', '<rect x="-50" y="-50" width="100" height="100" rx="5" fill="' + PAPER + '" stroke="' + SOFT + '" stroke-width="1.6"/>' + renderFig(v, tinfo), 'option');
      const parts = trk.map((t, k) => (L.n > 1 ? FS_SLOT[L.n][k][0].toUpperCase() + FS_SLOT[L.n][k].slice(1) + ': ' : '') + (L.n > 1 ? describeTrack(t.kind, t.step) : describeTrack(t.kind, t.step).replace(/^./, (c) => c.toUpperCase())));
      return {
        prompt: 'Which figure comes next in the series?',
        stimulus, stimulusClass: 'paper', optionStyle: 'figure',
        options: opts.map((o) => ({ html: mk(o.v) })),
        answer: opts.findIndex((o) => o.ok),
        explain: parts.join('; ') + '. Applying this once more gives the missing sixth figure.',
        meta: { tracks: trk.map((t) => ({ kind: t.kind, style: t.style, m: t.m, lin: FS[t.kind].lin, shown: seqs[trk.indexOf(t)].slice(0, 5) })), options: opts.map((o) => o.v), answerVec: ans, tinfo },
      };
    }
    throw new Error('could not build a figure series for ' + level);
  }

  // ====================================================================================================
  // 3. ODD ONE OUT (figures)
  // ====================================================================================================
  const ODD_COMP_TXT = {
    c1: 'the number of sides matches the shading (triangle empty, square hatched, pentagon solid)',
    c2: 'an even number of sides goes with solid shading and an odd number with a non-solid one',
    c3: 'large figures have two or three dots and small figures have none or one',
    h1: 'the dot is inside exactly when the shape is solid',
    h2: 'the dot is inside exactly when the shape has an even number of sides',
    h3: 'the dot is inside exactly when the shape is large',
  };
  // rule table: f(fig) gives the class value of a figure; `bool` rules give true/false
  const ODD_RULES = {
    sides: { f: (g) => g.sides }, shade: { f: (g) => g.shade }, size: { f: (g) => g.size },
    count: { f: (g) => g.count }, dir: { f: (g) => g.dir },
    c1: { f: (g) => g.sides - 3 === g.shade, bool: true },
    c2: { f: (g) => (g.sides % 2 === 0) === (g.shade === 2), bool: true },
    c3: { f: (g) => (g.count >= 2) === (g.size === 1), bool: true },
    dotin: { f: (g) => g.dotIn, bool: true },
    h1: { f: (g) => g.dotIn === (g.shade === 2), bool: true },
    h2: { f: (g) => g.dotIn === (g.sides % 2 === 0), bool: true },
    h3: { f: (g) => g.dotIn === (g.size === 1), bool: true },
  };
  const ODD_LEV = {
    easy:   { hard: false, universe: ['sides', 'shade', 'size', 'count', 'dir', 'c1', 'c2', 'c3'], pool: ['sides', 'shade', 'size', 'count', 'dir'] },
    medium: { hard: false, universe: ['sides', 'shade', 'size', 'count', 'dir', 'c1', 'c2', 'c3'], pool: ['c1', 'c2', 'c3'] },
    hard:   { hard: true,  universe: ['sides', 'shade', 'size', 'dotin', 'c1', 'c2', 'h1', 'h2', 'h3'], pool: ['dotin', 'h1', 'h2', 'h3'] },
  };
  const SHADE_N = ['empty', 'hatched', 'solid'];
  const DIR_N = ['up', 'right', 'down', 'left'];

  function oddPoly(g, hard) {
    const R = (hard ? [22, 32] : [22, 30])[g.size];
    return polyPts(0, hard ? 0 : -8, R, g.sides, 0).map((p) => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
  }
  function pointInPoly(p, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function distSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  const polyDist = (p, pts) => Math.min.apply(null, pts.map((a, i) => distSeg(p, a, pts[(i + 1) % pts.length])));
  function placeDot(pts, inside, rng) {
    for (let t = 0; t < 400; t++) {
      const p = [Math.round((rng() * 2 - 1) * 44 * 100) / 100, Math.round((rng() * 2 - 1) * 44 * 100) / 100];
      if (pointInPoly(p, pts) !== inside) continue;
      if (polyDist(p, pts) < 7.5) continue;
      return p;
    }
    return null;
  }
  function renderOdd(g, hard) {
    const pts = g.pts;
    let s = '<rect x="-50" y="-50" width="100" height="100" rx="5" fill="' + PAPER + '" stroke="' + SOFT + '" stroke-width="1.6"/>';
    s += polyShape(pts, g.shade, 2.5, 4.2);
    if (!hard) {
      const a = 6.5, fc = g.shade === 2 ? PAPER : INK, oc = g.shade === 2 ? INK : PAPER;
      s += '<polygon points="0,' + f2(-a * 1.3) + ' ' + f2(a * 0.85) + ',' + f2(a) + ' ' + f2(-a * 0.85) + ',' + f2(a) + '" fill="' + fc + '" stroke="' + oc + '" stroke-width="1.6" stroke-linejoin="round" transform="translate(0 -8) rotate(' + g.dir * 90 + ')"/>';
      for (let k = 0; k < g.count; k++) s += '<circle cx="' + f2((k - (g.count - 1) / 2) * 14) + '" cy="38" r="4" fill="' + INK + '"/>';
    } else {
      s += '<circle cx="' + f2(g.dot[0]) + '" cy="' + f2(g.dot[1]) + '" r="4.5" fill="' + ACC + '" stroke="' + INK + '" stroke-width="1.5"/>';
    }
    return svg('-54 -54 108 108', s, 'figure');
  }

  function oddExplain(ruleId, majority, oddFig, ref) {
    // ref = a majority figure; oddFig = the figure that differs
    if (ruleId === 'sides') return 'Four figures have ' + ref.sides + ' sides; only this one has ' + oddFig.sides + '.';
    if (ruleId === 'shade') return 'Four figures are ' + SHADE_N[ref.shade] + '; only this one is ' + SHADE_N[oddFig.shade] + '.';
    if (ruleId === 'size') return 'Four figures are ' + (ref.size ? 'large' : 'small') + '; only this one is ' + (oddFig.size ? 'large' : 'small') + '.';
    if (ruleId === 'count') return 'Four figures have ' + ref.count + ' dot' + (ref.count === 1 ? '' : 's') + ' below; only this one has ' + oddFig.count + '.';
    if (ruleId === 'dir') return 'In four figures the arrow points ' + DIR_N[ref.dir] + '; in this one it points ' + DIR_N[oddFig.dir] + '.';
    if (ruleId === 'dotin') return 'In four figures the dot lies ' + (ref.dotIn ? 'inside' : 'outside') + ' the shape; in this one it lies ' + (oddFig.dotIn ? 'inside' : 'outside') + '.';
    const txt = ODD_COMP_TXT[ruleId];
    return majority
      ? 'In four figures ' + txt + '; this one breaks that link.'
      : 'Only in this figure ' + txt + '; in the other four it does not hold.';
  }

  function makeOdd(level, rng) {
    const L = ODD_LEV[level];
    for (let attempt = 0; attempt < 600; attempt++) {
      const ruleId = pick(L.pool, rng);
      const R = ODD_RULES[ruleId];
      const odd = ri(0, 4, rng);
      // class value for the four, and for the odd figure
      let a, b;
      if (R.bool) { a = rng() < 0.5; b = !a; }
      else {
        const dom = { sides: [3, 4, 5, 6], shade: [0, 1, 2], size: [0, 1], count: [0, 1, 2, 3], dir: [0, 1, 2, 3] }[ruleId];
        [a, b] = sample(dom, 2, rng);
      }
      const figs = [];
      let bad = false;
      for (let i = 0; i < 5 && !bad; i++) {
        const want = i === odd ? b : a;
        let g = null;
        for (let t = 0; t < 80 && !g; t++) {
          const c = { sides: ri(3, 6, rng), shade: ri(0, 2, rng), size: ri(0, 1, rng), count: L.hard ? 0 : ri(0, 3, rng), dir: L.hard ? 0 : ri(0, 3, rng), dotIn: rng() < 0.5 };
          if (R.f(c) === want) g = c;
        }
        if (!g) bad = true; else figs.push(g);
      }
      if (bad) continue;
      // uniqueness: no other rule may single out a figure (4 vs 1)
      const singled = L.universe.filter((id) => {
        const vals = figs.map(ODD_RULES[id].f);
        const cnt = new Map();
        vals.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
        return cnt.size === 2 && Array.from(cnt.values()).sort().join() === '1,4';
      });
      if (singled.length !== 1 || singled[0] !== ruleId) continue;
      // no two identical figures
      if (new Set(figs.map((g) => [g.sides, g.shade, g.size, g.count, g.dir, g.dotIn].join())).size < 5) continue;
      // geometry
      let geoOk = true;
      figs.forEach((g) => {
        g.pts = oddPoly(g, L.hard);
        if (L.hard) {
          g.dot = placeDot(g.pts, g.dotIn, rng);
          if (!g.dot) geoOk = false;
        }
      });
      if (!geoOk) continue;
      const htmls = figs.map((g) => renderOdd(g, L.hard));
      if (new Set(htmls).size < 5) continue;
      const ref = figs[odd === 0 ? 1 : 0];
      const majority = R.bool ? R.f(ref) : null;
      return {
        prompt: L.hard ? 'Which figure does not follow the rule shared by the other four?' : 'Which figure does not belong with the other four?',
        stimulusClass: 'paper', optionStyle: 'figure',
        options: htmls.map((h) => ({ html: h })),
        answer: odd,
        explain: oddExplain(ruleId, majority, figs[odd], ref),
        meta: {
          hard: L.hard, rule: ruleId, universe: L.universe,
          figs: figs.map((g) => ({ sides: g.sides, shade: g.shade, size: g.size, count: g.count, dir: g.dir, pts: g.pts, dot: g.dot || null })),
        },
      };
    }
    throw new Error('could not build an odd-one-out for ' + level);
  }

  // ====================================================================================================
  // 4. NET FOLDING
  // ====================================================================================================
  const NET_DIRS = [[1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]], [0, -1, [0, 1, 0]], [0, 1, [0, -1, 0]]]; // screen step -> 3D direction
  const mmul = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j] + 0));
  // quarter turn of a neighbour cell down and away from the viewer about the shared edge: z -> d, d -> -z
  function foldTurn(d) {
    const a = CE.cross([0, 0, 1], d);
    const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => {
      const c = CE.cross(a, e), k = a[0] * e[0] + a[1] * e[1] + a[2] * e[2];
      return [c[0] + a[0] * k + 0, c[1] + a[1] * k + 0, c[2] + a[2] * k + 0];
    });
    return [0, 1, 2].map((r) => [cols[0][r], cols[1][r], cols[2][r]]);
  }
  const FOLD_F = NET_DIRS.map((d) => foldTurn(d[2]));
  const IDENT = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  // cells: [[gx, gy]] with gy pointing down the page. Returns per-cell {n, w} or null when it is not a cube net.
  function foldNet(cells) {
    const idx = new Map(cells.map((c, i) => [c[0] + ',' + c[1], i]));
    let adj = 0;
    cells.forEach((c) => { adj += (idx.has(c[0] + 1 + ',' + c[1]) ? 1 : 0) + (idx.has(c[0] + ',' + (c[1] + 1)) ? 1 : 0); });
    if (cells.length !== 6 || adj !== 5) return null;
    const M = new Array(6).fill(null);
    M[0] = IDENT;
    const queue = [0];
    while (queue.length) {
      const i = queue.shift();
      NET_DIRS.forEach((d, di) => {
        const j = idx.get(cells[i][0] + d[0] + ',' + (cells[i][1] + d[1]));
        if (j !== undefined && M[j] === null) {
          M[j] = mmul(M[i], FOLD_F[di]);
          queue.push(j);
        }
      });
    }
    if (M.some((m) => m === null)) return null;
    const faces = M.map((m) => ({ n: [m[0][2] + 0, m[1][2] + 0, m[2][2] + 0], w: [m[0][1] + 0, m[1][1] + 0, m[2][1] + 0] }));
    if (new Set(faces.map((f) => f.n.join())).size !== 6) return null;
    return faces;
  }
  function randomPolyomino(k, rng) {
    const cells = [[0, 0]], has = new Set(['0,0']);
    while (cells.length < k) {
      const c = pick(cells, rng), d = pick(NET_DIRS, rng);
      const n = [c[0] + d[0], c[1] + d[1]];
      if (!has.has(n.join())) { has.add(n.join()); cells.push(n); }
    }
    return cells;
  }
  function symbolMarkup(name, cx, cy, scale) {
    const sw = f2(2.4 / scale);
    const inner = CE.SYMBOLS[name].svg
      .replace(/class="s"/g, 'fill="none" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"')
      .replace(/class="f"/g, 'fill="' + INK + '"');
    return '<g transform="translate(' + f2(cx) + ' ' + f2(cy) + ') scale(' + f2(scale) + ')">' + inner + '</g>';
  }
  function netSvg(cells, syms) {
    const cs = 44;
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    const minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    const side = Math.max(4, maxx - minx + 1, maxy - miny + 1) * cs + 16;
    const ox = (side - (maxx - minx + 1) * cs) / 2 - minx * cs, oy = (side - (maxy - miny + 1) * cs) / 2 - miny * cs;
    let s = '';
    cells.forEach((c, i) => {
      const x = ox + c[0] * cs, y = oy + c[1] * cs;
      s += '<rect x="' + f2(x) + '" y="' + f2(y) + '" width="' + cs + '" height="' + cs + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>';
      s += symbolMarkup(syms[i], x + cs / 2, y + cs / 2, cs * 0.44);
    });
    return svg('0 0 ' + side + ' ' + side, s, 'cube net', 'max-width:300px;margin:0 auto');
  }
  const FOLD_LEV = { easy: 1, medium: 3, hard: 5 };
  function foldSymbols(level, rng) {
    const names = Object.keys(CE.SYMBOLS);
    const ori = names.filter((s) => CE.SYMBOLS[s].order > 1), sym = names.filter((s) => CE.SYMBOLS[s].order === 1);
    const k = FOLD_LEV[level];
    return shuffle(sample(ori, k, rng).concat(sample(sym, 6 - k, rng)), rng);
  }
  const rotSigs = (S) => new Set(CE.ROTS.map((R) => CE.signature(CE.rotate(S, R))));

  function makeFolding(level, rng) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const cells = randomPolyomino(6, rng);
      const folded = foldNet(cells);
      if (!folded) continue;
      const syms = foldSymbols(level, rng);
      const S = folded.map((f, i) => ({ id: i, sym: syms[i], n: f.n, w: f.w }));
      const A = CE.rotate(S, pick(CE.ROTS, rng));
      const sigs = rotSigs(S);
      const taken = new Set([CE.signature(A)]);
      const wrong = [];
      for (let t = 0; t < 300 && wrong.length < 3; t++) {
        const B = CE.mutate(A, level, rng);
        if (!B) continue;
        const sg = CE.signature(B);
        if (sigs.has(sg) || taken.has(sg)) continue;
        taken.add(sg);
        wrong.push(B);
      }
      if (wrong.length < 3) continue;
      const opts = shuffle([{ st: A, ok: true }].concat(wrong.map((st) => ({ st, ok: false }))), rng);
      const opp = [];
      S.forEach((f) => {
        const o = S.find((g) => CE.eq(g.n, CE.neg(f.n)));
        if (f.id < o.id) opp.push(f.sym + ' / ' + o.sym);
      });
      return {
        prompt: 'Which cube can be folded from this net? The printed side ends up outside.',
        stimulus: netSvg(cells, syms), stimulusClass: 'paper', optionStyle: 'figure',
        options: opts.map((o) => ({ html: CE.renderCube(o.st, { label: 'cube option' }) })),
        answer: opts.findIndex((o) => o.ok),
        explain: 'Folding the net puts these pairs on opposite faces: ' + opp.join(', ') + '. Only the correct cube shows its three visible symbols in that arrangement and turn; the others swap two symbols, turn one, or show a symbol that sits on a hidden face.',
        meta: { cells, syms, options: opts.map((o) => o.st), answerState: A },
      };
    }
    throw new Error('could not build a folding question for ' + level);
  }

  // ====================================================================================================
  // 5. MIRROR & ROTATION
  // ====================================================================================================
  const ROT_LEV = {
    easy:   { k: [5, 6], marks: 0, wrong: ['mirror', 'mirror', 'mirror'] },
    medium: { k: [6, 7], marks: 1, wrong: ['mirror', 'moved', 'any'] },
    hard:   { k: [7, 8], marks: 2, wrong: ['mirror', 'moved', 'any'] },
  };
  const rnorm = (cells) => {
    const mx = Math.min.apply(null, cells.map((c) => c[0])), my = Math.min.apply(null, cells.map((c) => c[1]));
    return cells.map((c) => [c[0] - mx, c[1] - my, c[2]]).sort((a, b) => a[1] - b[1] || a[0] - b[0] || a[2] - b[2]);
  };
  const rkey = (cells) => rnorm(cells).map((c) => c.join(',')).join(';');
  const rrot = (cells) => cells.map((c) => [-c[1], c[0], c[2]]);
  const rmir = (cells) => cells.map((c) => [-c[0], c[1], c[2]]);
  function rrotN(cells, n) { let c = cells; for (let i = 0; i < n; i++) c = rrot(c); return rnorm(c); }
  const rotKeySet = (cells) => new Set([0, 1, 2, 3].map((n) => rkey(rrotN(cells, n))));
  const rbbox = (cells) => {
    const n = rnorm(cells);
    return [Math.max.apply(null, n.map((c) => c[0])) + 1, Math.max.apply(null, n.map((c) => c[1])) + 1];
  };
  function rconnected(cells) {
    if (!cells.length) return false;
    const has = new Set(cells.map((c) => c[0] + ',' + c[1]));
    const seen = new Set([cells[0][0] + ',' + cells[0][1]]);
    const st = [cells[0]];
    while (st.length) {
      const c = st.pop();
      NET_DIRS.forEach((d) => {
        const k = c[0] + d[0] + ',' + (c[1] + d[1]);
        if (has.has(k) && !seen.has(k)) { seen.add(k); st.push([c[0] + d[0], c[1] + d[1]]); }
      });
    }
    return seen.size === cells.length;
  }
  function renderCells(cells, style) {
    const n = rnorm(cells), cs = 24, box = 5 * cs + 16;
    const w = Math.max.apply(null, n.map((c) => c[0])) + 1, h = Math.max.apply(null, n.map((c) => c[1])) + 1;
    const ox = (box - w * cs) / 2, oy = (box - h * cs) / 2;
    let s = '';
    n.forEach((c) => {
      const x = ox + c[0] * cs, y = oy + c[1] * cs;
      s += '<rect x="' + f2(x) + '" y="' + f2(y) + '" width="' + cs + '" height="' + cs + '" fill="' + (c[2] === 1 ? ACC : PAPER) + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>';
      if (c[2] === 2) s += '<circle cx="' + f2(x + cs / 2) + '" cy="' + f2(y + cs / 2) + '" r="5" fill="' + INK + '"/>';
    });
    return svg('0 0 ' + box + ' ' + box, s, 'shape', style);
  }
  function moveCell(cells, rng) {
    const i = ri(0, cells.length - 1, rng);
    const rest = cells.filter((_, j) => j !== i);
    if (!rconnected(rest)) return null;
    const has = new Set(cells.map((c) => c[0] + ',' + c[1]));
    const cand = [];
    rest.forEach((c) => NET_DIRS.forEach((d) => {
      const x = c[0] + d[0], y = c[1] + d[1];
      if (!has.has(x + ',' + y)) cand.push([x, y]);
    }));
    if (!cand.length) return null;
    const p = pick(cand, rng);
    return rest.concat([[p[0], p[1], cells[i][2]]]);
  }
  function swapMark(cells, rng) {
    const a = cells.filter((c) => c[2] > 0);
    if (!a.length) return null;
    const x = pick(a, rng), y = pick(cells.filter((c) => c[2] !== x[2]), rng);
    return cells.map((c) => (c === x ? [c[0], c[1], y[2]] : c === y ? [c[0], c[1], x[2]] : c));
  }

  function makeRotation(level, rng) {
    const L = ROT_LEV[level];
    for (let attempt = 0; attempt < 500; attempt++) {
      const k = ri(L.k[0], L.k[1], rng);
      const cells = [[0, 0, 0]], has = new Set(['0,0']);
      while (cells.length < k) {
        const c = pick(cells, rng), d = pick(NET_DIRS, rng);
        const p = [c[0] + d[0], c[1] + d[1]];
        if (!has.has(p.join())) { has.add(p.join()); cells.push([p[0], p[1], 0]); }
      }
      const bb = rbbox(cells);
      if (bb[0] > 5 || bb[1] > 5) continue;
      sample(rangeArr(k), L.marks, rng).forEach((idx, m) => { cells[idx][2] = m + 1; });
      const S = rnorm(cells);
      const rots = rotKeySet(S);
      if (rots.has(rkey(rmir(S)))) continue; // mirror image must differ from every turn of the sample
      // correct option: turned, visibly different from the sample
      const rs = [1, 2, 3].filter((n) => rkey(rrotN(S, n)) !== rkey(S));
      const good = rrotN(S, pick(rs, rng));
      const taken = new Set([rkey(S), rkey(good)]);
      const wrong = [];
      const tryAdd = (c) => {
        if (!c || !c.length) return false;
        const b = rbbox(c);
        if (b[0] > 5 || b[1] > 5) return false;
        const key = rkey(c);
        if (taken.has(key) || rots.has(key)) return false;
        taken.add(key);
        wrong.push(rnorm(c));
        return true;
      };
      const variant = (kind) => {
        for (let t = 0; t < 60; t++) {
          let c;
          if (kind === 'mirror') c = rrotN(rmir(S), ri(0, 3, rng));
          else {
            const base = kind === 'moved' ? moveCell(S, rng) : (swapMark(S, rng) || moveCell(S, rng));
            if (!base) continue;
            c = rrotN(rng() < 0.5 ? rmir(base) : base, ri(0, 3, rng));
          }
          if (tryAdd(c)) return true;
        }
        return false;
      };
      let ok = true;
      for (const spec of L.wrong) {
        const kind = spec === 'any' ? pick(['mirror', 'moved', 'moved', 'mark'], rng) : spec;
        if (!variant(kind) && !variant('moved') && !variant('mirror')) { ok = false; break; }
      }
      if (!ok || wrong.length < 3) continue;
      const opts = shuffle([{ c: good, ok: true }].concat(wrong.map((c) => ({ c, ok: false }))), rng);
      const hasMark = L.marks > 0;
      return {
        prompt: 'Which option shows the same shape, only turned (not flipped)?',
        stimulus: renderCells(S, 'max-width:210px;margin:0 auto'), stimulusClass: 'paper', optionStyle: 'figure',
        options: opts.map((o) => ({ html: renderCells(o.c) })),
        answer: opts.findIndex((o) => o.ok),
        explain: 'The sample cannot be matched with its own mirror image by turning, so only a turned copy is correct' + (hasMark ? ' (cells keep their colour or dot)' : '') + '; the other options are the flipped shape or have a cell moved.',
        meta: { sample: S, options: opts.map((o) => o.c) },
      };
    }
    throw new Error('could not build a rotation question for ' + level);
  }

  // ====================================================================================================
  // 6. HIDDEN FIGURES
  // ====================================================================================================
  // A figure is a set of unit lattice segments; a segment is [x, y, d] from (x, y) to (x + dx, y + dy), d indexing HDIRS.
  const HDIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const H_LEV = {
    easy:   { N: 4, tgt: [3, 4], diag: 0,    tot: [11, 14], types: ['missing', 'bent', 'shift'] },
    medium: { N: 5, tgt: [4, 5], diag: 0.25, tot: [18, 22], types: ['missing', 'bent', 'shift', 'turned'] },
    hard:   { N: 6, tgt: [5, 6], diag: 0.35, tot: [30, 36], types: ['missing', 'bent', 'bent', 'shift', 'shift', 'turned'] },
  };
  const hkey = (e) => e[0] + ',' + e[1] + ',' + e[2];
  function edgeBetween(p, q) {
    let a = p, b = q;
    if (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])) { a = q; b = p; }
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const d = HDIRS.findIndex((h) => h[0] === dx && h[1] === dy);
    return d < 0 ? null : [a[0], a[1], d];
  }
  const eEnds = (e) => [[e[0], e[1]], [e[0] + HDIRS[e[2]][0], e[1] + HDIRS[e[2]][1]]];
  const inLat = (p, N) => p[0] >= 0 && p[1] >= 0 && p[0] < N && p[1] < N;
  const ORTH8 = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIAG8 = [[1, 1], [-1, -1], [1, -1], [-1, 1]];

  // grow a connected figure: map key -> edge, node list
  function growEdges(edges, count, N, diagP, rng, banned) {
    const nodes = new Map();
    edges.forEach((e) => eEnds(e).forEach((p) => nodes.set(p.join(), p)));
    for (let t = 0; t < 800 && edges.size < count; t++) {
      const base = pick(Array.from(nodes.values()), rng);
      const d = rng() < diagP ? pick(DIAG8, rng) : pick(ORTH8, rng);
      const q = [base[0] + d[0], base[1] + d[1]];
      if (!inLat(q, N)) continue;
      const e = edgeBetween(base, q);
      const k = hkey(e);
      if (edges.has(k) || (banned && banned.has(k))) continue;
      edges.set(k, e);
      nodes.set(q.join(), q);
    }
    return edges.size >= count;
  }
  function hNormalize(list) {
    let mx = Infinity, my = Infinity;
    list.forEach((e) => eEnds(e).forEach((p) => { mx = Math.min(mx, p[0]); my = Math.min(my, p[1]); }));
    return list.map((e) => [e[0] - mx, e[1] - my, e[2]]);
  }
  const hBox = (list) => {
    let w = 0, h = 0;
    hNormalize(list).forEach((e) => eEnds(e).forEach((p) => { w = Math.max(w, p[0]); h = Math.max(h, p[1]); }));
    return [w, h];
  };
  // translation-exact containment of the target in a figure
  function containsTarget(figKeys, target, N) {
    const [bw, bh] = hBox(target);
    const t = hNormalize(target);
    for (let dx = 0; dx + bw < N; dx++) {
      for (let dy = 0; dy + bh < N; dy++) {
        if (t.every((e) => figKeys.has(hkey([e[0] + dx, e[1] + dy, e[2]])))) return true;
      }
    }
    return false;
  }
  function hTransform(target, fn) {
    return hNormalize(target.map((e) => { const [p, q] = eEnds(e); return edgeBetween(fn(p), fn(q)); }));
  }
  function renderHidden(list, N, sp, style) {
    const pad = (140 - (N - 1) * sp) / 2;
    let s = '<rect x="2" y="2" width="136" height="136" rx="6" fill="' + PAPER + '" stroke="' + SOFT + '" stroke-width="1.6"/>';
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) s += '<circle cx="' + f2(pad + x * sp) + '" cy="' + f2(pad + y * sp) + '" r="1.7" fill="' + SOFT + '"/>';
    let d = '';
    list.forEach((e) => {
      const [p, q] = eEnds(e);
      d += 'M' + f2(pad + p[0] * sp) + ' ' + f2(pad + p[1] * sp) + 'L' + f2(pad + q[0] * sp) + ' ' + f2(pad + q[1] * sp);
    });
    s += '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg('0 0 140 140', s, 'line figure', style);
  }

  function makeHidden(level, rng) {
    const L = H_LEV[level], N = L.N;
    const sp = Math.min(34, 104 / (N - 1));
    for (let attempt = 0; attempt < 300; attempt++) {
      // target
      const tk = ri(L.tgt[0], L.tgt[1], rng);
      const start = [ri(0, N - 1, rng), ri(0, N - 1, rng)];
      const tm = new Map();
      // seed: grow from the start node
      for (let t = 0; t < 60 && tm.size < tk; t++) {
        const nodes = tm.size ? Array.from(new Set([].concat.apply([], Array.from(tm.values()).map((e) => eEnds(e).map((p) => p.join()))))).map((s) => s.split(',').map(Number)) : [start];
        const base = pick(nodes, rng);
        const d = rng() < L.diag ? pick(DIAG8, rng) : pick(ORTH8, rng);
        const q = [base[0] + d[0], base[1] + d[1]];
        if (!inLat(q, N)) continue;
        const e = edgeBetween(base, q);
        tm.set(hkey(e), e);
      }
      if (tm.size < tk) continue;
      const target = hNormalize(Array.from(tm.values()));
      const [bw, bh] = hBox(target);
      if (bw > N - 1 || bh > N - 1) continue;
      if (new Set(target.map((e) => e[2])).size < 2) continue;
      if (level === 'hard' && !target.some((e) => e[2] >= 2)) continue;
      const tKeys = new Set(target.map(hkey));
      const place = (list) => {
        const dx = ri(0, N - 1 - bw, rng), dy = ri(0, N - 1 - bh, rng);
        return list.map((e) => [e[0] + dx, e[1] + dy, e[2]]);
      };
      const finish = (base, banned) => {
        const m = new Map(base.map((e) => [hkey(e), e]));
        const tot = ri(L.tot[0], L.tot[1], rng);
        if (!growEdges(m, Math.max(tot, m.size + 2), N, L.diag, rng, banned)) return null;
        return m;
      };
      const figs = [];
      const sigs = new Set();
      const push = (m, ok) => {
        const keys = Array.from(m.keys()).sort();
        const sg = keys.join('|');
        if (sigs.has(sg)) return false;
        const has = containsTarget(new Set(keys), target, N);
        if (has !== ok) return false;
        sigs.add(sg);
        figs.push({ edges: keys.map((k) => m.get(k)), ok });
        return true;
      };
      let good = null;
      for (let t = 0; t < 20 && !good; t++) {
        const m = finish(place(target), null);
        if (m && push(m, true)) good = true;
      }
      if (!good) continue;
      let guard = 0;
      while (figs.length < 4 && guard++ < 80) {
        const type = pick(L.types, rng);
        let base = place(target);
        const banned = new Set();
        if (type === 'turned') {
          const fn = pick([(p) => [-p[1], p[0]], (p) => [-p[0], -p[1]], (p) => [p[1], -p[0]], (p) => [-p[0], p[1]], (p) => [p[0], -p[1]]], rng);
          const tr = hTransform(target, fn);
          if (new Set(tr.map(hkey)).size === tKeys.size && tr.every((e) => tKeys.has(hkey(e)))) continue;
          const [w2, h2] = hBox(tr);
          if (w2 > N - 1 || h2 > N - 1) continue;
          const dx = ri(0, N - 1 - w2, rng), dy = ri(0, N - 1 - h2, rng);
          base = tr.map((e) => [e[0] + dx, e[1] + dy, e[2]]);
        } else {
          const i = ri(0, base.length - 1, rng), e = base[i];
          const rest = base.filter((_, j) => j !== i);
          banned.add(hkey(e));
          let add = null;
          if (type === 'bent') {
            const ends = eEnds(e), a = pick(ends, rng);
            const dd = rng() < L.diag ? pick(DIAG8, rng) : pick(ORTH8, rng);
            const q = [a[0] + dd[0], a[1] + dd[1]];
            if (inLat(q, N)) add = edgeBetween(a, q);
          } else if (type === 'shift') {
            const dd = pick(ORTH8, rng);
            const [p, q] = eEnds(e);
            const p2 = [p[0] + dd[0], p[1] + dd[1]], q2 = [q[0] + dd[0], q[1] + dd[1]];
            if (inLat(p2, N) && inLat(q2, N)) add = edgeBetween(p2, q2);
          }
          if (type !== 'missing') {
            if (!add) continue;
            if (rest.some((x) => hkey(x) === hkey(add)) || hkey(add) === hkey(e)) continue;
            base = rest.concat([add]);
          } else base = rest;
        }
        const m = finish(base, banned);
        if (m) push(m, false);
      }
      if (figs.length < 4) continue;
      const opts = shuffle(figs.slice(), rng);
      return {
        prompt: 'Which figure contains the shape on the left, in exactly this position and orientation?',
        stimulus: renderHidden(target, N, sp, 'max-width:200px;margin:0 auto'),
        stimulusClass: 'paper', optionStyle: 'figure',
        options: opts.map((o) => ({ html: renderHidden(o.edges, N, sp) })),
        answer: opts.findIndex((o) => o.ok),
        explain: 'Only one figure contains every line of the shape exactly as drawn (same orientation, just shifted). In each of the others a line is missing, bent away, moved aside, or the whole shape is turned or flipped.',
        meta: { N, target, options: opts.map((o) => o.edges) },
      };
    }
    throw new Error('could not build a hidden-figure question for ' + level);
  }

  // ====================================================================================================
  // registration
  // ====================================================================================================
  const reg = (def, fn) => T.register(Object.assign({ make: fn }, def));

  reg({
    id: 'matrices', name: 'Matrices', de: 'Matrizen', domain: 'reasoning', n: 10, secs: 420, refSecs: 40, learn: 0.7, options: 5,
    tips: [
      'Look at one feature at a time (shape, shading, size, number) and ignore the others.',
      'For each feature test the rules in turn: same along rows, same down columns, each value once per row and column, or a steady step.',
      'Work out the missing cell feature by feature, then cross out options that break even one feature.',
      'Check the first two rows to find the rule, then confirm it on the columns before you decide.',
      'If two features seem to change together, treat them as separate rules first.',
    ],
    desc: {
      easy: 'Two features change by simple rules that stay the same along rows or columns, or by one step per cell.',
      medium: 'Three features, now including rules where every value appears once in each row and column.',
      hard: 'Four features at once, mixing row, column, once-per-row and stepping rules, with a rotating line inside the figures.',
    },
  }, makeMatrix);

  reg({
    id: 'figseries', name: 'Figure series', de: 'Figurenfolgen', domain: 'reasoning', n: 10, secs: 360, refSecs: 30, learn: 0.7, options: 5,
    tips: [
      'Split a figure into its independent parts and follow each part through the series on its own.',
      'For a turning part, measure the change from one figure to the next, then apply the same change once more.',
      'Counts and sizes often wrap around: after the largest comes the smallest again.',
      'Eliminate options part by part: a wrong part in one box is enough to reject an option.',
      'Different parts can move at different speeds or in opposite directions.',
    ],
    desc: {
      easy: 'One part of the figure changes by a steady step.',
      medium: 'Two independent parts change, each with its own step.',
      hard: 'Three independent parts change with different steps and directions.',
    },
  }, makeFigSeries);

  reg({
    id: 'oddfigure', name: 'Odd one out (figures)', de: 'Klassifikation', domain: 'reasoning', n: 10, secs: 300, refSecs: 25, learn: 0.6, options: 5,
    tips: [
      'List what each figure has: sides, shading, size, number of dots, direction of the arrow.',
      'Find the feature that four figures share and one does not; the other features vary on purpose.',
      'If no single feature works, look for a link between two features, such as shading and number of sides.',
      'A dot inside or outside a shape is a relation, so check where the dot sits in each figure.',
      'Test your rule on all five figures before you answer.',
    ],
    desc: {
      easy: 'A single visible feature (sides, shading, size, dots or arrow direction) separates one figure from four.',
      medium: 'The rule combines two features, such as the number of sides together with the shading.',
      hard: 'The rule is a relation, for example the dot lies inside exactly when the shape is solid.',
    },
  }, makeOdd);

  reg({
    id: 'folding', name: 'Net folding', de: 'Abwicklungen', domain: 'spatial', n: 10, secs: 420, refSecs: 40, learn: 0.8, options: 4,
    tips: [
      'Pick one square as the base and fold the neighbours down around it in your head.',
      'Squares that are two apart in a straight row of the net end up on opposite faces.',
      'Use opposite pairs to rule out options: two opposite symbols can never be seen together.',
      'For turned symbols, follow where the top of the symbol goes while you fold.',
      'Check one symbol that points somewhere, then the neighbouring face, and the rest follows.',
    ],
    desc: {
      easy: 'Mostly symmetric symbols, so the arrangement of faces decides.',
      medium: 'Three turnable symbols: you must also follow how they turn when folding.',
      hard: 'Almost all symbols are turnable, so the turn of every visible symbol matters.',
    },
  }, makeFolding);

  reg({
    id: 'rotation', name: 'Mirror & rotation', de: 'Spiegeln & Drehen', domain: 'spatial', n: 10, secs: 300, refSecs: 20, learn: 0.8, options: 4,
    tips: [
      'A turn keeps the shape, a flip does not: look for the one corner or bend that tells them apart.',
      'Turn the sample in your head until one distinctive part matches an option.',
      'Rule out mirror images first: they look right but run the other way round.',
      'Count cells in each arm of the shape; a moved cell changes these counts.',
      'Use the coloured cell or the dot as a compass: it must stay in the same place relative to the bends.',
    ],
    desc: {
      easy: 'A five or six cell shape; the wrong options are mirror images.',
      medium: 'Larger shape with a coloured cell; some wrong options have a cell moved.',
      hard: 'Seven or eight cells with a coloured cell and a dot; subtle changes such as a moved marker.',
    },
  }, makeRotation);

  reg({
    id: 'hidden', name: 'Hidden figures', de: 'Figuren erkennen', domain: 'spatial', n: 10, secs: 360, refSecs: 30, learn: 0.7, options: 4,
    tips: [
      'Find the most unusual part of the target, such as a diagonal or a T-junction, and look for it first.',
      'The target is never turned, so only look for it in exactly this orientation.',
      'When you find a candidate, check every line of the target, not just most of them.',
      'Wrong figures often hide a near copy with one line missing or bent; count the lines.',
      'Trace the target on the lattice dots: the same steps right, left, up and down.',
    ],
    desc: {
      easy: 'Small lattice, a three or four line target and a lightly cluttered figure.',
      medium: 'Larger lattice with diagonals and more clutter; near copies with a line moved.',
      hard: 'Dense figures on a large lattice, a five or six line target and subtle near copies.',
    },
  }, makeHidden);

  const api = { predictAttr, renderMCell, M_ATTR, M_DOM, renderFig, seriesPredict, FS, renderOdd, ODD_RULES, foldNet, netSvg, renderCells, renderHidden, containsTarget, H_LEV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Figural = api;
})(typeof self !== 'undefined' ? self : this);
