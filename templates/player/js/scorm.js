/* SCORM runtime adapter for SCORM 1.2 and SCORM 2004 (4th Edition).
 * The player talks to this small API only; version differences live here.
 * Without an LMS (local preview) a localStorage-backed mock API is used. */
(function (GAX) {
  'use strict';

  var FIELDS = {
    '1.2': {
      location: 'cmi.core.lesson_location',
      suspend: 'cmi.suspend_data',
      entry: 'cmi.core.entry',
      learnerName: 'cmi.core.student_name',
      sessionTime: 'cmi.core.session_time',
      exit: 'cmi.core.exit',
      scoreRaw: 'cmi.core.score.raw',
      scoreMin: 'cmi.core.score.min',
      scoreMax: 'cmi.core.score.max',
      maxSuspend: 4096,
      maxLocation: 255
    },
    '2004': {
      location: 'cmi.location',
      suspend: 'cmi.suspend_data',
      entry: 'cmi.entry',
      learnerName: 'cmi.learner_name',
      sessionTime: 'cmi.session_time',
      exit: 'cmi.exit',
      scoreRaw: 'cmi.score.raw',
      scoreMin: 'cmi.score.min',
      scoreMax: 'cmi.score.max',
      maxSuspend: 64000,
      maxLocation: 1000
    }
  };

  var API_NAMES = { '1.2': 'API', '2004': 'API_1484_11' };

  function searchUp(win, name) {
    for (var depth = 0; win && depth < 500; depth++) {
      try {
        if (win[name]) return win[name];
      } catch (e) { /* cross-origin frame: keep climbing */ }
      if (!win.parent || win.parent === win) break;
      win = win.parent;
    }
    return null;
  }

  function locateApi(version) {
    var name = API_NAMES[version];
    var api = searchUp(window, name);
    if (!api && window.opener) api = searchUp(window.opener, name);
    if (!api && window.top && window.top.opener) api = searchUp(window.top.opener, name);
    return api;
  }

  /* Mock LMS for previews: stores the CMI data model in localStorage so that
   * resume, completion and score can be tested in a plain browser. */
  function createMockApi(storageKey) {
    var data = {};
    try { data = JSON.parse(window.localStorage.getItem(storageKey) || '{}'); } catch (e) { data = {}; }
    function save() {
      try { window.localStorage.setItem(storageKey, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
    }
    function log(method, args, result) {
      if (window.console && console.debug) console.debug('[mock LMS] ' + method, args, '->', result);
    }
    var api = {
      _data: data,
      init: function () {
        var resumed = !!data['cmi.suspend_data'] || !!data['cmi.location'] || !!data['cmi.core.lesson_location'];
        data['cmi.entry'] = data['cmi.core.entry'] = resumed ? 'resume' : 'ab-initio';
        data['cmi.learner_name'] = data['cmi.core.student_name'] = data['cmi.learner_name'] || 'Preview, Learner';
        log('Initialize', [], 'true');
        return 'true';
      },
      get: function (key) { var v = data[key] === undefined ? '' : String(data[key]); log('GetValue', [key], v); return v; },
      set: function (key, value) { data[key] = String(value); log('SetValue', [key, value], 'true'); return 'true'; },
      commit: function () { save(); log('Commit', [], 'true'); return 'true'; },
      finish: function () { save(); log('Terminate', [], 'true'); return 'true'; },
      err: function () { return '0'; },
      reset: function () { try { window.localStorage.removeItem(storageKey); } catch (e) { /* ignore */ } }
    };
    return {
      LMSInitialize: api.init, Initialize: api.init,
      LMSGetValue: api.get, GetValue: api.get,
      LMSSetValue: api.set, SetValue: api.set,
      LMSCommit: api.commit, Commit: api.commit,
      LMSFinish: api.finish, Terminate: api.finish,
      LMSGetLastError: api.err, GetLastError: api.err,
      LMSGetErrorString: function () { return ''; }, GetErrorString: function () { return ''; },
      _mock: api
    };
  }

  function pad(n, len) { n = String(n); while (n.length < len) n = '0' + n; return n; }

  function formatSessionTime(version, ms) {
    var totalSeconds = Math.max(0, Math.round(ms / 1000));
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    if (version === '1.2') return pad(Math.min(h, 9999), 4) + ':' + pad(m, 2) + ':' + pad(s, 2);
    return 'PT' + h + 'H' + m + 'M' + s + 'S';
  }

  /* version: '1.2' | '2004' | 'preview'. A preview build uses whichever LMS API it
   * finds (e.g. the test LMS of preview.py) and falls back to the mock API. */
  function Scorm(version, previewKey) {
    if (version === 'preview') {
      version = locateApi('2004') ? '2004' : locateApi('1.2') ? '1.2' : '2004';
    }
    this.version = FIELDS[version] ? version : '1.2';
    this.f = FIELDS[this.version];
    this.api = locateApi(this.version);
    this.isPreview = !this.api;
    if (this.isPreview) this.api = createMockApi(previewKey);
    this.active = false;
    this.startedAt = Date.now();
  }

  Scorm.prototype._call = function (m12, m2004, args) {
    var name = this.version === '1.2' ? m12 : m2004;
    try {
      var result = this.api[name].apply(this.api, args || ['']);
      if (result === 'false' || result === false) this._logError(name, args);
      return result;
    } catch (e) {
      if (window.console) console.warn('[SCORM] ' + name + ' failed', e);
      return 'false';
    }
  };

  Scorm.prototype._logError = function (name, args) {
    try {
      var code = this.version === '1.2' ? this.api.LMSGetLastError() : this.api.GetLastError();
      var text = this.version === '1.2' ? this.api.LMSGetErrorString(code) : this.api.GetErrorString(code);
      if (window.console) console.warn('[SCORM] ' + name + '(' + (args || []).join(', ') + ') error ' + code + ': ' + text);
    } catch (e) { /* ignore */ }
  };

  Scorm.prototype.init = function () {
    if (this.active) return true;
    this.active = String(this._call('LMSInitialize', 'Initialize', [''])) === 'true';
    if (this.active) this._markAttempted();
    return this.active;
  };

  Scorm.prototype.get = function (key) {
    if (!this.active) return '';
    var v = this._call('LMSGetValue', 'GetValue', [key]);
    return v === null || v === undefined ? '' : String(v);
  };

  Scorm.prototype.set = function (key, value) {
    if (!this.active) return false;
    return String(this._call('LMSSetValue', 'SetValue', [key, String(value)])) === 'true';
  };

  Scorm.prototype.commit = function () {
    if (!this.active) return false;
    return String(this._call('LMSCommit', 'Commit', [''])) === 'true';
  };

  Scorm.prototype._markAttempted = function () {
    if (this.version === '1.2') {
      var status = this.get('cmi.core.lesson_status');
      if (!status || status === 'not attempted') this.set('cmi.core.lesson_status', 'incomplete');
    } else {
      var completion = this.get('cmi.completion_status');
      if (!completion || completion === 'unknown' || completion === 'not attempted') this.set('cmi.completion_status', 'incomplete');
    }
  };

  Scorm.prototype.isResume = function () { return this.get(this.f.entry) === 'resume'; };
  Scorm.prototype.learnerName = function () { return this.get(this.f.learnerName); };
  Scorm.prototype.getLocation = function () { return this.get(this.f.location); };
  Scorm.prototype.setLocation = function (loc) { return this.set(this.f.location, String(loc).slice(0, this.f.maxLocation)); };
  Scorm.prototype.getSuspendData = function () { return this.get(this.f.suspend); };

  Scorm.prototype.setSuspendData = function (str) {
    if (str.length > this.f.maxSuspend) {
      if (window.console) console.warn('[SCORM] suspend_data too long (' + str.length + ' > ' + this.f.maxSuspend + '), not saved');
      return false;
    }
    return this.set(this.f.suspend, str);
  };

  /* completed: all required pages visited. quiz: {score: 0-100, passed: bool} or null.
   * Completion never depends on the quiz; the quiz only adds score and success. */
  Scorm.prototype.setProgress = function (completed, quiz) {
    // Never downgrade a completion the LMS already recorded (e.g. lost suspend data).
    var current = this.version === '1.2' ? this.get('cmi.core.lesson_status') : this.get('cmi.completion_status');
    if (current === 'completed' || current === 'passed') completed = true;
    if (quiz) {
      this.set(this.f.scoreMin, 0);
      this.set(this.f.scoreMax, 100);
      this.set(this.f.scoreRaw, Math.round(quiz.score));
    }
    if (this.version === '1.2') {
      // 1.2 has one status field: 'passed' only once completed, never 'failed'
      // (some LMSs treat 'failed' as not completed).
      var status = !completed ? 'incomplete' : (quiz && quiz.passed ? 'passed' : 'completed');
      this.set('cmi.core.lesson_status', status);
    } else {
      this.set('cmi.completion_status', completed ? 'completed' : 'incomplete');
      if (completed) this.set('cmi.progress_measure', '1');
      if (quiz) {
        this.set('cmi.score.scaled', (Math.round(quiz.score) / 100).toFixed(2));
        this.set('cmi.success_status', quiz.passed ? 'passed' : 'failed');
      }
    }
  };

  Scorm.prototype.setProgressMeasure = function (ratio) {
    if (this.version === '2004') this.set('cmi.progress_measure', Math.max(0, Math.min(1, ratio)).toFixed(2));
  };

  Scorm.prototype.finish = function () {
    if (!this.active) return false;
    this.set(this.f.sessionTime, formatSessionTime(this.version, Date.now() - this.startedAt));
    // Always suspend so the next launch resumes instead of starting a new attempt.
    this.set(this.f.exit, 'suspend');
    this.commit();
    var ok = String(this._call('LMSFinish', 'Terminate', [''])) === 'true';
    this.active = false;
    return ok;
  };

  Scorm.prototype.resetPreview = function () {
    if (this.isPreview && this.api._mock) this.api._mock.reset();
  };

  GAX.Scorm = Scorm;
  GAX.scormInternals = { formatSessionTime: formatSessionTime, createMockApi: createMockApi };
})(window.GAX = window.GAX || {});
