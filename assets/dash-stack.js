/* ============================================================================
   dash-stack.js — the dashboards as a stack of sticky sections.

   Every part of a dashboard (the headline chart, each titled group, each
   chart card) becomes its own full-height <section class="dsec">. Sections
   are sticky, so while you scroll each one stays in place and the next rises
   over it like a sheet laid on top; the one underneath eases back and dims.

   A section taller than the screen first scrolls to its end, then sticks:
   its sticky offset is (screen height − its own height), kept up to date as
   content changes (a chart flipped to a pie, "show more", a new range).
   Styles: assets/dash.css (.dsec …).
   ========================================================================== */
(function veroDashStack() {
    'use strict';
    var BELONGS = /\b(na-sub|po-count|po-tabs|po-viewport|po-more|na-toggle|na-grid|list|quick|grid|lc-x|vkey|vsw)\b/;

    // Group a container's children into sections. A section starts at a section
    // title, at the headline chart, or at a chart card that carries its own title.
    function build(box) {
        var kids = Array.prototype.slice.call(box.children), cur = null, made = [];
        kids.forEach(function (el) {
            if (el.classList.contains('view')) { cur = null; made = made.concat(build(el)); return; }
            if (el.classList.contains('po-modal') || el.classList.contains('dash-head') || el.tagName === 'SCRIPT') { cur = null; return; }   // sheets stay outside
            var starts = el.classList.contains('sec-title') || el.classList.contains('hero-chart') ||
                         (el.classList.contains('card') && !!el.querySelector(':scope > .card-h .card-t')) ||
                         (!cur);
            // A card straight after a title (or its helper rows) is that title's content, not a new part.
            if (el.classList.contains('card') && cur && cur.lastElementChild &&
                (cur.lastElementChild.classList.contains('sec-title') || /\b(na-sub|po-count|po-tabs)\b/.test(cur.lastElementChild.className))) starts = false;
            if (!starts && !(BELONGS.test(el.className) || el.classList.contains('card'))) starts = true;
            if (starts) {
                cur = document.createElement('section');
                cur.className = 'dsec';
                box.insertBefore(cur, el);
                made.push(cur);
            }
            cur.appendChild(el);
        });
        return made;
    }

    function init() {
        var wrap = document.querySelector('main.wrap'); if (!wrap || wrap.dataset.stacked) return;
        wrap.dataset.stacked = '1';
        var secs = build(wrap);
        if (!secs.length) return;
        document.documentElement.classList.add('has-dsec');
        secs.forEach(function (s, i) { s.style.zIndex = String(i + 1); s.setAttribute('data-n', String(i + 1)); });

        // Sticky offset: 0 for a section that fits the screen, negative for a taller one.
        var vh = function () { return window.innerHeight || document.documentElement.clientHeight || 800; };
        function measure() {
            var h = vh();
            secs.forEach(function (s) { s.style.setProperty('--dsec-top', Math.min(0, h - s.offsetHeight) + 'px'); });
            cover();
        }
        // How far the next sheet has risen over each section: 0 = clear, 1 = fully covered.
        var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
        var ticking = false;
        function cover() {
            ticking = false;
            if (reduce) return;
            var h = vh(), shown = secs.filter(function (s) { return s.offsetParent !== null; });
            shown.forEach(function (s, i) {
                var next = shown[i + 1], c = 0;
                if (next) c = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / h));
                s.style.setProperty('--dsec-cover', c.toFixed(3));
            });
        }
        function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(cover); } }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', measure);
        if (window.ResizeObserver) { var ro = new ResizeObserver(measure); secs.forEach(function (s) { ro.observe(s); }); }
        measure(); setTimeout(measure, 400); setTimeout(measure, 1500);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
