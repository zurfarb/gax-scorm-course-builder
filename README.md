# gax-scorm-course-builder

Claude-Code-Skill, der aus Rohmaterial (PDF, Markdown, Text, PNG) und einer Kursidee mit Lernzielen einen didaktisch aufbereiteten E-Learning-Kurs erstellt und ihn als SCORM-Paket ausliefert:

- **SCORM 2004 (4th Edition)** als Standard; 3rd Edition und SCORM 1.2 auf Wunsch
- **de-CH** (Leitsprache, Du-Form) und **en-GB**, ein Paket pro Sprache
- **GAX-Design** (Farben, Typografie, Microtypografie), WCAG 2.1 AA
- Single-SCO, läuft offline (keine externen Abhängigkeiten im Paket)

> Status: erste vollständige Version, Pilotkurs ausstehend.

## Installation

Persönlich, für alle Projekte:

```bash
git clone <repo-url> ~/.claude/skills/gax-scorm-course-builder
```

Nur für ein Projekt:

```bash
git clone <repo-url> <projekt>/.claude/skills/gax-scorm-course-builder
```

Voraussetzungen: Claude Code, Python 3.10+. Es werden keine zusätzlichen Python-Pakete benötigt.

Aktualisieren: `git -C ~/.claude/skills/gax-scorm-course-builder pull`

## Nutzung

Einen Kursordner anlegen, Rohmaterial nach `input/` legen und Claude Code darin starten:

```
mein-kurs/
├─ brief.md      (optional: Idee, Zielgruppe, Lernziele)
└─ input/        (PDF, MD, TXT, PNG)
```

Beispiel-Prompt:

> Erstelle aus dem Material in input/ einen SCORM-Kurs zum Thema Datenschutz für neue Mitarbeitende, ca. 20 Minuten.

Ablauf:

1. **Analyse** des Materials und der Kursidee
2. **Kurskonzept** (`concept.md`) → *Freigabe 1*
3. **Kursinhalt de-CH** (`course.de-CH.json`) + Vorschau → *Freigabe 2*
4. **Übersetzung en-GB** (`course.en-GB.json`)
5. **Build**: Vorschau und ein ZIP-Paket pro Sprache in `dist/`

Die Pakete können direkt in ein LMS (z. B. Smart Courses for Confluence) hochgeladen werden.

## Skripte

| Befehl | Zweck |
|---|---|
| `python3 scripts/validate.py <kurs>` | Schema, IDs, Antworten, Lernziel-Abdeckung, Bilder, Parität de-CH/en-GB |
| `python3 scripts/lint_text.py <kurs>` | Microtypografie (« », —, …, ×), ss statt ß, Du-Form, britische Schreibweise |
| `python3 scripts/build.py <kurs>` | Vorschau + ZIPs (SCORM 2004 4th; `--scorm2004-edition 3rd\|both` für 3rd Edition, `--scorm12` zusätzlich SCORM 1.2) |
| `python3 scripts/preview.py <kurs>` | Lokaler Server: Vorschau und Test-LMS (SCORM 1.2/2004) mit Live-Protokoll aller LMS-Aufrufe |
| `python3 -m unittest discover tests` | Tests der Skripte |

## Aufbau des Skills

```
SKILL.md                    Anleitung für den Agenten (Ablauf, Regeln)
references/                 Didaktik, Elemente, Sprach- und Typografieregeln
schemas/course.schema.json  Format der Kursdateien
scripts/                    build.py, lint_text.py, validate.py, preview.py
templates/                  HTML/CSS/JS-Player, Manifest-Vorlagen
assets/                     theme.json (Design-Tokens), Schriften
examples/                   Beispielkurs
tests/                      Tests der Skripte
```

## Design anpassen

Alle Farben, Schriftgrössen und Abstände stehen in `assets/theme.json`. Werte mit `_assumed` sind Platzhalter, bis die offiziellen GAX-Werte vorliegen (Mobile-Typografie, Small/Caption, Spacing).
