#!/usr/bin/env python3
"""Build HTML preview and SCORM packages from course.<lang>.json files.

Usage:
  python3 build.py <course-dir> [--lang de-CH|en-GB] [--scorm2004-edition 4th|3rd|both]
                   [--scorm12] [--out <dir>] [--preview-only]

Output (default <course-dir>/dist):
  <lang>/index.html                     preview, runs in any browser (mock LMS)
  <id>_<lang>_scorm2004.zip             SCORM 2004 4th Edition (default)
  <id>_<lang>_scorm2004-3rd.zip         SCORM 2004 3rd Edition (only with 3rd/both)
  <id>_<lang>_scorm12.zip               SCORM 1.2 (only with --scorm12)

The build refuses to run while validate.py or lint_text.py report errors.
"""

import argparse
import copy
import json
import shutil
import sys
import tempfile
import zipfile
from html import escape
from pathlib import Path
from xml.etree import ElementTree

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gaxlib.checks import format_report, validate  # noqa: E402
from gaxlib.course import LANGUAGES, LEAD_LANGUAGE, SKILL_DIR, iter_images, resolve_image  # noqa: E402
from gaxlib.duration import estimate, rounded  # noqa: E402
from gaxlib.lint import lint_course  # noqa: E402
from gaxlib.manifest import build_manifest  # noqa: E402
from gaxlib.theme import load_theme, theme_to_css  # noqa: E402
from gaxlib.version import NAME, skill_version  # noqa: E402

PLAYER_DIR = SKILL_DIR / "templates" / "player"
THEME_PATH = SKILL_DIR / "assets" / "theme.json"
FONT_DIR = SKILL_DIR / "assets" / "fonts" / "roboto"
ZIP_DATE = (2020, 1, 1, 0, 0, 0)  # fixed timestamps -> reproducible packages

NOSCRIPT = {"de-CH": "Für diesen Kurs muss JavaScript aktiviert sein.", "en-GB": "This course requires JavaScript."}
PACKAGE_SUFFIX = {"1.2": "scorm12", "2004-4th": "scorm2004", "2004-3rd": "scorm2004-3rd"}
RUNTIME = {"1.2": "1.2", "2004-4th": "2004", "2004-3rd": "2004", "preview": "preview"}


def assemble(course, course_dir, lang, dest, scorm):
    """Writes a complete, self-contained player for one language into dest."""
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(PLAYER_DIR, dest)
    (dest / "css" / "theme.css").write_text(theme_to_css(load_theme(THEME_PATH)), encoding="utf-8")

    fonts = dest / "fonts"
    fonts.mkdir()
    for f in FONT_DIR.iterdir():
        if f.suffix in (".woff2", ".txt"):
            shutil.copy2(f, fonts / f.name)

    data = copy.deepcopy(course)
    data.pop("$schema", None)
    for _, img in iter_images(data):
        source = resolve_image(course_dir, img["src"], lang)
        target = Path(img["src"]).parent / source.name
        (dest / target).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest / target)
        img["src"] = target.as_posix()

    (dest / "data").mkdir()
    (dest / "data" / "course.js").write_text(
        "window.GAX_COURSE = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
        + "window.GAX_BUILD = " + json.dumps({"scorm": RUNTIME[scorm], "skill": f"{NAME} {skill_version()['label']}"}) + ";\n",
        encoding="utf-8")

    index = dest / "index.html"
    html = index.read_text(encoding="utf-8")
    html = (html.replace("{{LANG}}", escape(lang))
                .replace("{{TITLE}}", escape(course["title"]))
                .replace("{{NOSCRIPT}}", escape(NOSCRIPT.get(lang, NOSCRIPT[LEAD_LANGUAGE])))
                .replace("{{GENERATOR}}", escape(f"{NAME} {skill_version()['label']}")))
    index.write_text(html, encoding="utf-8")


def package(course, course_dir, lang, scorm, out_dir):
    with tempfile.TemporaryDirectory() as tmp:
        stage = Path(tmp) / "pkg"
        assemble(course, course_dir, lang, stage, scorm)
        files = sorted(p.relative_to(stage).as_posix() for p in stage.rglob("*") if p.is_file())
        manifest = build_manifest(course, files, scorm, generator=f"{NAME} {skill_version()['label']}")
        ElementTree.fromstring(manifest.encode("utf-8"))  # must be well-formed
        target = out_dir / f"{course['id']}_{lang}_{PACKAGE_SUFFIX[scorm]}.zip"
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            _write(zf, "imsmanifest.xml", manifest.encode("utf-8"))
            for rel in files:
                _write(zf, rel, (stage / rel).read_bytes())
        return target, len(files) + 1


def _write(zf, name, data):
    info = zipfile.ZipInfo(name, date_time=ZIP_DATE)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    zf.writestr(info, data)


def neutral_images(course, course_dir, lang):
    """Images that fall back to the neutral file although another language has its own variant."""
    result = []
    for _, img in iter_images(course):
        base = Path(course_dir) / img["src"]
        used = resolve_image(course_dir, img["src"], lang)
        others = [base.with_name(f"{base.stem}.{other}{base.suffix}") for other in LANGUAGES if other != lang]
        if used == base and any(o.exists() for o in others):
            result.append(img["src"])
    return sorted(set(result))


def summary(course):
    pages = sum(len(ch["pages"]) for ch in course["chapters"])
    est = estimate(course)
    return (f"{pages} pages, {est['checks']} checks, {est['scenarios']} scenarios, {est['questions']} quiz questions, "
            f"~{est['minutes']:.0f} min estimated (durationMinutes: {course.get('durationMinutes', '-')})")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Build HTML preview and SCORM packages.")
    parser.add_argument("course_dir", type=Path)
    parser.add_argument("--lang", choices=LANGUAGES, action="append", help="build only this language (repeatable)")
    parser.add_argument("--scorm2004-edition", choices=("4th", "3rd", "both"), default="4th")
    parser.add_argument("--scorm12", action="store_true", help="also build a SCORM 1.2 package (for LMSs without SCORM 2004)")
    parser.add_argument("--out", type=Path, help="output folder (default: <course-dir>/dist)")
    parser.add_argument("--preview-only", action="store_true", help="only build the HTML preview, no ZIPs")
    args = parser.parse_args(argv)

    course_dir = args.course_dir.resolve()
    rep, courses = validate(course_dir, args.lang)
    lint_errors = []
    for lang, course in courses.items():
        lint_errors += [f for f in lint_course(course, lang) if f[0] == "error"]
    if not rep.ok or lint_errors:
        print(format_report(rep))
        for _, rule, ptr, msg, excerpt in lint_errors:
            print(f"ERROR   lint {ptr}: {msg} ({rule}) «{excerpt}»")
        print("build aborted: fix the errors above (validate.py / lint_text.py show details).")
        return 1

    version = skill_version()
    print(f"{NAME} {version['label']}")
    if version["dirty"]:
        print("  note     the skill has uncommitted changes; the version label is not exactly reproducible")
    out_dir = (args.out or course_dir / "dist").resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    editions = {"4th": ["2004-4th"], "3rd": ["2004-3rd"], "both": ["2004-4th", "2004-3rd"]}[args.scorm2004_edition]

    for lang, course in courses.items():
        preview = out_dir / lang
        assemble(course, course_dir, lang, preview, "preview")
        print(f"[{lang}] {course['title']} v{course['version']}: {summary(course)}")
        print(f"  preview  {preview / 'index.html'}")
        if not args.preview_only:
            for scorm in editions + (["1.2"] if args.scorm12 else []):
                target, count = package(course, course_dir, lang, scorm, out_dir)
                print(f"  package  {target}  ({count} files, {target.stat().st_size // 1024} KB)")
        for src in neutral_images(course, course_dir, lang):
            print(f"  note     {src}: no {lang} variant, the language-neutral image is used")
        if lang != LEAD_LANGUAGE:
            for _, img in iter_images(course):
                used = resolve_image(course_dir, img["src"], lang)
                if img.get("hasText") and used is not None and f".{lang}." not in used.name:
                    print(f"  note     {img['src']}: contains text but has no {lang} variant, the {LEAD_LANGUAGE} image is used")
    if rep.warnings:
        print(f"{len(rep.warnings)} validation warning(s); run validate.py for details.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
