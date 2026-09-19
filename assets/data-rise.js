/* ============================================================================
   data-rise.js — shared staggered entrance for loaded data, mirroring the
   sizes menu's szRowIn animation (a soft slide-in, one item after another).

   Each page sets window.VERO_RISE_SELECTOR to the items it wants animated;
   this script animates them once as they appear (works for dynamically
   rendered lists too), and respects prefers-reduced-motion.
   ========================================================================== */
(function veroDataRise() {
    'use strict';
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}

    var SEL = window.VERO_RISE_SELECTOR;
    if (!SEL) return;

    var style = document.createElement('style');
    style.textContent =
        '@keyframes szRowIn{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:translateX(0)}}';
    (document.head || document.documentElement).appendChild(style);

    var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
    var marked = '__veroRise';

    function isSeen(el) { return seen ? seen.has(el) : el[marked]; }
    function mark(el)  { if (seen) seen.add(el); else el[marked] = 1; }

    function play() {
        var items;
        try { items = document.querySelectorAll(SEL); } catch (e) { return; }
        var i = 0;
        items.forEach(function (el) {
            if (isSeen(el)) return;
            mark(el);
            el.style.animation = 'szRowIn 0.5s cubic-bezier(0.22,1,0.36,1) both';
            // Stagger like the sizes menu, capped so long lists stay snappy.
            el.style.animationDelay = (0.04 + Math.min(i, 8) * 0.07).toFixed(2) + 's';
            i++;
        });
    }

    var pending = false;
    function schedule() {
        if (pending) return;
        pending = true;
        setTimeout(function () { pending = false; play(); }, 30);
    }

    function boot() {
        play();
        try {
            new MutationObserver(schedule).observe(document.body || document.documentElement,
                { childList: true, subtree: true });
        } catch (e) {}
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
