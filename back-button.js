/* ------------------------------------------------------------------
   VERO — shared "back" control.
   A circle with a right-pointing chevron, pinned to the very top-right
   of every page. Single source of truth: edit this file to change the
   back button everywhere.

   Usage:
     <script src="back-button.js"></script>

   It is shown on every page EXCEPT the home page. A page opts out with
     <body data-back="none">
   and index.html sets that attribute while the home view is showing,
   clearing it on the cart / wishlist / category / results views.
------------------------------------------------------------------ */
(function () {
    const STYLES = `
        #veroBack {
            position: fixed;
            /* Topmost and rightmost — above the site header, clear of the edge. */
            top: 18px;
            right: 18px;
            z-index: 200;
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            border-radius: 50%;
            border: 1.5px solid #17242a;
            background: rgba(255,255,255,0.92);
            color: #17242a;
            cursor: pointer;
            padding: 0;
            transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        #veroBack:hover {
            background: #17242a;
            color: #fff;
            transform: scale(1.06);
        }
        #veroBack svg { width: 18px; height: 18px; display: block; }
        /* The page says it is the home view — no back control. */
        body[data-back="none"] #veroBack { display: none; }
        @media (max-width: 620px) {
            #veroBack { width: 40px; height: 40px; top: 12px; right: 12px; }
        }
    `;

    // Chevron pointing right: on a right-to-left site, "back" reads rightwards.
    const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 5 16 12 9 19"></polyline>
        </svg>`;

    // A page can define window.veroOnBack() to handle "back" itself — index.html
    // uses it to step between its own views instead of leaving the page.
    function goBack() {
        if (typeof window.veroOnBack === 'function') { window.veroOnBack(); return; }
        // A same-site referrer means history.back() lands somewhere useful;
        // otherwise (deep link, new tab) fall back to the home page.
        if (document.referrer && document.referrer.indexOf(location.origin) === 0) {
            history.back();
        } else {
            window.location.href = 'index.html';
        }
    }

    function mount() {
        if (!document.getElementById('vero-back-styles')) {
            const st = document.createElement('style');
            st.id = 'vero-back-styles';
            st.textContent = STYLES;
            document.head.appendChild(st);
        }
        if (document.getElementById('veroBack')) return;
        const btn = document.createElement('button');
        btn.id = 'veroBack';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'חזרה');
        btn.title = 'חזרה';
        btn.innerHTML = CHEVRON;
        btn.addEventListener('click', goBack);
        document.body.appendChild(btn);
    }

    // Pages that own several views (index.html) call these as the view changes.
    window.veroShowBack = function () { document.body.removeAttribute('data-back'); };
    window.veroHideBack = function () { document.body.setAttribute('data-back', 'none'); };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
