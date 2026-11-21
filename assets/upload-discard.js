/* ------------------------------------------------------------------
   moravchick — in the list-an-item flow the header's arrow is an ✕. Leaving
   asks what to do with what was entered: keep it as a draft (→ the "Saved as a
   draft" page) or delete it (→ the "Listing deleted" page), or keep editing.
   (Styles in upload-flow.css.)
------------------------------------------------------------------ */
(function () {
    'use strict';
    var DRAFT_KEY = 'vero_upload_draft';
    var X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    // The confirmation sheet.
    var sheet = document.createElement('div');
    sheet.className = 'pu-confirm';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'puConfirmT');
    sheet.hidden = true;
    sheet.innerHTML =
        '<div class="pu-confirm-box">' +
            '<p class="pu-confirm-t" id="puConfirmT">Leave this listing?</p>' +
            '<p class="pu-confirm-d">Save it as a draft to finish later, or delete everything you\'ve entered — photos, details and price.</p>' +
            '<button type="button" class="pu-confirm-yes pu-confirm-save">Save as draft</button>' +
            '<button type="button" class="pu-confirm-no pu-confirm-del">Delete listing</button>' +
            '<button type="button" class="pu-confirm-keep">Keep editing</button>' +
        '</div>';
    document.body.appendChild(sheet);
    function open() { sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('on'); }); sheet.querySelector('.pu-confirm-keep').focus(); }
    function close() { sheet.classList.remove('on'); setTimeout(function () { sheet.hidden = true; }, 250); }
    sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
    sheet.querySelector('.pu-confirm-keep').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
    // Save as draft: the page's own save (window.veroSaveDraft, set by the upload
    // page) — it writes the listing to the drafts and opens the "Saved as a draft" page.
    sheet.querySelector('.pu-confirm-save').addEventListener('click', function () {
        if (typeof window.veroSaveDraft === 'function') window.veroSaveDraft(this);
    });
    // Delete: drop everything entered and show the "Listing deleted" page.
    sheet.querySelector('.pu-confirm-del').addEventListener('click', function () {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
        location.href = 'listing-done.html?state=deleted';
    });

    // The trees film behind the last step: make sure it is actually playing
    // whenever that step is on screen (phones hold back autoplay on a video
    // that was hidden when the page loaded).
    var film = document.querySelector('.pu-stage-video');
    var slides = document.querySelectorAll('.pu-slide');
    if (film && slides.length) {
        film.muted = true; film.setAttribute('muted', '');
        var lastSlide = slides[slides.length - 1];
        var kick = function () {
            if (!lastSlide.classList.contains('active')) return;
            var p = film.play(); if (p && p.catch) p.catch(function () {});
        };
        new MutationObserver(kick).observe(lastSlide, { attributes: true, attributeFilter: ['class'] });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
        // Any touch on the page also counts as permission to play.
        document.addEventListener('touchstart', kick, { passive: true });
        kick();
    }

    // The header's arrow becomes an ✕: leaving the flow asks first.
    var hdr = document.querySelector('.page-header .ph-back');
    if (hdr) {
        hdr.innerHTML = X;
        hdr.classList.add('ph-x');
        hdr.setAttribute('aria-label', 'Leave listing');
        hdr.addEventListener('click', function (e) {
            e.preventDefault(); e.stopImmediatePropagation();
            open();
        }, true);
    }
})();
