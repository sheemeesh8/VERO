/* ------------------------------------------------------------------
   VERO — one BACK button for the whole site.

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
})();
