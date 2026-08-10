# Where to change TitanEd brand tokens

Package: `tels-brand-openedx/` · always edit under `paragon/tokens/src/`  
Then: `make build` → hard-refresh.

---

## Layer 1 — Global (change once → every MFE)

| What you want | File | Key |
|---------------|------|-----|
| **Primary color** | `themes/light/global/color.json` | `color.primary.base` |
| **Font family** | `core/global/typography.json` | `typography.font.family.sans.serif` |
| **Body font size** | same | `typography.font.size.base` |
| **H1 size** | same | `typography.font.size.h1.base` |
| **H2 size** | same | `typography.font.size.h2.base` |
| **H3 … H6** | same | `typography.font.size.h3…h6.base` |
| **Heading color** | `themes/light/components/text/headings.json` | `color.headings.base` |
| **Page max-width** | `core/components/container/max-width.json` | `size.container.max-width.xl` |
| **L / R padding** | `core/global/spacing.json` | `spacing.grid.gutter-width` (pad = half) |

Applied by: `overrides/_layout.scss` + `overrides/_typography.scss`  
Icons (`.fa`) stay FontAwesome — never set `* { font-family }`.

---

## Layer 2 — Components (keep for now)

Each kit = JSON (colors / hover / focus) + thin SCSS that only maps classes → `var(--pgn-*)`.

### Buttons (all types + hover)

| HTML class | Token file |
|------------|------------|
| `.btn.btn-primary` | `themes/light/components/button/solid-primary.json` |
| `.btn.btn-brand` | `themes/light/components/button/solid-brand.json` |
| `.btn.btn-secondary` | `themes/light/components/button/solid-secondary.json` |
| `.btn.btn-outline-primary` | `themes/light/components/button/outline-primary.json` |
| `.btn.btn-outline-secondary` | `themes/light/components/button/outline-secondary.json` |
| `.btn-icon.btn-icon-primary` | `themes/light/components/button/icon-primary.json` |
| Padding / radius (all buttons) | `core/components/button/size-padding-radius.json` |

Inside each button JSON you edit: `bg`, `text`, `border`, and under `hover` the same for hover state.  
SCSS map: `overrides/_buttons.scss` (do not put hex here).

**One file = one button type.** Do not put outline keys inside `solid-*.json` (that overwrites `outline-*.json`).  
Changing Layer 1 `color.primary.base` updates solid-primary when it links `{color.primary.base}`.

### Link

| Class | File |
|-------|------|
| `a`, `.btn-link` | `themes/light/components/link/colors.json` → `link.base` |
| `.pgn__hyperlink.inline-link` (Authn mailto, etc.) | same → **`link.inline.base`** (Paragon default is info blue) |
| `.alert-link` / links inside Alert messages | same inline/base tokens via `overrides/_links.scss` + `_authn.scss` |

SCSS: `overrides/_links.scss` · Authn parent map: `_authn.scss`

### Tabs

| Class | File |
|-------|------|
| `.nav-underline-tabs .nav-link` | `themes/light/components/tabs/nav-underline.json` |

### Input field (+ checkbox)

| Class | File | SCSS |
|-------|------|------|
| `.form-control`, textarea | `themes/light/components/form/input.json` | `overrides/_forms.scss` |
| `.pgn__form-checkbox-input` | same `input.json` | same — never solid-primary fill on checked |

### Search field

| Class | File | SCSS |
|-------|------|------|
| `.pgn__searchfield` (internal) | `themes/light/components/form/search-field.json` | `overrides/_searchfield.scss` |
| `.pgn__searchfield--external` (box ≠ button) | same | same |
| Search radius | `core/components/form/search-field-size.json` | — |

### Dropdown (two kinds, same brand colors)

| Kind | Class | File / SCSS |
|------|-------|-------------|
| A — Paragon JSX menu | `.dropdown-menu`, `.dropdown-item` | `themes/light/components/dropdown/colors.json` + `overrides/_dropdown.scss` |
| B — native `<select>` | `select.form-control` + `option` | primary + `form/input.json` + `overrides/_selects.scss` |

### Alert / Badge / Chip / Navbar / Modal / Toast

No thin SCSS bridge needed — Paragon's own component CSS already reads these `--pgn-*` names directly. Each JSON file is now the documented, independently overridable control point (colors default to your semantic roots; radius/padding default to global size tokens, so they still cascade unless you override them here).

| Component | Class | File(s) |
|-----------|-------|---------|
| Alert | `.alert` | `themes/light/components/alert/colors.json` + `core/components/alert/size.json` |
| Badge | `.badge` | `themes/light/components/badge/colors.json` + `core/components/badge/size.json` |
| Chip | `.pgn__chip` | `themes/light/components/chip/colors.json` + `core/components/chip/size.json` |
| Navbar | `.navbar` | `themes/light/components/navbar/colors.json` |
| Modal | `.modal-content` | `themes/light/components/modal/colors.json` + `core/components/modal/size.json` |
| Toast | `.toast` | `themes/light/components/toast/colors.json` + `core/components/toast/size.json` |

Navbar dark/light variants are contrast-driven (white/black at set opacities), not brand-tinted, by Paragon's own design — same as before, just now editable in one place instead of only living in `node_modules`.

### Card radius (`.pgn__card`, `.collapsible-card`, Studio course outline)

| Class | File(s) |
|-------|---------|
| `.pgn__card`, `.collapsible-card` / `.collapsible-card-lg` | No brand JSON — Paragon's own `--pgn-size-card-border-radius-base` already reads `{size.border.radius.base}` (Layer 1). `overrides/_cards.scss` only patches a Paragon core.css specificity bug that zeroed the collapsible's outer corner. |
| Studio **Course outline** section/subsection/unit rows | `_authoring.scss` — these aren't `.pgn__card`, they're plain divs with a radius set inline by the MFE's own JS, so nothing here reaches them by class. Forced (`!important`, scoped to `.course-outline-container`) to the same `--pgn-size-card-border-radius-base` var so they track base/md like every other card. |

Card **color** (bg/border color) is still Open edX/Paragon stock by design — not themed, no JSON file, not planned.

---

## Not part of this system (permanent, not deferred)

- Collapsible kit (colors) — deleted
- Table kit — deleted
- **Card color overrides** — not themed (course outline / `.pgn_collapsible` / cards keep Open edX default bg/border colors). Card **radius** is themed — see above.
- Global `color.border` in surfaces — removed (non-button component borders stay stock)

**Kept:** button borders, form/search borders (input kits), dropdown item hover (menu border = stock), card radius (all tiers cascade from Layer 1 base).

Still present for runtime: TinyMCE (uses primary/button/form vars).

---

## Layer 3 — MFE pages (layout only)

Only when a page needs parent alignment. No new colors.

| File | Use when |
|------|----------|
| `_header.scss` / `_footer.scss` | Shared chrome width |
| `_catalog.scss` | Catalog / home |
| `_learning.scss` | Learning header, instructor bar, `<main>` tabs/buttons/links |
| `_discussion.scss` | Discussion + TinyMCE dialogs |
| `_gradebook.scss` | Gradebook search / selects |
| `_learner-dashboard.scss` | My Courses — Refine popover overflow, filter chips, buttons/links |
| `_account.scss` / `_authn.scss` / `_authoring.scss` | When those shells diverge |

---

## Quick recipes

| Goal | Do this |
|------|---------|
| Everything orange → yellow | `color.json` → `primary.base` → `make build` |
| Bigger H1 everywhere | `typography.json` → `font.size.h1.base` |
| Wider pages | `max-width.json` → `xl` |
| More side padding | `spacing.json` → `gutter-width` |
| Solid primary hover darker | `solid-primary.json` → `color.btn.hover.bg.primary` |
| Brand button only | `solid-brand.json` |
| Outline button look | `outline-primary.json` or `outline-secondary.json` |

```bash
cd tels-brand-openedx && make build
```
