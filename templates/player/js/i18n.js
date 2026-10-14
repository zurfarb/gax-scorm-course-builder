/* Fixed UI strings of the player. Course content comes from course.<lang>.json.
 * de-CH: informal "du", "ss" instead of "ß", «» quotes. en-GB: British spelling. */
(function (GAX) {
  'use strict';

  var STRINGS = {
    'de-CH': {
      skipToContent: 'Zum Inhalt springen',
      menu: 'Kursmenü',
      openMenu: 'Kursmenü öffnen',
      closeMenu: 'Kursmenü schliessen',
      progress: 'Fortschritt',
      progressValue: '{percent} % bearbeitet',
      previous: 'Zurück',
      next: 'Weiter',
      pageOf: 'Seite {current} von {total}',
      start: 'Start',
      startCourse: 'Kurs starten',
      resumeCourse: 'Weiter, wo du aufgehört hast',
      restartCourse: 'Von vorne beginnen',
      welcomeBack: 'Willkommen zurück{name}!',
      objectivesTitle: 'Das lernst du in diesem Kurs',
      duration: 'Dauer: ca. {minutes} Minuten',
      chapter: 'Kapitel {n}',
      chapters: 'Kapitel',
      locked: 'Gesperrt — schliesse zuerst die vorherigen Kapitel ab',
      visited: 'Bearbeitet',
      current: 'Aktuelle Seite',
      quiz: 'Abschlusstest',
      end: 'Abschluss',

      checkAnswer: 'Antwort prüfen',
      tryAgain: 'Nochmals versuchen',
      showSolution: 'Lösung anzeigen',
      correct: 'Richtig!',
      incorrect: 'Leider nicht ganz.',
      partlyCorrect: 'Teilweise richtig.',
      solution: 'Lösung',
      knowledgeCheck: 'Wissenscheck',
      scenario: 'Was würdest du tun?',
      chooseOption: 'Wähle eine Option.',
      yourChoice: 'Deine Wahl',
      multipleHint: 'Mehrere Antworten sind möglich.',
      singleHint: 'Wähle eine Antwort.',
      matchingHint: 'Ordne jedem Begriff die passende Aussage zu.',
      pleaseChoose: 'Bitte wählen …',
      trueLabel: 'Richtig',
      falseLabel: 'Falsch',
      flipHint: 'Karte antippen zum Umdrehen',
      flipCard: 'Karte umdrehen',
      summaryTitle: 'Das Wichtigste in Kürze',
      stepsTitle: 'Schritt {n}',
      callout: { info: 'Info', tip: 'Tipp', warning: 'Achtung', important: 'Wichtig' },

      quizIntroQuestions: '{count} Fragen',
      quizIntroPassing: 'Bestanden ab {score} %',
      quizIntroAttempts: 'Unbegrenzte Versuche',
      quizIntroAttemptsLimited: '{left} von {max} Versuchen übrig',
      quizStart: 'Test starten',
      quizRestart: 'Test wiederholen',
      quizQuestionOf: 'Frage {current} von {total}',
      quizSubmit: 'Test abgeben',
      quizAnswerFirst: 'Beantworte die Frage, um weiterzugehen.',
      quizResultTitle: 'Dein Ergebnis',
      quizScore: '{correct} von {total} Fragen richtig ({score} %)',
      quizPassed: 'Bestanden — gratuliere!',
      quizFailed: 'Noch nicht bestanden. Für das Bestehen brauchst du {score} %.',
      quizBest: 'Bestes Ergebnis bisher: {score} %',
      quizNoAttemptsLeft: 'Du hast alle Versuche aufgebraucht.',
      quizReview: 'Auswertung',
      quizYourAnswer: 'Deine Antwort',
      quizCorrectAnswer: 'Richtige Antwort',
      missedAnswer: 'Richtig, aber nicht gewählt',
      quizNoAnswer: 'Keine Antwort',

      endTitleDone: 'Geschafft!',
      endTextDone: 'Du hast alle Seiten des Kurses bearbeitet. Der Kurs ist abgeschlossen.',
      endTitleOpen: 'Fast geschafft',
      endTextOpen: 'Diese Seiten hast du noch nicht bearbeitet:',
      endQuizResult: 'Abschlusstest: {score} % ({status})',
      endQuizOpen: 'Den Abschlusstest hast du noch nicht gemacht.',
      passed: 'bestanden',
      failed: 'nicht bestanden',
      exitCourse: 'Kurs beenden',
      exitDone: 'Dein Fortschritt ist gespeichert. Du kannst dieses Fenster jetzt schliessen.',

      previewBadge: 'Vorschau ohne LMS',
      previewReset: 'Fortschritt zurücksetzen',
      noScript: 'Für diesen Kurs muss JavaScript aktiviert sein.'
    },

    'en-GB': {
      skipToContent: 'Skip to content',
      menu: 'Course menu',
      openMenu: 'Open course menu',
      closeMenu: 'Close course menu',
      progress: 'Progress',
      progressValue: '{percent}% done',
      previous: 'Back',
      next: 'Next',
      pageOf: 'Page {current} of {total}',
      start: 'Start',
      startCourse: 'Start course',
      resumeCourse: 'Continue where you left off',
      restartCourse: 'Start from the beginning',
      welcomeBack: 'Welcome back{name}!',
      objectivesTitle: 'What you will learn',
      duration: 'Duration: approx. {minutes} minutes',
      chapter: 'Chapter {n}',
      chapters: 'Chapters',
      locked: 'Locked — complete the previous chapters first',
      visited: 'Done',
      current: 'Current page',
      quiz: 'Final quiz',
      end: 'Finish',

      checkAnswer: 'Check answer',
      tryAgain: 'Try again',
      showSolution: 'Show solution',
      correct: 'Correct!',
      incorrect: 'Not quite.',
      partlyCorrect: 'Partly correct.',
      solution: 'Solution',
      knowledgeCheck: 'Knowledge check',
      scenario: 'What would you do?',
      chooseOption: 'Choose an option.',
      yourChoice: 'Your choice',
      multipleHint: 'More than one answer may be correct.',
      singleHint: 'Choose one answer.',
      matchingHint: 'Match each term with the right statement.',
      pleaseChoose: 'Please choose …',
      trueLabel: 'True',
      falseLabel: 'False',
      flipHint: 'Tap a card to turn it over',
      flipCard: 'Turn card over',
      summaryTitle: 'Key takeaways',
      stepsTitle: 'Step {n}',
      callout: { info: 'Info', tip: 'Tip', warning: 'Caution', important: 'Important' },

      quizIntroQuestions: '{count} questions',
      quizIntroPassing: 'Pass mark: {score}%',
      quizIntroAttempts: 'Unlimited attempts',
      quizIntroAttemptsLimited: '{left} of {max} attempts left',
      quizStart: 'Start quiz',
      quizRestart: 'Retake quiz',
      quizQuestionOf: 'Question {current} of {total}',
      quizSubmit: 'Submit quiz',
      quizAnswerFirst: 'Answer the question to continue.',
      quizResultTitle: 'Your result',
      quizScore: '{correct} of {total} questions correct ({score}%)',
      quizPassed: 'Passed — well done!',
      quizFailed: 'Not passed yet. You need {score}% to pass.',
      quizBest: 'Best result so far: {score}%',
      quizNoAttemptsLeft: 'You have used all your attempts.',
      quizReview: 'Review',
      quizYourAnswer: 'Your answer',
      quizCorrectAnswer: 'Correct answer',
      missedAnswer: 'Correct, but not selected',
      quizNoAnswer: 'No answer',

      endTitleDone: 'Well done!',
      endTextDone: 'You have worked through every page. The course is complete.',
      endTitleOpen: 'Almost there',
      endTextOpen: 'You have not yet worked through these pages:',
      endQuizResult: 'Final quiz: {score}% ({status})',
      endQuizOpen: 'You have not taken the final quiz yet.',
      passed: 'passed',
      failed: 'not passed',
      exitCourse: 'Exit course',
      exitDone: 'Your progress has been saved. You can now close this window.',

      previewBadge: 'Preview without LMS',
      previewReset: 'Reset progress',
      noScript: 'This course requires JavaScript.'
    }
  };

  var lang = 'de-CH';

  function lookup(key) {
    var table = STRINGS[lang] || STRINGS['de-CH'];
    var node = table;
    var parts = key.split('.');
    for (var i = 0; i < parts.length; i++) {
      node = node ? node[parts[i]] : undefined;
    }
    return node === undefined ? key : node;
  }

  GAX.i18n = {
    setLanguage: function (code) { lang = STRINGS[code] ? code : 'de-CH'; },
    language: function () { return lang; },
    t: function (key, vars) {
      var s = lookup(key);
      if (typeof s !== 'string') return s;
      return s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars && vars[name] !== undefined ? String(vars[name]) : m;
      });
    },
    STRINGS: STRINGS
  };
})(window.GAX = window.GAX || {});
