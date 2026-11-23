/* ==========================================================================
   Home intro — the entrance in front of the home hero (feed.html).

   1. White screen: the name, moravchick, in the script wordmark.
   2. The white lifts off the hero's video (the hero itself, under this layer)
      and the name, now white, reads "Welcome to moravchick" over it.
   3. The words fade, the layer goes, and the hero carries on in its regular
      design.

   A tap / key / wheel skips ahead. Scrolling is held until the hand-over.
   Skipped for prefers-reduced-motion, or when the page opens on a #hash.
   Markup: <div class="hi" id="homeIntro">…<span class="hi-name">…</span></div>
   ========================================================================== */
(function () {
    'use strict';
    var el = document.getElementById('homeIntro');
    if (!el) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || location.hash) { el.parentNode.removeChild(el); return; }

    var root = document.documentElement;
    root.classList.add('hi-on');                       // holds the page's scroll

    var stage = 0, timers = [], lastSkip = 0;
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function heroVideo() { return document.getElementById('hmHeroVideo'); }

    // Stage 1 → the name.
    requestAnimationFrame(function () { requestAnimationFrame(function () { go(1); }); });

    function go(n) {
        if (n <= stage) return;
        stage = n;
        el.setAttribute('data-stage', String(n));
        if (n === 1) {
            later(function () { whenVideoReady(function () { go(2); }); }, 1700);
        } else if (n === 2) {
            var v = heroVideo();
            if (v) { try { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
            later(function () { go(3); }, 3000);
        } else if (n === 3) {
            later(done, 900);
        }
    }

    // Wait (briefly) for the hero's video to have a frame, so the white never
    // lifts onto black.
    function whenVideoReady(cb) {
        var v = heroVideo(), fired = false;
        function once() { if (fired) return; fired = true; cb(); }
        if (!v || v.readyState >= 2) return once();
        v.addEventListener('loadeddata', once, { once: true });
        setTimeout(once, 2500);
    }

    function done() {
        if (stage >= 4) return;
        stage = 4;
        timers.forEach(clearTimeout);
        root.classList.remove('hi-on');
        el.setAttribute('data-stage', '4');
        try { window.dispatchEvent(new Event('scroll')); } catch (e) {}
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }

    // Skip ahead: each tap moves to the next step.
    function skip(e) {
        if (e && e.type === 'keydown' && ['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown'].indexOf(e.key) < 0) return;
        var now = Date.now();
        if (now - lastSkip < 700) return;              // one wheel flick = one step
        lastSkip = now;
        timers.forEach(clearTimeout); timers = [];
        if (stage < 2) { go(2); } else if (stage < 3) { go(3); } else { done(); }
    }
    el.addEventListener('click', skip);
    el.addEventListener('wheel', function (e) { e.preventDefault(); if (Math.abs(e.deltaY) > 8) skip(); }, { passive: false });
    el.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', function k(e) { if (stage >= 4) { window.removeEventListener('keydown', k); return; } skip(e); });
})();
