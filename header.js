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
        #siteHeader .header-left > a {
            color: #fff; text-decoration: none; font-size: 16px; font-weight: 600;
            letter-spacing: 1.3px; cursor: pointer; transition: color 0.25s ease;
            text-transform: uppercase; position: relative; display: flex;
            align-items: center; gap: 5px;
        }
        #siteHeader .header-left > a:hover { opacity: 1; color: rgba(255, 255, 255, 0.7); }
        #siteHeader .header-left > a .caret { width: 8px; height: 8px; opacity: 0.65; }
        #siteHeader .logo {
            font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            font-size: 34px; font-weight: 700; letter-spacing: 5px; color: #fff;
            font-style: normal; text-transform: uppercase; min-width: 80px;
            flex: 0 0 auto; text-align: center; transition: all 0.3s ease;
            cursor: pointer; padding-left: 5px;
        }
        #siteHeader .logo:hover { color: rgba(255, 255, 255, 0.85); transform: scale(1.02); }
        #siteHeader .header-right { display: flex; gap: 12px; align-items: center; flex: 1; justify-content: flex-end; }
        #siteHeader .header-right .icon-wrap { margin-left: 13px; }
        /* Plain switch — no labels, just a track with a sliding knob. */
        #siteHeader .toggle-category {
            position: relative; display: inline-block; box-sizing: border-box;
            width: 52px; height: 28px; flex: 0 0 auto;
            background: transparent; padding: 0; border-radius: 999px; cursor: pointer;
            transition: all 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.5);
        }
        #siteHeader .toggle-category::before {
            content: ''; position: absolute; top: 3px; left: 3px;
            width: 20px; height: 20px; border-radius: 50%; background: #fff; z-index: 0;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s ease;
        }
        #siteHeader .toggle-category:has(#segFashion.active)::before { transform: translateX(24px); }
        /* labels kept in the markup for state/a11y, but not shown */
        #siteHeader .toggle-category .seg {
            position: absolute; width: 1px; height: 1px; overflow: hidden;
            clip: rect(0 0 0 0); white-space: nowrap;
        }
        #siteHeader .toggle-category:hover { border-color: rgba(255, 255, 255, 0.8); }
        #siteHeader .icon-btn {
            background: none; border: none; cursor: pointer; font-size: 27px;
            transition: transform 0.2s; color: #fff; width: 56px; height: 56px;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        #siteHeader .icon-btn svg { width: 30px; height: 30px; stroke: #fff !important; fill: none; }
        #siteHeader .icon-btn svg[data-fill] { fill: #fff !important; stroke: none; }
        #siteHeader .icon-btn:hover { transform: scale(1.1); opacity: 0.65; }
        #siteHeader .upload-plus {
            color: #1DB954 !important; border: 2px solid #1DB954 !important;
            border-radius: 50%; width: 38px; height: 38px;
            animation: uploadPulse 1.2s ease-in-out infinite;
        }
        #siteHeader.scrolled .upload-plus { color: #1DB954 !important; }
        @keyframes uploadPulse {
            0%, 100% { border-color: #1DB954; box-shadow: 0 0 0 0 rgba(29,185,84,0.55); opacity: 1; }
            50% { border-color: rgba(29,185,84,0.35); box-shadow: 0 0 0 6px rgba(29,185,84,0); opacity: 0.55; }
        }
        #siteHeader.scrolled { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 12px rgba(0,0,0,0.05); }
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

        /* ===== Sticky (scrolled) header layout — shared across the whole site =====
           White left area (hamburger + logo), a black band on the right holding the
           icons spread evenly. Same fixed sizing/spacing on every page. Pages opt out
           with <body data-sticky="plain"> (e.g. the product page and the upload view). */
        :root {
            --hdr-band-w: 873px;      /* width of the black band */
            --hdr-band-right: 44px;   /* band offset from the right edge */
            --hdr-spread-w: 720px;    /* width the icon group spreads across */
            --hdr-spread-right: 84px; /* icon group offset from the right edge */
        }
        @media (min-width: 901px) {
            body:not([data-sticky="plain"]) #siteHeader.scrolled .header-container {
                position: relative;
                min-height: 56px; /* all groups go absolute below → keep header height */
                z-index: 1;       /* sit above the black band ::after */
            }
            /* left: hamburger + logo only (nav links live in the drawer here) */
            body:not([data-sticky="plain"]) #siteHeader.scrolled .header-left {
                position: absolute; left: 16px; top: 50%;
                transform: translateY(-50%); margin: 0;
            }
            body:not([data-sticky="plain"]) #siteHeader.scrolled .header-left > a:not(.vero-hamburger) {
                display: none;
            }
            body:not([data-sticky="plain"]) #siteHeader.scrolled .logo {
                position: absolute; left: 58px; top: 0; height: 56px;
                display: flex; align-items: center; margin: 0; padding-left: 0; color: #111;
            }
            /* right: the icon group spreads evenly across the black band */
            body:not([data-sticky="plain"]) #siteHeader.scrolled .header-right {
                position: absolute; top: 50%; transform: translateY(-50%);
                right: var(--hdr-spread-right); left: auto;
                width: var(--hdr-spread-w);
                justify-content: space-between; gap: 0;
            }
            body:not([data-sticky="plain"]) #siteHeader.scrolled .upload-plus {
                animation: none !important; box-shadow: none !important;
            }
        }
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
        #siteHeader.force-dark .upload-plus { color: #1DB954 !important; }
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
        #siteHeader.force-light .upload-plus { color: #1DB954 !important; }
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
