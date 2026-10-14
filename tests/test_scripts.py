"""Tests for the build, validation and lint scripts (standard library only).

Run from the skill folder: python3 -m unittest discover tests
"""

import contextlib
import io
import json
import shutil
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build  # noqa: E402
from gaxlib.checks import validate  # noqa: E402
from gaxlib.lint import lint_course  # noqa: E402
from gaxlib.theme import load_theme, theme_to_css  # noqa: E402

EXAMPLE = ROOT / "examples" / "minimal-course"


def quiet(fn, *args):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*args)


class CourseCopy:
    """Temporary copy of the example course that tests may modify."""

    def __enter__(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name) / "course"
        shutil.copytree(EXAMPLE, self.dir, ignore=shutil.ignore_patterns("dist"))
        return self

    def __exit__(self, *exc):
        self.tmp.cleanup()

    def load(self, lang="de-CH"):
        return json.loads((self.dir / f"course.{lang}.json").read_text(encoding="utf-8"))

    def save(self, data, lang="de-CH"):
        (self.dir / f"course.{lang}.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def messages(rep):
    return [m for _, _, m in rep.errors]


class ThemeTest(unittest.TestCase):
    def test_references_resolved_and_mobile_overrides(self):
        css = theme_to_css(load_theme(ROOT / "assets" / "theme.json"))
        self.assertNotIn("{palette", css)
        self.assertIn("--color-brand-primary: #", css)
        self.assertIn("--font-weight-bold: 650;", css)
        self.assertIn("@media (max-width: 767px)", css)


class ValidateTest(unittest.TestCase):
    def test_example_is_valid(self):
        rep, courses = validate(EXAMPLE)
        self.assertEqual(rep.errors, [])
        self.assertEqual(set(courses), {"de-CH", "en-GB"})

    def test_detects_semantic_errors(self):
        with CourseCopy() as c:
            data = c.load()
            data["quiz"]["questions"][0]["type"] = "single"
            data["quiz"]["questions"][0]["options"] = [
                {"id": "a", "text": "A", "correct": True}, {"id": "b", "text": "B", "correct": True}]
            data["chapters"][0]["objectives"].append("does-not-exist")
            data["chapters"][0]["pages"][0]["blocks"][0]["image"]["src"] = "images/missing.png"
            c.save(data)
            rep, _ = validate(c.dir, ["de-CH"])
            text = " | ".join(messages(rep))
            self.assertIn("exactly 1 correct option", text)
            self.assertIn("unknown objective", text)
            self.assertIn("image not found", text)

    def test_schema_rejects_unknown_property(self):
        with CourseCopy() as c:
            data = c.load()
            data["chapters"][0]["pages"][0]["blocks"][0]["colour"] = "red"
            c.save(data)
            rep, _ = validate(c.dir, ["de-CH"])
            self.assertTrue(any("unknown property 'colour'" in m for m in messages(rep)))

    def test_parity_between_languages(self):
        with CourseCopy() as c:
            data = c.load("en-GB")
            data["quiz"]["questions"][0]["answer"] = not data["quiz"]["questions"][0]["answer"]
            c.save(data, "en-GB")
            rep, _ = validate(c.dir)
            self.assertTrue(any("differs from de-CH" in m for m in messages(rep)))


class DurationTest(unittest.TestCase):
    def test_estimate_and_rounding(self):
        from gaxlib.duration import estimate, rounded
        data = json.loads((EXAMPLE / "course.de-CH.json").read_text(encoding="utf-8"))
        est = estimate(data)
        self.assertEqual((est["checks"], est["scenarios"], est["questions"]), (1, 1, 7))
        self.assertLessEqual(abs(est["minutes"] - data["durationMinutes"]), 5)
        self.assertEqual([rounded(x) for x in (2, 22.4, 22.5, 28.2)], [5, 20, 25, 30])

    def test_warns_when_duration_is_off(self):
        with CourseCopy() as c:
            data = c.load()
            data["durationMinutes"] = 45
            c.save(data)
            rep, _ = validate(c.dir, ["de-CH"])
            self.assertTrue(any("durationMinutes" in p for _, p, _ in rep.warnings))

    def test_warns_about_image_text_without_variant(self):
        with CourseCopy() as c:
            for lang in ("de-CH", "en-GB"):
                data = c.load(lang)
                data["chapters"][0]["pages"][0]["blocks"][0]["image"]["hasText"] = True
                c.save(data, lang)
            rep, _ = validate(c.dir)
            self.assertTrue(any(lang == "en-GB" and "no en-GB variant" in m for lang, _, m in rep.warnings))
            self.assertFalse(any(lang == "de-CH" and "variant" in m for lang, _, m in rep.warnings))
            shutil.copy2(c.dir / "images" / "password-shield.png", c.dir / "images" / "password-shield.en-GB.png")
            rep, _ = validate(c.dir)
            self.assertFalse(any("variant" in m for _, _, m in rep.warnings))


class LintTest(unittest.TestCase):
    def rules(self, text, lang):
        return {f[1] for f in lint_course({"description": text, "chapters": []}, lang)}

    def test_swiss_german_rules(self):
        self.assertEqual({"sharp-s"} & self.rules("Grüße", "de-CH"), {"sharp-s"})
        found = self.rules('Er sagt "ja" ... 800x600 - fertig. Können Sie das?', "de-CH")
        self.assertTrue({"quotes-de", "ellipsis", "times", "spaced-hyphen", "formal-address"} <= found)

    def test_british_english_rules(self):
        self.assertIn("us-spelling", self.rules("Pick a color.", "en-GB"))
        self.assertNotIn("us-spelling", self.rules("Pick a colour.", "en-GB"))
        self.assertNotIn("sharp-s", self.rules("Straße", "en-GB"))

    def test_example_is_clean(self):
        for lang in ("de-CH", "en-GB"):
            data = json.loads((EXAMPLE / f"course.{lang}.json").read_text(encoding="utf-8"))
            self.assertEqual(lint_course(data, lang), [], lang)


class BuildTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.copy = CourseCopy().__enter__()
        # localized image variant for en-GB must win over the neutral file
        shutil.copy2(cls.copy.dir / "images" / "password-shield.png", cls.copy.dir / "images" / "password-shield.en-GB.png")
        cls.result = quiet(build.main, [str(cls.copy.dir), "--scorm2004-edition", "both", "--scorm12"])
        cls.dist = cls.copy.dir / "dist"

    @classmethod
    def tearDownClass(cls):
        cls.copy.__exit__(None, None, None)

    def test_build_succeeds_with_all_packages(self):
        self.assertEqual(self.result, 0)
        names = sorted(p.name for p in self.dist.glob("*.zip"))
        self.assertEqual(len(names), 6, names)
        self.assertTrue((self.dist / "de-CH" / "index.html").exists())

    def test_manifest_first_and_lists_every_file(self):
        for zpath in self.dist.glob("*.zip"):
            with zipfile.ZipFile(zpath) as zf:
                names = zf.namelist()
                self.assertEqual(names[0], "imsmanifest.xml")
                root = ElementTree.fromstring(zf.read("imsmanifest.xml"))
                hrefs = {e.get("href") for e in root.iter() if e.tag.endswith("}file")}
                self.assertEqual(hrefs, set(names) - {"imsmanifest.xml"}, zpath.name)
                self.assertIn("index.html", names)
                self.assertIn("fonts/OFL.txt", names)

    def test_manifest_versions(self):
        def manifest(suffix):
            with zipfile.ZipFile(next(self.dist.glob(f"*_de-CH_{suffix}.zip"))) as zf:
                return zf.read("imsmanifest.xml").decode("utf-8")
        m12, m4, m3 = manifest("scorm12"), manifest("scorm2004"), manifest("scorm2004-3rd")
        self.assertIn("<schemaversion>1.2</schemaversion>", m12)
        self.assertNotIn("masteryscore", m12)
        self.assertIn("<schemaversion>2004 4th Edition</schemaversion>", m4)
        self.assertIn("<schemaversion>2004 3rd Edition</schemaversion>", m3)
        self.assertNotIn("adlnav", m3)
        for m in (m4, m3):
            self.assertIn('completionSetByContent="true"', m)
            self.assertIn('rollupProgressCompletion="true"', m)

    def test_runtime_and_language_baked_in(self):
        with zipfile.ZipFile(next(self.dist.glob("*_en-GB_scorm2004.zip"))) as zf:
            js = zf.read("data/course.js").decode("utf-8")
            html = zf.read("index.html").decode("utf-8")
            self.assertIn('window.GAX_BUILD = {"scorm": "2004", "skill": "gax-scorm-course-builder ', js)
            self.assertIn('<meta name="generator" content="gax-scorm-course-builder ', html)
            manifest = zf.read("imsmanifest.xml").decode("utf-8")
            self.assertIn("<!-- Generated by gax-scorm-course-builder ", manifest)
            self.assertIn('"src": "images/password-shield.en-GB.png"', js)
            self.assertIn('<html lang="en-GB">', html)
            self.assertNotIn("{{", html)

    def test_default_builds_only_scorm2004_4th(self):
        with CourseCopy() as c:
            self.assertEqual(quiet(build.main, [str(c.dir)]), 0)
            names = sorted(p.name for p in (c.dir / "dist").glob("*.zip"))
            self.assertEqual(names, ["sichere-passwoerter_de-CH_scorm2004.zip", "sichere-passwoerter_en-GB_scorm2004.zip"])

    def test_build_refuses_invalid_course(self):
        with CourseCopy() as c:
            data = c.load()
            data["title"] = "Straße"
            c.save(data)
            self.assertEqual(quiet(build.main, [str(c.dir), "--lang", "de-CH"]), 1)
            self.assertFalse((c.dir / "dist").exists())


if __name__ == "__main__":
    unittest.main()
