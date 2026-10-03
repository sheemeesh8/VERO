/* ------------------------------------------------------------------
   moravchick — on the last step of the list-an-item flow, Back becomes
   an ✕ that discards the listing, after a confirmation sheet.
   (Styles in upload-flow.css.)
------------------------------------------------------------------ */
(function () {
    'use strict';
    var DRAFT_KEY = 'vero_upload_draft';
    var back = document.getElementById('puBack');
    var slides = document.querySelectorAll('.pu-slide');
    if (!back || !slides.length) return;
    var last = slides[slides.length - 1];
    var label = back.innerHTML;
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
            '<p class="pu-confirm-t" id="puConfirmT">Delete this listing?</p>' +
            '<p class="pu-confirm-d">Everything you\'ve entered — photos, details and price — will be deleted. This can\'t be undone.</p>' +
            '<button type="button" class="pu-confirm-yes">Delete listing</button>' +
            '<button type="button" class="pu-confirm-no">Keep editing</button>' +
        '</div>';
    document.body.appendChild(sheet);
    function open() { sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('on'); }); sheet.querySelector('.pu-confirm-no').focus(); }
    function close() { sheet.classList.remove('on'); setTimeout(function () { sheet.hidden = true; }, 250); }
    sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
    sheet.querySelector('.pu-confirm-no').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
    sheet.querySelector('.pu-confirm-yes').addEventListener('click', function () {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
        var seller = false;
        try { seller = localStorage.getItem('vero_active_account') === 'seller'; } catch (e) {}
        location.href = seller ? 'seller-area.html' : 'index.html';
    });

    // Swap Back ⇄ ✕ as the last step comes and goes.
    function sync() {
        var onLast = last.classList.contains('active');
        if (onLast === back.classList.contains('pu-x')) return;
        back.classList.toggle('pu-x', onLast);
        back.innerHTML = onLast ? X : label;
        back.setAttribute('aria-label', onLast ? 'Delete listing' : 'Back');
        if (onLast) back.disabled = false;
    }
    new MutationObserver(sync).observe(last, { attributes: true, attributeFilter: ['class'] });
    sync();

    // On the last step the ✕ asks first, instead of stepping back.
    back.addEventListener('click', function (e) {
        if (!back.classList.contains('pu-x')) return;
        e.stopImmediatePropagation(); e.preventDefault();
        open();
    }, true);
})();
