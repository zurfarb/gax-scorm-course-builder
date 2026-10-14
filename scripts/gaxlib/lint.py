"""Microtypography and language rules for course texts (see references/microtypography.md)."""

import re

from .course import iter_texts

NNBSP = " "

# (rule id, severity, languages or None for all, compiled regex, message)
RULES = [
    ("sharp-s", "error", ("de-CH",), re.compile("ß"), "Swiss German uses 'ss' instead of 'ß'"),
    ("quotes-de", "warning", ("de-CH",), re.compile(r'["„“”]'), "use Swiss quotation marks «…»"),
    ("quotes-en", "warning", ("en-GB",), re.compile(r'["„«»]'), "use British quotation marks ‘…’ (nested “…”)"),
    ("apostrophe", "warning", None, re.compile(r"(?<=\w)'(?=\w)"), "use the typographic apostrophe ’"),
    ("ellipsis", "warning", None, re.compile(r"\.\.\."), "use the ellipsis character …"),
    ("spaced-hyphen", "warning", None, re.compile(r"(?<=\w) - (?=\w)"), "use an em dash with spaces ' — ' as sentence dash"),
    ("en-dash-sentence", "warning", None, re.compile(r"(?<=[^\d\s.]) – (?=[^\d\s])"),
     "GAX: sentence dash is the em dash ' — '; the en dash is for ranges only"),
    ("range-hyphen", "warning", None, re.compile(r"\b\d+ ?- ?\d+\b(?!-)"), "use an en dash for ranges: 8 – 10"),
    ("times", "warning", None, re.compile(r"\b\d+ ?[xX] ?\d+\b"), "use the multiplication sign: 800 × 600"),
    ("thousands", "warning", None, re.compile(r"\b\d{2,3}(?:[’', ]\d{3})+\b"),
     "GAX: thousands separator is a narrow no-break space (U+202F): 10 000"),
    ("double-space", "warning", None, re.compile(r"\S  +\S"), "double space"),
    ("formal-address", "warning", ("de-CH",), re.compile(r"(?<=[a-zäöü,] )(Sie|Ihnen|Ihre[nmrs]?|Ihr)\b"),
     "the course addresses learners with 'du', not 'Sie'"),
]

# Common American spellings and their British forms.
US_TO_GB = {
    "color": "colour", "colors": "colours", "favorite": "favourite", "behavior": "behaviour",
    "honor": "honour", "labor": "labour", "neighbor": "neighbour", "center": "centre",
    "centers": "centres", "meter": "metre", "liter": "litre", "theater": "theatre",
    "organize": "organise", "organized": "organised", "organization": "organisation",
    "organizations": "organisations", "realize": "realise", "recognize": "recognise",
    "recognized": "recognised", "analyze": "analyse", "analyzed": "analysed", "prioritize": "prioritise",
    "summarize": "summarise", "customize": "customise", "optimize": "optimise", "minimize": "minimise",
    "maximize": "maximise", "apologize": "apologise", "authorize": "authorise", "authorized": "authorised",
    "catalog": "catalogue", "dialog": "dialogue", "defense": "defence", "offense": "offence",
    "license": "licence (noun)", "gray": "grey", "traveled": "travelled",
    "traveling": "travelling", "labeled": "labelled", "canceled": "cancelled", "modeling": "modelling",
    "fulfill": "fulfil", "enroll": "enrol", "enrollment": "enrolment",
}
_US_WORDS = re.compile(r"\b(" + "|".join(sorted(US_TO_GB, key=len, reverse=True)) + r")\b", re.IGNORECASE)

MAX_PAGE_WORDS = 250


def _excerpt(text, start, end, width=24):
    a, b = max(0, start - width), min(len(text), end + width)
    snippet = text[a:b].replace("\n", " ")
    return ("…" if a else "") + snippet + ("…" if b < len(text) else "")


def _visible(blocks):
    """Blocks as initially shown: accordion panels are collapsed, so only their titles count."""
    shown = []
    for block in blocks:
        if block.get("type") == "accordion":
            block = dict(block, items=[{"title": i.get("title", "")} for i in block.get("items", [])])
        shown.append(block)
    return shown


def lint_course(course, lang):
    """Returns list of (severity, rule, pointer, message, excerpt)."""
    findings = []
    for ptr, text in iter_texts(course):
        if text != text.strip():
            findings.append(("warning", "whitespace", ptr, "leading or trailing whitespace", text[:40]))
        for rule, severity, langs, rx, msg in RULES:
            if langs and lang not in langs:
                continue
            for m in rx.finditer(text):
                findings.append((severity, rule, ptr, msg, _excerpt(text, m.start(), m.end())))
        if lang == "en-GB":
            for m in _US_WORDS.finditer(text):
                word = m.group(1)
                findings.append(("warning", "us-spelling", ptr, f"American spelling '{word}' -> '{US_TO_GB[word.lower()]}'",
                                 _excerpt(text, m.start(), m.end())))

    for ci, ch in enumerate(course.get("chapters", [])):
        for pi, page in enumerate(ch.get("pages", [])):
            words = sum(len(t.split()) for _, t in iter_texts(_visible(page.get("blocks", []))))
            if words > MAX_PAGE_WORDS:
                findings.append(("warning", "page-length", f"/chapters/{ci}/pages/{pi}",
                                 f"{words} visible words on one page (max. ~{MAX_PAGE_WORDS}); split the page or move optional detail into an accordion",
                                 page.get("title", "")))
    return findings
