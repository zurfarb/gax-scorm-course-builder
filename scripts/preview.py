#!/usr/bin/env python3
"""Build the HTML preview and serve it locally, optionally inside a test LMS.

Usage: python3 preview.py <course-dir> [--lang de-CH|en-GB] [--port 8000] [--no-build]

Prints three URLs:
  - preview with the built-in mock LMS (same as opening dist/<lang>/index.html)
  - test LMS SCORM 1.2 and test LMS SCORM 2004: the course runs in a frame next to
    a live log of every LMS call; invalid values are flagged in red.
Stops with Ctrl+C.
"""

import argparse
import functools
import http.server
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import build  # noqa: E402
from gaxlib.course import LANGUAGES, SKILL_DIR, available_languages  # noqa: E402

LMS_PAGE = SKILL_DIR / "templates" / "preview" / "lms.html"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main(argv=None):
    parser = argparse.ArgumentParser(description="Serve the course preview with a test LMS.")
    parser.add_argument("course_dir", type=Path)
    parser.add_argument("--lang", choices=LANGUAGES)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-build", action="store_true", help="serve the existing dist/ folder")
    args = parser.parse_args(argv)

    course_dir = args.course_dir.resolve()
    langs = [args.lang] if args.lang else available_languages(course_dir)
    if not langs:
        print(f"no course files found in {course_dir}")
        return 1
    dist = course_dir / "dist"
    if not args.no_build:
        build_args = [str(course_dir), "--preview-only"] + sum((["--lang", lang] for lang in langs), [])
        if build.main(build_args) != 0:
            return 1
    shutil.copy2(LMS_PAGE, dist / "_lms.html")

    base = f"http://localhost:{args.port}"
    print()
    for lang in langs:
        print(f"[{lang}]")
        print(f"  preview (mock LMS)  {base}/{lang}/index.html")
        print(f"  test LMS SCORM 1.2  {base}/_lms.html?v=1.2&launch={lang}/index.html")
        print(f"  test LMS SCORM 2004 {base}/_lms.html?v=2004&launch={lang}/index.html")
    print("\nCtrl+C to stop.", flush=True)

    handler = functools.partial(QuietHandler, directory=str(dist))
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
