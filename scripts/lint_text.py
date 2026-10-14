#!/usr/bin/env python3
"""Check course texts against the GAX microtypography and language rules.

Usage: python3 lint_text.py <course-dir> [--lang de-CH|en-GB] [--strict]

Errors (e.g. 'ß' in de-CH) exit with code 1; warnings only with --strict.
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gaxlib.course import LANGUAGES, available_languages, load_course  # noqa: E402
from gaxlib.lint import lint_course  # noqa: E402


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("course_dir", type=Path)
    parser.add_argument("--lang", choices=LANGUAGES, action="append")
    parser.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = parser.parse_args(argv)

    langs = args.lang or available_languages(args.course_dir)
    if not langs:
        print(f"no course files found in {args.course_dir}")
        return 1
    errors = warnings = 0
    for lang in langs:
        try:
            course = load_course(args.course_dir, lang)
        except (OSError, ValueError) as exc:
            print(f"ERROR   [{lang}] cannot read course file: {exc}")
            errors += 1
            continue
        for severity, rule, ptr, msg, excerpt in lint_course(course, lang):
            label = "ERROR  " if severity == "error" else "WARNING"
            print(f"{label} [{lang}] {ptr}: {msg} ({rule})\n          «{excerpt}»")
            if severity == "error":
                errors += 1
            else:
                warnings += 1
    print(f"lint: {errors} error(s), {warnings} warning(s)")
    return 1 if errors or (args.strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main())
