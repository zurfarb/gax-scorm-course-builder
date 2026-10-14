"""Structural and semantic course checks (used by validate.py and build.py)."""

from pathlib import Path

from .course import (LEAD_LANGUAGE, available_languages, iter_images, load_course,
                     load_schema, resolve_image)
from .duration import estimate, rounded
from .schema import Validator


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, lang, pointer, msg):
        self.errors.append((lang, pointer, msg))

    def warn(self, lang, pointer, msg):
        self.warnings.append((lang, pointer, msg))

    @property
    def ok(self):
        return not self.errors


def _dupes(values):
    seen, dupes = set(), set()
    for v in values:
        (dupes if v in seen else seen).add(v)
    return dupes


def _questions(course):
    """Yields (pointer, question) for knowledge checks and quiz questions."""
    for ci, ch in enumerate(course.get("chapters", [])):
        for pi, page in enumerate(ch.get("pages", [])):
            for bi, block in enumerate(page.get("blocks", [])):
                if block.get("type") == "check" and isinstance(block.get("question"), dict):
                    yield f"/chapters/{ci}/pages/{pi}/blocks/{bi}/question", block["question"]
    for qi, q in enumerate(course.get("quiz", {}).get("questions", [])):
        yield f"/quiz/questions/{qi}", q


def _check_question(rep, lang, ptr, q):
    qtype = q.get("type")
    if qtype in ("single", "multiple"):
        options = q.get("options", [])
        correct = [o for o in options if o.get("correct")]
        if _dupes(o.get("id") for o in options):
            rep.error(lang, ptr, "duplicate option ids")
        if qtype == "single" and len(correct) != 1:
            rep.error(lang, ptr, f"single choice needs exactly 1 correct option, has {len(correct)}")
        if qtype == "multiple":
            if not correct:
                rep.error(lang, ptr, "multiple choice needs at least 1 correct option")
            elif len(correct) == len(options):
                rep.warn(lang, ptr, "all options are correct; add at least one distractor")
        if len(set(o.get("text", "").strip().lower() for o in options)) < len(options):
            rep.error(lang, ptr, "two options have the same text")
    if qtype == "matching":
        pairs = q.get("pairs", [])
        if _dupes(p.get("id") for p in pairs):
            rep.error(lang, ptr, "duplicate pair ids")
        if _dupes(p.get("right", "").strip().lower() for p in pairs):
            rep.error(lang, ptr, "two right-hand items are identical; matching would be ambiguous")
        long_items = [p["right"] for p in pairs if len(p.get("right", "")) > 60]
        if long_items:
            rep.warn(lang, ptr, "right-hand items over 60 characters get cut off in the dropdown on phones")
    if qtype in ("single", "multiple") and "answer" in q:
        rep.warn(lang, ptr, "'answer' is only used by truefalse questions")


def check_course(course, course_dir, lang, rep):
    if course.get("language") != lang:
        rep.error(lang, "/language", f"file course.{lang}.json declares language {course.get('language')!r}")

    objectives = [o.get("id") for o in course.get("objectives", [])]
    for d in _dupes(objectives):
        rep.error(lang, "/objectives", f"duplicate objective id {d!r}")
    objective_set = set(objectives)

    chapter_ids, page_ids, covered = [], [], set()
    for ci, ch in enumerate(course.get("chapters", [])):
        chapter_ids.append(ch.get("id"))
        for ref in ch.get("objectives", []):
            if ref not in objective_set:
                rep.error(lang, f"/chapters/{ci}/objectives", f"unknown objective {ref!r}")
            covered.add(ref)
        for pi, page in enumerate(ch.get("pages", [])):
            page_ids.append(page.get("id"))
            for bi, block in enumerate(page.get("blocks", [])):
                if block.get("type") == "scenario":
                    choices = block.get("choices", [])
                    if not any(c.get("correct") for c in choices):
                        rep.error(lang, f"/chapters/{ci}/pages/{pi}/blocks/{bi}", "scenario needs at least one correct choice")
                    if _dupes(c.get("id") for c in choices):
                        rep.error(lang, f"/chapters/{ci}/pages/{pi}/blocks/{bi}", "duplicate choice ids")
            if not any(b.get("type") != "summary" for b in page.get("blocks", [])):
                rep.warn(lang, f"/chapters/{ci}/pages/{pi}", "page has no content besides a summary")
    for d in _dupes(chapter_ids):
        rep.error(lang, "/chapters", f"duplicate chapter id {d!r}")
    for d in _dupes(page_ids):
        rep.error(lang, "/chapters", f"duplicate page id {d!r}")
    for reserved in ("_start", "_quiz", "_end"):
        if reserved in page_ids:
            rep.error(lang, "/chapters", f"page id {reserved!r} is reserved")

    question_ids, assessed = [], set()
    for ptr, q in _questions(course):
        question_ids.append(q.get("id"))
        _check_question(rep, lang, ptr, q)
        ref = q.get("objective")
        if ref is not None and ref not in objective_set:
            rep.error(lang, ptr + "/objective", f"unknown objective {ref!r}")
        if ptr.startswith("/quiz") and ref:
            assessed.add(ref)
    for d in _dupes(question_ids):
        rep.error(lang, "/", f"duplicate question id {d!r}")

    for oid in objectives:
        if oid not in covered:
            rep.warn(lang, "/objectives", f"objective {oid!r} is not assigned to any chapter")
        if oid not in assessed:
            rep.warn(lang, "/objectives", f"objective {oid!r} is not assessed by any final quiz question")

    quiz = course.get("quiz", {})
    settings = course.get("settings", {}).get("quiz", {})
    count = settings.get("questionCount")
    if count and count > len(quiz.get("questions", [])):
        rep.error(lang, "/settings/quiz/questionCount", f"questionCount {count} exceeds the {len(quiz.get('questions', []))} questions in the pool")
    if quiz.get("questions") and len(quiz["questions"]) < 2 * len(objectives):
        rep.warn(lang, "/quiz/questions", f"{len(quiz['questions'])} questions for {len(objectives)} objectives; aim for at least 2 per objective")

    est = estimate(course)["minutes"]
    declared = course.get("durationMinutes")
    if declared is None:
        rep.warn(lang, "/durationMinutes", f"missing; estimated ~{est:.0f} min, set {rounded(est)}")
    elif abs(est - declared) > 5:
        rep.warn(lang, "/durationMinutes", f"says {declared} min, but the estimate is ~{est:.0f} min (rounded {rounded(est)}); adjust the value or the content (didactics.md, section 7)")

    for ptr, img in iter_images(course):
        src = img.get("src", "")
        if src.startswith(("http:", "https:", "//", "/")) or ".." in src.split("/"):
            rep.error(lang, ptr, f"image src must be a relative path inside the course folder: {src!r}")
            continue
        if resolve_image(course_dir, src, lang) is None:
            rep.error(lang, ptr, f"image not found: {src}")
        if img.get("hasText") and lang != LEAD_LANGUAGE:
            used = resolve_image(course_dir, src, lang)
            if used is not None and f".{lang}." not in used.name:
                rep.warn(lang, ptr, f"image contains text but has no {lang} variant ({Path(src).stem}.{lang}{Path(src).suffix}); the {LEAD_LANGUAGE} image is used")
        if not img.get("alt", "").strip():
            rep.warn(lang, ptr, "empty alt text; only acceptable for purely decorative images")


def _shape(node):
    """Language-independent skeleton: everything except learner-facing text."""
    from .course import TEXT_KEYS
    if isinstance(node, dict):
        return {k: _shape(v) for k, v in node.items()
                if not (k in TEXT_KEYS and isinstance(v, str)) and k not in ("language", "$schema")}
    if isinstance(node, list):
        if node and all(isinstance(v, str) for v in node):
            return len(node)
        return [_shape(v) for v in node]
    return node


def _diff(a, b, path, out, limit=20):
    if len(out) >= limit:
        return
    if type(a) is not type(b):
        out.append((path or "/", "structure differs"))
    elif isinstance(a, dict):
        for key in sorted(set(a) | set(b)):
            if key not in a or key not in b:
                out.append((f"{path}/{key}", "present in only one language"))
            else:
                _diff(a[key], b[key], f"{path}/{key}", out, limit)
    elif isinstance(a, list):
        if len(a) != len(b):
            out.append((path or "/", f"{len(a)} vs {len(b)} items"))
        for i, (x, y) in enumerate(zip(a, b)):
            _diff(x, y, f"{path}/{i}", out, limit)
    elif a != b:
        out.append((path or "/", f"{a!r} vs {b!r}"))


def check_parity(lead, other, other_lang, rep):
    diffs = []
    _diff(_shape(lead), _shape(other), "", diffs)
    for ptr, msg in diffs:
        rep.error(other_lang, ptr, f"differs from {LEAD_LANGUAGE}: {msg} (ids, types, answers, settings and images must match)")


def validate(course_dir, langs=None):
    rep = Report()
    present = available_languages(course_dir)
    langs = langs or present
    if not present:
        rep.error("-", str(course_dir), "no course.de-CH.json or course.en-GB.json found")
        return rep, {}
    validator = Validator(load_schema())
    courses = {}
    for lang in langs:
        if lang not in present:
            rep.error(lang, "-", f"course.{lang}.json not found")
            continue
        try:
            course = load_course(course_dir, lang)
        except ValueError as exc:
            rep.error(lang, "-", f"invalid JSON: {exc}")
            continue
        schema_errors = validator.errors(course)
        for ptr, msg in schema_errors:
            rep.error(lang, ptr, msg)
        try:
            check_course(course, course_dir, lang, rep)
        except (AttributeError, KeyError, TypeError) as exc:
            if not schema_errors:
                rep.error(lang, "-", f"could not check course: {exc!r}")
        courses[lang] = course
    if LEAD_LANGUAGE in courses:
        for lang, course in courses.items():
            if lang != LEAD_LANGUAGE:
                check_parity(courses[LEAD_LANGUAGE], course, lang, rep)
    return rep, courses


def format_report(rep, title="validate"):
    lines = []
    for lang, ptr, msg in rep.errors:
        lines.append(f"ERROR   [{lang}] {ptr}: {msg}")
    for lang, ptr, msg in rep.warnings:
        lines.append(f"WARNING [{lang}] {ptr}: {msg}")
    lines.append(f"{title}: {len(rep.errors)} error(s), {len(rep.warnings)} warning(s)")
    return "\n".join(lines)
