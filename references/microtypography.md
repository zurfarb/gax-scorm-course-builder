# Microtypography rules

Source: GAX design system, microtypography (pasted 2026-10-14).
Applies to all course text. The build script lints for violations.

| Element | Correct | Character | Usage | Lint |
|---|---|---|---|---|
| Quotation marks (de-CH) | «…» | U+00AB U+00BB | Quotes in de-CH | warn on `"…"` and `„…“` |
| Quotation marks (en-GB) | ‘…’ (nested “…”) | U+2018 U+2019 | Quotes in en-GB (not defined by GAX) | warn on straight `"` |
| Multiplication sign | 800 × 600 Pixel | U+00D7 | Dimensions | warn on `\d x \d` |
| Inch sign | 9.7” | U+201D | Inch values | warn on `\d"` |
| Thousands separator | 10 000 | U+202F (narrow no-break space) | Numbers ≥ 10 000 | warn on `\d'\d{3}`, `\d,\d{3}` (de-CH) |
| Non-breaking space | 12. Dezember | U+00A0 | Between day and month, number and unit | — |
| En dash | 8. – 10. Mai · 30–50 | U+2013 | Ranges. With spaces when the parts contain spaces or dots (dates: `8. – 10. Mai`, `8 – 10 May`); without spaces between plain numbers (`30–50 Minuten`, `2–3 Wochen`) | warn on `\d-\d` in ranges |
| Em dash | Nokia is back — with smartphones | U+2014 with spaces | Dash within a sentence | warn on ` - ` |
| Hyphen | Ethernet-Patchkabel | U+002D | Compound words, minus | — |
| Slash | kg/m², 3/4 | U+002F | Units, fractions | — |
| Ellipsis | sit dolor amet… | U+2026 | Truncated text | warn on `...` |

## Titles

A colon separates a course title from its subtitle-like part ("Echo: Leistung im Dialog führen"); use the em dash only inside sentences.

## Deviations from the source (deliberate)

- **Inch sign:** source lists U+02DD (˝ double acute) and `&rdquo;` (U+201D) for the same sign; we use U+201D ”.
- **Thin space:** source lists U+2006 and `&#8201;` (U+2009); neither is non-breaking. We use U+202F (narrow no-break space) so numbers never wrap.

## Open

- GAX "Localization guidelines" (dates, times, numbers, units, prices) not yet provided.
