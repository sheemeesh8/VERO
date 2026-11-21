/* ------------------------------------------------------------------
   moravchick — after a product is deleted, anywhere, show the same page.

   veroGoDeleted(what, name, back)
     what  'draft'   — a draft was deleted
           'listing' — a listing was deleted for good
           'removed' — a listing was taken off the feed (kept in history)
           'upload'  — the listing being created was thrown away
     name  the product's name, shown on the page
     back  where "Back" returns to (defaults to the page you were on)

   A page shown inside another one (e.g. My products inside the profile) takes
   its parent along, so the confirmation fills the screen and "Back" returns
   to the page the seller was really on.
------------------------------------------------------------------ */
(function () {
    'use strict';
    window.veroGoDeleted = function (what, name, back) {
        var embedded = window.self !== window.top && window.name !== 'vero-phone';
        var w = window;
        if (embedded) { try { void window.parent.location.href; w = window.parent; } catch (e) { w = window; } }
        var here = w.location.pathname.split('/').pop() + w.location.search.replace(/([?&])_ts=\d+&?/, '$1').replace(/[?&]$/, '');
        // Every character outside letters/digits encoded — the app shell only accepts a
        // plain query, and encodeURIComponent leaves ' ( ) * ! ~ as they are.
        var enc = function (v) { return encodeURIComponent(v).replace(/[!'()*~]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }); };
        w.location.href = 'listing-done.html?state=deleted&what=' + enc(what || 'listing') +
            '&name=' + enc(name || '') + '&back=' + enc(back || here);
    };
})();
