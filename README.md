# Howard Wang's personal website

Live site: https://howardwhsrun.github.io/main/

Static HTML, CSS, and JavaScript, published by GitHub Pages from the root of `master`. No build step or package installation is required.

## Local preview

```sh
python3 -m http.server 8841 --bind 127.0.0.1
```

Open http://127.0.0.1:8841/. Run from this repository directory.

## Checks

```sh
python3 scripts/check_site.py
node --check assets/js/script.js
node --check blog/blog.js
```

The Python check validates local links, anchor targets, image descriptions, unique IDs, HTML structure, and bilingual text containers. Browser verification should cover desktop and mobile layouts, menu keyboard behavior, persisted language, initial fragments, Back/Forward, reduced motion, and navigation with JavaScript disabled.

## Editing

- `index.html`: homepage and bilingual profile text. Keep translated attributes on text-only elements.
- `assets/css/style.css`: responsive homepage layouts; navigation switches at 900px.
- `assets/css/photo-backgrounds.css`: original full-page photo backgrounds, dark overlays, and slideshow controls. Keep the photographs as the site's visual identity.
- `assets/js/script.js`: language selection, accessible navigation, fragment alignment, and a pausable photo slideshow that respects reduced motion.
- `blog/*.html`: original essays; `blog/article.css` is their current stylesheet, and `blog/blog.js` handles reading progress and navigation language. `blog/blog.css` is legacy and is not loaded.
- `assets/images/`: original photographs and project images. Keep intrinsic width/height attributes when changing images to avoid layout shifts.
- `assets/documents/`: existing public résumés, research posters, reports, and artwork.

The September 2026 refresh starts from commit `eb212c0`, including the current Rice ECE profile.

## Deployment

After checks and review, commit and push to `master`. Verify the GitHub Pages build succeeds and that the deployed HTML/CSS/JS match the committed files. Contact links open the visitor's email application or the existing meeting calendar; the site does not submit a contact form.
