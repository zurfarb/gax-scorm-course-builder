/* Question component (used by knowledge checks and the final quiz) and the final quiz flow. */
(function (GAX) {
  'use strict';

  var u = GAX.util;
  var h = u.h;
  var t = function (k, v) { return GAX.i18n.t(k, v); };

  function srOnly(text) { return h('span', { class: 'sr-only', text: text }); }

  /* Normalises the option list for each question type. */
  function optionsFor(q) {
    if (q.type === 'truefalse') {
      return [
        { id: 'true', text: t('trueLabel'), correct: q.answer === true },
        { id: 'false', text: t('falseLabel'), correct: q.answer === false }
      ];
    }
    return q.options || [];
  }

  /* Creates an interactive question.
   * opts.shuffle: shuffle options / right-hand matching items
   * opts.headingLevel: 'h2'|'h3' used for the prompt */
  function createQuestion(q, opts) {
    opts = opts || {};
    var name = u.nextId('q-' + q.id);
    var listeners = [];
    var inputs = [];
    var rows = [];
    var multiple = q.type === 'multiple';
    var fieldset = h('fieldset', { class: 'question question--' + q.type, 'data-qid': q.id });
    var legend = h('legend', { class: 'question__prompt' }, [h('span', { html: u.inline(q.prompt) })]);
    fieldset.appendChild(legend);
    if (q.image) fieldset.appendChild(u.image(q.image, 'question__image'));

    var hintKey = q.type === 'multiple' ? 'multipleHint' : q.type === 'matching' ? 'matchingHint' : 'singleHint';
    fieldset.appendChild(h('p', { class: 'question__hint', text: t(hintKey) }));

    function changed() { listeners.forEach(function (fn) { fn(); }); }

    if (q.type === 'matching') {
      var rights = q.pairs.map(function (p) { return { id: p.id, text: p.right }; });
      if (opts.shuffle !== false) rights = u.shuffle(rights);
      var list = h('div', { class: 'matching' });
      q.pairs.forEach(function (pair) {
        var selectId = u.nextId('m');
        var select = h('select', { id: selectId, class: 'matching__select', onchange: changed }, [
          h('option', { value: '', text: t('pleaseChoose') })
        ].concat(rights.map(function (r) { return h('option', { value: r.id, text: r.text }); })));
        var solution = h('p', { class: 'matching__solution', hidden: true });
        var row = h('div', { class: 'matching__row' }, [
          h('label', { class: 'matching__left', for: selectId, html: u.inline(pair.left) }),
          h('div', { class: 'matching__right' }, [select, solution])
        ]);
        rows.push({ pair: pair, select: select, row: row, solution: solution, rights: rights });
        list.appendChild(row);
      });
      fieldset.appendChild(list);
    } else {
      var options = optionsFor(q);
      if (opts.shuffle !== false && q.type !== 'truefalse') options = u.shuffle(options);
      var box = h('div', { class: 'options' });
      options.forEach(function (o) {
        var input = h('input', { type: multiple ? 'checkbox' : 'radio', name: name, value: o.id, class: 'option__input', onchange: changed });
        var status = h('span', { class: 'option__status' });
        var label = h('label', { class: 'option' }, [
          input,
          h('span', { class: 'option__mark', 'aria-hidden': 'true' }),
          h('span', { class: 'option__text', html: u.inline(o.text) }),
          status
        ]);
        inputs.push({ option: o, input: input, label: label, status: status });
        box.appendChild(label);
      });
      fieldset.appendChild(box);
    }

    function getAnswer() {
      if (q.type === 'matching') {
        var map = {};
        rows.forEach(function (r) { map[r.pair.id] = r.select.value; });
        return map;
      }
      var chosen = inputs.filter(function (i) { return i.input.checked; }).map(function (i) { return i.option.id; });
      return multiple ? chosen : (chosen[0] || null);
    }

    function isAnswered() {
      if (q.type === 'matching') return rows.every(function (r) { return r.select.value !== ''; });
      return inputs.some(function (i) { return i.input.checked; });
    }

    function isCorrect() {
      if (q.type === 'matching') return rows.every(function (r) { return r.select.value === r.pair.id; });
      return inputs.every(function (i) { return i.input.checked === !!i.option.correct; });
    }

    function setLocked(locked) {
      inputs.forEach(function (i) { i.input.disabled = locked; });
      rows.forEach(function (r) { r.select.disabled = locked; });
      fieldset.classList.toggle('is-locked', locked);
    }

    function clearMarks() {
      inputs.forEach(function (i) {
        i.label.classList.remove('is-correct', 'is-wrong', 'is-missed');
        i.status.innerHTML = '';
      });
      rows.forEach(function (r) {
        r.row.classList.remove('is-correct', 'is-wrong');
        r.solution.hidden = true;
        r.solution.textContent = '';
      });
    }

    function reset() {
      clearMarks();
      setLocked(false);
      inputs.forEach(function (i) { i.input.checked = false; });
      rows.forEach(function (r) { r.select.value = ''; });
    }

    /* Marks the learner's answer and reveals the correct one. */
    function showSolution() {
      clearMarks();
      inputs.forEach(function (i) {
        var chosen = i.input.checked;
        if (i.option.correct && chosen) {
          i.label.classList.add('is-correct');
          i.status.appendChild(u.icon('check'));
          i.status.appendChild(srOnly(t('quizCorrectAnswer')));
        } else if (i.option.correct) {
          // The mistake is the missing selection: red frame, but the answer itself is right.
          i.label.classList.add('is-missed');
          i.status.appendChild(h('span', { class: 'option__note', text: t('missedAnswer') }));
          i.status.appendChild(u.icon('check'));
        } else if (chosen) {
          i.label.classList.add('is-wrong');
          i.status.appendChild(u.icon('cross'));
          i.status.appendChild(srOnly(t('yourChoice')));
        }
      });
      rows.forEach(function (r) {
        var ok = r.select.value === r.pair.id;
        r.row.classList.add(ok ? 'is-correct' : 'is-wrong');
        if (!ok) {
          r.solution.hidden = false;
          r.solution.textContent = t('quizCorrectAnswer') + ': ' + r.pair.right;
        }
      });
      setLocked(true);
    }

    /* Marks only what the learner chose (right/wrong) without revealing missed answers. */
    function markChosen() {
      clearMarks();
      inputs.forEach(function (i) {
        if (!i.input.checked) return;
        var ok = !!i.option.correct;
        i.label.classList.add(ok ? 'is-correct' : 'is-wrong');
        i.status.appendChild(u.icon(ok ? 'check' : 'cross'));
      });
      rows.forEach(function (r) {
        r.row.classList.add(r.select.value === r.pair.id ? 'is-correct' : 'is-wrong');
      });
    }

    return {
      question: q,
      markChosen: markChosen,
      el: fieldset,
      getAnswer: getAnswer,
      isAnswered: isAnswered,
      isCorrect: isCorrect,
      showSolution: showSolution,
      setLocked: setLocked,
      reset: reset,
      onChange: function (fn) { listeners.push(fn); }
    };
  }

  function feedbackBox(kind, title, bodyHtml) {
    var variant = kind === 'correct' ? 'success' : kind === 'partial' ? 'warning' : 'error';
    var box = h('div', { class: 'feedback feedback--' + variant }, [
      u.icon(kind === 'correct' ? 'check' : 'cross', 'feedback__icon'),
      h('div', { class: 'feedback__body' }, [
        h('p', { class: 'feedback__title', text: title }),
        bodyHtml ? h('div', { class: 'rich', html: bodyHtml }) : null
      ])
    ]);
    return box;
  }

  /* ---------- Final quiz ---------- */

  /* store: {attempts, best, passed}; onResult({score, passed, correct, total}) persists and reports. */
  function FinalQuiz(container, quiz, settings, store, onResult) {
    this.container = container;
    this.quiz = quiz;
    this.settings = settings;
    this.store = store;
    this.onResult = onResult;
    this.renderIntro();
  }

  FinalQuiz.prototype.attemptsLeft = function () {
    var max = this.settings.maxAttempts || 0;
    return max === 0 ? Infinity : Math.max(0, max - (this.store.attempts || 0));
  };

  FinalQuiz.prototype.questionTotal = function () {
    var n = this.quiz.questions.length;
    var count = this.settings.questionCount;
    return count ? Math.min(count, n) : n;
  };

  FinalQuiz.prototype.screen = function (children) {
    var c = this.container;
    c.innerHTML = '';
    u.append(c, children);
    var focusTarget = c.querySelector('[data-focus]') || c.querySelector('h2, h3, legend');
    if (focusTarget) {
      focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
      c.scrollIntoView({ block: 'start', behavior: u.prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  FinalQuiz.prototype.renderIntro = function () {
    var self = this;
    var max = this.settings.maxAttempts || 0;
    var facts = h('ul', { class: 'quiz-facts' }, [
      h('li', null, [u.icon('target'), h('span', { text: t('quizIntroQuestions', { count: this.questionTotal() }) })]),
      h('li', null, [u.icon('flag'), h('span', { text: t('quizIntroPassing', { score: this.settings.passingScore }) })]),
      h('li', null, [u.icon('flip'), h('span', {
        text: max === 0 ? t('quizIntroAttempts') : t('quizIntroAttemptsLimited', { left: this.attemptsLeft(), max: max })
      })])
    ]);
    var children = [
      this.quiz.intro ? h('div', { class: 'rich', html: u.rich(this.quiz.intro) }) : null,
      facts
    ];
    if (this.store.attempts) {
      children.push(h('p', { class: 'quiz-best' }, [
        h('strong', { text: t('quizBest', { score: this.store.best }) }),
        ' — ' + (this.store.passed ? t('passed') : t('failed'))
      ]));
    }
    if (this.attemptsLeft() > 0) {
      children.push(h('button', {
        type: 'button', class: 'btn btn--primary', 'data-focus': true,
        text: this.store.attempts ? t('quizRestart') : t('quizStart'),
        onclick: function () { self.start(); }
      }));
    } else {
      children.push(h('p', { class: 'quiz-note', text: t('quizNoAttemptsLeft') }));
    }
    this.screen(children);
  };

  FinalQuiz.prototype.start = function () {
    var pool = this.quiz.questions.slice();
    if (this.settings.shuffleQuestions !== false) pool = u.shuffle(pool);
    pool = pool.slice(0, this.questionTotal());
    var shuffleOptions = this.settings.shuffleOptions !== false;
    this.items = pool.map(function (q) { return createQuestion(q, { shuffle: shuffleOptions }); });
    this.index = 0;
    this.renderQuestion();
  };

  FinalQuiz.prototype.renderQuestion = function () {
    var self = this;
    var item = this.items[this.index];
    var total = this.items.length;
    var isLast = this.index === total - 1;
    var hint = h('p', { class: 'quiz-hint', 'aria-live': 'polite' });
    var next = h('button', {
      type: 'button', class: 'btn btn--primary',
      text: isLast ? t('quizSubmit') : t('next'),
      onclick: function () {
        if (!item.isAnswered()) { hint.textContent = t('quizAnswerFirst'); return; }
        if (isLast) self.submit();
        else { self.index += 1; self.renderQuestion(); }
      }
    });
    var back = this.index > 0 ? h('button', {
      type: 'button', class: 'btn btn--secondary', text: t('previous'),
      onclick: function () { self.index -= 1; self.renderQuestion(); }
    }) : null;
    item.onChange(function () { if (item.isAnswered()) hint.textContent = ''; });

    var progress = h('div', { class: 'quiz-progress' }, [
      h('p', { class: 'quiz-progress__label', 'data-focus': true, text: t('quizQuestionOf', { current: this.index + 1, total: total }) }),
      h('div', { class: 'quiz-progress__bar', 'aria-hidden': 'true' }, [
        h('span', { style: 'width:' + Math.round(((this.index + 1) / total) * 100) + '%' })
      ])
    ]);
    this.screen([progress, item.el, hint, h('div', { class: 'btn-row' }, [back, next])]);
  };

  FinalQuiz.prototype.submit = function () {
    var correct = this.items.filter(function (i) { return i.isCorrect(); }).length;
    var total = this.items.length;
    var score = Math.round((correct / total) * 100);
    var passed = score >= this.settings.passingScore;
    this.onResult({ score: score, passed: passed, correct: correct, total: total });
    this.renderResult({ score: score, passed: passed, correct: correct, total: total });
  };

  FinalQuiz.prototype.renderResult = function (r) {
    var self = this;
    var children = [
      h('div', { class: 'result result--' + (r.passed ? 'passed' : 'failed') }, [
        h('h2', { class: 'result__title', 'data-focus': true, text: t('quizResultTitle') }),
        h('p', { class: 'result__score', text: r.score + (GAX.i18n.language() === 'de-CH' ? ' %' : '%') }),
        h('p', { class: 'result__detail', text: t('quizScore', r) }),
        h('p', { class: 'result__verdict' }, [
          u.icon(r.passed ? 'check' : 'cross'),
          h('strong', { text: r.passed ? t('quizPassed') : t('quizFailed', { score: this.settings.passingScore }) })
        ]),
        this.store.attempts > 1 ? h('p', { class: 'result__best', text: t('quizBest', { score: this.store.best }) }) : null
      ])
    ];
    if (this.attemptsLeft() > 0) {
      children.push(h('div', { class: 'btn-row' }, [h('button', {
        type: 'button', class: 'btn btn--secondary', text: t('quizRestart'),
        onclick: function () { self.start(); }
      })]));
    }
    var review = h('section', { class: 'review', 'aria-label': t('quizReview') }, [h('h3', { class: 'review__title', text: t('quizReview') })]);
    this.items.forEach(function (item, idx) {
      var ok = item.isCorrect();
      var q = item.question;
      var entry = h('div', { class: 'review__item' }, [
        h('p', { class: 'review__number' }, [
          u.icon(ok ? 'check' : 'cross', ok ? 'is-correct' : 'is-wrong'),
          h('span', { text: t('quizQuestionOf', { current: idx + 1, total: self.items.length }) + ' — ' + (ok ? t('correct') : t('incorrect')) })
        ])
      ]);
      if (self.settings.showSolutions !== false) {
        item.showSolution();
        entry.appendChild(item.el);
        var body = (ok ? q.feedback.correct : q.feedback.incorrect) || '';
        if (q.explanation) body += '\n\n' + q.explanation;
        if (body.trim()) entry.appendChild(h('div', { class: 'review__explanation rich', html: u.rich(body) }));
      } else {
        entry.appendChild(h('p', { class: 'review__prompt', html: u.inline(q.prompt) }));
      }
      review.appendChild(entry);
    });
    children.push(review);
    this.screen(children);
  };

  GAX.questions = { create: createQuestion, feedbackBox: feedbackBox };
  GAX.FinalQuiz = FinalQuiz;
})(window.GAX = window.GAX || {});
