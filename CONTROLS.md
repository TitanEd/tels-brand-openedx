# Where to change TitanEd brand tokens

Step-by-step guide (all three levels, every component): [`docs/branding/configure-design-tokens.md`](../docs/branding/configure-design-tokens.md)

Package: `tels-brand-openedx/` · always edit under `paragon/tokens/src/`  
Then: `make build` → hard-refresh.

---

## Layer 1 — Global (change once → every MFE)

**Brand colors (exactly two):** edit only these for platform-wide primary / secondary.

| What you want | File | Key | Current |
|---------------|------|-----|---------|
| **Primary color** (Layer 1 color 1) | `themes/light/global/color.json` | `color.primary.base` → `--pgn-color-primary-base` | `#EB5939` |
| **Secondary color** (Layer 1 color 2) | same | `color.secondary.base` → `--pgn-color-secondary-base` | `#273F2F` |

Cascade: Primary → `.btn-primary`, `.btn-outline-primary`, inverse-primary kits, and **brand** (brand links to primary). Secondary → `.btn-secondary`, `.btn-outline-secondary`, inverse-secondary kits, icon-secondary. Utility buttons (success / danger / …) keep their own semantic hues — not brand.

| What you want | File | Key | CSS variable |
|---------------|------|-----|--------------|
| **Font family** | `core/global/typography.json` | `typography.font.family.sans.serif` | `--pgn-typography-font-family-base` |
| **Self-hosted font file** | `paragon/fonts/` + `_fonts.scss` | `@font-face`; `make build` copies → `dist/fonts/` | |
| **Font scale** (all rem text, e.g. `1.2` = +20%) | `core/global/typography.json` | `typography.font.scale` | `--pgn-typography-font-scale` |
| **Body size** (aka Normal) | same | `typography.font.size.base` | `--pgn-typography-font-size-base` |
| **Body color** | `themes/light/components/text/body.json` | `color.body.base` | `--pgn-color-body-base` |
| **Heading size H1** | `core/global/typography.json` | `typography.font.size.h1.base` | `--pgn-typography-font-size-h1-base` |
| **Heading size H2** | same | `typography.font.size.h2.base` | `--pgn-typography-font-size-h2-base` |
| **Heading size H3 … H6** | same | `typography.font.size.h3…h6.base` | `--pgn-typography-font-size-h*-base` |
| **Heading color** | `themes/light/components/text/headings.json` | `color.headings.base` | `--pgn-color-headings-base` |
| **Button font size** | `core/components/button/size-padding-radius.json` | `typography.btn.font.size.*` | `--pgn-typography-btn-font-size-base` (+ sm/lg) |
| **Button text color** | Layer 2 per variant | `color.btn.text.{variant}` | `--pgn-color-btn-text-{variant}` |
| **Label size** | `core/components/form/typography.json` | `typography.form.input.font.size.*` | `--pgn-typography-form-input-font-size-base` (+ sm/lg) |
| **Label color** | `themes/light/components/form/label.json` (dark: `themes/dark/.../label.json`) | `color.form.label.base` | `--pgn-color-form-label-base` |
| **Font weight** (body / bold) | `core/global/typography.json` | `typography.font.weight.base` / `.bold` | `--pgn-typography-font-weight-base` / `-bold` |
| **Line height** | same | `typography.line-height.base` | `--pgn-typography-line-height-base` |
| **Letter spacing** | same | `typography.letter-spacing.base` (`normal`, `0.01em`, …) | `--pgn-typography-letter-spacing-base` |
| **Page max-width** | `core/components/container/max-width.json` | `size.container.max-width.xl` | `--pgn-size-container-max-width-xl` |
| **L / R padding** | `core/global/spacing.json` | `spacing.grid.gutter-width` (pad = half) | |

**Global colors (other than primary / secondary):**

| What you want | File | Key | CSS variable |
|---------------|------|-----|--------------|
| White / Black | `themes/light/global/color.json` | `color.white` / `color.black` | `--pgn-color-white` / `--pgn-color-black` |
| Page background | `themes/light/global/surfaces.json` | `color.bg.base` | `--pgn-color-bg-base` |
| Surface (modal, dropdown, table bg) | `themes/light/global/color.json` (dark: `themes/dark/global/color.json`) | `color.surface.base` | `--pgn-color-surface-base` |
| Border (cards, collapsibles, tables) | `themes/light/global/surfaces.json` | `color.border` (Paragon stock `gray.200`) | `--pgn-color-border` |
| Text | `themes/light/global/color.json` | `color.text.base` | `--pgn-color-text-base` |
| Muted text | `themes/light/components/text/muted.json` | `color.text.muted` | `--pgn-color-text-muted` |
| Success / Error / Warning / Info | `themes/light/global/color.json` | `color.success.base` / `color.danger.base` / `color.warning.base` / `color.info.base` | `--pgn-color-{success,danger,warning,info}-base` |

Paragon calls **Error** `danger` — there is no separate `error` token. Alerts/toasts read these through `alert/colors.json` / `toast/colors.json`.

**Typography Option A:** `font.scale` sets `html { font-size: calc(100% * scale) }` (platform-wide rem bump). Body size is set on `body` separately — do not put Body size on `html`. “Normal” = Body. Applied by: `overrides/_layout.scss` + `overrides/_typography.scss` (+ `_forms.scss` for Label).  
Icons (`.fa`) stay FontAwesome — never set `* { font-family }`.  
`overrides/_layout.scss` also zeroes the browser default `body { margin: 8px }` globally (every MFE/LMS page).

---

## Layer 2 — Components (keep for now)

Each kit = JSON (colors / hover / focus) + thin SCSS that only maps classes → `var(--pgn-*)`.

### Buttons (Default / Hover / Active / Disabled)

Paragon `Button` is one component. Types are **variants**. Source: https://paragon-openedx.netlify.app/components/button/  
Paths below are under `themes/light/components/button/` unless noted.

**Layer 1 → Layer 2 cascade:** change `color.primary.base` or `color.secondary.base` once. Primary buttons + brand (linked to primary) follow color 1. Secondary buttons follow color 2. Utility hues (success / danger / warning / info) stay semantic — they are not brand colors.

**Shared for every `.btn`** (all variants, all states) — `core/components/button/size-padding-radius.json`:

| What | CSS variable | JSON key |
|------|----------------|----------|
| Background is per-type (below) | | |
| Border radius | `--pgn-size-btn-border-radius-base` (+ `sm` / `lg`) | `size.btn.border.radius.*` |
| Font size | `--pgn-typography-btn-font-size-base` (+ `sm` / `lg`) | `typography.btn.font.size.*` |
| Font weight | `--pgn-typography-btn-font-weight` | `typography.btn.font.weight` |
| Padding | `--pgn-spacing-btn-padding-x/y-base` (+ `sm` / `lg`) | `spacing.btn.padding.*` |

Sizes `sm` / `md` / `lg` / `inline` / `block` use those shared metrics — they are not extra color types.

**Per type, per state** (replace `{variant}` with `primary`, `outline-primary`, `inverse-brand`, …):

| State | Background | Text |
|-------|------------|------|
| Default | `--pgn-color-btn-bg-{variant}` | `--pgn-color-btn-text-{variant}` |
| Hover | `--pgn-color-btn-hover-bg-{variant}` | `--pgn-color-btn-hover-text-{variant}` |
| Active / Pressed | `--pgn-color-btn-active-bg-{variant}` | `--pgn-color-btn-active-text-{variant}` |
| Disabled | `--pgn-color-btn-disabled-bg-{variant}` | `--pgn-color-btn-disabled-text-{variant}` |

Also set `border` in the same JSON (hover looks broken without it). Solid white labels: `"modify": null`. Solid hover/active link `{color.theme.hover.*}` / `{color.theme.active.*}` so Layer 1 Primary still cascades. Do not `!important` solid fills. Outline kits keep `!important` for Studio.

**One file = one button type.** Do not put outline keys inside `solid-*.json`.

#### Core — when Open edX uses them

| Type | Class | Use when | File |
|------|-------|----------|------|
| **Primary solid** | `.btn.btn-primary` | One main action: Enroll, Save, Submit, Sign in. Catalog default enroll / “View course”. | `solid-primary.json` |
| **Outline primary** | `.btn.btn-outline-primary` | Secondary next to primary: Cancel, View in Studio, Show more. Catalog “View About Page in Studio”. | `outline-primary.json` |
| **Brand solid** | `.btn.btn-brand` | Marketing / catalog CTA (product, not a form submit). Catalog promo video, “View all courses”. | `solid-brand.json` |
| **Outline brand** | `.btn.btn-outline-brand` | Quieter brand action on marketing pages. Rare in stock MFEs. | `outline-brand.json` |
| **Secondary solid** | `.btn.btn-secondary` | Alternate action when primary is already used. Gradebook Apply. Cascades from Layer 1 Secondary. | `solid-secondary.json` |
| **Outline secondary** | `.btn.btn-outline-secondary` | Quiet alternate (pagination-adjacent, Gradebook). | `outline-secondary.json` |
| **Tertiary** | `.btn.btn-tertiary` | Lowest emphasis, no border: Skip, toolbar text, dismiss-like. | `tertiary.json` |
| **Outline tertiary** | `.btn.btn-outline-tertiary` | Quiet bordered ghost (API variant). | `outline-tertiary.json` |
| **Link button** | `.btn.btn-link` | Looks like a text link (Select all / Clear). Colors from link tokens. | `link.json` + `../link/colors.json` |

#### Inverse — on dark or primary chrome

| Type | Class | Use when | File |
|------|-------|----------|------|
| **Inverse primary / brand** | `.btn-inverse-primary` / `.btn-inverse-brand` | Solid on a dark header/hero so it stays readable. | `inverse-primary.json` / `inverse-brand.json` |
| **Inverse outline primary** | `.btn-inverse-outline-primary` | White outline on a primary bar (Learning Staff / Studio). | `inverse-outline-primary.json` |
| **Inverse outline brand** | `.btn-inverse-outline-brand` | Same treatment on brand-colored chrome. | `inverse-outline-brand.json` |
| **Inverse tertiary** | `.btn-inverse-tertiary` | Ghost action on a dark bar. | `inverse-tertiary.json` |
| **Inverse outline tertiary** | `.btn-inverse-outline-tertiary` | Ghost outline on dark chrome. | `inverse-outline-tertiary.json` |
| **Inverse secondary** | `.btn-inverse-secondary` | Alternate inverse solid. | `inverse-secondary.json` |
| **Inverse outline secondary** | `.btn-inverse-outline-secondary` | Alternate inverse outline. | `inverse-outline-secondary.json` |

#### Utility — meaning, not brand

| Type | Class | Use when | File |
|------|-------|----------|------|
| **Success** | `.btn-success` / `.btn-outline-success` | Confirm, enroll-success, courseware available. | `solid-success.json` / `outline-success.json` |
| **Danger** | `.btn-danger` / `.btn-outline-danger` | Delete, unenroll, destructive confirm. | `solid-danger.json` / `outline-danger.json` |
| **Warning** | `.btn-warning` / `.btn-outline-warning` | Caution action (uncommon as a button). | `solid-warning.json` / `outline-warning.json` |
| **Info** | `.btn-info` / `.btn-outline-info` | Helper action (uncommon as a button). | `solid-info.json` / `outline-info.json` |
| **Light / dark** | `.btn-light` / `.btn-dark` + outlines | Contrast on photos or dark cards. | `solid-light.json`, `solid-dark.json`, `outline-light.json`, `outline-dark.json` |
| **Inverse utility** | `.btn-inverse-{success,danger,warning,info,light,dark}` + `inverse-outline-*` | Same meaning on dark chrome. | `inverse-{hue}.json` / `inverse-outline-{hue}.json` |

#### Icon buttons (separate Paragon component — not this Button pass)

| Class | Use when | File |
|-------|----------|------|
| `.btn-icon.btn-icon-primary` | Icon-only primary (DataTable card/list toggle uses `-active`). | `icon-primary.json` |
| `.btn-icon.btn-icon-secondary` | Studio drag handles, quieter icon actions. | `icon-secondary.json` |

SCSS: `overrides/_buttons.scss`. Layer 1 `color.primary.base` updates primary + brand. Layer 1 `color.secondary.base` updates every secondary kit.

**Button focus** — Paragon derives `--pgn-color-btn-focus-{text,border,bg}-{variant}` from each variant's default tokens, so every file above already drives focus. The focus ring width is Paragon's `--pgn-size-btn-focus-width`.  
**Icon spacing** — `core/components/button/size-padding-radius.json` → `spacing.btn.icon.gap` → `--pgn-spacing-btn-icon-gap` (gap between label and `iconBefore` / `iconAfter`, stock `.5rem`).  
**Height** — Paragon has no button height token; height = padding Y × 2 + line-height, so use the padding keys above.

### Link

| Class | File |
|-------|------|
| `a`, `.btn-link` | `themes/light/components/link/colors.json` → `link.base` |
| `.pgn__hyperlink.inline-link` (Authn mailto, etc.) | same → **`link.inline.base`** (Paragon default is info blue) |
| `.alert-link` / links inside Alert messages | same inline/base tokens via `overrides/_links.scss` + `_authn.scss` |

| State | Key | CSS variable | Default |
|-------|-----|--------------|---------|
| Default | `link.base` | `--pgn-color-link-base` | primary |
| Hover | `link.hover` | `--pgn-color-link-hover` | primary 700 |
| Active (pressed) | `link.active` | `--pgn-color-link-active` | = hover |
| Visited | `link.visited` | `--pgn-color-link-visited` | = base |
| Focus (keyboard, `:focus-visible`) | `link.focus` | `--pgn-color-link-focus` | = hover |
| Disabled | `.btn-link` only → `--pgn-color-btn-disabled-link` | | Paragon |

SCSS: `overrides/_links.scss` · Authn parent map: `_authn.scss`

### Tabs

Paragon `Tabs` → `.nav-tabs`; Learning course tabs → `.nav-underline-tabs`. One file: `themes/light/components/tabs/nav-underline.json` (keys use Paragon's own `color.nav.*` paths).

| State | Key | CSS variable |
|-------|-----|--------------|
| Default text | `color.nav.link.text.base` (+ `nav.tabs.base.link.text` for Layer 3 maps) | `--pgn-color-nav-link-text-base` |
| Hover text / bg | `color.nav.tabs.base.link.hover.text` / `.hover.bg` | `--pgn-color-nav-tabs-base-link-hover-text` / `-hover-bg` |
| Active text / bg / underline | `color.nav.tabs.base.link.active.{text,bg,border}` + `border-color.nav.tabs-link.border.active` | `--pgn-color-nav-tabs-base-link-active-*` / `--pgn-border-color-nav-tabs-link-border-active` |
| Focus ring | `border-color.nav.tabs-link.border.focus` | `--pgn-border-color-nav-tabs-link-border-focus` |
| Disabled text | `color.nav.link.text.disabled` | `--pgn-color-nav-link-text-disabled` |
| Tab bar border | `color.nav.tabs.base.border.base` | `--pgn-color-nav-tabs-base-border-base` |

### Table (Paragon DataTable)

`.pgn__data-table` (Gradebook, Studio, Admin Console). File: `themes/light/components/table/colors.json` · SCSS: `overrides/_tables.scss`. Defaults = Paragon stock.

| Part | Key | CSS variable |
|------|-----|--------------|
| Background | `color.data-table.bg.base` (→ surface) | `--pgn-color-data-table-bg-base` |
| Border | `color.data-table.border` | `--pgn-color-data-table-border` |
| Cell text | `color.data-table.text` | `--pgn-color-data-table-text` |
| Header bg / text | `color.data-table.header.{bg,text}` | `--pgn-color-data-table-header-bg` / `-text` |
| Striped row (`.is-striped`) | `color.data-table.row.striped.bg` | `--pgn-color-data-table-row-striped-bg` |
| Selected row (`tr.is-selected`) | `color.data-table.row.selected.bg` | `--pgn-color-data-table-row-selected-bg` |
| Bootstrap table border / caption | `color.table.border` / `color.table.caption` | `--pgn-color-table-border` / `-caption` |

DataTable has no row-hover state in Paragon, so there is no hover token.

### Input field (+ checkbox) / Label

| Class | File | SCSS |
|-------|------|------|
| `.form-control`, textarea | `themes/light/components/form/input.json` | `overrides/_forms.scss` |
| `.pgn__form-label` | `themes/*/components/form/label.json` (color) + `core/components/form/typography.json` (size) | same |
| `.pgn__form-checkbox-input` | same `input.json` | same — never solid-primary fill on checked |

### Search field

| Class | File | SCSS |
|-------|------|------|
| `.pgn__searchfield` (internal) | `themes/light/components/form/search-field.json` | `overrides/_searchfield.scss` |
| `.pgn__searchfield__iconbutton-submit` (Authoring / Studio icon search) | same → `icon.base` / `icon.hover` / `icon.bg.hover` (not icon-primary fill) | same |
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
| Card | `.pgn__card` | `themes/light/components/card/colors.json` (bg → surface, border, focus, divider) |
| List group | `.list-group-item` | `themes/light/components/list/colors.json` |
| Tooltip | `.tooltip` | `themes/light/components/tooltip/colors.json` |
| Pagination | `.pagination`, `.page-link` | `themes/light/components/pagination/colors.json` (text → link, current → primary) |
| Breadcrumb | `.pgn__breadcrumb` | `themes/light/components/breadcrumb/colors.json` + `core/components/breadcrumb/size.json` |

Navbar dark/light variants are contrast-driven (white/black at set opacities), not brand-tinted, by Paragon's own design — same as before, just now editable in one place instead of only living in `node_modules`.

### Card radius (`.pgn__card`, `.collapsible-card`, Studio course outline)

| Class | File(s) |
|-------|---------|
| `.pgn__card`, `.collapsible-card` / `.collapsible-card-lg` | No brand JSON — Paragon's own `--pgn-size-card-border-radius-base` already reads `{size.border.radius.base}` (Layer 1). `overrides/_cards.scss` only patches a Paragon core.css specificity bug that zeroed the collapsible's outer corner. |
| Studio **Course outline** section/subsection/unit rows | `_authoring.scss` — these aren't `.pgn__card`, they're plain divs with radius + left border set inline by the MFE's own JS. Forced (`!important`, scoped to `.course-outline-container`) to `--pgn-size-card-border-radius-base`. Live/published left stripe remapped from stock Open edX `#00688d` to `--pgn-color-primary-base` (Draft yellow / Staff black stay). |

Card **color** lives in `themes/light/components/card/colors.json` (defaults = Paragon stock, bg follows surface). Studio course-outline rows are plain divs, not `.pgn__card`, so they don't read it.

---

## Not part of this system (permanent, not deferred)

- Collapsible kit (colors) — deleted (`.pgn_collapsible` / course outline rows keep Open edX default bg/border colors)
- Header / footer background + text colors — stock Open edX; only width, buttons, links and forms inside them are tokenized

**Kept:** button borders, form/search borders (input kits), dropdown item hover (menu border = stock), card radius (all tiers cascade from Layer 1 base), Table (DataTable) kit, global `color.border` (set to Paragon stock — editing it changes every component that reads `--pgn-color-border`).

Still present for runtime: TinyMCE (uses primary/button/form vars; `.tox-tinymce-aux` z-index lifted in `overrides/_tinymce.scss` so Source Code / Code Sample dialogs sit above Discussion sticky bars).

---

## Layer 3 — MFE pages (layout only)

Only when a page needs parent alignment. No new colors.

| File | Use when |
|------|----------|
| `_header.scss` / `_footer.scss` | Shared chrome width; header language select + dark-mode switch + **user-dropdown size** (`--pgn-*` form/button tokens); Discussions uses LearningHeader slots |
| `_catalog.scss` | Catalog home hero (light primary gradient + welcome card), `/catalog/courses`, course cards, course about |
| `_learning.scss` | Learning header, instructor bar, `<main>` tabs/buttons/links |
| `_discussion.scss` | Discussion + TinyMCE dialogs |
| `_gradebook.scss` | Gradebook search / selects |
| `_learner-dashboard.scss` | My Courses — Refine popover overflow, filter chips, buttons/links |
| `_account.scss` / `_authn.scss` / `_authoring.scss` | When those shells diverge |
| `_communications.scss` | Bulk email tool (instructor-only) — shares Learning's header/footer; course-tabs bar flattened to match Learning's underline look (real Paragon `.nav-tabs`, not the underline style); content widened from the MFE's own "md" cap to standard site width |
| `_ora-grading.scss` | Enhanced Staff Grader (instructor-only) — shares Learning's header/footer; content was a stray edge-to-edge `.container-fluid` (didn't line up under the inset header) — constrained to the standard content width |
| `_admin-console.scss` | Platform AuthZ / admin tooling (staff-only) — shares Studio's header; no footer; content width not yet constrained (documented, not guessed) |

**Staff-only MFEs** (Gradebook, Communications, ORA Grading, Admin Console) get the exact same Layer 1/2 tokens and shared header/footer chrome as public MFEs — nothing in this system distinguishes public vs. internal. What used to gate them was `tutorindigo`'s `indigo_styled_mfes` list (controls the `@edx/brand` npm install → logo/favicon only, not colors/layout); all four are now included there too.

---

## Quick recipes

| Goal | Do this |
|------|---------|
| Everything orange → yellow | `color.json` → `primary.base` → `make build` |
| All text +20% (rem UI) | `typography.json` → `font.scale` → `1.2` |
| Bigger body only | `typography.json` → `font.size.base` |
| Bigger H1 everywhere | `typography.json` → `font.size.h1.base` |
| Form label color | `themes/light/components/form/label.json` → `color.form.label.base` |
| Looser letter spacing | `typography.json` → `letter-spacing.base` → `0.01em` |
| Visited links purple-ish | `link/colors.json` → `link.visited` |
| Table header color | `table/colors.json` → `data-table.header.bg` |
| Modal / dropdown / table surface | `color.json` → `surface.base` |
| Wider pages | `max-width.json` → `xl` |
| More side padding | `spacing.json` → `gutter-width` |
| Solid primary hover darker | `solid-primary.json` → `hover.bg.primary` (default `{color.theme.hover.primary}`) |
| Brand button only | `solid-brand.json` |
| Outline button look | `outline-primary.json` or `outline-{hue}.json` |
| Button font weight | `core/components/button/size-padding-radius.json` → `typography.btn.font.weight` |

```bash
cd tels-brand-openedx && make build
```
