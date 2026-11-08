/* ==========================================================================
   Zoom Parallax — vanilla port of components/ui/zoom-parallax.tsx
   --------------------------------------------------------------------------
   Replaces framer-motion's useScroll + useTransform with a plain scroll
   listener. Scroll progress across the first viewport (0 -> 1) scales each
   tile from 1 up to its target (4, 5, 6, 5, 6, 8, 9), opening the hero into
   the feed. Drop-in: it enhances #feedHero on feed.html.
   ========================================================================== */
(function () {
	'use strict';

	var hero = document.getElementById('feedHero');
	if (!hero) return;

	var reduceMotion =
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// The centre tile reuses the hero video already in the markup; the six
	// outer tiles use editorial stills that ship with the repo.
	var OUTER = [
		{ src: 'women-hero.jpg', alt: "Women's editorial" },
		{ src: 'men-hero.jpg', alt: "Men's editorial" },
		{ src: 'gallery-hero.jpg', alt: 'Gallery pieces' },
		{ src: 'magazine-hero.jpg', alt: 'Magazine spread' },
		{ src: 'art-hero.jpg', alt: 'Original art' },
		{ src: 'clothing-hero.jpg', alt: 'Seasonal clothing' }
	];

	// ---- Build the stage ---------------------------------------------------
	var existingVideo = hero.querySelector('.hero-video');
	var stage = document.createElement('div');
	stage.className = 'zp-stage';

	// Tile 0 — centre — wraps the existing hero video (keeps autoplay/loop).
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

	// Tiles 1..6 — outer editorial stills.
	OUTER.forEach(function (item, i) {
		var tile = document.createElement('div');
		tile.className = 'zp-tile';
		tile.setAttribute('data-zp', String(i + 1));
		tile.setAttribute('aria-hidden', 'true');
		var img = document.createElement('img');
		img.src = item.src;
		img.alt = item.alt;
		img.loading = 'eager';
		img.decoding = 'async';
		tile.appendChild(img);
		stage.appendChild(tile);
	});

	// Insert the stage as the hero backdrop (behind copy + scroll cue).
	hero.insertBefore(stage, hero.firstChild);

	var tiles = [].slice.call(stage.querySelectorAll('.zp-tile'));
	var copy = hero.querySelector('.hero-copy');
	var cue = hero.querySelector('.hero-scroll-cue');

	if (reduceMotion) return; // CSS handles the static fallback.

	// ---- Scroll -> scale ---------------------------------------------------
	function clamp(v, lo, hi) {
		return v < lo ? lo : v > hi ? hi : v;
	}

	function apply() {
		var p = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);

		for (var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			var max = parseFloat(getComputedStyle(tile).getPropertyValue('--zp-max')) || 4;
			tile.style.setProperty('--zp-s', String(1 + (max - 1) * p));
		}

		// Fade the welcome copy + cue out as the zoom takes over.
		var fade = clamp(1 - p * 1.6, 0, 1);
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
