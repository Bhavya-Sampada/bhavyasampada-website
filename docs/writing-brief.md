# Writing brief — Bhavya Sampada articles

Bhavya Sampada is an Indian financial planning firm (AMFI-registered mutual fund distributor, ARN 266666; IRDAI-licensed insurance intermediary; arranges loans). 15+ years, 2,000+ client families, three directors who personally run every free review: V M Bapiraju (Chief Executive Officer), A Vijay Datta (Chief Financial Officer), Aparna (Managing Director). Office in Secunderabad, clients across India. Site voice: a direct, warm colleague. Plain language, short sentences, concrete numbers, no hype. Audience: salaried and self-employed Indian families, 30–55, government employees, doctors, NRIs.

## Hard rules (compliance: SEBI/AMFI advertising code, IRDAI advertisement regulations)
- Never state or imply returns, CAGR, "x% growth", or "doubles in N years". Never "guaranteed", "assured", "best", "risk-free", "beat the market".
- Any ₹ figures are illustrative and must be introduced as such ("Say your monthly spend is ₹60,000"). Inflation or growth assumptions, if unavoidable, say "assume" and keep them modest; never present a projected corpus as a promise.
- No fund, scheme, insurer or lender names. No product recommendations. Say "a mutual fund SIP", "a term plan", "a super top-up", "a lender".
- Case studies: names changed; no identifiable details beyond city, age band and profession; outcomes described as ACTIONS (cover raised to ₹X, EMI reduced by ₹Y, SIP started, nominee updated), never investment gains or percentages. No client testimonial quotes.
- Do not mention Hyderabad. Secunderabad is fine as the firm's office. Case-study cities should vary across India (Warangal, Visakhapatnam, Bengaluru, Pune, Nizamabad, Secunderabad, Chennai, Dubai-to-India return, etc.).
- Refer to the firm as "we"; use "Bhavya Sampada" at most once per article. Never call us "advisers"/"advisors". Say "a review", "our directors", "a written plan".
- Indian context only: ₹, lakh, crore, Section 80C/80D, EPF, PPF, NPS, GPF, SIP, term plan, family floater, super top-up, EMI, balance transfer, nominee. FY 2025-26 tax rules: new regime is the default (standard deduction ₹75,000, no 80C/80D there); old regime still allows 80C (₹1.5 lakh), 80D, HRA, home-loan interest. Be careful and hedge with "check the current year's rules".
- Polite about hard topics (retirement without a pension, death, illness). No fear-selling, no "homeless".
- Plain Markdown. ASCII hyphens only, no em dashes. Use ₹.

## Format (one file per article, exact)
```
---
title: "..."
slug: kebab-case
type: guide            # or: case
topic: Investing       # one of: Investing, Retirement, Tax, Insurance, Loans, Planning
author: A Vijay Datta    # or V M Bapiraju, or Aparna
role: Chief Financial Officer   # Chief Executive Officer / Managing Director
date: 2026-09-14       # between 2026-05-01 and 2026-11-05, all different
read: 7                # minutes, 5-9
summary: "One or two sentences, max 180 characters, answer-first."
cover_alt: "Short description of a simple illustration for this piece."
outcome: "Case studies only: what changed, one line, actions only."
---
Opening paragraph: answers the title's question in two sentences, then one more sentence on what the article covers.

## Section heading (sentence case)
...
```
- 700–900 words of body. 4–6 `##` sections. One `> ` blockquote callout somewhere with the single most useful sentence. Bulleted lists welcome (max 6 items). A small Markdown table is fine where it helps (max 4 rows).
- Guides end with a `## What to do this week` section: 3 concrete, free actions. Final line of every guide: a one-sentence invitation to a free 30-minute review with one of our directors (vary the wording).
- Case studies use exactly these sections: `## Where they started`, `## What we found`, `## What we did`, `## What changed`, `## What you can take from this`. Open with a line like "Names changed; shared with the client's consent." in italics after the front matter.
