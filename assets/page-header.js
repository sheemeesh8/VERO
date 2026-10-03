/* ------------------------------------------------------------------
   moravchick — behaviour for the shared page header (page-header.css).

   The back arrow (.ph-back) returns to wherever the user came from:
     • data-back-target="#id" → clicks the page's own exit control instead
       (upload flows confirm / save a draft before leaving; product pages
       run their own goBack()).
     • an inline onclick (product pages' goBack()) is left to run on its own.
     • otherwise history.back() when there is history, else the href.

   On pages that open on a hero image / video it also switches the header
   from transparent to a solid sticky header once the media is scrolled past.
   Hub pages set the section shown in the title with veroPageTitle(); a page
   embedded in another page hides its own header.
------------------------------------------------------------------ */
(function () {
    /* A page shown inside another page (the seller area's / profile's panels,
       the statistics page's dashboard) uses its host's header, so its own is
       hidden. The phone-frame wrapper is not a host page — it shows the page
       as-is. Runs before the body renders (this script is not deferred). */
    (function markEmbedded() {
        if (window.self === window.top) return;
        // phone-frame.html names its iframe "vero-phone" (readable from inside,
        // unlike the parent's address, which file:// previews block).
        if (window.name !== 'vero-phone') document.documentElement.classList.add('ph-embedded');
    })();

    /* Section title: hub pages (seller area, profile) switch sections in place
       and call veroPageTitle('Statistics') etc. The header shows the page's own
       name while its hero image is on screen, and the section's name once the
       page is scrolled down into the content (or right away on pages without
       a hero). veroPageTitle(null) goes back to the page's own name. */
    var sectionTitle = null;
    function header() { return document.querySelector('.page-header'); }
    function renderTitle() {
        var h = header(); if (!h) return;
        var n = h.querySelector('.ph-name'); if (!n) return;
        if (!h.hasAttribute('data-page-title')) h.setAttribute('data-page-title', n.textContent);
        var overHero = h.classList.contains('ph-overlay') && !h.classList.contains('ph-stuck');
        var text = (sectionTitle && !overHero) ? sectionTitle : h.getAttribute('data-page-title');
        if (n.textContent !== text) n.textContent = text;
    }
    window.veroPageTitle = function (text) {
        sectionTitle = (text || '').trim() || null;
        renderTitle();
    };

    /* Hubs that open a section as a layer over the hero (the profile) tell the
       header it is no longer over the image: veroPageHeaderSolid(true). */
    var forcedSolid = false, refreshOverlay = function () {};
    window.veroPageHeaderSolid = function (on) {
        forcedSolid = !!on;
        refreshOverlay();
    };

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
       while the media is under it, a solid sticky header once the media has
       scrolled past (or, with data-stick="scroll", as soon as the page moves).
       data-hero="fixed" = a full-screen backdrop that never
       scrolls away, so the header simply stays transparent. Scroll events are
       captured so pages that scroll an inner container work too. */
    function initOverlay() {
        var hdr = document.querySelector('.page-header.ph-overlay[data-hero]');
        if (!hdr || hdr.getAttribute('data-hero') === 'fixed') return;
        var hero = document.querySelector(hdr.getAttribute('data-hero'));
        if (!hero) { hdr.classList.add('ph-stuck'); renderTitle(); return; }   // no media: never leave white text on white
        // data-stick="scroll": solid as soon as the page starts to scroll,
        // not only once the media is fully past.
        var early = hdr.getAttribute('data-stick') === 'scroll';
        var update = function () {
            var r = hero.getBoundingClientRect();
            hdr.classList.toggle('ph-stuck', forcedSolid || (early ? r.top < 0 : r.bottom <= hdr.offsetHeight));
            renderTitle();
        };
        refreshOverlay = update;
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
