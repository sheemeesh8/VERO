/* ============================================================================
   moravchick — site-wide animations.

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

/* ============================================================================
   VERO — luxury behaviour layer (built on top of the calm reveal above).

   Three quiet, tactile motions that make the app FEEL high-end, applied to the
   pages that already exist:
     • image "develop" — product photos resolve from a soft blur to sharp, like
       a print coming up, instead of popping in,
     • tactile press    — buttons/CTAs give a gentle spring on touch,
     • count-up         — any [data-count-to] number counts up when it enters view
       (the savings/DME figures use this).

   Same safety contract as above: JS-only hidden states, prefers-reduced-motion
   fully honoured, nothing can leave the page blank, and it re-scans so content
   that builds after load (the feed) is covered too.
   ========================================================================== */
(function () {
    'use strict';
    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Product-photo selectors across the existing surfaces (feed, category,
    // sliders, cart). Kept conservative so icons/hero art are untouched.
    const PHOTO_SEL = [
        '.achs-photo', '.acard img', '.product-card img', '.hr-card img',
        '.promo-image img', '.featured-image img', '.category-card img'
    ].join(',');

    // Elements that should feel tactile on press (buttons/CTAs only — never the
    // hover-transform cards, so there's no transform clash).
    const PRESS_SEL = [
        '.hero-cta', '.promo-buy', '.achs-buy', '.vbtn', '.hdr-apply',
        '.acc-head', '.tb-ico', '.tb-back', 'button'
    ].join(',');

    function injectLuxeCSS() {
        if (document.getElementById('veroLuxeCSS')) return;
        const st = document.createElement('style');
        st.id = 'veroLuxeCSS';
        st.textContent = `
            .vx-develop { filter: blur(14px); transform: scale(1.05); opacity: .55;
                transition: filter 1.1s cubic-bezier(.22,1,.36,1),
                            transform 1.2s cubic-bezier(.22,1,.36,1), opacity .8s ease;
                will-change: filter, transform, opacity; }
            .vx-develop.vx-done { filter: blur(0); transform: scale(1); opacity: 1; }
            .vx-press { transition: transform .35s cubic-bezier(.22,1,.36,1); }
            .vx-press.vx-down { transform: scale(.97); }
            /* DME marker — a small yellow dot flags anything added as DME, so it's
               identifiable at a glance while we build. Applied site-wide wherever a
               card carries .is-dme (set by product-overrides cardClass). */
            .is-dme { position: relative; }
            .is-dme::before {
                content: ''; position: absolute; z-index: 4;
                top: 8px; inset-inline-start: 8px;
                width: 8px; height: 8px; border-radius: 50%;
                background: #f5c518; box-shadow: 0 0 0 2px rgba(255,255,255,.9);
                pointer-events: none;
            }
            @media (prefers-reduced-motion: reduce) {
                .vx-develop { filter: none !important; transform: none !important;
                    opacity: 1 !important; transition: none !important; }
            }
        `;
        document.head.appendChild(st);
    }

    function develop(img) {
        if (img.dataset.vxDev) return;
        img.dataset.vxDev = '1';
        if (reduce) return;                        // leave sharp, no motion
        // Skip tiny images (icons/avatars) — only real photos "develop".
        const done = () => img.classList.add('vx-done');
        img.classList.add('vx-develop');
        if (img.complete && img.naturalWidth) requestAnimationFrame(done);
        else {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', () => img.classList.remove('vx-develop'), { once: true });
        }
        // Safety net so an image can never stay blurred.
        setTimeout(done, 1600);
    }

    function scanPhotos() {
        document.querySelectorAll(PHOTO_SEL).forEach(img => {
            if (img.dataset.vxDev) return;
            const w = img.getAttribute('width') || img.clientWidth || 0;
            if (w && w < 48) { img.dataset.vxDev = '1'; return; }   // icon-sized → skip
            develop(img);
        });
    }

    function markPress() {
        document.querySelectorAll(PRESS_SEL).forEach(el => {
            if (!el.dataset.vxPress) { el.dataset.vxPress = '1'; el.classList.add('vx-press'); }
        });
    }

    function countUp(el) {
        if (el.dataset.vxCounted) return;
        el.dataset.vxCounted = '1';
        const to = parseFloat(el.getAttribute('data-count-to')) || 0;
        const pre = el.getAttribute('data-count-prefix') || '';
        const fmt = n => pre + Math.round(n).toLocaleString('he-IL');
        if (reduce) { el.textContent = fmt(to); return; }
        let start = null; const dur = 1300;
        const step = t => {
            if (!start) start = t;
            const p = Math.min((t - start) / dur, 1);
            el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function scanCounts() {
        const nodes = document.querySelectorAll('[data-count-to]:not([data-vx-counted])');
        if (!nodes.length) return;
        if (reduce || !('IntersectionObserver' in window)) { nodes.forEach(countUp); return; }
        const io = new IntersectionObserver(es => es.forEach(e => {
            if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); }
        }), { threshold: .4 });
        nodes.forEach(n => {
            const r = n.getBoundingClientRect();
            if (r.top < innerHeight && r.bottom > 0) countUp(n); else io.observe(n);
        });
    }

    // Tactile press — one delegated listener pair for the whole document.
    function armPress() {
        if (document.__vxPress) return; document.__vxPress = true;
        document.addEventListener('pointerdown', e => {
            const t = e.target.closest && e.target.closest('.vx-press');
            if (t) t.classList.add('vx-down');
        }, { passive: true });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
            document.addEventListener(ev, () => {
                document.querySelectorAll('.vx-press.vx-down')
                    .forEach(el => el.classList.remove('vx-down'));
            }, { passive: true }));
    }

    function scan() { scanPhotos(); markPress(); scanCounts(); }

    function boot() {
        injectLuxeCSS();
        armPress();
        scan();
        // The feed and other views build after load — re-scan a few times.
        let n = 0; const iv = setInterval(() => { scan(); if (++n >= 8) clearInterval(iv); }, 500);
    }

    injectLuxeCSS();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
