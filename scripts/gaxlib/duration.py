"""Estimated learning time of a course (see references/didactics.md, section 7).

Counts only what a learner actually reads: for knowledge checks one feedback text
(the longer one) plus the explanation, for scenarios the feedback of two choices
(learners usually try one or two). Final quiz questions are covered by a flat rate.
"""

from .course import iter_texts

WORDS_PER_MINUTE = 180
MIN_PER_CHECK = 0.5
MIN_PER_SCENARIO = 1.5
MIN_PER_INTERACTIVE = 0.5
MIN_PER_QUIZ_QUESTION = 0.5
INTERACTIVE = {"tabs", "steps", "flipcards", "accordion"}


def _words(text):
    return len(str(text).split())


def _texts(node):
    return sum(_words(t) for _, t in iter_texts(node))


def _question_words(q):
    words = _words(q.get("prompt", ""))
    words += sum(_words(o.get("text", "")) for o in q.get("options", []))
    words += sum(_words(p.get("left", "")) + _words(p.get("right", "")) for p in q.get("pairs", []))
    feedback = q.get("feedback", {})
    words += max(_words(feedback.get("correct", "")), _words(feedback.get("incorrect", "")))
    words += _words(q.get("explanation", ""))
    return words


def _scenario_words(block):
    choices = block.get("choices", [])
    words = _words(block.get("title", "")) + _words(block.get("situation", ""))
    words += sum(_words(c.get("text", "")) for c in choices)
    feedback = sorted((_words(c.get("feedback", "")) for c in choices), reverse=True)
    return words + sum(feedback[:2])


def estimate(course):
    """Returns a dict with the parts of the estimate and the total in minutes (unrounded)."""
    words = checks = scenarios = interactive = 0
    for chapter in course.get("chapters", []):
        words += _words(chapter.get("title", "")) + _words(chapter.get("intro", ""))
        for page in chapter.get("pages", []):
            words += _words(page.get("title", ""))
            for block in page.get("blocks", []):
                kind = block.get("type")
                if kind == "check":
                    checks += 1
                    words += _question_words(block.get("question", {}))
                elif kind == "scenario":
                    scenarios += 1
                    words += _scenario_words(block)
                else:
                    words += _texts(block)
                    if kind in INTERACTIVE:
                        interactive += 1
    questions = len(course.get("quiz", {}).get("questions", []))
    minutes = (words / WORDS_PER_MINUTE + checks * MIN_PER_CHECK + scenarios * MIN_PER_SCENARIO
               + interactive * MIN_PER_INTERACTIVE + questions * MIN_PER_QUIZ_QUESTION)
    return {"words": words, "checks": checks, "scenarios": scenarios, "interactive": interactive,
            "questions": questions, "minutes": minutes}


def rounded(minutes):
    """Nearest multiple of 5, at least 5 (e.g. 22.4 -> 20, 22.5 -> 25)."""
    return max(5, int(minutes / 5 + 0.5) * 5)
