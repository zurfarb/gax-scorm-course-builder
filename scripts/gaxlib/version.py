"""Skill version written into every package, so a ZIP can be traced to the skill state it was built with."""

import subprocess

from .course import SKILL_DIR

NAME = "gax-scorm-course-builder"


def _git(*args):
    try:
        out = subprocess.run(["git", "-C", str(SKILL_DIR), *args], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout.strip() if out.returncode == 0 else None


def skill_version():
    """e.g. {'version': '0.1.0', 'commit': 'a1b2c3d', 'dirty': False, 'label': '0.1.0 (a1b2c3d)'}"""
    version = (SKILL_DIR / "VERSION").read_text(encoding="utf-8").strip()
    commit = _git("rev-parse", "--short", "HEAD")
    dirty = bool(_git("status", "--porcelain", "--untracked-files=no")) if commit else False
    label = version
    if commit:
        label += f" ({commit}{'+changes' if dirty else ''})"
    return {"version": version, "commit": commit, "dirty": dirty, "label": label}
