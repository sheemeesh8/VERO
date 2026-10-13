/* ============================================================================
   VERO — tier theming.

   One switch that re-skins the whole app by the plan the person is on:
     • BASE (free)  — a calm, neutral line; accents muted to a quiet greige.
     • DME  (paid)  — the richer champagne-gold line; the full visual treatment.

   It only sets a `data-vero-tier` attribute on <html> and re-points a few shared
   accent tokens, so pages opt in simply by reading those tokens (and by checking
   the attribute for tier-specific visuals, e.g. a rich chart vs a plain one).
   Nothing here hard-codes a page's own colours, so it can't break a layout.

   Tier source (first that resolves):
     ?tier=dme | ?tier=free  in the URL  (handy for previewing both)
     localStorage['vero_dme'] === '1'    (the real plan flag, set at checkout)
   Default: free.

   Test/toggle from anywhere:  veroSetTier('dme' | 'free')
   Read:                       veroTier()
   ========================================================================== */
(function () {
    'use strict';
    var KEY = 'vero_dme';

    function resolveTier() {
        try {
            var q = (location.search.match(/[?&]tier=(dme|free)/) || [])[1];
            if (q) { localStorage.setItem(KEY, q === 'dme' ? '1' : '0'); return q; }
        } catch (e) {}
        try { if (localStorage.getItem(KEY) === '1') return 'dme'; } catch (e) {}
        return 'free';
    }

    function injectCSS() {
        if (document.getElementById('veroThemeCSS')) return;
        var st = document.createElement('style');
        st.id = 'veroThemeCSS';
        st.textContent = `
            /* ---- tier tokens: reused by pages via var(--vero-accent) etc. ---- */
            :root[data-vero-tier="free"] {
                --vero-accent: #1b1916;        /* neutral ink — plain, base */
                --vero-accent-soft: #e7e3dc;
                --vero-wash: transparent;
                /* NOTE: base tier deliberately leaves the page's own --accent-gold
                   untouched, so simply loading this file never alters the live look. */
            }
            :root[data-vero-tier="dme"] {
                --vero-accent: #9a7d52;        /* champagne gold — premium */
                --vero-accent-soft: #efe7d8;
                --vero-wash: rgba(154,125,82,.06);
                --accent-gold: #c8a24a;        /* existing token, richer gold */
                --accent-gold-dark: #9a7d52;
            }
            /* A hairline tier accent at the very top of any page that wants it. */
            .vero-tier-rule { height: 2px; background: var(--vero-accent); opacity: .9; }
            /* The yellow DME dot only carries meaning for DME users; on the base
               tier it is hidden, so the base experience stays clean. */
            :root[data-vero-tier="free"] .is-dme::before { display: none; }
        `;
        document.head.appendChild(st);
    }

    function apply(tier) {
        injectCSS();
        document.documentElement.setAttribute('data-vero-tier', tier);
        try { document.dispatchEvent(new CustomEvent('vero:tier', { detail: { tier: tier } })); } catch (e) {}
    }

    window.veroTier = function () {
        return document.documentElement.getAttribute('data-vero-tier') || 'free';
    };
    window.veroSetTier = function (t) {
        t = (t === 'dme') ? 'dme' : 'free';
        try { localStorage.setItem(KEY, t === 'dme' ? '1' : '0'); } catch (e) {}
        apply(t);
        return t;
    };

    // Set as early as possible so the first paint already carries the tier.
    apply(resolveTier());
})();
