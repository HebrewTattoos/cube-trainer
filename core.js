/* Reasoning Trainer core: module registry, question schema, helpers, validation.
 *
 * A task module registers itself with Trainer.register({...}). Each module generates questions with
 * make(level, rng) where level is 'easy' | 'medium' | 'hard' and rng() returns [0,1).
 *
 * Question object returned by make():
 *   prompt      string   One line shown under the stimulus. UI chrome is English; task text may be German.
 *   stimulus    string   Optional trusted HTML/SVG shown in a card above the prompt (see "Drawing" below).
 *   stimulusClass string Optional: 'paper' (light card, for drawings) | 'plain' (default, theme card, for text/tables).
 *   lang        string   Optional: 'de' when prompt/stimulus/options are German (sets the lang attribute).
 *   study       object   Optional memorise phase: { html, secs, label } shown first with a countdown and a Ready button;
 *                        afterwards it is hidden and the question (stimulus/prompt/options) appears.
 *   kind        string   'mc' (default) | 'typed'
 *   options     array    mc only: 2-6 entries. A string/number = plain text option; {html} = trusted HTML/SVG option;
 *                        {text, html} not allowed. All options must be distinct.
 *   optionStyle string   'text' (default, one per row) | 'grid' (2 columns, compact; use for numbers/short words)
 *                        | 'figure' (2 columns, light paper card per option, for SVG drawings)
 *   answer      number   mc only: index of the single correct option.
 *   typedAnswer string|number|array  Canonical accepted answer(s). Required when kind === 'typed'. Optional on an mc
 *                        question that can also be answered by typing a number (UI offers "Typing" mode then).
 *   explain     string   Plain text shown after answering: the rule / why the answer is right (may be German).
 *
 * Drawing (stimulus and {html} options): inline SVG with a viewBox, root element <svg class="fig" viewBox="...">.
 * Colours ONLY through CSS variables so both themes work: var(--ink) strokes and dark fills, var(--paper) light fills,
 * var(--accent) for a single highlight, var(--soft) for mid-grey fills (hatching, shading). Typical stroke width 2.5
 * (round caps/joins). Never use NaN/undefined in numbers; round coordinates to 2 decimals.
 *
 * Correctness bar: every question has exactly ONE defensible answer that the generator can prove (solver /
 * exhaustive check / construction), never "probably". Distractors must be provably wrong.
 */
(function (root) {
  'use strict';

  const DOMAINS = {
    reasoning: { name: 'Reasoning', blurb: 'Rules, patterns and logic' },
    spatial:   { name: 'Spatial', blurb: 'Turning, folding and seeing shapes' },
    numerical: { name: 'Numerical', blurb: 'Numbers, calculation and tables' },
    verbal:    { name: 'Verbal', blurb: 'Words, meaning and knowledge' },
    memory:    { name: 'Memory', blurb: 'Hold and recall information' },
    speed:     { name: 'Speed & attention', blurb: 'Fast, accurate perception' },
  };
  const LEVELS = ['easy', 'medium', 'hard'];

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
  const sample = (arr, k, rng) => shuffle(arr.slice(), rng).slice(0, k);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const util = { ri, pick, shuffle, weighted, sample, esc, mulberry32 };

  // ---------- registry ----------
  const registry = Object.create(null);
  const order = [];

  function register(def) {
    for (const k of ['id', 'name', 'domain', 'make']) if (!def[k]) throw new Error('module is missing ' + k);
    if (!DOMAINS[def.domain]) throw new Error('unknown domain ' + def.domain);
    if (registry[def.id]) throw new Error('duplicate module ' + def.id);
    const full = Object.assign({ de: '', n: 10, secs: 300, refSecs: 30, learn: 0.6, options: 5, tips: [], desc: { easy: '', medium: '', hard: '' }, order: order.length }, def);
    registry[full.id] = full;
    order.push(full.id);
    return full;
  }
  const modules = () => order.map((id) => registry[id]);
  const get = (id) => registry[id];

  function normalize(q, def, level) {
    q.module = def.id;
    q.level = level;
    q.kind = q.kind || 'mc';
    q.prompt = q.prompt || '';
    if (q.kind === 'mc') q.options = (q.options || []).map((o) => (o !== null && typeof o === 'object' ? o : { text: String(o) }));
    return q;
  }

  function make(id, level, rng) {
    const def = registry[id];
    if (!def) throw new Error('unknown module ' + id);
    let last;
    for (let i = 0; i < 6; i++) {
      try {
        const q = def.make(level, rng || Math.random);
        const q2 = normalize(q, def, level);
        if (validate(q2).length === 0) return q2;
        last = new Error('invalid question from ' + id + ': ' + validate(q2).join('; '));
      } catch (e) {
        last = e;
      }
    }
    throw last;
  }

  // ---------- answers ----------
  function normTyped(s) {
    const t = String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.').replace(/−/g, '-');
    return t;
  }
  function sameTyped(a, b) {
    const x = normTyped(a), y = normTyped(b);
    if (x === y) return true;
    // numeric equivalence (2.50 = 2.5) but never for strings with leading zeros (digit strings such as 0123)
    const num = /^-?(0|[1-9]\d*)(\.\d+)?$/;
    if (num.test(x) && num.test(y)) return Number(x) === Number(y);
    return false;
  }
  // response: mc index (number) or { typed: string } or null/undefined (no answer)
  function isCorrect(q, resp) {
    if (resp === null || resp === undefined) return false;
    if (typeof resp === 'object') {
      const acc = [].concat(q.typedAnswer === undefined ? [] : q.typedAnswer);
      return acc.some((a) => sameTyped(a, resp.typed));
    }
    return q.kind === 'mc' && resp === q.answer;
  }
  function answerText(q) {
    if (q.kind === 'typed') return String([].concat(q.typedAnswer)[0]);
    const o = q.options[q.answer];
    return o.text !== undefined ? o.text : '';
  }

  // ---------- validation (used by every module's tests) ----------
  function validate(q) {
    const p = [];
    const bad = (s) => typeof s === 'string' && /undefined|NaN|\[object|null/.test(s);
    if (!q || typeof q !== 'object') return ['not an object'];
    if (typeof q.prompt !== 'string') p.push('prompt must be a string');
    if (q.kind !== 'mc' && q.kind !== 'typed') p.push('kind must be mc or typed');
    if (typeof q.explain !== 'string' || !q.explain.trim()) p.push('explain is required');
    ['prompt', 'stimulus', 'explain'].forEach((k) => { if (bad(q[k])) p.push(k + ' contains undefined/NaN/null'); });
    if (q.study) {
      if (!q.study.html || !(q.study.secs > 0)) p.push('study needs html and secs');
      if (bad(q.study.html)) p.push('study html contains undefined/NaN/null');
    }
    if (q.kind === 'mc') {
      const o = q.options || [];
      if (o.length < 2 || o.length > 6) p.push('mc needs 2-6 options');
      const keys = o.map((x) => (x.html !== undefined ? 'h:' + x.html : 't:' + x.text));
      if (new Set(keys).size !== keys.length) p.push('duplicate options');
      o.forEach((x, i) => {
        if ((x.html === undefined) === (x.text === undefined)) p.push('option ' + i + ' needs exactly one of text/html');
        if (bad(x.html) || bad(x.text)) p.push('option ' + i + ' contains undefined/NaN/null');
        if (x.text !== undefined && !String(x.text).trim()) p.push('option ' + i + ' empty');
      });
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= o.length) p.push('answer index out of range');
    } else if (q.kind === 'typed') {
      if (q.typedAnswer === undefined || q.typedAnswer === '' || (Array.isArray(q.typedAnswer) && !q.typedAnswer.length)) p.push('typed needs typedAnswer');
    }
    if (q.kind === 'mc' && q.typedAnswer !== undefined && !(typeof q.typedAnswer === 'number' || typeof q.typedAnswer === 'string' || Array.isArray(q.typedAnswer))) p.push('bad typedAnswer');
    return p;
  }

  // Generate n questions per level for a module and report problems (for tests).
  function selfTest(id, opts) {
    opts = opts || {};
    const n = opts.n || 500;
    const out = { id, problems: [], made: 0, ms: 0 };
    LEVELS.forEach((level, li) => {
      const rng = mulberry32((opts.seed || 1) * 7919 + li * 104729 + id.length);
      const t0 = Date.now();
      for (let i = 0; i < n; i++) {
        let q;
        try { q = make(id, level, rng); } catch (e) { out.problems.push(level + ': ' + e.message); continue; }
        out.made++;
        const v = validate(q);
        if (v.length) out.problems.push(level + ': ' + v.join('; '));
      }
      out.ms += Date.now() - t0;
    });
    return out;
  }

  const api = { DOMAINS, LEVELS, register, modules, get, make, validate, isCorrect, answerText, selfTest, util, rng: mulberry32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Trainer = api;
})(typeof self !== 'undefined' ? self : this);
