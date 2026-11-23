/* ==========================================================================
   Home intro — a spy-film opening in front of the home hero (feed.html).

   1. dots     Black screen; white dots slide across, the last stops centred.
   2. iris     The last dot becomes a round hole — a lens iris — onto the
               hero's video (the hero itself, under this layer), and widens a little.
   3. open     The iris opens out to the full screen.
   4. name     moravchick, in the script wordmark, over the video.
   5. welcome  "Welcome to moravchick" — or, for a signed-in member with a
               first name, "Welcome, <first name>".
   6. out      The words fade, the layer goes, the hero carries on.

   A tap / key / wheel skips ahead. Scrolling is held until the hand-over.
   Skipped for prefers-reduced-motion, or when the page opens on a #hash.
   ========================================================================== */
(function () {
    'use strict';
    var el = document.getElementById('homeIntro');
    if (!el) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || location.hash) { el.parentNode.removeChild(el); return; }

    var root = document.documentElement;
    root.classList.add('hi-on');                       // holds the page's scroll

    var shade = document.getElementById('hiShade'), lens = document.getElementById('hiLens'),
        last = document.getElementById('hiLast');

    // The member's first name (signed in only): vero_profile.name holds the
    // first name (the surname is kept apart in lastName); take its first word.
    (function personalise() {
        var first = '';
        try {
            if (localStorage.getItem('vero_session')) {
                var prof = JSON.parse(localStorage.getItem('vero_profile') || '{}') || {};
                first = String(prof.name || '').trim().split(/\s+/)[0] || '';
            }
        } catch (e) {}
        var slot = document.getElementById('hiFirst'), lead = el.querySelector('.hi-welcome');
        if (!first || !slot) return;
        slot.textContent = first.charAt(0).toUpperCase() + first.slice(1);
        if (lead) lead.textContent = 'Welcome,';
        el.classList.add('hi-has-first');
    })();

    // ----- The iris: a round hole in the dark field, drawn with a mask -------
    function size() { return { W: el.clientWidth || innerWidth, H: el.clientHeight || innerHeight }; }
    function dotD() { var s = size(); return Math.round(Math.min(s.W, s.H) * 0.12); }
    el.style.setProperty('--hi-d', dotD() + 'px');

    var iris = { r: 0, x: 0 };                         // radius, sideways drift (px)
    function draw() {
        var s = size(), cx = s.W / 2 + iris.x, cy = s.H / 2, r = Math.max(0, iris.r);
        var m = r > 0 ? 'radial-gradient(circle at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px, transparent ' + r.toFixed(1) + 'px, #000 ' + (r + 1).toFixed(1) + 'px)' : 'none';
        shade.style.webkitMaskImage = m; shade.style.maskImage = m;
        var d = r * 2;
        lens.style.width = lens.style.height = d.toFixed(1) + 'px';
        lens.style.transform = 'translate(' + (cx - r).toFixed(1) + 'px,' + (cy - r).toFixed(1) + 'px)';
    }
    function tween(ms, from, to, ease, onDone) {
        var t0 = performance.now(), id = { stop: false };
        (function step(now) {
            if (id.stop) return;
            var k = Math.min(1, (now - t0) / ms), e = ease(k);
            iris.r = from.r + (to.r - from.r) * e;
            iris.x = from.x + (to.x - from.x) * e;
            draw();
            if (k < 1) requestAnimationFrame(step); else if (onDone) onDone();
        })(t0);
        return id;
    }
    var easeInOut = function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
    var easeIn = function (k) { return k * k * k; };

    // ----- The timeline ------------------------------------------------------
    var ORDER = ['dots', 'iris', 'open', 'name', 'welcome', 'out', 'done'];
    var stage = -1, timers = [], anim = null, lastSkip = 0;
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function heroVideo() { return document.getElementById('hmHeroVideo'); }
    function clear() { timers.forEach(clearTimeout); timers = []; if (anim) { anim.stop = true; anim = null; } }

    function go(name) {
        var n = ORDER.indexOf(name);
        if (n <= stage) return;
        stage = n;
        el.setAttribute('data-stage', name);
        var s = size(), r0 = dotD() / 2, rWide = Math.min(s.W, s.H) * 0.2, rFull = Math.hypot(s.W, s.H) / 2 + 4;
        if (name === 'dots') {
            later(function () { last.classList.add('hi-held'); whenVideoReady(function () { go('iris'); }); }, 1700);
        } else if (name === 'iris') {
            var v = heroVideo();
            if (v) { try { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
            iris.r = r0; iris.x = 0; draw();
            // The iris widens and drifts a little to one side, then back to centre.
            anim = tween(700, { r: r0, x: 0 }, { r: rWide, x: -s.W * 0.06 }, easeInOut, function () {
                anim = tween(700, { r: rWide, x: -s.W * 0.06 }, { r: rWide, x: 0 }, easeInOut, function () { go('open'); });
            });
        } else if (name === 'open') {
            anim = tween(850, { r: iris.r, x: iris.x }, { r: rFull, x: 0 }, easeIn, function () {
                shade.style.display = 'none';
                later(function () { go('name'); }, 150);
            });
        } else if (name === 'name') {
            later(function () { go('welcome'); }, 1300);
        } else if (name === 'welcome') {
            later(function () { go('out'); }, 2600);
        } else if (name === 'out') {
            later(function () { go('done'); }, 900);
        } else if (name === 'done') {
            clear();
            root.classList.remove('hi-on');
            try { window.dispatchEvent(new Event('scroll')); } catch (e) {}
            setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
        }
    }

    // Wait (briefly) for the hero's video to have a frame, so the iris never
    // opens onto black.
    function whenVideoReady(cb) {
        var v = heroVideo(), fired = false;
        function once() { if (fired) return; fired = true; cb(); }
        if (!v || v.readyState >= 2) return once();
        v.addEventListener('loadeddata', once, { once: true });
        setTimeout(once, 2500);
    }

    // Skip ahead: the first tap jumps to the open video and the name, the next
    // to the welcome, then out.
    function skip(e) {
        if (e && e.type === 'keydown' && ['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown'].indexOf(e.key) < 0) return;
        var now = Date.now();
        if (now - lastSkip < 700) return;              // one wheel flick = one step
        lastSkip = now;
        clear();
        var cur = ORDER[stage];
        if (stage < ORDER.indexOf('name')) {
            var v = heroVideo();
            if (v) { try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e2) {} }
            shade.style.display = 'none'; lens.style.opacity = '0';
            go('name');
        } else if (cur === 'name') { go('welcome'); }
        else if (cur === 'welcome') { go('out'); }
        else { go('done'); }
    }
    el.addEventListener('click', skip);
    el.addEventListener('wheel', function (e) { e.preventDefault(); if (Math.abs(e.deltaY) > 8) skip(); }, { passive: false });
    el.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', function k(e) { if (stage >= ORDER.indexOf('done')) { window.removeEventListener('keydown', k); return; } skip(e); });
    window.addEventListener('resize', function () { el.style.setProperty('--hi-d', dotD() + 'px'); if (stage === ORDER.indexOf('iris')) draw(); });

    requestAnimationFrame(function () { requestAnimationFrame(function () { go('dots'); }); });
})();
