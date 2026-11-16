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
	// Category circles removed — only the central hero tile (a growing rectangle).
	var OUTER = [];

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
	var endcap = hero.querySelector('.zp-endcap');
	var band = hero.querySelector('.home-intro');

	// ---- Click a circle -> open it with the hero's zoom, then navigate ------
	var transitioning = false;
	function openTile(tile, href) {
		if (transitioning) return;
		transitioning = true;
		var srect = stage.getBoundingClientRect();
		var winW = srect.width || window.innerWidth, winH = srect.height || window.innerHeight;
		var side = tile.offsetWidth || Math.min(winW, winH) * 0.25; // circle diameter
		var cover = (Math.max(winW, winH) / side) * 1.06;
		stage.classList.add('zp-opening');
		tile.classList.add('zp-anim');
		tile.style.zIndex = '6';
		// Fade every other tile out; grow the tapped one to full-bleed (square).
		for (var t = 0; t < tiles.length; t++) {
			tiles[t].style.opacity = tiles[t] === tile ? '1' : '0';
		}
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

	// The zoom is NOT part of the page's scroll. The page opens at the top with
	// scrolling held: the first swipe / wheel / key drives the picture open
	// (progress p, 0 → 1) and it then finishes on its own. Only once it is
	// full-screen is the page released — the gesture that opened it never
	// carries on into the feed, so the scroll always comes to rest on the hero,
	// and since no part of the page's scroll belongs to the zoom there is no
	// way back to it. From there the hero stays pinned and the feed slides
	// over it (.zp-wrap is two screens; see assets/home.css).
	var p = 0;
	var opened = false;

	function apply() {
		if (transitioning) return; // don't fight the click-open animation
		// Size the collage from the stage box (the hero's image region), which may
		// be only part of the viewport (e.g. the top 75%).
		var srect = stage.getBoundingClientRect();
		var winW = srect.width || window.innerWidth;
		var winH = srect.height || window.innerHeight;

		// Size the whole collage so it always fits the viewport — both width and
		// height — whatever the aspect ratio (fixes overflow on wide/landscape).
		var k = Math.min(winW * 0.40, winH * 0.28);
		var ring = k, outerD = k * 0.62, outerRadius = outerD / 2, outerIndex = 0; // (unused; no outer tiles)

		// Centre hero is a narrow, tall rectangle (sharp corners) that grows to fill.
		var centreW = Math.min(winW * 0.60, winH * 0.40);
		var centreH = Math.min(centreW * 1.75, winH * 0.82);
		var centreD = Math.min(centreW, centreH);  // used for the scale math below

		// Apply the computed size to the centre tile (overrides the CSS default).
		for (var t = 0; t < tiles.length; t++) {
			tiles[t].style.width = centreW.toFixed(1) + 'px';
			tiles[t].style.height = centreH.toFixed(1) + 'px';
		}

		// Grow until the rectangle fully covers the viewport on both axes.
		var centreMax = Math.max(winW / centreW, winH / centreH) * 1.06;

		// Ease the growth in (p² ) so the first slice of scroll barely changes the
		// resting ring. This keeps the clean collage stable while the welcome copy
		// and captions fade out, so nothing balloons over the fixed header before
		// the text is gone.
		var pz = p * p;

		// Nudge the resting collage down so the top circle's outer caption clears
		// the welcome copy. The centre un-nudges as it grows so it ends centred.
		var cy = winH * 0.05;

		for (var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			var isCentre = tile.getAttribute('data-zp') === '0';
			var max = isCentre
				? centreMax
				: (parseFloat(getComputedStyle(tile).getPropertyValue('--zp-max')) || 4);
			var s = 1 + (max - 1) * pz;
			tile.style.setProperty('--zp-s', String(s));

			if (isCentre) {
				// Sharp-cornered rectangle throughout.
				tile.style.setProperty('--zp-r', '0px');
				tile.style.setProperty('--zp-tx', '0px');
				// Offset is multiplied by scale in CSS, so divide to keep it in px.
				tile.style.setProperty('--zp-ty', (cy * (1 - pz) / s).toFixed(2) + 'px');
			} else {
				// Place outer circles evenly on the ring, starting at the top.
				var angle = (outerIndex / 6) * Math.PI * 2 - Math.PI / 2;
				var tx = Math.cos(angle) * ring;
				var ringY = Math.sin(angle) * ring;
				var ty = ringY + cy;
				tile.style.setProperty('--zp-tx', tx.toFixed(1) + 'px');
				tile.style.setProperty('--zp-ty', ty.toFixed(1) + 'px');
				// Fade outer circles out quickly so none linger over the header.
				tile.style.opacity = clamp(1 - p * 3, 0, 1);
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

		// Fade the welcome copy + cue out fast, before the eased growth kicks in,
		// so the title never sits under a ballooning circle.
		var fade = clamp(1 - p * 4, 0, 1);
		if (copy) copy.style.opacity = fade;
		if (cue) cue.style.opacity = String(0.85 * fade);

		// Captions belong to the resting collage — fade them quickly on scroll.
		var capFade = clamp(1 - p * 4, 0, 1);
		for (var c = 0; c < caps.length; c++) {
			caps[c].style.opacity = capFade;
			caps[c].style.pointerEvents = capFade > 0.6 ? 'auto' : 'none';
		}

		// End-of-zoom caption + Discover button: fade in once the hero has nearly
		// grown to full-screen (last third of the scroll track).
		if (endcap) {
			var endOp = clamp((p - 0.62) / 0.3, 0, 1);
			endcap.style.opacity = endOp;
			endcap.style.pointerEvents = endOp > 0.5 ? 'auto' : 'none';
		}
		// The white band (search + Most liked slider) slides up with the caption.
		if (band) band.classList.toggle('revealed', p > 0.72);
		// No site header over the white stage: it arrives with the full-screen picture.
		document.body.classList.toggle('zp-head-out', !opened && p < 0.9);
	}

	function finish() {
		if (opened) return;
		opened = true; p = 1; raf = 0;
		apply();
	}
	function setP(v) {
		p = clamp(v, 0, 1);
		if (p >= 1) finish(); else apply();
	}

	// Let go mid-way and the picture finishes opening by itself.
	var raf = 0;
	function run() {
		if (opened || raf) return;
		var from = p, t0 = 0, dur = Math.max(260, 760 * (1 - from));
		function step(now) {
			if (opened) return;
			if (!t0) t0 = now;
			var t = clamp((now - t0) / dur, 0, 1);
			var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
			if (t >= 1) { finish(); return; }
			p = from + (1 - from) * e; apply();
			raf = requestAnimationFrame(step);
		}
		raf = requestAnimationFrame(step);
	}

	function travel() { return Math.max(240, window.innerHeight * 0.55); } // input needed for the whole zoom

	// Wheel / trackpad. The page stays held until the gesture (and its inertia)
	// that opened the picture has died down.
	var wheelIdle = 0, wheelHold = false;
	window.addEventListener('wheel', function (e) {
		if (opened && !wheelHold) return;
		e.preventDefault();
		wheelHold = true;
		clearTimeout(wheelIdle);
		wheelIdle = setTimeout(function () { wheelHold = false; if (!opened && p > 0) run(); }, 170);
		if (opened || raf) return;
		var d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
		setP(p + d / travel());
	}, { passive: false });

	// Touch. The swipe that opens the picture is used up by it.
	var lastY = null, touchHold = false;
	window.addEventListener('touchstart', function (e) {
		lastY = e.touches.length ? e.touches[0].clientY : null;
		touchHold = !opened;
	}, { passive: true });
	window.addEventListener('touchmove', function (e) {
		if (!touchHold) return;
		if (e.cancelable) e.preventDefault();
		if (opened || raf || lastY === null || !e.touches.length) return;
		var y = e.touches[0].clientY;
		setP(p + (lastY - y) / travel());
		lastY = y;
	}, { passive: false });
	function touchEnd(e) {
		if (e.touches && e.touches.length) return;
		touchHold = false; lastY = null;
		if (!opened && p > 0) run();
	}
	window.addEventListener('touchend', touchEnd, { passive: true });
	window.addEventListener('touchcancel', touchEnd, { passive: true });

	// Keyboard scrolling opens the picture too.
	window.addEventListener('keydown', function (e) {
		if (opened) return;
		var t = e.target, tag = t && t.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
		if (e.key === ' ' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'End') { e.preventDefault(); run(); }
	});

	// Anything that moves the page some other way (a restored position, a jump
	// to a section, the scrollbar) simply finds the picture already open.
	window.addEventListener('scroll', function () {
		if (!opened && window.scrollY > 2) finish();
	}, { passive: true });
	window.addEventListener('resize', apply);
	if (window.scrollY > 2) finish(); else apply();
})();
