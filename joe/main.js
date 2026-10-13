/* ==========================================================================
   JOE BORZELLO — PPR Certified Pickleball Pro · private + small-group lessons
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
     data-pick → opens that option in the lesson selector (private / group)
     data-type → carries a lesson type into the inquiry form */
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && d.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    if (a.dataset.pick) setPick(a.dataset.pick, true);
    const toForm = id === '#inquire';
    if (toForm) prepareInquiry(a.dataset.type);
    scrollToTarget(toForm ? form : target, toForm ? -110 : -20);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (toForm) setTimeout(() => focusStep(), lenis ? 1250 : 300);
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
      // a label shows over labelled areas, and over controls that carry their own label
      const text = el && (!interactive || interactive === el || interactive.contains(el)) ? el.dataset.cursor : '';
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-hover', !text && !!interactive);
    });
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  // buttons: a small magnetic pull
  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      const yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.1);
        yTo((e.clientY - r.top - r.height / 2) * 0.18);
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
     HERO — JOE BORZELLO wordmark → headline masks in → court lines draw →
     the PPR credential pill → Private / Small group → lede + CTAs → the image
     wipes in, the chips land and the years counter runs → the shot path
     draws and a ball marker travels along it once, then rests.
     Hovering Private / Small group lights up the court; clicking opens that
     option in the lesson selector.
     ========================================================================== */
  const hero = $('.hero');
  const court = $('.hero__court', hero);
  $$('.hero__opt', hero).forEach((o) => {
    const on = () => { court.dataset.zone = o.dataset.pick; };
    const off = () => { court.dataset.zone = ''; };
    o.addEventListener('pointerenter', on); o.addEventListener('focus', on);
    o.addEventListener('pointerleave', off); o.addEventListener('blur', off);
  });

  // the years counter (0 → 17, the confirmed figure)
  const countEl = $('.hero__count span', hero);
  const runCount = () => {
    const o = { v: 0 };
    G.to(o, {
      v: 17, duration: 1.4, ease: 'power2.out',
      onUpdate: () => { const v = String(Math.round(o.v)); if (countEl.textContent !== v) countEl.textContent = v; },
      onComplete: () => restartClass($('.hero__chip--yrs', hero), 'is-tick'),
    });
  };
  // the shot path (quadratic curve, in the court's 600 × 720 viewBox — same points as .hero__shot)
  const SHOT = [[330, 650], [210, 330], [456, 224]];
  const shot = $('.hero__shot', hero);
  const heroBall = $('.hero__ball', hero);
  const shotAt = (t) => {
    const [P, C, Q] = SHOT, u = 1 - t;
    return [u * u * P[0] + 2 * u * t * C[0] + t * t * Q[0], u * u * P[1] + 2 * u * t * C[1] + t * t * Q[1]];
  };
  const placeShotBall = (t) => {
    // the ball's resting place (the end of the path) is set in CSS; offset it back along the curve
    const [x, y] = shotAt(t), [ex, ey] = SHOT[2];
    const sx = court.clientWidth / 600, sy = court.clientHeight / 720;
    heroBall.style.transform = t >= 1 ? '' : `translate(${((x - ex) * sx).toFixed(1)}px, ${((y - ey) * sy).toFixed(1)}px)`;
  };
  const runShot = () => {
    const s = { t: 0 };
    G.set(heroBall, { opacity: 1 });
    G.to(s, {
      t: 1, duration: 1.5, ease: 'power1.inOut',
      onUpdate: () => { placeShotBall(s.t); shot.style.strokeDashoffset = String(1 - s.t); },
      onComplete: () => { hero.classList.add('is-shot'); restartClass(heroBall, 'is-land'); },
    });
  };

  if (motion) {
    countEl.textContent = '0';
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
      .add(runCount, 2.45)
      .add(runShot, 2.6)
      .add(() => $$('.hstrip', hero).forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 110)), 2.5);
  } else {
    hero.classList.add('is-wm', 'is-court', 'is-tag', 'is-opts', 'is-img', 'is-inset', 'is-chips', 'is-shot');
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
    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');
  }

  /* ==========================================================================
     ABOUT — the experience timeline (existing scroll-story framework). As
     each chapter scrolls in it lights up, the ball runs down the line, the
     photos wipe from one to the next and the "~27 years" badge lands.
     ========================================================================== */
  const pp = $('.pp');
  if (pp) {
    const ppSteps = $$('.pp__step', pp);
    const ppImgs = $$('.pp__img', pp);
    const ppWords = $$('.pp__words span', pp);
    const ppBox = $('.pp__steps', pp);
    const ppCta = $('.pp__cta', pp);
    const LAST = ppSteps.length - 1;
    const IMG_AT = [0, 0, 1, 1, 1];          // which photo shows at each chapter
    const WORD_AT = [0, 1, 1, 2, 2];         // Tennis. → Pickleball. → Coaching.
    let ppK = null;
    // n: 0–LAST = chapters, LAST + 1 = the CTA
    const setK = (n) => {
      if (n === ppK) return;
      ppK = n;
      const s = Math.max(0, Math.min(n, LAST));
      ppSteps.forEach((el, i) => { el.classList.toggle('is-on', i <= n); el.classList.toggle('is-now', i === s && n <= LAST); });
      ppImgs.forEach((im, i) => im.classList.toggle('is-on', i <= IMG_AT[s]));
      ppWords.forEach((w, i) => { w.classList.toggle('in', i <= WORD_AT[s]); w.classList.toggle('is-now', i === WORD_AT[s]); });
      pp.classList.toggle('is-badge', n >= 2);
      ppCta.classList.toggle('in', n > LAST);
    };
    if (motion) {
      setK(0);
      ppSteps.forEach((el, i) => ST.create({ trigger: el, start: 'top 78%', onEnter: () => setK(i), onLeaveBack: () => setK(Math.max(0, i - 1)) }));
      ST.create({ trigger: ppCta, start: 'top 92%', onEnter: () => setK(LAST + 1), onLeaveBack: () => setK(LAST) });
      ST.create({ trigger: ppBox, start: 'top 75%', end: 'bottom 70%', scrub: true, onUpdate: (self) => ppBox.style.setProperty('--p', self.progress.toFixed(4)) });
    } else {
      setK(LAST + 1);
    }
  }

  /* PPR credential — the card tilts toward the pointer, with a soft shine */
  const ccard = $('.ccard');
  if (ccard && fine && motion) {
    G.set(ccard, { transformPerspective: 1000 });
    const rx = G.quickTo(ccard, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = G.quickTo(ccard, 'rotationY', { duration: 0.6, ease: 'power3' });
    ccard.addEventListener('pointermove', (e) => {
      const r = ccard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 12);
      rx((0.5 - py) * 10);
      ccard.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`);
      ccard.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`);
    });
    ccard.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ==========================================================================
     Track record — a split-flap board. When it comes into view each tile
     shuffles through a few characters and lands on its value, column by
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

  /* ==========================================================================
     LESSONS — Private or Small group.
     The switch's knob slides; on the court plan the player markers move (one
     for private, up to four for a small group) and a ball travels from Joe to
     them; the chosen side opens (photo in full colour, copy, CTA) while the
     other folds back. The choice is remembered for the inquiry.
     ========================================================================== */
  const TYPE = { private: 'Private lesson', group: 'Small group' };
  const PICKS = Object.keys(TYPE);
  const PLAN_K = { private: '1 player', group: 'Up to 4 players' };
  let chosenType = TYPE[mem.get('jb-pick')] || '';  // carried into the inquiry form
  const opt = $('.opt');
  const optSw = $$('.opt__sw', opt);
  const optSides = $$('.opt__side', opt);
  const plan = $('.opt__plan', opt);
  function setPick(key, user) {
    if (!TYPE[key]) return;
    if (user) { chosenType = TYPE[key]; mem.set('jb-pick', key); }
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
    $('.opt__plan-n', plan).textContent = PLAN_K[key];
    if (motion) restartClass(plan, 'is-serve');
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
  if (mem.get('jb-pick')) { opt.dataset.pick = ''; setPick(mem.get('jb-pick'), false); }

  /* ==========================================================================
     INQUIRY — a guided lesson inquiry, not a booking.
     1 I'm interested in → 2 group size (only for a small group) → 3 details,
     then a confirmation. A ball rolls along the court-line track to the
     current step; the ticket beside the form summarises each answer
     (reached steps can be clicked to jump back). A lesson type chosen above
     is pre-filled. Posts to Netlify Forms.
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
  const sizeStep = steps[1];
  const sizeGroup = $('[data-group-req]', sizeStep);
  const phone = $('#bk-phone');
  const N = steps.length;
  const TITLES = steps.map((s) => $('.bk__h', s).lastChild.textContent.trim());
  let cur = 1, reached = 1, sent = false;

  // step 2 (group size) only applies to a small group
  const isGroup = () => !!$('input[name="interest"][value="Small group"]:checked', form);
  const path = () => (isGroup() ? [1, 2, 3] : [1, 3]);
  const syncGroup = () => {
    const g = isGroup();
    if (g) sizeGroup.setAttribute('data-group-req', 'Please choose a group size.');
    else {
      sizeGroup.removeAttribute('data-group-req');
      $$('input', sizeGroup).forEach((r) => { r.checked = false; });
      sizeGroup.classList.remove('is-invalid');
      $('.bk__err', sizeGroup).textContent = '';
    }
    stops[1].classList.toggle('is-skip', !g);
    ticket.classList.toggle('is-group', g);
  };

  const setProgress = (n) => {               // n: a step number, or N + 1 once sent
    const p = path();
    const at = n > N ? p.length - 1 : p.indexOf(n);
    stops.forEach((li, i) => {
      const k = i + 1, ki = p.indexOf(k);
      li.classList.toggle('is-done', ki > -1 && (ki < at || (k <= reached && k !== n && n <= N && validStep(k))));
      li.classList.toggle('is-now', k === n);
    });
    const prog = n > N ? 1 : at / (p.length - 1);
    if (track.style.getPropertyValue('--bp') !== prog.toFixed(4)) {
      track.style.setProperty('--bp', prog.toFixed(4));
      if (motion) restartClass(bkBall, 'is-roll');
    }
    jumps.forEach((b) => { const k = +b.dataset.step; b.disabled = sent || k > reached || p.indexOf(k) < 0; b.classList.toggle('is-now', k === n); });
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
    const p = path();
    live.textContent = `Step ${p.indexOf(n) + 1} of ${p.length}: ${TITLES[n - 1]}`;
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
  const stepAfter = (n) => { const p = path(); return p[p.indexOf(n) + 1]; };
  const stepBefore = (n) => { const p = path(); return p[p.indexOf(n) - 1]; };

  // validation (phone is optional — checked only when filled in)
  const MSG = { name: 'Please enter your name.', email: 'Please enter a valid email address.', phone: 'Please check the phone number, or leave it empty.' };
  const phoneOk = () => !phone.value.trim() || phone.value.replace(/\D/g, '').length >= 7;
  const fieldOk = (el) => (el === phone ? phoneOk() : el.checkValidity());
  const validate = (el) => {
    const err = d.getElementById(`${el.id}-err`);
    const ok = fieldOk(el);
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
  const fieldsIn = (step) => $$('input[required]:not([type="radio"]), input[type="tel"]', step);
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
    return $$('[data-group-req]', step).every((g) => checkGroup(g, true)) && fieldsIn(step).every(fieldOk);
  }
  fieldsIn(form).forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
  });
  $$('.bk__group', form).forEach((g) => g.addEventListener('change', () => { if (g.classList.contains('is-invalid')) checkGroup(g); }));

  next.addEventListener('click', () => {
    const bad = checkStep(cur);
    if (bad) { bad.focus(); return; }
    goStep(stepAfter(cur), true);
  });
  back.addEventListener('click', () => { if (cur > 1) goStep(stepBefore(cur), true); });
  // the ticket: jump back to any step already reached (forward only through valid steps)
  jumps.forEach((b) => b.addEventListener('click', () => {
    const n = +b.dataset.step;
    if (sent || n === cur || n > reached || path().indexOf(n) < 0) return;
    if (n > cur) { for (let k = cur; k && k < n; k = stepAfter(k)) { const bad = checkStep(k); if (bad) { goStep(k, false); bad.focus(); return; } } }
    goStep(n, true);
  }));
  // Enter in a text field moves on instead of submitting early
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input') && cur < N && !sent) { e.preventDefault(); next.click(); }
  });
  // tapping a tile in steps 1–2 moves straight on (a short pause shows the selection);
  // keyboard users arrowing through the options (click events with detail 0) stay put
  $$('input[name="interest"], input[name="group-size"]', form).forEach((r) => r.addEventListener('click', (e) => {
    if (r.name === 'interest') carry.hidden = true;
    const n = +r.closest('.bk__step').dataset.step;
    if (cur === n && e.detail > 0) setTimeout(() => { if (cur === n && r.checked) goStep(stepAfter(n), true); }, motion ? 450 : 0);
  }));

  // the ticket summary
  const sums = Object.fromEntries(jumps.map((el) => [el.dataset.sum, el]));
  const EMPTY = { interest: 'Not chosen yet', 'group-size': '—', contact: '—' };
  const updateSummary = () => {
    syncGroup();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim().split(/\s+/)[0];
    const size = String(data.get('group-size') || '');
    const vals = {
      interest: String(data.get('interest') || ''),
      'group-size': size ? `${size} player${size === '1' ? '' : 's'}` : '',
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

  // carrying a choice in from elsewhere on the page — a suggestion only, never overriding an answer already given
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
  function prepareInquiry(type) {
    if (sent) resetInquiry();
    if (tick('interest', type || chosenType, !!type)) {
      carry.hidden = false;
      if (type) chosenType = type;
    }
    updateSummary();
    if (cur !== 1) goStep(1, false);
  }

  const resetInquiry = () => {
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
  $('.bk__again', form).addEventListener('click', () => { resetInquiry(); goStep(1, true); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.classList.remove('is-error');
    for (const n of path()) {
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
        : 'Joe will read your inquiry and get back to you about the details. Nothing is booked or charged here.';
      done.classList.add('is-current');
      done.focus({ preventScroll: true });
      setProgress(N + 1);
      stops.forEach((li) => { if (!li.classList.contains('is-skip')) li.classList.add('is-done'); li.classList.remove('is-now'); });
      if (form.getBoundingClientRect().top < 0) scrollToTarget(form, -110);
    } catch (err) {
      status.textContent = 'Something went wrong sending your inquiry. Please try again in a moment, or email coachjoe616@gmail.com.';
      status.classList.add('is-error');
    }
    send.disabled = false;
  });
  goStep(1, false);
  updateSummary();

  /* ==========================================================================
     Gallery framework (expanding panels + larger view). Not on the page yet —
     ready for when Joe supplies real lesson photos. Hover or focus opens a
     panel; clicking an open panel shows the larger view (on touch screens the
     first tap opens it).
     ========================================================================== */
  const panels = $$('.panel');
  if (panels.length) {
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
  }

  /* ==========================================================================
     Footer
     ========================================================================== */
  // a ball hops once along the giant JOE — each letter lights up as it lands — each time it comes into view
  const fword = $('.fword');
  if (fword && motion) {
    const letters = $$('span', fword);
    const fball = $('.fword__ball', fword);
    let ftl = null;
    const land = (el) => {
      letters.forEach((l) => l.classList.toggle('is-lit', l === el));
      setTimeout(() => el.classList.remove('is-lit'), 420);
      G.fromTo(fball, { scaleX: 1.25, scaleY: 0.75 }, { scaleX: 1, scaleY: 1, duration: 0.42, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
    };
    const buildHop = () => {
      if (ftl) ftl.kill();
      const box = fword.getBoundingClientRect();
      const br = fball.offsetWidth / 2;
      const pts = letters.map((l) => { const r = l.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height * 0.04 - br, el: l }; });
      const tl = G.timeline({ paused: true });
      const put = (x, y) => G.set(fball, { x: x - br, y: y - br });
      pts.slice(0, -1).forEach((P, k) => {
        const Q = pts[k + 1];
        const c = { x: (P.x + Q.x) / 2, y: Math.min(P.y, Q.y) - Math.min(110, Math.max(50, Math.abs(Q.x - P.x) * 0.5)) * 2 };
        const s = { t: 0 };
        tl.fromTo(s, { t: 0 }, {
          t: 1, duration: 0.7, ease: 'none', immediateRender: false,
          onUpdate: () => { const t = s.t, u = 1 - t; put(u * u * P.x + 2 * u * t * c.x + t * t * Q.x, u * u * P.y + 2 * u * t * c.y + t * t * Q.y); },
        });
        tl.call(land, [Q.el]);
      });
      tl.eventCallback('onStart', () => land(pts[0].el));
      put(pts[0].x, pts[0].y);
      G.set(fball, { opacity: 1 });
      ftl = tl;
    };
    new IntersectionObserver(([en]) => { if (en.isIntersecting && ftl) ftl.restart(); }, { threshold: 0.6 }).observe(fword);
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
    addEventListener('load', () => { ST.refresh(); setTimeout(() => ST.refresh(), 900); }, { once: true });
  }

  /* ==========================================================================
     Mobile sticky CTA — "Explore lesson options" until the lesson options
     have been on screen, then "Inquire about lessons". Hidden over the hero,
     the inquiry form and the footer.
     ========================================================================== */
  const mctaT = $('.mcta__t', mcta);
  const seen = { lessons: false };
  const hideOver = new Set();
  const updateMcta = () => {
    const show = !hideOver.size && scrollY > innerHeight * 0.6 && !menu.classList.contains('is-open');
    mcta.classList.toggle('is-on', show);
    mcta.inert = !show;
  };
  const mctaIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const id = en.target.id;
      if (id === 'lessons' && en.isIntersecting && !seen.lessons) {
        seen.lessons = true;
        mcta.setAttribute('href', '#inquire');
        mctaT.textContent = 'Inquire about lessons';
        restartClass(mcta, 'is-swap');
      }
      if (id !== 'lessons') { if (en.isIntersecting) hideOver.add(id); else hideOver.delete(id); }
    });
    updateMcta();
  }, { threshold: 0.12 });
  ['top', 'lessons', 'inquire', 'final'].forEach((id) => mctaIO.observe(d.getElementById(id)));

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
