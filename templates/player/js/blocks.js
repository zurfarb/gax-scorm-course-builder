/* Renderers for content blocks. Each renderer returns a DOM element. */
(function (GAX) {
  'use strict';

  var u = GAX.util;
  var h = u.h;
  var t = function (k, v) { return GAX.i18n.t(k, v); };

  function blockTitle(text) {
    return text ? h('h3', { class: 'block__title', html: u.inline(text) }) : null;
  }

  var CALLOUT_VARIANT = { info: 'info', tip: 'success', warning: 'warning', important: 'error' };

  var renderers = {
    text: function (b) {
      return h('div', { class: 'block block--text rich' + (b.lead ? ' rich--lead' : ''), html: u.rich(b.body) });
    },

    image: function (b) {
      return h('div', { class: 'block block--image' }, [u.image(b.image)]);
    },

    'text-image': function (b) {
      return h('div', { class: 'block block--text-image media media--image-' + (b.imagePosition || 'right') }, [
        h('div', { class: 'media__text rich', html: u.rich(b.body) }),
        h('div', { class: 'media__image' }, [u.image(b.image)])
      ]);
    },

    callout: function (b) {
      var variant = CALLOUT_VARIANT[b.variant] || 'info';
      return h('aside', { class: 'block callout callout--' + variant, 'aria-label': t('callout.' + b.variant) }, [
        u.icon(b.variant, 'callout__icon'),
        h('div', { class: 'callout__body' }, [
          h('p', { class: 'callout__title', text: b.title || t('callout.' + b.variant) }),
          h('div', { class: 'rich', html: u.rich(b.body) })
        ])
      ]);
    },

    accordion: function (b) {
      return h('div', { class: 'block block--accordion' }, [
        blockTitle(b.title),
        h('div', { class: 'accordion' }, b.items.map(function (item) {
          return h('details', { class: 'accordion__item' }, [
            h('summary', { class: 'accordion__summary' }, [
              h('span', { html: u.inline(item.title) }),
              u.icon('right', 'accordion__chevron')
            ]),
            h('div', { class: 'accordion__panel' }, [
              h('div', { class: 'rich', html: u.rich(item.body) }),
              u.image(item.image)
            ])
          ]);
        }))
      ]);
    },

    tabs: function (b) {
      var base = u.nextId('tabs');
      var tabs = [];
      var panels = [];
      var list = h('div', { class: 'tabs__list', role: 'tablist' });

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var active = i === index;
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.tabIndex = active ? 0 : -1;
          panels[i].hidden = !active;
        });
        if (focus) tabs[index].focus();
      }

      b.items.forEach(function (item, i) {
        var tab = h('button', {
          type: 'button', role: 'tab', class: 'tabs__tab', id: base + '-tab-' + i,
          'aria-controls': base + '-panel-' + i, html: u.inline(item.title),
          onclick: function () { select(i, false); },
          onkeydown: function (e) {
            var n = b.items.length;
            var target = null;
            if (e.key === 'ArrowRight') target = (i + 1) % n;
            else if (e.key === 'ArrowLeft') target = (i - 1 + n) % n;
            else if (e.key === 'Home') target = 0;
            else if (e.key === 'End') target = n - 1;
            if (target !== null) { e.preventDefault(); select(target, true); }
          }
        });
        var panel = h('div', {
          role: 'tabpanel', class: 'tabs__panel', id: base + '-panel-' + i,
          'aria-labelledby': base + '-tab-' + i, tabindex: '0'
        }, [h('div', { class: 'rich', html: u.rich(item.body) }), u.image(item.image)]);
        tabs.push(tab);
        panels.push(panel);
        list.appendChild(tab);
      });
      var el = h('div', { class: 'block block--tabs' }, [blockTitle(b.title), h('div', { class: 'tabs' }, [list].concat(panels))]);
      select(0, false);
      return el;
    },

    steps: function (b) {
      return h('div', { class: 'block block--steps' }, [
        blockTitle(b.title),
        h('ol', { class: 'steps' }, b.items.map(function (item, i) {
          return h('li', { class: 'steps__item' }, [
            h('span', { class: 'steps__number', 'aria-hidden': 'true', text: String(i + 1) }),
            h('div', { class: 'steps__content' }, [
              h('p', { class: 'steps__title' }, [h('span', { class: 'sr-only', text: t('stepsTitle', { n: i + 1 }) + ': ' }), h('span', { html: u.inline(item.title) })]),
              h('div', { class: 'rich', html: u.rich(item.body) }),
              u.image(item.image)
            ])
          ]);
        }))
      ]);
    },

    flipcards: function (b) {
      return h('div', { class: 'block block--flipcards' }, [
        blockTitle(b.title),
        h('p', { class: 'block__hint', text: t('flipHint') }),
        h('div', { class: 'flipcards' }, b.cards.map(function (card) {
          var front = h('span', { class: 'flipcard__face flipcard__front' }, [
            h('span', { class: 'flipcard__term', html: u.inline(card.front) }),
            u.icon('flip', 'flipcard__icon')
          ]);
          var back = h('span', { class: 'flipcard__face flipcard__back rich', html: u.rich(card.back), 'aria-hidden': 'true' });
          var btn = h('button', {
            type: 'button', class: 'flipcard', 'aria-pressed': 'false',
            onclick: function () {
              var flipped = btn.getAttribute('aria-pressed') !== 'true';
              btn.setAttribute('aria-pressed', flipped ? 'true' : 'false');
              back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
              front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
            }
          }, [h('span', { class: 'flipcard__inner' }, [front, back])]);
          return btn;
        }))
      ]);
    },

    check: function (b) {
      var q = b.question;
      var item = GAX.questions.create(q, { shuffle: true });
      var feedback = h('div', { class: 'check__feedback', 'aria-live': 'polite' });
      var actions = h('div', { class: 'btn-row' });

      function button(label, cls, fn) {
        return h('button', { type: 'button', class: 'btn ' + cls, text: label, onclick: fn });
      }

      function showActions(list) {
        actions.innerHTML = '';
        list.forEach(function (b) { actions.appendChild(b); });
      }

      function check() {
        if (!item.isAnswered()) {
          feedback.innerHTML = '';
          feedback.appendChild(h('p', { class: 'quiz-hint', text: t('quizAnswerFirst') }));
          return;
        }
        var ok = item.isCorrect();
        item.setLocked(true);
        feedback.innerHTML = '';
        var body = ok ? q.feedback.correct : q.feedback.incorrect;
        feedback.appendChild(GAX.questions.feedbackBox(ok ? 'correct' : 'incorrect', ok ? t('correct') : t('incorrect'), u.rich(body)));
        if (ok) {
          if (q.explanation) feedback.appendChild(h('div', { class: 'rich check__explanation', html: u.rich(q.explanation) }));
          item.showSolution();
          showActions([]);
        } else {
          item.markChosen();
          showActions([
            button(t('tryAgain'), 'btn--secondary', function () { item.reset(); feedback.innerHTML = ''; showActions([checkBtn]); }),
            button(t('showSolution'), 'btn--tertiary', function () {
              item.showSolution();
              if (q.explanation) feedback.appendChild(h('div', { class: 'rich check__explanation', html: u.rich(q.explanation) }));
              showActions([]);
            })
          ]);
        }
      }

      var checkBtn = button(t('checkAnswer'), 'btn--primary', check);
      showActions([checkBtn]);
      return h('section', { class: 'block check', 'aria-label': t('knowledgeCheck') }, [
        h('p', { class: 'badge', text: t('knowledgeCheck') }),
        item.el, actions, feedback
      ]);
    },

    scenario: function (b) {
      var feedback = h('div', { class: 'scenario__feedback', 'aria-live': 'polite' });
      var buttons = [];
      var choices = h('div', { class: 'scenario__choices' }, b.choices.map(function (choice) {
        var btn = h('button', {
          type: 'button', class: 'scenario__choice', 'aria-pressed': 'false', html: u.inline(choice.text),
          onclick: function () {
            buttons.forEach(function (other) {
              other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
            });
            btn.classList.add(choice.correct ? 'is-correct' : 'is-wrong', 'is-tried');
            feedback.innerHTML = '';
            feedback.appendChild(GAX.questions.feedbackBox(
              choice.correct ? 'correct' : 'incorrect',
              choice.correct ? t('correct') : t('incorrect'),
              u.rich(choice.feedback)
            ));
          }
        });
        buttons.push(btn);
        return btn;
      }));
      return h('section', { class: 'block scenario', 'aria-label': b.title || t('scenario') }, [
        h('p', { class: 'badge', text: t('scenario') }),
        blockTitle(b.title),
        h('div', { class: 'scenario__situation' }, [
          b.image ? u.image(b.image, 'scenario__image') : null,
          h('div', { class: 'rich', html: u.rich(b.situation) })
        ]),
        h('p', { class: 'block__hint', text: t('chooseOption') }),
        choices,
        feedback
      ]);
    },

    summary: function (b) {
      return h('section', { class: 'block summary' }, [
        h('h3', { class: 'summary__title', text: b.title || t('summaryTitle') }),
        h('ul', { class: 'summary__list' }, b.items.map(function (item) {
          return h('li', null, [u.icon('check', 'summary__icon'), h('span', { html: u.inline(item) })]);
        }))
      ]);
    }
  };

  GAX.blocks = {
    render: function (block) {
      var fn = renderers[block.type];
      if (!fn) {
        if (window.console) console.warn('Unknown block type', block.type);
        return h('div', { class: 'block block--unknown' });
      }
      return fn(block);
    }
  };
})(window.GAX = window.GAX || {});
