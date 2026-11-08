/* ==========================================================================
   Zoom Parallax — hero → feed transition on feed.html
   --------------------------------------------------------------------------
   A collage of 7 tiles (centre = the hero video, 6 editorial stills around it)
   that opens up as you scroll the hero's sticky track: the off-centre tiles fly
   outward while the centre grows to fill the viewport — and from there the feed
   begins. Scroll-driven, no framer-motion.
   ========================================================================== */
(function () {
	'use strict';

	var hero = document.getElementById('feedHero');
	if (!hero) return;

	var reduceMotion =
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Centre tile reuses the hero video; the six outer tiles use editorial
	// stills that ship with the repo.
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

	if (reduceMotion) return; // CSS handles the static (full-bleed) fallback.

	// ---- Scroll -> scale ---------------------------------------------------
	function clamp(v, lo, hi) {
		return v < lo ? lo : v > hi ? hi : v;
	}

	// Progress is how far we've scrolled through the hero's sticky track
	// (.zp-wrap). The hero stays pinned for (track height − one viewport) of
	// scroll, over which the collage opens.
	var wrap = document.getElementById('feedHeroWrap') || hero.parentNode;

	function apply() {
		var winH = window.innerHeight;
		var winW = window.innerWidth;
		var pinned = Math.max(1, wrap.offsetHeight - winH);
		var p = clamp((window.scrollY - wrap.offsetTop) / pinned, 0, 1);

		// Ring radius for the outer circles (px) — keep it circular on any screen.
		// Sized to leave a clear gap between the ring and the centre circle.
		var ring = Math.min(winW, winH) * 0.42;
		var outerIndex = 0;

		for (var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			var max = parseFloat(getComputedStyle(tile).getPropertyValue('--zp-max')) || 4;
			tile.style.setProperty('--zp-s', String(1 + (max - 1) * p));

			if (tile.getAttribute('data-zp') === '0') {
				// Centre circle morphs to a full-bleed square as it grows.
				tile.style.setProperty('--zp-r', (50 - 50 * clamp(p * 1.2, 0, 1)) + '%');
			} else {
				// Place outer circles evenly on the ring, starting at the top.
				var angle = (outerIndex / 6) * Math.PI * 2 - Math.PI / 2;
				tile.style.setProperty('--zp-tx', (Math.cos(angle) * ring).toFixed(1) + 'px');
				tile.style.setProperty('--zp-ty', (Math.sin(angle) * ring).toFixed(1) + 'px');
				outerIndex++;
			}
		}

		// Fade the welcome copy + cue out as the ring opens into the hero.
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
