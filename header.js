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
    const ICON_ORDER = ['mode', 'account', 'cart', 'chats', 'menu'];
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
        #siteHeader {
            background: transparent;
            border-bottom: none;
            padding: 8px 0;
            position: fixed;
            /* Sits a little below the very top edge rather than flush against it. */
            top: 18px; left: 0; right: 0;
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
            font-size: 15px; font-weight: 500; color: #111;
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
            font-size: 150px; color: rgba(0,0,0,0.85);
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
            font-size: 46px; font-weight: 400; letter-spacing: 0.5px;
            text-transform: uppercase; line-height: 1.15; color: #111;
        }
        #siteHeader .hdr-preview-seller > span { white-space: nowrap; }
        #siteHeader .hdr-preview-seller.one-word { font-size: 46px; }
        /* The piece's own name — smaller than the company name, and bold. */
        #siteHeader .hdr-preview-name {
            font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            font-size: 26px; font-weight: 700; text-transform: uppercase;
            line-height: 1.25; letter-spacing: 0.5px; color: #111;
            overflow-wrap: anywhere; margin: 0;
        }
        #siteHeader .hdr-preview-desc {
            font-size: 15px; line-height: 1.7; color: #6b665e; max-width: 460px; margin: 0;
        }
        #siteHeader .hdr-preview-price {
            font-size: 30px; font-weight: 600; letter-spacing: 0.5px; color: #111; margin: 2px 0;
        }
        #siteHeader .hdr-preview-buy {
            display: inline-flex; align-items: center; gap: 12px;
            background: #22372B; border: 1px solid #22372B; cursor: pointer;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 13px; font-weight: 700; letter-spacing: 2px;
            text-transform: uppercase; color: #fff; padding: 14px 26px;
            transition: gap 0.3s, background 0.25s;
        }
        #siteHeader .hdr-preview-buy:hover { gap: 16px; background: #2E4A3A; border-color: #2E4A3A; }
        #siteHeader .hdr-preview-empty {
            grid-column: 1 / -1;
            display: flex; align-items: center; justify-content: center; text-align: center;
            color: #b3b3b3; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; padding: 60px 40px;
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
            #siteHeader .hdr-filters .hf-grid { grid-template-columns: repeat(2, 1fr); }
            #siteHeader .hdr-inner { gap: 26px; }
            #siteHeader .hdr-preview-card { grid-template-columns: 1fr; gap: 22px; }
            #siteHeader .hdr-preview-img { aspect-ratio: 16 / 10; font-size: 90px; }
            #siteHeader .hdr-preview-seller { font-size: 34px; }
            #siteHeader .hdr-preview-seller.one-word { font-size: 48px; }
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
            font-family: inherit; font-size: 13px; letter-spacing: 0.5px; color: #111;
        }
        #siteHeader .hdr-search input::placeholder {
            color: rgba(0, 0, 0, 0.45); text-transform: uppercase; letter-spacing: 1.2px; font-size: 12px;
        }
        #siteHeader .hdr-social { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        #siteHeader .hdr-soc { color: #111; display: flex; opacity: 0.72; transition: opacity 0.2s ease; }
        #siteHeader .hdr-soc:hover { opacity: 1; }
        #siteHeader .hdr-soc svg { width: 18px; height: 18px; }
        #siteHeader .hdr-addproduct {
            height: 34px; padding: 0 18px; border-radius: 999px;
            background: #111; color: #fff; border: none; cursor: pointer;
            font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 1.5px;
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
            font-size: 34px; font-weight: 700; letter-spacing: 5px; color: #111;
            font-style: normal; text-transform: uppercase; min-width: 80px;
            flex: 0 0 auto; text-align: center; transition: all 0.3s ease;
            cursor: pointer; padding-left: 5px;
        }
        #siteHeader .logo:hover { color: rgba(0, 0, 0, 0.7); transform: scale(1.02); }
        /* The Vero script logo is a white-on-transparent PNG. On the light header it
           is flipped to black; over a dark hero it stays white. */
        #siteHeader .logo .logo-img { height: 46px; width: auto; display: block; filter: brightness(0); transition: filter 0.25s ease; }
        #siteHeader.wh-over-hero .logo .logo-img,
        #siteHeader.over-dark .logo .logo-img,
        #siteHeader.sticky-look:not(.scrolled) .logo .logo-img { filter: none !important; }
        #siteHeader .header-right { display: flex; gap: 26px; align-items: center; flex: 1; justify-content: flex-end; }
        #siteHeader .header-right .icon-wrap { margin-left: 0; }
        /* The switch and the plus keep their shared styling through this wrapper, but
           the wrapper itself is transparent to layout — both controls are direct flex
           items of .header-right, so every gap in the icon row is the same. */
        #siteHeader .hdr-mode-pair { display: contents; }
        /* Plain switch — no labels, just a track with a sliding knob. */
        #siteHeader .toggle-category {
            position: relative; display: inline-block; box-sizing: border-box;
            width: 52px; height: 28px; flex: 0 0 auto;
            background: transparent; padding: 0; border-radius: 999px; cursor: pointer;
            /* Not "all": border-color is mode-driven and must switch immediately when
               the mode flips — transitioning it left the switch showing the old
               mode's colour. */
            transition: background 0.3s ease; border: 1px solid rgba(0, 0, 0, 0.18);
        }
        #siteHeader .toggle-category::before {
            content: ''; position: absolute; top: 3px; left: 3px;
            width: 20px; height: 20px; border-radius: 50%; background: #111; z-index: 0;
            /* Only the slide animates. The knob's colour is mode-driven, same as the
               track's border, and must switch instantly rather than fade. */
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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
        /* Cart & wishlist read a touch larger than the rest of the icon row. */
        #siteHeader [data-icon="cart"] .icon-btn svg,
        #siteHeader [data-icon="wishlist"] .icon-btn svg { width: 38px; height: 38px; }
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
        #siteHeader.scrolled { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 12px rgba(0,0,0,0.05); }
        /* Home (sticky-look) header floats transparent over the full-bleed hero image
           until you scroll past it — only the white content shows, no white bar. */
        #siteHeader.sticky-look:not(.scrolled) { background: transparent; border-bottom: none; box-shadow: none; }
        #siteHeader.sticky-look.scrolled { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 12px rgba(0,0,0,0.05); }
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
        #siteHeader.scrolled.over-dark .logo-img { filter: invert(1) brightness(1.15); }
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
            /* right: the icon group sits tight against the right edge, close together
               rather than spread across the bar. */
            body:not([data-sticky="plain"]) #siteHeader .header-right {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: 40px; left: auto;
                width: auto;
                justify-content: flex-end; gap: 26px;
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
            background: #EB2323; color: #fff; font-size: 11px; font-weight: 700;
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
        #siteHeader .vero-hamburger span:nth-child(1) { width: 100%; }
        #siteHeader .vero-hamburger span:nth-child(2) { width: 72%; }
        #siteHeader .vero-hamburger span:nth-child(3) { width: 46%; }
        #siteHeader .vero-hamburger:hover span:nth-child(2) { width: 100%; }
        #siteHeader .vero-hamburger:hover span:nth-child(3) { width: 100%; }

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
            font-family: 'Playfair Display', Georgia, serif; font-size: 26px;
            font-weight: 700; letter-spacing: 5px; text-transform: uppercase; color: #fff;
        }
        .vero-drawer-head .vero-drawer-logo .vero-drawer-logo-img {
            height: 34px; width: auto; display: block;
            /* logo art is black; drawer background is dark, so flip it to white */
            filter: invert(1) brightness(2);
        }
        .vero-drawer-close {
            background: none; border: none; cursor: pointer; font-size: 28px;
            line-height: 1; color: #fff; padding: 0; width: 32px; height: 32px;
        }
        .vero-drawer-close:hover { opacity: 0.6; }
        .vero-drawer-nav { display: flex; flex-direction: column; gap: 4px; }
        .vero-drawer-nav a {
            font-size: 19px; font-weight: 600; letter-spacing: 0.5px; color: #fff;
            text-decoration: none; padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.14);
            transition: color 0.2s ease, padding-left 0.2s ease;
        }
        .vero-drawer-nav a:hover { color: rgba(255,255,255,0.6); padding-left: 6px; }
        .vero-drawer-social {
            margin-top: auto; padding-top: 28px;
            display: flex; align-items: center; gap: 20px;
        }
        .vero-drawer-social a { color: rgba(255,255,255,0.6); display: inline-flex; transition: color 0.2s ease; }
        .vero-drawer-social a:hover { color: #fff; }
        .vero-drawer-social svg { width: 21px; height: 21px; }

        @media (max-width: 768px) {
            #siteHeader .header-container { flex-wrap: wrap; gap: 20px; }
            #siteHeader .header-left { display: flex; flex: 1 1 100%; order: 1; justify-content: center; gap: 15px; font-size: 11px; }
            #siteHeader .header-left > a { font-size: 11px; }
            #siteHeader .logo { font-size: 20px; letter-spacing: 3px; order: 2; flex: 0 1 auto; }
            #siteHeader .logo .logo-img { height: 32px; }
            #siteHeader .header-right { order: 3; flex: 1 1 100%; justify-content: center; gap: 15px; }
        }

        /* ===== The switch and the + =====
           Black like every other control in the header, in every state. They used
           to carry the site's mode colour (green in fashion, burgundy in art);
           that is retired. Last in the file and marked !important so it beats the
           .scrolled / .force-dark / .force-light blocks above. */
        #siteHeader .hdr-mode-pair .toggle-category,
        #siteHeader.scrolled .hdr-mode-pair .toggle-category,
        #siteHeader.force-dark .hdr-mode-pair .toggle-category,
        #siteHeader.force-light .hdr-mode-pair .toggle-category,
        #siteHeader.sticky-look:not(.scrolled):not(.hero-left-box) .header-right .hdr-mode-pair .toggle-category {
            border-color: #111 !important;
        }
        #siteHeader .hdr-mode-pair .toggle-category::before,
        #siteHeader.scrolled .hdr-mode-pair .toggle-category::before,
        #siteHeader.force-dark .hdr-mode-pair .toggle-category::before,
        #siteHeader.force-light .hdr-mode-pair .toggle-category::before,
        #siteHeader.sticky-look:not(.scrolled):not(.hero-left-box) .header-right .hdr-mode-pair .toggle-category::before {
            background: #111 !important;
        }
        #siteHeader .hdr-mode-pair .upload-plus,
        #siteHeader.scrolled .hdr-mode-pair .upload-plus,
        #siteHeader.force-dark .hdr-mode-pair .upload-plus,
        #siteHeader.force-light .hdr-mode-pair .upload-plus,
        #siteHeader.sticky-look:not(.scrolled):not(.hero-left-box) .header-right .hdr-mode-pair .upload-plus {
            color: #111 !important;
            border-color: #111 !important;
        }
        #siteHeader .hdr-mode-pair .upload-plus { animation: none !important; }

        /* On the black sticky header the switch and the + turn white, like the rest
           of the icons. Higher specificity + !important so they beat the black
           mode-pair rules above. */
        #siteHeader.scrolled.over-dark .hdr-mode-pair .toggle-category { border-color: #fff !important; }
        #siteHeader.scrolled.over-dark .hdr-mode-pair .toggle-category::before { background: #fff !important; }
        #siteHeader.scrolled.over-dark .hdr-mode-pair .upload-plus { color: #fff !important; border-color: #fff !important; }

        /* ===== Logo on the right, controls on the left ===== */
        #siteHeader .header-right { flex: 0 0 auto; justify-content: flex-start; gap: 26px; }
        @media (min-width: 901px) {
            body:not([data-sticky="plain"]) #siteHeader .header-right {
                left: 40px; right: auto; justify-content: flex-start;
            }
            body:not([data-sticky="plain"]) #siteHeader .logo {
                left: auto; right: 58px;
            }
        }
        @media (max-width: 768px) {
            #siteHeader .header-right { order: 1; flex: 0 0 auto; }
            #siteHeader .logo { order: 2; }
        }
`;

    // ---- Markup (identical everywhere) ----
    const MARKUP = `
        <div class="header-container">
            <div class="header-right">
                <a class="vero-hamburger" onclick="veroToggleDrawer()" aria-label="Menu" role="button" tabindex="0" data-icon="menu">
                    <span></span><span></span><span></span>
                </a>
                <span class="hdr-mode-pair" data-icon="mode">
                    <div class="toggle-category" id="categoryToggleBtn" onclick="toggleSwitch()">
                        <span class="seg active" id="segArt">Art</span>
                        <span class="seg" id="segFashion">Fashion</span>
                    </div>
                    <button class="icon-btn upload-plus" title="Upload Product" onclick="openUploadProduct()" style="font-size: 26px; font-weight: 800; line-height: 1;">+</button>
                </span>
                <button class="icon-btn" data-icon="account" title="My Account" onclick="openBuyerArea()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" data-fill>
                        <circle cx="12" cy="8" r="4.2"/>
                        <path d="M12 13.5c-4.5 0-8.2 2.9-8.2 6.5h16.4c0-3.6-3.7-6.5-8.2-6.5z"/>
                    </svg>
                </button>
                <span class="icon-wrap" data-icon="cart">
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
                <button class="icon-btn" data-icon="chats" title="Deal Chats" onclick="vchatOpenInbox()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"></path>
                    </svg>
                </button>
            </div>
            <div class="logo" onclick="showMain()" style="cursor:pointer"><img src="vero-logo.png" alt="VERO" class="logo-img" onerror="this.replaceWith(document.createTextNode('VERO'))"></div>
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
                <span class="vero-drawer-logo"><img src="vr-logo.png" alt="VERO" class="vero-drawer-logo-img" onerror="this.replaceWith(document.createTextNode('VERO'))"></span>
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
            ? window.productPageUrl(p) : 'product.html';
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
            // Only the feed has a filter line; elsewhere the header never goes dark.
            const filter = document.querySelector('.feed-filters');
            let overDark = false;
            if (scrolled && filter) {
                const filterBottom = filter.getBoundingClientRect().bottom + window.scrollY;
                overDark = (window.scrollY + hdr.offsetHeight) < filterBottom;
            }
            hdr.classList.toggle('over-dark', overDark);
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
