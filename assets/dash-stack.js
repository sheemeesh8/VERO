/* ============================================================================
   dash-stack.js — the dashboards as a calm list of sections.

   Every part of a dashboard (the headline chart, each titled group, each
   chart card) becomes its own <section class="dsec">. The headline chart and
   the first part stay open; every other part folds down to one row — its
   name, its trend chip and a chevron — and opens when tapped. So a dashboard
   opens as a short, readable page instead of a long wall of charts.

   A folded part keeps its width (it is clipped, not removed), so its chart is
   already drawn at the right size when it opens.
   Styles: assets/dash.css (.dsec …).
   ========================================================================== */
(function veroDashStack() {
    'use strict';
    var BELONGS = /\b(na-sub|po-count|po-tabs|po-viewport|po-more|na-toggle|na-grid|list|quick|grid|lc-x|vkey|vsw)\b/;
    var OPEN_FIRST = 1;                       // titled parts open on arrival (after the headline chart)
    var CHEV = '<svg class="dsec-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    // Group a container's children into sections. A section starts at a section
    // title, at the headline chart, or at a chart card that carries its own title.
    function build(box) {
        var kids = Array.prototype.slice.call(box.children), cur = null, made = [];
        kids.forEach(function (el) {
            if (el.classList.contains('view')) { cur = null; made = made.concat(build(el)); return; }
            if (el.classList.contains('po-modal') || el.classList.contains('dash-head') || el.tagName === 'SCRIPT') { cur = null; return; }   // sheets stay outside
            var starts = el.classList.contains('sec-title') || el.classList.contains('hero-chart') ||
                         (el.classList.contains('card') && !!el.querySelector(':scope > .card-h .card-t')) ||
                         (el.classList.contains('grid') && !!el.querySelector(':scope > .card > .card-h .card-t')) ||
                         (!cur);
            // A card straight after a title (or its helper rows) is that title's content, not a new part.
            if ((el.classList.contains('card') || el.classList.contains('grid')) && cur && cur.lastElementChild &&
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

    // Give a section a header row (name · trend chip · chevron) and a body that folds.
    function fold(sec, open, n) {
        var first = sec.firstElementChild; if (!first) return;
        var titleEl = first.classList.contains('sec-title') ? first : sec.querySelector(':scope > .card > .card-h .card-t, :scope > .grid > .card > .card-h .card-t');
        if (!titleEl) return;                 // nothing to name it by — leave it open

        var body = document.createElement('div'); body.className = 'dsec-b';
        var inner = document.createElement('div'); inner.className = 'dsec-bi';
        while (sec.firstChild) inner.appendChild(sec.firstChild);
        body.appendChild(inner);
        body.id = 'dsecBody' + n;

        var head = document.createElement('button');
        head.type = 'button'; head.className = 'dsec-h';
        head.setAttribute('aria-controls', body.id);
        var name = document.createElement('span'); name.className = 'dsec-t'; name.textContent = titleEl.textContent.trim();
        head.appendChild(name);
        // The trend chip rides in the header, so a folded part still says how it is doing.
        // (Same element, same id — the page's own script keeps filling it in.)
        var pills = inner.querySelectorAll('.card-h .trend-pill');
        if (pills.length === 1) head.appendChild(pills[0]);
        head.insertAdjacentHTML('beforeend', CHEV);
        titleEl.classList.add('dsec-named');  // its text now lives in the header

        sec.appendChild(head); sec.appendChild(body);
        sec.classList.add('dsec--fold');
        function set(on) {
            sec.classList.toggle('is-open', on);
            head.setAttribute('aria-expanded', on ? 'true' : 'false');
            if ('inert' in body) body.inert = !on;
        }
        set(open);
        head.addEventListener('click', function () {
            var on = !sec.classList.contains('is-open');
            set(on);
            // Charts measure themselves; let them (and an embedding page) catch up.
            setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 380);
        });
    }

    function init() {
        var wrap = document.querySelector('main.wrap'); if (!wrap || wrap.dataset.stacked) return;
        wrap.dataset.stacked = '1';
        var secs = build(wrap);
        if (!secs.length) return;
        document.documentElement.classList.add('has-dsec');
        // Each view (Business / Growth) opens with its own first part unfolded.
        var seen = new Map();
        secs.forEach(function (s, i) {
            s.setAttribute('data-n', String(i + 1));
            if (s.querySelector(':scope > .hero-chart')) { s.classList.add('dsec--hero'); return; }
            var k = s.parentNode, c = seen.get(k) || 0;
            seen.set(k, c + 1);
            fold(s, c < OPEN_FIRST, i + 1);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
