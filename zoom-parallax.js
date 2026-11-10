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

	// Arrived through the "Shop" portal (feed.html?enter=1 / #feed) → skip the
	// entrance gate and show the feed straight away.
	if (/[?&]enter=1\b/.test(location.search) || location.hash === '#feed') {
		var skipWrap = document.getElementById('feedHeroWrap');
		if (skipWrap) skipWrap.style.display = 'none';
		return;
	}

	var reduceMotion =
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// The squares: the hero video first, then the category shortcuts. Each is a
	// square tile in the slider, with a caption and a link.
	var TILES = [
		{ video: true,                label: 'Shop',              href: 'feed.html?enter=1' },
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

	// ---- Entrance GATE: vertical scroll zooms the whole slider in, then the feed.
	// The hero sits on a sticky 200vh track; scrolling it zooms the squares up and
	// fades them out — an "enter the site" gate before the feed begins. --------
	var wrap = document.getElementById('feedHeroWrap') || hero.parentNode;
	var copy = hero.querySelector('.hero-copy');
	var cue = hero.querySelector('.hero-scroll-cue');

	// The square nearest the viewport centre — the one the gate will open.
	function centredTile() {
		var mid = window.innerWidth / 2, best = tiles[0], bd = Infinity;
		for (var i = 0; i < tiles.length; i++) {
			var r = tiles[i].getBoundingClientRect();
			var d = Math.abs(r.left + r.width / 2 - mid);
			if (d < bd) { bd = d; best = tiles[i]; }
		}
		return best;
	}

	var gateTile = null, gateRect = null, gateNavigated = false;
	function liftGate() {
		gateTile = centredTile();
		gateRect = gateTile.getBoundingClientRect();
		gateNavigated = false;
		track.style.pointerEvents = 'none';
		var s = gateTile.style;
		s.position = 'fixed'; s.margin = '0'; s.zIndex = '55';
		s.left = gateRect.left + 'px'; s.top = gateRect.top + 'px';
		s.width = gateRect.width + 'px'; s.height = gateRect.height + 'px';
		s.setProperty('--zp-s', '1'); s.transformOrigin = 'center center';
	}
	function releaseGate() {
		if (!gateTile) return;
		var s = gateTile.style;
		s.position = ''; s.margin = ''; s.zIndex = '';
		s.left = ''; s.top = ''; s.width = ''; s.height = '';
		s.transform = ''; s.transformOrigin = '';
		for (var i = 0; i < tiles.length; i++) tiles[i].style.opacity = '';
		track.style.pointerEvents = '';
		hint.style.opacity = '';
		if (copy) copy.style.opacity = '';
		gateTile = null; gateNavigated = false;
		apply();
	}

	// Vertical scroll zooms the CENTRED square to full-bleed and opens its page
	// — every slide is its own portal, just like the hero.
	function gate() {
		var pinned = Math.max(1, wrap.offsetHeight - window.innerHeight);
		var p = clamp((window.scrollY - wrap.offsetTop) / pinned, 0, 1);
		if (p <= 0.002) { if (gateTile) releaseGate(); return; }
		if (!gateTile) liftGate();
		var pz = p * p;
		var cover = (Math.max(window.innerWidth, window.innerHeight) / (gateRect.width || 1)) * 1.08;
		var s = 1 + (cover - 1) * pz;
		gateTile.style.transform = 'scale(' + s.toFixed(3) + ')';
		var fade = clamp(1 - p * 3, 0, 1);
		for (var i = 0; i < tiles.length; i++) {
			if (tiles[i] !== gateTile) tiles[i].style.opacity = String(fade);
		}
		hint.style.opacity = String(fade);
		if (copy) copy.style.opacity = String(fade);
		if (cue) cue.style.opacity = String(0.85 * fade);
		// Near the end of the track → open the square's page.
		if (!gateNavigated && p >= 0.985) {
			gateNavigated = true;
			window.location.href = gateTile.getAttribute('href');
		}
	}

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

	// Drive the entrance gate from vertical page scroll.
	var gTick = false;
	function onPageScroll() {
		if (gTick) return;
		gTick = true;
		requestAnimationFrame(function () { gate(); gTick = false; });
	}
	window.addEventListener('scroll', onPageScroll, { passive: true });
	window.addEventListener('resize', onPageScroll);
	gate();

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
