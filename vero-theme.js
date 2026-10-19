/* ============================================================================
   VERO / moravchick — tier theming + free preview mode.

   Three tiers re-skin the app so you can see how each plan looks, for free:
     • free    — the plain, neutral base (palette left untouched).
     • premium — champagne-gold accents + the DME markers (yellow dots).
     • luxury  — a deeper noir-gold treatment, the richest look.

   It only sets `data-vero-tier` on <html> and re-points a few shared accent
   tokens, so nothing here hard-codes a page's own colours (base never alters
   the live look). While previewing a paid tier a small bar lets you switch
   plans or exit — no payment, pure preview.

   Tier source:  ?tier=free|premium|luxury  ·  localStorage['vero_tier']
   Legacy:       localStorage['vero_dme']==='1' → premium
   API:  veroSetTier('free'|'premium'|'luxury')  ·  veroTier()
   ========================================================================== */
(function () {
    'use strict';
    var KEY = 'vero_tier', LEGACY = 'vero_dme';
    var TIERS = { free: 1, premium: 1, luxury: 1 };
    var LABEL = { premium: 'Premium', luxury: 'Luxury' };

    function norm(t) {
        if (t === 'dme') return 'premium';            // legacy alias
        return TIERS[t] ? t : null;
    }
    function resolveTier() {
        try {
            var q = (location.search.match(/[?&]tier=(free|premium|luxury|dme)/) || [])[1];
            if (q) return norm(q) || 'free';
        } catch (e) {}
        try { var v = localStorage.getItem(KEY); if (norm(v)) return v; } catch (e) {}
        try { if (localStorage.getItem(LEGACY) === '1') return 'premium'; } catch (e) {}
        return 'free';
    }

    function injectCSS() {
        if (document.getElementById('veroThemeCSS')) return;
        var st = document.createElement('style');
        st.id = 'veroThemeCSS';
        st.textContent = `
            :root[data-vero-tier="free"] {
                --vero-accent: #1b1916;
                --vero-accent-soft: #e7e3dc;
                --vero-wash: transparent;
            }
            :root[data-vero-tier="premium"] {
                --vero-accent: #9a7d52;            /* champagne gold */
                --vero-accent-soft: #efe7d8;
                --vero-wash: rgba(154,125,82,.06);
                --accent-gold: #c8a24a;
                --accent-gold-dark: #9a7d52;
            }
            :root[data-vero-tier="luxury"] {
                --vero-accent: #141210;            /* noir */
                --vero-accent-soft: #e8dcc2;
                --vero-wash: rgba(20,18,16,.05);
                --accent-gold: #caa94e;            /* brighter gold on noir */
                --accent-gold-dark: #8c6d2f;
            }
            /* The yellow DME dot shows on any paid tier, hidden on the base. */
            :root[data-vero-tier="free"] .is-dme::before { display: none; }

            /* ---- Free preview bar (only while previewing a paid tier) ---- */
            #veroPreviewBar{position:fixed;left:0;right:0;bottom:0;z-index:99998;
                display:flex;align-items:center;justify-content:center;gap:16px;
                padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));
                background:var(--vero-accent,#1b1916);color:#fff;
                font-family:'Jost','Inter','Segoe UI',sans-serif;
                font-size:11px;letter-spacing:1px;box-shadow:0 -6px 20px rgba(0,0,0,.18);}
            #veroPreviewBar .vpb-dot{width:7px;height:7px;border-radius:50%;background:#f5c518;}
            #veroPreviewBar .vpb-lbl{text-transform:uppercase;font-weight:500;}
            #veroPreviewBar .vpb-tier{color:#f1e4c4;}
            #veroPreviewBar a,#veroPreviewBar button{color:#fff;background:none;border:none;
                font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:0;}
            #veroPreviewBar button{opacity:.75;text-decoration:none;font-size:14px;}
        `;
        document.head.appendChild(st);
    }

    function renderBar(tier) {
        var existing = document.getElementById('veroPreviewBar');
        if (tier === 'free') { if (existing) existing.remove(); return; }
        if (!document.body) return;
        var bar = existing || document.createElement('div');
        bar.id = 'veroPreviewBar';
        bar.setAttribute('dir', 'rtl');
        bar.innerHTML =
            '<span class="vpb-dot"></span>' +
            '<span class="vpb-lbl">תצוגה מקדימה · <span class="vpb-tier">' + (LABEL[tier] || tier) + '</span></span>' +
            '<a data-vpb="plans">שנה חבילה</a>' +
            '<button data-vpb="exit" title="יציאה">✕</button>';
        if (!existing) document.body.appendChild(bar);
        if (!bar.__wired) {
            bar.__wired = true;
            bar.addEventListener('click', function (e) {
                var el = e.target.closest('[data-vpb]'); if (!el) return;
                if (el.getAttribute('data-vpb') === 'exit') { window.veroSetTier('free'); }
                else { // open the plans screen (inside the phone frame when present)
                    if (window.top !== window) { try { window.top.location.hash = '#page=plans.html'; return; } catch (e2) {} }
                    location.href = 'plans.html';
                }
            });
        }
    }

    function apply(tier) {
        tier = norm(tier) || 'free';
        injectCSS();
        document.documentElement.setAttribute('data-vero-tier', tier);
        try { localStorage.setItem(KEY, tier); } catch (e) {}
        try { localStorage.setItem(LEGACY, tier === 'free' ? '0' : '1'); } catch (e) {}  // keep legacy dme checks working
        if (document.body) renderBar(tier);
        else document.addEventListener('DOMContentLoaded', function () { renderBar(tier); }, { once: true });
        try { document.dispatchEvent(new CustomEvent('vero:tier', { detail: { tier: tier } })); } catch (e) {}
    }

    window.veroTier = function () { return document.documentElement.getAttribute('data-vero-tier') || 'free'; };
    window.veroSetTier = function (t) { apply(t); return window.veroTier(); };

    apply(resolveTier());
})();
