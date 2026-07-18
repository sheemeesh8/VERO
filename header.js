/* ============================================================================
   VERO — shared site header.
   Single source of truth for the header across every page. To change the
   header anywhere, edit this file: markup, styles and behaviour all live here.

   Usage on a page:
     <div id="siteHeader"></div>
     <script src="header.js"></script>
   Place both near the top of <body> so the header renders before any page
   script that reads its elements (e.g. badge counters).
   ========================================================================== */
(function () {
    'use strict';

    // ---- Styles (injected once; appended late so it wins over any page CSS) ----
    const CSS = `
        #siteHeader {
            background: transparent;
            border-bottom: none;
            padding: 8px 0;
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 100;
            width: 100%;
            box-shadow: none;
            transition: background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
        }
        #siteHeader .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 100%;
            margin: 0;
            padding: 0 16px;
            gap: 48px;
            direction: ltr;
        }
        #siteHeader .header-left { display: flex; gap: 32px; align-items: center; flex: 1; }

        /* ===== Search + filter (sticky header only) =====
           Hidden by default; the sticky/sticky-look header reveals it. The panel is
           generic: pages feed it options and receive the chosen filters through the
           window hooks at the bottom of this file. */
        /* Search pill + funnel circle: always visible, pinned just to the right of
           the logo (also before the header goes sticky). */
        #siteHeader .hdr-searchwrap {
            display: flex;
            align-items: center;
            gap: 12px;
            position: absolute;
            left: 430px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 3;
        }
        /* Logo + field keep the SAME positions before and after the header goes
           sticky, so nothing shifts on scroll. The logo sits centred in the gap, with
           equal spacing to the hamburger on its left and the field on its right. */
        #siteHeader .hdr-searchwrap { left: 210px; }
        #siteHeader .logo { left: 69px !important; }
        /* The rounded search field */
        #siteHeader .hdr-search {
            display: flex; align-items: center;
            /* Line style: no fill, just a hairline outline. */
            background: transparent;
            border: 1px solid rgba(0,0,0,0.3);
            border-radius: 999px;
            height: 46px;
            width: min(400px, 28vw);   /* widened; still clears the icon group on the right */
            padding: 4px 5px 4px 22px;
            box-sizing: border-box;
        }
        #siteHeader .hdr-search input {
            flex: 1; min-width: 0;
            border: none; background: none; outline: none;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 14px; font-weight: 500; color: #111;
            padding: 0 8px 0 0;
        }
        #siteHeader .hdr-search input::placeholder {
            color: #9a9a9a; font-weight: 500; letter-spacing: 0.3px;
        }
        /* Outlined circle with the magnifier drawn in the same line colour */
        #siteHeader .hdr-searchgo {
            width: 38px; height: 38px; border-radius: 50%;
            background: transparent; border: 1px solid rgba(0,0,0,0.3);
            cursor: pointer; flex: 0 0 auto;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.2s;
        }
        #siteHeader .hdr-searchgo:hover { background: rgba(0,0,0,0.06); }
        #siteHeader .hdr-searchgo svg {
            width: 16px; height: 16px; stroke: #111; fill: none;
            stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
        }
        /* Over the hero's black box the same line style flips to white. */
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-search,
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-searchgo {
            border-color: rgba(255,255,255,0.55);
        }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-search input { color: #fff; }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-search input::placeholder { color: rgba(255,255,255,0.6); }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-searchgo svg { stroke: #fff; }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-searchgo:hover { background: rgba(255,255,255,0.12); }
        /* Funnel: its own black circle with the white funnel, beside the field
           on the same (right) side as the magnifier. */
        #siteHeader .hdr-funnel {
            width: 44px; height: 44px; border-radius: 50%;
            background: #111; border: none; cursor: pointer; flex: 0 0 auto;
            display: flex; align-items: center; justify-content: center; padding: 0;
            transition: background 0.2s;
        }
        #siteHeader .hdr-funnel:hover, #siteHeader .hdr-funnel.on { background: #333; }
        #siteHeader .hdr-funnel svg { width: 18px; height: 18px; stroke: #fff; fill: none; stroke-width: 1.8; }

        /* the dropdown panel */
        #siteHeader .hdr-filters {
            position: absolute;
            top: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            width: min(1120px, 96vw);
            background: #fff;
            border: 1px solid #ececec;
            box-shadow: 0 20px 50px rgba(0,0,0,0.12);
            padding: 34px 38px 32px;
            display: none;
            z-index: 120;
            direction: ltr;
            text-align: left;
            font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        #siteHeader .hdr-filters.open { display: block; }
        /* Two halves: filters on the left, product preview on the right. */
        #siteHeader .hdr-inner {
            display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
        }
        #siteHeader .hdr-main { min-width: 0; display: flex; flex-direction: column; }
        #siteHeader .hdr-filters .hf-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px 24px;
        }
        /* Right half: quick preview of the best-matching product + results CTA. */
        #siteHeader .hdr-preview {
            display: flex; flex-direction: column; gap: 16px;
            border-inline-start: 1px solid #f0f0f0; padding-inline-start: 40px;
        }
        #siteHeader .hdr-preview-card {
            flex: 1; background: #efece4; border-radius: 12px; overflow: hidden;
            display: flex; flex-direction: column; min-height: 560px;
            transition: box-shadow 0.25s;
        }
        #siteHeader .hdr-preview-card:hover { box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
        #siteHeader .hdr-preview-img {
            flex: 1; display: flex; align-items: center; justify-content: center;
            font-size: 180px; color: rgba(0,0,0,0.85);
            transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        #siteHeader .hdr-preview-card:hover .hdr-preview-img { transform: scale(1.04); }
        #siteHeader .hdr-preview-info {
            display: flex; align-items: flex-end; justify-content: space-between;
            gap: 18px; padding: 26px 30px 30px;
        }
        #siteHeader .hdr-preview-price {
            font-size: 44px; font-weight: 800; letter-spacing: -0.5px; color: #111; line-height: 1;
        }
        #siteHeader .hdr-preview-meta { text-align: right; }
        #siteHeader .hdr-preview-seller {
            font-size: 18px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #111;
        }
        #siteHeader .hdr-preview-name {
            font-size: 15px; color: #8a8a8a; letter-spacing: 0.2px; margin-top: 6px;
            max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        #siteHeader .hdr-preview-empty {
            flex: 1; display: flex; align-items: center; justify-content: center; text-align: center;
            color: #b3b3b3; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; padding: 40px;
        }
        #siteHeader .hdr-preview-kicker {
            font-size: 9.5px; letter-spacing: 1.6px; text-transform: uppercase; color: #9a9a9a; font-weight: 700;
        }
        #siteHeader .hdr-results {
            width: 100%; background: #22372B; color: #fff; border: none; cursor: pointer;
            padding: 16px 24px; font-family: inherit; font-size: 12px; font-weight: 700;
            letter-spacing: 1.6px; text-transform: uppercase;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            transition: background 0.2s;
        }
        #siteHeader .hdr-results:hover { background: #2E4A3A; }
        #siteHeader .hdr-results .arrow { font-size: 14px; }
        @media (max-width: 820px) {
            #siteHeader .hdr-inner { grid-template-columns: 1fr; gap: 26px; }
            #siteHeader .hdr-preview { border-inline-start: none; padding-inline-start: 0;
                border-top: 1px solid #f0f0f0; padding-top: 24px; }
            #siteHeader .hdr-preview-card { min-height: 240px; }
        }
        #siteHeader .hdr-filters .hf-field { display: flex; flex-direction: column; gap: 6px; }
        #siteHeader .hdr-filters .hf-label {
            font-size: 9.5px; letter-spacing: 1.6px; text-transform: uppercase;
            color: #9a9a9a; font-weight: 700;
        }
        #siteHeader .hdr-filters select {
            appearance: none; -webkit-appearance: none;
            border: none; border-bottom: 1px solid #e2e2e2; background: none;
            padding: 4px 18px 6px 0;
            font-family: inherit; font-size: 12.5px; font-weight: 600; color: #111;
            cursor: pointer;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");
            background-repeat: no-repeat; background-position: right center; background-size: 12px;
        }
        #siteHeader .hdr-filters select:focus { outline: none; border-bottom-color: #111; }
        #siteHeader .hdr-price { margin-top: 20px; padding-top: 18px; border-top: 1px solid #f0f0f0; }
        #siteHeader .hdr-price .hf-label b { color: #111; }
        #siteHeader .hdr-price input {
            width: 100%; -webkit-appearance: none; appearance: none;
            height: 2px; background: #e2e2e2; cursor: pointer; margin-top: 10px;
        }
        #siteHeader .hdr-price input::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
            background: #111; cursor: pointer;
        }
        #siteHeader .hdr-acts { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 24px; }
        #siteHeader .hdr-acts button {
            border: none; background: none; cursor: pointer; font-family: inherit;
            font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
        }
        #siteHeader .hdr-clear { color: #9a9a9a; padding: 6px 0; }
        #siteHeader .hdr-clear:hover { color: #111; }
        #siteHeader .hdr-apply { background: #22372B !important; color: #fff; padding: 12px 26px !important; }
        #siteHeader .hdr-apply:hover { background: #2E4A3A !important; }
        @media (max-width: 1200px) {
            #siteHeader .hdr-searchwrap { display: none; }
        }
        /* Header contents are ALWAYS dark — on every page, at every scroll position.
           (Pages that sit on a dark hero keep their own overrides.) */
        #siteHeader .header-left > a {
            color: #111; text-decoration: none; font-size: 16px; font-weight: 600;
            letter-spacing: 1.3px; cursor: pointer; transition: color 0.25s ease;
            text-transform: uppercase; position: relative; display: flex;
            align-items: center; gap: 5px;
        }
        #siteHeader .header-left > a:hover { opacity: 1; color: rgba(0, 0, 0, 0.55); }
        #siteHeader .header-left > a .caret { width: 8px; height: 8px; opacity: 0.65; }
        #siteHeader .logo {
            font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            font-size: 34px; font-weight: 700; letter-spacing: 5px; color: #111;
            font-style: normal; text-transform: uppercase; min-width: 80px;
            flex: 0 0 auto; text-align: center; transition: all 0.3s ease;
            cursor: pointer; padding-left: 5px;
        }
        #siteHeader .logo:hover { color: rgba(0, 0, 0, 0.7); transform: scale(1.02); }
        #siteHeader .header-right { display: flex; gap: 12px; align-items: center; flex: 1; justify-content: flex-end; }
        #siteHeader .header-right .icon-wrap { margin-left: 13px; }
        /* Plain switch — no labels, just a track with a sliding knob. */
        #siteHeader .toggle-category {
            position: relative; display: inline-block; box-sizing: border-box;
            width: 52px; height: 28px; flex: 0 0 auto;
            background: transparent; padding: 0; border-radius: 999px; cursor: pointer;
            transition: all 0.3s ease; border: 1px solid rgba(0, 0, 0, 0.18);
        }
        #siteHeader .toggle-category::before {
            content: ''; position: absolute; top: 3px; left: 3px;
            width: 20px; height: 20px; border-radius: 50%; background: #111; z-index: 0;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s ease;
        }
        #siteHeader .toggle-category:has(#segFashion.active)::before { transform: translateX(24px); }
        /* labels kept in the markup for state/a11y, but not shown */
        #siteHeader .toggle-category .seg {
            position: absolute; width: 1px; height: 1px; overflow: hidden;
            clip: rect(0 0 0 0); white-space: nowrap;
        }
        #siteHeader .toggle-category:hover { border-color: rgba(0, 0, 0, 0.45); }
        #siteHeader .icon-btn {
            background: none; border: none; cursor: pointer; font-size: 27px;
            transition: transform 0.2s; color: #111; width: 56px; height: 56px;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        #siteHeader .icon-btn svg { width: 30px; height: 30px; stroke: #111 !important; fill: none; }
        #siteHeader .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }
        #siteHeader .icon-btn:hover { transform: scale(1.1); opacity: 0.65; }
        #siteHeader .upload-plus {
            color: #111 !important; border: 2px solid #111 !important;
            border-radius: 50%; width: 38px; height: 38px;
            animation: uploadPulse 1.2s ease-in-out infinite;
        }
        #siteHeader.scrolled .upload-plus { color: #111 !important; }
        @keyframes uploadPulse {
            0%, 100% { border-color: #111; box-shadow: 0 0 0 0 rgba(0,0,0,0.35); opacity: 1; }
            50% { border-color: rgba(0,0,0,0.35); box-shadow: 0 0 0 6px rgba(0,0,0,0); opacity: 0.55; }
        }
        /* .sticky-look = the sticky header's appearance without the scroll trigger,
           so a page (e.g. the home view) can wear it from the very top. */
        #siteHeader.scrolled,
        #siteHeader.sticky-look { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 12px rgba(0,0,0,0.05); }
        #siteHeader.scrolled .header-left > a,
        #siteHeader.scrolled .logo,
        #siteHeader.scrolled .toggle-category { color: #111; }
        #siteHeader.scrolled .toggle-category { border-color: rgba(0,0,0,0.18); }
        #siteHeader.scrolled .toggle-category::before { background: #111; }
        #siteHeader.scrolled .toggle-category .seg { color: #6b6b6b; }
        #siteHeader.scrolled .toggle-category .seg.active { color: #fff; }
        #siteHeader.scrolled .icon-btn { color: #111; }
        #siteHeader.scrolled .icon-btn svg { stroke: #111 !important; }
        #siteHeader.scrolled .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }

        /* ===== Header layout — one geometry for every header on the site =====
           White left area (hamburger + logo), the search field beside it, and the icon
           group spread evenly on the right. Identical before and after the header goes
           sticky, and identical on every page. Pages opt out with
           <body data-sticky="plain"> (e.g. the product page and the upload view). */
        :root {
            --hdr-band-w: 873px;      /* width of the black band */
            --hdr-band-right: 44px;   /* band offset from the right edge */
            /* Fixed spread, matching the home header. Shrinks with the viewport so the
               group never collides with the search field on narrower desktops. */
            /* 778px = the search field's right edge (624px) + a 26px gap + the 128px
               offset below, so the icons never run into the field. */
            --hdr-spread-w: min(749px, calc(100vw - 778px));
            --hdr-spread-right: 128px; /* icon group offset from the right edge */
        }
        @media (min-width: 901px) {
            body:not([data-sticky="plain"]) #siteHeader .header-container {
                position: relative;
                min-height: 56px; /* all groups go absolute below → keep header height */
                z-index: 1;
            }
            /* left: hamburger + logo only (nav links live in the drawer here) */
            body:not([data-sticky="plain"]) #siteHeader .header-left {
                position: absolute; left: 16px; top: 50%;
                transform: translateY(-50%); margin: 0;
            }
            body:not([data-sticky="plain"]) #siteHeader .header-left > a:not(.vero-hamburger) {
                display: none;
            }
            body:not([data-sticky="plain"]) #siteHeader .logo {
                position: absolute; left: 58px; top: 0; height: 56px;
                display: flex; align-items: center; margin: 0; padding-left: 0; color: #111;
            }
            /* right: the icon group spreads evenly across the right side */
            body:not([data-sticky="plain"]) #siteHeader .header-right {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: var(--hdr-spread-right); left: auto;
                width: var(--hdr-spread-w);
                justify-content: space-between; gap: 0;
            }
            body:not([data-sticky="plain"]) #siteHeader .upload-plus {
                animation: none !important; box-shadow: none !important;
            }
        }
        /* Over the black box the left-hand contents go white (the icon group on the
           right already does this via .sticky-look). */
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .logo,
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .vero-hamburger { color: #fff !important; }
        /* Force-dark: black header contents on light pages (e.g. buyer/seller area),
           regardless of scroll position and without the solid white background. */
        #siteHeader.force-dark .header-left > a,
        #siteHeader.force-dark .logo,
        #siteHeader.force-dark .toggle-category { color: #111; }
        #siteHeader.force-dark .header-left > a:hover { color: rgba(0,0,0,0.55); }
        #siteHeader.force-dark .toggle-category { border-color: rgba(0,0,0,0.18); }
        #siteHeader.force-dark .toggle-category::before { background: #111; }
        #siteHeader.force-dark .toggle-category .seg { color: #6b6b6b; }
        #siteHeader.force-dark .toggle-category .seg.active { color: #fff; }
        #siteHeader.force-dark .icon-btn { color: #111; }
        #siteHeader.force-dark .icon-btn svg { stroke: #111 !important; }
        #siteHeader.force-dark .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }
        #siteHeader.force-dark .upload-plus { color: #111 !important; }
        /* Force-light: permanent solid white header with black contents (homepage). */
        #siteHeader.force-light {
            background: #ffffff;
            border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        #siteHeader.force-light .header-left > a,
        #siteHeader.force-light .logo,
        #siteHeader.force-light .toggle-category { color: #111; }
        #siteHeader.force-light .header-left > a:hover { color: rgba(0,0,0,0.55); }
        #siteHeader.force-light .toggle-category { border-color: rgba(0,0,0,0.18); }
        #siteHeader.force-light .toggle-category::before { background: #111; }
        #siteHeader.force-light .toggle-category .seg { color: #6b6b6b; }
        #siteHeader.force-light .toggle-category .seg.active { color: #fff; }
        #siteHeader.force-light .icon-btn { color: #111; }
        #siteHeader.force-light .icon-btn svg { stroke: #111 !important; }
        #siteHeader.force-light .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }
        #siteHeader.force-light .upload-plus { color: #111 !important; }
        /* Badge on cart & wishlist */
        #siteHeader .icon-wrap { position: relative; display: inline-flex; }
        #siteHeader .badge {
            position: absolute; top: 50%; left: -13px; transform: translateY(-50%);
            background: #c0392b; color: white; font-size: 10px; font-weight: 700;
            width: 15px; height: 28px; padding: 0; border-radius: 8px; display: none;
            align-items: center; justify-content: center; font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        #siteHeader .badge.show { display: flex; }
        /* Hamburger (replaces the old Social link) */
        #siteHeader .vero-hamburger {
            display: inline-flex; flex-direction: column; justify-content: center;
            gap: 5px; width: 26px; height: 22px; cursor: pointer; padding: 0;
        }
        #siteHeader .vero-hamburger span {
            display: block; width: 100%; height: 2px; border-radius: 2px;
            background: currentColor; transition: transform 0.3s ease, opacity 0.2s ease;
        }
        #siteHeader .vero-hamburger:hover span { opacity: 0.7; }

        /* Slide-in side drawer */
        .vero-drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.45);
            opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease;
            z-index: 200;
        }
        .vero-drawer-overlay.open { opacity: 1; visibility: visible; }
        .vero-drawer {
            position: fixed; top: 0; left: 0; height: 100%; width: 440px; max-width: 90vw;
            background: #fff; z-index: 201; transform: translateX(-100%);
            transition: transform 0.38s cubic-bezier(0.65,0.05,0.1,1);
            box-shadow: 2px 0 30px rgba(0,0,0,0.12);
            display: flex; flex-direction: column; padding: 28px 32px;
            box-sizing: border-box; direction: ltr; text-align: left;
            font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        .vero-drawer.open { transform: translateX(0); }
        .vero-drawer-head {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 40px;
        }
        .vero-drawer-head .vero-drawer-logo {
            font-family: 'Playfair Display', Georgia, serif; font-size: 26px;
            font-weight: 700; letter-spacing: 5px; text-transform: uppercase; color: #111;
        }
        .vero-drawer-close {
            background: none; border: none; cursor: pointer; font-size: 28px;
            line-height: 1; color: #111; padding: 0; width: 32px; height: 32px;
        }
        .vero-drawer-close:hover { opacity: 0.6; }
        .vero-drawer-nav { display: flex; flex-direction: column; gap: 4px; }
        .vero-drawer-nav a {
            font-size: 19px; font-weight: 600; letter-spacing: 0.5px; color: #111;
            text-decoration: none; padding: 13px 0; border-bottom: 1px solid rgba(0,0,0,0.07);
            transition: color 0.2s ease, padding-left 0.2s ease;
        }
        .vero-drawer-nav a:hover { color: #8a7d5a; padding-left: 6px; }
        .vero-drawer-social {
            margin-top: auto; padding-top: 28px;
            display: flex; align-items: center; gap: 20px;
        }
        .vero-drawer-social a { color: #8a8a8a; display: inline-flex; transition: color 0.2s ease; }
        .vero-drawer-social a:hover { color: #111; }
        .vero-drawer-social svg { width: 21px; height: 21px; }

        @media (max-width: 768px) {
            #siteHeader .header-container { flex-wrap: wrap; gap: 20px; }
            #siteHeader .header-left { display: flex; flex: 1 1 100%; order: 1; justify-content: center; gap: 15px; font-size: 11px; }
            #siteHeader .header-left > a { font-size: 11px; }
            #siteHeader .logo { font-size: 20px; letter-spacing: 3px; order: 2; flex: 0 1 auto; }
            #siteHeader .header-right { order: 3; flex: 1 1 100%; justify-content: center; gap: 15px; }
        }
    `;

    // ---- Markup (identical everywhere) ----
    const MARKUP = `
        <div class="header-container">
            <div class="header-left">
                <a class="vero-hamburger" onclick="veroToggleDrawer()" aria-label="Menu" role="button" tabindex="0">
                    <span></span><span></span><span></span>
                </a>
                <a href="about.html">About Us</a>
                <a onclick="openMenu()">The Closet Magazine</a>
                <a onclick="openSellerArea()">Seller Area</a>
            </div>
            <div class="logo" onclick="showMain()" style="cursor:pointer">VERO</div>

            <!-- Search + filter: only visible once the header is sticky -->
            <div class="hdr-searchwrap">
                <div class="hdr-search">
                    <input id="veroSearchInput" type="search" placeholder="Search..."
                           oninput="veroSearch(this.value)" autocomplete="off">
                    <button class="hdr-searchgo" aria-label="Search" title="Search"
                            onclick="veroSearch(document.getElementById('veroSearchInput').value)">
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                        </svg>
                    </button>
                </div>
                <button class="hdr-funnel" id="veroFunnel" onclick="veroToggleFilters(event)" aria-label="Filters" title="Filters">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                </button>
            </div>

            <div class="hdr-filters" id="veroFilters">
                <div class="hdr-inner">
                    <div class="hdr-main">
                        <div class="hf-grid" id="veroFilterGrid"><!-- fields built by veroBuildFilters --></div>
                        <div class="hdr-price">
                            <span class="hf-label">Price — up to <b id="veroPriceOut">₪3000</b></span>
                            <input type="range" id="veroPriceRange" min="0" max="3000" step="10" value="3000"
                                   oninput="veroPriceInput(this.value)">
                        </div>
                        <div class="hdr-acts">
                            <button class="hdr-clear" onclick="veroClearFilters()">Clear all</button>
                            <button class="hdr-apply" onclick="veroApplyFilters()">Apply</button>
                        </div>
                    </div>
                    <div class="hdr-preview">
                        <span class="hdr-preview-kicker">Best match</span>
                        <div class="hdr-preview-card" id="veroFilterPreview"></div>
                        <button class="hdr-results" onclick="veroAllResults()">All results <span class="arrow">&rarr;</span></button>
                    </div>
                </div>
            </div>

            <div class="header-right">
                <div class="toggle-category" id="categoryToggleBtn" onclick="toggleSwitch()">
                    <span class="seg active" id="segArt">Art</span>
                    <span class="seg" id="segFashion">Fashion</span>
                </div>
                <span class="icon-wrap">
                    <button class="icon-btn" title="Wishlist" onclick="openWishlist()">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" style="stroke-width: 1.5;">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none"/>
                        </svg>
                    </button>
                    <span class="badge" id="wishlistBadge">0</span>
                </span>
                <span class="icon-wrap">
                    <button class="icon-btn" title="Cart" onclick="openCart()">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" style="stroke-width: 1.5;">
                            <path d="M6 6h15l-1.5 9h-12z" fill="none"/>
                            <path d="M6 6L5 2H2" fill="none"/>
                            <circle cx="9" cy="20" r="1.4" data-fill/>
                            <circle cx="17" cy="20" r="1.4" data-fill/>
                        </svg>
                    </button>
                    <span class="badge" id="cartBadge">0</span>
                </span>
                <button class="icon-btn" title="Deal Chats" onclick="vchatOpenInbox()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"></path>
                    </svg>
                </button>
                <button class="icon-btn" title="My Account" onclick="openBuyerArea()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" data-fill>
                        <circle cx="12" cy="8" r="4.2"/>
                        <path d="M12 13.5c-4.5 0-8.2 2.9-8.2 6.5h16.4c0-3.6-3.7-6.5-8.2-6.5z"/>
                    </svg>
                </button>
                <button class="icon-btn upload-plus" title="Upload Product" onclick="openUploadProduct()" style="font-size: 26px; font-weight: 800; line-height: 1;">+</button>
            </div>
        </div>
    `;

    // ---- Slide-in side drawer (opened by the header hamburger) ----
    const DRAWER_ICONS = {
        instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
        twitter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>'
    };
    const DRAWER_MARKUP = `
        <div class="vero-drawer-overlay" id="veroDrawerOverlay" onclick="veroCloseDrawer()"></div>
        <aside class="vero-drawer" id="veroDrawer" aria-hidden="true">
            <div class="vero-drawer-head">
                <span class="vero-drawer-logo">VERO</span>
                <button class="vero-drawer-close" aria-label="Close menu" onclick="veroCloseDrawer()">&times;</button>
            </div>
            <nav class="vero-drawer-nav">
                <a onclick="veroCloseDrawer(); showMain()">Home</a>
                <a href="about.html">About Us</a>
                <a onclick="veroCloseDrawer(); openMenu()">The Closet Magazine</a>
                <a onclick="veroCloseDrawer(); openSellerArea()">Seller Area</a>
                <a onclick="veroCloseDrawer(); openBuyerArea()">My Account</a>
            </nav>
            <div class="vero-drawer-social">
                <a href="#" aria-label="Instagram">${DRAWER_ICONS.instagram}</a>
                <a href="#" aria-label="Facebook">${DRAWER_ICONS.facebook}</a>
                <a href="#" aria-label="Twitter">${DRAWER_ICONS.twitter}</a>
                <a href="#" aria-label="LinkedIn">${DRAWER_ICONS.linkedin}</a>
            </div>
        </aside>
    `;

    function mountDrawer() {
        if (document.getElementById('veroDrawer')) return;
        const wrap = document.createElement('div');
        wrap.id = 'veroDrawerRoot';
        wrap.innerHTML = DRAWER_MARKUP;
        document.body.appendChild(wrap);
    }
    window.veroToggleDrawer = function () {
        mountDrawer();
        const d = document.getElementById('veroDrawer');
        const o = document.getElementById('veroDrawerOverlay');
        const open = d.classList.toggle('open');
        o.classList.toggle('open', open);
        d.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.style.overflow = open ? 'hidden' : '';
    };
    window.veroCloseDrawer = function () {
        const d = document.getElementById('veroDrawer');
        const o = document.getElementById('veroDrawerOverlay');
        if (d) d.classList.remove('open');
        if (o) o.classList.remove('open');
        if (d) d.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.veroCloseDrawer(); });

    // ---- Search + filter panel ----
    // The header owns the UI only. A page opts in by defining:
    //   window.veroFilterOptions() -> { brand:[], type:[], seller:[], style:[], color:[], gender:[] }
    //   window.veroOnFilters(filters)  — called on Apply / Clear
    //   window.veroOnSearch(query)     — called as the user types
    // Without those hooks the panel still opens, it just has nothing to drive.
    const VERO_FILTER_FIELDS = [
        { key: 'brand',  label: 'Brand' },
        { key: 'type',   label: 'Product type' },
        { key: 'seller', label: 'Seller' },
        { key: 'style',  label: 'Style' },
        { key: 'color',  label: 'Colour' },
        { key: 'gender', label: 'Gender' }
    ];
    const VERO_PRICE_MAX = 3000;
    let veroFilterState = { brand: '', type: '', seller: '', style: '', color: '', gender: '', maxPrice: VERO_PRICE_MAX };

    window.veroBuildFilters = function () {
        const grid = document.getElementById('veroFilterGrid');
        if (!grid) return;
        const opts = (typeof window.veroFilterOptions === 'function') ? (window.veroFilterOptions() || {}) : {};
        grid.innerHTML = VERO_FILTER_FIELDS.map(f => {
            const values = opts[f.key] || [];
            const cur = veroFilterState[f.key];
            return `
                <label class="hf-field">
                    <span class="hf-label">${f.label}</span>
                    <select onchange="veroSetFilter('${f.key}', this.value)">
                        <option value="">All</option>
                        ${values.map(v => `<option value="${String(v).replace(/"/g, '&quot;')}"${v === cur ? ' selected' : ''}>${v}</option>`).join('')}
                    </select>
                </label>`;
        }).join('');
        window.veroRenderPreview();
    };

    window.veroSetFilter = function (key, value) { veroFilterState[key] = value; window.veroRenderPreview(); };

    window.veroPriceInput = function (value) {
        veroFilterState.maxPrice = Number(value);
        const out = document.getElementById('veroPriceOut');
        if (out) out.textContent = '₪' + value;
        window.veroRenderPreview();
    };

    // Right-half live preview: shows the single product that best matches the
    // current selections. The page supplies the match via window.veroFilterPreview.
    window.veroRenderPreview = function () {
        const host = document.getElementById('veroFilterPreview');
        if (!host) return;
        const res = (typeof window.veroFilterPreview === 'function')
            ? (window.veroFilterPreview({ ...veroFilterState }) || null) : null;
        const p = res && res.product;
        if (!p) {
            host.innerHTML = `<div class="hdr-preview-empty">No matching product yet</div>`;
            return;
        }
        host.innerHTML = `
            <div class="hdr-preview-img">${p.icon || '🛍️'}</div>
            <div class="hdr-preview-info">
                <div class="hdr-preview-price">${p.price || ''}</div>
                <div class="hdr-preview-meta">
                    <div class="hdr-preview-seller">${p.seller || ''}</div>
                    <div class="hdr-preview-name">${p.name || ''}</div>
                </div>
            </div>`;
    };

    // "All results" → the page shows a full YOUR RESULTS listing if it can;
    // otherwise carry the filter state home and open it there.
    window.veroAllResults = function () {
        const state = { ...veroFilterState };
        if (typeof window.veroOnAllResults === 'function') {
            window.veroOnAllResults(state);
            window.veroToggleFilters();
        } else {
            try { localStorage.setItem('vero_results_filters', JSON.stringify(state)); } catch (e) {}
            location.href = 'index.html?open=results';
        }
    };

    window.veroToggleFilters = function (e) {
        if (e) e.stopPropagation();
        const panel = document.getElementById('veroFilters');
        const btn = document.getElementById('veroFunnel');
        if (!panel) return;
        const open = !panel.classList.contains('open');
        if (open) window.veroBuildFilters();
        panel.classList.toggle('open', open);
        if (btn) btn.classList.toggle('on', open);
    };

    window.veroApplyFilters = function () {
        if (typeof window.veroOnFilters === 'function') window.veroOnFilters({ ...veroFilterState });
        window.veroToggleFilters();
    };

    window.veroClearFilters = function () {
        veroFilterState = { brand: '', type: '', seller: '', style: '', color: '', gender: '', maxPrice: VERO_PRICE_MAX };
        const range = document.getElementById('veroPriceRange');
        const out = document.getElementById('veroPriceOut');
        if (range) range.value = VERO_PRICE_MAX;
        if (out) out.textContent = '₪' + VERO_PRICE_MAX;
        window.veroBuildFilters();
        if (typeof window.veroOnFilters === 'function') window.veroOnFilters({ ...veroFilterState });
    };

    window.veroSearch = function (query) {
        if (typeof window.veroOnSearch === 'function') window.veroOnSearch(query);
    };

    // click outside / Escape closes the panel
    document.addEventListener('click', e => {
        const panel = document.getElementById('veroFilters');
        if (!panel || !panel.classList.contains('open')) return;
        if (e.target.closest('#veroFilters') || e.target.closest('#veroFunnel')) return;
        panel.classList.remove('open');
        const btn = document.getElementById('veroFunnel');
        if (btn) btn.classList.remove('on');
    });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const panel = document.getElementById('veroFilters');
        if (panel) panel.classList.remove('open');
        const btn = document.getElementById('veroFunnel');
        if (btn) btn.classList.remove('on');
    });

    // ---- Fallback handlers ----
    // On index.html these globals are the real SPA functions and win (their
    // function declarations override these). On every other page they navigate
    // back to the home page and open the requested view via ?open=.
    const nav = url => { location.href = url; };
    function ensure(name, fn) { if (typeof window[name] !== 'function') window[name] = fn; }
    ensure('showMain', () => nav('index.html'));
    ensure('openWishlist', () => nav('index.html?open=wishlist'));
    ensure('openCart', () => nav('index.html?open=cart'));
    ensure('vchatOpenInbox', () => nav('index.html?open=chats'));
    ensure('openBuyerArea', () => nav('buyer-area.html'));
    ensure('openSellerArea', () => nav('seller-area.html'));
    ensure('openUploadProduct', () => nav('index.html?open=upload'));
    ensure('openMenu', () => nav('index.html?open=magazine'));
    ensure('showToast', msg => window.alert(msg));
    ensure('toggleSwitch', () => {
        const next = localStorage.getItem('vero_category') === 'clothing' ? 'art' : 'clothing';
        localStorage.setItem('vero_category', next);
        nav('index.html');
    });

    // ---- Render ----
    function injectCSS() {
        if (document.getElementById('veroHeaderCSS')) return;
        const style = document.createElement('style');
        style.id = 'veroHeaderCSS';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function render() {
        injectCSS();
        let host = document.getElementById('siteHeader');
        if (!host) {
            host = document.createElement('div');
            host.id = 'siteHeader';
            document.body.insertBefore(host, document.body.firstChild);
        }
        // Pages that sit on a light background (buyer/seller area) opt into a black
        // header via <body data-header="dark">.
        const mode = document.body.getAttribute('data-header');
        const cls = mode === 'dark' ? 'force-dark' : (mode === 'light' ? 'force-light' : '');
        // Use a real <header> element so existing selectors (header.scrolled) apply.
        host.outerHTML = `<header id="siteHeader" class="${cls}">${MARKUP}</header>`;
        mountDrawer();
        wireBehaviour();
    }

    function wireBehaviour() {
        // Solid header once scrolled past the top.
        const onScroll = () => {
            const hdr = document.querySelector('header#siteHeader') || document.querySelector('header');
            if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 80);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Reflect the stored ART/FASHION choice (index manages its own state).
        if (localStorage.getItem('vero_category') === 'clothing') {
            const art = document.getElementById('segArt');
            const fashion = document.getElementById('segFashion');
            if (art && fashion) { art.classList.remove('active'); fashion.classList.add('active'); }
        }

        // Badge counts from stored cart / wishlist (skipped on index, which owns them live).
        if (typeof window.updateBadges !== 'function') updateBadgesFromStorage();

        // If we arrived via ?open=… (from another page), open that view once the
        // real SPA handlers exist (index.html only).
        window.addEventListener('load', () => {
            const open = new URLSearchParams(location.search).get('open');
            if (!open) return;
            const map = { cart: 'openCart', wishlist: 'openWishlist', chats: 'vchatOpenInbox', upload: 'openUploadProduct', magazine: 'openMenu' };
            const fn = map[open];
            if (fn && typeof window[fn] === 'function') window[fn]();
        });
    }

    function count(key) {
        try {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            return arr.reduce((s, i) => s + (i.qty || 1), 0);
        } catch (e) { return 0; }
    }

    function updateBadgesFromStorage() {
        const set = (id, n) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = n;
            el.classList.toggle('show', n > 0);
        };
        set('cartBadge', count('vero_cart'));
        set('wishlistBadge', count('vero_wishlist'));
    }

    if (document.getElementById('siteHeader') || document.body) {
        render();
    } else {
        document.addEventListener('DOMContentLoaded', render);
    }
})();
