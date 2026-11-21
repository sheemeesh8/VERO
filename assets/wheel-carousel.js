/* ------------------------------------------------------------------
   moravchick — Wheel carousel (vanilla port of components/ui/wheel-carousel.tsx)

   The site is plain HTML/JS, so the React component is kept in components/ui as
   the reference and shipped as this port. Same behaviour: items sit on an arc
   that turns like a wheel — drag, mouse wheel, arrow keys, momentum, snapping to
   the nearest item, the far items fading out and shrinking. framer-motion and
   next-themes are not needed: the motion is a requestAnimationFrame loop and the
   site is light-only. prefers-reduced-motion turns off momentum and easing.

   Differences from the React version, both opt-in:
     • loop: false runs the items in a line (first → last) instead of round a
       circle — right for dates, where wrapping back to the start would mislead.
     • render(item, index) returns each item's HTML, so an item can be more than
       a label (the feed's calendar puts a date and an event dot in each).
     • orientation: 'horizontal' lays the arc across the top instead — the top of
       a wheel, its crown at the centre, reaching down to the left and right
       edges. Items stay upright (no rotation) so numbers read straight; you drag
       sideways, and the page still scrolls up and down over it. apexPx is then
       the crown's distance from the top.

     var wheel = VeroWheelCarousel(el, {
       items: [...],                       // anything; render() draws each
       render: function (item, i) { return '...'; },
       onActiveChange: function (item, i) {},
       onSelectedClick: function (item, i) {},  // a tap on the item already chosen
       apexPx: 100,                         // apex in px from the left (instead of apexInset %)
       initialIndex: 0, loop: false,
       radius: 320, spacing: 14, visibleItems: 7, apexInset: 34,
       scrollSpeed: 0.008, dragSpeed: 0.02, snap: true, momentum: true,
       edgeFade: true, edgeFadeSize: 30, label: 'Wheel carousel'
     });
     wheel.setIndex(5);  wheel.destroy();
   Styles: .vwc* in assets/home.css.
------------------------------------------------------------------ */
(function () {
    'use strict';
    var uid = 0;

    function wrapIndex(i, n) { return ((i % n) + n) % n; }
    function shortestOffset(i, rotation, n) {
        var o = i - rotation;
        while (o > n / 2) o -= n;
        while (o < -n / 2) o += n;
        return o;
    }

    window.VeroWheelCarousel = function (host, opts) {
        opts = opts || {};
        var items = opts.items || [];
        var n = items.length;
        if (!host || !n) return null;
        var o = {
            loop: opts.loop !== false,
            horizontal: opts.orientation === 'horizontal',
            radius: opts.radius != null ? opts.radius : 320,
            spacing: opts.spacing != null ? opts.spacing : 14,
            visibleItems: opts.visibleItems != null ? opts.visibleItems : 7,
            apexInset: opts.apexInset != null ? opts.apexInset : 34,
            apexPx: opts.apexPx != null ? opts.apexPx : null,      // the apex in px from the left edge (overrides apexInset)
            scrollSpeed: opts.scrollSpeed != null ? opts.scrollSpeed : 0.008,
            dragSpeed: opts.dragSpeed != null ? opts.dragSpeed : 0.02,
            snap: opts.snap !== false,
            momentum: opts.momentum !== false,
            edgeFade: opts.edgeFade !== false,
            edgeFadeSize: opts.edgeFadeSize != null ? opts.edgeFadeSize : 30,
            render: opts.render || function (it) { return String(it && it.label != null ? it.label : it); },
            label: opts.label || 'Wheel carousel'
        };
        var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        var id = 'vwc' + (++uid);
        var clampR = function (r) { return o.loop ? r : Math.max(0, Math.min(n - 1, r)); };
        var indexOf = function (r) { return o.loop ? wrapIndex(Math.round(r), n) : Math.max(0, Math.min(n - 1, Math.round(r))); };
        var offsetOf = function (i, r) { return o.loop ? shortestOffset(i, r, n) : i - r; };

        var start = indexOf(opts.initialIndex || 0);
        var rotation = start, selected = start, velocity = 0, frame = null;
        var dragging = false, dragY = 0, dragR = 0, prevDragR = 0;

        // ---- DOM ----
        host.classList.add('vwc');
        if (o.horizontal) host.classList.add('vwc-h');
        host.innerHTML =
            '<div class="vwc-stage" role="listbox" tabindex="0" aria-label="' + o.label.replace(/"/g, '&quot;') + '">' +
                '<div class="vwc-list"></div>' +
            '</div>' +
            '<span class="vwc-sr" aria-live="polite"></span>';
        var stage = host.querySelector('.vwc-stage'), list = host.querySelector('.vwc-list'), live = host.querySelector('.vwc-sr');
        if (o.edgeFade) {
            var mask = 'linear-gradient(to bottom, transparent 0%, black ' + o.edgeFadeSize + '%, black ' + (100 - o.edgeFadeSize) + '%, transparent 100%)';
            list.style.maskImage = mask; list.style.webkitMaskImage = mask;
        }
        var nodes = items.map(function (it, i) {
            var el = document.createElement('div');
            el.className = 'vwc-item'; el.id = id + '-item-' + i;
            el.setAttribute('role', 'option'); el.setAttribute('aria-selected', 'false');
            if (o.horizontal) { el.style.left = '50%'; el.style.top = (o.apexPx != null ? o.apexPx : 12) + 'px'; }
            else el.style.left = o.apexPx != null ? o.apexPx + 'px' : o.apexInset + '%';
            el.innerHTML = o.render(it, i);
            list.appendChild(el);
            return el;
        });

        // ---- Paint: place every item on the arc for the current rotation ----
        function paint() {
            for (var i = 0; i < n; i++) {
                var off = offsetOf(i, rotation), el = nodes[i];
                if (Math.abs(off) > o.visibleItems + 1) {
                    if (el.style.display !== 'none') el.style.display = 'none';
                    if (el.__sel) { el.__sel = false; el.classList.remove('is-selected'); el.setAttribute('aria-selected', 'false'); }
                    continue;
                }
                if (el.style.display === 'none') el.style.display = '';
                var angle = off * o.spacing, rad = angle * Math.PI / 180;
                var dist = Math.min(Math.abs(off) / o.visibleItems, 1);
                var scale = 1 - Math.min(Math.abs(off) * 0.04, 0.45);
                var sel = Math.abs(off) < 0.5;
                el.style.opacity = Math.cos(dist * Math.PI / 2).toFixed(3);
                if (o.horizontal) {
                    // Crown of the wheel: x along the arc, dropping toward the sides; upright.
                    var hx = o.radius * Math.sin(rad), hy = o.radius * (1 - Math.cos(rad));
                    el.style.transform = 'translate(' + hx.toFixed(2) + 'px,' + hy.toFixed(2) + 'px) translateX(-50%) scale(' + scale.toFixed(3) + ')';
                } else {
                    var x = -o.radius * (1 - Math.cos(rad)), y = o.radius * Math.sin(rad);
                    el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) translateY(-50%) rotate(' + angle.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
                }
                if (el.__sel !== sel) { el.__sel = sel; el.classList.toggle('is-selected', sel); el.setAttribute('aria-selected', sel); }
            }
            stage.setAttribute('aria-activedescendant', id + '-item-' + selected);
        }

        function commit(next) {
            rotation = clampR(next);
            var idx = indexOf(rotation);
            if (idx !== selected) {
                selected = idx;
                live.textContent = (nodes[idx].textContent || '').trim() + ', ' + (idx + 1) + ' of ' + n;
                if (opts.onActiveChange) opts.onActiveChange(items[idx], idx);
            }
            paint();
        }

        // ---- Momentum, then snap to the nearest item ----
        function run() {
            if (frame !== null) return;
            var tick = function () {
                var more = false;
                if (!dragging && Math.abs(velocity) > 0.0008) {
                    var before = rotation;
                    commit(rotation + velocity);
                    if (!o.loop && rotation === before) velocity = 0;          // ran into an end
                    velocity *= o.momentum && !reduce ? (o.snap ? 0.9 : 0.94) : 0.8;
                    more = true;
                } else if (!dragging && o.snap) {
                    velocity = 0;
                    var target = Math.round(rotation), d = target - rotation;
                    if (Math.abs(d) > 0.001 && !reduce) { commit(rotation + d * 0.22); more = true; }
                    else commit(target);
                } else if (!dragging) velocity = 0;
                frame = more ? requestAnimationFrame(tick) : null;
            };
            frame = requestAnimationFrame(tick);
        }
        function moveBy(k) { velocity = 0; commit(rotation + k); run(); }

        // ---- Input ----
        function onWheel(e) {
            if (e.ctrlKey || e.metaKey) return;                               // pinch-zoom stays the browser's
            var raw = e.deltaY;
            if (o.horizontal) { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; raw = e.deltaX; }   // up/down scrolls the page
            var d = raw * o.scrollSpeed;
            // A linear wheel at its end lets the page scroll on instead of trapping it.
            if (!o.loop && ((d < 0 && rotation <= 0) || (d > 0 && rotation >= n - 1))) return;
            e.preventDefault();
            commit(rotation + d); velocity = d * 0.2; run();
        }
        function onDown(e) {
            if (!e.isPrimary || e.button !== 0) return;
            dragging = true; stage.classList.add('is-dragging'); velocity = 0;
            dragY = o.horizontal ? e.clientX : e.clientY; dragR = rotation; prevDragR = rotation;
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        }
        function onMove(e) {
            if (!dragging) return;
            var next = dragR - ((o.horizontal ? e.clientX : e.clientY) - dragY) * o.dragSpeed;
            velocity = next - prevDragR; prevDragR = next;
            commit(next);
        }
        function onEnd(e) {
            if (!dragging) return;
            dragging = false; stage.classList.remove('is-dragging');
            try { if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId); } catch (err) {}
            run();
        }
        function onKey(e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); moveBy(1); }
            else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); moveBy(-1); }
            else if (e.key === 'Home') { e.preventDefault(); velocity = 0; commit(rotation - selected); run(); }
            else if (e.key === 'End') { e.preventDefault(); velocity = 0; commit(rotation + (n - 1) - selected); run(); }
        }
        // A tap (no drag) on an item turns the wheel to it.
        var downAt = null;
        stage.addEventListener('pointerdown', function (e) { downAt = { x: e.clientX, y: e.clientY }; });
        stage.addEventListener('click', function (e) {
            if (!downAt || Math.abs(o.horizontal ? e.clientX - downAt.x : e.clientY - downAt.y) > 6) return;
            var hit = null, best = 1e9;
            nodes.forEach(function (el, i) {
                if (el.style.display === 'none') return;
                var r = el.getBoundingClientRect(), d;
                if (o.horizontal) { if (e.clientY < r.top - 10 || e.clientY > r.bottom + 10) return; d = Math.abs(r.left + r.width / 2 - e.clientX); }
                else d = Math.abs(r.top + r.height / 2 - e.clientY);
                if (d < best && d < (o.horizontal ? 34 : 26)) { best = d; hit = i; }
            });
            if (hit !== null && hit !== selected) { velocity = 0; commit(rotation + offsetOf(hit, rotation)); run(); }
            else if (hit !== null && hit === selected && opts.onSelectedClick) opts.onSelectedClick(items[hit], hit);
        });
        stage.addEventListener('wheel', onWheel, { passive: false });
        stage.addEventListener('pointerdown', onDown);
        stage.addEventListener('pointermove', onMove);
        stage.addEventListener('pointerup', onEnd);
        stage.addEventListener('pointercancel', onEnd);
        stage.addEventListener('keydown', onKey);

        // Entrance (the React version's appear).
        if (!reduce && opts.appear !== false) { host.classList.add('vwc-appear'); requestAnimationFrame(function () { host.classList.add('vwc-in'); }); }
        live.textContent = (nodes[selected].textContent || '').trim() + ', ' + (selected + 1) + ' of ' + n;
        paint();

        return {
            setIndex: function (i) { var t = indexOf(i); velocity = 0; commit(rotation + offsetOf(t, rotation)); run(); },
            get index() { return selected; },
            destroy: function () {
                if (frame !== null) cancelAnimationFrame(frame);
                stage.removeEventListener('wheel', onWheel);
                host.innerHTML = ''; host.classList.remove('vwc', 'vwc-h', 'vwc-appear', 'vwc-in');
            }
        };
    };
})();
