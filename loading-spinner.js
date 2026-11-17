/* ==========================================================================
   loading-spinner.js — "Snowball" loading overlay (vanilla port)
   --------------------------------------------------------------------------
   Vanilla port of components/ui/snow-ball-loading-spinner.tsx. Injects a
   full-screen loading overlay and exposes a tiny global API:

       window.veroLoader.show('Loading…')   // show (optional label)
       window.veroLoader.hide()             // fade out + remove
       window.veroLoader.element            // the overlay node, or null

   Auto behaviour (a page just needs this one <script> tag):
     - Shows the overlay as soon as the script runs.
     - Hides it on window 'load', after a minimum on-screen time so it never
       just flashes, with a hard timeout fallback so it can't get stuck.

   Opt out / tune via data-attributes on the <script> tag:
       <script src="loading-spinner.js"
               data-auto="false"      // don't auto-show on load
               data-label="Curating"  // overlay caption
               data-min="700"         // min visible ms (default 600)
               data-timeout="9000">   // safety hide ms (default 8000)
   ========================================================================== */
(function () {
  'use strict';

  var MARKUP =
    '<div class="pl" role="progressbar" aria-label="Loading">' +
      '<div class="pl__outer-ring"></div>' +
      '<div class="pl__inner-ring"></div>' +
      '<div class="pl__track-cover"></div>' +
      '<div class="pl__ball">' +
        '<div class="pl__ball-texture"></div>' +
        '<div class="pl__ball-outer-shadow"></div>' +
        '<div class="pl__ball-inner-shadow"></div>' +
        '<div class="pl__ball-side-shadows"></div>' +
      '</div>' +
    '</div>';

  var current = null;   // active overlay element
  var hideTimer = null;

  // Make sure loading-spinner.css is present (so a page only needs the JS).
  function ensureStyles() {
    if (document.querySelector('link[data-vero-loader-css], style[data-vero-loader-css]')) return;
    var here = document.currentScript && document.currentScript.src;
    var href = here ? here.replace(/loading-spinner\.js(\?.*)?$/, 'loading-spinner.css') : 'loading-spinner.css';
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-vero-loader-css', '');
    (document.head || document.documentElement).appendChild(link);
  }

  function show(label) {
    ensureStyles();
    if (current) {
      if (label != null) setLabel(label);
      return current;
    }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    var overlay = document.createElement('div');
    overlay.className = 'vero-loader-overlay';
    overlay.innerHTML = MARKUP;
    if (label) {
      var cap = document.createElement('div');
      cap.className = 'vero-loader-label';
      cap.textContent = label;
      overlay.appendChild(cap);
    }
    overlay.__shownAt = Date.now();
    (document.body || document.documentElement).appendChild(overlay);
    current = overlay;
    return overlay;
  }

  function setLabel(label) {
    if (!current) return;
    var cap = current.querySelector('.vero-loader-label');
    if (!cap && label) {
      cap = document.createElement('div');
      cap.className = 'vero-loader-label';
      current.appendChild(cap);
    }
    if (cap) cap.textContent = label || '';
  }

  function hide() {
    if (!current) return;
    var overlay = current;
    current = null;
    overlay.classList.add('is-hiding');
    var done = function () { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); };
    var onEnd = function () { overlay.removeEventListener('transitionend', onEnd); done(); };
    overlay.addEventListener('transitionend', onEnd);
    setTimeout(done, 700); // fallback if transitionend doesn't fire
  }

  window.veroLoader = {
    show: show,
    hide: hide,
    setLabel: setLabel,
    get element() { return current; }
  };

  // ---- Auto page-load behaviour -----------------------------------------
  var s = document.currentScript;
  var data = (s && s.dataset) || {};
  if (String(data.auto) === 'false') return;

  var minMs = parseInt(data.min, 10); if (isNaN(minMs)) minMs = 600;
  var timeoutMs = parseInt(data.timeout, 10); if (isNaN(timeoutMs)) timeoutMs = 8000;
  var label = data.label || '';

  var overlay = show(label);

  function finish() {
    if (!current) return;
    var elapsed = Date.now() - (overlay.__shownAt || Date.now());
    var wait = Math.max(0, minMs - elapsed);
    hideTimer = setTimeout(hide, wait);
  }

  if (document.readyState === 'complete') {
    finish();
  } else {
    window.addEventListener('load', finish, { once: true });
  }
  // Safety net: never let the loader get stuck.
  setTimeout(function () { if (current) hide(); }, timeoutMs);
})();
