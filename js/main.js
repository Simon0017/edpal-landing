/* ==========================================================================
   EdPal landing page — behaviour
   --------------------------------------------------------------------------
   No dependencies. Loaded with `defer`. Responsibilities:
     1. Tally configuration (the only place form IDs are set)
     2. Attribution parameters appended to the Tally embed URLs
     3. Theme toggle — shares the app-wide "reg_theme" preference
     4. Mobile navigation (Escape to close, focus management)
     5. FAQ accordion (roving focus, arrow keys)
     6. Tally popup modal for the partner/enquiry form
     7. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* ══ 1. TALLY CONFIGURATION ═══════════════════════════════════════════
     Paste the two Tally form IDs here. Nothing else in the project needs
     editing — every embed and popup reads from this object.

     Replace REPLACE_WAITLIST_ID and REPLACE_CONTACT_ID with the numeric IDs
     from Tally (Share → Embed). The values below are placeholders; the page
     detects that and degrades to a visible link instead of an empty box.
  ══════════════════════════════════════════════════════════════════════ */

  var TALLY = {
    waitlist: 'https://tally.so/embed/REPLACE_WAITLIST_ID',
    contact:  'https://tally.so/embed/REPLACE_CONTACT_ID'
  };

  /* Query-string parameters Tally reads and applies to the matching hidden
     fields in both forms. See README — the hidden fields must exist in the
     Tally form builder for these to be recorded. */
  var TRACKING = {
    source:       'landing_waitlist',
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

  /* ══ 2. ATTRIBUTION ═══════════════════════════════════════════════════
     utm_source / utm_campaign come from the page URL if present; `source`
     identifies the block that produced the signup (waitlist or enquiry).
  ══════════════════════════════════════════════════════════════════════ */

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

  /* ══ 3. THEME ═════════════════════════════════════════════════════════
     localStorage key "reg_theme": "light" means light, anything else is dark.
     The initial class is applied by the inline script in <head>.
  ══════════════════════════════════════════════════════════════════════ */

  var THEME_KEY = 'reg_theme';

  function isDark() {
    return document.documentElement.classList.contains('theme-dark');
  }

  function storeTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); } catch (err) { /* storage unavailable */ }
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
      storeTheme(dark ? 'dark' : 'light');
      sync();
    });

    sync();
  }

  /* ══ 4. MOBILE NAVIGATION ════════════════════════════════════════════ */

  function initMobileNav() {
    var toggle  = document.getElementById('navToggle');
    var panel   = document.getElementById('mobileNav');
    var scrim   = document.getElementById('navScrim');
    if (!toggle || !panel || !scrim) return;

    var closeBtn = panel.querySelector('[data-nav-close]');
    var lastFocus = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function open() {
      lastFocus = document.activeElement;
      panel.hidden = false;
      scrim.hidden = false;
      // next frame, so the transform transition runs
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
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
    });

    scrim.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    panel.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (link) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (toggle.getAttribute('aria-expanded') === 'true') close();
    });

    // Keep the panel's state honest if the viewport grows past the breakpoint.
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

  /* ══ 6. TALLY POPUP MODAL ════════════════════════════════════════════ */

  function initModal() {
    var modal = document.getElementById('contactModal');
    if (!modal) return;

    var dialog     = modal.querySelector('.modal__dialog');
    var closeBtn   = modal.querySelector('[data-modal-close]');
    var overlay    = modal.querySelector('.modal__overlay');
    var embed      = modal.querySelector('[data-tally-modal]');
    var fallback   = modal.querySelector('[data-tally-modal-fallback]');
    var lastFocus  = null;
    var configured = false;

    function open() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');

      if (!configured && embed) {
        if (isConfigured(TALLY.contact)) {
          embed.setAttribute('src', withParams(TALLY.contact, trackingFor('landing_enquiry')));
          embed.hidden = false;
          if (fallback) fallback.hidden = true;
          configured = true;
        } else if (fallback) {
          // No form ID pasted yet, or Tally blocked — the dialog still helps.
          embed.hidden = true;
          fallback.hidden = false;
        }
      }

      window.loadTallyEmbeds && window.loadTallyEmbeds();
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-open-contact]'), function (button) {
      button.addEventListener('click', open);
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
      if (event.key !== 'Tab' || modal.hidden) return;

      var focusables = Array.prototype.filter.call(
        dialog.querySelectorAll('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null; }
      );
      if (!focusables.length) return;

      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  /* ══ 7. TALLY EMBEDS + GRACEFUL DEGRADATION ══════════════════════════ */

  function initEmbeds() {
    var embeds = Array.prototype.slice.call(document.querySelectorAll('.tally-embed'));

    embeds.forEach(function (shell) {
      var source   = shell.getAttribute('data-tally-form');
      var iframe   = shell.querySelector('iframe[data-tally-src]');
      var fallback = shell.querySelector('.form-fallback');
      var url      = TALLY[source];

      if (!iframe) return;

      if (!isConfigured(url)) {
        iframe.hidden = true;
        if (fallback) fallback.hidden = false;
        return;
      }

      iframe.setAttribute('data-tally-src', withParams(url, trackingFor('landing_' + source)));
      iframe.hidden = false;
      if (fallback) fallback.hidden = true;
    });

    // Tally replaces data-tally-src with src and sizes the iframe itself.
    if (!document.querySelector('script[src*="tally.so"]')) {
      var script = document.createElement('script');
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      script.onerror = showEmbedFallbacks;
      document.body.appendChild(script);
    }

    // If the widget never announces itself, offer the plain links instead.
    window.setTimeout(function () {
      if (typeof window.Tally === 'undefined') showEmbedFallbacks();
    }, 6000);
  }

  function showEmbedFallbacks() {
    Array.prototype.forEach.call(document.querySelectorAll('.tally-embed'), function (shell) {
      var iframe   = shell.querySelector('iframe[data-tally-src]');
      var fallback = shell.querySelector('.form-fallback');
      if (!iframe || !fallback) return;
      var src = iframe.getAttribute('src') || iframe.getAttribute('data-tally-src') || '';
      if (!src || PLACEHOLDER.test(src)) return;
      iframe.hidden = true;
      fallback.hidden = false;
      var link = fallback.querySelector('a[data-tally-link]');
      if (link) link.setAttribute('href', src.replace(/[?&](alignLeft|hideTitle|transparentBackground|dynamicHeight)=[^&]*/g, '').replace(/[?&]$/, ''));
    });
  }

  /* ══ 8. FOOTER YEAR ══════════════════════════════════════════════════ */

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
    initModal();
    initEmbeds();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
