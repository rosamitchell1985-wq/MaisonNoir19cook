# DESIGN.md — Maison Noir

## Design read
Multi-page fine-dining restaurant site for USA diners, Michelin-noir
editorial-minimal language, built on native CSS with a centered single-axis
typographic system.

**Dials:** DESIGN_VARIANCE 3 · MOTION_INTENSITY 4 · VISUAL_DENSITY 2.
Low variance is not timidity here: the brief mandates one vertical axis, so the
interest has to come from type weight, hairline rules, and the negative space
between courses rather than from layout asymmetry.

## Color strategy: drenched
The surface *is* the color. Noir carries ~95% of every page.

| Token | Value | Role |
|---|---|---|
| `--noir` | `#0B0B0B` | body, every surface |
| `--noir-lift` | `#121212` | the only elevation, used for form fields and the overlay |
| `--ivory` | `#EFEAE1` | headings, primary ink (15.4:1 on noir) |
| `--ivory-2` | `#C9C3B8` | body prose (10.7:1) |
| `--ivory-3` | `#9E988C` | meta, captions, dotted leaders (6.0:1) |
| `--gold` | `#B9985A` | hairlines at 1px, link underlines, tags (6.9:1) |

Gold is used at **1px only**. It is never a fill, never a gradient, never a glow.
If a gold surface larger than one pixel of stroke appears, that is a bug.

No light mode. The scene sentence: a guest checking the menu on a phone in a dim
cab on the way to a 7:45 seating, or at a desk at 11pm planning an anniversary.
Both are low-ambient-light, evening-mood contexts. The page is dark because the
room is dark.

## Typography
- **Display:** Cormorant Garamond 300. `clamp(2.35rem, 8.5vw, 4.5rem)` for h1
  (72px ceiling per the brief), centered, `letter-spacing: .02em`. Thin serif at
  large size needs *positive* tracking, not negative; the strokes are already
  fine enough that tightening closes the counters.
- **UI / labels / nav / tags:** Jost 400, `.72rem`, `letter-spacing: .22em`,
  uppercase. This is the brief's "14px letter-spaced caps" register.
- **Prose:** Jost 300/400 at 1rem, `line-height: 1.85`, max 68ch.
  *Deviation from the brief, stated deliberately:* the brief asks for 14px
  letter-spaced caps as the body face. Applied to a 1,200-word Journal article
  that is unreadable and fails AA legibility in practice, so caps are scoped to
  labels, nav, meta, tags, and buttons, and prose runs sentence-case Jost. The
  caps register still sets the voice of the site everywhere a label appears.
- Serif justification: the brief names Cormorant Garamond explicitly. It is the
  brand instruction, not a reflex reach for "creative = serif".

## Layout
One axis. `--measure: 620px` is the content column on every page. Two documented
exceptions, both because the content is genuinely two-dimensional:
`--measure-wide: 1080px` for the gallery grid and the locations grid.
Section rhythm: `padding-block: clamp(4.5rem, 12vw, 9rem)`.

## The signature detail (on every page)
Centered typographic courses with **dotted leader lines to prices**. Implemented
as a flex row: name / a `1fr` spacer carrying `border-bottom: 1px dotted` /
price. It appears as the menu on Menu and Drinks, as package pricing on Private
Events and Catering, as denominations on Gift Cards, as hours on Locations and
Contact, as pay bands on Careers, and as retention periods on the legal pages.
Same component, same rhythm, twenty-five pages.

## Components
- **Course blocks** are hairline-framed groups, not cards: `1px solid` gold at
  12% on noir, radius 0, no shadow, no fill. The brief bans cards; the task
  requires grouped menu-course cards. This resolves both — the grouping and the
  per-item bullets, tags, and prices are all there, the card *material* is not.
- **Radius scale:** 0 everywhere. One system, no exceptions.
- **Buttons:** exactly one button style, `.btn-thin` — 1px border, letter-spaced
  caps, no fill. Everything else is a gold 1px underline link.

## Motion
1s fades on scroll reveal (IntersectionObserver, never a scroll listener), and a
letter-by-letter h1 reveal on load. Nothing bounces; easing is
`cubic-bezier(.16,1,.3,1)`. Reveals enhance an already-visible default: the
hidden state is scoped under `html.js`, so with JS off or in a headless render
every section ships visible. All of it collapses under
`prefers-reduced-motion: reduce`.

## Bans honored
Zero em-dashes in user-visible copy. Zero SVG. No bright color, no cards, no
sans-serif headings, no food emojis, no delivery-app patterns, no fake
screenshots, no scroll cues, no version stamps, no decorative status dots.
