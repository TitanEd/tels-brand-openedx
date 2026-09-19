.PHONY: build clean append-overrides copy-fonts copy-assets

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

# Hero / marketing images referenced as url("./assets/…") from dist CSS
# (PARAGON_THEME_URLS or webpack @edx/brand). Keep beside the CSS output.
copy-assets:
	@mkdir -p dist/assets
	@if [ -d paragon/assets ]; then cp -a paragon/assets/. dist/assets/; fi
	@echo "Copied paragon/assets → dist/assets"

build: clean
	npm run build-tokens
	npm run build-scss
	$(MAKE) append-overrides
	$(MAKE) copy-fonts
	$(MAKE) copy-assets
