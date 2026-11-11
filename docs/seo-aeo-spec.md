# Bhavya Sampada — SEO and AEO spec for the build

What the developer implements when the design is coded. "AEO" (answer engine optimisation) means being quoted correctly by Google's AI Overviews, ChatGPT, Perplexity and the like: clear entity facts, answer-first copy, structured data, and author credibility.

## 1. What is already in the design
- One H1 per page, H2 sections, H3 cards. Sentence-case headings that match how people search.
- Answer-first FAQ blocks on Home (6 Qs) and Services (4 Qs), marked up with FAQPage/Question/Answer microdata. Each answer is 2–3 sentences and stands on its own.
- Article pages: breadcrumb, byline with author credentials, dates, reading time, "In this article" contents, a disclaimer, and an author box. These are the E-E-A-T signals answer engines look for.
- Every page footer carries the full NAP (name, address, phone), the ARN and licence lines, and links to YouTube, Instagram and the Google review page.
- The CMS editor has meta title / meta description fields with length counters and a Google preview; URL slugs are generated from titles.

## 2. Per-page titles and descriptions
| Page | URL | Title (≤60) | Meta description (≤155) |
|---|---|---|---|
| Home | / | Financial Planning, Insurance & Loans \| Bhavya Sampada | The financial choices you make today decide where you are in 20 years. A written plan first, then the investments, insurance and loans that fit it. 15+ years, 2,000+ clients. |
| Services | /services | Financial Planning, Mutual Funds, Insurance & Loans \| Bhavya Sampada | Plan it, invest it, protect it, fund it. Goal-based planning, mutual funds and SIPs, every kind of insurance with claims help, and loans compared across lenders. |
| About | /about | About Bhavya Sampada \| 15+ years helping families plan | Meet the directors who run every free review, our approach, and our AMFI and IRDAI registrations. |
| Articles | /articles | Money guides and client case studies \| Bhavya Sampada | Plain guides on SIPs, tax, retirement, cover and loans, plus case studies of how we helped clients. Written by the people who run your review. |
| Article | /articles/{slug} | {Article title} \| Bhavya Sampada | {Summary field} |
| Book | /book-a-free-review | Book a free financial review \| Bhavya Sampada | A free 30-minute review with one of our directors, in person in Secunderabad or online anywhere in India. |

Rules: title field in the CMS overrides; never duplicate titles; brand suffix on every page; the H1 and title should share the main phrase.

## 3. URL structure and redirects from the current site
- `/services`, `/about`, `/articles`, `/articles/{slug}`, `/book-a-free-review`, `/privacy-policy`, `/terms`.
- 301 redirects: `/blog` → `/articles`, `/blog/{old-slug}` → `/articles/{new-slug}` (map each), `/videos` → `/articles#videos`, `/testimonials` → `/#clients`, `/#cta` → `/book-a-free-review`. Keep `/about` and `/services` as they are.
- Trailing-slash and www/non-www: pick one, redirect the other. Current live site answers on `bhavyasampada.com`; keep that canonical.

## 4. Structured data (JSON-LD, one block per page in `<head>`)
Site-wide (every page):
```json
{
  "@context": "https://schema.org",
  "@type": ["FinancialService", "LocalBusiness"],
  "@id": "https://bhavyasampada.com/#org",
  "name": "Bhavya Sampada",
  "alternateName": "Bhavya Sampada Financial Advisors",
  "url": "https://bhavyasampada.com/",
  "logo": "https://bhavyasampada.com/logo.png",
  "image": "https://bhavyasampada.com/og.jpg",
  "telephone": "+91-40-35175228",
  "email": "support@bhavyasampada.com",
  "address": {"@type": "PostalAddress", "streetAddress": "Plot No. 156, Srinivasa Nagar Colony, Near Radhika Theater, Kapra", "addressLocality": "Secunderabad", "addressRegion": "Telangana", "postalCode": "500062", "addressCountry": "IN"},
  "areaServed": "IN",
  "sameAs": ["https://www.youtube.com/@the.two.wealth.theory", "https://www.instagram.com/thewealth.theory/", "[Google Business Profile URL]"],
  "founder": [{"@type": "Person", "name": "V M Bapiraju", "jobTitle": "Chief Executive Officer"}],
  "employee": [{"@type": "Person", "name": "A Vijay Datta", "jobTitle": "Chief Financial Officer"}, {"@type": "Person", "name": "Aparna", "jobTitle": "Managing Director"}, {"@type": "Person", "name": "V Parvathi", "jobTitle": "Managing Director"}, {"@type": "Person", "name": "V Maitreyi", "jobTitle": "Customer Success Manager"}],
  "knowsAbout": ["Financial planning", "Mutual funds", "SIP", "Health insurance", "Term insurance", "Home loans", "Retirement planning", "Tax planning"],
  "identifier": [{"@type": "PropertyValue", "propertyID": "AMFI ARN", "value": "266666"}, {"@type": "PropertyValue", "propertyID": "IRDAI licence", "value": "[number]"}],
  "openingHours": "[Mo-Sa 10:00-18:00]",
  "priceRange": "Free first review"
}
```
Per page, add:
- Home and Services: `FAQPage` with the questions exactly as on the page (already in microdata; emit JSON-LD too, Google prefers it).
- Services: one `Service` per group (Plan, Invest, Protect, Borrow) with `provider` → `#org` and `serviceType`.
- About: `Person` for each director with `worksFor` → `#org`, `jobTitle`, `description` (credentials), `image`.
- Articles list: `CollectionPage` + `ItemList` of the articles.
- Article: `Article` (or `BlogPosting`) with `headline`, `description`, `author` (Person → the director), `publisher` → `#org`, `datePublished`, `dateModified`, `image`, `mainEntityOfPage`, `articleSection` (topic), `about`. Case studies add `"genre": "Case study"`. Plus `BreadcrumbList`.
- Videos: `VideoObject` per video (name, description, thumbnailUrl, uploadDate, embedUrl from YouTube).
- Testimonials: do NOT emit `Review`/`AggregateRating` schema; Google treats self-serving reviews on your own site as spam. Keep them as plain text and link to the Google reviews page.
- Add `"speakable"` to Home (the hero H1 + the first FAQ answer) and to each article's summary paragraph.

## 5. Answer-engine (AEO) rules for content
- First paragraph of every article answers the title's question in two sentences, then expands. Same for every FAQ answer.
- Use the entity name consistently: "Bhavya Sampada" (not BS, not Bhavya Sampada Financial Advisors) in body copy; the long form only in the legal line.
- Every article has a named author with credentials and the ARN in the disclaimer; AI engines down-rank anonymous finance content.
- Keep numbers concrete and marked illustrative. No "guaranteed", "assured", "best returns".
- One topic per article; link each article to its Services group and to two related articles (already in the design).
- Add a `/llms.txt` file (plain text: who you are, what you do, the ARN, links to the key pages and the five best articles). Cheap, and some engines read it.
- Publish the About page's "Our story" and the directors' bios; they are the strongest E-E-A-T page and are still placeholders.

## 6. Technical checklist
- `sitemap.xml` (generated by the build; articles update it on publish) and `robots.txt` that allows everything except `/admin`.
- `<link rel="canonical">` on every page; `og:title`, `og:description`, `og:image` (1200×630; make one branded default and let the article cover override), `twitter:card=summary_large_image`.
- `lang="en-IN"`. Alt text on every image; the CMS already demands it for covers.
- Core Web Vitals: the hero wave canvas must not delay LCP. Draw it after the first paint (`requestIdleCallback`), keep it off on mobile under 768px or when `prefers-reduced-motion`, and keep the logo and hero text as plain HTML so LCP is the H1. Fonts: preload Poppins 400 and 500 only, `font-display: swap`.
- Compress logos (the Aditya Birla PNG is 330 KB; target under 30 KB each, WebP where possible).
- Lazy-load everything below the hero; serve images via `srcset`.
- HTTPS, HSTS, security headers; Netlify handles these with a `_headers` file.
- Google Search Console and Google Business Profile: verify both, submit the sitemap, and set the Business Profile website to the home page. Bing Webmaster Tools too (Copilot and ChatGPT lean on Bing's index).
- GA4 with a consent banner that defaults to analytics-off until accepted (India's DPDP Act, 2023).

## 7. Local SEO
- NAP must match exactly across the site footer, Google Business Profile, Justdial/Sulekha/any directory listings, and social bios.
- Ask the three directors to add the firm as their employer on LinkedIn and link to the site.
- Keep the review link in the footer; aim for a steady flow of Google reviews rather than a burst.

## 8. Google reviews feed (build requirement)
- Source: Google Places API (New), Place Details for the firm's Place ID (listing kgmid /g/11vtb27bt4; fetch the Place ID once with Find Place). Fields: `rating`, `userRatingCount`, `reviews` (Google returns the 5 most relevant or most recent; request `reviews` sorted newest).
- Schedule: a Netlify scheduled function runs once a day (and on deploy), writes `data/google-reviews.json` (rating, count, five latest reviews with author name, relative time, text, author photo URL, review URL) and triggers a rebuild, so the hero badge, the "139 families" heading, the score card and the three review cards all update without anyone touching the CMS.
- Rules: show newest first, never filter by rating, never edit text (truncate with an ellipsis and link "Read on Google"), show the author name exactly as Google displays it, and keep the "Nothing is edited or hand-picked" line true. Cache the last good response so an API outage never blanks the section.
- Needs from you: a Google Cloud project with Places API enabled and billing on (the volume here is well inside the free tier), an API key restricted to the Netlify function, and owner access to the Business Profile to confirm the Place ID.
- Do not add Review or AggregateRating schema for these reviews (Google treats self-hosted ratings as self-serving); the badge links to Google instead.

## 9. YouTube videos feed (build requirement)
- Source: the channel's public Atom feed, `https://www.youtube.com/feeds/videos.xml?channel_id=UCby1V52xiNRp0Eg86BCTO1A` (The Wealth Theory). No API key needed.
- Schedule: the same daily Netlify scheduled function that refreshes Google reviews also fetches this feed, writes `data/youtube.json` (latest 6: videoId, title with hashtags and emoji stripped, published date), and the rebuild shows the newest three on `/articles#videos` with `https://i.ytimg.com/vi/{id}/hqdefault.jpg` thumbnails linking to `https://www.youtube.com/watch?v={id}`.
- Shorts are vertical; the card crops the letterboxed thumbnail with object-fit cover. Cache the last good feed so an outage never blanks the section.
- The CMS "Videos" tab becomes read-only (feed-driven) with a "hide" toggle per video for anything you don't want on the site.
