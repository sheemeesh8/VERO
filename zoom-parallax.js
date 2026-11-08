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

	// Centre tile reuses the hero video; the six outer circles are category
	// shortcuts, each with a caption and a link to the relevant page.
	var OUTER = [
		{ src: 'magazine-hero.jpg',  label: 'Magazine',          href: 'index.html?open=magazine' },
		{ src: 'clothing-hero.jpg',  label: 'Autumn Collection', href: 'index.html?collection=autumn' },
		{ src: 'women-hero.jpg',     label: 'Gender',            href: '#genderCover' },
		{ src: 'sale-hero.jpg',      label: 'Sale',              href: 'products.html?sale=1' },
		{ src: 'gallery-hero.jpg',   label: 'New In',            href: 'products.html?new=1' },
		{ src: 'art-hero.jpg',       label: 'Events',            href: 'events.html' }
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

	// Tiles 1..6 — outer category circles (clickable) + a caption under each.
	var caps = [];
	OUTER.forEach(function (item, i) {
		var tile = document.createElement('a');
		tile.className = 'zp-tile zp-link';
		tile.setAttribute('data-zp', String(i + 1));
		tile.setAttribute('href', item.href);
		tile.setAttribute('aria-label', item.label);
		var img = document.createElement('img');
		img.src = item.src;
		img.alt = item.label;
		img.loading = 'eager';
		img.decoding = 'async';
		tile.appendChild(img);
		stage.appendChild(tile);

		var cap = document.createElement('a');
		cap.className = 'zp-cap';
		cap.setAttribute('href', item.href);
		cap.textContent = item.label;
		stage.appendChild(cap);
		caps.push(cap);
	});

	// Insert the stage as the hero backdrop (behind copy + scroll cue).
	hero.insertBefore(stage, hero.firstChild);

	var tiles = [].slice.call(stage.querySelectorAll('.zp-tile'));
	var copy = hero.querySelector('.hero-copy');
	var cue = hero.querySelector('.hero-scroll-cue');

	// ---- Click a circle -> open it with the hero's zoom, then navigate ------
	var transitioning = false;
	function openTile(tile, href) {
		if (transitioning) return;
		transitioning = true;
		var winW = window.innerWidth, winH = window.innerHeight;
		var side = tile.offsetWidth || Math.min(winW, winH) * 0.25; // circle diameter
		var cover = (Math.max(winW, winH) / side) * 1.06;
		stage.classList.add('zp-opening');
		tile.classList.add('zp-anim');
		tile.style.zIndex = '6';
		tile.style.setProperty('--zp-tx', '0px');
		tile.style.setProperty('--zp-ty', '0px');
		tile.style.setProperty('--zp-s', String(cover));
		tile.style.setProperty('--zp-r', '0%');
		if (copy) copy.style.opacity = '0';
		if (cue) cue.style.opacity = '0';
		for (var k = 0; k < caps.length; k++) caps[k].style.opacity = '0';
		setTimeout(function () { window.location.href = href; }, 560);
	}

	OUTER.forEach(function (item, i) {
		var tile = stage.querySelector('.zp-tile[data-zp="' + (i + 1) + '"]');
		function go(ev) { ev.preventDefault(); openTile(tile, item.href); }
		if (tile) tile.addEventListener('click', go);
		if (caps[i]) caps[i].addEventListener('click', go);
	});

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
		if (transitioning) return; // don't fight the click-open animation
		var winH = window.innerHeight;
		var winW = window.innerWidth;
		var pinned = Math.max(1, wrap.offsetHeight - winH);
		var p = clamp((window.scrollY - wrap.offsetTop) / pinned, 0, 1);

		// Size the whole collage so it always fits the viewport — both width and
		// height — whatever the aspect ratio (fixes overflow on wide/landscape).
		var k = Math.min(winW * 0.40, winH * 0.28);
		var ring = k;                  // distance centre -> outer circle
		var centreD = k;               // centre circle diameter
		var outerD = k * 0.62;         // outer circle diameter
		var outerRadius = outerD / 2;
		var outerIndex = 0;

		// Apply the computed sizes to the tiles (overrides the CSS defaults).
		for (var t = 0; t < tiles.length; t++) {
			var sz = tiles[t].getAttribute('data-zp') === '0' ? centreD : outerD;
			tiles[t].style.width = sz.toFixed(1) + 'px';
			tiles[t].style.height = sz.toFixed(1) + 'px';
		}

		// Centre's final scale: a large centred hero, deliberately smaller than a
		// full crop so the (landscape) video isn't blown up on a tall screen.
		var centreMax = (Math.max(winW, winH) / centreD) * 0.82;

		// Nudge the resting collage down so the top circle's outer caption clears
		// the welcome copy. The centre un-nudges as it grows so it ends centred.
		var cy = winH * 0.05;

		for (var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			var isCentre = tile.getAttribute('data-zp') === '0';
			var max = isCentre
				? centreMax
				: (parseFloat(getComputedStyle(tile).getPropertyValue('--zp-max')) || 4);
			var s = 1 + (max - 1) * p;
			tile.style.setProperty('--zp-s', String(s));

			if (isCentre) {
				// Centre starts as a circle and squares off completely as it grows.
				tile.style.setProperty('--zp-r', (50 - 50 * clamp(p * 1.2, 0, 1)) + '%');
				tile.style.setProperty('--zp-tx', '0px');
				// Offset is multiplied by scale in CSS, so divide to keep it in px.
				tile.style.setProperty('--zp-ty', (cy * (1 - p) / s).toFixed(2) + 'px');
			} else {
				// Place outer circles evenly on the ring, starting at the top.
				var angle = (outerIndex / 6) * Math.PI * 2 - Math.PI / 2;
				var tx = Math.cos(angle) * ring;
				var ringY = Math.sin(angle) * ring;
				var ty = ringY + cy;
				tile.style.setProperty('--zp-tx', tx.toFixed(1) + 'px');
				tile.style.setProperty('--zp-ty', ty.toFixed(1) + 'px');
				// Caption sits on the OUTER side of its circle: above the circles
				// in the upper half, below the ones in the lower half.
				var cap = caps[outerIndex];
				if (cap) {
					var capY = ringY < 0
						? ty - outerRadius - 24
						: ty + outerRadius + 24;
					cap.style.transform =
						'translate(calc(-50% + ' + tx.toFixed(1) + 'px), calc(-50% + ' +
						capY.toFixed(1) + 'px))';
				}
				outerIndex++;
			}
		}

		// Fade the welcome copy + cue out as the ring opens into the hero.
		var fade = clamp(1 - p * 1.8, 0, 1);
		if (copy) copy.style.opacity = fade;
		if (cue) cue.style.opacity = String(0.85 * fade);

		// Captions belong to the resting collage — fade them quickly on scroll.
		var capFade = clamp(1 - p * 3, 0, 1);
		for (var c = 0; c < caps.length; c++) {
			caps[c].style.opacity = capFade;
			caps[c].style.pointerEvents = capFade > 0.6 ? 'auto' : 'none';
		}
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
