/* ============================================================================
   dash-stack.js — the dashboards as a calm list of sections.

   Every part of a dashboard (the headline chart, each titled group, each
   chart card) becomes its own <section class="dsec">, shown as one row — its
   name, its trend chip and a chevron — that opens when tapped. The first row
   starts open, and only one row is open at a time (opening one closes the other). So a dashboard opens as a short list of categories instead of
   a long wall of charts.

   A folded part keeps its width (it is clipped, not removed), so its chart is
   already drawn at the right size when it opens.
   Styles: assets/dash.css (.dsec …).
   ========================================================================== */
(function veroDashStack() {
    'use strict';
    var BELONGS = /\b(na-sub|po-count|po-tabs|po-viewport|po-more|na-toggle|na-grid|list|quick|grid|lc-x|vkey|vsw)\b/;
    var OPEN_FIRST = 1;                       // titled parts open on arrival (after the headline chart)
    var EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
    var REDUCE = false; try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
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
        function state(on) {
            sec.classList.toggle('is-open', on);
            head.setAttribute('aria-expanded', on ? 'true' : 'false');
            if ('inert' in body) body.inert = !on;
        }
        state(open);

        // Open / close: the body grows from (or shrinks to) nothing while its
        // content fades and settles into place; the chevron turns with it.
        var anim = null, fade = null;
        function toggle(on) {
            var from = body.getBoundingClientRect().height;      // wherever it is now (also mid-animation)
            if (anim) anim.cancel(); if (fade) fade.cancel();
            state(on);
            if (REDUCE || !body.animate) return;
            var to = on ? inner.scrollHeight : 0;
            var ms = Math.round(Math.min(620, Math.max(300, 240 + Math.abs(to - from) * 0.45)));   // taller parts take a little longer
            sec.classList.add('is-anim');
            anim = body.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: ms, easing: EASE });
            fade = inner.animate(on
                ? [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }]
                : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }],
                { duration: on ? ms : Math.round(ms * 0.7), easing: on ? EASE : 'ease-in', fill: 'both', delay: on ? 60 : 0 });
            var mine = anim;
            anim.onfinish = function () {
                if (anim !== mine) return;
                sec.classList.remove('is-anim'); if (fade) fade.cancel(); anim = fade = null;
                // Charts measure themselves; let them (and an embedding page) catch up.
                try { window.dispatchEvent(new Event('resize')); } catch (e) {}
            };
        }
        sec.__toggle = toggle;
        head.addEventListener('click', function () {
            var on = !sec.classList.contains('is-open');
            if (on) {
                // Only one part open at a time: opening this one closes the others.
                var y0 = head.getBoundingClientRect().top;
                Array.prototype.forEach.call(document.querySelectorAll('.dsec.dsec--fold.is-open'), function (o) {
                    if (o !== sec && o.__toggle) o.__toggle(false);
                });
                // A part closing above makes this one ride up; keep its row where it was tapped.
                setTimeout(function () {
                    var y1 = head.getBoundingClientRect().top;
                    if (Math.abs(y1 - y0) > 4) window.scrollBy({ top: y1 - y0, behavior: REDUCE ? 'auto' : 'smooth' });
                }, REDUCE ? 0 : 640);
            }
            toggle(on);
        });
    }

    function init() {
        var wrap = document.querySelector('main.wrap'); if (!wrap || wrap.dataset.stacked) return;
        wrap.dataset.stacked = '1';
        var secs = build(wrap);
        if (!secs.length) return;
        document.documentElement.classList.add('has-dsec');
        // Every part is a row, the headline chart included (named by its own label,
        // e.g. "Revenue"). Only the first row of the page starts open. On the Growth
        // view the headline is not shown, so its first part is the open one.
        var growth = /[?&]view=growth\b/.test(location.search);
        var opened = 0;
        secs.forEach(function (s, i) {
            s.setAttribute('data-n', String(i + 1));
            var hero = !!s.querySelector(':scope > .hero-chart');
            if (hero) s.classList.add('dsec--hero');
            var vw = s.parentNode.classList.contains('view') ? s.parentNode.getAttribute('data-view') : null;
            var hiddenView = !!vw && vw !== (growth ? 'growth' : 'business');
            var open = !hiddenView && !(hero && growth) && opened < OPEN_FIRST;
            if (open) opened++;
            fold(s, open, i + 1);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
