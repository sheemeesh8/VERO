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
        #siteHeader .toggle-category {
            position: relative; display: inline-flex; align-items: center;
            background: transparent; padding: 4px; border-radius: 20px; cursor: pointer;
            font-weight: 700; letter-spacing: 1px; color: #fff; transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.5); gap: 0; font-size: 12px;
        }
        #siteHeader .toggle-category::before {
            content: ''; position: absolute; top: 4px; bottom: 4px; left: 4px;
            width: calc(50% - 4px); border-radius: 16px; background: #fff; z-index: 0;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s ease;
        }
        #siteHeader .toggle-category:has(#segFashion.active)::before { transform: translateX(100%); }
        #siteHeader .toggle-category .seg {
            position: relative; z-index: 1; flex: 1 1 0; text-align: center;
            padding: 5px 14px; border-radius: 14px; transition: color 0.3s ease;
            text-transform: uppercase; color: rgba(255, 255, 255, 0.75); white-space: nowrap;
        }
        #siteHeader .toggle-category .seg.active { color: #111; }
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
        /* Badge on cart & wishlist */
        #siteHeader .icon-wrap { position: relative; display: inline-flex; }
        #siteHeader .badge {
            position: absolute; top: 50%; left: -13px; transform: translateY(-50%);
            background: #c0392b; color: white; font-size: 10px; font-weight: 700;
            width: 15px; height: 28px; padding: 0; border-radius: 8px; display: none;
            align-items: center; justify-content: center; font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        #siteHeader .badge.show { display: flex; }
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
                <a onclick="showToast('Social coming soon ✨')">Social
                    <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
        const dark = document.body.getAttribute('data-header') === 'dark';
        // Use a real <header> element so existing selectors (header.scrolled) apply.
        host.outerHTML = `<header id="siteHeader" class="${dark ? 'force-dark' : ''}">${MARKUP}</header>`;
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
