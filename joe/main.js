/* ==========================================================================
   COACH SEAN LEYVA — beginner-friendly pickleball coaching
   Page behaviour.
   Progressive enhancement: all content is readable with no JS and no motion.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;

  root.classList.add('js');
  if (!motion) root.classList.remove('motion');
  if (G && ST) G.registerPlugin(ST);

  /* ==========================================================================
     Confirmed details — fill these in once Sean confirms them. Anything left
     empty stays hidden; nothing here is ever shown as a placeholder.
     ========================================================================== */
  const CONTACT = {
    email: '',       // e.g. 'hello@…' — shown as a mailto link
    instagram: '',   // full profile URL
    facebook: '',    // full page / profile URL
    teachmeto: '',   // Sean's TeachMe.To profile URL — a lead source the site works alongside, not replaces
  };
  const PROOF = {
    // Real player feedback only, shared with permission. No invented names, quotes, ratings or results,
    // and nothing recreated from social media comments unless Sean supplies it with permission.
    testimonials: [], // e.g. { quote: '…', name: 'First name or initials', service: 'Private lesson' }
  };

  // small, failure-proof session memory (private windows / blocked storage just skip it)
  const mem = {
    get: (k) => { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* ---------- Media slots: fall back to the labelled placeholder ---------- */
  $$('.media img').forEach((img) => {
    const fig = img.closest('.media');
    const fail = () => { fig.classList.add('is-empty'); (img.closest('picture') || img).remove(); };
    img.addEventListener('error', fail, { once: true });
    // images that already failed before this script ran (decode() rejects for a broken image)
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) img.decode().catch(() => { if (!img.naturalWidth) fail(); });
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target, offset = -20) => {
    if (lenis) return lenis.scrollTo(target, { offset, duration: 1.2 });
    if (typeof target === 'number') return scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  const restartClass = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ---------- Header: court-line indicator, active link, progress ---------- */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const pill = $('.nav__pill');
  const movePill = (a) => {
    if (!a) { pill.style.opacity = '0'; return; }
    pill.style.width = `${a.offsetWidth - 24}px`;
    pill.style.transform = `translateX(${a.offsetLeft + 12}px)`;
    pill.style.opacity = '1';
  };
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => movePill(a));
    a.addEventListener('focus', () => movePill(a));
  });
  $('.nav__links').addEventListener('pointerleave', () => movePill(null));
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = `#${en.target.id}`;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => secIO.observe(s));

  /* ---------- Menu ---------- */
  const menu = $('#menu');
  const burger = $('.nav__menu');
  const mcta = $('.mcta');
  $$('.menu__links li').forEach((li, i) => li.style.setProperty('--i', i));
  menu.inert = true;
  const openMenu = () => {
    const br = burger.getBoundingClientRect();
    menu.style.setProperty('--mx', `${br.left + br.width / 2}px`);
    menu.style.setProperty('--my', `${br.top + br.height / 2}px`);
    menu.classList.add('is-open');
    menu.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    mcta.classList.remove('is-on');
    lenis && lenis.stop();
    setTimeout(() => $('.menu__links a').focus({ preventScroll: true }), 300);
  };
  const closeMenu = (restoreFocus) => {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    lenis && lenis.start();
    if (restoreFocus) burger.focus();
  };
  burger.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu(true) : openMenu()));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(true); });

  /* ---------- In-page links ----------
     data-pick       → opens that option in the coaching selector (private / group)
     data-type       → carries a coaching type into the booking form
     data-level      → carries an experience level into the booking form
     data-level-from → carries the beginner-path starting point into the booking form */
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && d.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    if (a.dataset.pick && setPick) setPick(a.dataset.pick, true);
    const toBook = id === '#book';
    if (toBook) prepareBooking({ type: a.dataset.type, level: a.dataset.level, fromPath: !!a.dataset.levelFrom });
    scrollToTarget(toBook ? form : target, toBook ? -110 : -20);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (toBook) setTimeout(() => focusStep(), lenis ? 1250 : 300);
  });

  /* ---------- Cursor (desktop only) ---------- */
  if (fine) {
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const label = $('.cursor__label');
    const setPos = G
      ? (() => {
          G.set(cur, { x: -100, y: -100 });
          const xTo = G.quickTo(cur, 'x', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          const yTo = G.quickTo(cur, 'y', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          return (x, y) => { xTo(x); yTo(y); };
        })()
      : (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
    addEventListener('pointermove', (e) => setPos(e.clientX, e.clientY), { passive: true });
    d.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (t.closest('input, textarea, select')) { cur.classList.add('is-hidden'); return; }
      cur.classList.remove('is-hidden');
      const interactive = t.closest('a, button, label');
      const el = t.closest('[data-cursor]');
      // a label shows over labelled areas, and over controls that carry their own label (gallery "View")
      const text = el && (!interactive || interactive === el || interactive.contains(el)) ? el.dataset.cursor : '';
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-hover', !text && !!interactive);
    });
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      const yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.15);
        yTo((e.clientY - r.top - r.height / 2) * 0.25);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Split headings into words ---------- */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span');
            const inner = d.createElement('span');
            w.className = 'w';
            inner.className = 'w__in';
            inner.style.setProperty('--wi', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };
  if (motion) $$('.split').forEach(splitWords);

  /* ==========================================================================
     HERO — COACH SEAN LEYVA wordmark → headline masks in → court lines draw →
     "Beginner-friendly" label pops in → Private / Group labels → lede + CTAs
     → Sean's photos wipe in, the chips land, the years counter runs and a
     ball drops onto the court and bounces to rest. Hovering Private / Group
     lights up the court (one side for private, the whole court for group);
     clicking opens that option in the coaching selector.
     ========================================================================== */
  const hero = $('.hero');
  const court = $('.hero__court', hero);
  $$('.hero__opt', hero).forEach((o) => {
    const on = () => { court.dataset.zone = o.dataset.pick; };
    const off = () => { court.dataset.zone = ''; };
    o.addEventListener('pointerenter', on); o.addEventListener('focus', on);
    o.addEventListener('pointerleave', off); o.addEventListener('blur', off);
  });

  // the years counter (0 → 1.5, the confirmed figure)
  const countEl = $('.hero__count span', hero);
  const runCount = () => {
    const o = { v: 0 };
    G.to(o, {
      v: 1.5, duration: 1.3, ease: 'power2.out',
      onUpdate: () => { const v = (Math.round(o.v * 10) / 10).toFixed(1); if (countEl.textContent !== v) countEl.textContent = v; },
      onComplete: () => restartClass($('.hero__chip--yrs', hero), 'is-tick'),
    });
  };
  // the ball: drops in from the left, bounces and settles on court
  const heroBall = $('.hero__ball', hero);
  const runBall = () => {
    G.set(heroBall, { opacity: 1 });
    G.fromTo(heroBall, { x: () => -Math.min(260, innerWidth * 0.25) }, { x: 0, duration: 1.5, ease: 'power1.out' });
    G.fromTo(heroBall, { y: -340 }, { y: 0, duration: 1.5, ease: 'bounce.out' });
    G.fromTo(heroBall, { rotation: -200 }, { rotation: 0, duration: 1.5, ease: 'power2.out' });
  };

  if (motion) {
    countEl.textContent = '0.0';
    const on = (cls) => () => hero.classList.add(cls);
    const show = (el) => () => el.classList.add('in');
    G.timeline({ delay: 0.15 })
      .add(on('is-wm'), 0.05)
      .to('.hero__title .line__in', { y: 0, yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, 0.3)
      .add(on('is-court'), 0.8)
      .add(on('is-tag'), 1.1)
      .add(on('is-opts'), 1.3)
      .add(show($('.hero__lede', hero)), 1.45)
      .add(show($('.hero__ctas', hero)), 1.6)
      .add(on('is-img'), 1.8)
      .add(on('is-inset'), 2.15)
      .add(on('is-chips'), 2.35)
      .add(runBall, 2.3)
      .add(runCount, 2.45)
      .add(() => $$('.hstrip', hero).forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 110)), 2.5);
  } else {
    hero.classList.add('is-wm', 'is-court', 'is-tag', 'is-opts', 'is-img', 'is-inset', 'is-chips');
  }

  /* ==========================================================================
     Scroll reveals
     ========================================================================== */
  if (motion) {
    const once = (el, fn, start = 'top 86%') => ST.create({ trigger: el, start, once: true, onEnter: fn });
    const notHero = (el) => !el.closest('.hero');
    $$('.split').forEach((el) => once(el, () => el.classList.add('in')));
    $$('.fade').filter(notHero).forEach((el) => once(el, () => el.classList.add('in')));
    $$('.seam').forEach((el) => once(el, () => el.classList.add('in'), 'top 90%'));
    $$('.bento .bx').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 0.08}s`; });
    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');
  }

  /* ==========================================================================
     Quick introduction — a split-flap board. When it comes into view each
     tile shuffles through a few characters and lands on its value, column by
     column. The final values are in the HTML, so it reads correctly without JS.
     ========================================================================== */
  const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const runFlaps = () => {
    $$('.sb__flaps').forEach((col, c) => {
      $$('span', col).forEach((tile, i) => {
        const final = tile.textContent;
        let n = 7 + i * 2;
        const tick = () => {
          tile.classList.remove('is-flip'); void tile.offsetWidth; tile.classList.add('is-flip');
          if (--n <= 0) { tile.textContent = final; return; }
          tile.textContent = FLAP[Math.floor(Math.random() * FLAP.length)];
          setTimeout(tick, 75);
        };
        setTimeout(tick, c * 220 + i * 50);
      });
    });
  };
  if (motion && $('.sb')) ST.create({ trigger: '.sb', start: 'top 72%', once: true, onEnter: runFlaps });

  /* Meet Sean — the player card tilts toward the pointer, with a soft shine */
  const ccard = $('.ccard');
  if (ccard && fine && motion) {
    G.set(ccard, { transformPerspective: 1000 });
    const rx = G.quickTo(ccard, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = G.quickTo(ccard, 'rotationY', { duration: 0.6, ease: 'power3' });
    ccard.addEventListener('pointermove', (e) => {
      const r = ccard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 14);
      rx((0.5 - py) * 12);
      ccard.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`);
      ccard.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`);
    });
    ccard.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* Why train with Sean — a spotlight follows the pointer across each tile */
  if (fine) {
    $$('.bx').forEach((el) => el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }

  /* ==========================================================================
     BEGINNER COACHING — "Where are you starting from?"
     Picking a starting point hops the ball along the court path to the
     milestone that fits, lights the milestones up to it, swaps the photo and
     copy, highlights the matching development areas and updates the CTA.
     The choice is carried into the booking form (experience + what you're
     looking for), only as a suggestion that can be changed there.
     ========================================================================== */
  const LEVELS = {
    new: {
      label: 'Brand new', at: 1, exp: 'Brand new', look: 'Learn the basics',
      title: 'Your very first step <em>is the easiest one.</em>',
      text: "Never picked up a paddle? That's a great place to start. Sean helps new players understand how the game works, learn the basics and get comfortable on the court.",
      areas: ['basics', 'game', 'comfort'],
      cta: 'Start with Coach Sean',
    },
    little: {
      label: 'Played a little', at: 2, exp: 'Beginner', look: 'Improve fundamentals',
      title: 'Turn a few games into <em>solid basics.</em>',
      text: "If you've played a little, Sean can help the basics click — building fundamental skills with personalized instruction, so the game starts to feel more natural.",
      areas: ['skills', 'personal', 'comfort'],
      cta: 'Start with Coach Sean',
    },
    confidence: {
      label: 'Building confidence', at: 3, exp: '', look: 'Build confidence',
      title: 'Feel more confident <em>every time you play.</em>',
      text: 'Want to feel more comfortable on the court? Sean works with you directly to build confidence — with personal attention and direct feedback along the way.',
      areas: ['confidence', 'skills', 'personal'],
      cta: 'Start building confidence',
    },
  };
  let chosenLevel = mem.get('sl-level');         // carried into the booking form
  const bg = $('.bg');
  const bgOpts = $$('.bg__opt', bg);
  const bgPath = $('.bg__path', bg);
  const bgMs = $$('.bg__ms', bg);
  const bgBall = $('.bg__ball', bg);
  const bgImgs = $$('.bg__img', bg);
  const bgCopy = $('.bg__copy', bg);
  const bgCta = $('.bg__cta span', bg);
  let ballAt = LEVELS.new.at, hopTl = null;

  // where milestone i's dot sits inside the path box
  const msPoint = (i) => {
    const pr = bgPath.getBoundingClientRect();
    const r = $('.bg__dot', bgMs[i]).getBoundingClientRect();
    return { x: r.left - pr.left + r.width / 2, y: r.top - pr.top + r.height / 2 };
  };
  const placeBall = (i) => { const p = msPoint(i); bgBall.style.transform = `translate(${p.x}px, ${p.y}px)`; };
  const hopBall = (to) => {
    if (hopTl) hopTl.kill();
    if (!motion || to === ballAt) { ballAt = to; placeBall(to); return; }
    const dir = to > ballAt ? 1 : -1;
    const seq = [];
    for (let k = ballAt; k !== to; k += dir) seq.push([k, k + dir]);
    hopTl = G.timeline({ onComplete: () => { ballAt = to; restartClass(bgBall, 'is-land'); } });
    seq.forEach(([a, b]) => {
      const s = { t: 0 };
      hopTl.to(s, {
        t: 1, duration: 0.42, ease: 'none',
        onUpdate: () => {
          const P = msPoint(a), Q = msPoint(b);
          const horiz = Math.abs(Q.x - P.x) > Math.abs(Q.y - P.y);
          const lift = Math.sin(Math.PI * s.t) * (horiz ? 46 : 30);
          const x = P.x + (Q.x - P.x) * s.t + (horiz ? 0 : lift);
          const y = P.y + (Q.y - P.y) * s.t - (horiz ? lift : 0);
          bgBall.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        },
      });
      hopTl.call(() => { bgMs[b].classList.add('is-hit'); setTimeout(() => bgMs[b].classList.remove('is-hit'), 400); });
    });
  };

  const setLevel = (key, user) => {
    const L = LEVELS[key];
    if (!L) return;
    if (user) { chosenLevel = key; mem.set('sl-level', key); }
    if (bg.dataset.level === key && !user) return;
    bg.dataset.level = key;
    bgOpts.forEach((b) => { const on = b.dataset.level === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    bgMs.forEach((m, i) => { m.classList.toggle('is-past', i < L.at); m.classList.toggle('is-now', i === L.at); });
    bgImgs.forEach((f) => f.classList.toggle('is-on', f.dataset.level === key));
    $('.bg__stamp b', bg).textContent = String(L.at + 1).padStart(2, '0');
    $('.bg__label', bg).textContent = L.label;
    $('.bg__t', bg).innerHTML = L.title;
    $('.bg__p', bg).textContent = L.text;
    $$('.bg__areas li', bg).forEach((li) => li.classList.toggle('is-focus', L.areas.includes(li.dataset.area)));
    bgCta.textContent = L.cta;
    if (motion) restartClass(bgCopy, 'is-swap');
    hopBall(L.at);
  };
  bgOpts.forEach((b, i) => {
    b.addEventListener('click', () => setLevel(b.dataset.level, true));
    b.addEventListener('keydown', (e) => {
      const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = bgOpts[(to + bgOpts.length) % bgOpts.length];
      n.focus();
      setLevel(n.dataset.level, true);
    });
  });
  placeBall(ballAt);
  if (chosenLevel && LEVELS[chosenLevel]) setLevel(chosenLevel, false);
  let bgRz = 0;
  addEventListener('resize', () => { clearTimeout(bgRz); bgRz = setTimeout(() => { if (!hopTl || !hopTl.isActive()) placeBall(ballAt); }, 120); });
  d.fonts && d.fonts.ready.then(() => placeBall(ballAt));

  /* ==========================================================================
     COACHING OPTIONS — Private / 1-on-1, Group, or Not sure yet.
     The switch's ball-knob slides; the chosen side of the court opens (photo
     in full colour, copy, benefits, CTA) while the other folds back, and a
     ball hops over the net to the chosen side ("not sure" parks it on the
     net and opens the help card). The choice is remembered for the booking.
     ========================================================================== */
  const TYPE = { private: 'Private / 1-on-1', group: 'Group', unsure: 'Not sure yet' };
  const PICKS = Object.keys(TYPE);
  let chosenType = TYPE[mem.get('sl-pick')] || '';  // carried into the booking form
  const opt = $('.opt');
  const optSw = $$('.opt__sw', opt);
  const optSides = $$('.opt__side, .opt__unsure', opt);
  const optBall = $('.opt__ball', opt);
  const optBallTo = (key, animate) => {
    const net = $('.opt__net', opt);
    const vertical = net.offsetWidth > net.offsetHeight;      // phones: the net runs across
    const reach = Math.min(70, (vertical ? net.offsetWidth : net.offsetHeight) * 0.2);
    const off = key === 'private' ? -1 : key === 'group' ? 1 : 0;
    const to = vertical ? { x: 0, y: off * 18 } : { x: off * reach * 0.45, y: off === 0 ? -reach * 0.6 : 0 };
    if (!motion || !animate) { if (G) G.set(optBall, to); return; }
    G.to(optBall, { x: to.x, duration: 0.7, ease: 'power1.inOut', overwrite: 'auto' });
    G.to(optBall, { keyframes: { y: [G.getProperty(optBall, 'y'), -64, to.y], easeEach: 'sine.inOut' }, duration: 0.7, overwrite: false });
    G.fromTo(optBall, { rotation: 0 }, { rotation: off >= 0 ? 360 : -360, duration: 0.7, ease: 'power1.out' });
  };
  function setPick(key, user) {
    if (!TYPE[key]) return;
    if (user) { chosenType = TYPE[key]; mem.set('sl-pick', key); }
    if (opt.dataset.pick === key) return;
    opt.dataset.pick = key;
    opt.style.setProperty('--k', PICKS.indexOf(key));
    optSw.forEach((b) => { const on = b.dataset.pick === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    optSides.forEach((s) => {
      const on = s.dataset.side === key;
      s.classList.toggle('is-on', on);
      const more = $('.opt__more', s);
      if (more) more.inert = !on;
    });
    optBallTo(key, true);
  }
  optSw.forEach((b, i) => {
    b.addEventListener('click', () => setPick(b.dataset.pick, true));
    b.addEventListener('keydown', (e) => {
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = optSw[(to + optSw.length) % optSw.length];
      n.focus();
      setPick(n.dataset.pick, true);
    });
  });
  $$('.opt__choose', opt).forEach((b) => b.addEventListener('click', () => setPick(b.dataset.pick, true)));
  // clicking a folded side's photo picks it too
  $$('.opt__side .opt__media', opt).forEach((m) => m.addEventListener('click', () => {
    const side = m.closest('.opt__side');
    if (!side.classList.contains('is-on')) setPick(side.dataset.side, true);
  }));
  $$('.opt__side .opt__more', opt).forEach((m) => { m.inert = !m.closest('.opt__side').classList.contains('is-on'); });
  if (mem.get('sl-pick')) { opt.dataset.pick = ''; setPick(mem.get('sl-pick'), false); }
  optBallTo(opt.dataset.pick, false);
  addEventListener('resize', () => optBallTo(opt.dataset.pick, false));

  /* ==========================================================================
     INTERMEDIATE — compact scroll story: as each point scrolls in it lights
     up, the dot runs down the line, the photos wipe from one to the next and
     the "Intermediate players" badge lands on the photo.
     ========================================================================== */
  const pp = $('.pp');
  if (pp) {
    const ppSteps = $$('.pp__step', pp);
    const ppImgs = $$('.pp__img', pp);
    const ppWords = $$('.pp__words span', pp);
    const ppBox = $('.pp__steps', pp);
    const ppCta = $('.pp__cta', pp);
    const IMG_AT = [0, 0, 1, 1];            // which photo shows at each point
    const WORD_AT = [0, 1, 2, 2];           // which big word is current at each point
    let ppK = null;
    // n: 0–3 = points, 4 = the CTA
    const setK = (n) => {
      if (n === ppK) return;
      ppK = n;
      const s = Math.max(0, Math.min(n, 3));
      ppSteps.forEach((el, i) => { el.classList.toggle('is-on', i <= n); el.classList.toggle('is-now', i === s && n < 4); });
      ppImgs.forEach((im, i) => im.classList.toggle('is-on', i <= IMG_AT[s]));
      ppWords.forEach((w, i) => { w.classList.toggle('in', i <= WORD_AT[s]); w.classList.toggle('is-now', i === WORD_AT[s]); });
      pp.classList.toggle('is-badge', n >= 1);
      ppCta.classList.toggle('in', n >= 4);
    };
    if (motion) {
      setK(0);
      ppSteps.forEach((el, i) => ST.create({ trigger: el, start: 'top 78%', onEnter: () => setK(i), onLeaveBack: () => setK(Math.max(0, i - 1)) }));
      ST.create({ trigger: ppCta, start: 'top 92%', onEnter: () => setK(4), onLeaveBack: () => setK(3) });
      ST.create({ trigger: ppBox, start: 'top 75%', end: 'bottom 70%', scrub: true, onUpdate: (self) => ppBox.style.setProperty('--p', self.progress.toFixed(4)) });
    } else {
      setK(4);
    }
  }

  /* ==========================================================================
     BOOKING — a guided lesson request, not a booking.
     1 coaching type → 2 experience level → 3 what you're looking for →
     4 preferred days / times → 5 contact details, then a confirmation.
     A ball rolls along the court-line track to the current step; the ticket
     beside the form summarises each answer (reached steps can be clicked to
     jump back). Choices made above (coaching type, starting point,
     intermediate) are pre-filled. Posts to Netlify Forms.
     Without JS every step shows and the form posts normally.
     ========================================================================== */
  const form = $('#bookForm');
  const steps = $$('.bk__step', form);
  const done = $('.bk__done', form);
  const live = $('#bkLive');
  const back = $('.bk__back', form);
  const next = $('.bk__next', form);
  const send = $('.bk__send', form);
  const status = $('#bkStatus');
  const track = $('.bk__track', form);
  const stops = $$('.bk__stops li', form);
  const bkBall = $('.bk__ball', form);
  const carry = $('.bk__carry', form);
  const ticket = $('.bk__ticket');
  const jumps = $$('.bk__jump', ticket);
  const phone = $('#bk-phone');
  const N = steps.length;
  const TITLES = steps.map((s) => $('.bk__h', s).lastChild.textContent.trim());
  let cur = 1, reached = 1, sent = false;

  const setProgress = (n) => {               // n: 1–5, or N + 1 once sent
    stops.forEach((li, i) => {
      li.classList.toggle('is-done', i + 1 < n || (i + 1 <= reached && i + 1 !== n && n <= N && validStep(i + 1)));
      li.classList.toggle('is-now', i + 1 === n);
    });
    const p = n > N ? 1 : (n - 1) / (N - 1);
    if (track.style.getPropertyValue('--bp') !== p.toFixed(4)) {
      track.style.setProperty('--bp', p.toFixed(4));
      if (motion) restartClass(bkBall, 'is-roll');
    }
    jumps.forEach((b) => { const k = +b.dataset.step; b.disabled = sent || k > reached; b.classList.toggle('is-now', k === n); });
  };
  const goStep = (n, focus) => {
    const isBack = n < cur;
    cur = n;
    reached = Math.max(reached, n);
    steps.forEach((s) => { const on = +s.dataset.step === n; s.classList.toggle('is-current', on); s.classList.toggle('is-back', on && isBack); });
    setProgress(n);
    const first = n === 1;
    back.setAttribute('aria-hidden', String(first));
    back.tabIndex = first ? -1 : 0;
    next.hidden = n === N;
    send.hidden = n !== N;
    live.textContent = `Step ${n} of ${N}: ${TITLES[n - 1]}`;
    if (focus) {
      focusStep();
      if (form.getBoundingClientRect().top < 0) scrollToTarget(form, -110);
    }
  };
  function focusStep() {
    if (sent) return;
    const el = $('input:checked', steps[cur - 1]) || $('input:not([type="hidden"]), textarea', steps[cur - 1]);
    if (el) el.focus({ preventScroll: true });
  }

  // validation
  const MSG = { name: 'Please enter your name.', email: 'Please enter a valid email address.', phone: 'Please enter a phone number so Sean can reach you.' };
  const phoneOk = () => phone.value.replace(/\D/g, '').length >= 7;
  const validate = (el) => {
    const err = d.getElementById(`${el.id}-err`);
    const ok = el === phone ? phoneOk() : el.checkValidity();
    el.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.textContent = ok ? '' : MSG[el.name] || 'Please check this field.';
      if (!ok) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    }
    return ok;
  };
  const checkGroup = (g, quiet) => {
    const ok = $$('input', g).some((i) => i.checked);
    if (quiet) return ok;
    $('.bk__err', g).textContent = ok ? '' : g.dataset.groupReq;
    g.classList.toggle('is-invalid', !ok);
    if (!ok && motion) restartClass(g, 'is-shake');
    return ok;
  };
  const fieldsIn = (step) => $$('input[required]:not([type="radio"])', step);
  // returns the first problem field in step n, or null
  const checkStep = (n) => {
    const step = steps[n - 1];
    let bad = null;
    $$('[data-group-req]', step).forEach((g) => { if (!checkGroup(g) && !bad) bad = $('input', g); });
    fieldsIn(step).forEach((el) => { if (!validate(el) && !bad) bad = el; });
    return bad;
  };
  // the same check without touching the UI
  function validStep(n) {
    const step = steps[n - 1];
    return $$('[data-group-req]', step).every((g) => checkGroup(g, true))
      && fieldsIn(step).every((el) => (el === phone ? phoneOk() : el.checkValidity()));
  }
  fieldsIn(form).forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
  });
  $$('[data-group-req]', form).forEach((g) => g.addEventListener('change', () => { if (g.classList.contains('is-invalid')) checkGroup(g); }));

  next.addEventListener('click', () => {
    const bad = checkStep(cur);
    if (bad) { bad.focus(); return; }
    goStep(cur + 1, true);
  });
  back.addEventListener('click', () => { if (cur > 1) goStep(cur - 1, true); });
  // the ticket: jump back to any step already reached (forward only through valid steps)
  jumps.forEach((b) => b.addEventListener('click', () => {
    const n = +b.dataset.step;
    if (sent || n === cur || n > reached) return;
    if (n > cur) { for (let k = cur; k < n; k++) { const bad = checkStep(k); if (bad) { goStep(k, false); bad.focus(); return; } } }
    goStep(n, true);
  }));
  // Enter in a text field moves on instead of submitting early
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input') && cur < N && !sent) { e.preventDefault(); next.click(); }
  });
  // tapping a tile in steps 1–2 moves straight on (a short pause shows the selection);
  // keyboard users arrowing through the options (click events with detail 0) stay put
  $$('input[name="coaching-type"], input[name="experience"]', form).forEach((r) => r.addEventListener('click', (e) => {
    if (r.name === 'coaching-type') carry.hidden = true;
    const n = +r.closest('.bk__step').dataset.step;
    if (cur === n && e.detail > 0) setTimeout(() => { if (cur === n && r.checked) goStep(n + 1, true); }, motion ? 450 : 0);
  }));

  // the ticket summary
  const sums = Object.fromEntries(jumps.map((el) => [el.dataset.sum, el]));
  const EMPTY = { 'coaching-type': 'Not chosen yet', experience: '—', 'looking-for': '—', timing: '—', contact: '—' };
  const updateSummary = () => {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim().split(/\s+/)[0];
    const days = data.getAll('preferred-days').map((v) => (v === 'Flexible' ? 'Flexible days' : v.slice(0, 3)));
    const times = data.getAll('preferred-times').map((v) => (v === 'Flexible' ? 'flexible times' : v.toLowerCase()));
    const vals = {
      'coaching-type': String(data.get('coaching-type') || ''),
      experience: String(data.get('experience') || ''),
      'looking-for': data.getAll('looking-for').join(', '),
      timing: [days.join(', '), times.join(', ')].filter(Boolean).join(' · '),
      contact: [name, String(data.get('email') || '').trim()].filter(Boolean).join(' · '),
    };
    Object.entries(sums).forEach(([k, el]) => {
      const text = vals[k] || EMPTY[k];
      if (el.textContent === text) return;
      el.textContent = text;
      el.classList.toggle('is-set', !!vals[k]);
      if (vals[k]) restartClass(el, 'is-new');
    });
    if (!sent) setProgress(cur);
  };
  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);

  // carrying choices in from elsewhere on the page — suggestions only, never overriding an answer already given
  const flash = (el) => { el.classList.remove('is-flash'); setTimeout(() => el.classList.add('is-flash'), lenis ? 900 : 200); };
  const tick = (name, value, force) => {
    if (!value) return false;
    const inputs = $$(`input[name="${name}"]`, form);
    const r = inputs.find((x) => x.value === value);
    if (!r || r.checked) return false;
    if (!force && inputs.some((x) => x.checked)) return false;
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
    flash(r.closest('label'));
    return true;
  };
  function prepareBooking({ type, level, fromPath } = {}) {
    if (sent) resetBooking();
    if (tick('coaching-type', type || chosenType, !!type)) {
      carry.hidden = false;
      if (type) chosenType = type;
    }
    const L = (fromPath || !level) && LEVELS[chosenLevel || (fromPath ? bg.dataset.level : '')];
    tick('experience', level || (L && L.exp), !!level);
    if (L) tick('looking-for', L.look, false);
    if (level === 'Intermediate') tick('looking-for', 'Continue developing', false);
    updateSummary();
    if (cur !== 1) goStep(1, false);
  }
  // the beginner-path CTA carries whichever starting point is showing
  $('.bg__cta', bg).addEventListener('click', () => { if (!chosenLevel) chosenLevel = bg.dataset.level; }, true);

  const resetBooking = () => {
    form.reset();
    sent = false;
    reached = 1;
    form.classList.remove('is-sent');
    ticket.classList.remove('is-sent');
    done.classList.remove('is-current');
    carry.hidden = true;
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    $$('.bk__err, .bk__ferr', form).forEach((el) => { el.textContent = ''; });
    status.textContent = '';
    goStep(1, false);
    updateSummary();
  };
  $('.bk__again', form).addEventListener('click', () => { resetBooking(); goStep(1, true); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.classList.remove('is-error');
    for (let n = 1; n <= N; n++) {
      const bad = checkStep(n);
      if (bad) {
        goStep(n, false);
        bad.focus();
        status.textContent = 'Please fix the highlighted step.';
        status.classList.add('is-error');
        return;
      }
    }
    const data = new FormData(form);
    const first = String(data.get('name') || '').trim().split(/\s+/)[0];
    // On Netlify the form posts to Netlify Forms; opened locally, nothing is sent
    const preview = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
    send.disabled = true;
    try {
      if (!preview) {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString(),
        });
        if (!res.ok) throw new Error(res.statusText);
      }
      sent = true;
      status.textContent = '';
      form.classList.add('is-sent');
      ticket.classList.add('is-sent');
      steps.forEach((s) => s.classList.remove('is-current'));
      $('.bk__done-name', done).textContent = first ? `, ${first}` : '';
      $('.bk__done-p', done).textContent = preview
        ? 'Preview mode — nothing was sent. The form sends for real once the site is live on Netlify.'
        : "Sean will look over your request and get back to you about times and details. Nothing is booked or charged until you've both agreed.";
      done.classList.add('is-current');
      done.focus({ preventScroll: true });
      setProgress(N + 1);
      stops.forEach((li) => { li.classList.add('is-done'); li.classList.remove('is-now'); });
      if (form.getBoundingClientRect().top < 0) scrollToTarget(form, -110);
    } catch (err) {
      status.textContent = 'Something went wrong sending your request. Please try again in a moment.';
      status.classList.add('is-error');
    }
    send.disabled = false;
  });
  goStep(1, false);
  updateSummary();

  /* ==========================================================================
     Gallery: expanding panels. Hover or focus opens a panel; clicking an
     open panel shows the larger view (on touch screens the first tap opens
     it). Player feedback renders from PROOF once real feedback exists.
     ========================================================================== */
  const panels = $$('.panel');
  const wide = matchMedia('(min-width: 701px)');
  const openPanel = (p) => panels.forEach((x) => x.classList.toggle('is-active', x === p));
  panels.forEach((p) => {
    const btn = $('.panel__btn', p);
    if (fine) p.addEventListener('pointerenter', () => openPanel(p));
    btn.addEventListener('focus', () => openPanel(p));
  });
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const lbImg = $('img', lb);
    const lbCap = $('.lightbox__cap', lb);
    let opener = null;
    $$('.panel__btn').forEach((btn) => btn.addEventListener('click', () => {
      const p = btn.closest('.panel');
      if (!fine && wide.matches && !p.classList.contains('is-active')) { openPanel(p); return; }
      const img = $('img', btn);
      if (!img) return;              // no photo yet — nothing larger to show
      opener = btn;
      lbImg.src = btn.dataset.full;
      lbImg.alt = img.alt;
      lbCap.replaceChildren(Object.assign(d.createElement('b'), { textContent: btn.dataset.title }), btn.dataset.desc);
      lb.showModal();
      lenis && lenis.stop();
    }));
    $('.lightbox__close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => { lenis && lenis.start(); opener && opener.focus({ preventScroll: true }); });
  }

  const voices = $('.voices');
  if (voices && PROOF.testimonials.length) {
    const list = $('.voices__list', voices);
    PROOF.testimonials.forEach(({ quote, name, service }) => {
      const li = d.createElement('li');
      li.className = 'voice';
      const q = Object.assign(d.createElement('blockquote'), { textContent: quote });
      const f = d.createElement('footer');
      f.append(name || '');
      if (service) f.append(Object.assign(d.createElement('span'), { textContent: service }));
      li.append(q, f);
      list.append(li);
    });
    voices.hidden = false;
    const fl = $('.nav__links a[href="#feedback"]');
    if (fl) fl.hidden = false;
  }

  /* ==========================================================================
     Footer
     ========================================================================== */
  // confirmed contact / social links (nothing renders until CONTACT is filled in)
  const socials = $('.fsocials');
  if (socials) {
    const ICON = {
      email: '<path d="M4 6.5h16v11H4z"/><path d="M4 7l8 6 8-6"/>',
      instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.6 7.4h.01"/>',
      facebook: '<path d="M14.5 8H17V4.5h-2.5A3.5 3.5 0 0 0 11 8v2.5H8.5V14H11v6h3.5v-6H17l.5-3.5h-3V8z"/>',
      teachmeto: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.6 2.6L16.2 9.4"/>',
    };
    const LABEL = { email: ['Email', 'Write to Sean'], instagram: ['Instagram', 'Follow Sean'], facebook: ['Facebook', 'Follow Sean'], teachmeto: ['TeachMe.To', 'Sean’s profile'] };
    Object.entries(CONTACT).forEach(([k, v]) => {
      if (!v) return;
      const a = Object.assign(d.createElement('a'), { className: 'fsocial', href: k === 'email' ? `mailto:${v}` : v });
      if (k !== 'email') { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg><span></span><b aria-hidden="true">↗</b>`;
      $('span', a).append(LABEL[k][0], Object.assign(d.createElement('small'), { textContent: LABEL[k][1] }));
      socials.append(a);
    });
    socials.hidden = !socials.children.length;
  }

  // a ball hops along the giant SEAN — each letter lights up as it lands — then works its way back,
  // on a loop. It only runs while the word is on screen.
  const fword = $('.fword');
  if (fword && motion) {
    const letters = $$('span', fword);
    const fball = $('.fword__ball', fword);
    let ftl = null, fVisible = false;
    const land = (el) => {
      letters.forEach((l) => l.classList.toggle('is-lit', l === el));
      setTimeout(() => el.classList.remove('is-lit'), 420);
      G.fromTo(fball, { scaleX: 1.32, scaleY: 0.7 }, { scaleX: 1, scaleY: 1, duration: 0.42, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
    };
    const buildHop = () => {
      const prog = ftl ? ftl.progress() : 0;
      if (ftl) ftl.kill();
      const box = fword.getBoundingClientRect();
      const br = fball.offsetWidth / 2;
      const pts = letters.map((l) => { const r = l.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height * 0.04 - br, el: l }; });
      const seq = [...letters.keys(), ...[...letters.keys()].slice(1, -1).reverse()];
      const tl = G.timeline({ repeat: -1, paused: true });
      const put = (x, y) => G.set(fball, { x: x - br, y: y - br });
      seq.forEach((i, k) => {
        const P = pts[i], Q = pts[seq[(k + 1) % seq.length]];
        const c = { x: (P.x + Q.x) / 2, y: Math.min(P.y, Q.y) - Math.min(110, Math.max(50, Math.abs(Q.x - P.x) * 0.5)) * 2 };
        const s = { t: 0 };
        tl.fromTo(s, { t: 0 }, {
          t: 1, duration: 0.6, ease: 'none', immediateRender: false,
          onUpdate: () => { const t = s.t, u = 1 - t; put(u * u * P.x + 2 * u * t * c.x + t * t * Q.x, u * u * P.y + 2 * u * t * c.y + t * t * Q.y); },
        });
        tl.call(land, [Q.el]);
      });
      put(pts[0].x, pts[0].y);
      G.set(fball, { opacity: 1 });
      ftl = tl;
      tl.progress(prog);
      if (fVisible) tl.play();
    };
    new IntersectionObserver(([en]) => { fVisible = en.isIntersecting; if (ftl) (fVisible ? ftl.play() : ftl.pause()); }).observe(fword);
    let fz = 0;
    addEventListener('resize', () => { clearTimeout(fz); fz = setTimeout(buildHop, 200); });
    d.fonts && d.fonts.ready.then(buildHop);
    buildHop();
  }

  // Ticker loops seamlessly
  const tickerTrack = $('.nav__ticker-track');
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

  // Rolling text on hover
  $$('.nav__links a, .flink').forEach((a) => {
    const t = a.textContent.trim();
    const roll = d.createElement('span');
    const inner = d.createElement('span');
    roll.className = 'roll';
    roll.dataset.text = t;
    inner.textContent = t;
    roll.appendChild(inner);
    a.replaceChildren(roll);
  });

  // Back to top
  const topBtn = $('.ftop');
  if (topBtn) topBtn.addEventListener('click', () => { scrollToTarget($('#top')); $('.logo').focus({ preventScroll: true }); });

  if (motion) {
    ST.sort();
    d.fonts && d.fonts.ready.then(() => { ST.sort(); ST.refresh(); });
    addEventListener('load', () => { ST.refresh(); setTimeout(() => ST.refresh(), 900); placeBall(ballAt); }, { once: true });
  }

  /* ==========================================================================
     Mobile sticky CTA — "Explore coaching" until the coaching options have
     been on screen, then "Book a lesson". Hidden over the hero, the booking
     form and the footer.
     ========================================================================== */
  const mctaT = $('.mcta__t', mcta);
  const seen = { coaching: false };
  const hideOver = new Set();
  const updateMcta = () => {
    const show = !hideOver.size && scrollY > innerHeight * 0.6 && !menu.classList.contains('is-open');
    mcta.classList.toggle('is-on', show);
    mcta.inert = !show;
  };
  const mctaIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const id = en.target.id;
      if (id === 'coaching' && en.isIntersecting && !seen.coaching) {
        seen.coaching = true;
        mcta.setAttribute('href', '#book');
        mctaT.textContent = 'Book a lesson';
        restartClass(mcta, 'is-swap');
      }
      if (id !== 'coaching') { if (en.isIntersecting) hideOver.add(id); else hideOver.delete(id); }
    });
    updateMcta();
  }, { threshold: 0.12 });
  ['top', 'coaching', 'book', 'final'].forEach((id) => mctaIO.observe(d.getElementById(id)));

  /* ==========================================================================
     Header state
     ========================================================================== */
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    nav.style.setProperty('--prog', (max > 0 ? y / max : 0).toFixed(4));
    nav.classList.toggle('is-solid', y > 30);
    if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.8);
    updateMcta();
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();
