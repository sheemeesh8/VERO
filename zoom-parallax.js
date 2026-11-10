/* ==========================================================================
   Zoom Parallax — hero → feed entrance on feed.html
   --------------------------------------------------------------------------
   A horizontal slider of SQUARE category tiles (centre = the hero video, plus
   the category shortcuts). Each square zooms up with the hero's motion as it
   reaches the centre of the viewport; tapping one grows it to full-bleed (the
   hero zoom) and then navigates. Scroll-driven, no framer-motion.
   ========================================================================== */
(function () {
	'use strict';

	var hero = document.getElementById('feedHero');
	if (!hero) return;

	var reduceMotion =
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// The squares: the hero video first, then the category shortcuts. Each is a
	// square tile in the slider, with a caption and a link.
	var TILES = [
		{ video: true,                label: 'Shop',              href: 'feed.html#feed' },
		{ src: 'clothing-hero.jpg',   label: 'Autumn Collection', href: 'category.html?cat=autumn' },
		{ src: 'women-hero.jpg',      label: 'Gender',            href: 'category.html?cat=gender' },
		{ src: 'sale-hero.jpg',       label: 'Sale',              href: 'category.html?cat=sale' },
		{ src: 'gallery-hero.jpg',    label: 'New In',            href: 'category.html?cat=new' },
		{ src: 'magazine-hero.jpg',   label: 'Magazine',          href: 'category.html?cat=magazine' },
		{ src: 'art-hero.jpg',        label: 'Events',            href: 'category.html?cat=events' }
	];

	// ---- Build the stage ---------------------------------------------------
	var existingVideo = hero.querySelector('.hero-video');
	var stage = document.createElement('div');
	stage.className = 'zp-stage';

	var track = document.createElement('div');
	track.className = 'zp-track';
	stage.appendChild(track);

	var tiles = [];
	TILES.forEach(function (item, i) {
		var tile = document.createElement('a');
		tile.className = 'zp-tile';
		tile.setAttribute('data-zp', String(i));
		tile.setAttribute('href', item.href);
		tile.setAttribute('aria-label', item.label);
		if (item.video && existingVideo) {
			tile.appendChild(existingVideo);          // reuse the autoplaying hero video
		} else {
			var img = document.createElement('img');
			img.src = item.video ? 'hero-beach.jpg' : item.src;
			img.alt = item.label;
			img.loading = 'eager';
			img.decoding = 'async';
			tile.appendChild(img);
		}
		var cap = document.createElement('span');
		cap.className = 'zp-cap';
		cap.textContent = item.label;
		tile.appendChild(cap);
		track.appendChild(tile);
		tiles.push(tile);
	});

	var hint = document.createElement('div');
	hint.className = 'zp-hint';
	hint.textContent = 'Swipe to explore';
	stage.appendChild(hint);

	// Insert the stage as the hero backdrop (behind any copy/cue).
	hero.insertBefore(stage, hero.firstChild);

	// ---- Coverflow zoom: scale each tile by its distance from centre --------
	function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

	var MIN_SCALE = 0.9;   // a tile at the far side of the viewport (kept large so the neighbour peeks)
	var MAX_SCALE = 1.0;   // the tile centred in the viewport (fully zoomed in)

	function apply() {
		if (stage.classList.contains('zp-opening')) return; // don't fight click-open
		var mid = window.innerWidth / 2;
		for (var i = 0; i < tiles.length; i++) {
			var r = tiles[i].getBoundingClientRect();
			var c = r.left + r.width / 2;
			// 0 at centre, 1 once a full tile-width away.
			var d = clamp(Math.abs(c - mid) / (r.width || 1), 0, 1);
			var s = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * d;
			tiles[i].style.setProperty('--zp-s', s.toFixed(3));
		}
	}

	var ticking = false;
	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function () { apply(); ticking = false; });
	}
	track.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);

	// Centre on the hero (first) square, then settle the zoom.
	function centreFirst() {
		var t = tiles[0];
		if (t) {
			var target = t.offsetLeft - (track.clientWidth - t.offsetWidth) / 2;
			track.scrollLeft = Math.max(0, target);
		}
		apply();
	}
	// Let layout settle (images/fonts) before measuring.
	centreFirst();
	window.addEventListener('load', centreFirst);
	setTimeout(centreFirst, 60);

	if (reduceMotion) return;

	// ---- Click a square -> open it with the hero's zoom, then navigate ------
	var transitioning = false;
	function openTile(tile, href) {
		if (transitioning) return;
		transitioning = true;
		var r = tile.getBoundingClientRect();
		var side = r.width || Math.min(window.innerWidth, window.innerHeight) * 0.6;
		var cover = (Math.max(window.innerWidth, window.innerHeight) / side) * 1.08;
		stage.classList.add('zp-opening');
		// Pin the tile where it currently sits, then grow it to cover the screen.
		tile.classList.add('zp-anim');
		tile.style.setProperty('--zp-s', '1');
		tile.style.transform = 'translate(' + r.left.toFixed(1) + 'px,' + r.top.toFixed(1) + 'px) scale(1)';
		// next frame → grow from that spot to full-bleed
		requestAnimationFrame(function () {
			tile.style.transform = 'translate(0px,0px) scale(' + cover.toFixed(3) + ')';
			tile.style.transformOrigin = (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2) + 'px';
		});
		setTimeout(function () { window.location.href = href; }, 560);
	}

	TILES.forEach(function (item, i) {
		var tile = tiles[i];
		if (!tile) return;
		tile.addEventListener('click', function (ev) {
			ev.preventDefault();
			openTile(tile, item.href);
		});
	});
})();
