/* ------------------------------------------------------------------
   moravchick — behaviour for the bottom navigation bars (nav-bar.css).

   Normalises every button to an icon (.nb-icon) and a label (.nb-label)
   so all bars share one size, and on the section bars (feed, seller
   area, personal area) shows icons only: tapping a button cross-fades it
   to its label. Bars are built / decorated by JS (nav-icons.js adds the
   icons after load), so this re-runs on DOM changes.
------------------------------------------------------------------ */
(function () {
    'use strict';

    // [bar selector, button selector, icon-only?]
    var BARS = [
        ['.feed-nav:not(#slNav)', '.fn-app:not(.fn-back):not(.fn-cat-item)', true],
        ['#saNav', '.sa-tab', true],
        ['.area-tabs', '.area-tab', true],
        ['#slNav', '.feed-nav-tab', false]   // sale page: category bar keeps its labels
    ];

    // Give a button one icon element and one label element.
    function normalise(btn) {
        if (btn.dataset.nbDone) return true;
        var icon = btn.querySelector(':scope > .vni-ic, :scope > svg, :scope > .fn-c');
        if (!icon) return false;                 // icons not added yet — try again later
        var label = null;
        Array.prototype.slice.call(btn.childNodes).forEach(function (n) {
            if (n === icon) return;
            if (n.nodeType === 3 && n.textContent.trim()) {
                // Bare text (seller / personal area tabs): wrap it.
                label = label || document.createElement('span');
                label.textContent = (label.textContent ? label.textContent + ' ' : '') + n.textContent.trim();
                n.remove();
            } else if (n.nodeType === 1 && !label && n.tagName === 'SPAN' && !/dot|badge|count/.test(n.className)) {
                label = n;
            }
        });
        if (!label) return false;
        if (!label.parentNode) btn.appendChild(label);
        icon.classList.add('nb-icon');
        label.classList.add('nb-label');
        btn.classList.add('nb-item');
        btn.dataset.nbDone = '1';
        return true;
    }

    function apply() {
        var changed = false;
        BARS.forEach(function (def) {
            document.querySelectorAll(def[0]).forEach(function (bar) {
                bar.classList.add('nb-bar');
                if (def[2]) bar.classList.add('nb-iconbar');
                bar.querySelectorAll(def[1]).forEach(function (btn) {
                    if (!btn.dataset.nbDone && normalise(btn)) changed = true;
                });
                if (def[2] && !bar.dataset.nbWired) {
                    bar.dataset.nbWired = '1';
                    // The tapped button shows its label; the others go back to icons.
                    bar.addEventListener('click', function (e) {
                        var btn = e.target.closest && e.target.closest('.nb-item');
                        if (!btn || !bar.contains(btn)) return;
                        bar.querySelectorAll('.nb-item.nb-on').forEach(function (b) { if (b !== btn) b.classList.remove('nb-on'); });
                        btn.classList.add('nb-on');
                    });
                }
            });
        });
        // Let sliding indicators re-measure the buttons.
        if (changed) { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
    }

    function boot() {
        apply();
        var pending = null;
        var obs = new MutationObserver(function () {
            if (pending) return;
            pending = setTimeout(function () { pending = null; apply(); }, 100);
        });
        try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
