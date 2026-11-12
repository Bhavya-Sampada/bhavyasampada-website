/* Bhavya Sampada — site behaviour. No dependencies. */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduce;
  var site = d.querySelector('.site');
  var page = d.body.getAttribute('data-page') || '';

  /* Reveal: the stylesheet animates .rv elements once .ready is on the page wrapper. */
  if (site && motion) {
    var armReveal = function () {
      if (!('IntersectionObserver' in w)) { site.classList.add('ready'); return; }
      site.classList.add('ready');
      var els = [].slice.call(d.querySelectorAll('.rv'));
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      els.forEach(function (e) { io.observe(e); });
      setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 1800);
    };
    if (d.readyState === 'complete' || d.readyState === 'interactive') armReveal(); else d.addEventListener('DOMContentLoaded', armReveal);
  }
  /* Safety net: whatever happens to the animations, everything is visible after 2.5s. */
  if (site) setTimeout(function () { site.classList.add('settled'); }, 2500);

  /* Sticky header state */
  var nav = d.querySelector('header.nav');
  var threshold = page === 'home' ? 24 : 8;
  var onScroll = function () {
    var y = w.scrollY || d.documentElement.scrollTop || 0;
    if (nav) nav.classList.toggle('on', y > threshold);
    var bar = d.querySelector('.prog i');
    if (bar) {
      var h = Math.max(1, d.documentElement.scrollHeight - w.innerHeight);
      bar.style.setProperty('--p', (Math.min(1, y / h)).toFixed(3));
    }
  };
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var menu = d.getElementById('mmenu');
  var setMenu = function (open) {
    if (!menu) return;
    menu.hidden = !open;
    d.querySelectorAll('[data-menu-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  };
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-menu-toggle]');
    if (t) { setMenu(menu && menu.hidden); return; }
    if (e.target.closest('[data-menu-close]') || (menu && !menu.hidden && e.target.closest('#mmenu a'))) setMenu(false);
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* FAQ accordion */
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-faq]');
    if (!b) return;
    var qa = b.closest('.qa');
    if (!qa) return;
    var open = !qa.classList.contains('open');
    qa.parentNode.querySelectorAll('.qa').forEach(function (q) {
      q.classList.remove('open');
      var bb = q.querySelector('[data-faq]');
      if (bb) bb.setAttribute('aria-expanded', 'false');
    });
    if (open) { qa.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
  });

  /* EMI example on Services */
  var amt = d.getElementById('amt');
  if (amt) {
    var fmt = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
    var upd = function () {
      var lakhs = Number(amt.value) || 40;
      var P = lakhs * 100000, r = 0.09 / 12, n = 240;
      var emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      amt.setAttribute('aria-valuetext', '₹' + lakhs + ' lakh');
      d.querySelectorAll('[data-amt-label]').forEach(function (el) { el.textContent = '₹' + lakhs + ' lakh'; });
      d.querySelectorAll('[data-emi]').forEach(function (el) { el.textContent = fmt(emi); });
    };
    amt.addEventListener('input', upd);
    amt.addEventListener('change', upd);
    upd();
  }

  /* Articles index: type and topic filters */
  if (page === 'articles') {
    var state = { type: 'all', filter: 'all' };
    var map = { inv: 'Investing', tax: 'Tax', ret: 'Retirement', ins: 'Insurance', loan: 'Loans' };
    var heading = d.querySelector('.sec-head .h2');
    var count = d.querySelector('.sec-head .meta b');
    var apply = function () {
      var posts = [].slice.call(d.querySelectorAll('a.post[data-kind]'));
      var n = 0;
      posts.forEach(function (p) {
        var ok = (state.type === 'all' || p.getAttribute('data-kind') === state.type) &&
          (state.filter === 'all' || state.filter === 'vid' || p.getAttribute('data-cat') === map[state.filter]);
        p.hidden = !ok;
        if (ok) { n++; p.classList.add('in'); }
      });
      d.querySelectorAll('[data-type]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-type') === state.type); });
      d.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-filter') === state.filter); });
      if (heading) heading.textContent = state.type === 'edu' ? 'Guides' : (state.type === 'case' ? 'Client case studies' : 'Latest articles');
      var word = state.type === 'edu' ? 'guides' : (state.type === 'case' ? 'client case studies' : 'articles');
      if (count) count.textContent = n + ' ' + word + (state.filter === 'all' ? '' : (state.filter === 'vid' ? ' · videos' : ' · ' + map[state.filter]));
    };
    var fromHash = function () {
      var hs = location.hash;
      state.type = hs === '#case-studies' ? 'case' : (hs === '#guides' ? 'edu' : state.type);
      apply();
    };
    d.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-type]');
      if (tb) { state.type = tb.getAttribute('data-type'); apply(); return; }
      var fb = e.target.closest('[data-filter]');
      if (fb) {
        state.filter = fb.getAttribute('data-filter');
        apply();
        if (state.filter === 'vid') { var v = d.getElementById('videos'); if (v) v.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' }); }
      }
    });
    w.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* Copy link on articles */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('[data-copy]');
    if (!a) return;
    e.preventDefault();
    var url = a.getAttribute('href') || location.href;
    var done = function () { var t = a.textContent; a.textContent = 'Copied'; setTimeout(function () { a.textContent = t; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
  });

  /* Forms: keep the button honest while Netlify processes the POST */
  d.querySelectorAll('form[data-netlify]').forEach(function (f) {
    f.addEventListener('submit', function () {
      var b = f.querySelector('button[type="submit"]');
      if (b) { b.disabled = true; b.setAttribute('aria-busy', 'true'); }
    });
  });

  /* Analytics consent banner (only when the build set window.GA_ID). Analytics stays off until accepted. */
  if (w.GA_ID) {
    var KEY = 'bs-consent';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var grant = function () { if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' }); };
    if (saved === 'yes') grant();
    else if (saved !== 'no') {
      var bar = d.createElement('div');
      bar.className = 'consent';
      bar.setAttribute('role', 'dialog');
      bar.setAttribute('aria-label', 'Cookie notice');
      bar.innerHTML = '<p>We use one analytics cookie to see which pages help visitors. No ads, no selling of data. <a href="/privacy-policy/">Privacy policy</a></p><div><button type="button" class="btn btn-primary" data-consent="yes">Accept</button><button type="button" class="btn btn-secondary" data-consent="no">Decline</button></div>';
      var style = d.createElement('style');
      style.textContent = '.consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:720px;margin:0 auto;background:#131110;color:#F5F2EC;border:1px solid #FFFFFF22;border-radius:16px;padding:16px 18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;box-shadow:0 24px 60px rgba(0,0,0,.35);font:400 14px/22px Poppins,system-ui,sans-serif}.consent p{margin:0;flex:1 1 320px}.consent a{color:#E6C86B;text-decoration:underline}.consent div{display:flex;gap:8px}.consent .btn{height:38px;padding:0 14px;font-size:13px}.consent .btn-secondary{background:transparent;color:#F5F2EC;border:1px solid #FFFFFF44}';
      d.head.appendChild(style);
      d.body.appendChild(bar);
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-consent]');
        if (!b) return;
        var v = b.getAttribute('data-consent');
        try { localStorage.setItem(KEY, v); } catch (err) {}
        if (v === 'yes') grant();
        bar.remove();
      });
    }
  }

  /* Lead event: a visit to the thank-you page means a form was submitted. */
  if (page === 'thanks' && typeof gtag === 'function') {
    gtag('event', 'generate_lead', { form: /newsletter/.test(location.search) ? 'newsletter' : 'book-review' });
  }

  /* ---- Canvas backgrounds ---- */
  var dpr = Math.min(2, w.devicePixelRatio || 1);
  var WAVES = {
    hero: { rows: 26, horizon: 0.4, pow: 1.6, drop: 0.62, amp: 0.075, a0: 0.1, a1: 0.55, fadeAt: 0.68, fadeLen: 0.27, rgb: '228,196,98', radMul: 1.7, parent: true },
    sand: { rows: 18, horizon: 0.25, pow: 1.5, drop: 0.85, amp: 0.09, a0: 0.08, a1: 0.42, fadeAt: 0.78, fadeLen: 0.22, rgb: '176,143,36', radMul: 1.6, parent: true },
    page: { rows: 18, horizon: 0.2, pow: 1.5, drop: 0.8, amp: 0.08, a0: 0.07, a1: 0.38, fadeAt: 0.6, fadeLen: 0.4, rgb: '176,143,36', radMul: 1.6, parent: false }
  };
  var variant = page === 'home' ? 'hero' : (page === 'services' || page === 'about' || page === 'articles') ? 'sand' : 'page';
  function wave(c, o) {
    if (!c || !c.getContext) return;
    var ctx = c.getContext('2d');
    var size = function () {
      var r = (o.parent ? c.parentElement : c).getBoundingClientRect();
      c.width = Math.max(1, Math.floor(r.width * dpr));
      c.height = Math.max(1, Math.floor(r.height * dpr));
    };
    size();
    w.addEventListener('resize', size);
    var COLS = 72, ROWS = o.rows;
    var draw = function (t) {
      var W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      var horizon = H * o.horizon;
      for (var r = 0; r < ROWS; r++) {
        var z = r / (ROWS - 1), depth = 1 - z;
        var baseY = horizon + Math.pow(depth, o.pow) * H * o.drop;
        var amp = H * o.amp * (0.35 + depth);
        var spread = W * (0.42 + depth * 0.5);
        var rad = (0.9 + depth * o.radMul) * dpr;
        for (var i = 0; i < COLS; i++) {
          var x = (i / (COLS - 1)) * 2 - 1;
          var wv = Math.sin(x * 3.1 + t * 0.00055 + z * 4.2) * 0.55 + Math.sin(x * 1.4 - t * 0.00038 + z * 2.1) * 0.45;
          var sx = W / 2 + x * spread, sy = baseY + wv * amp;
          var a = o.a0 + depth * o.a1;
          var fade = 1 - Math.max(0, (sy - H * o.fadeAt) / (H * o.fadeLen));
          a *= Math.max(0, Math.min(1, fade));
          if (a <= 0.01) continue;
          ctx.fillStyle = 'rgba(' + o.rgb + ',' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 6.2832); ctx.fill();
        }
      }
    };
    if (!motion || (page === 'home' && w.innerWidth < 768)) { draw(0); return; }
    var visible = true;
    if ('IntersectionObserver' in w) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(c);
    var loop = function (t) { requestAnimationFrame(loop); if (!visible || d.hidden) return; draw(t); };
    requestAnimationFrame(loop);
  }
  var start = function () {
    var c = d.getElementById('wave');
    if (c) wave(c, WAVES[variant]);
    if (page === 'home') chart();
    if (page === 'thanks') burst();
  };
  if ('requestIdleCallback' in w) w.requestIdleCallback(start, { timeout: 1200 }); else setTimeout(start, 200);

  /* Home hero chart: two lines draw over 20 years, loop, pause on hover. */
  function chart() {
    var svg = d.getElementById('traj'), box = d.getElementById('chartbox');
    if (!svg || !box) return;
    var p1 = svg.querySelector('.p1'), p2 = svg.querySelector('.p2'), m1 = svg.querySelector('.m1'), m2 = svg.querySelector('.m2');
    var yearEl = d.querySelector('[data-year]');
    if (!p1 || !p2 || !p1.getTotalLength) return;
    var L1 = p1.getTotalLength(), L2 = p2.getTotalLength();
    p1.style.strokeDasharray = L1; p2.style.strokeDasharray = L2;
    var year = -1;
    var set = function (p) {
      p1.style.strokeDashoffset = L1 * (1 - p); p2.style.strokeDashoffset = L2 * (1 - p);
      var a = p1.getPointAtLength(L1 * p), b = p2.getPointAtLength(L2 * p);
      m1.setAttribute('cx', a.x.toFixed(1)); m1.setAttribute('cy', a.y.toFixed(1));
      m2.setAttribute('cx', b.x.toFixed(1)); m2.setAttribute('cy', b.y.toFixed(1));
      box.style.setProperty('--p', p.toFixed(3));
      var yr = Math.round(p * 20);
      if (yr !== year) { year = yr; if (yearEl) yearEl.textContent = yr; }
    };
    if (!motion) { set(1); return; }
    set(0);
    var DUR = 7200, HOLD = 2800, RESET = 420, s0 = null, last = null;
    var step = function (t) {
      requestAnimationFrame(step);
      if (s0 === null) { s0 = t; last = t; }
      var dt = t - last; last = t;
      if (box.matches(':hover') && year < 20) { s0 += dt; return; }
      var e = t - s0;
      if (e < DUR) { var p = e / DUR; var ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; box.classList.remove('reset'); set(ease); }
      else if (e < DUR + HOLD) set(1);
      else if (e < DUR + HOLD + RESET) box.classList.add('reset');
      else { set(0); s0 = t; }
    };
    requestAnimationFrame(step);
  }

  /* Thank-you page: one-off confetti from the tick. */
  function burst() {
    var c = d.getElementById('burst');
    if (!motion || !c || !c.getContext) return;
    var ctx = c.getContext('2d');
    var r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.floor(r.width * dpr)); c.height = Math.max(1, Math.floor(r.height * dpr));
    var tick = c.parentNode.querySelector('.tick');
    var tr = tick ? tick.getBoundingClientRect() : null;
    var ox = tr ? (tr.left - r.left + tr.width / 2) * dpr : c.width / 2;
    var oy = tr ? (tr.top - r.top + tr.height / 2) * dpr : c.height * 0.3;
    var cols = ['#D4AF37', '#E6CF7A', '#B08F24', '#F3EAD0', '#FFFFFF'];
    var P = [];
    for (var i = 0; i < 90; i++) {
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = (4 + Math.random() * 9) * dpr;
      P.push({ x: ox, y: oy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, w: (3 + Math.random() * 5) * dpr, h: (2 + Math.random() * 3) * dpr, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, col: cols[i % cols.length], life: 1 });
    }
    var s0 = null;
    var step = function (t) {
      if (!s0) s0 = t;
      var el = (t - s0) / 1000;
      ctx.clearRect(0, 0, c.width, c.height);
      var alive = 0;
      P.forEach(function (p) {
        p.vy += 0.22 * dpr; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        p.life = Math.max(0, 1 - Math.max(0, el - 1.2) / 1.4);
        if (p.life <= 0) return;
        alive++;
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (alive && el < 3) requestAnimationFrame(step); else ctx.clearRect(0, 0, c.width, c.height);
    };
    setTimeout(function () { requestAnimationFrame(step); }, 350);
  }
})();
