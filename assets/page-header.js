/* ------------------------------------------------------------------
   moravchick — behaviour for the shared page header (page-header.css).

   The back arrow (.ph-back) returns to wherever the user came from:
     • data-back-target="#id" → clicks the page's own exit control instead
       (upload flows confirm / save a draft before leaving; product pages
       run their own goBack()).
     • an inline onclick (product pages' goBack()) is left to run on its own.
     • otherwise history.back() when there is history, else the href.

   On pages that open on a hero image / video it also switches the header
   from transparent to a solid sticky header as soon as the page scrolls.
------------------------------------------------------------------ */
(function () {
    document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.ph-back');
        if (!b || b.hasAttribute('onclick')) return;   // inline handler (e.g. goBack()) runs itself
        var sel = b.getAttribute('data-back-target');
        var own = sel && document.querySelector(sel);
        if (own) { e.preventDefault(); own.click(); return; }
        if (window.history.length > 1) { e.preventDefault(); window.history.back(); }
        // else: the link's href navigates (page opened directly / in a new tab).
    });

    /* Header over a hero image / video (data-hero="<selector>"): transparent
       at the top of the page, a solid sticky header as soon as the page is
       scrolled (past 24px — the same threshold as the product page's top
       bar). data-hero="fixed" = a full-screen backdrop that never scrolls
       away, so the header simply stays transparent. Pages that scroll an
       inner container (the seller area) are measured on that container. */
    function initOverlay() {
        var hdr = document.querySelector('.page-header.ph-overlay[data-hero]');
        if (!hdr || hdr.getAttribute('data-hero') === 'fixed') return;
        var hero = document.querySelector(hdr.getAttribute('data-hero'));
        if (!hero) { hdr.classList.add('ph-stuck'); return; }   // no media: never leave white text on white
        // The element that scrolls the hero: its nearest scrollable ancestor, else the page.
        var scroller = hero.parentElement;
        while (scroller && scroller !== document.body && scroller !== document.documentElement) {
            var oy = getComputedStyle(scroller).overflowY;
            if ((oy === 'auto' || oy === 'scroll') && scroller.scrollHeight > scroller.clientHeight) break;
            scroller = scroller.parentElement;
        }
        var inner = scroller && scroller !== document.body && scroller !== document.documentElement;
        var update = function () {
            var y = inner ? scroller.scrollTop : (window.scrollY || document.documentElement.scrollTop);
            hdr.classList.toggle('ph-stuck', y > 24);
        };
        document.addEventListener('scroll', update, { passive: true, capture: true });
        window.addEventListener('resize', update);
        update();
    }
    // Browsers without :has() — hide the feed's site header if header.js added one.
    function hideSiteHeader() {
        var sh = document.getElementById('siteHeader');
        if (sh && document.querySelector('.page-header')) sh.style.display = 'none';
    }
    function init() { initOverlay(); hideSiteHeader(); window.addEventListener('load', hideSiteHeader); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
