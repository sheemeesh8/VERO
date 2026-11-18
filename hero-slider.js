/* ==========================================================================
   hero-slider.js — the feed.html hero carousel
   --------------------------------------------------------------------------
   Three slides (welcome / collection / new arrivals). Autoplays, with dots,
   prev/next arrows and swipe. Pauses on hover, focus and when the tab is
   hidden. Only the active slide's video plays, to keep it light. Styles live
   in assets/home.css; the slider root keeps id="hmHeroCap" so the feed's own
   data-act / data-mode click delegation still drives the caption buttons.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('hmHeroCap');
  if (!root || !root.classList.contains('hero-slider')) return;

  var slides = [].slice.call(root.querySelectorAll('.hs-slide'));
  var dots = [].slice.call(root.querySelectorAll('.hs-dot'));
  if (slides.length < 2) return;

  var idx = 0, timer = null;
  var DELAY = 5600;
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function playActiveVideo() {
    slides.forEach(function (s, i) {
      var v = s.querySelector('video');
      if (!v) return;
      if (i === idx) {
        try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      } else {
        try { v.pause(); } catch (e) {}
      }
    });
  }

  function go(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
    dots.forEach(function (d, i) {
      var on = (i === idx);
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    playActiveVideo();
  }

  function next() { go(idx + 1); }
  function prev() { go(idx - 1); }

  function start() { stop(); if (!reduce) timer = setInterval(next, DELAY); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  dots.forEach(function (d) {
    d.addEventListener('click', function () { go(parseInt(d.dataset.go, 10) || 0); start(); });
  });
  var nx = root.querySelector('.hs-next'), pv = root.querySelector('.hs-prev');
  if (nx) nx.addEventListener('click', function () { next(); start(); });
  if (pv) pv.addEventListener('click', function () { prev(); start(); });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // Swipe (touch)
  var x0 = null;
  root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
    start();
  }, { passive: true });

  go(0);
  start();
})();
