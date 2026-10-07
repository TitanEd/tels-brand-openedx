# @titaned/tels-brand-openedx

TitanEd brand package for Open edX Ulmo.

**Start here:** [CONTROLS.md](./CONTROLS.md) — which file to edit for each UI class.

Branch: `sonu-change-native-tels-brand-openedx` (do not put feature work on `master`).

```bash
npm install
make build
npm run sync-dark-tokens   # after adding a light token: gives it a dark twin (make build checks this)
npm run serve     # dist/ + values saved or previewed on the preview page, for Tutor brandOverride (port 3000)
npm run preview   # Themes (create / use theme templates, font upload) + global + component token cards with Edit (Preview in apps / Save) + History/Revert + Download/Import, translatable, RTL: http://127.0.0.1:8765/light.html and /dark.html
```

| Folder | Purpose |
|--------|---------|
| `paragon/tokens/src/core/global/` | Radius, spacing, typography (Phase 1 shared) |
| `paragon/tokens/src/core/components/container/` | Main max-width (all MFEs) |
| `paragon/tokens/src/themes/light/global/` | Primary + brand kit |
| `paragon/tokens/src/themes/light/components/` | Button / Link / Text / Tabs / Form / Dropdown |
| `paragon/overrides/` | Component bridges (layout, forms, selects, searchfield, buttons, tinymce) |
| `paragon/_*.scss` | Per-MFE + header/footer maps (`_catalog`, `_learning`, …) |

## Site templates

`dist/` is the shared base (tokens, Paragon overrides, per-MFE fixes, dark mode) without any header,
footer or marketing-page chrome. Each site template is a layer under `paragon/templates/<id>/`:
`template.json` (id, name, description, `"default": true` on one of them), `tokens/` (design-token JSON
deep-merged over `paragon/tokens/src/`), `_template.scss` (compiled after `paragon/_overrides.scss`), `fonts/`,
`assets/`. `make build` runs `scripts/build-template.js`, which writes a complete, separate stylesheet set per
template to `dist/templates/<id>/{core,light,dark}.min.css` plus the manifest `dist/templates/index.json`, so two
templates' rules never meet. control-panel's theme configuration page lists the manifest ("Site template"); the
selected template's CSS is what every MFE loads (control-panel serves it in live mode, tutor-tels-theme-plugins'
`SiteTemplate.jsx` points the stylesheet links at it in development mode), and tutor-tels-theme-plugins renders
the matching header and footer. `template-1` is the TitanEd design, `template-2` the Harvard-PLL design of the
`native-plus-template-b` branch; a template's marketing MFE is the `frontend-app-tels-public` fork with the same
id, served at `/<id>`. Add a template: copy a folder, edit it, `make build`.
