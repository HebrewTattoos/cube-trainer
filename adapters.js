/* Registers the two original task types (cubes, number series) with the Trainer registry. */
(function (root) {
  'use strict';
  const T = root.Trainer || require('./core.js');
  const CE = root.CubeEngine || require('./engine.js');
  const SE = root.SeriesEngine || require('./series.js');
  const L = 'abcde';

  T.register({
    id: 'cubes', name: 'Cubes', de: 'Würfelaufgaben', domain: 'spatial', n: 10, secs: 300, refSecs: 25, learn: 0.8, options: 4,
    desc: {
      easy: 'Mostly plain symbols. Wrong cubes tend to have the wrong faces next to each other.',
      medium: 'Half of the faces have a direction. Wrong cubes may be a symbol turned by 90°.',
      hard: 'Mostly turned symbols, and sometimes the answer shows none of the faces you saw in the sample.',
    },
    tips: [
      'All six faces of a cube are different, and every question is generated fresh, so you can’t memorise answers.',
      'Find two faces that appear in both the sample and an option, then check which side of which face the other symbol sits.',
      'Symbols without direction (circle, cross, dot) only tell you which face is which. Lines, diagonals and triangles also tell you how the face is turned.',
      'Rule out options first: a wrong cube usually has two faces swapped, a symbol turned by 90°, or a face that can’t sit next to the others.',
      'Opposite faces never appear together. If one option shows two faces that you know are opposite, it is wrong.',
    ],
    make(level, rng) {
      const q = CE.makeQuestion(level, rng);
      return {
        prompt: 'Which cube is the same one, turned?',
        stimulus: CE.renderCube(q.sample, { label: 'sample cube' }),
        stimulusClass: 'paper', stimulusTag: 'Sample',
        optionStyle: 'figure',
        options: q.options.map((o, i) => ({ html: CE.renderCube(o.state, { label: 'option ' + L[i] }) })),
        answer: q.answer,
        explain: 'Cube ' + L[q.answer] + ' is the sample turned. The others have two faces swapped, a symbol turned by 90°, or a face that cannot sit next to the other two.',
      };
    },
  });

  T.register({
    id: 'numseries', name: 'Number series', de: 'Zahlenreihen', domain: 'numerical', n: 10, secs: 360, refSecs: 30, learn: 0.9, options: 5,
    desc: {
      easy: 'Steady steps, multiplying or halving, steps that grow by one, square numbers.',
      medium: 'Two series woven together, “×2 + 1” rules, sums of the two numbers before, steps that grow by 2 or 3.',
      hard: 'Layered rules: add and double in turns, cubes, primes, steps that double, sums plus a constant.',
    },
    tips: [
      'Write the gaps between neighbours first. Equal gaps mean a steady step; gaps that change by a fixed amount mean a growing step.',
      'If the gaps look random, try ratios (÷ the previous number). A constant ratio means multiplying.',
      'Numbers jumping up and down usually mean two series woven together. Look at every second number on its own.',
      'Sums of the two numbers before (1, 2, 3, 5, 8 …) show up a lot. So do squares (1, 4, 9 …), cubes (1, 8, 27 …) and primes.',
      'Every series here has exactly one answer that fits all rules a test would use. After each answer in practice you see the rule.',
    ],
    make(level, rng) {
      const q = SE.makeQuestion(level, rng);
      return {
        prompt: 'Which number continues the series?',
        stimulus: '<div class="terms">' + q.terms.map((t) => '<span class="term">' + t + '</span>').join('') + '<span class="term q">?</span></div>',
        stimulusClass: 'plain', stimulusTag: 'Series',
        optionStyle: 'grid',
        options: q.options.map(String),
        answer: q.answer,
        typedAnswer: q.value,
        explain: q.explain,
      };
    },
  });
})(typeof self !== 'undefined' ? self : this);
