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

---

## Not in scope for now (removed)

- Collapsible kit — deleted
- Table kit — deleted
- **Card border/radius/color overrides** — deleted (course outline / `.pgn_collapsible` / cards use Open edX defaults)
- Global `color.border` in surfaces — removed (non-button component borders stay stock)

**Kept:** button borders, form/search borders (input kits), dropdown item hover (menu border = stock).

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
