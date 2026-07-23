/* ============================================================================
   VERO — site-wide animations.

   Adds two gentle, non-intrusive motions site-wide:
     • a soft page fade-in on load, and
     • a reveal-on-scroll (fade + rise) for structural blocks as they enter view.

   Design notes:
   - The "hidden" starting state is applied by JS only. If this script never runs,
     nothing is hidden — the page renders exactly as before. No blank-page risk.
   - prefers-reduced-motion is fully honoured: no motion, everything shown at once.
   - It never touches elements that already animate on hover (product cards, promo
     images, thumbnails) — only calm container-level blocks — so no transform
     clashes and no interference with the manual editor.

   Usage: add near the end of <body>:
     <script src="vero-animations.js"></script>
   ========================================================================== */
(function () {
    'use strict';

    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Container-level blocks that are safe to reveal (no hover-transform of their
    // own, and their own positioned descendants stay anchored to them). Add
    // data-animate to any element to opt it in too.
    const SELECTORS = [
        '[data-animate]',
        '.feed-lead',
        '.htb-square-title',
        '.acat-title',
        '.section-title',
        '.product-banner-info',
        '.product-banner-image',
        '#siteFooter .foot-brand',
        '#siteFooter .foot-col',
        '#siteFooter .foot-bottom'
    ];

    function injectCSS() {
        if (document.getElementById('veroAnimCSS')) return;
        const st = document.createElement('style');
        st.id = 'veroAnimCSS';
        st.textContent = `
            html.va-fade body { opacity: 0; }
            html.va-fade.va-shown body { opacity: 1; transition: opacity 0.6s ease; }
            .va-reveal {
                opacity: 0;
                transform: translateY(26px);
                transition: opacity 0.75s ease, transform 0.75s cubic-bezier(0.22,1,0.36,1);
                transition-delay: var(--va-delay, 0s);
                will-change: opacity, transform;
            }
            .va-reveal.va-in { opacity: 1; transform: none; }
            @media (prefers-reduced-motion: reduce) {
                html.va-fade body { opacity: 1 !important; }
                .va-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
            }
        `;
        document.head.appendChild(st);
    }

    // Soft page fade-in — set on <html> before paint so body starts hidden, then
    // shown on load. Guarded so a failure can never leave the page blank.
    function pageFade() {
        if (reduce) return;
        document.documentElement.classList.add('va-fade');
        const show = () => document.documentElement.classList.add('va-shown');
        if (document.readyState === 'complete') show();
        else window.addEventListener('load', show, { once: true });
        // Safety net: reveal no matter what within 1.2s.
        setTimeout(show, 1200);
    }

    function revealAll() {
        const nodes = [];
        SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (!el.classList.contains('va-reveal') && !el.dataset.vaDone) nodes.push(el);
            });
        });
        if (!nodes.length) return;

        if (reduce || !('IntersectionObserver' in window)) {
            nodes.forEach(el => el.dataset.vaDone = '1');   // no motion, already visible
            return;
        }

        // Stagger elements that share a parent, so groups (e.g. footer columns)
        // rise in sequence rather than all at once.
        const seen = new Map();
        nodes.forEach(el => {
            el.classList.add('va-reveal');
            el.dataset.vaDone = '1';
            const p = el.parentElement;
            const i = seen.get(p) || 0;
            seen.set(p, i + 1);
            el.style.setProperty('--va-delay', Math.min(i * 0.08, 0.4) + 's');
        });

        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('va-in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        nodes.forEach(el => {
            // Anything already in view on load reveals immediately (no wait).
            const r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) {
                requestAnimationFrame(() => el.classList.add('va-in'));
            } else {
                io.observe(el);
            }
        });
    }

    function boot() {
        injectCSS();
        revealAll();
        // The feed and other views build after load; re-scan a few times so newly
        // inserted blocks get the reveal too.
        let n = 0;
        const iv = setInterval(() => { revealAll(); if (++n >= 6) clearInterval(iv); }, 500);
    }

    injectCSS();
    pageFade();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
