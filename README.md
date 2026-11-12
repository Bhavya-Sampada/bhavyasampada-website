# bhavyasampada.com

Static site for Bhavya Sampada Private Limited, hosted on Netlify, edited through Decap CMS at `/admin`.

## How it fits together

```
src/design/*.dc.html   the page designs (exported from the Claude Design canvas; source of truth for layout and copy)
src/assets/            images, logos, team photos, article covers, site.js
src/admin/             Decap CMS (config.yml + index.html)
src/_redirects         old URLs → new URLs
src/_headers           security and cache headers
content/articles/*.md  one markdown file per article or case study (editable in the CMS)
content/team.json      names, roles, credentials, bios, photos (editable in the CMS)
content/data/          snapshots of the YouTube feed and Google reviews (refreshed at each build)
build/build.js         turns all of the above into dist/ (no dependencies, Node 18+)
netlify/functions/     daily-rebuild: triggers a rebuild every morning so feeds stay fresh
```

`node build/build.js` writes the whole site to `dist/`. Netlify runs that on every push to `main` and on every CMS save.

Local preview:

```bash
npm run serve
```

then open http://localhost:8888. `npm run build:offline` skips the live feed fetches.

## URLs

| Page | URL |
|---|---|
| Home | `/` |
| Services | `/services/` |
| About | `/about/` |
| Articles (guides, case studies, videos) | `/articles/` |
| One article | `/articles/<slug>/` |
| Book a free review | `/book-a-free-review/` |
| Thank you (form redirect) | `/thank-you/` |
| Privacy policy, Terms | `/privacy-policy/`, `/terms/` |
| CMS | `/admin/` |

Old URLs (`/about.html`, `/blog.html`, `/videos`, `/testimonials` …) redirect permanently; see `src/_redirects`.

## Editing content

Sign in at https://bhavyasampada.com/admin with the Netlify Identity login. Articles use an editorial workflow, so publishing is three clicks: **Save** (creates a draft), **Status → Ready**, then **Publish → Publish now** and confirm. Each publish commits to this repository and Netlify rebuilds the site; the page is live in about a minute. Deleting an entry removes it the same way.

Rules baked into the CMS and the build:
- Articles are bylined only to the directors listed in `content/team.json` with `"writes": true`. Credentials and photos come from the Team entry, not the article.
- Case studies need the consent box ticked and outcomes written as actions taken, never returns or percentages.
- `## headings` in the body become the "In this article" list. A `>` quote becomes a "Worth knowing" box.

## Forms

The two booking forms (Home and Book a free review) and the newsletter box post to Netlify Forms (`book-review`, `newsletter`) and redirect to `/thank-you/`. Submissions appear under Forms in the Netlify dashboard; set up email notifications there.

## Daily feeds

At build time `build/build.js` fetches:
- the channel's public YouTube feed (`UCby1V52xiNRp0Eg86BCTO1A`), newest three shown on `/articles/#videos`;
- Google reviews from the Places API when `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` are set; otherwise the snapshot in `content/data/google-reviews.json` is used.

`netlify/functions/daily-rebuild.mjs` runs every day at 06:00 IST and POSTs to the build hook in `BUILD_HOOK_URL`, so the site rebuilds with fresh data. If a fetch fails the last snapshot is used; the site never goes blank.

## Netlify setup (one time)

1. **Build settings** are read from `netlify.toml` (command `node build/build.js`, publish `dist`, functions `netlify/functions`). Nothing to change.
2. **Forms**: Site configuration → Forms → enable form detection. Then add a notification email under Forms → Form notifications.
3. **Build hook**: Site configuration → Build & deploy → Build hooks → add `daily-refresh` on `main`. Copy the URL.
4. **Environment variables**: Site configuration → Environment variables → add
   - `BUILD_HOOK_URL` = the hook URL from step 3
   - `PLACES_ACCESS_B64` = the Google Places API key, base64-encoded (Netlify's free plan refuses the raw key as a plain variable). `GOOGLE_PLACES_API_KEY` with the raw key also works on plans that allow secrets.
   - `GOOGLE_PLACE_ID` = the Place ID of the Google Business Profile
   - `GA_MEASUREMENT_ID` = the Google Analytics 4 measurement ID (G-XXXXXXX). Leave unset for no analytics; when set, a consent banner appears and analytics stays off until the visitor accepts.
5. **Identity**: already on. Invite new CMS users under Identity → Invite users. Keep registration on "Invite only".
6. **Domain**: unchanged; `bhavyasampada.com` keeps pointing at this site.

## Compliance notes

The site is written for an AMFI-registered Mutual Fund Distributor (ARN 266666) and IRDAI-licensed intermediary (A00830505). Keep it that way: no "advisor" in titles, no return figures, no scheme recommendations, no rating schema for self-hosted reviews, and keep a dated source for every stat shown (AUM, client count, award count, review count).
