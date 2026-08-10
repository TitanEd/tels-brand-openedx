# TitanEd branding — simplified control guide

See **`CONTROLS.md`** for the live edit map. This file is the short architecture note.

```text
Layer 1 — GLOBAL (one place each)
  primary, font family, H1–H6, max-width, L/R padding
  → tokens/src/themes/light/global/color.json
  → tokens/src/core/global/typography.json + spacing.json
  → tokens/src/core/components/container/max-width.json

Layer 2 — COMPONENTS (keep for now)
  buttons (all types + hover), link, tabs, input, search, dropdown
  → tokens/src/themes/light/components/{button,link,tabs,form,dropdown}/
  → paragon/overrides/_*.scss maps class → var(--pgn-*)

Layer 3 — MFE parents only
  → paragon/_catalog.scss, _learning.scss, …
```

**Not part of this system:** table, collapsible, card border/radius/color — permanent boundary, not a deferred phase. Those components stay Open edX/Paragon stock.

```bash
cd tels-brand-openedx && make build
```
