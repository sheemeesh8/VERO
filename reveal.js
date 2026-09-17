/* ============================================================================
   reveal.js — shared entrance animations.

   A single, safe, site-wide "reveal on enter" system: content blocks fade and
   rise into place as they scroll into view, with a small stagger so a page
   assembles itself piece by piece. Include it near the end of <body>:

       <script src="reveal.js" defer></script>

   Design goals:
     • Fail OPEN. Elements are only hidden AFTER we've confirmed we can reveal
       them (IntersectionObserver present). If anything goes wrong, or motion is
       reduced, or a hard fallback timer fires, everything is fully visible.
     • Don't fight the app. Fixed / sticky / absolute chrome (bars, headers,
       sliders, scroll-snap tracks) is never touched.
     • Cheap. One observer, unobserve after the first reveal.
   ========================================================================== */
(function veroReveal() {
    'use strict';

    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    // No IO support or reduced motion → leave everything visible, do nothing.
    if (reduce || typeof IntersectionObserver === 'undefined') return;

    // Content blocks worth revealing. Kept conservative: real content, not chrome.
    var SEL = [
        '.doc > *',
        'main > *',
        '.cat-section',
        '.card', '.kpi', '.grid > *',
        '.product-card',
        '.cart-empty',
        'section'
    ].join(',');

    // Anything matching these (or living inside one) is left alone — it is
    // chrome, a fixed bar, or a surface that runs its own motion / scroll-snap.
    var SKIP_CLOSEST = [
        '[class*="topbar"]', '[class*="nav"]', 'header', 'footer',
        '[class*="slider"]', '[class*="scroll"]', '[class*="hero"]',
        '.feed-nav', '.sale-catbar', '.cart-actionbar', '#veroCookie',
        '[data-no-reveal]'
    ].join(',');

    function isChrome(el) {
        var pos;
        try { pos = getComputedStyle(el).position; } catch (e) { return true; }
        if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute') return true;
        return !!(el.closest && el.closest(SKIP_CLOSEST));
    }

    function run() {
        var nodes;
        try { nodes = document.querySelectorAll(SEL); } catch (e) { return; }
        var list = [];
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (el.__revealed || isChrome(el)) continue;
            // Skip tiny/empty wrappers and things already off-screen-managed.
            list.push(el);
        }
        if (!list.length) return;

        var style = document.getElementById('vero-reveal-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'vero-reveal-styles';
            style.textContent =
                '.vr-init{opacity:0;transform:translateY(14px);will-change:opacity,transform;}' +
                '.vr-in{opacity:1;transform:none;' +
                'transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1);}';
            document.head.appendChild(style);
        }

        // Hide now (fail-open: only after we know we can reveal).
        list.forEach(function (el) { el.classList.add('vr-init'); el.__revealed = false; });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var el = e.target;
                if (el.__revealed) return;
                el.__revealed = true;
                // Stagger siblings that land together for a gentle cascade.
                var delay = Math.min((el.__vrIndex || 0) % 6, 5) * 60;
                setTimeout(function () { el.classList.remove('vr-init'); el.classList.add('vr-in'); }, delay);
                io.unobserve(el);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

        list.forEach(function (el, i) { el.__vrIndex = i; io.observe(el); });

        // Hard fail-safe: whatever happens, reveal everything after 1.8s so no
        // content can ever get stranded invisible.
        setTimeout(function () {
            list.forEach(function (el) {
                if (!el.__revealed) { el.__revealed = true; el.classList.remove('vr-init'); el.classList.add('vr-in'); }
            });
        }, 1800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
    // Re-scan once more after late content (JS-built lists) has had time to mount.
    setTimeout(run, 700);
})();
