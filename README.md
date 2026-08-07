# @titaned/tels-brand-openedx

TitanEd brand package for Open edX Ulmo.

**Start here:** [CONTROLS.md](./CONTROLS.md) — which file to edit for each UI class.

Branch: `sonu-change-native-tels-brand-openedx` (do not put feature work on `master`).

```bash
npm install
make build
npm run serve
```

| Folder | Purpose |
|--------|---------|
| `paragon/tokens/src/core/global/` | Radius, spacing, typography (Phase 1 shared) |
| `paragon/tokens/src/core/components/container/` | Main max-width (all MFEs) |
| `paragon/tokens/src/themes/light/global/` | Primary + brand kit |
| `paragon/tokens/src/themes/light/components/` | Button / Link / Text / Tabs / Form / Card |
| `paragon/overrides/` | Component bridges (layout, forms, selects, searchfield, buttons, tinymce) |
| `paragon/_*.scss` | Per-MFE + header/footer maps (`_catalog`, `_learning`, …) |
