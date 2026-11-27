/* Memory and speed tasks: word memory, number memory, working memory, picture memory,
 * concentration (d2-style counting) and perceptual speed. Every answer is fixed by construction. */
(function (root) {
  'use strict';
  const T = root.Trainer || require('./core.js');
  const CE = root.CubeEngine || require('./engine.js');
  const { ri, pick, shuffle, weighted, sample, esc } = T.util;

  const WORDS = ('Tisch Stuhl Lampe Fenster Tür Schrank Teppich Spiegel Kissen Decke Uhr Bild Buch Heft Stift Schere Messer Gabel Löffel Teller ' +
    'Tasse Glas Flasche Topf Pfanne Brot Käse Butter Apfel Birne Banane Kirsche Tomate Gurke Karotte Kartoffel Zwiebel Hund Katze Pferd Kuh ' +
    'Schaf Ziege Hase Fuchs Wolf Bär Adler Taube Fisch Frosch Schlange Biene Ameise Baum Blume Wiese Wald Berg Fluss See Meer Strand Insel ' +
    'Brücke Straße Haus Dach Garten Zaun Auto Bus Zug Schiff Fahrrad Flugzeug Ball Puppe Drachen Geige Gitarre Trommel Hut Mütze Schal ' +
    'Handschuh Schuh Socke Jacke Hose Kleid Brille Ring Kette Schlüssel Koffer Rucksack Regenschirm Sonne Mond Stern Wolke Regen Schnee Wind ' +
    'Feuer Kerze Hammer Zange Säge Nagel Leiter Eimer Seife Handtuch Zahnbürste Kamm Telefon Computer').split(' ');

  const list = (items) => '<ol class="words">' + items.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ol>';

  // ---------- word memory ----------
  T.register({
    id: 'wordmem', name: 'Word memory', de: 'Merkaufgabe (Wörter)', domain: 'memory', n: 10, secs: 420, refSecs: 20, learn: 0.7, options: 5,
    desc: {
      easy: 'Six words, 25 seconds. Which word was missing, or which stood at a given place?',
      medium: 'Eight words. Also asks which word came right after another one.',
      hard: 'Ten words in 22 seconds, mostly order questions.',
    },
    tips: [
      'Link the words into one story or walk them through a familiar room (method of loci). Pictures stick better than words.',
      'Say the first letters aloud in your head: an acronym helps to keep the order.',
      'Do not re-read the list from the top: refresh the weakest middle part last.',
      'Order questions need the story, not just the words, so make the story follow the list order.',
    ],
    make(level, rng) {
      const cfg = { easy: { k: 6, secs: 25 }, medium: { k: 8, secs: 25 }, hard: { k: 10, secs: 22 } }[level];
      const words = sample(WORDS, cfg.k, rng);
      const kind = weighted(level === 'easy' ? [['missing', 0.5], ['pos', 0.5]]
        : level === 'medium' ? [['missing', 0.35], ['pos', 0.4], ['next', 0.25]]
        : [['missing', 0.2], ['pos', 0.35], ['next', 0.45]], rng);
      const study = { html: list(words), secs: cfg.secs, label: 'Memorise the words (in this order)' };
      const base = { lang: 'de', study, optionStyle: 'grid', stimulusClass: 'plain' };
      const listText = words.join(', ');
      if (kind === 'missing') {
        const fresh = sample(WORDS.filter((w) => !words.includes(w)), 1, rng)[0];
        const opts = shuffle(sample(words, 4, rng).concat([fresh]), rng);
        return Object.assign(base, { prompt: 'Welches Wort stand NICHT in der Liste?', options: opts, answer: opts.indexOf(fresh), explain: '„' + fresh + '“ kam in der Liste nicht vor. Die Liste lautete: ' + listText + '.' });
      }
      if (kind === 'pos') {
        const i = ri(0, cfg.k - 1, rng);
        const opts = shuffle([words[i]].concat(sample(words.filter((_, j) => j !== i), 4, rng)), rng);
        return Object.assign(base, { prompt: 'Welches Wort stand an Position ' + (i + 1) + '?', options: opts, answer: opts.indexOf(words[i]), explain: 'An Position ' + (i + 1) + ' stand „' + words[i] + '“. Die Liste lautete: ' + listText + '.' });
      }
      const i = ri(0, cfg.k - 2, rng);
      const opts = shuffle([words[i + 1]].concat(sample(words.filter((_, j) => j !== i + 1 && j !== i), 4, rng)), rng);
      return Object.assign(base, { prompt: 'Welches Wort stand direkt nach „' + words[i] + '“?', options: opts, answer: opts.indexOf(words[i + 1]), explain: 'Nach „' + words[i] + '“ kam „' + words[i + 1] + '“. Die Liste lautete: ' + listText + '.' });
    },
  });

  // ---------- number memory ----------
  T.register({
    id: 'nummem', name: 'Number memory', de: 'Zahlengedächtnis', domain: 'memory', n: 10, secs: 420, refSecs: 14, learn: 0.7, options: 0,
    desc: {
      easy: 'Six digits, same order.',
      medium: 'Eight digits, same order.',
      hard: 'Eight digits, typed in reverse order.',
    },
    tips: [
      'Chunk the digits into pairs or triples and read them as numbers (48 17 35 …).',
      'Rehearse silently in rhythm, not digit by digit.',
      'For reverse order, memorise the chunks and reverse the chunk order first, then each chunk.',
    ],
    make(level, rng) {
      const cfg = { easy: { len: 6, secs: 6, back: false }, medium: { len: 8, secs: 8, back: false }, hard: { len: 8, secs: 8, back: true } }[level];
      const d = [];
      while (d.length < cfg.len) {
        const x = ri(d.length ? 0 : 1, 9, rng);
        if (d.length && x === d[d.length - 1]) continue;
        d.push(x);
      }
      const shown = d.join(' ');
      const ans = (cfg.back ? d.slice().reverse() : d).join('');
      return {
        kind: 'typed', study: { html: '<div class="digits">' + shown + '</div>', secs: cfg.secs, label: 'Memorise the digits' },
        prompt: cfg.back ? 'Type the digits in REVERSE order.' : 'Type the digits in the same order.',
        typedAnswer: ans, stimulusClass: 'plain',
        explain: 'The digits were ' + shown + (cfg.back ? '; reversed that is ' + ans.split('').join(' ') + '.' : '.'),
      };
    },
  });

  // ---------- working memory: letter-number sequencing ----------
  T.register({
    id: 'letnum', name: 'Working memory', de: 'Arbeitsgedächtnis', domain: 'memory', n: 10, secs: 480, refSecs: 20, learn: 0.7, options: 0,
    desc: {
      easy: 'Four items: sort the numbers, then the letters.',
      medium: 'Six items.',
      hard: 'Eight items, shown for a short time.',
    },
    tips: [
      'Do not rehearse in the shown order. Sort the numbers first while you still see them, then the letters.',
      'Hold the numbers as one chunk and the letters as another.',
      'Type numbers first (smallest to largest), then the letters (A to Z), with no spaces.',
    ],
    make(level, rng) {
      const cfg = { easy: { nd: 2, nl: 2, secs: 6 }, medium: { nd: 3, nl: 3, secs: 7 }, hard: { nd: 4, nl: 4, secs: 7 } }[level];
      const digits = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], cfg.nd, rng);
      const letters = sample('ABDEFGHKLMNPRSTUZ'.split(''), cfg.nl, rng);
      const mixed = shuffle(digits.concat(letters), rng);
      const ans = digits.slice().sort((a, b) => a - b).join('') + letters.slice().sort().join('');
      return {
        kind: 'typed', study: { html: '<div class="digits">' + mixed.join(' ') + '</div>', secs: cfg.secs, label: 'Memorise the items' },
        prompt: 'Type the numbers from smallest to largest, then the letters from A to Z.',
        typedAnswer: ans, stimulusClass: 'plain',
        explain: 'Shown: ' + mixed.join(' ') + '. Numbers sorted: ' + ans.replace(/[A-Z]/g, '') + ', letters sorted: ' + ans.replace(/[0-9]/g, '') + '.',
      };
    },
  });

  // ---------- picture memory ----------
  const SYMS = Object.keys(CE.SYMBOLS);
  const symG = (name, x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + CE.SYMBOLS[name].svg + '</g>';
  function gridSvg(cols, rows, cells, target) {
    const W = cols * 60, H = rows * 60;
    let out = '<svg class="fig cube" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="symbol grid">';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const isT = target === idx;
        out += '<rect x="' + (c * 60 + 3) + '" y="' + (r * 60 + 3) + '" width="54" height="54" rx="4" fill="var(--paper)" stroke="' + (isT ? 'var(--accent)' : 'var(--ink)') + '" stroke-width="' + (isT ? 3.5 : 1.6) + '"/>';
        if (isT) out += '<text x="' + (c * 60 + 30) + '" y="' + (r * 60 + 40) + '" text-anchor="middle" font-size="30" font-weight="700" fill="var(--accent)" font-family="system-ui, sans-serif">?</text>';
        else if (cells) out += symG(cells[idx], c * 60 + 30, r * 60 + 30, 21);
      }
    }
    return out + '</svg>';
  }
  const oneSym = (name) => '<svg class="fig cube" viewBox="-1.4 -1.4 2.8 2.8" role="img" aria-label="symbol"><rect x="-1.2" y="-1.2" width="2.4" height="2.4" rx="0.15" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>' + CE.SYMBOLS[name].svg + '</svg>';

  T.register({
    id: 'picmem', name: 'Picture memory', de: 'Bildgedächtnis', domain: 'memory', n: 10, secs: 420, refSecs: 18, learn: 0.7, options: 5,
    desc: {
      easy: 'Six symbols in a 3×2 grid, 10 seconds.',
      medium: 'Nine symbols in a 3×3 grid.',
      hard: 'Twelve symbols in a 4×3 grid, 14 seconds.',
    },
    tips: [
      'Scan in a fixed order (rows, left to right) every time so positions become a sequence.',
      'Name every symbol with a short word (“ring”, “dash”, “arrow”) and tell yourself the grid as a sentence.',
      'Notice neighbours (“ring next to arrow”): relations are easier to recall than coordinates.',
    ],
    make(level, rng) {
      const cfg = { easy: { cols: 3, rows: 2, secs: 10 }, medium: { cols: 3, rows: 3, secs: 12 }, hard: { cols: 4, rows: 3, secs: 14 } }[level];
      const n = cfg.cols * cfg.rows;
      const cells = sample(SYMS, n, rng);
      const t = ri(0, n - 1, rng);
      const ans = cells[t];
      const opts = shuffle([ans].concat(sample(SYMS.filter((s) => s !== ans), 4, rng)), rng);
      return {
        study: { html: gridSvg(cfg.cols, cfg.rows, cells, -1), secs: cfg.secs, label: 'Memorise the symbols and their places' },
        stimulus: gridSvg(cfg.cols, cfg.rows, null, t), stimulusClass: 'paper', stimulusTag: 'Grid',
        prompt: 'Which symbol was in the marked cell?', optionStyle: 'figure',
        options: opts.map((s) => ({ html: oneSym(s) })), answer: opts.indexOf(ans),
        explain: 'The marked cell (row ' + (Math.floor(t / cfg.cols) + 1) + ', column ' + ((t % cfg.cols) + 1) + ') held the symbol “' + ans + '”.',
      };
    },
  });

  // ---------- concentration (d2-style) ----------
  function charSvg(x, y, letter, up, down) {
    let g = '<text x="' + (x + 13) + '" y="' + (y + 31) + '" text-anchor="middle" font-size="27" font-weight="600" fill="var(--ink)" font-family="system-ui, -apple-system, Helvetica, Arial, sans-serif">' + letter + '</text>';
    const marks = (n, y1, y2) => (n === 1 ? [13] : n === 2 ? [9, 17] : []).map((mx) => '<line x1="' + (x + mx) + '" y1="' + (y + y1) + '" x2="' + (x + mx) + '" y2="' + (y + y2) + '" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>').join('');
    return g + marks(up, 3, 11) + marks(down, 37, 45);
  }
  T.register({
    id: 'count', name: 'Concentration', de: 'Konzentrationstest (d2)', domain: 'speed', n: 10, secs: 360, refSecs: 25, learn: 0.8, options: 0,
    desc: {
      easy: 'Two short rows, about three targets.',
      medium: 'Two longer rows.',
      hard: 'Three dense rows, up to ten targets.',
    },
    tips: [
      'Target = the letter d with exactly two marks in total (two above, two below, or one above and one below).',
      'Go along the row in one pass and keep a running count. Do not recount unless you lost your place.',
      'Decide on the letter first (d or p), then count the marks. A p with two marks is a trap.',
    ],
    make(level, rng) {
      const cfg = { easy: { n: 16, rows: 2, max: 6 }, medium: { n: 26, rows: 2, max: 8 }, hard: { n: 36, rows: 3, max: 11 } }[level];
      for (let tries = 0; tries < 200; tries++) {
        const items = [];
        for (let i = 0; i < cfg.n; i++) {
          let up, down;
          do { up = ri(0, 2, rng); down = ri(0, 2, rng); } while (up + down < 1);
          items.push({ letter: rng() < 0.55 ? 'd' : 'p', up, down });
        }
        const hits = items.filter((c) => c.letter === 'd' && c.up + c.down === 2).length;
        if (hits < 1 || hits > cfg.max) continue;
        const cols = Math.ceil(cfg.n / cfg.rows);
        let svg = '<svg class="fig" viewBox="0 0 ' + cols * 26 + ' ' + cfg.rows * 50 + '" role="img" aria-label="rows of the letters d and p with marks">';
        items.forEach((c, i) => { svg += charSvg((i % cols) * 26, Math.floor(i / cols) * 50, c.letter, c.up, c.down); });
        svg += '</svg>';
        return {
          stimulus: svg, stimulusClass: 'paper', stimulusTag: 'Rows', kind: 'typed', typedAnswer: String(hits),
          prompt: 'How many d have exactly two marks (above, below or both)?',
          explain: 'There are ' + hits + ' d with exactly two marks in total.',
        };
      }
      throw new Error('count generator failed');
    },
  });

  // ---------- perceptual speed ----------
  const LOOK = { O: '0', '0': 'O', I: '1', '1': 'I', S: '5', '5': 'S', B: '8', '8': 'B', Z: '2', '2': 'Z', G: '6', '6': 'G' };
  T.register({
    id: 'perceptual', name: 'Perceptual speed', de: 'Wahrnehmungsgeschwindigkeit', domain: 'speed', n: 20, secs: 150, refSecs: 6, learn: 0.8, options: 2,
    desc: {
      easy: 'Seven letters; one swapped letter or none.',
      medium: 'Ten letters and digits.',
      hard: 'Thirteen characters with look-alikes (O/0, I/1, S/5).',
    },
    tips: [
      'Compare in blocks of three characters, not one by one.',
      'If you find the first difference you are done: stop reading the rest.',
      'Do not re-check “identical” answers twice: speed counts as much as accuracy in a timed test.',
    ],
    make(level, rng) {
      const cfg = { easy: { len: 7, pool: 'ABDEFGHKLMNPRTUVWXY' }, medium: { len: 10, pool: 'ABDEFGHKLMNPRTUVWXY23456789' }, hard: { len: 13, pool: 'ABDEFGHKLMNPRTUVWXYOIS0158Z2G6' } }[level];
      const a = [];
      for (let i = 0; i < cfg.len; i++) a.push(pick(cfg.pool.split(''), rng));
      const same = rng() < 0.5;
      const b = a.slice();
      let note = 'Both rows are identical.';
      if (!same) {
        const mode = weighted(level === 'hard' ? [['look', 0.45], ['swap', 0.3], ['sub', 0.25]] : [['swap', 0.4], ['sub', 0.6]], rng);
        const i = ri(0, cfg.len - 2, rng);
        let done = false;
        if (mode === 'look' && LOOK[a[i]]) { b[i] = LOOK[a[i]]; done = true; }
        if (!done && mode !== 'sub' && a[i] !== a[i + 1]) { b[i] = a[i + 1]; b[i + 1] = a[i]; done = true; }
        while (!done) {
          const c = pick(cfg.pool.split(''), rng);
          if (c !== a[i]) { b[i] = c; done = true; }
        }
        note = 'The rows differ at position ' + (i + 1) + ': ' + a[i] + ' versus ' + b[i] + '.';
      }
      const A = a.join(''), B = b.join('');
      return {
        stimulus: '<div class="pair"><div class="mono">' + A + '</div><div class="mono">' + B + '</div></div>', stimulusClass: 'plain', stimulusTag: 'Compare',
        prompt: 'Are the two rows identical?', optionStyle: 'grid', options: ['Identical', 'Different'], answer: same ? 0 : 1, explain: note,
      };
    },
  });
})(typeof self !== 'undefined' ? self : this);
