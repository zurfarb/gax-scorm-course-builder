# Language guide: Swiss Standard German (de-CH)

The lead language. Write Swiss Standard German (Schweizer Hochdeutsch), not dialect and not German-German. Typography rules (quotes, dashes, numbers) are in `microtypography.md`; `lint_text.py` checks the mechanical rules.

## Address: "du"

- Address learners with **du**, consistently, including feedback and instructions: "Du kannst …", "Wähle eine Antwort.", "Prüfe deine Antwort."
- "du", "dich", "dir", "dein" are written in lower case (also in direct address).
- Avoid impersonal or passive constructions ("Es ist zu beachten, dass …" → "Achte darauf, dass …").

## Spelling

- **ss instead of ß**, always: Strasse, gross, schliessen, Fussnote, Grüsse. (`lint_text.py` reports ß as an error.)
- Umlauts stay: ä, ö, ü, also in capitals (Ä, Ö, Ü).
- Follow the official spelling of the Duden with Swiss conventions; where variants exist, choose the Swiss one.

## Swiss vocabulary

Use the terms common in Switzerland:

| Not (German-German) | But (de-CH) |
|---|---|
| Fahrrad | Velo |
| parken | parkieren |
| Bürgersteig, Gehweg | Trottoir |
| Krankenhaus | Spital |
| Abitur | Matura |
| Sahne | Rahm |
| Hausmeister | Hauswart |
| Führerschein | Führerausweis |
| Urlaub | Ferien |
| Rente | AHV / Pension (context) |

Company and product terms take precedence: use them exactly as in the source material.

## Inclusive language

- Prefer neutral forms: Mitarbeitende, Lernende, Teilnehmende, Fachperson, Vorgesetzte, Kundschaft.
- If no neutral form exists, use both forms ("Kundinnen und Kunden").
- Do not use gender star, colon or underscore unless the brief requests it.

## Formats

| Topic | Format | Example |
|---|---|---|
| Date (short) | DD.MM.YYYY | 14.10.2026 |
| Date (long) | D. Monat YYYY | 14. Oktober 2026 |
| Date range | en dash with spaces | 8. – 10. Mai |
| Number range | en dash, no spaces | 30–50 Minuten |
| Time | HH:MM or HH.MM Uhr; be consistent | 14:30 Uhr |
| Numbers ≥ 10 000 | narrow no-break space (U+202F) | 10 000 |
| Decimal | point | 3.5 |
| Currency | CHF before the amount | CHF 1250.–, CHF 12.50 |
| Percent | space before % (no-break) | 80 % |
| Units | space between number and unit (no-break) | 12 km, 5 MB |

## Style

- Short sentences (max. ~20 words), one statement per sentence.
- Active voice, concrete verbs: "Melde den Vorfall der IT." instead of "Eine Meldung an die IT ist vorzunehmen."
- Avoid nominalisations (-ung, -heit, -keit chains) and filler words (grundsätzlich, eigentlich, im Prinzip).
- Common anglicisms are fine if your learners use them (Login, Passwort, Meeting, Feedback); otherwise prefer German.
- Explain abbreviations at first use: "Zwei-Faktor-Authentifizierung (2FA)".
- Headings and page titles without final full stop; button-like choices without full stop if they are short phrases.
- Questions end with "?", instructions with ".", not with "!" (one exclamation mark per course is plenty).

## Fixed terms used by the player

Use the same words in course texts so learners recognise them: Kapitel, Seite, Weiter, Zurück, Wissenscheck, Abschlusstest, Lernziele, Zusammenfassung, «Das Wichtigste in Kürze».
