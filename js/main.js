/* ==========================================================================
   EdPal landing page — behaviour
   --------------------------------------------------------------------------
   Dependencies: anime.js v4 (UMD build, loaded from CDN) and the Tally embed
   widget. Everything degrades to a fully visible, static page if either fails.

   Responsibilities
     1. Tally configuration (the only place form URLs are set)
     2. Attribution parameters appended to those URLs
     3. Reduced-motion guard (required — anime.js writes inline styles and
        would otherwise ignore the CSS @media rule)
     4. Theme toggle — shares the app-wide "reg_theme" preference
     5. Mobile navigation (Escape to close, focus management)
     6. FAQ accordion (arrow-key navigation)
     7. Modals: two Tally forms and the enlarged video player
     8. Motion — one distinct transition per element
     9. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* ══ 1. TALLY CONFIGURATION ═══════════════════════════════════════════
     Paste the two Tally form URLs here. Nothing else in the project needs
     editing — both form modals read from this object.
  ══════════════════════════════════════════════════════════════════════ */

  var TALLY = {
    waitlist: 'https://tally.so/embed/Npepop',
    contact:  'https://tally.so/embed/jaOpMY'
  };

  var TRACKING = {
    utm_source:   '',
    utm_campaign: ''
  };

  var TALLY_PARAMS = 'alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
  var PLACEHOLDER = /REPLACE_[A-Z_]+/;

  function isConfigured(url) {
    return typeof url === 'string' && url.indexOf('http') === 0 && !PLACEHOLDER.test(url);
  }

  function withParams(baseUrl, extra) {
    var url = baseUrl + (baseUrl.indexOf('?') === -1 ? '?' : '&') + TALLY_PARAMS;
    var key;
    for (key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key) && extra[key]) {
        url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(extra[key]);
      }
    }
    return url;
  }

  function incomingParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || '';
    } catch (err) {
      return '';
    }
  }

  function trackingFor(source) {
    return {
      source:       source,
      utm_source:   incomingParam('utm_source') || TRACKING.utm_source || 'direct',
      utm_campaign: incomingParam('utm_campaign') || TRACKING.utm_campaign
    };
  }

  /* ══ 2. REDUCED MOTION ════════════════════════════════════════════════
     This MUST be checked in JS. The @media(prefers-reduced-motion) block in
     main.css neutralises CSS transitions, but anime.js writes inline styles
     directly and would ignore it — so every animation below is skipped when
     this is true, and elements are revealed instantly instead.
  ══════════════════════════════════════════════════════════════════════ */

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function animeReady() {
    return typeof window.anime !== 'undefined' &&
           typeof window.anime.animate === 'function';
  }

  function revealNow(nodes) {
    Array.prototype.forEach.call(nodes, function (el) {
      el.style.opacity = '';
      el.style.transform = '';
      el.classList.add('motion-done');
    });
  }

  // anime.js v4 exposes `eases`; ease(3) === easeOutCubic.
  function ease(power) {
    if (window.anime && window.anime.eases) return window.anime.eases.out(power);
    return 'easeOutCubic';
  }

  /* ══ 3. THEME ═════════════════════════════════════════════════════════
     localStorage key "reg_theme": "light" means light, anything else is dark.
     The initial class is applied by the inline script in <head>.
  ══════════════════════════════════════════════════════════════════════ */

  var THEME_KEY = 'reg_theme';

  function isDark() {
    return document.documentElement.classList.contains('theme-dark');
  }

  function initTheme() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    function sync() {
      var dark = isDark();
      toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    toggle.addEventListener('click', function () {
      var dark = !isDark();
      document.documentElement.classList.toggle('theme-dark', dark);
      try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); }
      catch (err) { /* storage unavailable */ }
      sync();
    });

    sync();
  }

  /* ══ 4. MOBILE NAVIGATION ════════════════════════════════════════════ */

  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var panel  = document.getElementById('mobileNav');
    var scrim  = document.getElementById('navScrim');
    if (!toggle || !panel || !scrim) return;

    var closeBtn = panel.querySelector('[data-nav-close]');
    var lastFocus = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function open() {
      lastFocus = document.activeElement;
      panel.hidden = false;
      scrim.hidden = false;
      requestAnimationFrame(function () { panel.setAttribute('data-open', 'true'); });
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function close() {
      panel.setAttribute('data-open', 'false');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        panel.hidden = true;
        scrim.hidden = true;
      }, 200);
      if (lastFocus && lastFocus.isConnected) lastFocus.focus();
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
    });

    scrim.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    panel.addEventListener('click', function (event) {
      if (event.target.closest('a[href]')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && toggle.getAttribute('aria-expanded') === 'true') {
        panel.setAttribute('data-open', 'false');
        panel.hidden = true;
        scrim.hidden = true;
        document.body.style.overflow = '';
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ══ 5. FAQ ACCORDION ════════════════════════════════════════════════ */

  function initFaq() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.faq__trigger'));
    if (!triggers.length) return;

    function setExpanded(trigger, expanded) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (panel) panel.hidden = !expanded;
    }

    triggers.forEach(function (trigger, index) {
      setExpanded(trigger, trigger.getAttribute('aria-expanded') === 'true');

      trigger.addEventListener('click', function () {
        setExpanded(trigger, trigger.getAttribute('aria-expanded') !== 'true');
      });

      trigger.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowDown') next = triggers[(index + 1) % triggers.length];
        else if (event.key === 'ArrowUp') next = triggers[(index - 1 + triggers.length) % triggers.length];
        else if (event.key === 'Home') next = triggers[0];
        else if (event.key === 'End') next = triggers[triggers.length - 1];
        if (next) { event.preventDefault(); next.focus(); }
      });
    });
  }

  /* ══ 6. TALLY EMBEDS ═════════════════════════════════════════════════ */

  var tallyScriptRequested = false;
  var tallyWidgetLoaded = false;

  function loadTallyWidget() {
    if (tallyScriptRequested) return;
    tallyScriptRequested = true;

    if (document.querySelector('script[src*="tally.so"]')) { tallyWidgetLoaded = true; return; }

    var script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    script.onload = function () {
      tallyWidgetLoaded = true;
      if (window.Tally && window.Tally.loadEmbeds) { window.Tally.loadEmbeds(); }
      else { showEmbedFallbacks(); }
    };
    script.onerror = showEmbedFallbacks;
    document.body.appendChild(script);
  }

  function showEmbedFallbacks() {
    tallyWidgetLoaded = false;
    Array.prototype.forEach.call(document.querySelectorAll('.tally-embed'), function (shell) {
      var iframe = shell.querySelector('iframe[data-tally-iframe]');
      var fallback = shell.querySelector('[data-tally-fallback]');
      if (!iframe || !fallback) return;
      iframe.hidden = true;
      fallback.hidden = false;
    });
  }

  function initEmbeds() {
    Array.prototype.forEach.call(document.querySelectorAll('.tally-embed'), function (shell) {
      var key = shell.getAttribute('data-tally-form');
      var iframe = shell.querySelector('iframe[data-tally-iframe]');
      var fallback = shell.querySelector('[data-tally-fallback]');
      if (!iframe || !fallback) return;

      var url = TALLY[key];
      if (!isConfigured(url)) { iframe.hidden = true; fallback.hidden = false; return; }

      iframe.setAttribute('data-tally-src', withParams(url, trackingFor('landing_' + key)));
      fallback.hidden = true;
    });

    loadTallyWidget();

    window.setTimeout(function () {
      if (typeof window.Tally === 'undefined') showEmbedFallbacks();
    }, 6000);
  }

  /* ══ 7. MODALS ═══════════════════════════════════════════════════════
     Waitlist form, enquiry form and the enlarged video player share one
     dialog behaviour: focus moves in, Tab stays inside, Escape closes, focus
     returns to the trigger, and the backdrop cancels.
  ══════════════════════════════════════════════════════════════════════ */

  var MODAL_FOR_TRIGGER = { waitlist: 'waitlistModal', contact: 'contactModal' };

  function initModals() {
    var modals = Array.prototype.slice.call(document.querySelectorAll('.modal'));
    if (!modals.length) return;

    var lastFocus = null;

    function configureTally(modal) {
      var iframe = modal.querySelector('iframe[data-tally-iframe]');
      if (!iframe) return;
      var src = iframe.getAttribute('data-tally-src');
      if (!src) return;
      if (iframe.getAttribute('src') !== src) iframe.setAttribute('src', src);
      iframe.hidden = false;
      var fallback = modal.querySelector('[data-tally-fallback]');
      if (fallback) fallback.hidden = true;
    }

    function openVideo(modal) {
      var dialog = modal.querySelector('.modal__dialog');
      var player = modal.querySelector('video');

      if (player) {
        player.currentTime = 0;
        var attempt = player.play();
        if (attempt && typeof attempt.catch === 'function') { attempt.catch(function () {}); }
      }

      if (animeReady() && !prefersReducedMotion() && dialog) {
        window.anime.animate(dialog, {
          opacity: [0, 1], scale: [0.94, 1], duration: 380, ease: ease(3)
        });
      }
    }

    function open(modal, trigger) {
      lastFocus = trigger || document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');

      configureTally(modal);
      loadTallyWidget();
      if (tallyWidgetLoaded && window.Tally && window.Tally.loadEmbeds) { window.Tally.loadEmbeds(); }

      if (modal.classList.contains('modal--video')) openVideo(modal);

      var focusTarget = modal.querySelector('.modal__dialog button, .modal__dialog a[href], .modal__dialog video');
      if (focusTarget) focusTarget.focus();
    }

    function close(modal) {
      // Never leave audio playing behind a closed dialog.
      Array.prototype.forEach.call(modal.querySelectorAll('video'), function (v) { v.pause(); });
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.isConnected) lastFocus.focus();
      else {
        var fallbackTrigger = document.querySelector('[data-video-open]');
        if (fallbackTrigger) fallbackTrigger.focus();
      }
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-tally-open], [data-open-contact], [data-video-open]'),
      function (button) {
        button.addEventListener('click', function () {
          // Three trigger shapes, resolved explicitly. data-open-contact and
          // data-video-open are bare attributes with no value, so they cannot
          // be looked up in MODAL_FOR_TRIGGER the way data-tally-open is —
          // getAttribute returns "" and the map lookup yields undefined.
          var targetId;
          if (button.hasAttribute('data-video-open'))        targetId = 'videoModal';
          else if (button.hasAttribute('data-open-contact')) targetId = 'contactModal';
          else targetId = MODAL_FOR_TRIGGER[button.getAttribute('data-tally-open')];

          var modal = targetId ? document.getElementById(targetId) : null;
          if (modal) open(modal, button);
        });
      }
    );

    modals.forEach(function (modal) {
      Array.prototype.forEach.call(modal.querySelectorAll('[data-modal-close]'), function (el) {
        el.addEventListener('click', function () { close(modal); });
      });

      modal.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') return;
        var dialog = modal.querySelector('.modal__dialog');
        var focusables = Array.prototype.filter.call(
          dialog.querySelectorAll('a[href], button:not([disabled]), iframe, video, [tabindex]:not([tabindex="-1"])'),
          function (el) { return el.offsetParent !== null; }
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      modals.forEach(function (modal) { if (!modal.hidden) close(modal); });
    });
  }

  /* ══ 8. MOTION ═══════════════════════════════════════════════════════
     Six elements, six different transitions — no shared in/out pair:
       logo                fade up, once, on page load
       hero panel          rise + fade, then its meters fill and rows settle
       recommendation card slide in from the left
       cutoff table        rows drop in, staggered 55ms
       demo video          zoom out from 96%
       enlarged player     scale from 94% (in openVideo above)
  ══════════════════════════════════════════════════════════════════════ */

  function animateLogo() {
    var logo = document.querySelector('.brand__logo');
    if (!logo) return;
    logo.classList.add('logo-in');
    if (!animeReady() || prefersReducedMotion()) { revealNow([logo]); return; }

    window.anime.animate(logo, {
      opacity:    [0, 1],
      translateY: [10, 0],
      duration:   620,
      delay:      120,
      ease:       ease(4),
      onComplete: function () { logo.classList.add('motion-done'); }
    });
  }

  function animatePanel() {
    var panel = document.querySelector('.panel');
    if (!panel) return;
    panel.classList.add('rise-in');

    if (!animeReady() || prefersReducedMotion()) { revealNow([panel]); return; }

    window.anime.animate(panel, {
      opacity:    [0, 1],
      translateY: [24, 0],
      duration:   680,
      delay:      220,
      ease:       ease(3),
      onComplete: function () { panel.classList.add('motion-done'); }
    });

    // The meters fill after the panel arrives, so it reads as live rather
    // than as a static picture.
    var meter = panel.querySelector('.panel__meter-fill');
    var bars  = panel.querySelectorAll('.panel__bar-fill');
    var delay = 620;

    if (meter) {
      var target = meter.style.width || '0%';
      meter.style.width = '0%';
      window.anime.animate(meter, {
        width: [0, target], duration: 1100, delay: delay, ease: ease(4)
      });
    }

    if (bars.length) {
      Array.prototype.forEach.call(bars, function (b) { b.style.transformOrigin = 'left center'; });
      window.anime.animate(bars, {
        scaleX:   [0, 1],
        duration: 820,
        delay:    window.anime.stagger(90, { start: delay + 200 }),
        ease:     ease(4)
      });
    }
  }

  function animateSlideIn(node) {
    node.classList.add('slide-in');
    if (!animeReady() || prefersReducedMotion()) { revealNow([node]); return; }
    window.anime.animate(node, {
      opacity:    [0, 1],
      translateX: [-18, 0],
      duration:   620,
      ease:       ease(3),
      onComplete: function () { node.classList.add('motion-done'); }
    });
  }

  function animateRows(table) {
    var rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return;
    table.classList.add('rows-in');
    if (!animeReady() || prefersReducedMotion()) { revealNow([table]); return; }

    window.anime.animate(rows, {
      opacity:    [0, 1],
      translateY: [-10, 0],
      duration:   520,
      delay:      window.anime.stagger(55),
      ease:       ease(3),
      onComplete: function () { table.classList.add('motion-done'); }
    });
  }

  function animateZoomIn(node) {
    node.classList.add('zoom-in');
    if (!animeReady() || prefersReducedMotion()) { revealNow([node]); return; }
    window.anime.animate(node, {
      opacity:  [0, 1],
      scale:    [0.96, 1],
      duration: 700,
      ease:     ease(3),
      onComplete: function () { node.classList.add('motion-done'); }
    });
  }

  function initMotion() {
    animateLogo();

    var jobs = [];
    var panel = document.querySelector('.panel');
    var card  = document.querySelector('.rec');
    var table = document.querySelector('.table-wrap');
    var video = document.querySelector('.demo__frame');

    if (panel) jobs.push({ node: panel, run: animatePanel });
    if (card)  jobs.push({ node: card,  run: function () { animateSlideIn(card); } });
    if (table) jobs.push({ node: table, run: function () { animateRows(table); } });
    if (video) jobs.push({ node: video, run: function () { animateZoomIn(video); } });

    if (!jobs.length) return;

    // No observer, no anime, or reduced motion: nothing must ever be left
    // invisible, so reveal everything without animating.
    if (!('IntersectionObserver' in window) || !animeReady() || prefersReducedMotion()) {
      jobs.forEach(function (job) { job.done = true; revealNow([job.node]); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var job = null;
        for (var i = 0; i < jobs.length; i++) { if (jobs[i].node === entry.target) job = jobs[i]; }
        if (!entry.isIntersecting || !job || job.done) return;
        job.done = true;
        job.run();
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    jobs.forEach(function (job) { observer.observe(job.node); });

    // Safety net: if the observer never fires for something already on screen,
    // reveal it rather than leaving a blank space.
    window.setTimeout(function () {
      jobs.forEach(function (job) {
        if (job.done) return;
        var rect = job.node.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) { job.done = true; job.run(); }
      });
    }, 2500);
  }

  /* ══ 9. FOOTER YEAR ══════════════════════════════════════════════════ */

  function initYear() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ══ BOOT ════════════════════════════════════════════════════════════ */

  function init() {
    initTheme();
    initMobileNav();
    initFaq();
    initEmbeds();
    initModals();
    initMotion();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
