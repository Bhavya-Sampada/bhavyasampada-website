# bhavyasampada.com

Read `AGENTS.md` first: it explains how the site is built, where everything lives, the compliance rules that must not be broken, and how to debug. `README.md` covers the Netlify setup and the accounts involved.

Quick facts:
- Static site, zero dependencies. Build: `node build/build.js` → `dist/`. Offline: `SKIP_FEEDS=1 node build/build.js`.
- `main` is live on Netlify; pushing to `main` deploys.
- Edit `src/design/*.dc.html` for pages, `content/articles/*.md` for articles, `src/assets/js/site.js` for behaviour.
- Never commit `dist/` or any API key.
- Regulated financial firm: no "advisor", no return figures, no product recommendations, no rating schema. See `docs/compliance-review.md`.
