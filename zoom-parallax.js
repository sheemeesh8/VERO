/* ==========================================================================
   Zoom Parallax — hero → feed transition for feed.html
   --------------------------------------------------------------------------
   The hero image sits centred, then grows as the visitor scrolls until it
   fills the whole viewport — and from there the feed (the site) begins.
   Scroll-driven scaling, no framer-motion. Enhances #feedHero.
   ========================================================================== */
(function () {
	'use strict';

	var hero = document.getElementById('feedHero');
	if (!hero) return;

	var reduceMotion =
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ---- Build the stage ---------------------------------------------------
	var existingVideo = hero.querySelector('.hero-video');
	var stage = document.createElement('div');
	stage.className = 'zp-stage';

	// Single centre tile — the hero — wraps the existing video (keeps autoplay).
	var centre = document.createElement('div');
	centre.className = 'zp-tile';
	centre.setAttribute('data-zp', '0');
	if (existingVideo) {
		centre.appendChild(existingVideo);
	} else {
		var img0 = document.createElement('img');
		img0.src = 'hero-beach.jpg';
		img0.alt = 'Welcome';
		centre.appendChild(img0);
	}
	stage.appendChild(centre);

	// Insert the stage as the hero backdrop (behind copy + scroll cue).
	hero.insertBefore(stage, hero.firstChild);

	var copy = hero.querySelector('.hero-copy');
	var cue = hero.querySelector('.hero-scroll-cue');

	if (reduceMotion) return; // CSS handles the static (full-bleed) fallback.

	// ---- Scroll -> scale ---------------------------------------------------
	function clamp(v, lo, hi) {
		return v < lo ? lo : v > hi ? hi : v;
	}

	// Progress is how far we've scrolled through the hero's sticky track
	// (.zp-wrap). The hero stays pinned for (track height − one viewport) of
	// scroll, over which it grows from --zp-min to --zp-max.
	var wrap = document.getElementById('feedHeroWrap') || hero.parentNode;

	function apply() {
		var winH = window.innerHeight;
		var pinned = Math.max(1, wrap.offsetHeight - winH);
		var start = wrap.offsetTop;
		var p = clamp((window.scrollY - start) / pinned, 0, 1);

		var min = parseFloat(getComputedStyle(centre).getPropertyValue('--zp-min')) || 0.62;
		var max = parseFloat(getComputedStyle(centre).getPropertyValue('--zp-max')) || 1.18;
		centre.style.setProperty('--zp-s', String(min + (max - min) * p));

		// Fade the welcome copy + cue out as the hero takes over the screen.
		var fade = clamp(1 - p * 1.8, 0, 1);
		if (copy) copy.style.opacity = fade;
		if (cue) cue.style.opacity = String(0.85 * fade);
	}

	var ticking = false;
	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function () {
			apply();
			ticking = false;
		});
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	apply();
})();
