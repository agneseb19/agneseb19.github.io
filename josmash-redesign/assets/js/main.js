/* ==========================================================================
   JO SMASH — Motion system
   GSAP + ScrollTrigger + Lenis (smooth scroll)

   Ogni blocco qui sotto è un "componente" indipendente:
   01. Utilità (split del testo, selettori)
   02. Smooth scroll + link interni
   03. Navbar (nascondi/mostra, voce attiva) e menu mobile
   04. Hero: apertura, fluttuazione, mouse
   05. Hero: animazione legata allo scroll (sezione fissata)
   06. Benvenuti + pilastri
   07. Chi siamo: 1921 → 2024
   08. Ingredienti
   09. Menù: palco dei burger, categorie, fritti
   10. Lavora con noi, social, contatti, footer
   11. Testi e blocchi che entrano (generici)
   12. Cambio colore di sfondo tra le sezioni
   13. Bottoni magnetici
   ========================================================================== */
(function () {
  'use strict';

  /* 01. UTILITÀ ----------------------------------------------------------- */
  var html = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // Divide un testo in parole, ognuna dentro una "maschera" (preserva <strong>, <em>, &nbsp;)
  function splitWords(el) {
    if (el.dataset.splitDone) return $$('.w__i', el);
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/([ \t\n\r\f]+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^[ \t\n\r\f]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'w__i'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
    el.dataset.splitDone = '1';
    return $$('.w__i', el);
  }

  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* Senza GSAP (es. file mancanti) il sito resta comunque usabile */
  if (!hasGSAP) {
    html.classList.add('intro-done');
    initMobileMenu(null);
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var reduced = reducedQuery.matches;
  if (!reduced) html.classList.add('motion');

  /* 02. SMOOTH SCROLL + LINK INTERNI ------------------------------------- */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToHash(hash) {
    var target = hash === '#top' ? 0 : document.querySelector(hash);
    if (target === null) return;
    var offset = (hash === '#smash-burger' || hash === '#fritti') ? -110 : 0;
    if (lenis) {
      lenis.scrollTo(target, { offset: offset, duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    } else {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
    }
    // Accessibilità: sposta il focus sulla sezione raggiunta
    if (target !== 0) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    if (history.replaceState) history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length < 2) return;
    e.preventDefault();
    if (menuApi && menuApi.isOpen()) menuApi.close();
    scrollToHash(hash);
  });

  /* 03. NAVBAR E MENU MOBILE --------------------------------------------- */
  var menuApi = initMobileMenu(gsap);

  (function initNav() {
    var nav = $('[data-nav]');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var hide = self.direction === 1 && self.scroll() > window.innerHeight * 0.5 && !(menuApi && menuApi.isOpen());
        nav.classList.toggle('is-hidden', hide);
        html.classList.toggle('nav-hidden', hide);
      }
    });

    // Voce di menu attiva in base alla sezione visibile (stesso metodo degli sfondi)
    var links = $$('[data-nav-link]');
    var map = [['#top', '#top'], ['#benvenuti', '#top'], ['#chi-siamo', '#chi-siamo'], ['#ingredienti', null],
               ['#menu', '#menu'], ['.team', null], ['.social', null], ['#contatti', '#contatti']]
      .map(function (pair) { return { el: $(pair[0]), href: pair[1] }; });
    var current;
    var updateCurrent = function () {
      var line = window.innerHeight * 0.55, href = '#top';
      map.forEach(function (m) { if (m.el && m.el.getBoundingClientRect().top <= line) href = m.href; });
      if (href === current) return;
      current = href;
      links.forEach(function (l) {
        if (l.getAttribute('href') === href) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateCurrent, onRefresh: updateCurrent });
    updateCurrent();
  })();

  function initMobileMenu(g) {
    var btn = $('[data-menu-toggle]');
    var panel = $('[data-mobile-menu]');
    if (!btn || !panel) return null;
    var open = false;
    var origin = function () { return (window.innerWidth - 46) + 'px 44px'; };

    function setOpen(v) {
      open = v;
      btn.setAttribute('aria-expanded', String(v));
      $('.sr-only', btn).textContent = v ? 'Chiudi il menu' : 'Apri il menu';
      if (v) {
        panel.hidden = false;
        html.style.overflow = 'hidden';
        if (lenis) lenis.stop();
        $('[data-nav]').classList.remove('is-hidden');
        if (g && !reduced) {
          g.fromTo(panel, { clipPath: 'circle(0px at ' + origin() + ')' },
                          { clipPath: 'circle(' + Math.hypot(window.innerWidth, window.innerHeight) + 'px at ' + origin() + ')', duration: 0.8, ease: 'expo.out' });
          g.fromTo($$('.mobile-menu__links a', panel), { yPercent: 60, autoAlpha: 0 },
                   { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, delay: 0.12, ease: 'expo.out' });
        }
        var first = $('a', panel); if (first) first.focus({ preventScroll: true });
      } else {
        html.style.overflow = '';
        if (lenis) lenis.start();
        var done = function () { panel.hidden = true; panel.style.clipPath = ''; };
        if (g && !reduced) {
          g.to(panel, { clipPath: 'circle(0px at ' + origin() + ')', duration: 0.5, ease: 'power3.in', onComplete: done });
        } else { done(); }
      }
    }

    btn.addEventListener('click', function () { setOpen(!open); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setOpen(false); btn.focus(); }
    });
    // Senza GSAP i link chiudono comunque il menu
    if (!g) panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches && open) setOpen(false); });

    return { isOpen: function () { return open; }, close: function () { setOpen(false); } };
  }

  /* 04. HERO: APERTURA, FLUTTUAZIONE, MOUSE ------------------------------ */
  var hero = $('[data-hero]');
  var heroImg = $('[data-hero-img]');
  var light = $('.burger__light');

  function heroIntro() {
    var lines = $$('[data-intro-line]', hero);
    gsap.set(lines, { y: 0, yPercent: 112 });
    gsap.set('[data-burger-intro]', { autoAlpha: 0, scale: 0.55, yPercent: 24, rotation: -9 });
    gsap.set('[data-hero-foot]', { autoAlpha: 0, y: 24 });
    gsap.set('[data-hero-tag]', { autoAlpha: 0, scale: 0.6 });
    gsap.set('.hero__glow', { autoAlpha: 0, scale: 0.6 });
    gsap.set('.nav__bar', { autoAlpha: 0, y: -24 });
    html.classList.add('intro-done'); // da qui in poi gli stati iniziali li gestisce GSAP

    return gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.hero__glow', { autoAlpha: 1, scale: 1, duration: 2.4 }, 0)
      .to(lines, { yPercent: 0, duration: 1.35, stagger: 0.09 }, 0.15)
      .to('[data-burger-intro]', { autoAlpha: 1, scale: 1, yPercent: 0, rotation: -2, duration: 1.9 }, 0.35)
      .fromTo(light, { '--sweep': '130%' }, { '--sweep': '-40%', duration: 1.7, ease: 'power2.inOut' }, 1.05)
      .to('[data-hero-tag]', { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.09, ease: 'back.out(1.7)' }, 1.3)
      .to('[data-hero-foot]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 1.15)
      .to('.nav__bar', { autoAlpha: 1, y: 0, duration: 1.1, clearProps: 'transform' }, 0.95);
  }

  function heroFloat() {
    var float = $('[data-burger-float]');
    gsap.to(float, { y: -10, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    if (!finePointer) return;
    var qx = gsap.quickTo(float, 'x', { duration: 1, ease: 'power3' });
    var qr = gsap.quickTo(float, 'rotation', { duration: 1, ease: 'power3' });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      qx(nx * 26); qr(nx * 3);
      light.style.setProperty('--lx', (35 + nx * 40).toFixed(1) + '%');
      light.style.setProperty('--ly', (22 + ny * 30).toFixed(1) + '%');
    });
    hero.addEventListener('pointerleave', function () { qx(0); qr(0); });
  }

  /* 09bis. PALCO DEI BURGER (indipendente dalle animazioni) ---------------- */
  var menuStage = (function () {
    var items = $$('[data-burger-item]');
    var wrap = $('[data-menu-imgs]');
    var disc = $('[data-menu-disc]');
    var num = $('[data-menu-num]');
    var current = -1;

    // Copia le foto ufficiali dei burger dentro il palco
    var boxes = items.map(function (item) {
      item.style.setProperty('--tone', item.dataset.tone);
      var src = $('img', item);
      var box = document.createElement('div');
      box.className = 'menu-stage__img';
      box.setAttribute('data-media', '');
      var img = src.cloneNode();
      img.alt = '';
      img.setAttribute('loading', 'lazy');
      var label = document.createElement('span');
      label.className = 'media-missing';
      label.textContent = $('.burger-item__name', item).textContent;
      box.appendChild(img); box.appendChild(label);
      if ($('[data-media]', item).classList.contains('is-missing')) box.classList.add('is-missing');
      wrap.appendChild(box);
      gsap.set(box, { autoAlpha: 0 });
      return box;
    });

    function setActive(i, animate) {
      if (i === current) return;
      var prev = current, dir = i > prev ? 1 : -1;
      current = i;
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      num.textContent = pad(i + 1);
      var anim = animate && !reducedQuery.matches;
      gsap.to(disc, { backgroundColor: items[i].dataset.tone, duration: anim ? 0.8 : 0, ease: 'power2.out' });
      boxes.forEach(function (box, k) {
        if (k === i) {
          if (anim) gsap.fromTo(box, { autoAlpha: 0, xPercent: dir * 22, rotation: dir * 10, scale: 0.86 },
            { autoAlpha: 1, xPercent: 0, rotation: 0, scale: 1, duration: 1, ease: 'expo.out', overwrite: true });
          else gsap.set(box, { autoAlpha: 1, xPercent: 0, rotation: 0, scale: 1, overwrite: true });
        } else if (k === prev && anim) {
          gsap.to(box, { autoAlpha: 0, xPercent: -dir * 22, rotation: -dir * 10, scale: 0.86, duration: 0.6, ease: 'power3.in', overwrite: true });
        } else {
          gsap.set(box, { autoAlpha: 0, overwrite: true });
        }
      });
      if (anim) gsap.fromTo(num, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
    }

    items.forEach(function (item, i) {
      item.addEventListener('pointerenter', function () { setActive(i, true); });
      item.addEventListener('focusin', function () { setActive(i, true); });
    });
    setActive(0, false);
    return { items: items, setActive: setActive };
  })();

  /* Categorie del menù: evidenzia quella visibile */
  (function initMenuCats() {
    var chips = $$('[data-cat-link]');
    var cats = $$('[data-cat]');
    var current;
    var update = function () {
      var line = window.innerHeight * 0.6, pick = cats[0];
      cats.forEach(function (c) { if (c.getBoundingClientRect().top <= line) pick = c; });
      if (pick === current) return;
      current = pick;
      chips.forEach(function (ch) {
        var on = ch.dataset.catLink === pick.dataset.cat;
        ch.classList.toggle('is-active', on);
        if (on) ch.setAttribute('aria-current', 'true'); else ch.removeAttribute('aria-current');
      });
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
    update();
  })();

  /* 05-13: tutto ciò che dipende dalla dimensione dello schermo vive in matchMedia,
     così al resize le animazioni vengono ricostruite correttamente */
  var mm = gsap.matchMedia();

  mm.add({
    desktop: '(min-width: 900px)',
    mobile: '(max-width: 899px)',
    wide: '(min-width: 700px)',
    reduce: '(prefers-reduced-motion: reduce)'
  }, function (ctx) {
    var c = ctx.conditions;
    if (c.reduce) { staticFallbacks(); return; }

    /* 05. HERO LEGATA ALLO SCROLL ---------------------------------------- */
    var stage = $('.stage');
    var gap = $('.hero__gap');
    var center = function () {
      var r = gap.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return Math.round(r.left + r.width / 2 - s.left) + 'px ' + Math.round(r.top + r.height / 2 - s.top) + 'px';
    };
    var radius = function () { return Math.ceil(Math.hypot(window.innerWidth, window.innerHeight)) + 'px'; };

    gsap.set('[data-manifesto-word]', { y: 0, yPercent: 112 });

    gsap.timeline({
      scrollTrigger: {
        trigger: stage, start: 'top top', end: c.desktop ? '+=240%' : '+=180%',
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
      }
    })
      // le parole vengono "schiacciate" via dal burger
      .to('[data-hero-word="smash"]', c.desktop
        ? { xPercent: -60, x: '-16vw', autoAlpha: 0, duration: 0.45, ease: 'power2.in' }
        : { yPercent: -90, y: '-8vh', autoAlpha: 0, duration: 0.42, ease: 'power2.in' }, 0)
      .to('[data-hero-word="burger"]', c.desktop
        ? { xPercent: 60, x: '16vw', autoAlpha: 0, duration: 0.45, ease: 'power2.in' }
        : { yPercent: 90, y: '8vh', autoAlpha: 0, duration: 0.42, ease: 'power2.in' }, 0)
      .to('[data-hero-kicker]', { y: function (i) { return i === 0 ? -70 : 70; }, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to('[data-hero-tags]', { scale: 1.5, autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 0)
      .to('.hero__foot', { y: 40, autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0)
      // il burger cresce fino a dominare lo schermo
      .to('[data-burger-scroll]', { scale: c.desktop ? 1.95 : 1.4, rotation: 4, yPercent: -3, duration: 0.5, ease: 'power1.inOut' }, 0)
      // ...e si apre sulla foto macro
      .fromTo('[data-manifesto]',
        { clipPath: function () { return 'circle(0px at ' + center() + ')'; } },
        { clipPath: function () { return 'circle(' + radius() + ' at ' + center() + ')'; }, duration: 0.34, ease: 'power2.in' }, 0.3)
      .fromTo('[data-manifesto-img]', { scale: 1.4 }, { scale: 1, duration: 0.7, ease: 'none' }, 0.3)
      .to('[data-burger-scroll]', { scale: c.desktop ? 2.7 : 2, autoAlpha: 0, duration: 0.2, ease: 'power1.in' }, 0.5)
      // "Smasha, Mordi e Godi." parola per parola
      .to('[data-manifesto-word]', { yPercent: 0, duration: 0.16, stagger: 0.09, ease: 'power3.out' }, 0.62)
      .to({}, { duration: 0.12 });

    /* 06. BENVENUTI + PILASTRI ------------------------------------------- */
    gsap.fromTo('[data-welcome-burger]',
      { xPercent: c.desktop ? 24 : 14, yPercent: 12, rotation: 10 },
      { xPercent: 0, yPercent: -6, rotation: -3, ease: 'none',
        scrollTrigger: { trigger: '[data-welcome-burger]', start: 'top bottom', end: 'bottom 40%', scrub: 1 } });

    gsap.timeline({ scrollTrigger: { trigger: '.pillars__list', start: 'top 82%', end: 'bottom 45%', scrub: 1 } })
      .to('[data-pillar]', { backgroundPosition: '0% 0%', ease: 'none', stagger: 0.5, duration: 1 });

    /* 07. CHI SIAMO: 1921 → 2024 ------------------------------------------ */
    var yearEl = $('[data-story-year]');
    var year = { v: 1921 };
    var writeYear = function () { yearEl.textContent = Math.round(year.v); };
    var panels = $$('[data-story-panel]');

    if (c.desktop) {
      gsap.set(panels[1], { autoAlpha: 0, y: 50 });
      gsap.timeline({
        scrollTrigger: { trigger: '[data-story]', start: 'top top', end: '+=170%', pin: true, scrub: 1, anticipatePin: 1 }
      })
        .to('[data-story-bar]', { scaleX: 1, ease: 'none', duration: 1 }, 0)
        .to(year, { v: 2024, ease: 'power1.inOut', duration: 0.42, onUpdate: writeYear }, 0.28)
        .to(panels[0], { autoAlpha: 0, y: -50, duration: 0.18, ease: 'power2.in' }, 0.36)
        .to(panels[1], { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.5);
    } else {
      gsap.timeline({ scrollTrigger: { trigger: '.story__panels', start: 'top 85%', end: 'bottom 60%', scrub: 1 } })
        .to(year, { v: 2024, ease: 'none', onUpdate: writeYear }, 0)
        .to('[data-story-bar]', { scaleX: 1, ease: 'none' }, 0);
    }

    // Foto di Josè: si rivela la cornice, la foto resta identica
    gsap.fromTo('[data-founder-photo]',
      { clipPath: 'inset(100% 0% 0% 0% round 36px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 36px)', duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: '[data-founder-photo]', start: 'top 80%', toggleActions: 'play none none reverse' } });

    /* 08. INGREDIENTI ------------------------------------------------------ */
    var ingItems = $$('[data-ing]');
    if (c.desktop) {
      var ingImgs = $$('[data-ing-img]');
      var ingCount = $('[data-ing-count]');
      var ingCurrent = -1;
      ingImgs.forEach(function (img, i) { img.style.zIndex = i + 1; });
      gsap.set(ingImgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      var setIng = function (i) {
        if (i === ingCurrent) return;
        ingCurrent = i;
        ingImgs.forEach(function (img, k) {
          gsap.to(img, k <= i
            ? { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.out', overwrite: true }
            : { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut', overwrite: true });
        });
        gsap.fromTo($('img', ingImgs[i]), { scale: 1.18 }, { scale: 1, duration: 1.5, ease: 'expo.out', overwrite: true });
        ingCount.textContent = pad(i + 1);
        ingItems.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      };
      ingItems.forEach(function (item, i) {
        ScrollTrigger.create({ trigger: item, start: 'top 60%', end: 'bottom 60%',
          onToggle: function (self) { if (self.isActive) setIng(i); } });
      });
      setIng(0);
    }

    /* 09. MENÙ ------------------------------------------------------------- */
    if (c.desktop) {
      gsap.fromTo('[data-menu-disc]', { scale: 0.5 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: '[data-menu-stage]', start: 'top bottom', end: 'top 40%', scrub: 1 } });
      menuStage.items.forEach(function (item, i) {
        ScrollTrigger.create({ trigger: item, start: 'top 55%', end: 'bottom 55%',
          onToggle: function (self) { if (self.isActive) menuStage.setActive(i, true); } });
      });
    }

    gsap.set('[data-fried]', { y: 60, autoAlpha: 0 });
    ScrollTrigger.batch('[data-fried]', {
      start: 'top 90%',
      onEnter: function (els) { gsap.to(els, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out', overwrite: true }); },
      onLeaveBack: function (els) { gsap.to(els, { y: 60, autoAlpha: 0, duration: 0.6, stagger: 0.04, ease: 'power2.in', overwrite: true }); }
    });

    /* 10. LAVORA CON NOI, SOCIAL, CONTATTI, FOOTER ------------------------- */
    gsap.fromTo('[data-team-card]', { scale: 0.88, y: 60 }, { scale: 1, y: 0, ease: 'none',
      scrollTrigger: { trigger: '.team', start: 'top bottom', end: 'top 25%', scrub: 1 } });

    if (c.wide) {
      var track = $('[data-reels-track]');
      gsap.fromTo(track, { x: function () { return window.innerWidth * 0.1; } },
        { x: function () { return -(track.scrollWidth - window.innerWidth) - window.innerWidth * 0.04; }, ease: 'none',
          scrollTrigger: { trigger: '[data-reels]', start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } });
    }

    gsap.fromTo('[data-visit-burger] picture', { yPercent: 30, rotation: 8, scale: 0.82 },
      { yPercent: 0, rotation: -2, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'top 15%', scrub: 1 } });
    gsap.fromTo('.visit__glow', { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'none',
      scrollTrigger: { trigger: '.visit', start: 'top 80%', end: 'top 20%', scrub: 1 } });

    gsap.set('[data-contact]', { y: 30, autoAlpha: 0 });
    ScrollTrigger.batch('[data-contact]', {
      start: 'top 92%',
      onEnter: function (els) { gsap.to(els, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08, ease: 'expo.out', overwrite: true }); },
      onLeaveBack: function (els) { gsap.to(els, { y: 30, autoAlpha: 0, duration: 0.5, overwrite: true }); }
    });

    gsap.fromTo('[data-footer-giant]', { yPercent: 70 }, { yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });

    /* 11. TESTI E BLOCCHI CHE ENTRANO ------------------------------------- */
    $$('[data-split]').forEach(function (el) {
      var words = splitWords(el);
      gsap.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.25, stagger: 0.045, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' } });
    });
    $$('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.15, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
    });

    /* 12. SFONDI CHE CAMBIANO -------------------------------------------- */
    // Ad ogni scroll cerca l'ultima sezione che ha superato il 55% dello schermo:
    // funziona anche con salti improvvisi (tasto Fine, link interni).
    var themeMeta = $('meta[name="theme-color"]');
    var bgSections = $$('[data-bg]');
    var currentBg = null;
    var updateBg = function () {
      var line = window.innerHeight * 0.55, pick = bgSections[0];
      for (var i = 0; i < bgSections.length; i++) {
        if (bgSections[i].getBoundingClientRect().top <= line) pick = bgSections[i];
      }
      if (pick === currentBg) return;
      currentBg = pick;
      gsap.to(document.body, { backgroundColor: pick.dataset.bg, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
      html.classList.toggle('is-dark', pick.dataset.theme === 'dark');
      if (themeMeta) themeMeta.setAttribute('content', pick.dataset.bg);
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateBg, onRefresh: updateBg });
    updateBg();

    return function () { gsap.set(document.body, { clearProps: 'backgroundColor' }); };
  });

  /* Senza animazioni: stati finali e niente sezioni fissate */
  function staticFallbacks() {
    html.classList.add('intro-done');
    var y = $('[data-story-year]'); if (y) y.textContent = '2024';
  }

  /* 13. BOTTONI MAGNETICI (molto discreti) -------------------------------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(function (btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.2);
        qy((e.clientY - r.top - r.height / 2) * 0.28);
      });
      btn.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }

  /* AVVIO: aspetta il burger e i font, poi parte la scena d'apertura ------ */
  if (!reduced) {
    var ready = Promise.race([
      Promise.all([
        heroImg && heroImg.decode ? heroImg.decode().catch(function () {}) : Promise.resolve(),
        document.fonts ? document.fonts.ready : Promise.resolve()
      ]),
      new Promise(function (r) { setTimeout(r, 1800); })
    ]);
    ready.then(function () { heroIntro(); heroFloat(); });
  }

  // Ricalcola le posizioni quando arrivano font e immagini
  if (document.fonts) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  // ...e quando l'altezza della pagina cambia (es. una foto che arriva in ritardo o manca)
  if ('ResizeObserver' in window) {
    var mainEl = $('main'), lastH = 0, timer = null;
    ScrollTrigger.addEventListener('refresh', function () { lastH = mainEl.offsetHeight; });
    new ResizeObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (Math.abs(mainEl.offsetHeight - lastH) > 2) ScrollTrigger.refresh();
      }, 300);
    }).observe(mainEl);
  }
})();
