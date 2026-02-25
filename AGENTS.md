# AGENTS.md

## Cursor Cloud specific instructions

This is a static personal portfolio website (HTML + CSS + vanilla JS) with no build system, package manager, linter, test framework, or backend.

### Running the dev server

Serve the site with any static file server from the repository root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser. The site has a ~2-second loading screen animation before content appears.

### Key features to verify when testing changes

- **Navigation**: clicking nav links scrolls smoothly to each section.
- **Language switcher**: EN / Chinese toggle in the navbar translates all `data-en` / `data-zh` annotated elements.
- **Hero background slider**: rotates background images every 5 seconds.
- **Floating contact button**: bottom-right envelope icon opens a popup with contact links.

### Notes

- There is no `package.json`, no dependencies to install, no build or lint step.
- All assets (images, PDFs) are in the repository root alongside `index.html`, `style.css`, and `script.js`.
- External CDN resources (Google Fonts, Font Awesome) load in the browser; they are not required for the page to function but icons and custom fonts will be missing without network access.
