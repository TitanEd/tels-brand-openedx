.PHONY: build clean append-overrides copy-fonts validate preview sync-dark-tokens build-templates

clean:
	rm -rf dist paragon/build
	mkdir -p dist

# Paragon puts brand SCSS overrides only in core.css. Many MFEs / Tutor setups
# effectively emphasize the light/dark variant URLs (Indigo shipped overrides
# there). Append the same override block to light + dark so Gradebook forms,
# selects, search, badges always receive them.
append-overrides:
	@python3 scripts/append-overrides-to-themes.py

# @font-face in dist/core.css uses url("./fonts/…") relative to dist/.
# Webpack (MFE @edx/brand) resolves from node_modules/@edx/brand/dist — so
# font files must ship beside the CSS, not only under paragon/fonts/.
copy-fonts:
	@mkdir -p dist/fonts
	@cp -a paragon/fonts/. dist/fonts/
	@echo "Copied paragon/fonts → dist/fonts"

# Design token checklist (validation/settings.json, validation/baseline.json).
# Fails on any new problem; dist/ is already written when it runs.
validate:
	@node scripts/sync-dark-tokens.js --check
	@node scripts/validate-tokens.js

# Give every light token a dark twin (scripts/sync-dark-tokens.js), then make build.
sync-dark-tokens:
	@node scripts/sync-dark-tokens.js

# Local page with Paragon components on the built CSS: /light.html and /dark.html
preview:
	@node scripts/preview-server.js

# Site templates (paragon/templates/<id>/, scripts/build-template.js) → dist/templates/<id>/
# and the manifest dist/templates/index.json listed on control-panel's theme configuration page.
build-templates:
	@node scripts/build-template.js

build: clean
	npm run build-tokens
	npm run build-scss
	$(MAKE) append-overrides
	$(MAKE) copy-fonts
	$(MAKE) validate
	$(MAKE) build-templates
