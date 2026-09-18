/* ============================================================================
   nav-icons.js — one shared decorator that puts an icon above the label on
   every navigation tab across the site, in the product page's "action pill"
   style (icon on top, small label beneath).

   It is intentionally defensive: it only touches known tab elements, never
   decorates a tab that already carries its own <svg>, and re-runs on DOM
   changes so JS-built bars (the personal-area tabs, the feed tabs, …) get
   icons too. Icons inherit the tab's colour via currentColor, so each bar
   keeps its own light/dark theme.

       <script src="nav-icons.js" defer></script>
   ========================================================================== */
(function veroNavIcons() {
    'use strict';

    // ---- Icon library (24×24, stroke = currentColor) --------------------------
    var I = {
        home:    '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
        store:   '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9h16v11H4z"/><path d="M9 20v-6h6v6"/>',
        grid:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
        tag:     '<path d="M20.6 13.4L13 21l-8-8V4h9z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
        chat:    '<path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3 21l1.9-6.1A8.4 8.4 0 1 1 21 11.5z"/>',
        offer:   '<path d="M20.6 13.4L13 21l-8-8V4h9z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
        chart:   '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
        user:    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
        users:   '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-5.7 6.5-5.7s6.5 2.1 6.5 5.7"/><path d="M17 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M18.5 14.5c2.3.5 4 2.1 4 4.5"/>',
        ruler:   '<path d="M3 8l5-5 13 13-5 5z"/><path d="M8 6l2 2M11 9l2 2M14 12l2 2"/>',
        gear:    '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 6 8.3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.4 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
        spark:   '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
        layout:  '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
        heart:   '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
        bag:     '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
        cart:    '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l2.4 12a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/>',
        wallet:  '<path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l3-4h11v4"/><circle cx="16.5" cy="13" r="1.2"/>',
        file:    '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/>',
        folder:  '<path d="M3 6h6l2 2h10v11H3z"/>',
        search:  '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
        lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        receipt: '<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M8 8h8M8 12h8"/>',
        bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
        flame:   '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2.5 2 2.5 0-3 2-5 2-8.5z"/>',
        sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
        shirt:   '<path d="M8 3l4 2 4-2 4 4-3 2v10H7V9L4 7z"/>',
        plus:    '<path d="M12 5v14M5 12h14"/>',
        bell:    '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
        camera:  '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        /* Product-category icons */
        sweater: '<path d="M7 4l5 2 5-2 3 4-2 2v10H6V10L4 8z"/><path d="M9 12h6"/>',
        swim:    '<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
        glasses: '<circle cx="7" cy="13" r="3.4"/><circle cx="17" cy="13" r="3.4"/><path d="M10.4 13h3.2"/><path d="M3.6 11l2-2M20.4 11l-2-2"/>',
        shoe:    '<path d="M2 16v-4l4-1 3 3 9 1 3 1v3H2z"/><path d="M2 16h20"/>',
        dress:   '<path d="M9 3l3 2 3-2 1 4-2 2 3 10H7l3-10-2-2z"/>',
        coat:    '<path d="M8 3l4 3 4-3 3 3-2 2v11h-4V13h-2v9H7V8L5 6z"/>',
        hat:     '<path d="M4 16c0-1 3-2 8-2s8 1 8 2-3 2-8 2-8-1-8-2z"/><path d="M8 15V8a4 4 0 0 1 8 0v7"/>',
        pants:   '<path d="M7 3h10l-1 18h-3l-1-11-1 11H8z"/>',
        skirt:   '<path d="M7 4h10l3 7H4z"/><path d="M6 11l1 9M18 11l-1 9M12 11v9"/>',
        gem:     '<path d="M6 3h12l3 5-9 13L3 8z"/><path d="M3 8h18M9 3l-2 5 5 13 5-13-2-5"/>',
        watch:   '<circle cx="12" cy="13" r="5"/><path d="M12 10v3l2 1"/><path d="M9 3h6l-1 4M9 22h6l-1-4"/>',
        hanger:  '<path d="M12 10V8.4a2.2 2.2 0 1 1 2.2 2.2"/><path d="M12 10L3.6 16a1 1 0 0 0 .6 1.8h15.6a1 1 0 0 0 .6-1.8L12 10z"/>',
        /* Fashion-style + art-media category icons (home feed strip) */
        cassette:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="12" r="1.6"/><circle cx="15.5" cy="12" r="1.6"/><path d="M7 17h10"/>',
        crown:   '<path d="M4 18h16M4 18l1-9 4 4 3-6 3 6 4-4 1 9z"/>',
        moon:    '<path d="M20 13.5A7.5 7.5 0 1 1 10.5 4a6 6 0 0 0 9.5 9.5z"/>',
        flower:  '<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6V4M12 14.4V20M9.6 12H4M14.4 12H20"/>',
        circle:  '<circle cx="12" cy="12" r="8"/>',
        book:    '<path d="M5 4h11a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5z"/><path d="M5 4v14"/>',
        palette: '<path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 2-2 2 2 0 0 1 2-2h1a4 4 0 0 0 4-4A9 9 0 0 0 12 3z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>',
        monitor: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M9 21h6M12 17v4"/>',
        shapes:  '<circle cx="8" cy="8" r="4.5"/><rect x="12.5" y="12.5" width="7.5" height="7.5" rx="1"/>',
        frame:   '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M7 15l3.5-4.5 2.5 3 3-4 2 5.5"/>',
        vase:    '<path d="M8 3h8M9.5 3c0 2.5-3 3.5-3 7a5.5 5.5 0 0 0 11 0c0-3.5-3-4.5-3-7"/>',
        droplet: '<path d="M12 3.5s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11z"/>',
        chisel:  '<path d="M14.5 3.5l6 6-3 3-6-6z"/><path d="M11.5 6.5L4 14v6h6l7.5-7.5"/>'
    };

    // ---- Label → icon rules (checked in order; first match wins) --------------
    // Each entry: [RegExp over the lowercased label, icon key]. Hebrew + English.
    var RULES = [
        [/dashboard|לוח\s*בקרה|לוח/, 'layout'],
        [/statist|analyt|סטטיסט|נתונים/, 'chart'],
        [/my\s*shop|storefront|shop|store|חנות/, 'store'],
        [/product|item|מוצר|פריט/, 'tag'],
        [/negoti|offer|deal|מו״מ|מו"מ|משא|הצע|עסק/, 'offer'],
        [/chat|message|inbox|שיח|צ׳אט|צ'אט|הודע/, 'chat'],
        [/size|מיד/, 'ruler'],
        [/assistant|helper|עוזר/, 'spark'],
        [/setting|account|הגדר|חשבון/, 'gear'],
        [/security|password|אבטח|סיסמ/, 'lock'],
        [/expense|spend|budget|הוצא|תקציב/, 'wallet'],
        [/wishlist|saved|save|favorite|משאל|שמור|מועדפ/, 'heart'],
        [/bag|cart|עגל|סל/, 'bag'],
        [/follow|עוקב|מעקב/, 'users'],
        [/draft|טיוט/, 'file'],
        [/collection|album|אוסף|קולק/, 'folder'],
        [/sale|revenue|earning|מכיר|הכנס/, 'receipt'],
        [/order|purchase|הזמנ|רכיש/, 'receipt'],
        [/search|find|חיפוש|חפש/, 'search'],
        [/filter|sort|סינון|מיון/, 'sliders'],
        [/for\s*you|recommend|בשביל|מותאם/, 'spark'],
        [/trend|popular|hot|new|טרנד|חדש|פופול/, 'flame'],
        [/home|feed|explore|בית|פיד|גלה/, 'home'],
        [/profile|about\s*me|פרופיל|אודות/, 'user'],
        // Product categories (feed / storefront category strips).
        [/sweater|knit|pullover|hoodie|jumper|cardigan|סוודר|סריג|קפוצ|אפוד/, 'sweater'],
        [/swim|bikini|beach|swimwear|בגד\s*ים|ביקיני|חוף|ים/, 'swim'],
        [/sunglass|glasses|eyewear|משקפ/, 'glasses'],
        [/shoe|sneaker|boot|heel|sandal|footwear|trainer|נעל|מגף|סניקר|סנדל|עקב/, 'shoe'],
        [/hand\s*bag|handbag|purse|tote|clutch|backpack|תיק|ארנק|קלאץ/, 'bag'],
        [/dress|gown|שמלה|שמלת/, 'dress'],
        [/jacket|coat|outerwear|blazer|parka|מעיל|ז׳קט|ז'קט|ג׳קט|ג'קט|בלייזר/, 'coat'],
        [/\bhats?\b|\bcaps?\b|beanie|כובע/, 'hat'],
        [/pants|trouser|jean|denim|chino|legging|shorts|מכנס|ג׳ינס|ג'ינס|טייץ|שורט/, 'pants'],
        [/skirt|חצאית/, 'skirt'],
        [/jewel|ring|necklace|bracelet|earring|תכשיט|טבעת|שרשר|צמיד|עגיל/, 'gem'],
        [/watch|שעון/, 'watch'],
        [/t-?shirt|tee|top\b|טי-?שירט|חולצת\s*טי|חולצה|חולצות|טופ/, 'shirt'],
        [/men|man|גבר/, 'shirt'],
        [/women|woman|נשים|אישה/, 'shirt'],
        [/kids|child|ילד/, 'shirt'],
        [/upload|add|photo|העל|הוסף|צילום|תמונה/, 'camera'],
        // Fashion-style categories (home feed strip)
        [/smart\s*casual/, 'coat'],
        [/basic|casual/, 'shirt'],
        [/athleisure|athletic|sport/, 'shoe'],
        [/lounge/, 'sweater'],
        [/street/, 'hat'],
        [/tech\s*wear|techwear/, 'gear'],
        [/y2k/, 'spark'],
        [/old\s*money|luxe|luxury/, 'crown'],
        [/grunge/, 'flame'],
        [/goth/, 'moon'],
        [/boho|chic/, 'flower'],
        [/minimal/, 'circle'],
        [/dark\s*academia|academia/, 'book'],
        [/vintage|retro|90s/, 'cassette'],
        [/design/, 'sliders'],
        // Art-media categories
        [/acryl|oil|watercolor|gouache|pastel|mixed\s*media|paint/, 'palette'],
        [/digital/, 'monitor'],
        [/abstract/, 'shapes'],
        [/art\s*deco/, 'gem'],
        [/modern|prints?|gallery|canvas/, 'frame'],
        [/ceramic|pottery/, 'vase'],
        [/epoxy|resin/, 'droplet'],
        [/sculpt|metal|stone|statue|marble/, 'chisel'],
        [/all|הכל|כל/, 'grid'],
        [/notif|alert|התרא|התראות/, 'bell']
    ];

    function iconFor(label) {
        var t = (label || '').toLowerCase().trim();
        if (!t) return null;
        for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(t)) return I[RULES[i][1]];
        return null;   // no match → leave the tab as plain text (no generic icon)
    }

    // Item-level tab selectors for the app's SECTION navigation bars. Unmatched
    // labels here stay plain text (no icon).
    var SECTION_SEL = [
        '.area-tab', '.sa-tab', '.sec-tab', '.pf-tab',
        '.cart-tab', '.vinbox-tab', '.stats-subtab', '.stf-tab',
        '.set-nav-btn', '.cp-navlink', '.chat-nav a',
        '.spend-nav button', '.vf-navbox-item'
    ].join(',');

    // Category-picker bars (the home feed's T-SHIRTS / SWIMWEAR / … strip and the
    // storefront / topbar category rows). Each item is a product category, so it
    // gets a category-specific icon, falling back to a clothes-hanger so every
    // category shows an icon (never the same generic tile for all of them).
    var CATEGORY_SEL = ['.feed-nav-tab', '.category-nav a', '.cat-topbar a'].join(',');

    var STYLE_ID = 'vero-nav-icons-style';
    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent =
            '.vni{display:inline-flex!important;flex-direction:column!important;' +
            'align-items:center!important;justify-content:center!important;gap:3px!important;}' +
            '.vni-ic{display:block;width:17px;height:17px;line-height:0;flex:none;pointer-events:none;}' +
            '.vni-ic svg{width:100%;height:100%;stroke:currentColor;fill:none;stroke-width:1.25;' +
            'stroke-linecap:round;stroke-linejoin:round;display:block;}';
        (document.head || document.documentElement).appendChild(s);
    }

    // The label text of a tab, ignoring nested counters/badges/dots.
    function labelOf(el) {
        var clone = el.cloneNode(true);
        clone.querySelectorAll('svg,.num,.area-dot,.badge,[class*="count"],[class*="dot"],[class*="badge"]')
             .forEach(function (n) { n.remove(); });
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function decorate(root, selectors, fallback) {
        var scope = root && root.querySelectorAll ? root : document;
        var tabs;
        try { tabs = scope.querySelectorAll(selectors); } catch (e) { return; }
        var touched = false;
        tabs.forEach(function (el) {
            if (el.dataset.vniDone) return;
            if (el.querySelector('svg')) { el.dataset.vniDone = '1'; return; }   // already has its own icon
            var svg = iconFor(labelOf(el)) || fallback;
            if (!svg) { el.dataset.vniDone = '1'; return; }
            var ic = document.createElement('span');
            ic.className = 'vni-ic';
            ic.setAttribute('aria-hidden', 'true');
            ic.innerHTML = '<svg viewBox="0 0 24 24">' + svg + '</svg>';
            el.insertBefore(ic, el.firstChild);
            el.classList.add('vni');
            el.dataset.vniDone = '1';
            touched = true;
        });
        if (touched) {
            // Let sliding indicators (area-ind / sa-ind / sec-ind / feed) re-measure.
            try { window.dispatchEvent(new Event('resize')); } catch (e) {}
        }
    }

    function decorateAll() {
        decorate(document, SECTION_SEL, null);
        decorate(document, CATEGORY_SEL, I.hanger);   // category bars: hanger fallback
    }

    function boot() {
        ensureStyle();
        decorateAll();
        // Re-decorate when bars mount or re-render (debounced).
        var pending = null;
        var obs = new MutationObserver(function () {
            if (pending) return;
            pending = setTimeout(function () { pending = null; decorateAll(); }, 120);
        });
        try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
