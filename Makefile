.PHONY: build clean append-overrides

clean:
	rm -rf dist paragon/build
	mkdir -p dist

# Paragon puts brand SCSS overrides only in core.css. Many MFEs / Tutor setups
# effectively emphasize the light/dark variant URLs (Indigo shipped overrides
# there). Append the same override block to light + dark so Gradebook forms,
# selects, search, badges always receive them.
append-overrides:
	@python3 scripts/append-overrides-to-themes.py

build: clean
	npm run build-tokens
	npm run build-scss
	$(MAKE) append-overrides
