/* ------------------------------------------------------------------
   Site-wide Didone hairline boost.

   The display headings across VERO are set in Bodoni Moda / Didot — a
   high-contrast Didone whose hairline (thin) strokes render almost
   invisible. This gives every such element the same subtle stroke boost
   first applied to the hero title, so the thin strokes read clearly
   without the letters turning bold.

   The stroke width is proportional to the font size, so large titles get
   the visible boost you'd expect while small Bodoni labels stay untouched
   (a fixed stroke would over-thicken small text). currentColor keeps it in
   the element's own colour. A MutationObserver re-applies it to content
   added later (feeds, cards, modals).
------------------------------------------------------------------ */
(function () {
    // fontSize(px) * FACTOR = stroke width. Tuned so a 92px title lands on
    // ~0.5px (the hero-title value that reads well).
    var FACTOR = 0.0055;
    var MIN = 0.15;   // below this the stroke is imperceptible — skip it.
    var MAX = 0.6;    // never thicker than this, so it can't go bold.

    function hasDirectText(el) {
        for (var n = el.firstChild; n; n = n.nextSibling) {
            if (n.nodeType === 3 && n.nodeValue.trim()) return true;
        }
        return false;
    }

    function apply(root) {
        if (!root || !root.querySelectorAll) return;
        var els = root.querySelectorAll('*');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.getAttribute('data-didone')) continue;      // already done
            if (!hasDirectText(el)) continue;                  // only text-bearing leaves
            var cs = window.getComputedStyle(el);
            var ff = cs.fontFamily || '';
            if (!/bodoni|didot/i.test(ff)) continue;
            var size = parseFloat(cs.fontSize) || 0;
            var w = Math.min(MAX, size * FACTOR);
            if (w < MIN) { el.setAttribute('data-didone', '0'); continue; }
            w = Math.round(w * 100) / 100;
            el.style.webkitTextStroke = w + 'px currentColor';
            el.style.textStroke = w + 'px currentColor';
            el.setAttribute('data-didone', '1');
        }
    }

    function run() { apply(document.body); }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();

    // Re-apply to dynamically rendered content, coalesced to one pass per frame.
    var pending = false;
    try {
        new MutationObserver(function () {
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () { pending = false; run(); });
        }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
})();
