/* ============================================================================
   moravchick — shared site header.
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

    // ---- Header icon order (manual) ------------------------------------------
    // Left-to-right order of the items on the right side of the header. Edit this
    // list to move an icon; every page picks the change up. The keys match the
    // data-icon attributes on the markup below — any key left out of the list
    // keeps its markup position, and an unknown key is ignored.
    //
    // The order is fixed in code — there is NO stored/remembered previous order.
    // 'mode' is the switch and the + together — they ship as one unit (.hdr-mode-pair).
    const ICON_ORDER = ['search', 'account'];

    // Purge any previously-saved icon order from the browser, so no old layout
    // memory can ever override the order defined above.
    try {
        localStorage.removeItem('vero_header_icon_order');
        localStorage.removeItem('vero_header_icon_order_v2');
    } catch (e) { /* storage unavailable — nothing to purge */ }

    function currentIconOrder() {
        return ICON_ORDER;
    }

    // Applied as flex `order`, so the markup stays in its readable default order.
    function applyIconOrder() {
        const right = document.querySelector('#siteHeader .header-right');
        if (!right) return;
        const order = currentIconOrder();
        right.querySelectorAll('[data-icon]').forEach(el => {
            const i = order.indexOf(el.dataset.icon);
            const o = i === -1 ? '0' : String(i + 1);
            el.style.order = o;
            // .hdr-mode-pair is display:contents, so the flex line sees its two
            // children, not the wrapper — the order has to land on them.
            [...el.children].forEach(child => { child.style.order = o; });
        });
    }

    // Kept for compatibility, but ordering is no longer persisted anywhere.
    window.veroSetIconOrder = function () { applyIconOrder(); };
    window.veroResetIconOrder = function () { applyIconOrder(); };

    // ---- Styles (injected once; appended late so it wins over any page CSS) ----
    const CSS = `
        /* The header shows on every page, but not every page loads Poppins — pull it
           in here so the personal-area type voice is guaranteed wherever the header
           renders. design-system.css forces its own face on every element with a
           universal !important rule, so Poppins is reasserted the same way, scoped
           to #siteHeader, so only the header changes. */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600&family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,500;1,400;1,500&display=swap');
        #siteHeader, #siteHeader *, #siteHeader *::before, #siteHeader *::after,
        #veroDrawerRoot, #veroDrawerRoot *, #veroDrawerRoot *::before, #veroDrawerRoot *::after,
        #veroSearchPageRoot, #veroSearchPageRoot *, #veroSearchPageRoot *::before, #veroSearchPageRoot *::after {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        #siteHeader {
            background: transparent;
            border-bottom: none;
            padding: 4px 0;
            position: fixed;
            /* Sits a little below the very top edge rather than flush against it. */
            top: 10px; left: 0; right: 0;
            z-index: 100;
            width: 100%;
            box-shadow: none;
            transition: background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
        }
        /* Sticky header, pinned at the top. At the top of the page the bar is
           transparent and all icons are white; once you scroll it gains a solid
           white background and every icon flips to black. */
        #siteHeader {
            top: 0;
            /* Icons sit clearly below the phone's camera punch-hole (the frame's island
               spans ~13–26px; on a real device the notch is covered by the safe-area
               inset). Extra top offset keeps every header clear of the camera line. */
            padding-top: calc(env(safe-area-inset-top, 0px) + 38px);
            padding-bottom: 10px;
            background: transparent;
            border-bottom: none;
        }
        /* Default (top of page): white icons. */
        #siteHeader .header-left > a,
        #siteHeader .toggle-category,
        #siteHeader .icon-btn { color: #fff; }
        #siteHeader .icon-btn svg { stroke: #fff !important; }
        /* Wishlist heart + the little cart caret are white like the other header icons. */
        #siteHeader .hwp-ico, #siteHeader .hdr-cart-caret { color: #fff; }
        #siteHeader .hwp-ico svg, #siteHeader .hdr-cart-caret svg { stroke: #fff !important; }
        #siteHeader .toggle-category { border-color: rgba(255,255,255,0.7); }
        #siteHeader .toggle-category::before { background: #fff; }
        #siteHeader .toggle-category .seg { color: #ddd; }
        #siteHeader .toggle-category .seg.active { color: #111; }
        /* Sticky / scrolled state: light frosted "sticker" texture, matching the
           product pages — translucent white + blur, a hairline and a soft shadow,
           with every icon flipped to dark. */
        #siteHeader.scrolled {
            background: rgba(255, 255, 255, 0.86);
            -webkit-backdrop-filter: saturate(180%) blur(14px);
            backdrop-filter: saturate(180%) blur(14px);
            border-bottom: 1px solid #ece8e1;
            box-shadow: 0 2px 14px rgba(0, 0, 0, 0.05);
        }
        #siteHeader.scrolled .header-left > a,
        #siteHeader.scrolled .toggle-category,
        #siteHeader.scrolled .icon-btn { color: #1b1916; }
        #siteHeader.scrolled .icon-btn svg { stroke: #1b1916 !important; }
        #siteHeader.scrolled .hwp-ico,
        #siteHeader.scrolled .hdr-cart-caret { color: #1b1916; }
        #siteHeader.scrolled .hwp-ico svg,
        #siteHeader.scrolled .hdr-cart-caret svg { stroke: #1b1916 !important; }
        #siteHeader.scrolled .toggle-category { border-color: rgba(0,0,0,0.18); }
        #siteHeader.scrolled .toggle-category::before { background: #111; }
        #siteHeader.scrolled .toggle-category .seg { color: #6b6b6b; }
        #siteHeader.scrolled .toggle-category .seg.active { color: #fff; }
        #siteHeader .header-container {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            max-width: 100%;
            margin: 0;
            padding: 0 32px;
            gap: 24px;
            direction: ltr;
        }
        #siteHeader .header-left { display: flex; gap: 22px; align-items: center; justify-self: start; grid-column: 1; }
        /* Left stack: the Art/Fashion toggle on top, the search icon beneath it. */
        #siteHeader .hdr-left-stack {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        /* Peacock mark in the centre column, sized to match the icon row. */
        #siteHeader .header-container > .header-right { grid-column: 3; }
        #siteHeader .logo-peacock-wrap { grid-column: 2; justify-self: center; position: static;
            left: auto !important; padding: 0; min-width: 0; display: flex; align-items: center; cursor: pointer; }
        #siteHeader .logo .logo-peacock { height: 34px; width: auto; }
        /* "Menu" / "Search" text buttons on the left, à la couture navigation. */
        #siteHeader .hdr-textbtn {
            display: inline-flex; align-items: center; gap: 9px;
            color: #111; cursor: pointer; text-decoration: none;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 15.00px; font-weight: 500; letter-spacing: 0.3px;
            transition: opacity 0.2s ease;
        }
        #siteHeader .hdr-textbtn:hover { opacity: 0.6; }
        #siteHeader .hdr-textbtn .vero-hamburger { width: 24px; height: 18px; gap: 4px; align-items: stretch; }

        /* ===== Search + filter (sticky header only) =====
           Hidden by default; the sticky/sticky-look header reveals it. The panel is
           generic: pages feed it options and receive the chosen filters through the
           window hooks at the bottom of this file. */
        /* Search pill + funnel circle: always visible, pinned just to the right of
           the logo (also before the header goes sticky). */
        /* One source of truth for the colour of the search field, the magnifier and
           the funnel. Black in both modes — every icon in the header is black. The
           per-mode green / burgundy is kept here, commented, in case it comes back. */
        body { --hdr-mode-color: #111; }            /* was #22372B in fashion mode */
        body[data-mode="art"] { --hdr-mode-color: #111; }   /* was #6E232B */
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
        /* Tucked up against the logo rather than floating in the middle of the bar. */
        #siteHeader .hdr-searchwrap { left: 186px; }
        #siteHeader .logo { left: 69px !important; }
        /* Minimal: no fill, no shadow, no pill — a single hairline rule under the
           field, which darkens to the mode colour while it is being used. */
        #siteHeader .hdr-search {
            display: flex; align-items: center;
            /* Capsule with an outline only — no fill. The outline (and the text and
               magnifier inside) is black by default and turns white on the black
               sticky header, so it reads against whatever is behind it. */
            background: transparent;
            border: 1.5px solid #111;
            border-radius: 999px;
            height: 46px;
            width: min(420px, 30vw);
            padding: 0 4px 0 22px;   /* text breathes on the left; the button hugs the right cap */
            box-sizing: border-box;
            box-shadow: none;
            transition: border-color 0.2s;
        }
        #siteHeader .hdr-search:focus-within {
            border-color: #111;
        }
        #siteHeader .hdr-search input {
            flex: 1; min-width: 0;
            border: none; background: none; outline: none;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 12.50px; font-weight: 500; color: #111;
            padding: 0 8px 0 0;
        }
        #siteHeader .hdr-search input::placeholder {
            color: #6e6e6e; font-weight: 500; letter-spacing: 0.3px;
        }
        /* Just the magnifier glyph — no disc behind it. */
        #siteHeader .hdr-searchgo {
            width: 34px; height: 34px; border-radius: 0;
            background: none;
            border: none;
            cursor: pointer; flex: 0 0 auto;
            display: flex; align-items: center; justify-content: center;
            transition: opacity 0.2s;
        }
        #siteHeader .hdr-searchgo:hover { opacity: 0.6; filter: none; }
        #siteHeader .hdr-searchgo svg {
            width: 18px; height: 18px;
            stroke: #111; fill: none;
            stroke-width: 1.25; stroke-linecap: round; stroke-linejoin: round;
        }
        /* This block used to invert the field over the hero's dark box. No dark box
           is left, so it keeps the same black treatment as everywhere else. */
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-search {
            background: transparent;
            border-color: #111;
            box-shadow: none;
        }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-search input { color: #111; }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-search input::placeholder { color: #6e6e6e; }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-searchgo svg { stroke: #111; }
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .hdr-funnel svg { stroke: #fff; fill: #fff; }
        /* Category toggle on the light sticky-look bar: it inherits the white
           treatment made for the dark hero, which is invisible here — force it black
           to match the search field and the rest of the sticky-look chrome. */
        #siteHeader.sticky-look:not(.scrolled) .toggle-category { color: #111; border-color: rgba(0,0,0,0.22); }
        #siteHeader.sticky-look:not(.scrolled) .toggle-category::before { background: #111; }
        #siteHeader.sticky-look:not(.scrolled) .toggle-category .seg { color: #6b6b6b; }
        #siteHeader.sticky-look:not(.scrolled) .toggle-category .seg.active { color: #fff; }
        /* Funnel: the bare glyph beside the field, matching the magnifier. */
        #siteHeader .hdr-funnel {
            width: 54px; height: 54px; border-radius: 50%;
            background: #111;
            border: none; cursor: pointer; flex: 0 0 auto;
            display: flex; align-items: center; justify-content: center; padding: 0;
            transition: opacity 0.2s;
        }
        #siteHeader .hdr-funnel:hover, #siteHeader .hdr-funnel.on { opacity: 0.6; filter: none; }
        #siteHeader .hdr-funnel svg {
            width: 27px; height: 27px;
            stroke: #fff; fill: #fff; stroke-width: 1.25;
        }
        /* The connector line has no area to fill — keep it a white stroke. */
        #siteHeader .hdr-funnel svg line { stroke: #fff; }

        /* ---- Search dock in the icon row: a magnifier circle that flies the
           field open to its left, with the filter funnel at the far left. ---- */
        #siteHeader .hdr-searchdock {
            position: relative; display: flex; align-items: center;
            direction: ltr; flex: 0 0 auto;
        }
        #siteHeader .hdr-searchtoggle {
            position: relative; z-index: 2;
            width: 40px; height: 40px; border-radius: 50%;
            border: 1.6px solid #111; background: #fff; color: #111;
            cursor: pointer; flex: 0 0 auto; padding: 0;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease, background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
        }
        #siteHeader .hdr-searchtoggle:hover { transform: scale(1.06); }
        #siteHeader .hdr-searchtoggle svg {
            width: 18px; height: 18px; stroke: currentColor; fill: none;
            stroke-width: 1.25; stroke-linecap: round; stroke-linejoin: round;
        }
        /* Open: the trigger fills in as a solid black circle. */
        #siteHeader .hdr-searchdock.open .hdr-searchtoggle { background: #111; border-color: #111; color: #fff; }

        /* The fly-out holds the funnel + field. Anchored to the toggle's left edge,
           it grows leftward on open. Absolute, so it glides over the row without
           shoving the other icons. */
        #siteHeader .hdr-searchfly {
            position: absolute; top: 50%; right: 48px; transform: translateY(-50%);
            display: flex; align-items: center; justify-content: flex-end; gap: 10px;
            direction: ltr; width: 0; opacity: 0; overflow: hidden; pointer-events: none;
            transition: width 0.44s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.26s ease;
        }
        #siteHeader .hdr-searchdock.open .hdr-searchfly {
            width: min(340px, 40vw); opacity: 1; pointer-events: auto;
        }
        #siteHeader .hdr-searchfly .hdr-funnel { flex: 0 0 auto; }
        #siteHeader .hdr-searchfly .hdr-search { flex: 1 1 auto; min-width: 0; width: auto; }

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
        /* Stacked: the filter fields on top, the best-match product below them,
           so the panel runs long and the product reads as a promoted slide. */
        #siteHeader .hdr-inner {
            display: flex; flex-direction: column; gap: 34px;
        }
        #siteHeader .hdr-main { min-width: 0; display: flex; flex-direction: column; }
        #siteHeader .hdr-filters .hf-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px 24px;
        }
        /* Below the filters: the best-matching product, laid out as a promoted
           slide — image beside the copy, company name / product name / short
           description / price / buy button. Type follows .promo-* in index.html,
           scaled to the panel. */
        #siteHeader .hdr-preview {
            display: flex; flex-direction: column; gap: 16px;
            border-top: 1px solid #f0f0f0; padding-top: 28px;
        }
        #siteHeader .hdr-preview-card {
            background: transparent; overflow: hidden;
            display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            align-items: stretch; gap: 48px;
        }
        #siteHeader .hdr-preview-img {
            display: flex; align-items: center; justify-content: center;
            background: #efece4; border-radius: 4px;
            aspect-ratio: 4 / 5; max-height: 420px; align-self: stretch;
            font-size: 125.00px; color: rgba(0,0,0,0.85);
            text-decoration: none;
            transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        #siteHeader .hdr-preview-card:hover .hdr-preview-img { transform: scale(1.02); }
        /* Copy runs the image's full height: first line on its top edge, buy
           button on its bottom edge. */
        #siteHeader .hdr-preview-info {
            display: flex; flex-direction: column; justify-content: space-between;
            align-items: flex-start; gap: 18px; padding: 4px 0;
        }
        #siteHeader .hdr-preview-head { display: flex; flex-direction: column; gap: 8px; }
        #siteHeader .hdr-preview-foot { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
        /* Company name — large, regular weight, one word per line. */
        #siteHeader .hdr-preview-seller {
            font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            display: block; white-space: nowrap;
            font-size: 38.33px; font-weight: 400; letter-spacing: 0.5px;
            text-transform: uppercase; line-height: 1.15; color: #111;
        }
        #siteHeader .hdr-preview-seller > span { white-space: nowrap; }
        #siteHeader .hdr-preview-seller.one-word { font-size: 38.33px; }
        /* The piece's own name — smaller than the company name, and bold. */
        #siteHeader .hdr-preview-name {
            font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            font-size: 21.67px; font-weight: 700; text-transform: uppercase;
            line-height: 1.25; letter-spacing: 0.5px; color: #111;
            overflow-wrap: anywhere; margin: 0;
        }
        #siteHeader .hdr-preview-desc {
            font-size: 12.50px; line-height: 1.7; color: #6b665e; max-width: 460px; margin: 0;
        }
        #siteHeader .hdr-preview-price {
            font-size: 25.00px; font-weight: 600; letter-spacing: 0.5px; color: #111; margin: 2px 0;
        }
        #siteHeader .hdr-preview-buy {
            display: inline-flex; align-items: center; gap: 12px;
            background: #22372B; border: 1px solid #22372B; cursor: pointer;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 10.83px; font-weight: 700; letter-spacing: 2px;
            text-transform: uppercase; color: #fff; padding: 14px 26px;
            transition: gap 0.3s, background 0.25s;
        }
        #siteHeader .hdr-preview-buy:hover { gap: 16px; background: #2E4A3A; border-color: #2E4A3A; }
        #siteHeader .hdr-preview-empty {
            grid-column: 1 / -1;
            display: flex; align-items: center; justify-content: center; text-align: center;
            color: #b3b3b3; font-size: 11.67px; letter-spacing: 1.5px; text-transform: uppercase; padding: 60px 40px;
        }
        #siteHeader .hdr-preview-kicker {
            font-size: 7.92px; letter-spacing: 1.6px; text-transform: uppercase; color: #9a9a9a; font-weight: 700;
        }
        #siteHeader .hdr-results {
            width: 100%; background: #22372B; color: #fff; border: none; cursor: pointer;
            padding: 16px 24px; font-family: inherit; font-size: 10.00px; font-weight: 700;
            letter-spacing: 1.6px; text-transform: uppercase;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            transition: background 0.2s;
        }
        #siteHeader .hdr-results:hover { background: #2E4A3A; }
        #siteHeader .hdr-results .arrow { font-size: 11.67px; }
        @media (max-width: 820px) {
            #siteHeader .hdr-filters .hf-grid { grid-template-columns: repeat(2, 1fr); }
            #siteHeader .hdr-inner { gap: 26px; }
            #siteHeader .hdr-preview-card { grid-template-columns: 1fr; gap: 22px; }
            #siteHeader .hdr-preview-img { aspect-ratio: 16 / 10; font-size: 75.00px; }
            #siteHeader .hdr-preview-seller { font-size: 28.33px; }
            #siteHeader .hdr-preview-seller.one-word { font-size: 40.00px; }
        }
        #siteHeader .hdr-filters .hf-field { display: flex; flex-direction: column; gap: 6px; }
        #siteHeader .hdr-filters .hf-label {
            font-size: 7.92px; letter-spacing: 1.6px; text-transform: uppercase;
            color: #9a9a9a; font-weight: 700;
        }
        #siteHeader .hdr-filters select {
            appearance: none; -webkit-appearance: none;
            border: none; border-bottom: 1px solid #e2e2e2; background: none;
            padding: 4px 18px 6px 0;
            font-family: inherit; font-size: 10.42px; font-weight: 600; color: #111;
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
            font-size: 9.17px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
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
            color: #111; text-decoration: none; font-size: 13.33px; font-weight: 600;
            letter-spacing: 1.3px; cursor: pointer; transition: color 0.25s ease;
            text-transform: uppercase; position: relative; display: flex;
            align-items: center; gap: 5px;
        }
        #siteHeader .header-left > a:hover { opacity: 1; color: rgba(0, 0, 0, 0.55); }
        #siteHeader .header-left > a .caret { width: 8px; height: 8px; opacity: 0.65; }
        /* ---- Search bar + social icons + Add Product (nav row) ---- */
        #siteHeader .hdr-search {
            display: flex; align-items: center; gap: 8px;
            height: 34px; padding: 0 14px;
            border: 1px solid rgba(0, 0, 0, 0.2); border-radius: 999px;
            background: rgba(0, 0, 0, 0.02); flex: 0 0 auto;
        }
        #siteHeader .hdr-search .hdr-search-ico { width: 15px; height: 15px; color: #111; opacity: 0.55; flex: 0 0 auto; }
        #siteHeader .hdr-search input {
            border: none; background: transparent; outline: none; width: 110px;
            font-family: inherit; font-size: 10.83px; letter-spacing: 0.5px; color: #111;
        }
        #siteHeader .hdr-search input::placeholder {
            color: rgba(0, 0, 0, 0.45); text-transform: uppercase; letter-spacing: 1.2px; font-size: 10.00px;
        }
        #siteHeader .hdr-social { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        #siteHeader .hdr-soc { color: #111; display: flex; opacity: 0.72; transition: opacity 0.2s ease; }
        #siteHeader .hdr-soc:hover { opacity: 1; }
        #siteHeader .hdr-soc svg { width: 18px; height: 18px; }
        #siteHeader .hdr-addproduct {
            height: 34px; padding: 0 18px; border-radius: 999px;
            background: #111; color: #fff; border: none; cursor: pointer;
            font-family: inherit; font-size: 10.00px; font-weight: 700; letter-spacing: 1.5px;
            text-transform: uppercase; white-space: nowrap; flex: 0 0 auto;
            transition: background 0.2s ease, transform 0.2s ease;
        }
        #siteHeader .hdr-addproduct:hover { background: #333; transform: translateY(-1px); }
        /* On dark heroes the header flips to light — keep these controls legible too. */
        #siteHeader.over-dark .hdr-search,
        #siteHeader.wh-over-hero .hdr-search,
        #siteHeader.sticky-look:not(.scrolled) .hdr-search { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.06); }
        #siteHeader.over-dark .hdr-search .hdr-search-ico,
        #siteHeader.over-dark .hdr-search input,
        #siteHeader.over-dark .hdr-soc,
        #siteHeader.wh-over-hero .hdr-search .hdr-search-ico,
        #siteHeader.wh-over-hero .hdr-search input,
        #siteHeader.wh-over-hero .hdr-soc,
        #siteHeader.sticky-look:not(.scrolled) .hdr-search .hdr-search-ico,
        #siteHeader.sticky-look:not(.scrolled) .hdr-search input,
        #siteHeader.sticky-look:not(.scrolled) .hdr-soc { color: #fff; }
        #siteHeader.over-dark .hdr-search input::placeholder,
        #siteHeader.wh-over-hero .hdr-search input::placeholder,
        #siteHeader.sticky-look:not(.scrolled) .hdr-search input::placeholder { color: rgba(255,255,255,0.6); }
        #siteHeader.over-dark .hdr-addproduct,
        #siteHeader.wh-over-hero .hdr-addproduct,
        #siteHeader.sticky-look:not(.scrolled) .hdr-addproduct { background: #fff; color: #111; }
        #siteHeader .logo {
            font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            font-size: 35.00px; font-weight: 700; letter-spacing: 5px; color: #111;
            font-style: normal; text-transform: uppercase; min-width: 80px;
            flex: 0 0 auto; text-align: center; transition: all 0.3s ease;
            cursor: pointer; padding-left: 5px;
        }
        #siteHeader .logo:hover { color: rgba(0, 0, 0, 0.7); transform: scale(1.02); }
        /* The Vero script logo is a white-on-transparent PNG. It is flipped to black
           everywhere — the header now reads dark on light throughout. */
        /* The Vero script logo art is white-on-transparent. mix-blend-mode:difference
           makes every pixel render as the inverse of whatever sits behind it, so the
           logo is always the opposite colour of its background — black on light,
           white on dark — with no per-context filter needed. */
        /* The logo art is a white-on-transparent PNG; paint it solid black everywhere. */
        #siteHeader .logo .logo-img { height: 42px; width: auto; display: block; mix-blend-mode: normal !important; filter: brightness(0) !important; transition: filter 0.25s ease; }
        /* Script wordmark logo (moravchick) — oak on a light bar, white over the dark hero. */
        #siteHeader .logo .logo-script:not(#z):not(#z):not(#z) {
            font-family: 'Pinyon Script', cursive !important; font-weight: 400 !important;
            font-size: 32px; line-height: 1; letter-spacing: 0; text-transform: none;
            color: var(--oak, #2A331B); white-space: nowrap; display: block;
            transition: color 0.25s ease; -webkit-font-smoothing: antialiased;
        }
        /* Over the dark hero (transparent / scrolled-over-dark) → white. */
        #siteHeader.sticky-look:not(.scrolled) .logo .logo-script,
        #siteHeader.scrolled.over-dark .logo .logo-script { color: #fff !important; }
        /* While the header floats transparent over the hero image, the logo is white;
           once the header turns solid (scrolled), it reverts to black (rule above). */
        #siteHeader.sticky-look:not(.scrolled) .logo .logo-img { filter: brightness(0) invert(1) !important; }
        #siteHeader .header-right { display: flex; gap: 0; align-items: center; flex: 1; justify-content: flex-end; }
        #siteHeader .header-right .icon-btn { width: 30px; height: 34px; }
        #siteHeader .header-right .icon-wrap { margin-left: 0; }
        /* The switch and the plus keep their shared styling through this wrapper, but
           the wrapper itself is transparent to layout — both controls are direct flex
           items of .header-right, so every gap in the icon row is the same. */
        #siteHeader .hdr-mode-pair { display: contents; }
        /* Plain switch — no labels, just a track with a sliding knob. */
        #siteHeader .toggle-category {
            position: relative; display: inline-block; box-sizing: border-box;
            width: 34px; height: 18px; flex: 0 0 auto;
            background: transparent; padding: 0; border-radius: 999px; cursor: pointer;
            /* Not "all": border-color is mode-driven and must switch immediately when
               the mode flips — transitioning it left the switch showing the old
               mode's colour. */
            transition: background 0.3s ease; border: 1px solid rgba(0, 0, 0, 0.18);
        }
        #siteHeader .toggle-category::before {
            content: ''; position: absolute; top: 2px; left: 2px;
            width: 14px; height: 14px; border-radius: 50%; background: #111; z-index: 0;
            /* Only the slide animates. The knob's colour is mode-driven, same as the
               track's border, and must switch instantly rather than fade. */
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #siteHeader .toggle-category:has(#segFashion.active)::before { transform: translateX(16px); }
        /* labels kept in the markup for state/a11y, but not shown */
        #siteHeader .toggle-category .seg {
            position: absolute; width: 1px; height: 1px; overflow: hidden;
            clip: rect(0 0 0 0); white-space: nowrap;
        }
        #siteHeader .toggle-category:hover { border-color: rgba(0, 0, 0, 0.45); }
        #siteHeader .icon-btn {
            background: none; border: none; cursor: pointer; font-size: 26.67px;
            transition: transform 0.2s; color: #111; width: 38px; height: 38px;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        /* Every icon glyph in the header shares one size. */
        #siteHeader .icon-btn svg { width: 20px; height: 20px; stroke: #111 !important; fill: none; }
        #siteHeader .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }
        #siteHeader .icon-btn:hover { transform: scale(1.1); opacity: 0.65; }
        /* Account cluster: personal-area profile picture + a switch-profile button. */
        #siteHeader .hdr-account { display: inline-flex; align-items: center; gap: 2px; }
        #siteHeader .hdr-avatar-btn { width: 34px; height: 34px; }
        #siteHeader .hdr-avatar {
            width: 20px; height: 20px; border-radius: 50%; overflow: hidden;
            border: 1.5px solid currentColor; background: #e6e4df center / cover no-repeat;
            display: grid; place-items: center; font-size: 10.50px; font-weight: 500;
            color: currentColor; text-transform: uppercase; line-height: 1;
        }
        #siteHeader .hdr-avatar.has-img { border-color: rgba(0,0,0,0.15); }
        /* Seller account: a green ring around the profile picture so you can tell
           at a glance which account you're acting as. */
        #siteHeader .hdr-avatar.is-seller {
            border-color: #1DA65A !important; border-width: 2.5px;
            box-shadow: 0 0 0 2px rgba(29,166,90,0.25);
        }
        #siteHeader .hdr-switch { width: 22px; height: 22px; }
        #siteHeader .hdr-switch svg { width: 20px; height: 20px; stroke: currentColor !important; fill: none; }
        /* Long-press profile switcher (Instagram-style): a small card listing the
           personal + business accounts; tap one to switch to it. */
        .vero-acct-switcher {
            position: fixed; z-index: 100001; width: 240px;
            /* Frameless: no card background, border or shadow — just the rows. */
            background: none; border: none; border-radius: 0; box-shadow: none; padding: 0;
            opacity: 0; transform: translateY(-6px) scale(0.98); transform-origin: top right;
            transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .vero-acct-switcher.open { opacity: 1; transform: translateY(0) scale(1); }
        /* Right-aligned: the avatar circle sits flush right (under the header icon),
           the name snug to its left. */
        .vero-acct-switcher .vas-row {
            display: flex; align-items: center; justify-content: flex-end; gap: 10px; width: 100%;
            border: none; background: none; cursor: pointer; padding: 7px 12px; border-radius: 12px;
            text-align: right; font-family: inherit;
        }
        .vero-acct-switcher .vas-name {
            flex: none; font-size: 14px; font-weight: 600; color: #111;
            white-space: nowrap; text-shadow: 0 1px 6px rgba(0,0,0,0.28);
        }
        /* White names over the hero / gender slider, black in the feed (set by JS). */
        .vero-acct-switcher.vas-on-hero .vas-name { color: #fff; }
        .vero-acct-switcher:not(.vas-on-hero) .vas-name { color: #111; text-shadow: none; }
        .vero-acct-switcher .vas-av {
            width: 40px; height: 40px; border-radius: 50%; flex: 0 0 auto;
            background: #e6e4df center / cover no-repeat; display: grid; place-items: center;
            font-size: 16px; font-weight: 600; color: #333; text-transform: uppercase;
            border: 1.5px solid rgba(0,0,0,0.12);
        }
        .vero-acct-switcher .vas-row.on .vas-av {
            border-color: #1DA65A; box-shadow: 0 0 0 2px rgba(29,166,90,0.25);
        }
        /* Profile-switch splash: a Gucci-style WELCOME screen shown between areas —
           black field, an editorial serif name, a thin rule and a spaced overline. */
        .vero-switch-splash {
            position: fixed; inset: 0; z-index: 99999; background: #070c1c; color: #fff;
            display: grid; place-items: center; opacity: 0; transition: opacity 0.4s ease;
        }
        .vero-switch-splash.show { opacity: 1; }
        .vero-switch-splash .vss-inner { text-align: center; }
        /* Two-stage fade IN (overline, then name) and two-stage fade OUT (name, then
           overline): the two lines animate one after the other, under the black field. */
        .vero-switch-splash .vss-welcome,
        .vero-switch-splash .vss-name {
            opacity: 0; transform: translateY(14px);
            transition: opacity 0.55s ease, transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .vero-switch-splash.show .vss-welcome { opacity: 1; transform: translateY(0); transition-delay: 0.05s; }
        .vero-switch-splash.show .vss-name    { opacity: 1; transform: translateY(0); transition-delay: 0.35s; }
        .vero-switch-splash.leaving .vss-name    { opacity: 0; transform: translateY(-10px); transition-delay: 0s; }
        .vero-switch-splash.leaving .vss-welcome { opacity: 0; transform: translateY(-10px); transition-delay: 0.25s; }
        .vero-switch-splash .vss-welcome {
            font-family: 'Inter', 'Poppins', 'Segoe UI', sans-serif !important;
            font-size: 12px; font-weight: 300; letter-spacing: 9px; text-transform: uppercase;
            color: rgba(255,255,255,0.55); margin-bottom: 24px;
        }
        /* A hairline rule under the overline, like the sign-up screen. */
        .vero-switch-splash .vss-welcome::after {
            content: ''; display: block; width: 40px; height: 1px;
            background: rgba(255,255,255,0.4); margin: 20px auto 0;
        }
        .vero-switch-splash .vss-name {
            font-family: 'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif !important;
            font-size: clamp(52px, 13vw, 116px); font-weight: 400; letter-spacing: 1.5px;
            line-height: 1.02; color: #fff;
            font-optical-sizing: none; font-variation-settings: 'opsz' 48;
        }
        .vero-switch-splash .vss-caption {
            margin-top: 20px; font-family: 'Inter', 'Poppins', sans-serif !important;
            font-size: 12.5px; font-weight: 300; letter-spacing: 0.4px;
            color: rgba(255,255,255,0.7);
        }
        /* Beat aharoni.css's universal 3-id !important font rule so the splash keeps
           its Bodoni name and Inter overline. */
        .vero-switch-splash .vss-name:not(#zz):not(#zz):not(#zz) {
            font-family: 'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif !important;
        }
        .vero-switch-splash .vss-welcome:not(#zz):not(#zz):not(#zz),
        .vero-switch-splash .vss-caption:not(#zz):not(#zz):not(#zz) {
            font-family: 'Inter', 'Poppins', 'Segoe UI', sans-serif !important;
        }
        #siteHeader .upload-plus {
            color: #111 !important; border: 2px solid #111 !important;
            border-radius: 50%; width: 24px; height: 24px;
            animation: uploadPulse 1.2s ease-in-out infinite;
        }
        #siteHeader.scrolled .upload-plus { color: #111 !important; }
        @keyframes uploadPulse {
            0%, 100% { border-color: #111; box-shadow: 0 0 0 0 rgba(0,0,0,0.35); opacity: 1; }
            50% { border-color: rgba(0,0,0,0.35); box-shadow: 0 0 0 6px rgba(0,0,0,0); opacity: 0.55; }
        }
        /* .sticky-look = the sticky header's appearance without the scroll trigger,
           so a page (e.g. the home view) can wear it from the very top. */
        #siteHeader.scrolled { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 12px rgba(0,0,0,0.05); }
        /* Home (sticky-look) header floats transparent over the full-bleed hero image
           until you scroll past it — only the white content shows, no white bar. */
        #siteHeader.sticky-look:not(.scrolled) { background: transparent; border-bottom: none; box-shadow: none; }
        #siteHeader.sticky-look.scrolled { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 12px rgba(0,0,0,0.05); }
        /* Home header floating over the hero — the category switch reads white (track
           border + knob) so it stands out on the dark image, matching the white logo. */
        #siteHeader.sticky-look:not(.scrolled) .toggle-category { border-color: rgba(255,255,255,0.6); }
        #siteHeader.sticky-look:not(.scrolled) .toggle-category::before { background: #fff; }
        #siteHeader.sticky-look:not(.scrolled) .toggle-category:hover { border-color: #fff; }
        /* The header sits 18px down from the top edge; this fills that strip with
           whatever the header is wearing, so the page never shows through above it. */
        #siteHeader::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: 100%;
            height: 18px;
            background: inherit;
        }
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

        /* ===== Sticky header over the black band =====
           While the scrolled header still sits above the feed filter line, it wears
           black with light content; once it passes the filter it reverts to the white
           scrolled header above. Toggled by wireBehaviour(). */
        #siteHeader.scrolled.over-dark {
            background: #000;
            border-bottom: none;
            box-shadow: none;
        }
        #siteHeader.scrolled.over-dark .header-left > a,
        #siteHeader.scrolled.over-dark .logo,
        #siteHeader.scrolled.over-dark .toggle-category { color: #fff; }
        /* mix-blend-mode already inverts the logo against the dark header — no filter. */
        #siteHeader.scrolled.over-dark .logo-img { filter: none; }
        #siteHeader.scrolled.over-dark .header-left > a:hover { color: rgba(255,255,255,0.6); }
        #siteHeader.scrolled.over-dark .toggle-category { border-color: rgba(255,255,255,0.28); }
        #siteHeader.scrolled.over-dark .toggle-category::before { background: #fff; }
        #siteHeader.scrolled.over-dark .toggle-category .seg { color: #b8b8b8; }
        #siteHeader.scrolled.over-dark .toggle-category .seg.active { color: #111; }
        #siteHeader.scrolled.over-dark .icon-btn { color: #fff; }
        #siteHeader.scrolled.over-dark .icon-btn svg { stroke: #fff !important; }
        #siteHeader.scrolled.over-dark .icon-btn svg[data-fill] { fill: #fff !important; stroke: none; }
        #siteHeader.scrolled.over-dark .upload-plus { color: #fff !important; }
        /* Search magnifier reads as a line icon (no white fill) on the black header. */
        #siteHeader.scrolled.over-dark .hdr-searchtoggle {
            background: transparent; border-color: #fff; color: #fff;
        }
        /* The search capsule + its glyph/text go white on the black header. */
        #siteHeader.scrolled.over-dark .hdr-search { border-color: #fff; }
        #siteHeader.scrolled.over-dark .hdr-search input { color: #fff; }
        #siteHeader.scrolled.over-dark .hdr-search input::placeholder { color: rgba(255,255,255,0.6); }
        #siteHeader.scrolled.over-dark .hdr-searchgo svg { stroke: #fff; }

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
            /* Three-column couture layout: Menu/Search left, logo centred, icons right.
               All three groups live in the CSS grid on .header-container. */
            body:not([data-sticky="plain"]) #siteHeader .header-container {
                min-height: 68px;
                z-index: 1;
            }
            body:not([data-sticky="plain"]) #siteHeader .logo {
                justify-self: center; height: 68px;
                display: flex; align-items: center; margin: 0; padding-left: 0; color: #111;
            }
            body:not([data-sticky="plain"]) #siteHeader .header-right {
                justify-self: end; justify-content: flex-end; gap: 12px;
            }
            body:not([data-sticky="plain"]) #siteHeader .upload-plus {
                animation: none !important; box-shadow: none !important;
            }
        }
        /* The left-hand contents stay black too — nothing dark sits behind them. */
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .logo,
        #siteHeader.hero-left-box.sticky-look:not(.scrolled) .vero-hamburger { color: #111 !important; }
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
            position: absolute; top: 4px; right: 8px;
            background: #EB2323; color: #fff; font-size: 9.17px; font-weight: 700;
            min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px; display: none;
            align-items: center; justify-content: center; line-height: 1;
            border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.22);
            font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        #siteHeader .badge.show { display: flex; }
        /* Wishlist heart that drops out from beneath the cart icon on tap. */
        #siteHeader .hdr-cart { position: relative; }
        #siteHeader .hdr-cart-btn { background: none; border: none; cursor: pointer; padding: 0; color: inherit; }
        #siteHeader .hdr-wish-pop {
            position: absolute; top: 100%; left: 50%; z-index: 260;
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            margin-top: 6px; padding: 2px;
            opacity: 0; visibility: hidden; pointer-events: none;
            transform: translate(-50%, -10px) scale(0.7);
            transition: opacity 0.24s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1), visibility 0.24s;
        }
        #siteHeader .hdr-wish-pop.open {
            opacity: 1; visibility: visible; pointer-events: auto;
            transform: translate(-50%, 0) scale(1);
        }
        #siteHeader .hwp-ico {
            position: relative; display: inline-flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; color: inherit; text-decoration: none;
            transition: transform 0.18s ease;
        }
        /* Wishlist heart inherits the header icon colour so the cart icon's colour
           never appears to change when the heart drops out. */
        #siteHeader .hwp-ico svg { stroke: currentColor; }
        #siteHeader .hwp-ico:hover { transform: scale(1.12); }
        #siteHeader .hwp-ico:hover svg { fill: currentColor; }
        #siteHeader .hwp-ico svg { display: block; }
        /* Down caret beneath the cart icon (hidden once the wishlist pop opens). */
        #siteHeader .hdr-cart-caret {
            position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
            margin-top: 1px; display: inline-flex; color: inherit; opacity: 0.6;
            pointer-events: none; transition: opacity 0.2s ease;
        }
        #siteHeader .hdr-cart-caret svg { display: block; }
        #siteHeader .hdr-cart-btn[aria-expanded="true"] ~ .hdr-cart-caret { opacity: 0; }
        #siteHeader .hdr-wish-pop .badge { top: -1px; right: -1px; }
        /* Hamburger (replaces the old Social link) */
        #siteHeader .vero-hamburger {
            display: inline-flex; flex-direction: column; align-items: flex-end; justify-content: center;
            gap: 5px; width: 26px; height: 22px; cursor: pointer; padding: 0;
        }
        /* Three thick rounded bars, right-aligned and stepping shorter — a sort /
           align-end style menu glyph. */
        #siteHeader .vero-hamburger span {
            display: block; height: 3.5px; border-radius: 999px;
            background: currentColor; transition: width 0.25s ease, opacity 0.2s ease;
        }
        #siteHeader .vero-hamburger span { width: 100%; }

        /* ===== Menu — rebuilt: a quiet, editorial full-height panel ===== */
        .vero-drawer-overlay {
            position: fixed; inset: 0; background: rgba(20,18,14,0.30);
            -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
            opacity: 0; visibility: hidden; transition: opacity 0.45s ease, visibility 0.45s ease;
            z-index: 200;
        }
        .vero-drawer-overlay.open { opacity: 1; visibility: visible; }
        .vero-drawer {
            position: fixed; top: 0; left: 0; height: 100%; width: 320px; max-width: 72vw;
            background: #faf9f6; color: #1b1916; z-index: 201; transform: translateX(-100%);
            transition: transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s ease;
            /* Shadow only while open — closed, it spilled a gray band onto the page's left edge. */
            box-shadow: none;
            border-radius: 0 22px 22px 22px; overflow: hidden;
            display: flex; flex-direction: column;
            padding: calc(30px + env(safe-area-inset-top,0px)) 34px calc(30px + env(safe-area-inset-bottom,0px));
            box-sizing: border-box; direction: ltr; text-align: left;
        }
        .vero-drawer.open { transform: translateX(0); box-shadow: 30px 0 80px rgba(0,0,0,0.10); }

        /* Header row: back arrow (matches the page headers) */
        .vero-drawer-head {
            display: flex; align-items: center; justify-content: space-between;
            padding-bottom: 24px; border-bottom: 1px solid #e7e2d8; margin-bottom: 14px;
        }
        .vero-drawer-logo { height: 34px; width: auto; display: block; margin-right: 2px; }
        .vero-drawer-close {
            background: none; border: none; cursor: pointer; padding: 0;
            width: 30px; height: 30px; display: inline-flex; align-items: center;
            justify-content: center; margin-left: -4px; color: #1b1916;
            transition: opacity 0.25s ease, transform 0.3s ease;
        }
        .vero-drawer-close svg { width: 24px; height: 24px; }
        .vero-drawer-close:hover { opacity: 0.55; transform: translateX(-3px); }

        /* Primary navigation — large, light (Aharoni CLM, smaller labels, no numbers).
           Grows to fill the drawer height so items spread down the full page. */
        .vero-drawer-nav { display: flex; flex-direction: column; flex: 1 1 auto; justify-content: flex-start; }
        .vero-drawer-nav a {
            position: relative; display: flex; align-items: baseline; gap: 14px;
            font-family: 'Aharoni CLM', 'Aharoni', 'Assistant', sans-serif;
            font-size: 17px; font-weight: 400; letter-spacing: 1.5px; color: #000;
            text-transform: uppercase;
            text-decoration: none; padding: 13px 0; cursor: pointer;
            transition: color 0.25s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .vero-drawer-nav a:hover { transform: translateX(8px); color: #6e5a3a; }

        /* Secondary section — personal area, quieter and smaller */
        .vero-drawer-nav .vero-drawer-heading {
            font-size: 8.5px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase;
            color: #000; padding: 15px 0 5px; margin-top: 8px;
            border-top: 1px solid #e7e2d8;
        }
        .vero-drawer-nav a.secondary {
            font-size: 13.5px; font-weight: 400; letter-spacing: 1.5px; color: #000;
            padding: 13px 0; text-transform: uppercase;
        }
        .vero-drawer-nav a.secondary:hover { color: #000; transform: translateX(6px); }
        .vero-drawer-nav a.secondary.action { align-items: center; gap: 9px; color: #000; }
        /* My Profile (the personal-area link) stands out in red. */
        .vero-drawer-nav a.secondary#veroAreaLink { color: #c8102e; }
        .vero-drawer-nav a.secondary#veroAreaLink:hover { color: #9d0c24; }
        .vero-drawer-nav a.secondary.action svg { flex: none; }

        /* ===== Menu items — staggered entrance =====
           Each nav item (and the social row) starts hidden and slightly to the left,
           then eases into place one after another when the drawer opens. Because the
           animation lives on the .open selector, it replays every time the menu is
           opened. */
        .vero-drawer.open .vero-drawer-nav > *,
        .vero-drawer.open .vero-drawer-social {
            /* 'backwards' shows the hidden 'from' state during the stagger delay, then
               releases the item back to its natural styles once done — so the :hover
               translateX still works after the menu has finished opening. */
            animation: veroDrawerItemIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        /* Like moné, but slow and refined: each item drifts up and de-blurs into
           focus, top to bottom. The blur is light and the opacity holds low early
           (a 3-stop curve) so the fade eases in gently rather than snapping on. */
        @keyframes veroDrawerItemIn {
            0%   { opacity: 0; transform: translateY(22px); filter: blur(1.5px); }
            40%  { opacity: 0.35; }
            100% { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        /* Stagger: a wide, unhurried gap between each item and the next. The delays
           are unconditional so they apply to both the opening and the closing
           (reverse) animations. */
        .vero-drawer .vero-drawer-nav > *:nth-child(1)  { animation-delay: 0.06s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(2)  { animation-delay: 0.12s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(3)  { animation-delay: 0.18s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(4)  { animation-delay: 0.24s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(5)  { animation-delay: 0.30s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(6)  { animation-delay: 0.36s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(7)  { animation-delay: 0.42s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(8)  { animation-delay: 0.48s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(9)  { animation-delay: 0.54s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(10) { animation-delay: 0.60s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(11) { animation-delay: 0.66s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(12) { animation-delay: 0.72s; }
        .vero-drawer .vero-drawer-nav > *:nth-child(n+13) { animation-delay: 0.78s; }
        .vero-drawer .vero-drawer-social { animation-delay: 0.60s; }

        /* The bottom part (Personal Area heading, its links, and the icon row)
           enters with a lighter, quicker motion — no blur and a smaller rise —
           so it reads crisp rather than drifting in slowly. */
        .vero-drawer.open .vero-drawer-nav .vero-drawer-heading,
        .vero-drawer.open .vero-drawer-nav a.secondary,
        .vero-drawer.open .vero-drawer-social {
            animation-name: veroDrawerItemInSoft;
            animation-duration: 0.5s;
        }
        @keyframes veroDrawerItemInSoft {
            from { opacity: 0; transform: translateY(9px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ===== Closing — the exit is the entrance played in reverse =====
           Instead of a separate, hand-authored exit curve, the close reuses the
           *exact* entrance keyframes (veroDrawerItemIn / veroDrawerItemInSoft) with
           'animation-direction: reverse'. Same keyframes, same duration, same
           easing, same per-item stagger delays — so every item retraces its own
           entrance path precisely backwards (drifts back down, re-blurs, fades out)
           rather than following an approximate mirror. 'forwards' fill holds each
           item in its hidden end-state until the panel itself slides away. The
           panel's own slide-out waits (transition-delay) until the items have left,
           so the reverse stagger is actually visible. */
        .vero-drawer.closing .vero-drawer-nav > *,
        .vero-drawer.closing .vero-drawer-social {
            animation: veroDrawerItemIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards;
        }
        .vero-drawer.closing .vero-drawer-nav .vero-drawer-heading,
        .vero-drawer.closing .vero-drawer-nav a.secondary,
        .vero-drawer.closing .vero-drawer-social {
            animation-name: veroDrawerItemInSoft;
            animation-duration: 0.5s;
        }
        .vero-drawer.closing { transition-delay: 0.86s; }

        /* Respect users who prefer less motion: reveal/hide instantly, no slide. */
        @media (prefers-reduced-motion: reduce) {
            .vero-drawer.open .vero-drawer-nav > *,
            .vero-drawer.open .vero-drawer-social,
            .vero-drawer.closing .vero-drawer-nav > *,
            .vero-drawer.closing .vero-drawer-social { animation: none; }
            .vero-drawer.closing { transition-delay: 0s; }
        }

        /* Footer — socials */
        .vero-drawer-social {
            margin-top: auto; padding-top: 26px;
            display: flex; align-items: center; gap: 22px;
        }
        .vero-drawer-social a { position: relative; color: #6f675c; display: inline-flex; transition: color 0.25s ease; }
        .vero-drawer-social a:hover { color: #1b1916; }
        .vero-drawer-social svg { width: 22px; height: 22px; }
        .vero-drawer-social .badge {
            position: absolute; top: -6px; right: -8px;
            background: #EB2323; color: #fff; font-size: 9.17px; font-weight: 700;
            min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; display: none;
            align-items: center; justify-content: center; line-height: 1;
            border: 2px solid #f7f4ee;
            font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        .vero-drawer-social .badge.show { display: flex; }
        /* Add-product: a plus inside a ring, sitting to the right of the wishlist. */
        .vero-drawer-social .vero-drawer-add {
            width: 38px; height: 38px; border-radius: 50%;
            align-items: center; justify-content: center;
            border: 1.5px solid #c9c1b2; color: #1b1916;
            transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease;
        }
        .vero-drawer-social .vero-drawer-add:hover {
            background: #1b1916; border-color: #1b1916; color: #faf9f6;
        }
        .vero-drawer-social .vero-drawer-add svg { width: 18px; height: 18px; }

        @media (max-width: 768px) {
            #siteHeader .logo { font-size: 16.67px; letter-spacing: 3px; justify-self: center; }
            #siteHeader .logo .logo-img { height: 32px; }
        }

        /* ===== The switch and the + =====
           Black like every other control in the header, in every state. They used
           to carry the site's mode colour (green in fashion, burgundy in art);
           that is retired. Last in the file and marked !important so it beats the
           .scrolled / .force-dark / .force-light blocks above. */
        #siteHeader .hdr-mode-pair .toggle-category,
        #siteHeader.scrolled .hdr-mode-pair .toggle-category,
        #siteHeader.force-dark .hdr-mode-pair .toggle-category,
        #siteHeader.force-light .hdr-mode-pair .toggle-category {
            border-color: #111 !important;
        }
        #siteHeader .hdr-mode-pair .toggle-category::before,
        #siteHeader.scrolled .hdr-mode-pair .toggle-category::before,
        #siteHeader.force-dark .hdr-mode-pair .toggle-category::before,
        #siteHeader.force-light .hdr-mode-pair .toggle-category::before {
            background: #111 !important;
        }
        /* Over the transparent hero (pre-scroll), the switch reads white like the rest
           of the icons on the dark image. */
        #siteHeader.sticky-look:not(.scrolled):not(.hero-left-box) .header-right .hdr-mode-pair .toggle-category {
            border-color: #fff !important;
        }
        #siteHeader.sticky-look:not(.scrolled):not(.hero-left-box) .header-right .hdr-mode-pair .toggle-category::before {
            background: #fff !important;
        }
        #siteHeader .hdr-mode-pair .upload-plus,
        #siteHeader.scrolled .hdr-mode-pair .upload-plus,
        #siteHeader.force-dark .hdr-mode-pair .upload-plus,
        #siteHeader.force-light .hdr-mode-pair .upload-plus {
            color: #111 !important;
            border-color: #111 !important;
        }
        /* Over the transparent hero the + turns white like the rest of the icons. */
        #siteHeader.sticky-look:not(.scrolled):not(.hero-left-box) .header-right .hdr-mode-pair .upload-plus {
            color: #fff !important;
            border-color: #fff !important;
        }
        #siteHeader .hdr-mode-pair .upload-plus { animation: none !important; }

        /* On the black sticky header the switch and the + turn white, like the rest
           of the icons. Higher specificity + !important so they beat the black
           mode-pair rules above. */
        #siteHeader.scrolled.over-dark .hdr-mode-pair .toggle-category { border-color: #fff !important; }
        #siteHeader.scrolled.over-dark .hdr-mode-pair .toggle-category::before { background: #fff !important; }
        #siteHeader.scrolled.over-dark .hdr-mode-pair .upload-plus { color: #fff !important; border-color: #fff !important; }

        /* ===== Business (seller) account — stripped header =====
           Keep the logo, the + (upload), the profile picture, the switch icon and
           the cart. The magnifier (→ site search) stays available; only the inline
           search field variant is hidden. */
        #siteHeader.acct-seller .hdr-searchwrap {
            display: none !important;
        }
        /* Seller account cluster moved to the left keeps a comfortable gap. */
        #siteHeader.acct-seller .header-left { gap: 12px; }
        #siteHeader.acct-seller .hdr-account { display: inline-flex; align-items: center; }
        /* The seller account name, shown beside the profile picture. */
        #siteHeader .hdr-acct-name {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 12.50px; font-weight: 600; letter-spacing: 0.3px;
            color: #fff; white-space: nowrap; max-width: 180px;
            overflow: hidden; text-overflow: ellipsis; display: none;
        }
        #siteHeader.acct-seller .hdr-acct-name { display: inline-block; }
        /* Sticky / solid-white header → the name reads black; on the black
           over-dark sticky header it stays white. */
        #siteHeader.acct-seller.scrolled .hdr-acct-name,
        #siteHeader.acct-seller.force-light .hdr-acct-name { color: #111; }
        #siteHeader.acct-seller.scrolled.over-dark .hdr-acct-name { color: #fff; }

        /* Seller-only search icon, sitting just to the right of the category toggle.
           Hidden in the personal account (which keeps its own left-side Search). */
        #siteHeader .hdr-seller-search { display: none; }
        #siteHeader.acct-seller .hdr-seller-search { display: flex; }

        /* ===== Icons pinned to the right, logo centred ===== */
        #siteHeader .header-right { justify-self: end; justify-content: flex-end; gap: 12px; }
        @media (max-width: 768px) {
            #siteHeader .header-container { grid-template-columns: auto 1fr auto; padding: 0 16px; gap: 12px; }
            #siteHeader .header-left { gap: 16px; }
            #siteHeader .hdr-textbtn-label { display: none; }
            #siteHeader .header-right { gap: 14px; }
        }

        /* ================= SEARCH (opens on the header Search button) =================
           One field, answers as you type. A full-screen white sheet: the field and a
           Close button on top, Products / Users tabs under it, then either the
           starting point (recent searches, trending words, categories to browse) or
           the live results. Everything is square and drawn with hairlines. */
        .vsp-overlay {
            position: fixed; inset: 0; z-index: 300;
            background: #fff; color: #111;
            opacity: 0; visibility: hidden; transform: translateY(-10px);
            transition: opacity 0.26s ease, transform 0.26s ease, visibility 0s linear 0.26s;
            overflow-y: auto; overscroll-behavior: contain;
            -webkit-tap-highlight-color: transparent;
        }
        .vsp-overlay.open {
            opacity: 1; visibility: visible; transform: none;
            transition: opacity 0.26s ease, transform 0.26s ease;
        }
        .vs-wrap { max-width: 760px; margin: 0 auto; padding: 0 20px 96px; }
        .vs-top {
            position: sticky; top: 0; z-index: 2; background: #fff;
            padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
        }
        .vs-barrow { display: flex; align-items: stretch; gap: 10px; }
        .vs-bar {
            flex: 1; min-width: 0; height: 54px; box-sizing: border-box;
            display: flex; align-items: center; gap: 12px; padding: 0;
            border: 0; border-bottom: 1px solid #111; background: none;
        }
        .vs-bar svg { width: 19px; height: 19px; flex: none; stroke: #111; stroke-width: 1.6; fill: none; }
        .vs-bar input {
            flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: none; padding: 0; margin: 0;
            font-size: 16px; font-weight: 400; color: #111; letter-spacing: 0.1px;
            -webkit-appearance: none; appearance: none;
        }
        .vs-bar input::placeholder { color: #a09c94; }
        .vs-clear, .vs-close, .vs-tab, .vs-link, .vs-chip, .vs-x {
            background: none; border: 0; padding: 0; margin: 0; color: #111; cursor: pointer;
        }
        .vs-clear {
            flex: none; font-size: 10px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase;
            color: #8a877f; padding: 8px 0 8px 8px; display: none;
        }
        .vsp-overlay.has-q .vs-clear { display: block; }
        .vs-clear:hover { color: #111; }
        .vs-close {
            flex: none; padding: 0 4px 0 8px;
            font-size: 11px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase;
        }
        .vs-close:hover { opacity: 0.55; }
        .vs-tabs { display: flex; gap: 26px; margin-top: 16px; border-bottom: 1px solid #e6e3dd; }
        .vs-tab {
            position: relative; padding: 12px 0 13px;
            font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #9a968d;
            transition: color 0.2s ease;
        }
        .vs-tab::after {
            content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: #111;
            transform: scaleX(0); transform-origin: left; transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .vs-tab.on { color: #111; }
        .vs-tab.on::after { transform: scaleX(1); }
        .vs-tab i { font-style: normal; font-weight: 400; margin-left: 6px; color: #9a968d; font-variant-numeric: tabular-nums; }

        .vs-body { padding-top: 6px; }
        .vs-body > * { animation: vsIn 0.3s ease both; }
        @keyframes vsIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .vs-head {
            display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
            margin: 26px 0 6px;
            font-size: 10px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase; color: #111;
        }
        .vs-head span { font-weight: 400; color: #8a877f; letter-spacing: 1.2px; }
        .vs-link { font-size: 10px; font-weight: 500; letter-spacing: 1.4px; text-transform: uppercase; color: #8a877f; }
        .vs-link:hover { color: #111; }

        /* One shared row: recent searches, categories, products and users. */
        .vs-row {
            display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box;
            padding: 12px 8px; margin: 0 -8px; width: calc(100% + 16px);
            border: 0; border-bottom: 1px solid #eeebe6; background: none;
            text-align: left; text-decoration: none; color: #111; cursor: pointer;
            font-size: 14px; transition: background 0.15s ease;
        }
        .vs-row:hover, .vs-row.hi { background: #f6f5f1; }
        .vs-row-ico { flex: none; width: 18px; height: 18px; stroke: #8a877f; stroke-width: 1.5; fill: none; }
        .vs-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .vs-row-main b { font-weight: 400; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vs-row mark { background: none; color: inherit; }
        .vs-row-main b mark { font-weight: 700; }
        .vs-row-main small mark { color: #111; }
        .vs-row-main small {
            font-size: 9.5px; letter-spacing: 1.6px; text-transform: uppercase; color: #8a877f;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .vs-row-end { flex: none; font-size: 13.5px; font-variant-numeric: tabular-nums; text-align: right; }
        .vs-row-end s { display: block; font-size: 11px; color: #a09c94; }
        .vs-row-end em { font-style: normal; color: #b3261e; }
        .vs-count { color: #8a877f; font-size: 12px; }
        .vs-chev { flex: none; color: #c3bfb7; font-size: 18px; line-height: 1; }
        .vs-x { flex: none; width: 30px; height: 30px; margin: -6px -6px -6px 0; color: #a09c94; font-size: 17px; line-height: 1; }
        .vs-x:hover { color: #111; }
        .vs-thumb {
            flex: none; width: 52px; height: 64px; background: #f4f3ef; overflow: hidden;
            display: grid; place-items: center; font-size: 25px;
        }
        .vs-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vs-ava {
            flex: none; width: 44px; height: 44px; display: grid; place-items: center;
            font-size: 16px; font-weight: 500; text-transform: uppercase; color: #fff;
        }

        .vs-chips { display: flex; flex-wrap: wrap; gap: 6px 22px; padding-top: 8px; }
        .vs-chip {
            padding: 6px 0; font-size: 14px; letter-spacing: 0.2px; color: #111;
            transition: color 0.18s ease;
        }
        .vs-chip:hover { color: #8a877f; }
        /* The filter line above the results: the Filter button, then what is
           applied, each with its own remove mark. Scrolls sideways on one line. */
        .vs-narrow { flex-wrap: nowrap; overflow-x: auto; margin: 0 -20px; padding: 16px 20px 0; scrollbar-width: none; }
        .vs-narrow::-webkit-scrollbar { display: none; }
        .vs-narrow .vs-chip { flex: none; font-size: 13px; }
        .vs-narrow .vs-chip.on { text-decoration: underline; text-underline-offset: 5px; }
        .vs-narrow .vs-chip.vs-applied { color: #8a877f; }
        .vs-narrow .vs-chip.vs-applied::after { content: '×'; margin-left: 6px; }
        .vs-narrow .vs-chip.vs-applied:hover { color: #111; }
        .vs-filterbtn {
            display: block; margin-top: 30px; padding: 6px 0; background: none; border: 0; color: #111; cursor: pointer;
            font-size: 14px; text-decoration: underline; text-underline-offset: 5px;
        }
        .vs-filterbtn:hover { color: #8a877f; }

        /* ===== Filter, one question per page =====
           Words only. While filtering, the field and tabs step aside for Back and
           Close. Each step is its own page: the old one fades out,
           the next fades in. */
        .vs-flowbar { display: none; align-items: center; gap: 16px; height: 54px; }
        .vsp-overlay.filtering .vs-flowbar { display: flex; }
        .vsp-overlay.filtering .vs-barrow, .vsp-overlay.filtering .vs-tabs { display: none; }
        .vs-back {
            flex: none; background: none; border: 0; padding: 10px 8px 10px 0; margin: 0; color: #111; cursor: pointer;
            font-size: 11px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase;
        }
        .vs-flowbar { justify-content: space-between; }
        .vs-body { transition: opacity 0.22s ease; }
        .vs-body.vs-out { opacity: 0; }
        .vs-step { padding-top: 34px; }
        .vs-body > .vs-step, .vs-body > .vs-foot { animation-duration: 0.42s; }
        .vs-step-n { font-size: 10px; font-weight: 600; letter-spacing: 2.4px; text-transform: uppercase; color: #8a877f; }
        .vs-step-t { margin: 12px 0 0; font-size: 28px; line-height: 1.2; font-weight: 300; letter-spacing: 0.2px; color: #111; outline: none; }
        .vs-step-s { margin: 8px 0 0; font-size: 13px; color: #8a877f; }
        .vs-opts { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-start; }
        .vs-opt {
            display: block; min-height: 50px; padding: 10px 0; background: none; border: 0; cursor: pointer;
            text-align: left; font-size: 19px; font-weight: 300; color: #8a877f;
            transition: color 0.18s ease;
        }
        .vs-opt:hover { color: #111; }
        .vs-opt.on { color: #111; font-weight: 500; text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
        .vs-opt[disabled] { color: #d3cfc7; cursor: default; }
        .vs-foot {
            position: sticky; bottom: 0; background: #fff; margin-top: 30px;
            padding: 14px 0 calc(env(safe-area-inset-bottom, 0px) + 16px);
            display: flex; align-items: baseline; justify-content: flex-start; gap: 20px;
        }
        .vs-next {
            background: none; border: 0; padding: 8px 0; margin: 0; color: #111; cursor: pointer;
            font-size: 16px; font-weight: 500; text-decoration: underline; text-underline-offset: 6px;
        }
        .vs-foot .vs-link { padding: 8px 0; }
        .vsp-overlay button:focus-visible, .vsp-overlay a:focus-visible, .vsp-overlay [tabindex="0"]:focus-visible {
            outline: 2px solid #111; outline-offset: 2px;
        }

        /* Matching pieces as the site's product cards, two to a row. */
        .vs-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 14px; padding-top: 14px; }
        .vs-cards .product-card { width: 100%; margin: 0; }
        @media (min-width: 700px) { .vs-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .vs-empty { padding: 54px 0 10px; text-align: center; }
        .vs-empty-t { font-size: 20px; font-weight: 300; letter-spacing: 0.3px; }
        .vs-empty-m { font-size: 13px; color: #8a877f; line-height: 1.6; margin-top: 8px; }
        .vs-empty .vs-chips { justify-content: center; margin-top: 14px; }
        .vs-empty .vs-chip { text-decoration: underline; text-underline-offset: 5px; }
        .vs-more {
            display: block; width: 100%; margin-top: 18px; padding: 15px; box-sizing: border-box;
            background: #111; color: #fff; border: 1.5px solid #111; cursor: pointer;
            font-size: 10.5px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
            transition: background 0.2s ease, color 0.2s ease;
        }
        .vs-more:hover { background: #fff; color: #111; }
        @media (max-width: 600px) {
            .vs-wrap { padding: 0 16px 80px; }
            .vs-top { padding-top: calc(env(safe-area-inset-top, 0px) + 14px); }
            .vs-narrow { margin: 0 -16px; padding-left: 16px; padding-right: 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
            .vsp-overlay, .vs-body, .vs-body > *, .vs-tab::after { transition: none; animation: none; }
        }

        /* ===== Shared five-star rating (outline stars, proportional fill) ===== */
        /* direction:ltr keeps the base/fill overlay aligned even on RTL pages. */
        .vero-stars { position: relative; display: inline-flex; align-items: center; line-height: 1; font-size: 12.50px; direction: ltr; }
        .vero-stars-base, .vero-stars-fill { letter-spacing: 2px; }
        .vero-stars-base { color: #d9d9d4; }
        .vero-stars-fill {
            color: #111; position: absolute; top: 0; left: 0;
            width: 0; overflow: hidden; white-space: nowrap; pointer-events: none;
        }
        .vero-stars-num { margin-left: 9px; font-size: 10.00px; color: #6b6b66; letter-spacing: 0.3px; }

        /* ===== FINAL OVERRIDE: every header icon is black in ALL states =====
           The header is now white with black content throughout (the slider and
           filter bands are light, so it never flips to a dark look). Placed last
           (and with !important) so it wins over the earlier state-based colours. */
        #siteHeader .icon-btn,
        #siteHeader.scrolled .icon-btn,
        #siteHeader.force-dark .icon-btn,
        #siteHeader.force-light .icon-btn,
        #siteHeader .header-left > a,
        #siteHeader.scrolled .header-left > a { color: #111 !important; }
        #siteHeader .icon-btn svg,
        #siteHeader.scrolled .icon-btn svg,
        #siteHeader.force-dark .icon-btn svg,
        #siteHeader.force-light .icon-btn svg { stroke: #111 !important; }
        #siteHeader .icon-btn svg[data-fill],
        #siteHeader.scrolled .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }
        /* Art/Fashion switch: white track + knob over a dark header, dark on a
           light (scrolled / force-light) header so it stays visible. */
        #siteHeader .hdr-mode-pair .toggle-category,
        #siteHeader.force-dark .hdr-mode-pair .toggle-category,
        #siteHeader.scrolled.over-dark .hdr-mode-pair .toggle-category { border-color: #fff !important; }
        #siteHeader .hdr-mode-pair .toggle-category::before,
        #siteHeader.force-dark .hdr-mode-pair .toggle-category::before,
        #siteHeader.scrolled.over-dark .hdr-mode-pair .toggle-category::before { background: #fff !important; }
        #siteHeader.scrolled .hdr-mode-pair .toggle-category,
        #siteHeader.force-light .hdr-mode-pair .toggle-category { border-color: rgba(0,0,0,0.55) !important; }
        #siteHeader.scrolled .hdr-mode-pair .toggle-category::before,
        #siteHeader.force-light .hdr-mode-pair .toggle-category::before { background: #111 !important; }
        /* (The mode-coloured red/black knob was reverted — the knob now uses the
           normal state colours: white over the hero, dark when the header is solid.) */

        /* ===== Nav redesign (option B): fineline toggle + wordmark on the left,
           icons on the right, an italic category row beneath. Appended last so it
           wins; :not(#z) boosts beat the mode/state rules above. ===== */
        #siteHeader .header-container.hdr-b:not(#z) {
            display: flex !important; grid-template-columns: none !important;
            align-items: center; gap: 14px; flex-wrap: nowrap !important;
        }
        #siteHeader .hdr-b .header-left:not(#z) {
            grid-column: auto !important; justify-self: auto !important; gap: 12px !important;
            flex: 0 1 auto !important; order: 0 !important; width: auto !important;
            justify-content: flex-start !important; min-width: 0 !important;
        }
        #siteHeader .hdr-b .logo-peacock-wrap:not(#z) {
            grid-column: auto !important; justify-self: auto !important;
            position: static !important; left: auto !important; text-decoration: none !important;
        }
        #siteHeader .hdr-b .header-right:not(#z) {
            grid-column: auto !important; justify-self: auto !important;
            margin-left: auto !important; flex: 0 0 auto !important; gap: 6px !important;
            order: 0 !important; width: auto !important; justify-content: flex-end !important;
        }
        /* Keep the wordmark compact so toggle + logo + icons stay on one line on phones. */
        #siteHeader .hdr-b .logo .logo-script:not(#z):not(#z):not(#z) { font-size: 26px !important; }
        /* Logo: Pinyon, no underline. */
        #siteHeader .hdr-b .logo .logo-script:not(#z):not(#z):not(#z) { text-decoration: none !important; }
        /* Toggle knob kept in its normal (filled) state. */
        /* Italic category row, in the logo's quiet serif spirit. */
        #siteHeader .hdr-cats {
            display: flex; justify-content: center; gap: 22px;
            padding: 2px 16px 12px; direction: ltr;
        }
        #siteHeader .hdr-cats a {
            font-family: 'Cormorant Garamond', 'Bodoni Moda', serif; font-style: italic; font-weight: 500;
            font-size: 16px; letter-spacing: .3px; color: #6f6a62; text-decoration: none;
            cursor: pointer; white-space: nowrap; transition: color .2s;
        }
        #siteHeader .hdr-cats a:hover { color: #111; }
        #siteHeader .hdr-cats a.on { color: #004225; border-bottom: 1px solid #004225; padding-bottom: 2px; }
        /* Over the dark hero the category row goes white like the rest of the header. */
        #siteHeader.sticky-look:not(.scrolled) .hdr-cats a,
        #siteHeader.scrolled.over-dark .hdr-cats a { color: rgba(255,255,255,0.82); }
        #siteHeader.sticky-look:not(.scrolled) .hdr-cats a.on,
        #siteHeader.scrolled.over-dark .hdr-cats a.on { color: #fff; border-bottom-color: #fff; }

        /* ===== Header Clothing/Art switch — unified Uiverse toggle look
           (grey off, blue #4296f4 on, white knob) in every header state.
           Placed last + !important so it wins over the mode-driven colours
           above. "On" (blue, knob right) = Fashion/Clothing segment active. ===== */
        #siteHeader .toggle-category:not(#z) {
            width: 38px !important; height: 22px !important;
            background: #cccccc !important; border: none !important;
            border-radius: 999px !important; transition: background .3s ease !important;
        }
        #siteHeader .toggle-category:not(#z)::before {
            top: 3px !important; left: 3px !important;
            width: 16px !important; height: 16px !important;
            background: #fff !important;
            box-shadow: 6px 0 24px rgba(0,0,0,0.12) !important;
            transition: transform .3s ease-in-out !important;
        }
        #siteHeader .toggle-category:not(#z):has(#segFashion.active) { background: #4296f4 !important; }
        #siteHeader .toggle-category:not(#z):has(#segFashion.active)::before {
            transform: translateX(16px) !important;
            box-shadow: -6px 0 24px rgba(0,0,0,0.12) !important;
        }
        #siteHeader .toggle-category:not(#z):hover { border: none !important; }
        /* No blue tap-highlight / focus box when the switch is pressed. */
        #siteHeader .toggle-category:not(#z) {
            -webkit-tap-highlight-color: transparent !important;
            outline: none !important; -webkit-user-select: none; user-select: none;
            -webkit-touch-callout: none;
        }
        #siteHeader .toggle-category:not(#z):focus,
        #siteHeader .toggle-category:not(#z):focus-visible { outline: none !important; }
        #siteHeader .toggle-category:not(#z) .seg { -webkit-tap-highlight-color: transparent !important; }
`;

    // ---- Markup (identical everywhere) ----
    const MARKUP = `
        <div class="header-container hdr-b">
            <div class="header-left">
                <a class="icon-btn" onclick="veroToggleDrawer()" aria-label="Menu" role="button" tabindex="0" data-icon="menu" title="Menu">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round">
                        <line x1="3" y1="7" x2="21" y2="7"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="17" x2="21" y2="17"></line>
                    </svg>
                </a>
                <a class="logo logo-peacock-wrap" href="index.html" aria-label="moravchick — home">
                    <span class="logo-script" aria-hidden="true">moravchick</span>
                </a>
            </div>
            <div class="header-right">
                <span class="hdr-mode-pair" data-icon="mode">
                    <div class="toggle-category" id="categoryToggleBtn" onclick="toggleSwitch()">
                        <span class="seg active" id="segArt">Art</span>
                        <span class="seg" id="segFashion">Fashion</span>
                    </div>
                </span>
                <a class="icon-btn" onclick="veroOpenSearchPage()" aria-label="Search" role="button" tabindex="0" data-icon="search" title="Search">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </a>
                <span class="hdr-account" data-icon="account">
                    <button class="icon-btn hdr-account-btn" title="My Account (hold to switch profile)" aria-label="My Account">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="4"></circle>
                            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path>
                        </svg>
                    </button>
                </span>
            </div>
        </div>
    `;

    // ---- Slide-in side drawer (opened by the header hamburger) ----
    const DRAWER_ICONS = {
        cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle><path d="M2 3h3l2.4 12a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L22 7H6"></path></svg>',
        wishlist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
    };
    const DRAWER_MARKUP = `
        <div class="vero-drawer-overlay" id="veroDrawerOverlay" onclick="veroCloseDrawer()"></div>
        <aside class="vero-drawer" id="veroDrawer" aria-hidden="true">
            <div class="vero-drawer-head">
                <button class="vero-drawer-close" aria-label="Back" onclick="veroCloseDrawer()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"></polyline></svg>
                </button>
                <img class="vero-drawer-logo" src="peacock-logo.png?v=1" alt="moravchick" />
            </div>
            <nav class="vero-drawer-nav">
                <a class="primary" onclick="veroCloseDrawer(); showMain()">Home</a>
                <a class="primary" onclick="veroCloseDrawer(); veroGoSegment('men')">Men</a>
                <a class="primary" onclick="veroCloseDrawer(); veroGoSegment('women')">Women</a>
                <a class="primary" onclick="veroCloseDrawer(); veroGoSegment('kids')">Kids</a>
                <a class="primary" href="about.html">About</a>
                <a class="primary" href="plans.html">DME Plans</a>
                <span class="vero-drawer-heading">Events</span>
                <a class="secondary" href="events.html" onclick="veroCloseDrawer()">Calendar &amp; happenings</a>
                <span class="vero-drawer-heading" id="veroAreaHeading">Personal Area</span>
                <a class="secondary" id="veroAreaLink" onclick="veroCloseDrawer(); veroGoAccount('buyer','profile.html')">My Profile</a>
                <a class="secondary" id="veroChatsLink" onclick="veroCloseDrawer(); location.href = (localStorage.getItem('vero_active_account')==='seller' ? 'chats.html?from=seller' : 'chats.html')">Chats</a>
                <a class="secondary" id="veroLogoutLink" onclick="veroCloseDrawer(); veroLogout()">Log out</a>
            </nav>
            <div class="vero-drawer-social">
                <a class="vero-drawer-add" id="veroAddProductLink" aria-label="Add Product" onclick="veroCloseDrawer(); openUploadProduct()">${DRAWER_ICONS.plus}</a>
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
    // The drawer's account link mirrors the account you're acting as: in the
    // seller account it offers your personal "My Profile" (buyer area); in the
    // buyer account it offers "Enter Seller Area". Refreshed each time it opens.
    function veroRefreshAreaLink() {
        const link = document.getElementById('veroAreaLink');
        const heading = document.getElementById('veroAreaHeading');
        if (!link) return;
        const seller = (typeof veroActiveAccount === 'function' ? veroActiveAccount() : 'buyer') === 'seller';
        if (seller) {
            // Seller account → the seller hub (My Shop, My Products, Buyer Chats…).
            link.textContent = 'Seller Area';
            if (heading) heading.textContent = 'Seller Area';
            link.setAttribute('onclick', "veroCloseDrawer(); veroGoAccount('seller','seller-area.html')");
        } else {
            // Personal account → the personal hub (My Profile, My Chats, My Cart…).
            link.textContent = 'My Profile';
            if (heading) heading.textContent = 'Personal Area';
            link.setAttribute('onclick', "veroCloseDrawer(); veroGoAccount('buyer','profile.html')");
        }
    }

    window.veroToggleDrawer = function () {
        mountDrawer();
        const d = document.getElementById('veroDrawer');
        // Open → close with the reverse-stagger exit animation.
        if (d && d.classList.contains('open')) { window.veroCloseDrawer(); return; }
        veroRefreshAreaLink();
        const o = document.getElementById('veroDrawerOverlay');
        // Cancel any in-flight close so a quick re-open starts clean.
        clearTimeout(d._closeTimer);
        d.classList.remove('closing');
        d.classList.add('open');
        o.classList.add('open');
        d.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    window.veroCloseDrawer = function () {
        const d = document.getElementById('veroDrawer');
        const o = document.getElementById('veroDrawerOverlay');
        document.body.style.overflow = '';
        if (!d) { if (o) o.classList.remove('open'); return; }
        if (!d.classList.contains('open')) return;   // already closed / closing
        // Play the reverse-stagger exit: keep the items on screen (via .closing) and
        // let them animate out before the panel and backdrop leave.
        d.classList.add('closing');
        d.classList.remove('open');
        d.setAttribute('aria-hidden', 'true');
        clearTimeout(d._closeTimer);
        d._closeTimer = setTimeout(function () {
            d.classList.remove('closing');
            if (o) o.classList.remove('open');       // fade the backdrop out at the end
        }, 1450);
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.veroCloseDrawer(); });

    // ================= SEARCH (one field, live results) =================
    // The header owns the whole search: the sheet, the field, the two tabs and the
    // results. Products come from the site catalogue (collections.js — real
    // listings plus the demo spread), loaded on first open when the page doesn't
    // already carry it. Users are the sellers found in that catalogue plus a few
    // standing storefronts.
    const VSP_POPULAR = {
        clothing: ['Coat', 'Knitwear', 'Linen', 'Boots', 'Shirt', 'Leather', 'Scarf', 'Sandals'],
        art: ['Lamp', 'Vase', 'Canvas', 'Sculpture', 'Mirror', 'Rug', 'Chair', 'Ceramics']
    };
    const VSP_USERS = [
        'Studio Vero', 'Studio Noir', 'Atelier Nord', 'Denim Lab', 'Milano Feet', 'Sole Society',
        'Basics Co.', 'Urban Thread', 'Horology Co.', 'Gallery Nine', 'Art House',
        'Designer Collection', 'Vintage Vault', 'Luxe Atelier', 'Forge Studio', 'Pixel Works'
    ];
    const VS_RECENT_KEY = 'vero_recent_searches';
    const VS_PAGE = 24;                       // results shown before "Show more"
    const VS_SORTS = [['rel', 'Best match'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['new', 'Newest']];
    const VS_ICON = {
        search: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        clock: '<svg class="vs-row-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline></svg>'
    };
    // The filter is a process: one question per page, in this order. A question
    // with nothing to choose from is passed over, and "who is it for" is never
    // asked when the profile already says.
    const VS_STEPS = [
        { key: 'product',  title: 'What are you looking for?', any: 'Anything' },
        { key: 'gender',   title: 'Who is it for?',            any: 'Everyone' },
        { key: 'style',    title: 'Which style?',              any: 'Any style' },
        { key: 'material', title: 'Which material?',           any: 'Any material' },
        { key: 'color',    title: 'Which colour?',             any: 'Any colour' },
        { key: 'price',    title: 'What is your budget?',      any: 'Any price' }
    ];
    const VS_GENDERS = ['Women', 'Men', 'Unisex', 'Kids'];
    const VS_BANDS = [['u200', 'Under ₪200', 0, 200], ['200', '₪200 – ₪500', 200, 500],
                      ['500', '₪500 – ₪1,500', 500, 1500], ['1500', 'Over ₪1,500', 1500, Infinity]];
    function vsNoFilter() { return { product: '', gender: '', style: '', material: '', color: '', price: '' }; }
    function vsFresh() { return { q: '', tab: 'product', f: vsNoFilter(), step: '', gOff: false, sort: 'rel', hi: -1, limit: VS_PAGE }; }
    let vs = vsFresh();
    function vsFilterOn(f) { return VS_STEPS.some(st => !!f[st.key]); }
    // The gender set in the personal area: '' when none was chosen there.
    function vsProfileGender() {
        try { return (JSON.parse(localStorage.getItem('vero_profile')) || {}).gender || ''; } catch (e) { return ''; }
    }
    // A profile gender stands in for the skipped question (Other narrows nothing),
    // until the shopper removes it from the results.
    function vsUseProfileGender() {
        if (vs.gOff || vs.f.gender) return;
        const g = { male: 'Men', female: 'Women' }[vsProfileGender()];
        if (g) vs.f.gender = g;
    }
    // What a piece says about itself for one question.
    function vsAttr(p, key) {
        const r = p._raw || {};
        if (key === 'product') { const c = r.itemType || p.category || ''; return /^(clothing|art)$/i.test(c) ? '' : c; }
        if (key === 'gender') return r.gender || '';
        if (key === 'style') return Array.isArray(r.style) ? r.style : (r.style ? [r.style] : []);
        if (key === 'material') return r.fabric || r.material || '';
        if (key === 'color') return r.color || '';
        return '';
    }
    // Does a piece pass the filter? `skip` leaves one question out, to list its options.
    function vsPass(p, f, skip) {
        for (const k of ['product', 'material', 'color']) {
            if (skip !== k && f[k] && vsAttr(p, k) !== f[k]) return false;
        }
        if (skip !== 'gender' && f.gender) {
            const g = vsAttr(p, 'gender');             // unisex and ungendered pieces suit everyone
            if (g && g !== f.gender && g !== 'Unisex') return false;
        }
        if (skip !== 'style' && f.style && !vsAttr(p, 'style').includes(f.style)) return false;
        if (skip !== 'price' && f.price) {
            const band = VS_BANDS.find(b => b[0] === f.price), n = vsPrice(p).price;
            if (band && !(n >= band[2] && n < band[3])) return false;
        }
        return true;
    }
    function vsLabel(key, val) { return key === 'price' ? (VS_BANDS.find(b => b[0] === val) || [])[1] || val : val; }
    // The choices one question offers right now, given the answers so far —
    // only ones that still lead to at least one piece.
    function vsOptions(key, hits) {
        const f = vs.f;
        const pool = hits.map(h => h.p).filter(p => vsPass(p, f, key));
        let vals;
        if (key === 'price') vals = VS_BANDS.map(b => b[0]);
        else if (key === 'gender') vals = VS_GENDERS;
        else {
            const seen = new Set();
            pool.forEach(p => [].concat(vsAttr(p, key)).forEach(v => { if (v) seen.add(v); }));
            vals = [...seen];
        }
        let opts = vals.map(v => ({ val: v, label: vsLabel(key, v), n: pool.filter(p => vsPass(p, Object.assign({}, f, { [key]: v }))).length }))
            .filter(o => o.n > 0);
        if (key === 'gender') opts = opts.filter(o => pool.some(p => vsAttr(p, 'gender') === o.val));
        if (key !== 'price' && key !== 'gender') opts.sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
        return opts;
    }
    // The questions that will actually be asked, in order.
    function vsAsked() { return VS_STEPS.filter(st => !(st.key === 'gender' && vsProfileGender())); }
    // The next (dir 1) or previous (dir -1) question that has something to choose; '' when none.
    function vsNeighbour(key, dir, hits) {
        const asked = vsAsked();
        let i = key ? asked.findIndex(st => st.key === key) + dir : (dir > 0 ? 0 : -1);
        for (; i >= 0 && i < asked.length; i += dir) {
            if (vsOptions(asked[i].key, hits).length) return asked[i].key;
        }
        return '';
    }
    function vsPieces(n) { return n + (n === 1 ? ' piece' : ' pieces'); }

    // Deterministic 4.0–5.0 rating per seller, stable across searches.
    function vspSellerRating(s) {
        let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return (4 + (h % 10) / 10).toFixed(1);
    }
    // Deterministic two-tone avatar for a seller with no photo on file.
    function vspAvatarStyle(name) {
        let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        const hue = h % 360, hue2 = (hue + 42) % 360;
        return `background:linear-gradient(135deg,hsl(${hue} 58% 56%),hsl(${hue2} 62% 40%));`;
    }

    // Five-star rating drawn as outline stars filled proportionally to the score.
    // Exposed on window so any page that loads header.js can reuse the same visual.
    window.veroStarsHTML = function (rating) {
        const r = Math.max(0, Math.min(5, Number(rating) || 0));
        const pct = (r / 5) * 100;
        return `<span class="vero-stars" role="img" aria-label="${r.toFixed(1)} out of 5">`
            + `<span class="vero-stars-base">★★★★★</span>`
            + `<span class="vero-stars-fill" style="width:${pct}%">★★★★★</span>`
            + `<span class="vero-stars-num">${r.toFixed(1)}</span>`
            + `</span>`;
    };

    function vspEscape(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function vsTokens(q) { return String(q || '').toLowerCase().split(/\s+/).filter(Boolean); }
    // Escape the text and make the typed words bold inside it.
    function vsMark(text, tokens) {
        text = String(text == null ? '' : text);
        if (!tokens.length) return vspEscape(text);
        const re = new RegExp('(' + tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig');
        return text.split(re).map((part, i) => i % 2 ? '<mark>' + vspEscape(part) + '</mark>' : vspEscape(part)).join('');
    }

    // ---- Data ----
    function vsProducts() {
        const vc = window.veroCollections;
        if (!vc) return [];
        try { return vc.allProducts(); } catch (e) { return []; }
    }
    // Pages that don't carry the catalogue get it on first open.
    function vsEnsureData(done) {
        if (window.veroCollections) return;
        if (document.getElementById('vsCatalogueScript')) return;
        const s = document.createElement('script');
        s.id = 'vsCatalogueScript'; s.src = 'collections.js';
        s.onload = done;
        document.head.appendChild(s);
    }
    function vsUsers(products) {
        const count = {};
        products.forEach(p => { if (p.seller) count[p.seller] = (count[p.seller] || 0) + 1; });
        const names = [...new Set(Object.keys(count).concat(VSP_USERS))];
        return names.map(n => ({ name: n, items: count[n] || 0 }));
    }
    function vsPrice(p) {
        const vc = window.veroCollections;
        let d = null;
        try { d = vc.discountOf(p._raw); } catch (e) {}
        return d || { onSale: false, price: p.price, original: p.price };
    }
    function vsMoney(n) {
        const vc = window.veroCollections;
        try { return vc.money(n); } catch (e) { return '₪' + n; }
    }
    function vsProductHref(p, price) {
        const data = JSON.stringify({
            name: p.name, price: price, icon: p.icon, cover: p.cover || '',
            category: p.category || '', seller: p.seller, rating: p.rating || 4.5,
            type: (p._raw && p._raw.type) || (p.collection === 'interiors' ? 'art' : 'clothing')
        });
        return 'product-showcase.html?product=' + encodeURIComponent(data);
    }

    // Every typed word has to appear somewhere in the piece; a hit in the name
    // (best of all at its start) ranks above one in the seller or category.
    function vsMatchProducts(all, tokens) {
        if (!tokens.length) return all.map(p => ({ p, score: 0 }));
        const out = [];
        all.forEach(p => {
            const name = (p.name || '').toLowerCase();
            const hay = name + ' ' + (p.seller || '').toLowerCase() + ' ' + (p.category || '').toLowerCase() + ' ' + (p.collection || '');
            let score = 0;
            for (const t of tokens) {
                if (!hay.includes(t)) return;
                if (name.startsWith(t)) score += 4;
                else if (new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(name)) score += 3;
                else if (name.includes(t)) score += 2;
                else score += 1;
            }
            out.push({ p, score });
        });
        return out;
    }
    function vsSort(hits) {
        const price = h => vsPrice(h.p).price;
        const by = {
            rel: (a, b) => b.score - a.score || (b.p.createdAt || 0) - (a.p.createdAt || 0),
            low: (a, b) => price(a) - price(b),
            high: (a, b) => price(b) - price(a),
            new: (a, b) => (b.p.createdAt || 0) - (a.p.createdAt || 0)
        };
        return hits.slice().sort(by[vs.sort] || by.rel);
    }
    function vsMatchUsers(users, tokens) {
        if (!tokens.length) return users;
        return users.filter(u => tokens.every(t => u.name.toLowerCase().includes(t)))
            .sort((a, b) => a.name.toLowerCase().indexOf(tokens[0]) - b.name.toLowerCase().indexOf(tokens[0]));
    }

    // ---- Recent searches ----
    function vsRecent() {
        try { const r = JSON.parse(localStorage.getItem(VS_RECENT_KEY)); return Array.isArray(r) ? r : []; } catch (e) { return []; }
    }
    function vsSaveRecent(list) { try { localStorage.setItem(VS_RECENT_KEY, JSON.stringify(list.slice(0, 6))); } catch (e) {} }
    function vsRemember(q) {
        q = String(q || '').trim();
        if (q.length < 2) return;
        vsSaveRecent([q].concat(vsRecent().filter(r => r.toLowerCase() !== q.toLowerCase())));
    }

    // ---- Rows ----
    function vsProductRow(p, tokens) {
        const d = vsPrice(p);
        const thumb = p.cover ? `<img src="${vspEscape(p.cover)}" alt="" loading="lazy">` : vspEscape(p.icon || '');
        const sub = [p.seller, p.category].filter(Boolean).map(x => vsMark(x, tokens)).join(' · ');
        const price = d.onSale
            ? `<s>${vsMoney(d.original)}</s><em>${vsMoney(d.price)}</em>`
            : vsMoney(d.original);
        return `<a class="vs-row vs-hit" href="${vspEscape(vsProductHref(p, d.price))}">
                    <span class="vs-thumb">${thumb}</span>
                    <span class="vs-row-main"><b>${vsMark(p.name, tokens)}</b><small>${sub}</small></span>
                    <span class="vs-row-end">${price}</span>
                </a>`;
    }
    function vsUserRow(u, tokens) {
        const meta = '★ ' + vspSellerRating(u.name) + (u.items ? ' · ' + u.items + (u.items === 1 ? ' piece' : ' pieces') : '');
        return `<a class="vs-row vs-hit" href="index.html?seller=${encodeURIComponent(u.name)}">
                    <span class="vs-ava" style="${vspAvatarStyle(u.name)}">${vspEscape(u.name[0] || '?')}</span>
                    <span class="vs-row-main"><b>${vsMark(u.name, tokens)}</b><small>${meta}</small></span>
                    <span class="vs-chev">›</span>
                </a>`;
    }
    function vsEmpty(q, what, picks) {
        const chips = picks.length
            ? `<div class="vs-chips">${picks.map(t => `<button class="vs-chip" type="button" data-vs="term" data-term="${vspEscape(t)}">${vspEscape(t)}</button>`).join('')}</div>` : '';
        return `<div class="vs-empty">
                    <div class="vs-empty-t">Nothing found</div>
                    <div class="vs-empty-m">No ${what} match “${vspEscape(q)}”.${picks.length ? '<br>Try another word, or one of these:' : '<br>Try another word.'}</div>
                    ${chips}
                </div>`;
    }

    // ---- Render ----
    function vsRender() {
        const page = document.getElementById('veroSearchPage');
        const body = document.getElementById('vsBody');
        if (!page || !body) return;
        const tokens = vsTokens(vs.q);
        const all = vsProducts();
        const users = vsUsers(all);
        const active = tokens.length > 0 || vsFilterOn(vs.f);   // showing results, not the starting point
        const popular = (VSP_POPULAR[document.body.dataset.mode === 'art' ? 'art' : 'clothing'] || [])
            .filter(t => !all.length || vsMatchProducts(all, [t.toLowerCase()]).length);

        const hits = vsMatchProducts(all, tokens);
        const narrowed = hits.filter(h => vsPass(h.p, vs.f));
        const userHits = vsMatchUsers(users, tokens);

        page.classList.toggle('has-q', !!vs.q);
        page.classList.toggle('filtering', !!vs.step);
        page.querySelectorAll('.vs-tab').forEach(t => {
            const mine = t.dataset.tab;
            t.classList.toggle('on', mine === vs.tab);
            t.setAttribute('aria-selected', mine === vs.tab ? 'true' : 'false');
            t.querySelector('i').textContent = tokens.length ? (mine === 'product' ? narrowed.length : userHits.length) : '';
        });

        if (vs.step) { body.innerHTML = vsStepHTML(hits, narrowed.length); vs.hi = -1; return; }

        // The filter line: the Filter link, then each answer given (tap to remove).
        const f = vs.f;
        const applied = VS_STEPS.filter(st => f[st.key]).map(st => [st.key, '', vsLabel(st.key, f[st.key])]);
        const filterLine = `<div class="vs-chips vs-narrow">`
            + `<button class="vs-chip on" type="button" data-vs="f-open">Filter</button>`
            + applied.map(x => `<button class="vs-chip vs-applied" type="button" data-vs="f-drop" data-key="${x[0]}" data-val="${vspEscape(x[1])}" aria-label="Remove ${vspEscape(x[2])}">${vspEscape(x[2])}</button>`).join('')
            + `</div>`;

        let html = '';
        if (vs.tab === 'user') {
            if (!tokens.length) {
                const top = users.slice().sort((a, b) => b.items - a.items).slice(0, 8);
                html = `<div class="vs-head">Suggested</div>` + top.map(u => vsUserRow(u, [])).join('');
            } else if (userHits.length) {
                html = `<div class="vs-head">Users <span>${userHits.length}</span></div>` + userHits.map(u => vsUserRow(u, tokens)).join('');
            } else {
                html = vsEmpty(vs.q, 'users', users.slice(0, 5).map(u => u.name));
            }
        } else if (!active) {
            const recent = vsRecent();
            if (recent.length) {
                html += `<div class="vs-head">Recent <button class="vs-link" type="button" data-vs="clear-recent">Clear all</button></div>`
                    + recent.map(r => `<div class="vs-row vs-hit" role="button" tabindex="0" data-vs="term" data-term="${vspEscape(r)}">
                            ${VS_ICON.clock}<span class="vs-row-main"><b>${vspEscape(r)}</b></span>
                            <button class="vs-x" type="button" data-vs="forget" data-term="${vspEscape(r)}" aria-label="Remove ${vspEscape(r)}">×</button>
                        </div>`).join('');
            }
            if (popular.length) {
                html += `<div class="vs-head">Trending</div><div class="vs-chips">`
                    + popular.map(t => `<button class="vs-chip" type="button" data-vs="term" data-term="${vspEscape(t)}">${vspEscape(t)}</button>`).join('') + `</div>`;
            }
            if (all.length) html += `<button class="vs-filterbtn" type="button" data-vs="f-open">Filter</button>`;
        } else if (!hits.length) {
            html = vsEmpty(vs.q, 'pieces', popular.slice(0, 5));
        } else if (!narrowed.length) {
            html = filterLine + `<div class="vs-empty">
                    <div class="vs-empty-t">Nothing found</div>
                    <div class="vs-empty-m">No pieces match these choices.</div>
                    <div class="vs-chips"><button class="vs-chip" type="button" data-vs="f-clear">Clear filter</button></div>
                </div>`;
        } else {
            const sortLabel = (VS_SORTS.find(x => x[0] === vs.sort) || VS_SORTS[0])[1];
            const sorted = vsSort(narrowed);
            html += filterLine + `<div class="vs-head">${vsPieces(narrowed.length)}
                        <button class="vs-link" type="button" data-vs="sort">${sortLabel} ↕</button></div>`
                + vsCardsHTML(sorted.slice(0, vs.limit), tokens);
            if (sorted.length > vs.limit) html += `<button class="vs-more" type="button" data-vs="more">Show more</button>`;
        }
        body.innerHTML = html;
        vs.hi = -1;
    }

    const SEARCH_MARKUP = `
        <div class="vsp-overlay" id="veroSearchPage" aria-hidden="true" role="dialog" aria-label="Search">
            <div class="vs-wrap">
                <div class="vs-top">
                    <div class="vs-barrow">
                        <label class="vs-bar">
                            ${VS_ICON.search}
                            <input id="vspInput" type="text" inputmode="search" enterkeyhint="search" data-usearch="done"
                                   placeholder="Search pieces, brands, people" autocomplete="off" autocapitalize="off" spellcheck="false">
                            <button class="vs-clear" type="button" data-vs="clear">Clear</button>
                        </label>
                        <button class="vs-close" type="button" data-vs="close" aria-label="Close search">Close</button>
                    </div>
                    <div class="vs-flowbar">
                        <button class="vs-back" type="button" data-vs="f-back">‹ Back</button>
                        <button class="vs-close" type="button" data-vs="close" aria-label="Close search">Close</button>
                    </div>
                    <div class="vs-tabs" role="tablist">
                        <button class="vs-tab on" type="button" role="tab" data-vs="tab" data-tab="product">Products<i></i></button>
                        <button class="vs-tab" type="button" role="tab" data-vs="tab" data-tab="user">Users<i></i></button>
                    </div>
                </div>
                <div class="vs-body" id="vsBody" aria-live="polite"></div>
            </div>
        </div>`;

    // Results as the site's own product cards, two to a row. Falls back to the
    // plain rows if the card renderer is not there.
    function vsCardsHTML(list, tokens) {
        const vc = window.veroCollections;
        if (!vc || typeof vc.cardHTML !== 'function') return list.map(h => vsProductRow(h.p, tokens)).join('');
        if (!document.querySelector('link[href*="product-card.css"]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = 'product-card.css';
            document.head.appendChild(l);
        }
        return `<div class="vs-cards">` + list.map(h => vc.cardHTML(h.p)).join('') + `</div>`;
    }

    // One filter question as a page of plain words: the "any" answer first, then
    // the choices that still lead somewhere. The chosen one is underlined.
    function vsStepHTML(hits, total) {
        const asked = vsAsked();
        const step = asked.find(st => st.key === vs.step) || asked[0], key = step.key, cur = vs.f[key];
        const opts = [{ val: '', label: step.any }].concat(vsOptions(key, hits));
        return `<div class="vs-step" role="group" aria-labelledby="vsStepTitle">
                    <div class="vs-step-n">${asked.indexOf(step) + 1} / ${asked.length}</div>
                    <h2 class="vs-step-t" id="vsStepTitle" tabindex="-1">${step.title}</h2>
                    <div class="vs-opts">`
            + opts.map(o => `<button class="vs-opt${o.val === cur ? ' on' : ''}" type="button" data-vs="f-opt" data-val="${vspEscape(o.val)}"
                            aria-pressed="${o.val === cur ? 'true' : 'false'}">${vspEscape(o.label)}</button>`).join('')
            + `</div></div>
                <div class="vs-foot" aria-live="polite">
                    <button class="vs-next" type="button" data-vs="f-done">Show ${vsPieces(total)}</button>
                </div>`;
    }
    // Move between pages: the current one fades out, the next fades in, and focus
    // lands on the new question so it is read out. '' leaves the filter for the results.
    function vsGo(step) {
        const page = document.getElementById('veroSearchPage');
        const body = document.getElementById('vsBody');
        if (!page || !body) return;
        const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        clearTimeout(vsGo.t);
        body.classList.add('vs-out');
        vsGo.t = setTimeout(() => {
            vs.step = step; vs.limit = VS_PAGE;
            vsRender();
            page.scrollTop = 0;
            body.classList.remove('vs-out');
            const title = document.getElementById('vsStepTitle');
            if (title) title.focus({ preventScroll: true });
        }, still ? 0 : 220);
    }
    function vsHits() { return vsMatchProducts(vsProducts(), vsTokens(vs.q)); }
    // An answer moves the process on by itself. Changing an earlier answer
    // clears the later ones, since their choices depended on it.
    function vsPickOption(val) {
        const keys = VS_STEPS.map(st => st.key), at = keys.indexOf(vs.step);
        if (at < 0) return;
        if (vs.f[vs.step] !== val) keys.slice(at + 1).forEach(k => { vs.f[k] = ''; });
        vs.f[vs.step] = val;
        if (vs.step === 'gender') vs.gOff = !val;
        vsUseProfileGender();
        vsRender();
        clearTimeout(vsGo.t);
        vsGo.t = setTimeout(() => vsGo(vsNeighbour(vs.step, 1, vsHits())), 240);
    }

    function vsSetQuery(q, focus) {
        const input = document.getElementById('vspInput');
        vs.q = q; vs.limit = VS_PAGE;
        if (input && input.value !== q) input.value = q;
        vsRender();
        const page = document.getElementById('veroSearchPage');
        if (page) page.scrollTop = 0;
        if (focus && input) input.focus();
    }
    // Arrow keys walk the rows on screen; the field keeps the caret.
    function vsMove(step) {
        const rows = [...document.querySelectorAll('#vsBody .vs-hit')];
        if (!rows.length) return;
        vs.hi = Math.max(-1, Math.min(rows.length - 1, vs.hi + step));
        rows.forEach((r, i) => r.classList.toggle('hi', i === vs.hi));
        if (vs.hi >= 0) rows[vs.hi].scrollIntoView({ block: 'nearest' });
    }

    function mountSearchPage() {
        if (document.getElementById('veroSearchPage')) return;
        const wrap = document.createElement('div');
        wrap.id = 'veroSearchPageRoot';
        wrap.innerHTML = SEARCH_MARKUP;
        document.body.appendChild(wrap);
        const page = document.getElementById('veroSearchPage');
        const input = document.getElementById('vspInput');

        input.addEventListener('input', () => { vs.q = input.value; vs.limit = VS_PAGE; vsRender(); });
        input.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); vsMove(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); vsMove(-1); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                const row = document.querySelectorAll('#vsBody .vs-hit')[vs.hi];
                if (row) { row.click(); return; }
                vsRemember(vs.q);
                input.blur();              // drops the phone keyboard so the results show
            }
        });
        page.addEventListener('click', e => {
            const el = e.target.closest('[data-vs]');
            if (!el) {
                // A result was opened — remember what led to it.
                if (e.target.closest('a.vs-row')) vsRemember(vs.q);
                return;
            }
            const act = el.dataset.vs;
            if (act === 'close') window.veroCloseSearchPage();
            else if (act === 'clear') { e.preventDefault(); vsSetQuery('', true); }
            else if (act === 'tab') { vs.tab = el.dataset.tab; vs.limit = VS_PAGE; vsRender(); page.scrollTop = 0; }
            else if (act === 'forget') { e.stopPropagation(); vsSaveRecent(vsRecent().filter(r => r !== el.dataset.term)); vsRender(); }
            else if (act === 'clear-recent') { vsSaveRecent([]); vsRender(); }
            else if (act === 'term') { vs.tab = 'product'; vsRemember(el.dataset.term); vsSetQuery(el.dataset.term, false); }
            else if (act === 'f-open') vsGo(vsNeighbour('', 1, vsHits()));
            else if (act === 'f-back') vsGo(vsNeighbour(vs.step, -1, vsHits()));
            else if (act === 'f-done') { vsUseProfileGender(); vsGo(''); }
            else if (act === 'f-opt') vsPickOption(el.dataset.val);
            else if (act === 'f-clear') { vs.f = vsNoFilter(); vs.limit = VS_PAGE; vsRender(); }
            else if (act === 'f-drop') {
                vs.f[el.dataset.key] = '';
                if (el.dataset.key === 'gender') vs.gOff = true;
                vs.limit = VS_PAGE; vsRender();
            }
            else if (act === 'sort') {
                const i = VS_SORTS.findIndex(s => s[0] === vs.sort);
                vs.sort = VS_SORTS[(i + 1) % VS_SORTS.length][0];
                vsRender();
            }
            else if (act === 'more') { vs.limit += VS_PAGE; vsRender(); }
        });
        // Recent rows are focusable divs (they hold a remove button) — Enter opens them.
        page.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.matches && e.target.matches('.vs-row[role="button"]')) e.target.click();
        });
    }

    window.veroOpenSearchPage = function () {
        mountSearchPage();
        const page = document.getElementById('veroSearchPage');
        const input = document.getElementById('vspInput');
        // Fresh each open: empty field, Products tab, the starting point below.
        vs = vsFresh();
        input.value = '';
        vsRender();
        vsEnsureData(vsRender);
        void page.offsetWidth;                 // so the fade-in runs from the hidden state
        page.classList.add('open');
        page.setAttribute('aria-hidden', 'false');
        page.scrollTop = 0;
        document.body.style.overflow = 'hidden';
        input.focus();                         // straight to typing, keyboard up on phones
    };
    window.veroCloseSearchPage = function () {
        const page = document.getElementById('veroSearchPage');
        if (!page || !page.classList.contains('open')) return;
        page.classList.remove('open');
        page.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        const input = document.getElementById('vspInput');
        if (input) input.blur();
    };
    // Escape leaves the filter pages, then empties the search, then closes it.
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const page = document.getElementById('veroSearchPage');
        if (!page || !page.classList.contains('open')) return;
        if (vs.step) vsGo('');
        else if (vs.q || vsFilterOn(vs.f)) { vs.f = vsNoFilter(); vsSetQuery('', true); }
        else window.veroCloseSearchPage();
    });

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

    // Live preview under the filters: the single product that best matches the
    // current selections, laid out as a promoted slide. The page supplies the
    // match via window.veroFilterPreview.
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
        // Same slide order as .promo-slide: company name (large, regular weight,
        // one word per line) → product name (bold) → description → price → buy.
        const company = (p.brand || p.seller || 'moravchick Select').trim();
        const oneWord = company.split(/\s+/).length === 1;
        // Feed products carry a written description; ordinary listings do not, so
        // fall back to the category the piece is filed under.
        const desc = p.desc || [p.category, p.style].filter(Boolean).join(' — ') || '';
        const url = (typeof window.productPageUrl === 'function')
            ? window.productPageUrl(p) : 'product-showcase.html';
        host.innerHTML = `
            <a href="${url}" class="hdr-preview-img">${p.icon || '🛍️'}</a>
            <div class="hdr-preview-info">
                <div class="hdr-preview-head">
                    <span class="hdr-preview-seller${oneWord ? ' one-word' : ''}">${
                        company.split(/\s+/).map(w => `<span>${w}</span>`).join(' ')
                    }</span>
                    <h2 class="hdr-preview-name">${p.name || ''}</h2>
                </div>
                <div class="hdr-preview-foot">
                    <p class="hdr-preview-desc">${desc}</p>
                    <div class="hdr-preview-price">${p.price || ''}</div>
                    <button class="hdr-preview-buy" onclick="window.location.href='${url}'">
                        Discover the Piece <span class="arrow">&rarr;</span>
                    </button>
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

    // Toggle the sliding search field open/closed from the magnifier circle.
    window.veroToggleSearch = function (e) {
        if (e) e.stopPropagation();
        const dock = document.getElementById('veroSearchDock');
        if (!dock) return;
        const open = !dock.classList.contains('open');
        dock.classList.toggle('open', open);
        const input = document.getElementById('veroSearchInput');
        if (open) {
            if (input) setTimeout(() => input.focus(), 80);
        } else {
            // closing the field also tucks the filter panel away
            const panel = document.getElementById('veroFilters');
            if (panel && panel.classList.contains('open')) window.veroToggleFilters();
        }
    };
    function veroCloseSearch() {
        const dock = document.getElementById('veroSearchDock');
        if (dock) dock.classList.remove('open');
        const panel = document.getElementById('veroFilters');
        if (panel && panel.classList.contains('open')) {
            panel.classList.remove('open');
            const f = document.getElementById('veroFunnel');
            if (f) f.classList.remove('on');
        }
    }

    // click outside / Escape closes the panel and the search field
    document.addEventListener('click', e => {
        const panel = document.getElementById('veroFilters');
        if (panel && panel.classList.contains('open') &&
            !e.target.closest('#veroFilters') && !e.target.closest('#veroFunnel')) {
            panel.classList.remove('open');
            const btn = document.getElementById('veroFunnel');
            if (btn) btn.classList.remove('on');
        }
        const dock = document.getElementById('veroSearchDock');
        if (dock && dock.classList.contains('open') &&
            !e.target.closest('#veroSearchDock') && !e.target.closest('#veroFilters')) {
            dock.classList.remove('open');
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        veroCloseSearch();
    });

    // ---- Cart slide-in transition ----
    // Cache-buster: append a _ts param so the browser always fetches the freshest
    // deploy on JS-driven navigations (no manual hard-refresh needed).
    window.veroBust = function (u) {
        if (!u || /[?&]_ts=/.test(u)) return u;
        return u + (u.indexOf('?') >= 0 ? '&' : '?') + '_ts=' + Date.now();
    };

    // Accessing the cart from the header glides a white panel in from the right,
    // then navigates — cart-store.html continues the motion by sliding its own
    // content in from the same side, so the cart reads as one panel sliding in.
    // Defined on window so every page's openCart (the SPA one on index.html and
    // the fallback below) can share the exact same transition.
    window.veroSlideToCart = function (url) {
        const dest = url || 'cart-store.html';
        // Inside phone-frame this navigates the IFRAME, so the app stays framed.
        const navigate = () => { location.href = veroBust(dest); };
        // Respect users who asked for less motion — just navigate.
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            navigate(); return;
        }
        if (document.getElementById('veroCartSlide')) return;   // already transitioning
        const panel = document.createElement('div');
        panel.id = 'veroCartSlide';
        panel.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;' +
            'transform:translateX(100%);transition:transform .5s cubic-bezier(.22,1,.36,1);will-change:transform';
        document.body.appendChild(panel);
        requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; }));
        setTimeout(navigate, 470);
    };

    // ---- Account state (Instagram / TikTok style) ----
    // The site remembers which account you're acting as — 'buyer' (personal) or
    // 'seller' (business). Switching stays on the SAME feed; only the account
    // context changes, hidden behind a short WELCOME splash.
    window.veroActiveAccount = function () {
        return localStorage.getItem('vero_active_account') === 'seller' ? 'seller' : 'buyer';
    };

    function accountName(acct) {
        let store; try { store = JSON.parse(localStorage.getItem('vero_store_config')) || {}; } catch (e) { store = {}; }
        let prof;  try { prof  = JSON.parse(localStorage.getItem('vero_profile')) || {}; }      catch (e) { prof = {}; }
        let sell;  try { sell  = JSON.parse(localStorage.getItem('vero_seller_profile')) || {}; } catch (e) { sell = {}; }
        return acct === 'seller'
            ? (sell.name || store.name || 'My Store')
            : (prof.name || 'My Profile');
    }

    // The public storefront (store-profile.html) is still deleted and being
    // rebuilt, so the search seller-card + "show storefront" buttons route here.
    window.veroSellerGone = function () {
        try { veroCloseDrawer(); } catch (e) {}
        alert('The public store is being rebuilt');
    };

    // Open the "rectangles" hub that matches the active account — seller-area for
    // the business account, buyer-area (personal) for the buyer account.
    window.veroOpenArea = function () {
        const dest = veroActiveAccount() === 'seller' ? 'seller-area.html' : 'profile.html';
        // Inside phone-frame this navigates the IFRAME (self, not top), so the app
        // stays framed — no need to touch the top hash (which could equal the target
        // and silently do nothing). A relative URL always reloads within the frame.
        location.href = veroBust(dest);
    };

    // Enter a given account context and navigate to its hub page. Used by the
    // drawer's area link: 'seller' → the seller hub (seller-area.html), 'buyer' →
    // the personal hub (profile.html). Sets the active account first so the
    // destination and the header read as that account, then shows the WELCOME
    // splash on the way in.
    window.veroGoAccount = function (account, dest) {
        const acct = account === 'seller' ? 'seller' : 'buyer';
        localStorage.setItem('vero_active_account', acct);
        veroProfileSplash({ name: accountName(acct), dest: dest || (acct === 'seller' ? 'seller-area.html' : 'profile.html') });
    };

    // Toggle between the personal and seller accounts without leaving the feed:
    // set the new account, show the welcome splash, then reload the current view
    // in place so the header + account context reflect the switch.
    window.veroSwitchAccount = function () {
        const next = veroActiveAccount() === 'seller' ? 'buyer' : 'seller';
        localStorage.setItem('vero_active_account', next);
        veroProfileSplash({ name: accountName(next), reload: true });
    };

    // Log out (Instagram-style): revoke the active session but KEEP the saved
    // account on the device, then land on the Saved-Accounts screen for one-tap
    // re-entry. Falls back gracefully if auth.js isn't present on a page.
    window.veroLogout = function () {
        try { if (window.VeroAuth) VeroAuth.logout(); else localStorage.removeItem('vero_session'); } catch (e) {}
        // Navigate the top window (breaks out of the phone frame) to the login screen.
        try { window.top.location.href = 'login.html'; } catch (e) { location.href = 'login.html'; }
    };

    // ---- Long-press account switcher (Instagram-style) ----
    // Holding the header profile picture opens a small card listing the personal and
    // business accounts; tapping one switches to it. A normal tap opens the account.
    function closeAccountSwitcher() {
        const p = document.getElementById('veroAcctSwitcher');
        if (p) p.remove();
        document.removeEventListener('click', acctSwitcherOutside, true);
    }
    function acctSwitcherOutside(e) {
        const p = document.getElementById('veroAcctSwitcher');
        if (p && !p.contains(e.target) && !e.target.closest('.hdr-avatar-btn, .hdr-account-btn')) closeAccountSwitcher();
    }
    window.veroOpenAccountSwitcher = function (anchor) {
        closeAccountSwitcher();
        const cur = window.veroActiveAccount();
        let prof = {}, store = {}, sell = {};
        try { prof  = JSON.parse(localStorage.getItem('vero_profile')) || {}; } catch (e) {}
        try { store = JSON.parse(localStorage.getItem('vero_store_config')) || {}; } catch (e) {}
        try { sell  = JSON.parse(localStorage.getItem('vero_seller_profile')) || {}; } catch (e) {}
        const rows = [
            { key: 'buyer',  name: accountName('buyer'),  sub: 'Personal', img: prof.avatarImg || '' },
            { key: 'seller', name: accountName('seller'), sub: 'Business', img: sell.avatarImg || store.avatarImg || '' }
        ];
        const pop = document.createElement('div');
        pop.className = 'vero-acct-switcher';
        pop.id = 'veroAcctSwitcher';
        // Simple stacked list: each row is just the name (left) and the avatar (right).
        pop.innerHTML = rows.map(r => {
            const initial = ((r.name || 'V').trim()[0] || 'V');
            const av = r.img ? `style="background-image:url('${r.img}')"` : '';
            return `<button class="vas-row${r.key === cur ? ' on' : ''}" data-acct="${r.key}">
                        <span class="vas-name">${r.name}</span>
                        <span class="vas-av" ${av}>${r.img ? '' : initial}</span>
                    </button>`;
        }).join('');
        document.body.appendChild(pop);
        // White names while the header is transparent over the hero / gender slider;
        // black once it turns solid over the feed (mirrors the header's .scrolled).
        var hdrEl = document.getElementById('siteHeader');
        if (!hdrEl || !hdrEl.classList.contains('scrolled')) pop.classList.add('vas-on-hero');
        // Drop the avatar circles directly under the header profile icon, on the same
        // vertical line: the circle sits flush-right in the row (12px padding + 20px
        // radius), so align the row's right edge to centre the circle under the icon.
        var anchorEl = anchor || document.querySelector('#siteHeader .hdr-avatar-btn, #siteHeader .hdr-account-btn');
        const box = anchorEl.getBoundingClientRect();
        const W = 240;
        const cx = box.left + box.width / 2;      // header icon centre
        // Circle sits 32px in from the popup's right edge (12px pad + 20px radius);
        // place the popup so that point lands under the icon centre. The popup is
        // frameless, so its empty left area can run to the screen edge.
        let left = Math.max(8, (cx + 32) - W);
        pop.style.left = left + 'px';
        pop.style.top = (box.bottom + 6) + 'px';
        pop.querySelectorAll('.vas-row').forEach(row => {
            row.addEventListener('click', () => {
                const acct = row.dataset.acct;
                closeAccountSwitcher();
                // Switching a profile lands on the home feed, not the personal area.
                if (acct !== cur) window.veroGoAccount(acct, 'index.html');
            });
        });
        requestAnimationFrame(() => pop.classList.add('open'));
        setTimeout(() => document.addEventListener('click', acctSwitcherOutside, true), 0);
    };

    function wireAccountLongPress() {
        const btn = document.querySelector('#siteHeader .hdr-avatar-btn, #siteHeader .hdr-account-btn');
        if (!btn) return;
        // A normal tap opens the active account's area. A long press (hold ~500ms)
        // on the header profile icon opens the Switch-profile card, so switching
        // between the personal and business accounts lives on that hold gesture.
        btn.style.touchAction = 'manipulation';
        const HOLD = 500, MOVE_TOL = 10;
        let timer = null, longPressed = false, startX = 0, startY = 0;
        const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
        const start = (x, y) => {
            longPressed = false; startX = x; startY = y; clear();
            timer = setTimeout(() => {
                timer = null; longPressed = true;
                try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
                window.veroOpenAccountSwitcher(btn);
            }, HOLD);
        };
        btn.addEventListener('pointerdown', (e) => start(e.clientX, e.clientY));
        btn.addEventListener('pointermove', (e) => {
            if (timer && (Math.abs(e.clientX - startX) > MOVE_TOL || Math.abs(e.clientY - startY) > MOVE_TOL)) clear();
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btn.addEventListener(ev, clear));
        // Suppress the browser's own long-press menu on the icon.
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (longPressed) { longPressed = false; return; }   // the hold already opened the switcher
            window.veroOpenArea();
        });
    }

    // ---- Profile-switch splash ----
    // A short welcome screen: "WELCOME", the account name, then a caption. By
    // default it reloads the current page in place (stay on the feed); pass a
    // `dest` to navigate somewhere instead.
    window.veroProfileSplash = function (opts) {
        opts = opts || {};
        const go = () => {
            if (opts.reload) location.reload();
            // Inside phone-frame this navigates the IFRAME, so the app stays framed.
            else location.href = veroBust(opts.dest || 'index.html');
        };
        const name = opts.name || accountName(veroActiveAccount());
        // Respect reduced-motion — skip the animation and just switch.
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
        if (document.getElementById('veroSwitchSplash')) return;   // already transitioning
        const ov = document.createElement('div');
        ov.id = 'veroSwitchSplash';
        ov.className = 'vero-switch-splash';
        ov.innerHTML =
            '<div class="vss-inner">'
          +   '<div class="vss-welcome">WELCOME</div>'
          +   '<div class="vss-name"></div>'
          + '</div>';
        ov.querySelector('.vss-name').textContent = name;
        document.body.appendChild(ov);
        // Stage 1+2 in: the overline fades up, then the name. Hold, then stage 1+2
        // out: the name fades first, then the overline — all under the black field.
        requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('show')));
        setTimeout(() => ov.classList.add('leaving'), 1400);
        setTimeout(go, 2250);
    };

    // ---- Fallback handlers ----
    // On index.html these globals are the real SPA functions and win (their
    // function declarations override these). On every other page they navigate
    // back to the home page and open the requested view via ?open=.
    const nav = url => { location.href = url; };
    function ensure(name, fn) { if (typeof window[name] !== 'function') window[name] = fn; }
    ensure('showMain', () => nav('index.html'));
    ensure('openWishlist', () => nav('index.html?open=wishlist'));
    ensure('openCart', () => window.veroSlideToCart());
    ensure('vchatOpenInbox', () => nav('index.html?open=chats'));
    ensure('openBuyerArea', () => nav('profile.html'));
    ensure('openSellerArea', () => nav('seller-area.html'));
    ensure('openUploadProduct', () => nav('upload-start.html'));
    ensure('openMenu', () => nav('index.html?open=magazine'));
    // The magazine reader (magazine.js defines the real window.openMagazine on
    // pages that load it; elsewhere fall back to opening it on the home page).
    ensure('openMagazine', () => nav('index.html?open=magazine'));
    // Men / Women / Kids drawer links → open that segment on the home feed. Always
    // routes through index.html?seg=… so it works from any page; index reads the
    // param on load and selects the segment.
    window.veroGoSegment = function (key) { nav('index.html?seg=' + encodeURIComponent(key)); };
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
        injectOakTheme();
    }

    // ---- Oak Green theme (site-wide) ----
    // One stylesheet, loaded by the header on every page, so the brand colour reaches
    // the shared chrome everywhere: the Art/Fashion toggle, the filter funnel, the
    // search panel's apply button + active filter chips, and the primary CTA buttons.
    // Appended after the header CSS (and marked !important) so it wins over page CSS.
    function injectOakTheme() {
        if (document.getElementById('veroOakTheme')) return;
        const s = document.createElement('style');
        s.id = 'veroOakTheme';
        s.textContent = `
            :root {
                --oak: #2A331B; --oak-deep: #2A331B; --oak-mid: #66764A;
                --oak-soft: #A7B486; --oak-wash: #EEF1E6; --oak-line: #D7DCC7;
            }
            /* Art/Fashion toggle — the sliding knob. */
            #siteHeader .toggle-category::before,
            #siteHeader.scrolled .toggle-category::before,
            #siteHeader.force-dark .toggle-category::before,
            #siteHeader.force-light .toggle-category::before,
            #siteHeader.sticky-look:not(.scrolled) .toggle-category::before { background: var(--oak) !important; }
            /* Filter funnel + search dock. */
            #siteHeader .hdr-funnel { background: var(--oak) !important; }
            #siteHeader .hdr-searchdock.open .hdr-searchtoggle { background: var(--oak) !important; border-color: var(--oak) !important; }
            #siteHeader .hdr-search:focus-within { border-color: var(--oak) !important; }
            /* Primary CTA buttons shared across pages — recolour the solid dark fill. */
            .hero-ov-btn--solid,
            .fbtn.save, .bbtn.save, .btn.save,
            .btn-primary, .btn--primary, .primary-btn, .cta-primary,
            .pc-buy, .achs-buy, .buy-now, .add-to-cart, .add-cart,
            .save-btn.primary, .solid-dark {
                background: var(--oak) !important; border-color: var(--oak) !important; color: #fff !important;
            }
        `;
        document.head.appendChild(s);
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
        applyIconOrder();
        wireBehaviour();
    }

    function wireBehaviour() {
        // Solid header once scrolled past the top. On the feed, the header wears
        // black while it still sits above the filter line, then flips to the white
        // scrolled header once it passes it.
        const onScroll = () => {
            const hdr = document.querySelector('header#siteHeader') || document.querySelector('header');
            if (!hdr) return;
            // A page may supply its own predicate (e.g. the feed keeps the header
            // transparent through its Men/Women/Kids slider); default: 80px past top.
            const scrolled = (typeof window.veroHeaderScrolled === 'function')
                ? !!window.veroHeaderScrolled(hdr)
                : window.scrollY > 80;
            hdr.classList.toggle('scrolled', scrolled);
            // The feed's slider + filter bands are now white, so the header stays
            // white with black content throughout — it never flips to the dark look.
            hdr.classList.toggle('over-dark', false);
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

        // Header account button shows the personal-area profile picture by default
        // (falls back to the name's initial). The switch button beside it opens the
        // separate Seller Area (business) account.
        fillHeaderAvatar();
        wireAccountLongPress();

        // If we arrived via ?open=… (from another page), open that view once the
        // real SPA handlers exist (index.html only).
        window.addEventListener('load', () => {
            const open = new URLSearchParams(location.search).get('open');
            if (!open) return;
            const map = { cart: 'openCart', wishlist: 'openWishlist', chats: 'vchatOpenInbox', upload: 'openUploadProduct', magazine: 'openMagazine' };
            const fn = map[open];
            if (fn && typeof window[fn] === 'function') window[fn]();
        });
    }

    function fillHeaderAvatar() {
        const el = document.getElementById('hdrAvatar');
        if (!el) return;
        let prof; try { prof = JSON.parse(localStorage.getItem('vero_profile')) || {}; } catch (e) { prof = {}; }
        const seller = (typeof window.veroActiveAccount === 'function') && window.veroActiveAccount() === 'seller';
        // Personal account shows the profile picture; seller account shows the
        // store's initial so you can tell at a glance which account you're in.
        if (!seller && prof.avatarImg) {
            // The avatar may live in IndexedDB (avatarImg === 'idb'); resolve it.
            if (prof.avatarImg === 'idb' && typeof window.veroResolveMedia === 'function') {
                window.veroResolveMedia('idb', 'avatar').then(url => {
                    if (url) { el.style.backgroundImage = `url('${url}')`; el.classList.add('has-img'); el.textContent = ''; }
                });
            } else if (prof.avatarImg !== 'idb') {
                el.style.backgroundImage = `url('${prof.avatarImg}')`;
                el.classList.add('has-img');
                el.textContent = '';
            }
        } else {
            el.style.backgroundImage = '';
            el.classList.remove('has-img');
            let name = prof.name || '';
            if (seller) {
                let store; try { store = JSON.parse(localStorage.getItem('vero_store_config')) || {}; } catch (e) { store = {}; }
                name = store.name || prof.name || 'S';
            }
            const n = (name || '').trim();
            el.textContent = n ? n[0] : 'V';
        }
        // A subtle ring marks the seller account so the switch is legible.
        el.classList.toggle('is-seller', !!seller);
        // In the business (seller) account the header is stripped down to just the
        // logo, the +, the profile picture and the switch icon.
        // Both accounts share the same header layout (the personal area mirrors the
        // seller's). The green ring (is-seller, above) is the only seller-specific
        // mark. The account cluster (name + picture + switch) sits on the left.
        const hdr = document.getElementById('siteHeader');
        if (hdr) hdr.classList.add('acct-seller');
        const acct = hdr && hdr.querySelector('[data-icon="account"]');
        const left = hdr && hdr.querySelector('.header-left');
        if (acct && left && acct.parentElement !== left) left.appendChild(acct);
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
        set('cartMenuBadge', count('vero_cart'));
        set('wishMenuBadge', count('vero_wishlist'));
        set('drawerCartBadge', count('vero_cart'));
        set('drawerWishBadge', count('vero_wishlist'));
    }

    // ---- Cart / Wishlist dropdown (opened by tapping the header cart icon) ----
    window.veroCloseCartMenu = function () {
        const menu = document.getElementById('cartMenu');
        const btn = document.querySelector('.hdr-cart-btn');
        if (menu) menu.classList.remove('open');
        if (menu) menu.setAttribute('aria-hidden', 'true');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    };
    // Tapping the cart icon reveals the Cart + Wishlist icons beneath it.
    window.veroToggleCartMenu = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const menu = document.getElementById('cartMenu');
        const btn = document.querySelector('.hdr-cart-btn');
        if (!menu) { window.veroSlideToCart && window.veroSlideToCart('cart-store.html'); return; }
        // Second tap on the cart (while the wishlist pop is open) opens the cart.
        if (menu.classList.contains('open')) { window.veroPickCart(e); return; }
        try { updateBadgesFromStorage(); } catch (_) {}
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        if (btn) btn.setAttribute('aria-expanded', 'true');
    };
    window.veroPickCart = function (e) {
        if (e) e.preventDefault();
        window.veroCloseCartMenu();
        if (window.veroSlideToCart) window.veroSlideToCart('cart-store.html');
        else window.location.href = 'cart-store.html';
    };
    window.veroPickWishlist = function (e) {
        if (e) e.preventDefault();
        window.veroCloseCartMenu();
        if (window.veroSlideToCart) window.veroSlideToCart('wishlist.html');
        else window.location.href = 'wishlist.html';
    };
    // Tap anywhere outside → close the menu.
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('cartMenu');
        if (!menu || !menu.classList.contains('open')) return;
        if (e.target.closest('.hdr-cart')) return;
        window.veroCloseCartMenu();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') window.veroCloseCartMenu();
    });

    if (document.getElementById('siteHeader') || document.body) {
        render();
    } else {
        document.addEventListener('DOMContentLoaded', render);
    }

    // ---- Page prefetching for instant navigation ----
    // Warms the browser's HTTP cache so a tapped page is already downloaded and
    // renders near-instantly. On the phone there is no hover, so the real win is
    // the PROACTIVE prefetch below (runs on idle after load).
    const preloadedPages = new Set();
    function preloadPage(url) {
        if (!url) return;
        url = url.split('#')[0];
        if (preloadedPages.has(url) || !/\.html($|\?)/.test(url) || url.startsWith('http')) return;
        preloadedPages.add(url);
        // <link rel="prefetch"> lets the browser fetch at idle priority and keep it
        // in the HTTP cache for the next real navigation.
        try {
            const l = document.createElement('link');
            l.rel = 'prefetch';
            l.href = url;
            document.head.appendChild(l);
        } catch (e) {}
        // Belt-and-braces: also fetch (some engines cache the response body).
        fetch(url, { priority: 'low' }).catch(() => {});
    }

    // Hover intent (desktop): prefetch the link under the cursor.
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a[href], button[onclick*="profile"], button[onclick*="seller"]');
        if (!link) return;
        let url = link.getAttribute('href');
        if (!url) {
            const onclick = link.getAttribute('onclick') || '';
            const match = onclick.match(/['"]([^'"]*\.html[^'"]*)['"]/);
            url = match ? match[1] : null;
        }
        if (url) preloadPage(url);
    }, { passive: true });

    // Proactive prefetch (mobile + desktop): once the current page is quiet, pull
    // the pages a user is most likely to open next into cache, so tapping them is
    // near-instant. Keeps the list small so it doesn't hog bandwidth.
    function warmCommonPages() {
        [
            'index.html', 'feed.html', 'profile.html', 'products.html', 'seller-area.html',
            'chats.html', 'cart-store.html', 'cart.html', 'wishlist.html',
            'buyer-profile.html', 'drafts.html',
            'offers-received.html', 'saved.html', 'follows.html'
        ].forEach(preloadPage);
    }
    if ('requestIdleCallback' in window) {
        requestIdleCallback(warmCommonPages, { timeout: 3000 });
    } else {
        setTimeout(warmCommonPages, 1200);
    }
})();
