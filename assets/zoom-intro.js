/* ==========================================================================
   Zoom intro — the zoom-parallax entrance in front of the home hero slider.

   The page opens on white with the first slide's picture as a narrow, tall
   rectangle. Like the original zoom-parallax, the picture follows the finger:
   swiping (or the wheel) grows it step by step, and letting go part-way lets
   it finish opening by itself. It is a true zoom — the whole picture scales
   up (one GPU transform), it is not re-cropped every frame — and it lands
   exactly on the hero slider's frame, where the slider (already showing the
   same picture) takes over. Scrolling is held until then, so the gesture
   never runs on into the feed.

   Markup: <div class="zpi" id="zpIntro"><div class="zpi-tile"><img></div>…</div>
   Skipped for prefers-reduced-motion, or when the page opens on a #hash.
   ========================================================================== */
(function () {
    'use strict';
    var el = document.getElementById('zpIntro');
    if (!el) return;
    var tile = el.querySelector('.zpi-tile');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || location.hash || !tile) { el.parentNode.removeChild(el); return; }

    var root = document.documentElement;
    root.classList.add('zpi-on');                 // holds the page's scroll (see CSS)

    // A clip box between the layer and the tile: it is the whole screen at rest
    // and closes onto the hero's frame as the picture opens, so the grown
    // picture never spills below the hero.
    var clip = document.createElement('div');
    clip.className = 'zpi-clip';
    tile.parentNode.insertBefore(clip, tile);
    clip.appendChild(tile);
    clip.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
    tile.style.willChange = 'transform';
    tile.style.transformOrigin = '50% 50%';

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    // The zoom ends exactly on the hero slider's frame (it is not always the
    // full screen). Looked up each time: the slider is built after this script.
    function target(W, H) {
        var hero = document.getElementById('feedHeroWrap');
        var r = hero && hero.getBoundingClientRect();
        return (r && r.width > 0 && r.height > 0) ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: W, h: H };
    }

    var p = 0, opened = false, raf = 0;
    var geo = null;
    function measure() {
        var W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
        // Resting: a narrow, tall rectangle — the old zoom-parallax centre tile.
        var w0 = Math.min(W * 0.60, H * 0.40), h0 = Math.min(w0 * 1.75, H * 0.82);
        var t = target(W, H);
        geo = {
            W: W, H: H, w0: w0, h0: h0, t: t,
            // Grow until the rectangle covers the hero frame on both axes.
            sMax: Math.max(t.w / w0, t.h / h0) * 1.02,
            dx: (t.x + t.w / 2) - W / 2,     // the frame's centre vs the screen's
            dy: (t.y + t.h / 2) - H / 2
        };
        tile.style.left = ((W - w0) / 2).toFixed(1) + 'px';
        tile.style.top = ((H - h0) / 2).toFixed(1) + 'px';
        tile.style.width = w0.toFixed(1) + 'px';
        tile.style.height = h0.toFixed(1) + 'px';
    }
    function apply() {
        if (!geo) measure();
        var g = geo;
        // Eased in (like the original): the first bit of the swipe barely moves it.
        var e = p * p * (3 - 2 * p);
        var s = 1 + (g.sMax - 1) * e;
        tile.style.transform = 'translate3d(' + (g.dx * e).toFixed(2) + 'px,' + (g.dy * e).toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
        // The clip closes onto the hero's frame as the picture grows.
        var top = g.t.y * e, left = g.t.x * e;
        var right = (g.W - g.t.x - g.t.w) * e, bottom = (g.H - g.t.y - g.t.h) * e;
        clip.style.clipPath = 'inset(' + top.toFixed(1) + 'px ' + right.toFixed(1) + 'px ' + bottom.toFixed(1) + 'px ' + left.toFixed(1) + 'px)';
        el.style.setProperty('--zpi-cue', String(clamp(1 - p * 4, 0, 1)));
    }
    measure(); apply();
    window.addEventListener('resize', function () { if (!opened) { measure(); apply(); } });

    function setP(v) {
        p = clamp(v, 0, 1);
        if (p >= 1) finish(); else apply();
    }
    // Let go mid-way and the picture finishes opening by itself.
    function run() {
        if (opened || raf) return;
        measure();                                 // the slider is in the page by now
        var from = p, t0 = 0, dur = Math.max(320, 820 * (1 - from));
        function step(now) {
            if (opened) return;
            if (!t0) t0 = now;
            var t = clamp((now - t0) / dur, 0, 1);
            var e = 1 - Math.pow(1 - t, 3);        // ease-out: no stop-and-go at the hand-over
            p = from + (1 - from) * e; apply();
            if (t >= 1) { raf = 0; finish(); return; }
            raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
    }
    function finish() {
        if (opened) return;
        opened = true; p = 1; apply();
        el.classList.add('zpi-done');              // a short fade onto the slider showing the same picture
        root.classList.remove('zpi-on');
        try { window.scrollTo(0, 0); } catch (e) {}
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            window.dispatchEvent(new Event('scroll'));  // let the header re-read its state
        }, 320);
    }

    function travel() { return Math.max(240, window.innerHeight * 0.55); }  // swipe length for the whole zoom

    // Wheel / trackpad: the picture follows the wheel; the page stays held
    // until the gesture (and its inertia) has died down.
    var wheelIdle = 0, wheelHold = false;
    window.addEventListener('wheel', function (ev) {
        if (opened && !wheelHold) return;
        if (ev.cancelable) ev.preventDefault();
        wheelHold = true;
        clearTimeout(wheelIdle);
        wheelIdle = setTimeout(function () { wheelHold = false; if (!opened && p > 0) run(); }, 170);
        if (opened || raf) return;
        if (!geo || p === 0) measure();
        var d = ev.deltaMode === 1 ? ev.deltaY * 32 : ev.deltaMode === 2 ? ev.deltaY * window.innerHeight : ev.deltaY;
        if (d > 0 || p > 0) setP(p + d / travel());
    }, { passive: false });

    // Touch: the picture follows the finger; the swipe that opens it is used up by it.
    var lastY = null, touchHold = false;
    window.addEventListener('touchstart', function (ev) {
        lastY = ev.touches.length ? ev.touches[0].clientY : null;
        touchHold = !opened;
        if (touchHold && p === 0) measure();
    }, { passive: true });
    window.addEventListener('touchmove', function (ev) {
        if (!touchHold) return;
        if (ev.cancelable) ev.preventDefault();
        if (opened || raf || lastY === null || !ev.touches.length) return;
        var y = ev.touches[0].clientY;
        setP(p + (lastY - y) / travel());
        lastY = y;
    }, { passive: false });
    function touchEnd(ev) {
        if (ev.touches && ev.touches.length) return;
        touchHold = false; lastY = null;
        if (!opened && p > 0) run();
    }
    window.addEventListener('touchend', touchEnd, { passive: true });
    window.addEventListener('touchcancel', touchEnd, { passive: true });

    // Keyboard scrolling, or a tap, opens it in one go.
    window.addEventListener('keydown', function (ev) {
        if (opened) return;
        if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter', 'End'].indexOf(ev.key) > -1) { if (ev.cancelable) ev.preventDefault(); run(); }
    });
    el.addEventListener('click', function () { run(); });
})();
