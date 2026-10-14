#!/usr/bin/env python3
"""Validate course files against the schema and the didactic/technical rules.

Usage: python3 validate.py <course-dir> [--lang de-CH|en-GB] [--strict]

Checks: JSON schema, unique ids, correct-answer rules, objective coverage,
images, and that all languages share ids, answers, settings and images.
Exit code 1 on errors (or on warnings with --strict).
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gaxlib.checks import format_report, validate  # noqa: E402
from gaxlib.course import LANGUAGES  # noqa: E402


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("course_dir", type=Path)
    parser.add_argument("--lang", choices=LANGUAGES, action="append", help="limit to one language (repeatable)")
    parser.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = parser.parse_args(argv)

    rep, _ = validate(args.course_dir, args.lang)
    print(format_report(rep))
    failed = rep.errors or (args.strict and rep.warnings)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
