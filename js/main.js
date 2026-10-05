/* ==========================================================================
   EdPal landing page — behaviour
   --------------------------------------------------------------------------
   No dependencies. Loaded with `defer`. Responsibilities:
     1. Tally configuration (the only place form URLs are set)
     2. Attribution parameters appended to those URLs
     3. Theme toggle — shares the app-wide "reg_theme" preference
     4. Mobile navigation (Escape to close, focus management)
     5. FAQ accordion (arrow-key navigation)
     6. The two Tally modals (waitlist and enquiry)
     7. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* ══ 1. TALLY CONFIGURATION ═══════════════════════════════════════════
     Paste the two Tally form URLs here. Nothing else in the project needs
     editing — both modals read from this object and build their iframes from
     it, so there are no form URLs buried in the HTML.
  ══════════════════════════════════════════════════════════════════════ */

  var TALLY = {
    waitlist: 'https://tally.so/embed/Npepop',
    contact:  'https://tally.so/embed/REPLACE_CONTACT_ID'
  };

  /* Query-string parameters Tally reads and applies to matching hidden fields
     in both forms. See README — those hidden fields must exist in the Tally
     form builder for the values to be recorded. */
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

  /* ══ 2. ATTRIBUTION ═══════════════════════════════════════════════════
     utm_source / utm_campaign are read from the page URL when present;
     `source` identifies which form produced the submission.
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

     Nothing inside the Tally modals is themed — see css/main.css section 16.
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
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
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
      if (event.key !== 'Escape') return;
      if (toggle.getAttribute('aria-expanded') === 'true') close();
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

  /* ══ 6. TALLY MODALS ═════════════════════════════════════════════════
     Each modal builds its iframe from TALLY on first open, so the form URL
     lives in exactly one place. If that URL is still a placeholder, or the
     Tally widget never loads, the dialog shows a written fallback with a
     direct link instead of an empty box.
  ══════════════════════════════════════════════════════════════════════ */

  var tallyScriptRequested = false;
  var tallyWidgetLoaded = false;

  function loadTallyWidget() {
    if (tallyScriptRequested) return;
    tallyScriptRequested = true;

    if (document.querySelector('script[src*="tally.so"]')) {
      tallyWidgetLoaded = true;
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    script.onload = function () {
      tallyWidgetLoaded = true;
      if (typeof window.Tally !== 'undefined' && window.Tally.loadEmbeds) {
        window.Tally.loadEmbeds();
      } else {
        showEmbedFallbacks();
      }
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
      if (!isConfigured(url)) {
        // Not configured yet: leave the written fallback on screen.
        iframe.hidden = true;
        fallback.hidden = false;
        return;
      }

      iframe.setAttribute('data-tally-src', withParams(url, trackingFor('landing_' + key)));
      fallback.hidden = true;
    });

    loadTallyWidget();

    // If the widget never identifies itself, fall back to the written links.
    window.setTimeout(function () {
      if (typeof window.Tally === 'undefined') showEmbedFallbacks();
    }, 6000);
  }

  function initTallyModal() {
    var modals = Array.prototype.slice.call(document.querySelectorAll('.modal'));
    if (!modals.length) return;

    var openButton = null;
    var lastFocus = null;

    function configure(modal) {
      var iframe = modal.querySelector('iframe[data-tally-iframe]');
      if (!iframe) return;
      var src = iframe.getAttribute('data-tally-src');
      if (!src) return;
      if (iframe.getAttribute('src') !== src) iframe.setAttribute('src', src);
      iframe.hidden = false;
      var fallback = modal.querySelector('[data-tally-fallback]');
      if (fallback) fallback.hidden = true;
    }

    function open(modal) {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');

      configure(modal);
      loadTallyWidget();
      if (tallyWidgetLoaded && typeof window.Tally !== 'undefined' && window.Tally.loadEmbeds) {
        window.Tally.loadEmbeds();
      }

      var closeBtn = modal.querySelector('[data-modal-close]');
      if (closeBtn) closeBtn.focus();
    }

    function close(modal) {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      var focusTarget = lastFocus && lastFocus.isConnected ? lastFocus : openButton;
      if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
    }

    function openModalFor(button) {
      var id = button.getAttribute('data-tally-open');
      var modal = document.getElementById(id === 'contact' ? 'contactModal' : 'waitlistModal');
      if (!modal) return;
      openButton = button;
      open(modal);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-tally-open], [data-open-contact]'),
      function (button) {
        button.addEventListener('click', function () { openModalFor(button); });
      }
    );

    modals.forEach(function (modal) {
      Array.prototype.forEach.call(modal.querySelectorAll('[data-modal-close]'), function (el) {
        el.addEventListener('click', function () { close(modal); });
      });

      // Tab stays inside the dialog while it is open.
      modal.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') return;
        var dialog = modal.querySelector('.modal__dialog');
        var focusables = Array.prototype.filter.call(
          dialog.querySelectorAll('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'),
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

  /* ══ 7. FOOTER YEAR ══════════════════════════════════════════════════ */

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
    initTallyModal();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
