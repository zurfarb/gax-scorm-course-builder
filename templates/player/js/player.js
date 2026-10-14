/* Course player: page model, navigation, progress, resume and LMS reporting.
 * Expects window.GAX_COURSE (course JSON) and window.GAX_BUILD ({scorm: '1.2'|'2004'|'preview'}). */
(function (GAX) {
  'use strict';

  var u = GAX.util;
  var h = u.h;
  var t = function (k, v) { return GAX.i18n.t(k, v); };

  var DEFAULT_QUIZ = { passingScore: 80, maxAttempts: 0, shuffleQuestions: true, shuffleOptions: true, showSolutions: true, questionCount: null };

  /* ---------- Page model ---------- */

  function buildPages(course) {
    var pages = [{ kind: 'start', id: '_start', title: t('start'), required: true, chapterIndex: -1 }];
    course.chapters.forEach(function (chapter, ci) {
      chapter.pages.forEach(function (page, pi) {
        pages.push({ kind: 'content', id: page.id, title: page.title, chapter: chapter, chapterIndex: ci, pageIndex: pi, page: page, required: true });
      });
    });
    if (course.quiz && course.quiz.questions && course.quiz.questions.length) {
      pages.push({ kind: 'quiz', id: '_quiz', title: course.quiz.title || t('quiz'), required: false, chapterIndex: course.chapters.length });
    }
    pages.push({ kind: 'end', id: '_end', title: t('end'), required: false, chapterIndex: course.chapters.length + 1 });
    pages.forEach(function (p, i) { p.index = i; });
    return pages;
  }

  /* ---------- Suspend data (compact, must fit 4096 chars in SCORM 1.2) ---------- */

  function encodeVisited(visited, count) {
    var bits = '';
    for (var i = 0; i < count; i++) bits += visited[i] ? '1' : '0';
    var hex = '';
    for (var j = 0; j < bits.length; j += 4) hex += parseInt((bits.slice(j, j + 4) + '000').slice(0, 4), 2).toString(16);
    return hex;
  }

  function decodeVisited(hex, count) {
    var visited = {};
    var bits = '';
    for (var i = 0; i < hex.length; i++) bits += ('000' + parseInt(hex[i], 16).toString(2)).slice(-4);
    for (var k = 0; k < count && k < bits.length; k++) if (bits[k] === '1') visited[k] = true;
    return visited;
  }

  /* ---------- Player ---------- */

  function Player(course, build) {
    this.course = course;
    this.build = build;
    this.settings = course.settings || {};
    this.quizSettings = Object.assign({}, DEFAULT_QUIZ, this.settings.quiz || {});
    GAX.i18n.setLanguage(course.language);
    document.documentElement.lang = course.language;
    this.pages = buildPages(course);
    this.visited = {};
    this.quizState = { attempts: 0, best: 0, passed: false };
    this.current = 0;
    var previewKey = 'gax-preview:' + course.id + ':' + course.language + ':' + course.version;
    this.scorm = new GAX.Scorm(build.scorm, previewKey);
    this.scorm.init();
    this.restore();
    this.renderShell();
    var self = this;
    function leave() {
      if (self.resetting) return;
      self.save();
      self.scorm.finish();
    }
    window.addEventListener('pagehide', leave);
    window.addEventListener('beforeunload', leave);
    this.show(this.resumeIndex, { initial: true });
  }

  Player.prototype.restore = function () {
    this.resumeIndex = 0;
    this.resumed = false;
    var raw = this.scorm.getSuspendData();
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      if (data.v) this.visited = decodeVisited(data.v, this.pages.length);
      if (data.q) this.quizState = { attempts: data.q[0] || 0, best: data.q[1] || 0, passed: !!data.q[2] };
    } catch (e) {
      if (window.console) console.warn('Could not read suspend data', e);
      return;
    }
    var loc = this.scorm.getLocation();
    for (var i = 0; i < this.pages.length; i++) {
      if (this.pages[i].id === loc) { this.resumeIndex = i; break; }
    }
    this.resumed = this.resumeIndex > 0 || Object.keys(this.visited).length > 1;
  };

  Player.prototype.save = function () {
    var q = this.quizState;
    var data = { v: encodeVisited(this.visited, this.pages.length) };
    if (q.attempts) data.q = [q.attempts, q.best, q.passed ? 1 : 0];
    this.scorm.setSuspendData(JSON.stringify(data));
    this.scorm.setLocation(this.pages[this.current].id);
    this.scorm.setProgress(this.isComplete(), q.attempts ? { score: q.best, passed: q.passed } : null);
    if (!this.isComplete()) this.scorm.setProgressMeasure(this.progressRatio());
    this.scorm.commit();
  };

  Player.prototype.requiredPages = function () {
    return this.pages.filter(function (p) { return p.required; });
  };

  Player.prototype.progressRatio = function () {
    var req = this.requiredPages();
    var self = this;
    var done = req.filter(function (p) { return self.visited[p.index]; }).length;
    return req.length ? done / req.length : 1;
  };

  Player.prototype.isComplete = function () { return this.progressRatio() >= 1; };

  Player.prototype.chapterComplete = function (ci) {
    var self = this;
    return this.pages.every(function (p) { return p.chapterIndex !== ci || !p.required || self.visited[p.index]; });
  };

  /* Sequential navigation: a page is locked until all chapters before it are complete. */
  Player.prototype.isLocked = function (index) {
    if (this.settings.navigation !== 'sequential') return false;
    var page = this.pages[index];
    for (var ci = 0; ci < page.chapterIndex && ci < this.course.chapters.length; ci++) {
      if (!this.chapterComplete(ci)) return true;
    }
    if (page.kind === 'quiz' || page.kind === 'end') {
      for (var c = 0; c < this.course.chapters.length; c++) if (!this.chapterComplete(c)) return true;
    }
    return false;
  };

  /* ---------- Shell ---------- */

  Player.prototype.renderShell = function () {
    var self = this;
    var app = document.getElementById('app');
    app.innerHTML = '';

    this.menuButton = h('button', {
      type: 'button', class: 'topbar__menu', 'aria-expanded': 'false', 'aria-controls': 'course-nav',
      'aria-label': t('openMenu'), onclick: function () { self.toggleNav(); }
    }, [u.icon('menu')]);
    this.progressFill = h('span', { class: 'progress__fill' });
    this.progressLabel = h('span', { class: 'progress__label' });
    this.progressBar = h('div', {
      class: 'progress', role: 'progressbar', 'aria-label': t('progress'), 'aria-valuemin': '0', 'aria-valuemax': '100'
    }, [h('span', { class: 'progress__track' }, [this.progressFill]), this.progressLabel]);

    var topbar = h('header', { class: 'topbar' }, [
      this.menuButton,
      h('p', { class: 'topbar__title', text: this.course.title }),
      this.progressBar
    ]);

    this.navList = h('ol', { class: 'nav__chapters' });
    this.nav = h('nav', { id: 'course-nav', class: 'nav', 'aria-label': t('menu') }, [
      h('div', { class: 'nav__header' }, [
        h('p', { class: 'nav__heading', text: t('menu') }),
        h('button', { type: 'button', class: 'nav__close', 'aria-label': t('closeMenu'), onclick: function () { self.toggleNav(false); } }, [u.icon('close')])
      ]),
      this.navList
    ]);
    this.backdrop = h('div', { class: 'nav-backdrop', hidden: true, onclick: function () { self.toggleNav(false); } });

    this.main = h('main', { id: 'main', class: 'main', tabindex: '-1' });
    this.prevBtn = h('button', { type: 'button', class: 'btn btn--secondary pager__prev', onclick: function () { self.go(-1); } }, [u.icon('left'), h('span', { text: t('previous') })]);
    this.nextBtn = h('button', { type: 'button', class: 'btn btn--primary pager__next', onclick: function () { self.go(1); } }, [h('span', { text: t('next') }), u.icon('right')]);
    this.pageCounter = h('p', { class: 'pager__count' });
    var pager = h('footer', { class: 'pager' }, [h('div', { class: 'pager__inner' }, [this.prevBtn, this.pageCounter, this.nextBtn])]);

    var skip = h('a', { class: 'skip-link', href: '#main', text: t('skipToContent'), onclick: function (e) { e.preventDefault(); self.main.focus(); } });

    u.append(app, [skip, topbar, h('div', { class: 'layout' }, [this.nav, this.backdrop, h('div', { class: 'content' }, [this.main, pager])])]);

    if (this.scorm.isPreview) {
      app.insertBefore(h('div', { class: 'preview-badge' }, [
        h('span', { text: t('previewBadge') + ' · SCORM ' + this.scorm.version + (this.build.skill ? ' · ' + this.build.skill : '') }),
        h('button', {
          type: 'button', class: 'preview-badge__reset', text: t('previewReset'),
          onclick: function () { self.resetting = true; self.scorm.resetPreview(); window.location.reload(); }
        })
      ]), topbar);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self.navOpen) { self.toggleNav(false); self.menuButton.focus(); }
    });
  };

  Player.prototype.toggleNav = function (open) {
    this.navOpen = open === undefined ? !this.navOpen : open;
    document.body.classList.toggle('nav-open', this.navOpen);
    this.menuButton.setAttribute('aria-expanded', this.navOpen ? 'true' : 'false');
    this.menuButton.setAttribute('aria-label', this.navOpen ? t('closeMenu') : t('openMenu'));
    this.backdrop.hidden = !this.navOpen;
    if (this.navOpen) {
      var currentLink = this.nav.querySelector('[aria-current="page"]') || this.nav.querySelector('button');
      if (currentLink) currentLink.focus();
    }
  };

  Player.prototype.renderNav = function () {
    var self = this;
    this.navList.innerHTML = '';

    function pageLink(p, label, cls) {
      var locked = self.isLocked(p.index);
      var visited = !!self.visited[p.index];
      var current = p.index === self.current;
      var status = locked ? u.icon('lock', 'nav__status') : visited ? u.icon('check', 'nav__status is-done') : h('span', { class: 'nav__status nav__dot', 'aria-hidden': 'true' });
      var srState = locked ? t('locked') : visited ? t('visited') : '';
      return h('button', {
        type: 'button', class: 'nav__link' + (cls ? ' ' + cls : '') + (current ? ' is-current' : '') + (visited ? ' is-visited' : ''),
        'aria-current': current ? 'page' : null, disabled: locked,
        title: locked ? t('locked') : null,
        onclick: function () { self.show(p.index); self.toggleNav(false); }
      }, [status, h('span', { class: 'nav__label', html: u.inline(label) }), srState ? h('span', { class: 'sr-only', text: ' (' + srState + ')' }) : null]);
    }

    var start = this.pages[0];
    this.navList.appendChild(h('li', { class: 'nav__chapter nav__chapter--single' }, [pageLink(start, this.course.title, 'nav__link--start')]));

    this.course.chapters.forEach(function (chapter, ci) {
      var pages = self.pages.filter(function (p) { return p.chapterIndex === ci && p.kind === 'content'; });
      var done = self.chapterComplete(ci);
      var hasCurrent = pages.some(function (p) { return p.index === self.current; });
      self.navList.appendChild(h('li', { class: 'nav__chapter' + (hasCurrent ? ' is-current' : '') + (done ? ' is-done' : '') }, [
        h('p', { class: 'nav__chapter-title' }, [
          h('span', { class: 'nav__chapter-number', text: t('chapter', { n: ci + 1 }) }),
          h('span', { html: u.inline(chapter.title) })
        ]),
        h('ol', { class: 'nav__pages' }, pages.map(function (p) { return h('li', null, [pageLink(p, p.title)]); }))
      ]));
    });

    this.pages.forEach(function (p) {
      if (p.kind === 'quiz' || p.kind === 'end') {
        self.navList.appendChild(h('li', { class: 'nav__chapter nav__chapter--single' }, [pageLink(p, p.title, 'nav__link--' + p.kind)]));
      }
    });
  };

  Player.prototype.updateProgress = function () {
    var percent = Math.round(this.progressRatio() * 100);
    this.progressFill.style.width = percent + '%';
    this.progressLabel.textContent = t('progressValue', { percent: percent });
    this.progressBar.setAttribute('aria-valuenow', String(percent));
    this.progressBar.setAttribute('aria-valuetext', t('progressValue', { percent: percent }));
  };

  /* ---------- Navigation ---------- */

  Player.prototype.go = function (delta) {
    var target = this.current + delta;
    if (target < 0 || target >= this.pages.length || this.isLocked(target)) return;
    this.show(target);
  };

  Player.prototype.show = function (index, opts) {
    opts = opts || {};
    if (this.isLocked(index)) index = 0;
    this.current = index;
    this.visited[index] = true;
    var page = this.pages[index];

    this.main.innerHTML = '';
    var article = h('article', { class: 'page page--' + page.kind });
    if (page.kind === 'start') this.renderStart(article);
    else if (page.kind === 'content') this.renderContent(article, page);
    else if (page.kind === 'quiz') this.renderQuiz(article, page);
    else this.renderEnd(article);
    this.main.appendChild(article);

    this.prevBtn.disabled = index === 0;
    var nextLocked = index + 1 >= this.pages.length || this.isLocked(index + 1);
    this.nextBtn.disabled = nextLocked;
    this.nextBtn.hidden = index === this.pages.length - 1;
    this.pageCounter.textContent = t('pageOf', { current: index + 1, total: this.pages.length });

    this.renderNav();
    this.updateProgress();
    this.save();

    if (!opts.initial) {
      window.scrollTo(0, 0);
      var heading = article.querySelector('h1');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
  };

  /* ---------- Page renderers ---------- */

  Player.prototype.renderStart = function (article) {
    var self = this;
    var c = this.course;
    var header = h('header', { class: 'hero' }, [
      h('h1', { class: 'hero__title', html: u.inline(c.title) }),
      c.subtitle ? h('p', { class: 'hero__subtitle', html: u.inline(c.subtitle) }) : null,
      c.durationMinutes ? h('p', { class: 'hero__meta' }, [u.icon('clock'), h('span', { text: t('duration', { minutes: c.durationMinutes }) })]) : null
    ]);
    article.appendChild(header);
    if (this.resumed) {
      var name = this.learnerFirstName();
      article.appendChild(h('div', { class: 'callout callout--info resume' }, [
        u.icon('info', 'callout__icon'),
        h('div', { class: 'callout__body' }, [
          h('p', { class: 'callout__title', text: t('welcomeBack', { name: name ? ', ' + name : '' }) }),
          h('div', { class: 'btn-row' }, [
            h('button', { type: 'button', class: 'btn btn--primary', text: t('resumeCourse'), onclick: function () { self.show(self.resumeTarget()); } })
          ])
        ])
      ]));
    }
    if (c.description) article.appendChild(h('div', { class: 'rich rich--lead', html: u.rich(c.description) }));
    article.appendChild(h('section', { class: 'objectives' }, [
      h('h2', { class: 'objectives__title', text: t('objectivesTitle') }),
      h('ul', { class: 'objectives__list' }, c.objectives.map(function (o) {
        return h('li', null, [u.icon('check', 'objectives__icon'), h('span', { html: u.inline(o.text) })]);
      }))
    ]));
    if (!this.resumed) {
      article.appendChild(h('div', { class: 'btn-row' }, [
        h('button', { type: 'button', class: 'btn btn--primary btn--large', onclick: function () { self.go(1); } }, [h('span', { text: t('startCourse') }), u.icon('right')])
      ]));
    }
  };

  Player.prototype.learnerFirstName = function () {
    var raw = this.scorm.learnerName();
    if (!raw) return '';
    // LMSs usually deliver "Last, First".
    var parts = raw.split(',');
    return (parts.length > 1 ? parts[1] : parts[0]).trim().split(' ')[0];
  };

  Player.prototype.resumeTarget = function () {
    if (this.resumeIndex > 0) return this.resumeIndex;
    for (var i = 1; i < this.pages.length; i++) if (!this.visited[i] && !this.isLocked(i)) return i;
    return 1;
  };

  Player.prototype.renderContent = function (article, page) {
    var chapter = page.chapter;
    var header = h('header', { class: 'page__header' }, [
      h('p', { class: 'page__eyebrow' }, [
        h('span', { class: 'page__chapter-number', text: t('chapter', { n: page.chapterIndex + 1 }) }),
        h('span', { class: 'page__chapter-title', html: u.inline(chapter.title) })
      ]),
      h('h1', { class: 'page__title', html: u.inline(page.title) })
    ]);
    article.appendChild(header);
    if (page.pageIndex === 0 && chapter.intro) {
      article.appendChild(h('div', { class: 'rich rich--lead page__intro', html: u.rich(chapter.intro) }));
    }
    page.page.blocks.forEach(function (block) { article.appendChild(GAX.blocks.render(block)); });
  };

  Player.prototype.renderQuiz = function (article, page) {
    var self = this;
    article.appendChild(h('header', { class: 'page__header' }, [
      page.title !== t('quiz') ? h('p', { class: 'page__eyebrow' }, [h('span', { class: 'page__chapter-number', text: t('quiz') })]) : null,
      h('h1', { class: 'page__title', html: u.inline(page.title) })
    ]));
    var container = h('div', { class: 'quiz' });
    article.appendChild(container);
    new GAX.FinalQuiz(container, this.course.quiz, this.quizSettings, this.quizState, function (result) {
      var q = self.quizState;
      q.attempts += 1;
      q.best = Math.max(q.best, result.score);
      q.passed = q.passed || result.passed;
      self.save();
    });
  };

  Player.prototype.renderEnd = function (article) {
    var self = this;
    var done = this.isComplete();
    article.appendChild(h('header', { class: 'hero hero--end' }, [
      h('h1', { class: 'hero__title', text: done ? t('endTitleDone') : t('endTitleOpen') })
    ]));
    if (done) {
      article.appendChild(h('p', { class: 'rich--lead', text: t('endTextDone') }));
    } else {
      var missing = this.pages.filter(function (p) { return p.required && !self.visited[p.index]; });
      article.appendChild(h('p', { text: t('endTextOpen') }));
      article.appendChild(h('ul', { class: 'missing' }, missing.map(function (p) {
        return h('li', null, [h('button', { type: 'button', class: 'link-button', html: u.inline(p.title), onclick: function () { self.show(p.index); } })]);
      })));
    }
    var q = this.quizState;
    if (this.pages.some(function (p) { return p.kind === 'quiz'; })) {
      article.appendChild(h('p', { class: 'end__quiz' }, [
        u.icon(q.attempts ? (q.passed ? 'check' : 'cross') : 'info'),
        h('span', { text: q.attempts ? t('endQuizResult', { score: q.best, status: q.passed ? t('passed') : t('failed') }) : t('endQuizOpen') })
      ]));
    }
    var note = h('p', { class: 'end__note', 'aria-live': 'polite' });
    article.appendChild(h('div', { class: 'btn-row' }, [
      h('button', {
        type: 'button', class: 'btn btn--primary', text: t('exitCourse'),
        onclick: function () { self.save(); self.scorm.finish(); note.textContent = t('exitDone'); }
      })
    ]));
    article.appendChild(note);
  };

  GAX.Player = Player;
  GAX.playerInternals = { encodeVisited: encodeVisited, decodeVisited: decodeVisited, buildPages: buildPages };

  function boot() {
    if (!window.GAX_COURSE) {
      document.getElementById('app').textContent = 'Course data missing (data/course.js).';
      return;
    }
    GAX.player = new Player(window.GAX_COURSE, window.GAX_BUILD || { scorm: '1.2' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.GAX = window.GAX || {});
