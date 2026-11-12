#!/usr/bin/env node
/*
  Bhavya Sampada — static site build.

  Reads the design pages in src/design (exported from the Claude Design canvas),
  the content in content/, and writes a plain static site to dist/.

  No dependencies: Node 18+ only.

  What it does
  1. Turns each design page into a real HTML page: strips the design runtime,
     fills template holes, converts the mobile menu / FAQ / EMI widget / filters
     into data-attributes that assets/js/site.js drives, maps design links to
     clean URLs and design image blobs to files in assets/img.
  2. Renders every content/articles/*.md as /articles/<slug>/ from the Article
     template, builds the Articles index and the related-article cards.
  3. Pulls the latest videos from the YouTube channel feed and the latest Google
     reviews (when GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are set), falling
     back to the JSON snapshots in content/data.
  4. Writes per-page SEO (titles, descriptions, canonical, Open Graph, JSON-LD),
     sitemap.xml, robots.txt, llms.txt, _redirects and _headers.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DESIGN = path.join(SRC, 'design');
const CONTENT = path.join(ROOT, 'content');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://bhavyasampada.com';
const ORG = 'Bhavya Sampada';
const LEGAL = 'Bhavya Sampada Private Limited';
const YT_CHANNEL_ID = 'UCby1V52xiNRp0Eg86BCTO1A';
const YT_HANDLE = 'https://www.youtube.com/@the.two.wealth.theory';
const GOOGLE_REVIEW_URL = 'https://share.google/V3oD3dOOpZJHswJtR';

/* ------------------------------------------------------------------ helpers */
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const mkdirp = (p) => fs.mkdirSync(p, { recursive: true });
function write(rel, data) {
  const p = path.join(DIST, rel);
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, data);
}
function copyDir(from, to) {
  if (!exists(from)) return;
  mkdirp(to);
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return iso;
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}
function relTime(iso) {
  const d = new Date(iso), now = new Date();
  const days = Math.max(0, Math.round((now - d) / 86400000));
  if (days < 1) return 'Today';
  if (days < 7) return days === 1 ? 'Yesterday' : days + ' days ago';
  if (days < 30) { const w = Math.round(days / 7); return w <= 1 ? 'A week ago' : w + ' weeks ago'; }
  if (days < 365) { const m = Math.round(days / 30); return m <= 1 ? 'A month ago' : m + ' months ago'; }
  const y = Math.round(days / 365); return y <= 1 ? 'A year ago' : y + ' years ago';
}
function cleanVideoTitle(t) {
  return String(t || '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])(?=[A-Za-z])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}
function shortTitle(t) {
  t = cleanVideoTitle(t);
  if (t.length > 64) {
    const m = t.match(/^(.{24,70}?[.!?])\s/);
    if (m) t = m[1];
  }
  if (t.length > 80) t = t.slice(0, 77).replace(/\s+\S*$/, '') + '…';
  return t.replace(/[\s.,:;\-–—|]+$/g, '');
}

/* -------------------------------------------------------------- site config */
const PAGES = {
  'Main.dc.html': { out: 'index.html', url: '/', page: 'home',
    title: 'Financial Planning, Insurance & Loans | Bhavya Sampada',
    desc: 'The financial choices you make today decide where you are in 20 years. A written plan first, then the investments, insurance and loans that fit it. 15+ years, 2,000+ clients.' },
  'Services.dc.html': { out: 'services/index.html', url: '/services/', page: 'services',
    title: 'Financial Planning, Mutual Funds, Insurance & Loans | Bhavya Sampada',
    desc: 'Plan it, invest it, protect it, fund it. Goal-based planning, mutual funds and SIPs, every kind of insurance with claims help, and loans compared across lenders.' },
  'About.dc.html': { out: 'about/index.html', url: '/about/', page: 'about',
    title: 'About Bhavya Sampada | 15+ years helping families plan',
    desc: 'Meet the directors who run every free review, our approach, and our AMFI and IRDAI registrations.' },
  'Insights.dc.html': { out: 'articles/index.html', url: '/articles/', page: 'articles',
    title: 'Money guides and client case studies | Bhavya Sampada',
    desc: 'Plain guides on SIPs, tax, retirement, cover and loans, plus case studies of how we helped clients. Written by the people who run your review.' },
  'Book.dc.html': { out: 'book-a-free-review/index.html', url: '/book-a-free-review/', page: 'book',
    title: 'Book a free financial review | Bhavya Sampada',
    desc: 'A free 30-minute review with one of our directors, in person in Secunderabad or online anywhere in India.' },
  'Privacy.dc.html': { out: 'privacy-policy/index.html', url: '/privacy-policy/', page: 'privacy',
    title: 'Privacy policy | Bhavya Sampada',
    desc: 'How Bhavya Sampada collects, uses and protects your personal data, in line with the Digital Personal Data Protection Act, 2023.' },
  'Terms.dc.html': { out: 'terms/index.html', url: '/terms/', page: 'terms',
    title: 'Terms of use | Bhavya Sampada',
    desc: 'The terms on which Bhavya Sampada provides this website and its services, including disclosures, disclaimers and grievance routes.' },
  'Thanks.dc.html': { out: 'thank-you/index.html', url: '/thank-you/', page: 'thanks', noindex: true,
    title: 'Thank you | Bhavya Sampada',
    desc: 'We have your details. One of our directors will call within one working day.' },
  'NotFound.dc.html': { out: '404.html', url: '/404.html', page: 'notfound', noindex: true,
    title: 'Page not found | Bhavya Sampada',
    desc: 'That page does not exist. Here is where to go instead.' },
};
const LINKS = {
  'Main.dc.html': '/', 'Services.dc.html': '/services/', 'About.dc.html': '/about/',
  'Insights.dc.html': '/articles/', 'Book.dc.html': '/book-a-free-review/', 'Article.dc.html': '/articles/',
  'Privacy.dc.html': '/privacy-policy/', 'Terms.dc.html': '/terms/', 'Thanks.dc.html': '/thank-you/',
  'NotFound.dc.html': '/404.html', 'Admin.dc.html': '/admin/', 'Editor.dc.html': '/admin/',
};
/* Design image blobs → files in src/assets/img */
const BLOBS = {
  '597e264cd8a0b0ddbc6966debb2bec4a': '/assets/img/logo-mark.png',
  'd5170994c6ef0c369a079afad9225e5e': '/assets/img/logo-full.png',
  'd262008820318fc1d6b1e867f43eaa4f': '/assets/img/logos/amfi.svg',
  'b610fd6db46c6adea707675348c399fb': '/assets/img/logos/irdai.png',
  '8571f0fa44209aa9092ea267bd5fee85': '/assets/img/logos/hdfc.png',
  '8c72ed55ce3eeb69595b5fa545194339': '/assets/img/logos/digit.svg',
  '9a7ac9f72fc746d3f7a58306ace5e12d': '/assets/img/logos/royal-sundaram.png',
  'a20b31148fa549ec02255ec1499834cf': '/assets/img/logos/acko.png',
  'a4112c3cd14880fef5a0567683c621c6': '/assets/img/logos/manipalcigna.png',
  'a707d1618375e0bbd6a032d4b7da4616': '/assets/img/logos/icici.png',
  'e3c6dc22cc9445a1e8308eb9448d9063': '/assets/img/logos/adityabirla.png',
  'fb030d75df3e356d4f60c0c9d3c6fe0d': '/assets/img/logos/star.png',
  '18ad6f9f8b3ce22eb087edfd52fa09c7': '/assets/img/team/photo-datta.jpg',
  '61bbf6aae7d99a24196221b668c97746': '/assets/img/team/photo-aparna.jpg',
  'db637f927c3d193f5d350373a198d24c': '/assets/img/team/photo-bapiraju.jpg',
  'a74cedb13400c2884b3b7a738c3a0623': '/assets/img/team/photo-maitreyi.jpg',
  '691fee36a0e37ef052cfd12223e97661': '/assets/img/team/photo-parvathi.jpg',
  'dc8952d746ed1b38b006ec518d4952d3': '/assets/img/story.svg',
  '520257ba8332b3e9ea03c926d6958da4': 'https://i.ytimg.com/vi/kqQy8mAXpXs/hqdefault.jpg',
  '93ab1e24cfc84249b37a50b901c2c5f9': 'https://i.ytimg.com/vi/2n1vmhCY9tM/hqdefault.jpg',
  '5cce1ddfdf430703ebb0ebe1b0aa40cf': 'https://i.ytimg.com/vi/-hWMw3ZsRRk/hqdefault.jpg',
  // article covers
  'cd483d9346786a09407b4601b862b3b0': '/assets/img/covers/how-much-to-retire.svg',
  '1d167a463aae3494944f4ba4448ce273': '/assets/img/covers/sip-vs-lump-sum.svg',
  'f643bd50fb6c6e1ecb081a7a1092a85f': '/assets/img/covers/case-emi-without-stretching-the-loan.svg',
  'e69fb25389adf8f0715af042ee02d193': '/assets/img/covers/tax-saving-salaried.svg',
  '6e59f6210cb4a2197697fe18aeb026fb': '/assets/img/covers/case-doctors-health-cover-rebuilt.svg',
  '2f95026918304cdb21614833cf8275bf': '/assets/img/covers/health-cover-parents.svg',
  'fc66652374d45acfd122bc0137dda903': '/assets/img/covers/term-insurance-how-much.svg',
  '46b103f11f3b765c5dc825ee3818a8c4': '/assets/img/covers/case-government-teacher-retirement-at-45.svg',
  '54af211bbe3e729527f2b6cad9588e72': '/assets/img/covers/home-loan-balance-transfer.svg',
  'b841948609c16b42d444a390c3348ff4': '/assets/img/covers/when-to-stop-sip.svg',
  '6718ebd08e2063005b0243241b3bfca0': '/assets/img/covers/case-returning-nri-family.svg',
  '6b90566e09c4c7ad76b766b044b35365': '/assets/img/covers/emergency-fund.svg',
  '824ebb79f0223f0b78d6ee8ff08394e6': '/assets/img/covers/savings-policy-vs-term-and-sip.svg',
  'f0bfb6f7a8f251d139ea1e56e7f12a21': '/assets/img/covers/case-claim-and-a-plan-after-a-loss.svg',
  '46bd308e92186dba213463dfd3f8e7ae': '/assets/img/covers/childrens-education-fund.svg',
};

/* --------------------------------------------------------------- content */
const TEAM = JSON.parse(read(path.join(CONTENT, 'team.json'))).team;
const teamByName = Object.fromEntries(TEAM.map((t) => [t.name, t]));

function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1).replace(/\\"/g, '"');
    fm[k] = v;
  }
  return { fm, body: m[2].trim() };
}
function inline(t) {
  t = String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/`(.+?)`/g, '<code>$1</code>');
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
  return t;
}
/* Markdown → HTML with the same conventions as the drafts: h2 sections get ids
   s1..sN for the contents list; blockquotes become "Worth knowing" callouts;
   a lone italic line becomes a note. */
function mdToHtml(body) {
  const lines = body.split(/\r?\n/);
  const out = [], toc = [];
  let buf = [], i = 0, sec = 0;
  const flush = () => { if (buf.length) { out.push('<p>' + inline(buf.join(' ')) + '</p>'); buf = []; } };
  while (i < lines.length) {
    const ln = lines[i];
    if (ln.startsWith('## ')) {
      flush(); sec++; const title = ln.slice(3).trim();
      toc.push({ id: 's' + sec, label: title });
      out.push('<h2 id="s' + sec + '">' + inline(title) + '</h2>');
    } else if (ln.startsWith('### ')) {
      flush(); out.push('<h3>' + inline(ln.slice(4).trim()) + '</h3>');
    } else if (ln.startsWith('>')) {
      flush(); const q = [];
      while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].slice(1).trim()); i++; }
      out.push('<div class="callout"><p class="eyebrow">Worth knowing</p><p>' + inline(q.join(' ')) + '</p></div>');
      continue;
    } else if (/^\s*[-*] /.test(ln)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push('<li>' + inline(lines[i].replace(/^\s*[-*] /, '')) + '</li>'); i++; }
      out.push('<ul>' + items.join('') + '</ul>');
      continue;
    } else if (/^\s*\d+\. /.test(ln)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) { items.push('<li>' + inline(lines[i].replace(/^\s*\d+\. /, '')) + '</li>'); i++; }
      out.push('<ol>' + items.join('') + '</ol>');
      continue;
    } else if (ln.startsWith('|')) {
      flush(); let rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())); i++; }
      rows = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      if (rows.length) {
        const th = rows[0].map((c) => '<th>' + inline(c) + '</th>').join('');
        const tb = rows.slice(1).map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('');
        out.push('<table><thead><tr>' + th + '</tr></thead><tbody>' + tb + '</tbody></table>');
      }
      continue;
    } else if (ln.trim() === '') {
      flush();
    } else if (ln.startsWith('*') && ln.endsWith('*') && !ln.startsWith('**')) {
      flush(); out.push('<p class="note"><em>' + inline(ln.replace(/^\*|\*$/g, '')) + '</em></p>');
    } else {
      buf.push(ln.trim());
    }
    i++;
  }
  flush();
  return { html: out.join('\n'), toc };
}

function loadArticles() {
  const dir = path.join(CONTENT, 'articles');
  const list = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const { fm, body } = parseFrontMatter(read(path.join(dir, f)));
    if (String(fm.draft).toLowerCase() === 'true') continue;
    const slug = (fm.slug || f.replace(/\.md$/, '')).trim();
    const { html, toc } = mdToHtml(body);
    const author = teamByName[fm.author] || { name: fm.author || ORG, role: fm.role || '', bio: '', photo: '' };
    const isCase = String(fm.type || '').toLowerCase() === 'case';
    list.push({
      slug, title: fm.title || slug, summary: fm.summary || '', topic: fm.topic || 'Planning',
      author: author.name, role: fm.role || author.role || '', bio: author.bio || '', photo: author.photo || '',
      date: fm.date || '2026-01-01', datef: fmtDate(fm.date || '2026-01-01'),
      read: parseInt(fm.read, 10) || Math.max(3, Math.round(body.split(/\s+/).length / 200)),
      cover: fm.cover || ('/assets/img/covers/' + slug + '.svg'), coverAlt: fm.cover_alt || '',
      outcome: fm.outcome || '', isCase, html, toc, kind: isCase ? 'case' : 'edu',
      updated: fm.updated || fm.date || '2026-01-01',
    });
  }
  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return list;
}

/* ----------------------------------------------------------- live feeds */
async function fetchWithTimeout(url, opts, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 8000);
  try { return await fetch(url, Object.assign({}, opts, { signal: ctl.signal })); }
  finally { clearTimeout(t); }
}
async function loadVideos() {
  const snap = path.join(CONTENT, 'data', 'youtube.json');
  let data = exists(snap) ? JSON.parse(read(snap)) : { videos: [] };
  if (process.env.SKIP_FEEDS) return data;
  try {
    const r = await fetchWithTimeout('https://www.youtube.com/feeds/videos.xml?channel_id=' + YT_CHANNEL_ID, {}, 8000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const xml = await r.text();
    const entries = [];
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = re.exec(xml))) {
      const e = m[1];
      const id = (e.match(/<yt:videoId>([^<]+)</) || [])[1];
      const title = (e.match(/<title>([^<]*)</) || [])[1] || '';
      const published = (e.match(/<published>([^<]+)</) || [])[1] || '';
      if (id) entries.push({ id, title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"), date: published.slice(0, 10) });
    }
    if (entries.length) {
      data = { updated: new Date().toISOString(), videos: entries.slice(0, 6) };
      console.log('YouTube feed: ' + entries.length + ' videos');
    }
  } catch (e) {
    console.warn('YouTube feed unavailable, using snapshot: ' + e.message);
  }
  const hidden = new Set((data.hidden || []).map(String));
  data.videos = (data.videos || []).filter((v) => !hidden.has(v.id));
  return data;
}
async function loadReviews() {
  const snap = path.join(CONTENT, 'data', 'google-reviews.json');
  let data = exists(snap) ? JSON.parse(read(snap)) : { rating: 5.0, count: 0, reviews: [] };
  const key = process.env.GOOGLE_PLACES_API_KEY, place = process.env.GOOGLE_PLACE_ID;
  if (process.env.SKIP_FEEDS || !key || !place) {
    if (!key || !place) console.log('Google reviews: no API key/place id, using snapshot (' + (data.count || 0) + ' reviews)');
    return data;
  }
  try {
    const r = await fetchWithTimeout('https://places.googleapis.com/v1/places/' + encodeURIComponent(place), {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
    }, 8000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const reviews = (j.reviews || [])
      .map((rv) => ({
        author: (rv.authorAttribution && rv.authorAttribution.displayName) || 'Google user',
        rating: rv.rating || 5,
        text: (rv.text && rv.text.text) || (rv.originalText && rv.originalText.text) || '',
        when: rv.relativePublishTimeDescription || '',
        date: rv.publishTime || '',
        url: rv.googleMapsUri || j.googleMapsUri || GOOGLE_REVIEW_URL,
      }))
      .filter((rv) => rv.text)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    data = { updated: new Date().toISOString(), rating: j.rating || data.rating, count: j.userRatingCount || data.count, reviews: reviews.length ? reviews : data.reviews };
    console.log('Google reviews: ' + data.count + ' reviews, rating ' + data.rating);
  } catch (e) {
    console.warn('Google reviews unavailable, using snapshot: ' + e.message);
  }
  return data;
}

/* ------------------------------------------------------------ converter */
function headBlock(meta) {
  const url = SITE + meta.url;
  const img = meta.image ? (meta.image.startsWith('http') ? meta.image : SITE + meta.image) : SITE + '/assets/img/og-default.png';
  return [
    '<title>' + esc(meta.title) + '</title>',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="description" content="' + esc(meta.desc) + '">',
    meta.noindex ? '<meta name="robots" content="noindex, follow">' : '',
    '<link rel="canonical" href="' + url + '">',
    '<link rel="icon" type="image/png" href="/assets/img/favicon.png">',
    '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
    '<meta property="og:type" content="' + (meta.type || 'website') + '">',
    '<meta property="og:site_name" content="' + ORG + '">',
    '<meta property="og:title" content="' + esc(meta.title) + '">',
    '<meta property="og:description" content="' + esc(meta.desc) + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + img + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="theme-color" content="#131110">',
    (meta.jsonld || []).map((o) => '<script type="application/ld+json">' + JSON.stringify(o) + '</script>').join('\n'),
  ].filter(Boolean).join('\n');
}
function orgSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['FinancialService', 'LocalBusiness'],
    '@id': SITE + '/#org',
    name: ORG, legalName: LEGAL, url: SITE + '/', logo: SITE + '/assets/img/logo-full.png', image: SITE + '/assets/img/og-default.png',
    telephone: '+91-40-35175228', email: 'support@bhavyasampada.com',
    address: { '@type': 'PostalAddress', streetAddress: 'Plot No. 156, Srinivasa Nagar Colony, Near Radhika Theater, Kapra', addressLocality: 'Secunderabad', addressRegion: 'Telangana', postalCode: '500062', addressCountry: 'IN' },
    areaServed: 'IN',
    sameAs: [YT_HANDLE, 'https://www.instagram.com/thewealth.theory/'],
    founder: TEAM.filter((t) => /Chief Executive/.test(t.role)).map((t) => ({ '@type': 'Person', name: t.name, jobTitle: t.role })),
    employee: TEAM.map((t) => ({ '@type': 'Person', name: t.name, jobTitle: t.role })),
    knowsAbout: ['Financial planning', 'Mutual funds', 'SIP', 'Health insurance', 'Term insurance', 'Home loans', 'Retirement planning', 'Tax planning'],
    identifier: [{ '@type': 'PropertyValue', propertyID: 'AMFI ARN', value: '266666' }, { '@type': 'PropertyValue', propertyID: 'IRDAI licence', value: 'A00830505' }],
    openingHours: 'Mo-Sa 10:00-18:00', priceRange: 'Free first review',
  };
}
function faqSchema(html) {
  const qs = [];
  const re = /<span itemprop="name">([\s\S]*?)<\/span>[\s\S]*?<p itemprop="text">([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(html))) qs.push({ '@type': 'Question', name: strip(m[1]), acceptedAnswer: { '@type': 'Answer', text: strip(m[2]) } });
  return qs.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qs } : null;
}
const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

const DEFAULT_HOLES = {
  accent: '#D4AF37', motionClass: '', readyClass: '', navClass: '', menuOpen: 'false', false: 'false', true: 'true',
  year: '<span data-year>0</span>', curNav: 'cur',
  f0: 'open', f1: '', f2: '', f3: '', f4: '', f5: '',
  o0: 'true', o1: 'false', o2: 'false', o3: 'false', o4: 'false', o5: 'false',
  amt: '40', tAll: 'on', tEdu: '', tCase: '', fAll: 'on', fInv: '', fTax: '', fRet: '', fIns: '', fLoan: '', fVid: '',
  heading: 'Latest articles', countLabel: '', progress: 'var(--p,0)', notSent: 'true',
};
function emiFor(lakhs) {
  const P = lakhs * 100000, r = 0.09 / 12, n = 240;
  const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  return '₹' + Math.round(emi).toLocaleString('en-IN');
}

/* Convert one design page into static HTML. `extra` holds page-specific holes. */
function convert(src, meta, extra) {
  let h = src;
  // 1. runtime wrappers and scripts
  h = h.replace(/<script src="\.\/support\.js"><\/script>\s*/g, '');
  h = h.replace(/<script type="text\/x-dc"[\s\S]*?<\/script>\s*/g, '');
  h = h.replace(/<\/?x-dc>\s*/g, '');
  // move <helmet> (fonts + styles) into <head>
  const helmet = (h.match(/<helmet>([\s\S]*?)<\/helmet>/) || [])[1] || '';
  h = h.replace(/<helmet>[\s\S]*?<\/helmet>\s*/, '');
  h = h.replace(/<title>[\s\S]*?<\/title>/, headBlock(meta) + '\n' + helmet.trim() + '\n<style>[hidden]{display:none!important}.site.settled .rv,.site.settled .rise,.site.settled .nstep,.site.settled .tick{opacity:1;transform:none}@media (max-width:480px){.nav-right .btn{display:none}}@media (min-width:600px) and (max-width:860px){.g3{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media (max-width:1100px){.toc a{display:inline-block;padding:4px 10px;border:1px solid var(--line);border-radius:999px;font-size:13px}}@media (max-width:600px){.author{flex-direction:column;align-items:flex-start}.author .ph{width:88px;height:110px}}</style>\n<script src="/assets/js/site.js" defer></script>');
  h = h.replace('<html lang="en">', '<html lang="en-IN">');
  h = h.replace(/<body>/, '<body data-page="' + meta.page + '">');
  h = h.replace(/&display=swap"/g, '&amp;display=swap"');

  // 2. page-specific structures first (they may contain holes)
  if (extra && extra.transform) h = extra.transform(h);

  // 3. mobile menu, forms
  h = h.replace(/<sc-if value="\{\{menuOpen\}\}"[^>]*>\s*<div class="mmenu" id="mmenu">/g, '<div class="mmenu" id="mmenu" hidden>');
  h = h.replace(/<sc-if value="\{\{sent\}\}"[^>]*>[\s\S]*?<\/sc-if>\s*/g, '');
  h = h.replace(/<form class="form" onSubmit="\{\{submit\}\}"/g,
    '<form class="form" name="book-review" method="POST" action="/thank-you/" data-netlify="true" netlify-honeypot="bot-field"');
  h = h.replace(/<form onSubmit="\{\{noop\}\}"/g,
    '<form name="newsletter" method="POST" action="/thank-you/?newsletter=1" data-netlify="true" netlify-honeypot="bot-field"');
  h = h.replace(/(<form [^>]*name="book-review"[^>]*>)/g, '$1\n<input type="hidden" name="form-name" value="book-review"><p class="hp" hidden><label>Leave this empty <input name="bot-field"></label></p>');
  h = h.replace(/(<form [^>]*name="newsletter"[^>]*>)/g, '$1\n<input type="hidden" name="form-name" value="newsletter"><p class="hp" hidden><label>Leave this empty <input name="bot-field"></label></p>');
  h = h.replace(/<input id="em" type="email"/g, '<input id="em" name="email" type="email" required');
  h = h.replace(/<input id="ph" name="ph" type="tel"/g, '<input id="ph" name="ph" type="tel" inputmode="tel" pattern="[+]?[0-9][0-9 \\-]{8,16}[0-9]" title="Enter a mobile number with 10 digits, for example +91 98489 77660" minlength="10"');

  // 4. events → data attributes
  h = h.replace(/ on(?:Click|Input|Change|Submit)="\{\{(\w+)\}\}"/g, (all, name) => {
    if (name === 'toggleMenu') return ' data-menu-toggle';
    if (name === 'closeMenu') return ' data-menu-close';
    if (name === 'setAmt') return '';
    let m;
    if ((m = name.match(/^t(\d)$/))) return ' data-faq="' + m[1] + '"';
    if ((m = name.match(/^pick(All|Inv|Tax|Ret|Ins|Loan|Vid)$/))) return ' data-filter="' + m[1].toLowerCase() + '"';
    if ((m = name.match(/^type(All|Edu|Case)$/))) return ' data-type="' + m[1].toLowerCase() + '"';
    return '';
  });
  // EMI widget: attribute first, then text
  h = h.replace(/aria-valuetext="\{\{amtLabel\}\}"/g, 'aria-valuetext="₹40 lakh"');
  h = h.replace(/\{\{amtLabel\}\}/g, '<span data-amt-label>₹40 lakh</span>');
  h = h.replace(/\{\{emi\}\}/g, '<span data-emi>' + emiFor(40) + '</span>');

  // 5. remaining holes
  const holes = Object.assign({}, DEFAULT_HOLES, (extra && extra.holes) || {});
  h = h.replace(/\{\{(\w+)\}\}/g, (all, k) => (k in holes ? holes[k] : (console.warn('  unfilled hole ' + k + ' on ' + meta.page), '')));
  // any sc-if left: unwrap
  h = h.replace(/<sc-if[^>]*>/g, '').replace(/<\/sc-if>/g, '');
  h = h.replace(/ hint-placeholder-[a-z]+="[^"]*"/g, '');

  // 6. links and images
  h = h.replace(/href="Article\.dc\.html#([a-z0-9-]+)"/g, 'href="/articles/$1/"');
  h = h.replace(/href="([A-Za-z]+\.dc\.html)(#[\w-]*)?"/g, (all, f, hash) => 'href="' + (LINKS[f] || '/') + (hash || '') + '"');
  h = h.replace(/\/_blob\/([0-9a-f]{32})/g, (all, id) => BLOBS[id] || (console.warn('  unknown blob ' + id), all));
  // collapse 'class="site  "'
  h = h.replace(/class="site\s+"/g, 'class="site"').replace(/class="(qa|tb|chipb|tag)\s+"/g, 'class="$1"');
  return h;
}

/* --------------------------------------------------------- page builders */
function buildHomeExtras(reviews) {
  return {
    transform(h) {
      const count = reviews.count || 139;
      const rating = Number(reviews.rating || 5).toFixed(1);
      h = h.replace(/139 Google reviews/g, count + ' Google reviews')
        .replace(/139 families gave us five stars/g, count + ' families gave us five stars')
        .replace(/139 reviews/g, count + ' reviews')
        .replace(/<b>5\.0<\/b>/, '<b>' + rating + '</b>');
      const cards = (reviews.reviews || []).slice(0, 3).map((r, i) => {
        let text = r.text.length > 260 ? r.text.slice(0, 257).replace(/\s+\S*$/, '') + '…' : r.text;
        if (!/[.!?…”"']$/.test(text)) text += '…';
        const initial = (r.author || 'G').trim().charAt(0).toUpperCase();
        const when = r.when || (r.date ? relTime(r.date) : '');
        return '<div class="review"' + (i ? ' style="animation-delay:.' + (i * 8).toString().padStart(2, '0') + 's"' : '') +
          '><span class="stars" aria-hidden="true">' + '★'.repeat(Math.max(1, Math.min(5, Math.round(r.rating || 5)))) + '</span><p>“' + esc(text) + '”</p>' +
          '<div class="who"><i>' + esc(initial) + '</i><div><b>' + esc(r.author) + '</b><span>' + esc(when) + ' · via Google</span></div></div></div>';
      });
      if (cards.length) {
        h = h.replace(/(<div class="g3" aria-label="Recent Google reviews">)[\s\S]*?(\n\s*<\/div>\s*\n\s*<p class="rv")/, '$1\n      ' + cards.join('\n      ') + '$2');
      }
      return h;
    },
  };
}
function postCard(p, i) {
  const delay = i ? ' style="animation-delay:.' + ((i % 3) * 8).toString().padStart(2, '0') + 's"' : '';
  return '<a class="post rv ' + (p.isCase ? 'case' : '') + '" href="/articles/' + p.slug + '/" data-kind="' + p.kind + '" data-cat="' + esc(p.topic) + '"' + delay + '>' +
    '<div class="img"><img src="' + p.cover + '" alt="' + esc(p.coverAlt) + '" loading="lazy" width="1600" height="1000"></div>' +
    '<div class="body"><div class="meta"><span class="tag ' + (p.isCase ? 'case' : '') + '">' + (p.isCase ? 'Case study' : 'Guide') + '</span><b>' + esc(p.topic) + '</b><i></i><span>' + p.read + ' min read</span></div>' +
    '<h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p>' +
    (p.isCase ? '<div class="out"><b>What changed</b>' + esc(p.outcome) + '<small>Shared with the client’s consent. Names changed. Every situation is different.</small></div>' : '') +
    '<div class="meta"><span>' + p.datef + '</span></div></div></a>';
}
function videoCard(v, i) {
  const delay = i ? ' style="animation-delay:.' + (i * 8).toString().padStart(2, '0') + 's"' : '';
  return '<a class="vid rv" href="https://www.youtube.com/watch?v=' + esc(v.id) + '"' + delay + '><span class="vthumb"><img class="thumb" src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="play"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4l10 6-10 6z"/></svg></span></span><span class="vbody"><b>' + esc(shortTitle(v.title)) + '</b><span>Watch on YouTube · Short</span></span></a>';
}
function buildArticlesIndexExtras(articles, videos) {
  return {
    holes: { countLabel: articles.length + ' articles', heading: 'Latest articles' },
    transform(h) {
      h = h.replace(/<sc-for list="\{\{posts\}\}"[^>]*>[\s\S]*?<\/sc-for>/, articles.map(postCard).join('\n'));
      const vids = (videos.videos || []).slice(0, 3);
      if (vids.length) {
        h = h.replace(/(<a class="vid rv"[\s\S]*?<\/a>\s*){1,3}/, vids.map(videoCard).join('\n') + '\n');
      }
      return h;
    },
  };
}
function articleExtras(a, all) {
  const idx = all.findIndex((x) => x.slug === a.slug);
  const related = [1, 2, 3].map((k) => all[(idx + k) % all.length]).filter(Boolean);
  const url = SITE + '/articles/' + a.slug + '/';
  return {
    holes: {
      title: esc(a.title), summary: esc(a.summary), author: esc(a.author), role: esc(a.role), date: a.datef, read: String(a.read),
      topic: esc(a.topic), cover: a.cover, coverAlt: esc(a.coverAlt), authorPhoto: a.photo, bio: esc(a.bio),
      crumb: a.isCase ? 'Case studies' : 'Guides', crumbHash: a.isCase ? '#case-studies' : '#guides',
    },
    transform(h) {
      // body: replace the 15 pre-rendered sc-if blocks with this article's HTML
      let first = true;
      h = h.replace(/<sc-if value="\{\{is_[a-z0-9_]+\}\}"[^>]*>[\s\S]*?<\/sc-if>\s*/g, () => { if (first) { first = false; return '%%BODY%%\n'; } return ''; });
      h = h.replace('%%BODY%%', a.html);
      // contents list and related cards
      h = h.replace(/<sc-for list="\{\{toc\}\}"[^>]*>([\s\S]*?)<\/sc-for>/, (all, inner) => a.toc.map((t) => inner.replace(/\{\{t\.id\}\}/g, t.id).replace(/\{\{t\.label\}\}/g, esc(t.label))).join(''));
      h = h.replace(/<sc-for list="\{\{related\}\}"[^>]*>([\s\S]*?)<\/sc-for>/, (all, inner) => related.map((r) => inner
        .replace(/\{\{r\.slug\}\}/g, r.slug).replace(/\{\{r\.cover\}\}/g, r.cover).replace(/\{\{r\.topic\}\}/g, esc(r.topic))
        .replace(/\{\{r\.read\}\}/g, String(r.read)).replace(/\{\{r\.title\}\}/g, esc(r.title))).join(''));
      // conditionals
      h = h.replace(/<sc-if value="\{\{isCase\}\}"[^>]*>([\s\S]*?)<\/sc-if>/g, a.isCase ? '$1' : '');
      h = h.replace(/<sc-if value="\{\{hasPhoto\}\}"[^>]*>([\s\S]*?)<\/sc-if>/g, a.photo ? '$1' : '');
      h = h.replace(/<sc-if value="\{\{noPhoto\}\}"[^>]*>([\s\S]*?)<\/sc-if>/g, a.photo ? '' : '<div class="av"><i>' + esc(a.author.charAt(0)) + '</i></div>');
      // share links
      h = h.replace(/<div class="share"><span>Share<\/span><a href="#">WhatsApp<\/a><a href="#">LinkedIn<\/a><a href="#">Copy link<\/a><\/div>/,
        '<div class="share"><span>Share</span><a href="https://wa.me/?text=' + encodeURIComponent(a.title + ' ' + url) + '" rel="noopener" target="_blank">WhatsApp</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '" rel="noopener" target="_blank">LinkedIn</a><a href="' + url + '" data-copy>Copy link</a></div>');
      h = h.replace(/<p class="lead">\{\{summary\}\}<\/p>/, '<p class="lead" data-speakable>{{summary}}</p>');
      return h;
    },
  };
}
function articleSchema(a) {
  const url = SITE + '/articles/' + a.slug + '/';
  return [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.summary,
      image: SITE + a.cover, datePublished: a.date, dateModified: a.updated,
      author: { '@type': 'Person', name: a.author, jobTitle: a.role, worksFor: { '@id': SITE + '/#org' } },
      publisher: { '@id': SITE + '/#org' }, mainEntityOfPage: url, articleSection: a.topic,
      genre: a.isCase ? 'Case study' : 'Guide', inLanguage: 'en-IN',
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['[data-speakable]'] },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: a.isCase ? 'Case studies' : 'Guides', item: SITE + '/articles/' + (a.isCase ? '#case-studies' : '#guides') },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    },
  ];
}

/* ---------------------------------------------------------------- main */
async function main() {
  const t0 = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  mkdirp(DIST);

  const articles = loadArticles();
  const [videos, reviews] = await Promise.all([loadVideos(), loadReviews()]);
  console.log(articles.length + ' articles, ' + (videos.videos || []).length + ' videos, ' + (reviews.reviews || []).length + ' reviews');

  // static assets, admin, data snapshots used by the page
  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  copyDir(path.join(SRC, 'admin'), path.join(DIST, 'admin'));
  for (const f of ['_redirects', '_headers', 'robots.txt']) if (exists(path.join(SRC, f))) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
  write('data/youtube.json', JSON.stringify(videos, null, 2));
  write('data/google-reviews.json', JSON.stringify(reviews, null, 2));

  // pages
  const org = orgSchema();
  for (const [file, meta] of Object.entries(PAGES)) {
    const src = read(path.join(DESIGN, file));
    let extra = null;
    const m = Object.assign({ jsonld: [org] }, meta);
    if (file === 'Main.dc.html') { extra = buildHomeExtras(reviews); }
    if (file === 'Insights.dc.html') { extra = buildArticlesIndexExtras(articles, videos); m.jsonld.push({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: meta.title, url: SITE + meta.url, hasPart: articles.map((a) => ({ '@type': 'Article', headline: a.title, url: SITE + '/articles/' + a.slug + '/' })) }); }
    if (file === 'About.dc.html') { m.jsonld.push(...TEAM.map((t) => ({ '@context': 'https://schema.org', '@type': 'Person', name: t.name, jobTitle: t.role, description: t.credentials || '', image: t.photo ? SITE + t.photo : undefined, worksFor: { '@id': SITE + '/#org' } }))); }
    let html = convert(src, m, extra);
    if (file === 'Main.dc.html' || file === 'Services.dc.html') {
      const faq = faqSchema(html);
      if (faq) html = html.replace('</head>', '<script type="application/ld+json">' + JSON.stringify(faq) + '</script>\n</head>');
    }
    write(meta.out, html);
  }

  // articles
  const tpl = read(path.join(DESIGN, 'Article.dc.html'));
  for (const a of articles) {
    const meta = { out: 'articles/' + a.slug + '/index.html', url: '/articles/' + a.slug + '/', page: 'article', type: 'article',
      title: a.title + ' | ' + ORG, desc: a.summary, image: a.cover, jsonld: [org, ...articleSchema(a)] };
    write(meta.out, convert(tpl, meta, articleExtras(a, articles)));
  }

  // sitemap, llms.txt
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.values(PAGES).filter((p) => !p.noindex).map((p) => ({ loc: SITE + p.url, lastmod: today, pri: p.url === '/' ? '1.0' : '0.8' }))
    .concat(articles.map((a) => ({ loc: SITE + '/articles/' + a.slug + '/', lastmod: a.updated, pri: '0.7' })));
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + u.loc + '</loc><lastmod>' + u.lastmod + '</lastmod><priority>' + u.pri + '</priority></url>').join('\n') + '\n</urlset>\n');
  write('llms.txt', [
    '# ' + ORG,
    '',
    '> ' + LEGAL + ' is an AMFI-registered Mutual Fund Distributor (ARN 266666) and IRDAI-licensed insurance intermediary (licence A00830505) in Secunderabad, Telangana, India. Fifteen-plus years helping families plan: a written financial plan first, then the mutual funds, insurance and loans that fit it. The first 30-minute review is free.',
    '',
    '## Key pages',
    '- Home: ' + SITE + '/',
    '- Services (planning, mutual funds, insurance, loans): ' + SITE + '/services/',
    '- About the directors: ' + SITE + '/about/',
    '- Articles and client case studies: ' + SITE + '/articles/',
    '- Book a free review: ' + SITE + '/book-a-free-review/',
    '',
    '## Articles',
    ...articles.map((a) => '- [' + a.title + '](' + SITE + '/articles/' + a.slug + '/): ' + a.summary),
    '',
    '## Contact',
    '- Phone: +91 40 3517 5228 · Email: support@bhavyasampada.com',
    '- Plot No. 156, Srinivasa Nagar Colony, Near Radhika Theater, Kapra, Secunderabad 500062',
    '- YouTube: ' + YT_HANDLE,
    '',
    'Mutual fund investments are subject to market risks; read all scheme-related documents carefully. Insurance is the subject matter of solicitation. Nothing on the site is investment, tax or legal advice.',
  ].join('\n') + '\n');

  console.log('Built ' + (Object.keys(PAGES).length + articles.length) + ' pages into dist/ in ' + (Date.now() - t0) + ' ms');
}

main().catch((e) => { console.error(e); process.exit(1); });
