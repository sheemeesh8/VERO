/* ------------------------------------------------------------------
   moravchick — behaviour for the shared page header (page-header.css).

   The back arrow (.ph-back) returns to wherever the user came from:
     • data-back-target="#id" → clicks the page's own exit control instead
       (upload flows confirm / save a draft before leaving; product pages
       run their own goBack()).
     • an inline onclick (product pages' goBack()) is left to run on its own.
     • otherwise history.back() when there is history, else the href.
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
})();
