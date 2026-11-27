/* Abilities profile: turns the answer history into per-exercise ability scores, domain scores, an overall score for a
 * chosen test profile, and a ranked "where to put effort" list.
 *
 * History entry: [moduleId, levelIndex(0 easy,1 medium,2 hard), correct(0|1), ms (0 = unknown), timestamp]
 *
 * Model (per exercise): item-response model with level difficulties b = -1 / 0.3 / 1.6 and a guessing floor of
 * 1/options (0.02 for typed answers). Ability theta is the posterior mean on a grid with a N(0, 1.6^2) prior, so little
 * data stays near the middle with a wide interval. Newer answers weigh more (half-life 80 answers).
 * Score = 100 / (1 + exp(-theta / 1.25)), so 50 = middle, about 76 = theta 1.5.
 */
(function (root) {
  'use strict';
  const T = root.Trainer || require('./core.js');

  const LEVELS = ['easy', 'medium', 'hard'];
  const B = [-1.0, 0.3, 1.6];
  const SLOPE = 1.1;
  const PRIOR_SD = 1.6;
  const HALF_LIFE = 80;
  const SCORE_SCALE = 1.25;
  const TARGET = 88;
  const DOMAINS = ['reasoning', 'spatial', 'numerical', 'verbal', 'memory', 'speed'];

  const PROFILES = {
    balanced:  { name: 'Balanced (IST-style)', w: { reasoning: 0.25, spatial: 0.15, numerical: 0.20, verbal: 0.20, memory: 0.10, speed: 0.10 } },
    technical: { name: 'Technical / engineering', w: { reasoning: 0.25, spatial: 0.25, numerical: 0.25, verbal: 0.10, memory: 0.05, speed: 0.10 } },
    medical:   { name: 'Medical (TMS-style)', w: { reasoning: 0.15, spatial: 0.25, numerical: 0.15, verbal: 0.10, memory: 0.25, speed: 0.10 } },
    office:    { name: 'Office / commercial', w: { reasoning: 0.20, spatial: 0.05, numerical: 0.25, verbal: 0.30, memory: 0.05, speed: 0.15 } },
  };

  const sig = (x) => 1 / (1 + Math.exp(-x));
  const scoreOf = (theta) => 100 * sig(theta / SCORE_SCALE);
  const median = (a) => {
    if (!a.length) return null;
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const GRID = [];
  for (let t = -4; t <= 4.0001; t += 0.1) GRID.push(Math.round(t * 10) / 10);

  function band(score) {
    return score < 30 ? 'Developing' : score < 45 ? 'Building' : score < 60 ? 'Solid' : score < 75 ? 'Strong' : score < 88 ? 'Very strong' : 'Excellent';
  }

  // entries: chronological list of [id, lvl, correct, ms, ts] for ONE exercise
  function estimate(entries, def) {
    const n = entries.length;
    const g = def.options >= 2 ? 1 / def.options : 0.02;
    const ll = GRID.map((t) => -(t * t) / (2 * PRIOR_SD * PRIOR_SD));
    entries.forEach((e, i) => {
      const w = Math.pow(0.5, (n - 1 - i) / HALF_LIFE);
      GRID.forEach((t, k) => {
        const p = g + (1 - g) * sig(SLOPE * (t - B[e[1]]));
        ll[k] += w * Math.log(e[2] ? p : 1 - p);
      });
    });
    const mx = Math.max.apply(null, ll);
    const post = ll.map((v) => Math.exp(v - mx));
    const z = post.reduce((a, b) => a + b, 0);
    let mean = 0;
    GRID.forEach((t, k) => { mean += (t * post[k]) / z; });
    let v = 0;
    GRID.forEach((t, k) => { v += ((t - mean) * (t - mean) * post[k]) / z; });
    const sd = Math.sqrt(v);
    const byLevel = LEVELS.map((name, li) => {
      const e = entries.filter((x) => x[1] === li);
      return { level: name, n: e.length, acc: e.length ? e.filter((x) => x[2]).length / e.length : null };
    });
    const recent = entries.slice(-40).filter((e) => e[3] > 0 && e[3] < 180000);
    const ratios = recent.map((e) => e[3] / (def.refSecs * 1000 * [0.7, 1, 1.35][e[1]]));
    const speedRatio = median(ratios);
    const half = Math.floor(n / 2);
    const accOf = (a) => (a.length ? a.filter((x) => x[2]).length / a.length : null);
    return {
      id: def.id, n, correct: entries.filter((e) => e[2]).length,
      acc: n ? entries.filter((e) => e[2]).length / n : null,
      theta: mean, sd, score: scoreOf(mean), lo: scoreOf(mean - 1.28 * sd), hi: scoreOf(mean + 1.28 * sd),
      conf: Math.max(0, Math.min(1, 1 - sd / PRIOR_SD)),
      byLevel, speedRatio, medianMs: median(recent.map((e) => e[3])),
      trend: n >= 12 ? accOf(entries.slice(half)) - accOf(entries.slice(0, half)) : null,
    };
  }

  function suggestLevel(score) { return score < 40 ? 'easy' : score < 66 ? 'medium' : 'hard'; }

  function diagnose(m, est) {
    const lv = est.byLevel;
    const e = lv[0], md = lv[1], h = lv[2];
    if (est.n < 6) return { kind: 'measure', text: 'Not enough answers yet to judge. Do about ' + (8 - est.n) + ' more questions here.' };
    if (e.n >= 3 && e.acc < 0.7) return { kind: 'basics', text: 'The basic rules are not secure yet (easy ' + Math.round(e.acc * 100) + '% correct). Use Practice on Easy and read the explanation after each answer.' };
    if (md.n >= 3 && md.acc < 0.6) return { kind: 'build', text: 'Medium questions are the gap (' + Math.round(md.acc * 100) + '% correct). Stay on Medium in Practice until the explanations feel obvious.' };
    if (est.speedRatio !== null && est.speedRatio > 1.3 && est.acc >= 0.7) return { kind: 'speed', text: 'Accurate but slow: about ' + Math.round(est.medianMs / 1000) + ' s per question against roughly ' + Math.round(m.refSecs) + ' s. Do timed tests to build pace.' };
    if (h.n >= 3 && h.acc < 0.5 && (md.n === 0 || md.acc >= 0.6)) return { kind: 'push', text: 'Medium is solid, Hard is the next step (' + Math.round(h.acc * 100) + '% correct). Practice on Hard and study the rule after misses.' };
    if (est.trend !== null && est.trend < -0.15) return { kind: 'watch', text: 'Recent answers are weaker than earlier ones. Take a break or go back one level to re-establish the rules.' };
    return { kind: 'maintain', text: 'On track. A few questions a week keep this sharp.' };
  }

  // history: array of entries; mods: Trainer.modules(); profileId: key of PROFILES
  function analyse(history, profileId, mods) {
    mods = mods || T.modules();
    const profile = PROFILES[profileId] || PROFILES.balanced;
    const by = {};
    history.forEach((e) => { (by[e[0]] = by[e[0]] || []).push(e); });
    const perModule = {};
    mods.forEach((m) => { perModule[m.id] = estimate(by[m.id] || [], m); });

    const perDomain = {};
    DOMAINS.forEach((d) => {
      const ms = mods.filter((m) => m.domain === d);
      if (!ms.length) { perDomain[d] = { domain: d, score: 50, n: 0, modules: 0, tested: 0, conf: 0 }; return; }
      const ests = ms.map((m) => perModule[m.id]);
      perDomain[d] = {
        domain: d, modules: ms.length, tested: ests.filter((e) => e.n >= 6).length,
        n: ests.reduce((a, e) => a + e.n, 0),
        score: ests.reduce((a, e) => a + e.score, 0) / ests.length,
        conf: ests.reduce((a, e) => a + e.conf, 0) / ests.length,
      };
    });

    const wsum = DOMAINS.reduce((a, d) => a + profile.w[d], 0);
    const overallScore = DOMAINS.reduce((a, d) => a + profile.w[d] * perDomain[d].score, 0) / wsum;
    // rough interval: combine the exercise sds through the weights
    let varSum = 0;
    DOMAINS.forEach((d) => {
      const ms = mods.filter((m) => m.domain === d);
      ms.forEach((m) => {
        const e = perModule[m.id];
        const wm = profile.w[d] / ms.length / wsum;
        const sdScore = (scoreOf(e.theta + e.sd) - scoreOf(e.theta - e.sd)) / 2;
        varSum += wm * wm * sdScore * sdScore;
      });
    });
    const sd = Math.sqrt(varSum);
    const tested = mods.filter((m) => perModule[m.id].n >= 6).length;
    const answered = history.length;
    const overall = {
      score: overallScore, lo: Math.max(0, overallScore - 1.28 * sd), hi: Math.min(100, overallScore + 1.28 * sd),
      band: band(overallScore), coverage: tested / mods.length, tested, total: mods.length, answered,
      confidence: answered < 40 ? 'low' : tested / mods.length < 0.5 ? 'low' : tested / mods.length < 0.85 ? 'medium' : 'high',
    };

    const rows = mods.map((m) => {
      const e = perModule[m.id];
      const wm = profile.w[m.domain] / perDomain[m.domain].modules / wsum;
      const headroom = Math.max(0, TARGET - e.score);
      const gain = wm * 100 * (headroom / 100) * m.learn * 0.5; // overall points if half the gap is closed
      const d = diagnose(m, e);
      return { id: m.id, name: m.name, de: m.de, domain: m.domain, est: e, weight: wm, gain, diag: d, level: suggestLevel(e.score) };
    });
    const focus = rows.filter((r) => r.est.n >= 6 || r.diag.kind === 'measure').slice().sort((a, b) => b.gain - a.gain);
    const measure = rows.filter((r) => r.est.n < 6).sort((a, b) => b.weight - a.weight);
    const strengths = rows.filter((r) => r.est.n >= 6).sort((a, b) => b.est.score - a.est.score).slice(0, 3);
    return { profile: profileId, profileName: profile.name, perModule, perDomain, overall, rows, focus: focus.filter((r) => r.est.n >= 6), measure, strengths };
  }

  // Pick the next exercise and level for adaptive practice: unknown exercises first, then by effort gain.
  function nextSession(analysis, rng, exclude) {
    rng = rng || Math.random;
    const rows = analysis.rows.filter((r) => r.id !== exclude);
    const weights = rows.map((r) => (r.est.n < 6 ? 0.5 + r.weight * 8 : 0.05 + r.gain) * (r.est.n < 6 ? 1 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let x = rng() * total;
    for (let i = 0; i < rows.length; i++) {
      x -= weights[i];
      if (x <= 0) return { id: rows[i].id, level: rows[i].level };
    }
    return { id: rows[0].id, level: rows[0].level };
  }

  const api = { PROFILES, DOMAINS, LEVELS, estimate, analyse, nextSession, suggestLevel, scoreOf, band, TARGET };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Profile = api;
})(typeof self !== 'undefined' ? self : this);
