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

    // ---- Header icon order (manual) ------------------------------------------
    // Left-to-right order of the items on the right side of the header. Edit this
    // list to move an icon; every page picks the change up. The keys match the
    // data-icon attributes on the markup below — any key left out of the list
    // keeps its markup position, and an unknown key is ignored.
    //
    // At runtime you can also reorder without editing the file:
    //   veroSetIconOrder(['cart', 'wishlist', 'mode', 'chats', 'account', 'upload'])
    //   veroResetIconOrder()          // back to the default below
    // A runtime order is remembered in localStorage and wins over this default.
    // 'mode' is the switch and the + together — they ship as one unit (.hdr-mode-pair).
    const ICON_ORDER = ['mode', 'account', 'cart'];
    const ICON_ORDER_KEY = 'vero_header_icon_order';

    function currentIconOrder() {
        try {
            const saved = JSON.parse(localStorage.getItem(ICON_ORDER_KEY) || 'null');
            if (Array.isArray(saved) && saved.length) return saved;
        } catch (e) { /* malformed stored order — fall back to the default */ }
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

    window.veroSetIconOrder = function (order) {
        if (!Array.isArray(order)) return;
        localStorage.setItem(ICON_ORDER_KEY, JSON.stringify(order));
        applyIconOrder();
    };
    window.veroResetIconOrder = function () {
        localStorage.removeItem(ICON_ORDER_KEY);
        applyIconOrder();
    };

    // ---- Styles (injected once; appended late so it wins over any page CSS) ----
    const CSS = `
        /* The header shows on every page, but not every page loads Poppins — pull it
           in here so the personal-area type voice is guaranteed wherever the header
           renders. design-system.css forces its own face on every element with a
           universal !important rule, so Poppins is reasserted the same way, scoped
           to #siteHeader, so only the header changes. */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600&display=swap');
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
        #siteHeader .header-left { display: flex; gap: 30px; align-items: center; justify-self: start; }
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
            stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round;
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
            stroke: #fff; fill: #fff; stroke-width: 1.6;
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
            stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
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
        /* While the header floats transparent over the hero image, the logo is white;
           once the header turns solid (scrolled), it reverts to black (rule above). */
        #siteHeader.sticky-look:not(.scrolled) .logo .logo-img { filter: brightness(0) invert(1) !important; }
        #siteHeader .header-right { display: flex; gap: 26px; align-items: center; flex: 1; justify-content: flex-end; }
        #siteHeader .header-right .icon-wrap { margin-left: 0; }
        /* The switch and the plus keep their shared styling through this wrapper, but
           the wrapper itself is transparent to layout — both controls are direct flex
           items of .header-right, so every gap in the icon row is the same. */
        #siteHeader .hdr-mode-pair { display: contents; }
        /* Plain switch — no labels, just a track with a sliding knob. */
        #siteHeader .toggle-category {
            position: relative; display: inline-block; box-sizing: border-box;
            width: 46px; height: 24px; flex: 0 0 auto;
            background: transparent; padding: 0; border-radius: 999px; cursor: pointer;
            /* Not "all": border-color is mode-driven and must switch immediately when
               the mode flips — transitioning it left the switch showing the old
               mode's colour. */
            transition: background 0.3s ease; border: 1px solid rgba(0, 0, 0, 0.18);
        }
        #siteHeader .toggle-category::before {
            content: ''; position: absolute; top: 3px; left: 3px;
            width: 18px; height: 18px; border-radius: 50%; background: #111; z-index: 0;
            /* Only the slide animates. The knob's colour is mode-driven, same as the
               track's border, and must switch instantly rather than fade. */
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #siteHeader .toggle-category:has(#segFashion.active)::before { transform: translateX(22px); }
        /* labels kept in the markup for state/a11y, but not shown */
        #siteHeader .toggle-category .seg {
            position: absolute; width: 1px; height: 1px; overflow: hidden;
            clip: rect(0 0 0 0); white-space: nowrap;
        }
        #siteHeader .toggle-category:hover { border-color: rgba(0, 0, 0, 0.45); }
        #siteHeader .icon-btn {
            background: none; border: none; cursor: pointer; font-size: 26.67px;
            transition: transform 0.2s; color: #111; width: 46px; height: 46px;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        #siteHeader .icon-btn svg { width: 25px; height: 25px; stroke: #111 !important; fill: none; }
        /* Cart & wishlist read a touch larger than the rest of the icon row. */
        #siteHeader [data-icon="cart"] .icon-btn svg,
        #siteHeader [data-icon="wishlist"] .icon-btn svg { width: 31px; height: 31px; }
        #siteHeader .icon-btn svg[data-fill] { fill: #111 !important; stroke: none; }
        #siteHeader .icon-btn:hover { transform: scale(1.1); opacity: 0.65; }
        /* Account cluster: personal-area profile picture + a switch-profile button. */
        #siteHeader .hdr-account { display: inline-flex; align-items: center; gap: 2px; }
        #siteHeader .hdr-avatar-btn { width: 40px; height: 40px; }
        #siteHeader .hdr-avatar {
            width: 30px; height: 30px; border-radius: 50%; overflow: hidden;
            border: 1.5px solid currentColor; background: #e6e4df center / cover no-repeat;
            display: grid; place-items: center; font-size: 12.50px; font-weight: 500;
            color: currentColor; text-transform: uppercase; line-height: 1;
        }
        #siteHeader .hdr-avatar.has-img { border-color: rgba(0,0,0,0.15); }
        /* Seller account: a green ring around the profile picture so you can tell
           at a glance which account you're acting as. */
        #siteHeader .hdr-avatar.is-seller {
            border-color: #1DA65A !important; border-width: 2.5px;
            box-shadow: 0 0 0 2px rgba(29,166,90,0.25);
        }
        #siteHeader .hdr-switch { width: 26px; height: 26px; }
        #siteHeader .hdr-switch svg { width: 15.5px; height: 15.5px; stroke: currentColor !important; fill: none; }
        /* Profile-switch splash: a short WELCOME screen shown between areas. */
        .vero-switch-splash {
            position: fixed; inset: 0; z-index: 99999; background: #fff; color: #111;
            display: grid; place-items: center; opacity: 0; transition: opacity 0.25s ease;
        }
        .vero-switch-splash.show { opacity: 1; }
        .vero-switch-splash .vss-inner {
            text-align: center; transform: translateY(12px); opacity: 0;
            transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease;
        }
        .vero-switch-splash.show .vss-inner { transform: translateY(0); opacity: 1; }
        .vero-switch-splash .vss-welcome {
            font-size: 21.67px; letter-spacing: 12px; text-transform: uppercase;
            color: rgba(0,0,0,0.5); margin-bottom: 28px;
        }
        .vero-switch-splash .vss-name {
            font-size: clamp(76px, 14vw, 152px); font-weight: 200; letter-spacing: 1px; line-height: 1;
        }
        .vero-switch-splash .vss-caption {
            margin-top: 20px; font-size: 12.50px; font-weight: 300; letter-spacing: 0.4px;
            color: rgba(255,255,255,0.85);
        }
        #siteHeader .upload-plus {
            color: #111 !important; border: 2px solid #111 !important;
            border-radius: 50%; width: 31px; height: 31px;
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
                justify-self: end; justify-content: flex-end; gap: 22px;
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

        /* Slide-in side drawer */
        .vero-drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.45);
            opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease;
            z-index: 200;
        }
        .vero-drawer-overlay.open { opacity: 1; visibility: visible; }
        .vero-drawer {
            position: fixed; top: 0; left: 0; height: 100%; width: 440px; max-width: 90vw;
            background: #000000; z-index: 201; transform: translateX(-100%);
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
            font-family: 'Playfair Display', Georgia, serif; font-size: 21.67px;
            font-weight: 700; letter-spacing: 5px; text-transform: uppercase; color: #fff;
        }
        .vero-drawer-head .vero-drawer-logo .vero-drawer-logo-img {
            height: 34px; width: auto; display: block;
            /* Same white-on-transparent logo art as the header. difference blend makes
               it render as the inverse of the background — white on the dark drawer. */
            filter: none; mix-blend-mode: difference;
        }
        .vero-drawer-close {
            background: none; border: none; cursor: pointer; font-size: 23.33px;
            line-height: 1; color: #fff; padding: 0; width: 32px; height: 32px;
        }
        .vero-drawer-close:hover { opacity: 0.6; }
        .vero-drawer-nav { display: flex; flex-direction: column; gap: 4px; }
        .vero-drawer-nav a {
            font-size: 15.83px; font-weight: 600; letter-spacing: 0.5px; color: #fff;
            text-decoration: none; padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.14);
            transition: color 0.2s ease, padding-left 0.2s ease;
        }
        .vero-drawer-nav a:hover { color: rgba(255,255,255,0.6); padding-left: 6px; }
        .vero-drawer-nav .vero-drawer-heading {
            font-size: 9.17px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase;
            color: rgba(255,255,255,0.4); padding: 22px 0 4px; margin-top: 6px;
        }
        .vero-drawer-social {
            margin-top: auto; padding-top: 28px;
            display: flex; align-items: center; gap: 20px;
        }
        .vero-drawer-social a { color: rgba(255,255,255,0.6); display: inline-flex; transition: color 0.2s ease; }
        .vero-drawer-social a:hover { color: #fff; }
        .vero-drawer-social svg { width: 21px; height: 21px; }

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
           Keep only the logo, the + (upload), the profile picture and the switch
           icon. Hide the menu, search, category toggle and cart. */
        #siteHeader.acct-seller [data-icon="search"],
        #siteHeader.acct-seller [data-icon="cart"],
        #siteHeader.acct-seller .hdr-searchwrap {
            display: none !important;
        }
        /* Seller account cluster moved to the left keeps a comfortable gap. */
        #siteHeader.acct-seller .header-left { gap: 22px; }
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
        #siteHeader .header-right { justify-self: end; justify-content: flex-end; gap: 22px; }
        @media (max-width: 768px) {
            #siteHeader .header-container { grid-template-columns: auto 1fr auto; padding: 0 16px; gap: 12px; }
            #siteHeader .header-left { gap: 16px; }
            #siteHeader .hdr-textbtn-label { display: none; }
            #siteHeader .header-right { gap: 14px; }
        }

        /* ================= SEARCH PAGE (opens on the header Search button) =================
           Full-screen white page that slides down from the top: logo, a wide open search
           field, then the filter chosen in fade-in stages (gender → type → size →
           material/price/colour), each stacked under the last. */
        .vsp-overlay {
            position: fixed; inset: 0; z-index: 300;
            background: #fff;
            transform: translateY(-100%);
            transition: transform 0.55s cubic-bezier(0.65, 0.05, 0.1, 1);
            overflow-y: auto;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            visibility: hidden;
        }
        .vsp-overlay.open { transform: translateY(0); visibility: visible; }
        .vsp-close {
            position: absolute; top: 22px; right: 28px;
            background: none; border: none; cursor: pointer;
            font-size: 28.33px; line-height: 1; color: #111; padding: 0;
            width: 40px; height: 40px; transition: opacity 0.2s;
        }
        .vsp-close:hover { opacity: 0.55; }
        .vsp-inner {
            max-width: 1680px; width: 100%; margin: 0 auto;
            padding: 56px clamp(30px, 6vw, 96px) 110px;
            display: flex; flex-direction: column; align-items: center;
        }
        .vsp-logo img { height: 46px; width: auto; display: block; filter: brightness(0); }
        .vsp-logo .vsp-logo-txt {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 28.33px; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; color: #111;
        }
        /* Two half-width search pills, side by side: products | sellers. */
        .vsp-searchbar {
            margin-top: 48px; width: 100%;
            display: flex; align-items: stretch; gap: 22px;
        }
        .vsp-searchfield {
            flex: 1 1 50%; min-width: 0;
            display: flex; align-items: center; gap: 14px;
            border: 1.5px solid #111; border-radius: 999px;
            height: 74px; padding: 0 32px; box-sizing: border-box;
        }
        @media (max-width: 620px) { .vsp-searchbar { flex-direction: column; } }
        .vsp-searchfield {
            transition: flex-grow 0.4s ease, opacity 0.3s ease, padding 0.35s ease, border-width 0.35s ease, margin 0.35s ease;
            overflow: hidden;
        }
        /* Focusing one field expands it to full width and collapses the other. */
        .vsp-searchbar.mode-product #vspFieldSeller,
        .vsp-searchbar.mode-seller #vspFieldProduct {
            flex: 0 0 0 !important; opacity: 0; padding: 0; margin: 0; border-width: 0; pointer-events: none;
        }
        .vsp-searchbar.mode-product #vspFieldProduct,
        .vsp-searchbar.mode-seller #vspFieldSeller { flex: 1 1 100%; }
        .vsp-searchfield input {
            flex: 1; min-width: 0; border: none; outline: none; background: none;
            font-family: inherit; font-size: 15.00px; font-weight: 500; color: #111;
        }
        .vsp-searchfield input::placeholder { color: #9a9a9a; letter-spacing: 0.4px; }
        .vsp-searchfield button {
            background: none; border: none; cursor: pointer; padding: 4px;
            display: flex; align-items: center; justify-content: center;
        }
        .vsp-searchfield button svg { width: 20px; height: 20px; stroke: #111; fill: none; stroke-width: 1.8; }
        .vsp-searchfield button:hover { opacity: 0.6; }

        /* The filter split into two halves of the page. Fades out once the buyer
           starts typing a search. */
        .vsp-cols {
            width: 100%; margin-top: 30px;
            display: none; grid-template-columns: 1fr 1fr; gap: 44px 96px;
            align-items: start;
            transition: opacity 0.4s ease, transform 0.4s ease;
        }
        /* Once results are showing, the filter + recommendations give way to them. */
        #veroSearchPage.searching .vsp-cols,
        #veroSearchPage.searching .vsp-alt-filter,
        #veroSearchPage.searching .vsp-seller-suggest { display: none !important; }

        /* ===== Alternate filters (seller-style / art-category) =====
           The fashion product wizard (.vsp-cols) is the default. It gives way to a
           single chip row for the three other cases: fashion seller, art product,
           art seller. Visibility is driven by the site mode on <body data-mode> and
           the focused field's mode-* class on the page. */
        .vsp-alt-filter {
            width: 100%; margin-top: 22px; display: none; flex-direction: column; gap: 20px;
        }
        /* Filters stay closed until a search row is chosen (focused). Focusing the
           product field opens the product wizard; focusing the seller field opens the
           seller filters + recommended sellers. Blurring an empty field closes them. */
        #veroSearchPage.mode-product .vsp-alt-filter,
        #veroSearchPage.mode-seller .vsp-alt-filter { animation: vspFadeUp 0.5s ease both; }
        /* Fashion + product field → the full product wizard. */
        body:not([data-mode="art"]) #veroSearchPage.mode-product .vsp-cols { display: grid; }
        /* Fashion + seller field → style chips. */
        body:not([data-mode="art"]) #veroSearchPage.mode-seller .vsp-seller-styles { display: flex; }
        /* Art mode (either field, once chosen) → art-category chips. */
        body[data-mode="art"] #veroSearchPage.mode-product .vsp-art-cats,
        body[data-mode="art"] #veroSearchPage.mode-seller .vsp-art-cats { display: flex; }

        /* Three recommended sellers, stacked one above the other under the seller
           field: name + rating on the left, circular avatar on the right. */
        .vsp-seller-suggest {
            width: 100%; margin: 30px 0 0;
            display: none; flex-direction: column; align-items: stretch; gap: 16px;
        }
        /* Shown only once the seller row is chosen. */
        #veroSearchPage.mode-seller .vsp-seller-suggest { display: flex; animation: vspFadeUp 0.5s ease 0.05s both; }
        .vsp-suggest-label {
            font-size: 9.17px; letter-spacing: 1.5px; text-transform: uppercase; color: #9a9a9a;
        }
        .vsp-suggest-chips { display: flex; flex-direction: row; gap: 16px; }
        @media (max-width: 720px) { .vsp-suggest-chips { flex-direction: column; } }
        /* Each recommendation: text (name + stars) left, avatar right. */
        .vsp-suggest-card {
            display: flex; flex-direction: row; align-items: center; justify-content: space-between;
            gap: 18px; flex: 1 1 0; min-width: 0; text-align: left;
            border: none; border-radius: 16px; background: none; color: #111;
            cursor: pointer; font-family: inherit; padding: 10px 8px;
            transition: background 0.2s, color 0.2s;
            animation: vspFadeUp 0.5s ease 0.05s both;
        }
        .vsp-suggest-card:hover .vsp-suggest-name { text-decoration: underline; }
        .vsp-suggest-card:hover .vsp-suggest-ava { transform: scale(1.06); }
        /* RTL page: the lower order sits at the main-start (the right), so the avatar
           (order 1) is on the right and the name + rating (order 2) on the left. */
        .vsp-suggest-info { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-width: 0; order: 2; }
        .vsp-suggest-ava {
            width: 76px; height: 76px; flex: 0 0 auto; order: 1;
            border-radius: 50%; border: 1px solid currentColor;
            display: grid; place-items: center; font-size: 25.00px; text-transform: uppercase;
            font-weight: 300; background: #f4f4f2; transition: transform 0.2s;
        }
        .vsp-suggest-name { font-size: 16.67px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vsp-suggest-card:hover .vero-stars-base { color: rgba(255,255,255,0.35); }
        .vsp-suggest-card:hover .vero-stars-fill { color: #fff; }

        /* ===== Landing chooser — two rectangles like the personal area ===== */
        .vsp-chooser {
            width: 100%; margin-top: 40px; display: flex; height: 58vh; min-height: 320px;
        }
        .vsp-choice {
            flex: 1; min-width: 0; position: relative; overflow: hidden; cursor: pointer;
            border: 1px solid #111; background: #fff; color: #111; font-family: inherit;
            text-align: left; transition: background 0.4s ease, color 0.4s ease;
            animation: vspFadeUp 0.5s ease both;
        }
        .vsp-choice + .vsp-choice { margin-left: -1px; }
        .vsp-choice:hover { background: #111; color: #fff; }
        .vsp-choice-title {
            position: absolute; top: 34px; left: 30px; right: 30px;
            font-size: clamp(28px, 3vw, 52px); font-weight: 300; letter-spacing: 0.5px;
        }
        .vsp-choice-sub {
            position: absolute; top: 92px; left: 30px; right: 30px;
            font-size: 10.83px; font-weight: 500; letter-spacing: 0.3px; color: #6b6b66;
            transition: color 0.3s;
        }
        .vsp-choice:hover .vsp-choice-sub { color: rgba(255,255,255,0.75); }
        .vsp-choice-word {
            position: absolute; left: -3px; bottom: -16px;
            font-size: clamp(46px, 7vw, 120px); font-weight: 300; letter-spacing: 2px;
            text-transform: uppercase; line-height: 0.9; white-space: nowrap;
            color: #efefec; pointer-events: none; transition: color 0.3s;
        }
        .vsp-choice:hover .vsp-choice-word { color: rgba(255,255,255,0.12); }

        /* The landing chooser is retired — both search rows show side by side from the
           start, so the chooser and its "back" control are always hidden. */
        .vsp-chooser { display: none !important; }
        .vsp-panel { width: 100%; display: flex; flex-direction: column; align-items: center; }
        #veroSearchPage.chosen .vsp-panel { animation: vspFadeUp 0.45s ease both; }
        .vsp-panel-back { display: none !important; }
        /* Under the two search rows: the filter comes first, then (seller mode) the
           recommended sellers, then the results take the filter's place on search. */
        .vsp-searchbar { order: 0; }
        .vsp-cols { order: 1; }
        .vsp-alt-filter { order: 1; }
        .vsp-seller-suggest { order: 2; }
        .vsp-results-wrap { order: 3; }

        .vsp-col { display: flex; flex-direction: column; gap: 52px; min-width: 0; }
        @media (max-width: 760px) { .vsp-cols { grid-template-columns: 1fr; } }
        .vsp-step {
            opacity: 0; transform: translateY(16px);
            transition: opacity 0.5s ease, transform 0.5s ease;
            pointer-events: none;
        }
        .vsp-step.show { opacity: 1; transform: none; pointer-events: auto; }
        .vsp-step-label {
            font-size: 11.67px; letter-spacing: 2.5px; text-transform: uppercase;
            color: #111; font-weight: 800; margin-bottom: 20px; text-align: center;
        }
        .vsp-chips { display: flex; flex-wrap: wrap; gap: 14px 16px; justify-content: center; }
        .vsp-chip {
            border: 1px solid #111; background: #fff; color: #111;
            border-radius: 10px; padding: 12px 22px; cursor: pointer;
            font-family: inherit; font-size: 12.50px; font-weight: 500; letter-spacing: 0.2px;
            transition: background 0.2s, color 0.2s, transform 0.15s;
        }
        .vsp-chip:hover { transform: translateY(-1px); }
        .vsp-chip.active { background: #111; color: #fff; border-color: #111; font-weight: 700; }

        /* Final stage: material / price / colour, still stacked. */
        .vsp-final { display: flex; flex-direction: column; gap: 34px; }
        .vsp-price-out { font-weight: 800; color: #d40000; font-size: 12.50px; }
        /* Emphasised, accessible price slider — a thick red track and a large red
           thumb with a white ring, so the control reads clearly. */
        .vsp-range {
            width: 100%; -webkit-appearance: none; appearance: none;
            height: 8px; border-radius: 999px; cursor: pointer; margin-top: 16px;
            background: #f0c9c9; accent-color: #d40000;
        }
        .vsp-range:focus-visible { outline: 3px solid rgba(212,0,0,0.35); outline-offset: 4px; }
        .vsp-range::-webkit-slider-thumb {
            -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%;
            background: #d40000; border: 3px solid #fff; cursor: pointer;
            box-shadow: 0 2px 8px rgba(212,0,0,0.5);
        }
        .vsp-range::-moz-range-thumb {
            width: 26px; height: 26px; border-radius: 50%;
            background: #d40000; border: 3px solid #fff; cursor: pointer;
            box-shadow: 0 2px 8px rgba(212,0,0,0.5);
        }
        .vsp-range::-moz-range-track { height: 8px; border-radius: 999px; background: #f0c9c9; }

        /* Results, below the search — hidden until Enter, then fade/rise in. */
        .vsp-results-wrap {
            width: 100%; margin-top: 40px; display: none; flex-direction: column; align-items: center;
            opacity: 0; transform: translateY(34px); pointer-events: none;
            transition: opacity 0.5s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .vsp-results-wrap.revealed { display: flex; opacity: 1; transform: none; pointer-events: auto; }

        /* Seller result cards — two per row, content on the LEFT, image on the RIGHT. */
        .vsp-sellers { width: 100%; grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 620px) { .vsp-sellers { grid-template-columns: 1fr; } }
        .vsp-seller-card {
            display: flex; align-items: center; gap: 16px; padding: 14px 12px;
            border: none; border-radius: 14px; text-decoration: none; color: #111;
            transition: background 0.2s, color 0.2s;
            animation: vspFadeUp 0.5s ease both;
        }
        @keyframes vspFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .vsp-seller-card:hover .vsp-seller-name { text-decoration: underline; }
        .vsp-seller-card:hover .vsp-seller-ava { transform: scale(1.04); }
        .vsp-seller-ava {
            width: 66px; height: 66px; flex: 0 0 auto; border-radius: 50%; border: 1px solid currentColor;
            display: grid; place-items: center; font-size: 21.67px; text-transform: uppercase; background: #f4f4f2;
            transition: transform 0.2s;
        }
        .vsp-seller-meta { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; text-align: left; }
        .vsp-seller-name { font-size: 15.83px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vsp-seller-rating { font-size: 10.83px; opacity: 0.72; letter-spacing: 0.5px; }
        .vsp-seller-tags { font-size: 10.83px; opacity: 0.6; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* Bigger stars in the search overlay for legibility. */
        .vsp-seller-card .vero-stars, .vsp-suggest-card .vero-stars { font-size: 15.00px; }

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
        /* On dark hover cards the outline stays visible, the fill turns white. */
        .vsp-seller-card:hover .vero-stars-base { color: rgba(255,255,255,0.35); }
        .vsp-seller-card:hover .vero-stars-fill { color: #fff; }
        .vsp-seller-card:hover .vero-stars-num,
        .vsp-suggest-card:hover .vero-stars-num { color: rgba(255,255,255,0.75); }
        .vsp-results-head {
            font-size: 10.83px; letter-spacing: 2.5px; text-transform: uppercase;
            color: #111; font-weight: 800; margin-bottom: 24px;
        }
        .vsp-results {
            width: 100%;
            display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 22px;
        }
        .vsp-results .product-card { width: 100%; margin: 0; }
        .vsp-results-empty { color: #9a9a9a; font-size: 11.67px; letter-spacing: 1px; padding: 30px 0; text-align: center; }
        .vsp-apply {
            align-self: center; margin-top: 8px;
            background: #111; color: #fff; border: 1.5px solid #111;
            border-radius: 999px; padding: 15px 46px; cursor: pointer;
            font-family: inherit; font-size: 10.83px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
            transition: background 0.2s, color 0.2s;
        }
        .vsp-apply:hover { background: #fff; color: #111; }
        @media (max-width: 600px) {
            .vsp-inner { padding: 48px 18px 80px; }
            .vsp-searchbar { height: 52px; }
        }
`;

    // ---- Markup (identical everywhere) ----
    const MARKUP = `
        <div class="header-container">
            <div class="header-left">
                <a class="hdr-textbtn" onclick="veroToggleDrawer()" aria-label="Menu" role="button" tabindex="0" data-icon="menu">
                    <span class="vero-hamburger"><span></span><span></span><span></span></span>
                    <span class="hdr-textbtn-label">Menu</span>
                </a>
                <a class="hdr-textbtn" onclick="veroOpenSearchPage()" aria-label="Search" role="button" tabindex="0" data-icon="search">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span class="hdr-textbtn-label">Search</span>
                </a>
            </div>
            <div class="logo" onclick="showMain()" style="cursor:pointer"><img src="vero-logo.png?v=5" alt="VERO" class="logo-img" onerror="this.replaceWith(document.createTextNode('VERO'))"></div>
            <div class="header-right">
                <span class="hdr-cart" data-icon="cart">
                    <a class="icon-btn icon-wrap" href="cart-store.html" title="Cart" aria-label="Cart">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span class="badge" id="cartBadge"></span>
                    </a>
                </span>
                <span class="hdr-mode-pair" data-icon="mode">
                    <div class="toggle-category" id="categoryToggleBtn" onclick="toggleSwitch()">
                        <span class="seg active" id="segArt">Art</span>
                        <span class="seg" id="segFashion">Fashion</span>
                    </div>
                </span>
                <span class="hdr-account" data-icon="account">
                    <!-- Personal-area account: the profile picture from vero_profile,
                         shown by default. Clicking it opens the personal area. -->
                    <button class="icon-btn hdr-avatar-btn" title="My Account" onclick="veroOpenArea()">
                        <span class="hdr-avatar" id="hdrAvatar">V</span>
                    </button>
                    <!-- Switch profile: jump to the separate Seller Area (business) account. -->
                    <button class="icon-btn hdr-switch" title="Switch account" onclick="veroSwitchAccount()">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>
                        </svg>
                    </button>
                </span>
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
                <span class="vero-drawer-logo"><img src="vero-logo.png?v=5" alt="VERO" class="vero-drawer-logo-img" onerror="this.replaceWith(document.createTextNode('VERO'))"></span>
                <button class="vero-drawer-close" aria-label="Close menu" onclick="veroCloseDrawer()">&times;</button>
            </div>
            <nav class="vero-drawer-nav">
                <a onclick="veroCloseDrawer(); showMain()">Home</a>
                <a onclick="veroCloseDrawer(); veroGoSegment('men')">Men</a>
                <a onclick="veroCloseDrawer(); veroGoSegment('women')">Women</a>
                <a onclick="veroCloseDrawer(); veroGoSegment('kids')">Kids</a>
                <a href="about.html">About Us</a>
                <a onclick="veroCloseDrawer(); openMagazine()">The Closet Magazine</a>
                <span class="vero-drawer-heading" id="veroAreaHeading">Personal Area</span>
                <a id="veroAreaLink" onclick="veroCloseDrawer(); veroGoAccount('buyer','profile.html')">My Profile</a>
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
        veroRefreshAreaLink();
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

    // ================= SEARCH PAGE (staged, fade-in filters) =================
    // Category data for the staged filter. Product types depend on the chosen
    // gender; sizes / materials / colours are shared.
    // Product categories per department, following Depop's taxonomy for richer,
    // more precise filtering.
    const VSP_TYPES = {
        Men:    ['Tops', 'T-Shirts', 'Shirts', 'Hoodies & Sweatshirts', 'Jumpers & Knitwear', 'Jeans', 'Trousers', 'Shorts', 'Coats & Jackets', 'Suits & Blazers', 'Activewear', 'Shoes', 'Bags', 'Hats', 'Accessories'],
        Women:  ['Tops', 'T-Shirts', 'Dresses', 'Skirts', 'Jeans', 'Trousers & Leggings', 'Shorts', 'Playsuits & Jumpsuits', 'Jumpers & Knitwear', 'Hoodies & Sweatshirts', 'Coats & Jackets', 'Blazers', 'Activewear', 'Swimwear', 'Lingerie & Nightwear', 'Shoes', 'Bags & Purses', 'Jewellery', 'Accessories'],
        Kids:   ['Tops', 'T-Shirts', 'Dresses', 'Jeans', 'Trousers', 'Shorts', 'Jumpers & Knitwear', 'Coats & Jackets', 'Shoes', 'Accessories'],
        Unisex: ['Tops', 'T-Shirts', 'Hoodies & Sweatshirts', 'Jumpers & Knitwear', 'Jeans', 'Trousers', 'Shorts', 'Coats & Jackets', 'Shoes', 'Bags', 'Hats', 'Accessories']
    };
    const VSP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    // Depop's condition ladder.
    const VSP_CONDITIONS = ['Brand new', 'Like new', 'Used – excellent', 'Used – good', 'Used – fair'];
    // Depop's style / aesthetic tags.
    const VSP_STYLES = ['Y2K', 'Vintage', 'Streetwear', 'Grunge', 'Minimalist', 'Boho', 'Preppy', 'Cottagecore', 'Sportswear', 'Gorpcore', 'Retro', 'Punk', 'Skater', 'Techwear', 'Coastal', 'Formalwear', 'Utility', 'Avant-garde', 'Athleisure', 'Workwear'];
    const VSP_MATERIALS = ['Cotton', 'Wool', 'Silk', 'Leather', 'Denim', 'Linen', 'Cashmere', 'Polyester'];
    const VSP_COLORS = ['Black', 'White', 'Beige', 'Grey', 'Blue', 'Green', 'Red', 'Brown', 'Pink'];
    const VSP_PRICE_MAX = 3000;

    // Art-mode categories — mirror the art catalogue in index.html so the search
    // filters art pieces (and art sellers) by medium, the way fashion filters by style.
    const VSP_ART_CATEGORIES = ['Acrylic', 'Oil', 'Watercolor', 'Mixed Media', 'Digital', 'Gouache', 'Pastel', 'Epoxy', 'Stone Sculpture', 'Metal Sculpture', 'Ceramics', 'Prints', 'Abstract', 'Art Deco'];
    // Standing art storefronts, so seller search in art mode always has results.
    const VSP_ART_SELLERS = ['Modern Art', 'Classical Art', 'Mixed Media', 'Digital Arts', 'Gouache Gallery', 'Pastel Works', 'Resin Studio', 'Stone & Chisel', 'Bronze Forge', 'Ceramic House', 'Print Lab', 'Gallery Nine', 'Art House', 'Frame & Co.'];

    let vspState = { query: '', gender: '', type: '', size: '', style: '', condition: '', material: '', color: '', maxPrice: VSP_PRICE_MAX, sellerStyle: '', artCat: '' };

    // Each seller carries a small, stable set of aesthetic styles (same VSP_STYLES
    // tags the product search uses), derived deterministically from the name so the
    // seller-search style filter is consistent across searches.
    function vspSellerStyles(name) {
        let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        const out = [];
        const n = 3 + (h % 2);                     // 3–4 styles per seller (keeps the larger list covered)
        for (let i = 0; i < n; i++) {
            const s = VSP_STYLES[(h >>> (i * 3)) % VSP_STYLES.length];
            if (!out.includes(s)) out.push(s);
        }
        return out;
    }

    // Same idea for art sellers: a stable set of art mediums per storefront, so the
    // art-category filter narrows sellers just like the style filter does in fashion.
    // The pool and the category list are the same length, so anchoring each seller's
    // primary medium to its index guarantees every category has at least one seller.
    function vspSellerArtCats(name) {
        let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        const out = [];
        const idx = VSP_ART_SELLERS.indexOf(name);
        if (idx >= 0) out.push(VSP_ART_CATEGORIES[idx % VSP_ART_CATEGORIES.length]);
        const extra = 1 + (h % 2);                 // 1–2 further mediums for variety
        for (let i = 0; i < extra; i++) {
            const c = VSP_ART_CATEGORIES[(h >>> (i * 4)) % VSP_ART_CATEGORIES.length];
            if (!out.includes(c)) out.push(c);
        }
        return out;
    }

    // Deterministic 4.0–5.0 rating per seller, stable across searches and reused by
    // both the seller result cards and the quick suggestions.
    function vspSellerRating(s) {
        let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return (4 + (h % 10) / 10).toFixed(1);
    }

    // Deterministic profile-picture avatar for a seller (no photo on file): a stable
    // two-tone gradient keyed off the name, so every seller shows a distinct "photo".
    function vspAvatarStyle(name) {
        let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        const hue = h % 360, hue2 = (hue + 42) % 360;
        return `background:linear-gradient(135deg,hsl(${hue} 58% 56%),hsl(${hue2} 62% 40%));color:#fff;border-color:transparent;`;
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

    function chip(group, value, active) {
        return `<button class="vsp-chip${active ? ' active' : ''}" onclick="vspPick('${group}', this)" data-value="${value}">${value}</button>`;
    }

    const SEARCH_MARKUP = `
        <div class="vsp-overlay" id="veroSearchPage" aria-hidden="true" role="dialog" aria-label="Search">
            <button class="vsp-close" aria-label="Close search" onclick="veroCloseSearchPage()">&times;</button>
            <div class="vsp-inner">
                <div class="vsp-logo"><img src="vero-logo.png?v=5" alt="VERO" class="vsp-logo-img" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vsp-logo-txt',textContent:'VERO'}))"></div>
                <!-- Landing chooser: two rectangles like the personal area. Clicking one
                     opens that search (bar + filters) in the panel below. -->
                <div class="vsp-chooser" id="vspChooser">
                    <button class="vsp-choice" type="button" onclick="vspChoose('product')">
                        <span class="vsp-choice-title">Products</span>
                        <span class="vsp-choice-sub">Search the marketplace by style, size and price.</span>
                        <span class="vsp-choice-word">SHOP</span>
                    </button>
                    <button class="vsp-choice" type="button" onclick="vspChoose('seller')">
                        <span class="vsp-choice-title">Sellers</span>
                        <span class="vsp-choice-sub">Find a storefront by name or category.</span>
                        <span class="vsp-choice-word">STORES</span>
                    </button>
                </div>
                <!-- The active search panel — hidden until a rectangle is chosen. -->
                <div class="vsp-panel">
                <button class="vsp-panel-back" type="button" onclick="vspBackToChooser()">&#8592; All search</button>
                <!-- Two half-width fields; the chosen mode shows just its own field.
                     Enter in either slides the matching results up from the bottom. -->
                <div class="vsp-searchbar">
                    <div class="vsp-searchfield" id="vspFieldProduct">
                        <input id="vspInput" type="text" placeholder="Search for a product" autocomplete="off"
                               onfocus="vspFocusField('product')" onblur="vspBlurField('product')"
                               oninput="vspState_query(this.value)" onkeydown="if(event.key==='Enter')vspSearchProducts()">
                        <button aria-label="Search products" onclick="vspSearchProducts()">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="vsp-searchfield" id="vspFieldSeller">
                        <input id="vspSellerInput" type="text" placeholder="Search sellers" autocomplete="off"
                               onfocus="vspFocusField('seller')" onblur="vspBlurField('seller')"
                               oninput="vspSellerLive()" onkeydown="if(event.key==='Enter')vspSearchSellers()">
                        <button aria-label="Search sellers" onclick="vspSearchSellers()">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="vsp-cols">
                    <!-- Left half of the page: the sequential choices. -->
                    <div class="vsp-col">
                        <div class="vsp-step show" data-step="gender">
                            <div class="vsp-step-label">Who are you shopping for?</div>
                            <div class="vsp-chips">
                                ${['Men', 'Women', 'Kids', 'Unisex'].map(g => chip('gender', g)).join('')}
                            </div>
                        </div>
                        <div class="vsp-step" data-step="type">
                            <div class="vsp-step-label">Product type</div>
                            <div class="vsp-chips" id="vspTypeChips"></div>
                        </div>
                        <div class="vsp-step" data-step="size">
                            <div class="vsp-step-label">Size</div>
                            <div class="vsp-chips">${VSP_SIZES.map(s => chip('size', s)).join('')}</div>
                        </div>
                    </div>
                    <!-- Right half of the page: the attribute filters. -->
                    <div class="vsp-col">
                        <div class="vsp-step" data-step="final">
                            <div class="vsp-final">
                                <div>
                                    <div class="vsp-step-label">Style</div>
                                    <div class="vsp-chips">${VSP_STYLES.map(s => chip('style', s)).join('')}</div>
                                </div>
                                <div>
                                    <div class="vsp-step-label">Condition</div>
                                    <div class="vsp-chips">${VSP_CONDITIONS.map(c => chip('condition', c)).join('')}</div>
                                </div>
                                <div>
                                    <div class="vsp-step-label">Material</div>
                                    <div class="vsp-chips">${VSP_MATERIALS.map(m => chip('material', m)).join('')}</div>
                                </div>
                                <div>
                                    <div class="vsp-step-label">Price — up to <span class="vsp-price-out" id="vspPriceOut">₪${VSP_PRICE_MAX}</span></div>
                                    <input class="vsp-range" type="range" min="0" max="${VSP_PRICE_MAX}" value="${VSP_PRICE_MAX}" oninput="vspPrice(this.value)" aria-label="Maximum price">
                                </div>
                                <div>
                                    <div class="vsp-step-label">Colour</div>
                                    <div class="vsp-chips">${VSP_COLORS.map(c => chip('color', c)).join('')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Fashion seller search → filter sellers by style. -->
                <div class="vsp-alt-filter vsp-seller-styles">
                    <div class="vsp-step-label">Style</div>
                    <div class="vsp-chips">${VSP_STYLES.map(s => chip('sellerStyle', s)).join('')}</div>
                </div>
                <!-- Art mode (products or sellers) → filter by art category. -->
                <div class="vsp-alt-filter vsp-art-cats">
                    <div class="vsp-step-label">Art category</div>
                    <div class="vsp-chips">${VSP_ART_CATEGORIES.map(c => chip('artCat', c)).join('')}</div>
                </div>
                <!-- Seller mode: three quick seller suggestions, below the categories.
                     Filled by vspFillSellerSuggestions() to match the active site mode. -->
                <div class="vsp-seller-suggest" id="vspSellerSuggest">
                    <span class="vsp-suggest-label">Recommended sellers</span>
                    <div class="vsp-suggest-chips" id="vspSuggestChips"></div>
                </div>
                <!-- Results, below the filter, updated live as choices are made. -->
                <div class="vsp-results-wrap">
                    <div class="vsp-results-head" id="vspResultsHead">Matching pieces</div>
                    <div class="vsp-results" id="vspResults"></div>
                    <button class="vsp-apply" onclick="vspApply()">Show all results</button>
                </div>
                </div>
            </div>
        </div>`;

    function mountSearchPage() {
        if (document.getElementById('veroSearchPage')) return;
        const wrap = document.createElement('div');
        wrap.id = 'veroSearchPageRoot';
        wrap.innerHTML = SEARCH_MARKUP;
        document.body.appendChild(wrap);
    }

    // The stages, in order. material + colour + price all live in the 'final' stage.
    const VSP_STAGES = ['gender', 'type', 'size', 'final'];
    function vspStageOf(group) { return (group === 'material' || group === 'color') ? 'final' : group; }

    // Reveal a stage with its fade-in.
    function vspReveal(step) {
        const el = document.querySelector(`#veroSearchPage .vsp-step[data-step="${step}"]`);
        if (el) el.classList.add('show');
    }
    function vspStepEl(step) { return document.querySelector(`#veroSearchPage .vsp-step[data-step="${step}"]`); }

    // Everything below the given group is now invalid — hide those stages and wipe
    // their selections, so changing an early choice cascades cleanly down.
    function vspCollapseAfter(group) {
        const start = VSP_STAGES.indexOf(vspStageOf(group)) + 1;
        for (let i = start; i < VSP_STAGES.length; i++) {
            const el = vspStepEl(VSP_STAGES[i]);
            if (!el) continue;
            el.classList.remove('show');
            el.querySelectorAll('.vsp-chip.active').forEach(c => c.classList.remove('active'));
        }
        const after = {
            gender:   ['type', 'size', 'style', 'condition', 'material', 'color', 'price'],
            type:     ['size', 'style', 'condition', 'material', 'color', 'price'],
            size:     ['style', 'condition', 'material', 'color', 'price'],
            // Terminal groups (all inside the 'final' stage) open nothing further.
            style: [], condition: [], material: [], color: []
        };
        (after[group] || []).forEach(g => {
            if (g === 'price') {
                vspState.maxPrice = VSP_PRICE_MAX;
                const out = document.getElementById('vspPriceOut');
                const rng = document.querySelector('#veroSearchPage .vsp-range');
                if (out) out.textContent = '₪' + VSP_PRICE_MAX;
                if (rng) rng.value = VSP_PRICE_MAX;
            } else { vspState[g] = ''; }
        });
    }

    // Clicking a field expands it and collapses the other.
    window.vspFocusField = function (which) {
        const bar = document.querySelector('#veroSearchPage .vsp-searchbar');
        if (!bar) return;
        bar.classList.remove('mode-product', 'mode-seller');
        bar.classList.add(which === 'seller' ? 'mode-seller' : 'mode-product');
        // Mirror the field mode on the page so the alt-filter CSS (a sibling of the
        // search bar) can react to which field is active.
        const page = document.getElementById('veroSearchPage');
        if (page) {
            page.classList.remove('mode-product', 'mode-seller');
            page.classList.add(which === 'seller' ? 'mode-seller' : 'mode-product');
        }
        if (which === 'seller') vspFillSellerSuggestions();
    };
    // When a field is left empty and neither field is focused, restore both.
    window.vspBlurField = function () {
        setTimeout(() => {
            const bar = document.querySelector('#veroSearchPage .vsp-searchbar');
            if (!bar) return;
            // While a search rectangle is chosen, the mode is fixed — never collapse it.
            const pg = document.getElementById('veroSearchPage');
            if (pg && pg.classList.contains('chosen')) return;
            const p = document.getElementById('vspInput');
            const s = document.getElementById('vspSellerInput');
            const active = document.activeElement;
            if (active === p || active === s) return;             // focus moved to the other field
            if ((p && p.value.trim()) || (s && s.value.trim())) return;  // keep expanded while there's text
            // Keep the field expanded while a chip filter is in play, so clicking a
            // style / art-category chip (which blurs the input) doesn't hide the row.
            if (vspState.sellerStyle || vspState.artCat) return;
            bar.classList.remove('mode-product', 'mode-seller');
            const page = document.getElementById('veroSearchPage');
            if (page) page.classList.remove('mode-product', 'mode-seller');
        }, 160);
    };

    // Fade the filter columns out as soon as either search field has text.
    window.vspMarkSearching = function () {
        const page = document.getElementById('veroSearchPage');
        if (!page) return;
        const a = (document.getElementById('vspInput')?.value || '').trim();
        const b = (document.getElementById('vspSellerInput')?.value || '').trim();
        page.classList.toggle('searching', !!(a || b));
    };
    window.vspState_query = function (v) { vspState.query = v; window.vspMarkSearching(); vspUpdateResults(); };

    // Reveal the results wrap (rise + fade in below the search bar).
    function vspRevealResults() {
        const host = document.getElementById('vspResults');
        if (!host) return;
        const wrap = host.closest('.vsp-results-wrap');
        wrap.style.display = '';
        requestAnimationFrame(() => wrap.classList.add('revealed'));
    }

    // Enter in the product field → matching pieces rise in below the bar.
    window.vspSearchProducts = function () {
        const host = document.getElementById('vspResults');
        const head = document.getElementById('vspResultsHead');
        if (!host) return;
        const q = (vspState.query || '').trim();
        let html = '';
        if (typeof window.veroSearchResults === 'function') html = window.veroSearchResults({ ...vspState });
        head.textContent = q ? `Pieces matching “${q}”` : 'Matching pieces';
        host.innerHTML = html || '<div class="vsp-results-empty">No products match your search.</div>';
        document.getElementById('veroSearchPage')?.classList.add('searching');
        vspRevealResults();
    };

    // Sellers are gathered from what the site already knows (listings, cart, offers)
    // plus a few standing storefronts, so seller search always has something to find.
    function vspGatherSellers() {
        const names = new Set();
        const add = s => { if (s) names.add(String(s).trim()); };
        const grab = (key, field) => { try { (JSON.parse(localStorage.getItem(key)) || []).forEach(x => add(x[field] || x.brand)); } catch (e) {} };
        grab('vero_listings', 'seller'); grab('vero_cart', 'seller'); grab('vero_offers', 'seller');
        ['Studio Noir', 'Studio Vero', 'Atelier Nord', 'Denim Lab', 'Sole Society', 'Milano Feet',
            'Art House', 'Designer Collection', 'Gallery Nine', 'Vintage Vault', 'Pixel Works',
            'Luxe Atelier', 'Basics Co.', 'Urban Thread', 'Horology Co.', 'Forge Studio', 'Frame & Co.'].forEach(add);
        return [...names];
    }

    // Three quick seller suggestions under the seller field — the first storefronts
    // for the active mode (art sellers in art mode, the site's sellers otherwise).
    function vspFillSellerSuggestions() {
        const host = document.getElementById('vspSuggestChips');
        if (!host) return;
        const isArt = document.body.dataset.mode === 'art';
        const pool = isArt ? VSP_ART_SELLERS : vspGatherSellers();
        const picks = pool.slice(0, 3);
        // Each recommendation: name + star rating on the left, avatar circle on the right.
        host.innerHTML = picks.map(s =>
            `<button class="vsp-suggest-card" type="button" onclick="vspPickSellerSuggest('${s.replace(/'/g, "\\'")}')">
                <span class="vsp-suggest-info">
                    <span class="vsp-suggest-name">${s}</span>
                    ${window.veroStarsHTML(vspSellerRating(s))}
                </span>
                <span class="vsp-suggest-ava" style="${vspAvatarStyle(s)}">${s[0] || '?'}</span>
            </button>`
        ).join('');
    }
    // Clicking a suggestion drops it into the seller field and runs the search.
    window.vspPickSellerSuggest = function (name) {
        const inp = document.getElementById('vspSellerInput');
        if (inp) inp.value = name;
        vspFocusField('seller');
        vspSearchSellers();
    };

    // Enter in the seller field → matching sellers rise in below the bar.
    window.vspSearchSellers = function () {
        const host = document.getElementById('vspResults');
        const head = document.getElementById('vspResultsHead');
        if (!host) return;
        const q = (document.getElementById('vspSellerInput')?.value || '').trim().toLowerCase();
        // Art mode draws from the art storefronts and filters by art category;
        // fashion mode uses the site's sellers and filters by style.
        const isArt = document.body.dataset.mode === 'art';
        const tagsOf = s => isArt ? vspSellerArtCats(s) : vspSellerStyles(s);
        let sellers = isArt ? VSP_ART_SELLERS.slice() : vspGatherSellers();
        if (q) sellers = sellers.filter(s => s.toLowerCase().includes(q));
        if (isArt && vspState.artCat)       sellers = sellers.filter(s => vspSellerArtCats(s).includes(vspState.artCat));
        if (!isArt && vspState.sellerStyle) sellers = sellers.filter(s => vspSellerStyles(s).includes(vspState.sellerStyle));
        sellers.sort((a, b) => a.localeCompare(b));
        const filterLabel = isArt ? vspState.artCat : vspState.sellerStyle;
        head.textContent = filterLabel
            ? `${isArt ? 'Art sellers' : 'Sellers'} · ${filterLabel}`
            : (q ? `Sellers matching “${q}”` : (isArt ? 'All art sellers' : 'All sellers'));
        const rate = vspSellerRating;
        host.innerHTML = sellers.length
            ? '<div class="vsp-sellers">' + sellers.map(s =>
                `<a class="vsp-seller-card" href="store-profile.html">
                    <span class="vsp-seller-ava" style="${vspAvatarStyle(s)}">${(s[0] || '?')}</span>
                    <span class="vsp-seller-meta">
                        <span class="vsp-seller-name">${s}</span>
                        <span class="vsp-seller-rating">${window.veroStarsHTML(rate(s))}</span>
                        <span class="vsp-seller-tags">${tagsOf(s).join(' · ')}</span>
                    </span>
                </a>`).join('') + '</div>'
            : '<div class="vsp-results-empty">No sellers match your search.</div>';
        document.getElementById('veroSearchPage')?.classList.add('searching');
        vspRevealResults();
    };
    window.vspPrice = function (v) {
        vspState.maxPrice = Number(v);
        const out = document.getElementById('vspPriceOut');
        if (out) out.textContent = '₪' + v;
        vspUpdateResults();
    };

    // Live results below the filter — refreshed on every change, even before the
    // buyer is done. The page supplies matches via window.veroSearchResults(state),
    // returning ready product-card HTML so the results match the feed exactly.
    function vspUpdateResults() {
        const host = document.getElementById('vspResults');
        if (!host) return;
        if (typeof window.veroSearchResults !== 'function') {
            host.closest('.vsp-results-wrap').style.display = 'none';
            return;
        }
        const html = window.veroSearchResults({ ...vspState });
        host.innerHTML = html || '<div class="vsp-results-empty">No matching pieces yet — adjust your filters</div>';
    }

    // A chip was clicked.
    //  • clicking the ACTIVE chip again deselects it and closes the stages it opened;
    //  • picking a different value cascades: everything below is reset and rebuilt.
    window.vspPick = function (group, btn) {
        const wrap = btn.parentElement;
        const value = btn.dataset.value;

        // Single-select chip filters that live outside the product wizard:
        //  • sellerStyle → narrows the seller list in fashion mode
        //  • artCat      → narrows art pieces (product field) or art sellers (seller field)
        if (group === 'sellerStyle' || group === 'artCat') {
            const wasActive = btn.classList.contains('active');
            wrap.querySelectorAll('.vsp-chip').forEach(c => c.classList.remove('active'));
            if (!wasActive) btn.classList.add('active');
            vspState[group] = wasActive ? '' : value;
            const page = document.getElementById('veroSearchPage');
            if (page && page.classList.contains('mode-seller')) vspSearchSellers();
            else vspSearchProducts();
            return;
        }

        // Toggle off — deselect and collapse the stages this choice had opened.
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            vspState[group] = '';
            vspCollapseAfter(group);
            vspUpdateResults();
            return;
        }

        // Select / change within this group.
        wrap.querySelectorAll('.vsp-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        vspState[group] = value;
        // Any earlier change invalidates every downstream stage.
        vspCollapseAfter(group);

        if (group === 'gender') {
            // Product types depend on the gender — rebuild them for the new choice.
            const chips = document.getElementById('vspTypeChips');
            if (chips) chips.innerHTML = (VSP_TYPES[value] || []).map(t => chip('type', t)).join('');
            vspReveal('type');
        } else if (group === 'type') {
            vspReveal('size');
        } else if (group === 'size') {
            vspReveal('final');
        }
        // material / colour sit in the terminal stage — they open nothing further.
        vspUpdateResults();
    };

    window.veroOpenSearchPage = function () {
        mountSearchPage();
        const page = document.getElementById('veroSearchPage');
        // Fresh each open: both search rows side by side, no mode picked yet, with the
        // recommended sellers listed under the seller row.
        vspBackToChooser();
        vspFillSellerSuggestions();
        requestAnimationFrame(() => {
            page.classList.add('open');
            page.setAttribute('aria-hidden', 'false');
        });
        document.body.style.overflow = 'hidden';
    };
    window.veroCloseSearchPage = function () {
        const page = document.getElementById('veroSearchPage');
        if (page) { page.classList.remove('open'); page.setAttribute('aria-hidden', 'true'); }
        document.body.style.overflow = '';
    };

    // Pick a search rectangle → open that mode's search (bar + filters) in the panel.
    window.vspChoose = function (which) {
        const page = document.getElementById('veroSearchPage');
        if (!page) return;
        page.classList.add('chosen');
        vspFocusField(which);                 // sets mode-product / mode-seller
        if (which === 'seller') vspFillSellerSuggestions();
        const id = which === 'seller' ? 'vspSellerInput' : 'vspInput';
        const input = document.getElementById(id);
        if (input) setTimeout(() => input.focus(), 80);
        if (which === 'product') vspUpdateResults();
    };
    // Back arrow → return to the chooser and reset the search state.
    window.vspBackToChooser = function () {
        const page = document.getElementById('veroSearchPage');
        if (!page) return;
        page.classList.remove('chosen', 'mode-product', 'mode-seller', 'searching');
        const bar = page.querySelector('.vsp-searchbar');
        if (bar) bar.classList.remove('mode-product', 'mode-seller');
        const p = document.getElementById('vspInput'), s = document.getElementById('vspSellerInput');
        if (p) p.value = ''; if (s) s.value = '';
        vspState.query = ''; vspState.sellerStyle = ''; vspState.artCat = '';
        page.querySelectorAll('.vsp-alt-filter .vsp-chip.active').forEach(c => c.classList.remove('active'));
        const wrap = document.getElementById('vspResults');
        if (wrap) { wrap.innerHTML = ''; const rw = wrap.closest('.vsp-results-wrap'); if (rw) rw.classList.remove('revealed'); }
    };
    // Live seller results as you type — no three-result cap, follows the filter too.
    window.vspSellerLive = function () {
        window.vspMarkSearching();
        vspSearchSellers();
    };

    // Apply the chosen search + filters. On the home page we drive the feed through
    // its header hooks; elsewhere we route to the home feed carrying the query.
    window.vspApply = function () {
        const f = {
            gender: vspState.gender, type: vspState.type,
            color: vspState.color, maxPrice: vspState.maxPrice
        };
        if (typeof window.veroOnSearch === 'function') window.veroOnSearch(vspState.query || '');
        if (typeof window.veroOnFilters === 'function') {
            window.veroOnFilters(f);
            veroCloseSearchPage();
        } else {
            const params = new URLSearchParams();
            if (vspState.query) params.set('q', vspState.query);
            if (vspState.gender) params.set('seg', vspState.gender.toLowerCase());
            location.href = 'index.html?' + params.toString();
        }
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.veroCloseSearchPage(); });

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
        const company = (p.brand || p.seller || 'VERO Select').trim();
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
    // Accessing the cart from the header glides a white panel in from the right,
    // then navigates — cart-store.html continues the motion by sliding its own
    // content in from the same side, so the cart reads as one panel sliding in.
    // Defined on window so every page's openCart (the SPA one on index.html and
    // the fallback below) can share the exact same transition.
    window.veroSlideToCart = function (url) {
        const dest = url || 'cart-store.html';
        // Respect users who asked for less motion — just navigate.
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            location.href = dest; return;
        }
        if (document.getElementById('veroCartSlide')) return;   // already transitioning
        const panel = document.createElement('div');
        panel.id = 'veroCartSlide';
        panel.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;' +
            'transform:translateX(100%);transition:transform .5s cubic-bezier(.22,1,.36,1);will-change:transform';
        document.body.appendChild(panel);
        requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; }));
        setTimeout(() => { location.href = dest; }, 470);
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

    // Open the "rectangles" hub that matches the active account — seller-area for
    // the business account, buyer-area (personal) for the buyer account.
    window.veroOpenArea = function () {
        location.href = veroActiveAccount() === 'seller' ? 'seller-area.html' : 'profile.html';
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

    // ---- Profile-switch splash ----
    // A short welcome screen: "WELCOME", the account name, then a caption. By
    // default it reloads the current page in place (stay on the feed); pass a
    // `dest` to navigate somewhere instead.
    window.veroProfileSplash = function (opts) {
        opts = opts || {};
        const go = () => {
            if (opts.reload) location.reload();
            else location.href = opts.dest || 'index.html';
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
        requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('show')));
        setTimeout(go, 850);
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
    ensure('openUploadProduct', () => nav('index.html?open=upload'));
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
            const scrolled = window.scrollY > 80;
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
            el.style.backgroundImage = `url('${prof.avatarImg}')`;
            el.classList.add('has-img');
            el.textContent = '';
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
    }

    if (document.getElementById('siteHeader') || document.body) {
        render();
    } else {
        document.addEventListener('DOMContentLoaded', render);
    }
})();
