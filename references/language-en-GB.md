# Language guide: British English (en-GB)

The translation language. The en-GB course is translated from the approved de-CH course and must say the same thing; it does not need to say it the same way. Typography rules are in `microtypography.md`; `lint_text.py` flags common American spellings and wrong quotation marks.

## Translating

- Translate meaning, tone and intent, not word by word. Restructure sentences so they read as if written in English.
- Keep every id, type, answer, pair, setting and image `src` identical (`validate.py` checks this). Translate only text fields, including `alt`, `caption` and all feedback.
- Keep the Swiss context unless it would confuse: CHF amounts, Swiss place names, company processes stay. Swiss-specific words get an English equivalent or a short explanation (Velo → bicycle; AHV → AHV (Swiss state pension)).
- Do not translate company names, product names, system names or UI labels of software the learners use in German. If learners see a German interface, give the German label and the meaning: "click **Speichern** (Save)".
- Wordplay and idioms rarely survive translation. Replace them with an English equivalent or plain wording.
- Example passwords, sentences or names inside the content should be adapted so they work in English (as in the example course's sentence method).
- After translating, compare length: English is usually 10-20 % shorter than German. Much longer usually means a literal translation.

## Spelling

British spelling throughout:

| American | British |
|---|---|
| color, behavior, favorite | colour, behaviour, favourite |
| center, meter | centre, metre |
| organize, realize, analyze | organise, realise, analyse |
| catalog, dialog | catalogue, dialogue (dialog for software dialog boxes) |
| defense, license (noun) | defence, licence (noun); license (verb) |
| traveled, canceled, labeled | travelled, cancelled, labelled |
| enroll, fulfill | enrol, fulfil |
| gray | grey |

Program is correct for computer programs; programme for courses or schedules.

## Vocabulary

Prefer British terms: mobile phone (not cell phone), holiday (not vacation), CV (not résumé), timetable (not schedule, where it means a timetable), postcode (not zip code), flat (not apartment), autumn (not fall), lift (not elevator), queue (not line).

## Address and tone

- Address the learner as **you**. Friendly, direct and professional.
- Contractions (you'll, don't, it's) are fine and make the text more natural; use them consistently.
- Plain English: short sentences, active voice, everyday words (use → not utilise; help → not facilitate).
- Many learners will be non-native speakers: avoid idioms, phrasal-verb chains and cultural references.

## Formats

| Topic | Format | Example |
|---|---|---|
| Date | D Month YYYY | 14 October 2026 |
| Date range | en dash with spaces (GAX rule) | 8 – 10 May |
| Number range | en dash, no spaces | 30–50 minutes |
| Time | 24-hour, consistent with de-CH | 14:30 |
| Numbers ≥ 10 000 | narrow no-break space (GAX rule, U+202F) | 10 000 |
| Decimal | point | 3.5 |
| Currency | CHF before the amount, no separator below 10 000 | CHF 1250, CHF 12.50 |
| Percent | no space | 80% |
| Units | space, no-break | 12 km |

## Punctuation

- Single quotation marks ‘…’, double for quotes within quotes “…”.
- Sentence dash: em dash with spaces — as in the GAX rules (this differs from the usual British spaced en dash; follow GAX).
- Apostrophe: ’ (typographic).
- No Oxford comma unless needed to avoid ambiguity.
- Headings and page titles: sentence case ("Why length matters", not "Why Length Matters"), no full stop.

## Fixed terms used by the player

Use the same words in course texts: chapter, page, Next, Back, knowledge check, final quiz, learning objectives, key takeaways.
