/* ============================================================================
   nav-unify.js — one canonical look and motion for every navigation bar.

   The site had two kinds of nav bar:
     • a dark rounded bar with a sliding white pill and a red active label
       (feed nav, buyer area, seller area, dashboard, stats sub-nav), and
     • flat rows of individually-filled pills (settings nav, store-filter tabs,
       inbox tabs).
   This script makes them all match: the same bar shape, the same tab height,
   the same sliding-pill animation and the same red active label. It injects one
   stylesheet with the shared metrics and, for the flat bars that never had a
   sliding indicator, adds one and glides it under the active tab whenever the
   active class changes — so each bar keeps its own tab-switching logic.
   ========================================================================== */
(function () {
    'use strict';

    var RED = '#EB2323';

    // All bars / tabs / indicators share these metrics so heights and motion line up.
    var BARS = '.feed-nav,.sec-nav,.sa-nav,.area-tabs,.stats-subnav,.set-nav,.stf-tabs,.vinbox-tabs';
    var TABS = '.feed-nav-tab,.sec-tab,.sa-tab,.area-tab,.stats-subtab,.set-nav-btn,.stf-tab,.vinbox-tab';
    var INDS = '.feed-nav-ind,.sec-ind,.sa-ind,.area-ind,.stats-subind,.set-ind,.stf-ind,.vinbox-ind';

    var css = [
        BARS + '{background:rgba(20,20,20,0.96)!important;border-color:transparent!important;border-radius:999px!important;}',
        TABS + '{padding:9px 16px!important;font-size:10px!important;min-height:38px!important;border-radius:999px!important;'
             + 'display:inline-flex!important;align-items:center;justify-content:center;}',
        INDS + '{background:#fff!important;box-shadow:none!important;border:none!important;border-radius:999px!important;'
             + 'transition:transform .4s cubic-bezier(0.22,1,0.36,1),width .4s cubic-bezier(0.22,1,0.36,1)!important;}',

        /* Bars that used to be flat rows of pills → a single dark rounded pill bar. */
        '.set-nav,.stf-tabs,.vinbox-tabs{display:flex!important;position:relative;width:-moz-fit-content;width:fit-content;'
            + 'max-width:100%;gap:6px;padding:5px!important;overflow-x:auto;-webkit-overflow-scrolling:touch;'
            + 'margin-left:auto;margin-right:auto;flex-wrap:nowrap!important;box-shadow:0 6px 26px rgba(0,0,0,0.18);}',
        '.set-nav::-webkit-scrollbar,.stf-tabs::-webkit-scrollbar,.vinbox-tabs::-webkit-scrollbar{display:none;}',
        '.set-nav-btn,.stf-tab,.vinbox-tab{position:relative;z-index:1;flex:none;border:none!important;'
            + 'background:transparent!important;color:#b5b5b0!important;letter-spacing:1.2px;text-transform:uppercase;'
            + 'white-space:nowrap;cursor:pointer;transition:color .2s;}',
        '.set-nav-btn:hover,.stf-tab:hover,.vinbox-tab:hover{color:#fff!important;}',
        '.set-nav-btn.is-active,.stf-tab.is-active,.vinbox-tab.active{'
            + 'color:' + RED + '!important;background:transparent!important;border-color:transparent!important;}',
        '.set-ind,.stf-ind,.vinbox-ind{position:absolute;top:5px;bottom:5px;left:0;width:0;z-index:0;pointer-events:none;}',

        /* Keep the already-sliding bars' active label red for a consistent accent. */
        '.feed-nav-tab.is-active,.sec-tab.is-active,.sa-tab.is-active,.area-tab.is-active,.stats-subtab.is-active{'
            + 'color:' + RED + '!important;}'
    ].join('');

    var st = document.createElement('style');
    st.id = 'vero-nav-unify';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);

    // ---- Inject + drive a sliding indicator for the converted bars. ----
    var CONVERT = [
        { bar: '.set-nav',     tab: '.set-nav-btn', active: 'is-active', ind: 'set-ind' },
        { bar: '.stf-tabs',    tab: '.stf-tab',     active: 'is-active', ind: 'stf-ind' },
        { bar: '.vinbox-tabs', tab: '.vinbox-tab',  active: 'active',    ind: 'vinbox-ind' }
    ];

    function enhance(cfg, bar) {
        if (bar.__navuBound) return;
        bar.__navuBound = true;

        var ind = document.createElement('span');
        ind.className = cfg.ind;

        function ensureInd() {
            // The bar's own render may replace its children (e.g. the inbox tabs are
            // rebuilt on every list refresh), wiping our indicator — re-attach it.
            if (ind.parentNode !== bar) bar.insertBefore(ind, bar.firstChild);
        }
        function move(animate) {
            ensureInd();
            var t = bar.querySelector(cfg.tab + '.' + cfg.active);
            if (!t) { ind.style.width = '0px'; return; }
            if (!animate) ind.style.transition = 'none';
            ind.style.width = t.offsetWidth + 'px';
            ind.style.transform = 'translateX(' + t.offsetLeft + 'px)';
            if (!animate) { void ind.offsetWidth; ind.style.transition = ''; }
        }

        ensureInd();
        move(false);

        // Follow the active tab whenever the class or the tab set changes, so we
        // never have to hook each bar's own switch handler.
        var mo = new MutationObserver(function () { move(true); });
        mo.observe(bar, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

        window.addEventListener('resize', function () { move(false); });
        window.addEventListener('load', function () { move(false); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { move(false); });
    }

    function scan() {
        CONVERT.forEach(function (cfg) {
            var bars = document.querySelectorAll(cfg.bar);
            for (var i = 0; i < bars.length; i++) enhance(cfg, bars[i]);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
    else scan();

    // Several of these bars are rendered asynchronously — rescan briefly so we
    // catch (and enhance) them once they appear.
    var tries = 0;
    var iv = setInterval(function () { scan(); if (++tries > 40) clearInterval(iv); }, 250);
})();
