"""Convert assets/theme.json (design tokens) into CSS custom properties.

Token references like "{palette.blue.dark}" are resolved to their values.
Keys starting with "_" are documentation and are skipped.
"""

import json
import re
from pathlib import Path

# Numeric tokens under these keys are unitless; all other numbers become px.
UNITLESS_KEYS = {"weight", "light", "regular", "bold"}
MOBILE_MAX_WIDTH = 767

_REF = re.compile(r"^\{([a-zA-Z0-9_.]+)\}$")


def _kebab(name):
    return re.sub(r"(?<=[a-z0-9])([A-Z])", r"-\1", str(name)).lower()


def _lookup(theme, dotted):
    node = theme
    for part in dotted.split("."):
        node = node[part]
    return node


def _resolve(theme, value, seen=()):
    if isinstance(value, str):
        m = _REF.match(value)
        if m:
            ref = m.group(1)
            if ref in seen:
                raise ValueError(f"circular token reference: {ref}")
            return _resolve(theme, _lookup(theme, ref), seen + (ref,))
    return value


def _format(key, value):
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value) if key in UNITLESS_KEYS else f"{value}px"
    return str(value)


def _flatten(theme, node, prefix, out):
    for key, value in node.items():
        if key.startswith("_"):
            continue
        name = f"{prefix}-{_kebab(key)}"
        if isinstance(value, dict):
            _flatten(theme, value, name, out)
        elif isinstance(value, (str, int, float)):
            out.append((name, _format(key, _resolve(theme, value))))


def load_theme(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def theme_to_css(theme):
    root, mobile = [], []

    font = theme.get("font", {})
    stack = ", ".join(x for x in (f'"{font.get("family", "Roboto")}"', font.get("fallback", "sans-serif")) if x)
    root.append(("--font-family", stack))
    for key, value in font.get("weights", {}).items():
        root.append((f"--font-weight-{_kebab(key)}", str(value)))

    for group, prefix in (("palette", "--palette"), ("color", "--color"),
                          ("radius", "--radius"), ("layout", "--layout")):
        if isinstance(theme.get(group), dict):
            _flatten(theme, theme[group], prefix, root)

    spacing = theme.get("spacing", {})
    if isinstance(spacing.get("scale"), dict):
        _flatten(theme, spacing["scale"], "--space", root)

    typo = theme.get("typography", {})
    if isinstance(typo.get("desktop"), dict):
        _flatten(theme, typo["desktop"], "--type", root)
    if isinstance(typo.get("mobile"), dict):
        _flatten(theme, typo["mobile"], "--type", mobile)

    shadow = theme.get("shadow")
    if isinstance(shadow, dict):
        _flatten(theme, shadow, "--shadow", root)

    lines = ["/* Generated from assets/theme.json - do not edit. */", ":root {"]
    lines += [f"  {name}: {value};" for name, value in root]
    lines.append("}")
    if mobile:
        lines.append(f"@media (max-width: {MOBILE_MAX_WIDTH}px) {{")
        lines.append("  :root {")
        lines += [f"    {name}: {value};" for name, value in mobile]
        lines.append("  }")
        lines.append("}")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    import sys

    print(theme_to_css(load_theme(sys.argv[1])))
