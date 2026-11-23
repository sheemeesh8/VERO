/* ==========================================================================
   Zoom intro — the zoom-parallax entrance in front of the home hero slider.

   The page opens on white with the first slide's picture as a narrow, tall
   rectangle. The first scroll / swipe / key / tap grows it to full screen
   (scrolling is held until then, so the gesture never runs on into the feed);
   once it fills the screen the layer fades away and the Lumina slider below,
   already showing that same picture, takes over.

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

    // The zoom ends exactly on the hero slider's frame (it is not always the
    // full screen), so the hand-over to the slider has no jump.
    // (Looked up each time: this script runs before the slider is in the page.)
    function target(W, H) {
        var hero = document.getElementById('feedHeroWrap');
        var r = hero && hero.getBoundingClientRect();
        return (r && r.width > 0 && r.height > 0) ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: W, h: H };
    }
    function size(p) {
        var W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
        // Resting: a narrow, tall rectangle — the old zoom-parallax centre tile.
        var w0 = Math.min(W * 0.60, H * 0.40), h0 = Math.min(w0 * 1.75, H * 0.82);
        var x0 = (W - w0) / 2, y0 = (H - h0) / 2;
        var t = target(W, H);
        var e = p * p * (3 - 2 * p);              // smoothstep
        tile.style.left   = (x0 + (t.x - x0) * e).toFixed(1) + 'px';
        tile.style.top    = (y0 + (t.y - y0) * e).toFixed(1) + 'px';
        tile.style.width  = (w0 + (t.w - w0) * e).toFixed(1) + 'px';
        tile.style.height = (h0 + (t.h - h0) * e).toFixed(1) + 'px';
        el.style.setProperty('--zpi-cue', String(1 - Math.min(1, p * 4)));
        el.style.setProperty('--zpi-dim', String(e));   // the slider's scrim, faded in
    }
    size(0);
    window.addEventListener('resize', function () { if (!started) size(0); });

    var started = false;
    function start(ev) {
        if (ev && ev.cancelable) ev.preventDefault();
        if (started) return;
        started = true;
        var t0 = null, DUR = 950;
        function step(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min(1, (ts - t0) / DUR);
            size(p);
            if (p < 1) { requestAnimationFrame(step); return; }
            el.classList.add('zpi-done');         // fade the white layer away
            setTimeout(finish, 420);
        }
        requestAnimationFrame(step);
    }
    function finish() {
        root.classList.remove('zpi-on');
        try { window.scrollTo(0, 0); } catch (e) {}
        window.removeEventListener('wheel', onWheel, opts);
        window.removeEventListener('touchmove', start, opts);
        window.removeEventListener('keydown', onKey, false);
        if (el.parentNode) el.parentNode.removeChild(el);
        window.dispatchEvent(new Event('scroll'));  // let the header re-read its state
    }
    var opts = { passive: false };
    function onWheel(ev) { if (ev.deltaY > 0 || started) start(ev); else if (ev.cancelable) ev.preventDefault(); }
    function onKey(ev) {
        if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter', 'End'].indexOf(ev.key) > -1) start(ev);
    }
    window.addEventListener('wheel', onWheel, opts);
    window.addEventListener('touchmove', start, opts);
    window.addEventListener('keydown', onKey, false);
    el.addEventListener('click', start);
})();
