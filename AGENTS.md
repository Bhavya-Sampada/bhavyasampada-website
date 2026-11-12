# Working on bhavyasampada.com

Read this first if you are an AI assistant or a developer who has just cloned this repository. It is written so that someone with no history on the project can make a change safely in one sitting.

## What this is

The public website of Bhavya Sampada Private Limited, an AMFI-registered Mutual Fund Distributor (ARN 266666) and IRDAI-licensed insurance intermediary in Secunderabad, India. A static site: no framework, no database, no server. Node 18+ is the only tool needed.

- `main` branch = the live site. Every push to `main` makes Netlify rebuild and publish within about a minute.
- Editors publish articles through Decap CMS at `/admin`; each publish is a commit to `main` by Netlify's git gateway.
- `README.md` explains the folder layout, URLs, forms, feeds and the Netlify setup. `docs/` holds the compliance review, SEO spec, writing brief and design reference.

## How a change gets to the live site

1. Edit files under `src/` or `content/`.
2. Run `node build/build.js` (or `SKIP_FEEDS=1 node build/build.js` offline). It writes the whole site to `dist/`. Zero dependencies; `npm install` is not needed.
3. Preview locally: `python3 -m http.server 8888 --directory dist` and open http://localhost:8888.
4. Commit and push to `main`. Netlify builds and deploys. Check https://bhavyasampada.com after a minute.

Never commit `dist/` (it is in `.gitignore`). Never commit API keys; they live in Netlify environment variables.

## Where things are

| Change you want | File(s) |
|---|---|
| Page copy, layout, styles (Home, Services, About, Book, Articles index, article template, Privacy, Terms, 404, Thank you) | `src/design/<Page>.dc.html`. These are design exports; the build converts them. Each page has its own `<style>` block. Links between pages use the design names (`Book.dc.html`, `Article.dc.html#slug`) and are rewritten to clean URLs by the build. |
| An article or case study | `content/articles/<slug>.md` (front matter + markdown). The URL is `/articles/<slug>/`. Editors normally do this in the CMS. |
| Team names, roles, credentials, bios, photos | `content/team.json`; photos in `src/assets/img/team/` (4:5, 800×1000). The About and Home cards are static HTML in the design pages, so update both the JSON (used for article bylines) and the cards. |
| Site behaviour (menu, FAQ accordion, EMI slider, article filters, consent banner, animations) | `src/assets/js/site.js` |
| Page titles, meta descriptions, JSON-LD, sitemap, llms.txt | `build/build.js` (`PAGES` table and the schema functions) |
| Redirects from old URLs / security headers | `src/_redirects`, `src/_headers` |
| CMS fields and collections | `src/admin/config.yml` |
| Daily refresh of YouTube videos and Google reviews | `build/build.js` (`loadVideos`, `loadReviews`), snapshots in `content/data/`, schedule in `netlify/functions/daily-rebuild.mjs` |
| Images, logos, article covers | `src/assets/img/` (covers are SVG, 1600×1000) |

## Conventions that matter

- **Compliance first.** This is a regulated financial firm. Never add: "advisor"/"advisory" as a title, return figures or percentages, scheme or product recommendations, "guaranteed"/"assured", direct equity, award claims without a dated source, or review/rating schema markup. Case studies must describe actions taken, not outcomes in money terms, and need written client consent. See `docs/compliance-review.md`.
- **Names** as they appear on the site: V M Bapiraju (CEO), A Vijay Datta (Chief Business Officer), Aparna (Managing Director), V Parvathi (Managing Director), V Maitreyi (Customer Success Manager). Only the first three are bylined on articles.
- **Plain English, sentence case headings, no hype.** Match the tone of the existing articles. The writing brief is in `docs/writing-brief.md`.
- **Mobile matters.** Check 375px as well as desktop. Breakpoints are at 1100px and 860px in each page's CSS; the build injects a few shared rules (see `convert()` in `build/build.js`).
- **Honesty of claims.** The reviews section says "pulled live" only when the build actually fetched from Google (`reviews.live`). Keep that logic if you touch it.

## Debugging

- Build fails on Netlify: open the deploy log in Netlify (Deploys → the failed deploy). Reproduce locally with `node build/build.js`. The build prints which feed it used and any unfilled template hole.
- A page looks wrong: open the corresponding `src/design/*.dc.html`; the build only strips the design runtime, fills `{{holes}}`, converts `<sc-if>`/`<sc-for>` blocks and rewrites links/images, so what you see in the design file is what ships.
- CMS can't publish: Netlify → Identity (is the user invited and confirmed?) and → Site configuration → Identity → Services → Git Gateway (must be enabled). Publishing is Save → Status: Ready → Publish now.
- Form emails not arriving: Netlify → Forms → Submission notifications; each address must be confirmed. Check spam for formresponses@netlify.com.
- Reviews stopped updating: Netlify env vars `PLACES_ACCESS_B64` and `GOOGLE_PLACE_ID` present? Google Cloud project `bhavya-sampada` key `bhavyasampada-website-reviews` still restricted to the two Places APIs and not expired? The build falls back to the last snapshot in `content/data/google-reviews.json` and drops the "updated daily" wording, so the site never breaks.
- Roll back: Netlify → Deploys → pick an earlier deploy → "Publish deploy". Instant.

## Things not in this repository

- The original Claude Design canvas the pages were exported from. Not needed; the exports in `src/design/` are the source now.
- Logins: see the "Accounts and access" table in `README.md`.
