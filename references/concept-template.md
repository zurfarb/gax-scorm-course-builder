# Concept template

Template for `<course>/concept.md` (approval 1). Write it in German. Keep it scannable: the user decides on structure here, not on wording. Remove the comments in `<!-- -->`.

```markdown
# Kurskonzept: <Kurstitel>

**Version:** Entwurf 1 · **Datum:** <TT.MM.JJJJ> · **Kurs-ID:** <slug, z. B. datenschutz-grundlagen>

## Eckdaten

| | |
|---|---|
| Zielgruppe | <wer, Vorwissen> |
| Ziel des Kurses | <ein Satz: was ist danach anders?> |
| Dauer | ca. <n> Minuten (Berechnung unter «Dauer») |
| Sprachen | de-CH (Leitsprache), en-GB *(Annahme, falls nicht genannt)* |
| Navigation | frei / Kapitel nacheinander |
| Abschluss | alle Seiten besucht; Abschlusstest bestanden ab 80 % (zählt nicht für den Abschluss) |

## Lernziele

| ID | Lernziel | Stufe |
|---|---|---|
| lo-… | Du kannst … | anwenden |

<!-- Stufe: erinnern / verstehen / anwenden / analysieren (= remember / understand / apply / analyse in the course file) -->

## Aufbau

### Kapitel 1: <Titel> → lo-…
<!-- one line: why this chapter matters -->

| Seite | Kernaussage | Elemente | Begründung |
|---|---|---|---|
| <Arbeitstitel> | <ein Satz> | text-image, callout | <warum diese Elemente> |
| … | … | check | Wissenscheck zu … |

### Kapitel 2: …

## Übungen

| Kapitel | Wissenschecks | Szenarien |
|---|---|---|
| 1 | 1 (single) | – |

## Abschlusstest

| Lernziel | Anzahl Fragen | Fragetypen |
|---|---|---|
| lo-… | 2 | single, scenario-basiert |

Total: <n> Fragen, Reihenfolge zufällig, Lösungen werden angezeigt.

## Dauer

| Posten | Menge | Minuten |
|---|---|---|
| Lesen (180 Wörter/Min., Wortbudget siehe didactics.md §7) | ca. <n> Wörter | <…> |
| Wissenschecks à 0.5 | <n> | <…> |
| Szenarien à 1.5 | <n> | <…> |
| Interaktive Blöcke à 0.5 | <n> | <…> |
| Testfragen à 0.5 | <n> | <…> |
| **Total (gerundet auf 5)** | | **<…>** |

<!-- If above the user's target: say what you would cut (didactics.md, section 7). -->

## Inhaltsauswahl

- **Übernommen:** <Themen aus dem Material, die vorkommen>
- **Als Vertiefung (Akkordeon):** <…>
- **Weggelassen:** <… und warum>

## Bilder

| Bild | Quelle | Bearbeitung | Text im Bild? |
|---|---|---|---|
| images/<name>.png | input/<datei> | zuschneiden | nein / ja → en-GB-Variante nötig |

## Änderungen nach Freigabe

<!-- Filled in during step 3: what differs from the approved concept and why (e.g. cut to meet the duration). -->

## Annahmen

- <what you assumed instead of asking, e.g. Zielgruppe, Sprachen>

## Offene Fragen

1. <Lücke, Widerspruch oder Unklarheit im Material>
<!-- Most important first. Also: missing linked pages/images, information only inside images, export artefacts (one line). -->
```
