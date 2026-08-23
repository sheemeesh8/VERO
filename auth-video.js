/* ============================================================================
 * auth-video.js — inject the low-exposure video backdrop into an auth screen.
 * Shared by login.html / signup.html / onboarding.html. Pairs with
 * auth-video.css. Video is muted + looping (autoplay policies require muted),
 * plays inline on mobile, and is skipped under prefers-reduced-motion.
 * ==========================================================================*/
(function () {
    if (document.querySelector('.auth-video')) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var video = document.createElement('video');
    video.className = 'auth-video';
    video.src = 'assets/auth-bg.mp4';
    video.loop = true;
    video.muted = true;
    video.setAttribute('muted', '');        // iOS needs the attribute too
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';

    var scrim = document.createElement('div');
    scrim.className = 'auth-scrim';

    // Sit both layers at the very back of <body>.
    document.body.insertBefore(scrim, document.body.firstChild);
    document.body.insertBefore(video, document.body.firstChild);

    if (!reduce) {
        video.autoplay = true;
        video.setAttribute('autoplay', '');
        var tryPlay = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
        tryPlay();
        // Some engines need a nudge once the frame is ready.
        video.addEventListener('canplay', tryPlay, { once: true });
    }
})();
