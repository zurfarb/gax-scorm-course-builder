"""Course folder helpers shared by build, validate and lint."""

import json
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[2]
SCHEMA_PATH = SKILL_DIR / "schemas" / "course.schema.json"
LANGUAGES = ("de-CH", "en-GB")
LEAD_LANGUAGE = "de-CH"

# Keys whose string values are learner-facing text (checked by lint, translated).
TEXT_KEYS = {
    "title", "subtitle", "description", "audience", "intro", "body", "text", "prompt",
    "front", "back", "situation", "correct", "incorrect", "explanation", "caption",
    "alt", "left", "right", "term", "definition", "feedback",
}


def course_file(course_dir, lang):
    return Path(course_dir) / f"course.{lang}.json"


def available_languages(course_dir):
    return [lang for lang in LANGUAGES if course_file(course_dir, lang).exists()]


def load_course(course_dir, lang):
    path = course_file(course_dir, lang)
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def load_schema():
    with open(SCHEMA_PATH, encoding="utf-8") as fh:
        return json.load(fh)


def iter_texts(node, path=()):
    """Yields (json_pointer, text) for every learner-facing string."""
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str) and key in TEXT_KEYS:
                yield _ptr(path + (key,)), value
            elif key == "items" and isinstance(value, list) and value and all(isinstance(v, str) for v in value):
                for i, item in enumerate(value):
                    yield _ptr(path + (key, i)), item
            else:
                yield from iter_texts(value, path + (key,))
    elif isinstance(node, list):
        for i, item in enumerate(node):
            yield from iter_texts(item, path + (i,))


def iter_images(node, path=()):
    """Yields (json_pointer, image_dict) for every image object."""
    if isinstance(node, dict):
        if "src" in node and "alt" in node:
            yield _ptr(path), node
            return
        for key, value in node.items():
            yield from iter_images(value, path + (key,))
    elif isinstance(node, list):
        for i, item in enumerate(node):
            yield from iter_images(item, path + (i,))


def resolve_image(course_dir, src, lang):
    """Returns the file to use for src: a localized variant name.<lang>.ext if present."""
    base = Path(course_dir) / src
    localized = base.with_name(f"{base.stem}.{lang}{base.suffix}")
    if localized.exists():
        return localized
    if base.exists():
        return base
    return None


def _ptr(path):
    return "/" + "/".join(str(p) for p in path)
