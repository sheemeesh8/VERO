/* ------------------------------------------------------------------
   moravchick — one BACK button for the whole site.

   Loaded on every page. It (1) injects a small stylesheet that gives every
   `.back` control the same shape (a pill with a curved arrow + the word
   "BACK", letterspaced) and (2) replaces the visible content of each
   `.back` element — the href / onclick handlers are left untouched, so
   navigation keeps working exactly as before.
------------------------------------------------------------------ */
(function () {
    var css =
        '.back{gap:9px !important; text-transform:uppercase; letter-spacing:2px !important; font-weight:400;}' +
        '.back .bk-ico{width:26px; height:16px; flex:none; display:block; fill:none;' +
        ' stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round;}' +
        '.back .bk-txt{line-height:1;}';
    var style = document.createElement('style');
    style.setAttribute('data-vero-back', '1');
    style.textContent = css;
    document.head.appendChild(style);

    // Curved arrow that rises from the lower-left and points right, matching the
    // mock. Uses currentColor so it adapts to each page's back-button colour.
    var ARROW = '<svg class="bk-ico" viewBox="0 0 32 20" aria-hidden="true">' +
        '<path d="M4 15 C4 8 9 7 16 7 L28 7"/>' +
        '<path d="M24 3 L28 7 L24 11"/></svg>';

    function norm(el) { el.innerHTML = ARROW + '<span class="bk-txt">Back</span>'; }
    function run() { document.querySelectorAll('.back').forEach(norm); }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();

    /* ------------------------------------------------------------------
       Every page-level BACK button goes back through the browser history,
       so "back" always returns to wherever the user actually came from
       instead of a hard-coded page. The element's href stays as a fallback:
       if there's no history to go back to (the page was opened directly, in
       a fresh tab, or from an external link), we let the normal navigation
       happen. A capture-phase listener runs before any inline onclick, so
       pages that already hard-code history.back() don't fire it twice.
    ------------------------------------------------------------------ */
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('.back, .back-btn');
        if (!el) return;
        // Only hijack when there is real in-app history to return to.
        // referrer check keeps us from stepping back out of the site entirely.
        if (window.history.length > 1) {
            e.preventDefault();
            e.stopPropagation();
            window.history.back();
        }
        // else: fall through — the anchor's href / default action navigates.
    }, true);

    /* ------------------------------------------------------------------
       SPA (in-page) back controls — the search page ("Back to shop") and the
       chat thread ("back to inbox") — switch views by toggling display, not by
       navigating, so the browser / phone back button doesn't know about them.
       This bridge makes them work through history without changing view logic:

         • While such a control is visible, we "arm" one guard history entry.
         • The on-screen control AND the hardware back button both pop that
           entry; on the resulting popstate we run the control's own onclick
           (showMain / vchatOpenInbox) — reusing the existing logic.

       The control's original onclick is preserved and simply invoked, so
       nothing about the view transitions themselves changes.
    ------------------------------------------------------------------ */
    var SPA_BACK_SEL = '.sp-back, .vchat-back';
    var armed = false;

    function spaVisibleBack() {
        var els = document.querySelectorAll(SPA_BACK_SEL);
        for (var i = 0; i < els.length; i++) {
            // offsetParent is null for display:none (hidden) elements.
            if (els[i].offsetParent !== null) return els[i];
        }
        return null;
    }

    // Run a control's native action (its inline onclick), falling back to href.
    function spaRunNative(el) {
        if (typeof el.onclick === 'function') { el.onclick.call(el); return; }
        if (el.getAttribute && el.getAttribute('href')) location.href = el.getAttribute('href');
    }

    // Put one guard entry on the stack once a sub-view is showing, so the next
    // "back" (button or hardware) is consumed by closing the sub-view.
    function spaArm() {
        if (!armed && spaVisibleBack()) {
            armed = true;
            try { window.history.pushState({ veroSpaBack: 1 }, ''); } catch (e) {}
        }
    }

    // Any interaction can be what opened a sub-view; re-check just after it.
    document.addEventListener('click', function () { setTimeout(spaArm, 50); }, true);

    // Clicking the on-screen SPA back control steps back through history
    // (which runs the native action via popstate) instead of firing inline.
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest(SPA_BACK_SEL);
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        if (armed) window.history.back();   // → popstate runs the view's back action
        else spaRunNative(el);              // no guard armed → act directly
    }, true);

    // Hardware / browser back while a sub-view is open: close that sub-view.
    window.addEventListener('popstate', function () {
        var el = spaVisibleBack();
        armed = false;
        if (el) { spaRunNative(el); setTimeout(spaArm, 50); }
    });
})();
