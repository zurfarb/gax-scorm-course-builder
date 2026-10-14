# Element catalogue

Which block to use when, and how to fill it. The exact JSON format is in `schemas/course.schema.json`; `examples/minimal-course/course.de-CH.json` uses every block. Texts support limited Markdown: paragraphs (blank line), `**bold**`, `*italic*`, `[link](https://…)`, `- ` and `1. ` lists.

## Contents

- Choosing elements
- Content blocks: text, text-image, image, callout, accordion, tabs, steps, flipcards, summary
- Practice blocks: check, scenario
- Final quiz question types: single, multiple, truefalse, matching
- Images

## Choosing elements

| You want learners to … | Use | Not |
|---|---|---|
| read a core explanation | `text` (with `lead` for the opening sentence), `text-image` | long `text` blocks back to back |
| see something (interface, diagram, process) | `text-image`, `image` | images that only decorate |
| notice a rule, tip or risk | `callout` | more than 1-2 callouts per page |
| optionally go deeper / FAQ | `accordion` | hiding need-to-know content |
| compare 2-5 variants, roles, do/don't | `tabs` | sequences (use steps) |
| follow a process in order | `steps` | unordered lists |
| learn terms or self-test definitions | `flipcards` | long explanations |
| check understanding right away | `check` | graded assessment |
| decide in a realistic situation | `scenario` | questions with one obvious answer |
| remember the key messages | `summary` | new information |

Vary elements: avoid the same interactive element on consecutive pages.

## Content blocks

### text
Explanation in short paragraphs (2-4 sentences each). `"lead": true` renders the paragraph larger and bold: use it once per page at most, for the key message.

### text-image
Text next to an image (stacked on phones). `imagePosition`: `right` (default) or `left`. Use when the image directly supports the text next to it. On desktop the image gets only about 300 px, so use it for photos, icons and simple illustrations. Diagrams with labels or small text belong in a full-width `image` block, otherwise the labels become unreadable.

### image
Full-width image with optional `caption`. Use for diagrams, screenshots or process graphics that need space.

### callout
Highlighted box. `variant`:
- `info`: neutral additional information
- `tip`: practical advice
- `warning`: risk, common mistake
- `important`: rule or obligation that must not be missed

`title` is optional (defaults to Info/Tipp/Achtung/Wichtig). Body: 1-3 sentences.

### accordion
Collapsible sections, 2-8 items. Titles as questions or clear labels (max. 60 characters). Content inside is optional reading: learners who skip it must still reach the objectives.

### tabs
2-5 tabs with short labels (1-3 words). Each panel has comparable content (same structure in every tab), so learners can compare.

### steps
Ordered process, 3-7 steps. Step title = imperative action ("Satz ausdenken"); body = 1-2 sentences on how.

### flipcards
2-9 cards. Front: a term or question (max. ~4 words). Back: definition or answer (max. ~30 words). Learners turn cards themselves, so use them for self-testing.

### summary
3-5 key takeaways as complete, short statements. Usually the last block of a chapter's last page. Default title "Das Wichtigste in Kürze" / "Key takeaways".

## Practice blocks

### check (knowledge check)
One ungraded question with immediate feedback, using any question type below. On a wrong answer the learner can retry or reveal the solution. Place it right after the content it checks.

### scenario
A realistic situation with 2-4 choices; each choice has its own `feedback` describing the **consequence** of that decision, not just right/wrong. At least one choice is `correct`; partially good choices are `correct: false` with feedback that explains what is missing.
- `situation`: 2-4 sentences, concrete (who, what, where), close to the learners' work.
- Choices: actions in first person ("Ich ändere …"), similar length, all plausible.

## Final quiz question types

All types need `feedback.correct`, `feedback.incorrect`, and should have `objective` and `explanation`. Do not start feedback with "Richtig"/"Falsch"/"Correct": the player shows that as a heading.

| Type | Use for | Rules |
|---|---|---|
| `single` | one best answer | 3-4 options, exactly 1 `correct` |
| `multiple` | several correct aspects | 4-5 options, at least 1 correct and at least 1 distractor; scored all-or-nothing, so say "Welche … treffen zu?" |
| `truefalse` | clear statements | `answer: true/false`; no "always/never" traps |
| `matching` | terms ↔ definitions, roles ↔ tasks | 2-6 pairs; `left` short (1-4 words), `right` max. ~40 characters, because longer texts are cut off in the dropdown on phones (`validate.py` warns above 60) |

## Images

- Input PNGs often need cropping. Crop to the relevant part, and keep images around 800-1200 px wide and below ~300 KB, since everything is inside the SCORM package. If no image tool is available (e.g. Pillow), use the image unchanged and tell the user which images should be cropped or compressed.
- Store course images in `<course>/images/` and reference them as `images/name.png`.
- **Low-resolution diagrams** (narrower than ~800 px) look blurred at full width; never upscale them. Show them at their natural size in an `image` block (the player does not enlarge images) and ask the user for the original or a larger export under "Offene Fragen".
- **Corporate diagrams** are usually maintained by designers. If a file name contains a language code (e.g. `-DE`), ask whether other language versions exist (e.g. `-EN`) before planning en-GB variants.
- **Text in images** must exist per language. Name the file with the lead-language text `name.png` and set `"hasText": true` on the image; English versions are `name.en-GB.png` (optionally `name.de-CH.png`). The build picks the variant for the package language and falls back to `name.png`; with `hasText` it warns when a variant is missing instead of silently showing German text. Prefer images without text; put labels in the caption or text instead.
- **Markers or abbreviations you cannot explain** (e.g. letters on a diagram without a legend): do not interpret them, but do not hide them from screen-reader users either. Mention them neutrally in the `alt` text ("… mit zwei Markierungen «P» und «D»") and ask about their meaning under "Offene Fragen".
- Write `alt` texts as described in `didactics.md`, section 8.
- Only use images from the input or created for the course. Do not use images from the internet: licences are unclear.
