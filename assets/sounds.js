/* ============================================================================
   sounds.js — the app's sound effects (Settings → Display → Sound effects).

     veroSound('send')   a message is sent        — double click
     veroSound('live')   a listing goes live      — soft swell
     veroSound('sale')   a piece sells            — bell chime
     veroSound('like')   a piece is liked         — bubble
     veroSound('offer')  an offer comes in        — glass ping (played by itself,
                                                    when a new offer appears)

   Every sound is made in the browser (Web Audio), so there is nothing to
   download. One audio engine is kept in the top window (the phone frame),
   so a sound started just before a page changes still plays out, and a tap
   anywhere in the app unlocks it once for all pages.

   Loaded by assets/motion.js on every page. Calls made before this file has
   loaded are queued there and played here.
   ========================================================================== */
(function () {
    'use strict';
    if (window.__veroSoundsLoaded) return;
    window.__veroSoundsLoaded = true;

    function enabled() {
        try { var s = JSON.parse(localStorage.getItem('vero_settings')) || {}; return s.sounds !== false; } catch (e) { return true; }
    }

    // The window that owns the engine: the top one when it is ours, else this one.
    var host = window;
    try { if (window.top && window.top !== window && window.top.document) host = window.top; } catch (e) { host = window; }

    function ctx() {
        try {
            if (!host.__veroAudio) {
                var C = host.AudioContext || host.webkitAudioContext;
                if (!C) return null;
                host.__veroAudio = new C();
            }
            var a = host.__veroAudio;
            if (a.state === 'suspended') a.resume();
            return a;
        } catch (e) { return null; }
    }
    // Unlock on the first tap / key in this page (phones keep audio asleep until then).
    function unlock() { var a = ctx(); if (a && a.state === 'running') off(); }
    function off() { ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.removeEventListener(ev, unlock, true); }); }
    ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, true); });

    // ---- Building blocks ----------------------------------------------------
    function tone(a, t, f, dur, type, vol, fTo, attack) {
        var o = a.createOscillator(), g = a.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f, t);
        if (fTo) o.frequency.exponentialRampToValueAtTime(fTo, t + dur * 0.7);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.25, t + (attack || 0.008));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(a.destination);
        o.start(t); o.stop(t + dur + 0.03);
    }
    function bell(a, t, f, dur, vol) { tone(a, t, f, dur, 'sine', vol); tone(a, t, f * 2.76, dur * 0.45, 'sine', vol * 0.16); }

    // ---- The five sounds (chosen from the sound preview) --------------------
    var SOUNDS = {
        // Message sent — D · Double click
        send:  function (a, t) { tone(a, t, 900, 0.035, 'triangle', 0.25); tone(a, t + 0.06, 1350, 0.045, 'triangle', 0.22); },
        // Item is live — D · Soft swell
        live:  function (a, t) { [392, 494, 587, 784].forEach(function (f) { tone(a, t, f, 1.1, 'sine', 0.08, null, 0.25); }); },
        // Sold — A · Bell chime
        sale:  function (a, t) { bell(a, t, 1319, 0.5, 0.2); bell(a, t + 0.09, 1661, 0.5, 0.2); bell(a, t + 0.18, 1976, 0.9, 0.22); },
        // Like — D · Bubble
        like:  function (a, t) { tone(a, t, 380, 0.11, 'sine', 0.28, 1100); },
        // Offer received — D · Glass ping
        offer: function (a, t) { bell(a, t, 1760, 1.1, 0.2); }
    };

    var last = {};
    function play(name) {
        if (!SOUNDS[name] || !enabled()) return;
        var now = Date.now();
        if (last[name] && now - last[name] < 250) return;   // one sound per moment, not a burst
        last[name] = now;
        var a = ctx(); if (!a) return;
        var go = function () { try { SOUNDS[name](a, a.currentTime + 0.02); } catch (e) {} };
        if (a.state === 'running') go();
        else if (a.resume) a.resume().then(go, function () {});
    }
    window.veroSound = play;
    // Play whatever was asked for before this file loaded (see motion.js).
    (window.__veroSoundQ || []).forEach(play);
    window.__veroSoundQ = [];

    // ---- Offer received: a new offer from someone else appears --------------
    // Counted across all negotiations (offers by 'them'); the first count on a
    // device is only a baseline, so the demo's seeded offers stay silent.
    var SEEN = 'vero_sound_offers_seen';
    function incoming() {
        var n = 0;
        try {
            (JSON.parse(localStorage.getItem('vero_negotiations')) || []).forEach(function (x) {
                (x && x.events || []).forEach(function (e) { if (e && e.by === 'them' && e.type === 'offer') n++; });
            });
        } catch (e) {}
        return n;
    }
    function checkOffers() {
        var n = incoming(), seen = parseInt(localStorage.getItem(SEEN), 10);
        try { localStorage.setItem(SEEN, String(n)); } catch (e) {}
        // Whichever page notices first moves the count on, so the others stay quiet.
        if (!isNaN(seen) && n > seen) play('offer');
    }
    checkOffers();
    window.addEventListener('storage', function (e) { if (e.key === 'vero_negotiations') checkOffers(); });
    setInterval(function () { if (!document.hidden) checkOffers(); }, 3000);   // offers that arrive on this very page
})();
