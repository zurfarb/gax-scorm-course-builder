---
name: gax-scorm-course-builder
description: Designs and builds didactically sound e-learning courses as SCORM packages (SCORM 2004 4th Edition by default; 3rd Edition and SCORM 1.2 on request) in GAX design, in Swiss German (de-CH) and British English (en-GB). Turns raw material (PDF, Markdown, text, PNG images) plus a course idea and learning objectives into a course concept, course content, an HTML course player and LMS-ready ZIP files. Use this skill whenever the user wants to create, update, translate or rebuild an e-learning course, online training, web-based training (WBT), micro-learning, LMS course or SCORM package, or asks to turn documents into a course, training or quiz for an LMS (e.g. Smart Courses for Confluence, Moodle) — even if the word SCORM is not mentioned. Also triggers on German requests like "Kurs erstellen", "E-Learning", "Schulung", "Lernmodul", "SCORM-Paket".
---

# GAX SCORM Course Builder

You turn raw material and a rough course idea into a finished e-learning course. The course is not a 1:1 copy of the material: you design it from the learning objectives, select and condense content, and choose interaction types that fit what learners must be able to do afterwards. A deterministic Python build then turns your course content into HTML and SCORM packages, so your job is the didactic and editorial work, and the scripts guarantee technical correctness.

Paths below are relative to this skill's directory (`<skill>`), except course files, which live in the user's course folder (`<course>`). Scripts use only the Python standard library; run them with `python3`.

## Course folder

Work in a folder per course, outside this skill's repository. Ask the user for its location if it is not obvious. Create missing parts.

```
<course>/
├─ brief.md               idea, audience, objectives, constraints (from the user, or written by you from the conversation)
├─ input/                 raw material: PDF, MD, TXT, PNG
├─ images/                images used in the course (copied/cropped from input), optional localized variants name.de-CH.png
├─ concept.md             course concept (step 2, approval 1)
├─ course.de-CH.json      lead language (step 3, approval 2)
├─ course.en-GB.json      translation (step 4)
└─ dist/                  build output: HTML preview + 1 ZIP per language
```

## Workflow

The two approval stops exist because rework is expensive: changing structure after texts are written, or texts after they are translated, multiplies effort. Stop at each one, show the user what they need to decide, and wait for an explicit go.

### 1. Analyse

- Read `brief.md` and everything in `input/`. Claude Code reads PDFs and images directly.
- If no brief exists, write `brief.md` following `references/brief-template.md`: topic, audience and prior knowledge, what learners should be able to do afterwards, target duration, must-have content, things to leave out, and an overview of the material.
- Ask the user before the concept only if the topic or the material is missing entirely. For everything else (audience, duration, languages …) make a plausible assumption, mark it in `brief.md`, and clarify it at approval 1. One round of questions with a concrete proposal on the table is faster for the user than questions in the abstract.
- Input exported from Obsidian, Confluence or wikis (frontmatter, `[[links]]`, embedded images) is handled as described in `references/didactics.md`, section 9.
- Note gaps and contradictions in the material instead of filling them with invented facts. Course content must be traceable to the input or the user's statements.

### 2. Concept → **STOP: approval 1**

Read `references/didactics.md` and `references/elements.md` first.

Write `concept.md` (in German, the user's working language) following `references/concept-template.md`, containing:
- learning objectives, sharpened to observable verbs, each with a Bloom level
- chapter structure: each chapter's objectives, pages with working title, key message and chosen elements (with a one-line reason)
- assessment plan: knowledge checks per chapter, final quiz questions per objective
- estimated duration, and open questions / gaps in the material

Present a compact summary in German and ask for approval or changes. Do not write course content before approval. Structure the message like this:

1. one sentence on what you read and where the concept and brief are
2. course title, audience, duration, languages, SCORM version
3. learning objectives (one line each, with level)
4. structure: one line per chapter (pages and main elements)
5. number of checks, scenarios and quiz questions; what was deliberately left out
6. the most important open questions and assumptions (max. ~6; the rest is in the concept)
7. if the estimate exceeds the target duration: the proposed cut
8. the question whether the concept is approved

### 3. Write lead language (de-CH) → **STOP: approval 2**

Read `references/language-de-CH.md`, `references/microtypography.md` and `schemas/course.schema.json`. `examples/minimal-course/` is a complete, valid course using every block and question type; use it as a pattern.

- Write `course.de-CH.json` following the schema and the approved concept.
- Copy or crop the needed images from `input/` into `images/`. Write meaningful alt texts. Set `"hasText": true` on images with readable text (see `references/elements.md`, Images).
- Small deviations from the approved concept are fine when they serve it (e.g. cutting optional depth to meet the target duration, avoiding a duplicate question). Record them in `concept.md` under «Änderungen nach Freigabe» and report them at approval 2. Ask first if a deviation touches objectives, chapter structure or the user's answers.
- Run `python3 <skill>/scripts/lint_text.py <course>` and `python3 <skill>/scripts/validate.py <course>`; fix every error, review warnings.
- Run `python3 <skill>/scripts/build.py <course> --lang de-CH` and give the user the preview path (`dist/de-CH/index.html`, opens in any browser with a simulated LMS). For a live log of every LMS call, the user can run `python3 <skill>/scripts/preview.py <course>` (a local server; start it in the background, it runs until stopped).

Ask for approval of the German version in a message structured like this, and do not translate before approval:

1. preview path (and the `preview.py` command for the test LMS), course file, de-CH package path
2. scope: chapters, pages, checks, scenarios, quiz questions, estimated duration
3. deviations from the approved concept («Änderungen nach Freigabe»)
4. how the user's answers to the open questions were applied
5. image issues (low resolution, missing language versions, unexplained markers)
6. what the user should review in particular (invented examples and scenarios, terminology, anything you were unsure about)
7. the question whether the German version is approved

### 4. Translate (en-GB)

Read `references/language-en-GB.md`.

- Create `course.en-GB.json` from the approved de-CH file. Keep every id, type, `correct`/`answer` value, pair and setting identical; translate texts only. `validate.py` checks this parity.
- Translate for meaning and tone, not word by word; adapt examples and idioms where they would not work in British English.
- Images with text need localized variants (`name.en-GB.png`). If you cannot produce them, list them for the user.

### 5. Build and validate

```bash
python3 <skill>/scripts/lint_text.py <course>
python3 <skill>/scripts/validate.py <course>
python3 <skill>/scripts/build.py <course>
```

The build refuses to run while validation or lint report errors. It produces, per language, a preview folder and one SCORM 2004 4th Edition package:

```
dist/<id>_de-CH_scorm2004.zip
dist/<id>_en-GB_scorm2004.zip
```

`imsmanifest.xml` is generated per package (never hand-written), listing every file. If the LMS needs SCORM 2004 3rd Edition (some corporate LMSs such as Cornerstone or Docebo handle it more reliably), add `--scorm2004-edition 3rd` (or `both`), which writes `<id>_<lang>_scorm2004-3rd.zip`. Only if the LMS cannot handle SCORM 2004 at all, add `--scorm12` for an additional `<id>_<lang>_scorm12.zip`.

Report to the user: package paths, page, check, scenario and question counts, estimated duration (both printed by the build), remaining warnings, and the build's `note` lines (images that still need localized versions).

## Fixed decisions

These were agreed with the course owners; follow them unless the user explicitly overrides them for a course.

| Topic | Rule |
|---|---|
| Packaging | Single SCO; one package per language; SCORM 2004 4th Edition (3rd Edition or SCORM 1.2 only on request). Tested and working in Smart Courses for Confluence |
| Completion | Completed when all pages were visited. Quiz score is reported, but does not gate completion |
| Final quiz | Unlimited attempts, shuffled questions and options, solutions shown after submitting, passing score 80 % |
| Resume | Last page, visited pages and best quiz result are restored (handled by the player) |
| Languages | de-CH (lead, informal "du") and en-GB. If the user did not mention languages, keep both but list en-GB as an assumption at approval 1 |
| Design | GAX design tokens (`assets/theme.json`), Roboto variable font, WCAG 2.1 AA |
| Emphasis | Bold, not colour. Colour is reserved for links, buttons and feedback states |

## Editing an existing course

Change the lead language file first, rerun lint/validate, then apply the same change to the other language and rebuild. Bump `version` (patch for text fixes, minor for new content), because LMSs often cache packages by version.

## Reference files

| File | Read when |
|---|---|
| `references/didactics.md` | step 2: objectives, structure, page length, assessment design |
| `references/elements.md` | step 2: element catalogue and when to use which |
| `references/brief-template.md` | step 1: structure of `brief.md` |
| `references/concept-template.md` | step 2: structure of `concept.md` |
| `references/language-de-CH.md` | step 3: Swiss German style, "du", vocabulary |
| `references/language-en-GB.md` | step 4: British English style |
| `references/microtypography.md` | steps 3-4: quotes, dashes, numbers, spaces |
| `schemas/course.schema.json` | steps 3-4: exact course file format |
| `examples/minimal-course/` | steps 3-4: complete valid course in both languages |
