/* ------------------------------------------------------------------
   moravchick — seasonal collections + end-of-season sales.

   ONE source of truth for the four seasonal collections (Spring, Summer,
   Autumn, Winter), which one is "in season" right now (by calendar
   month), which one is running its end-of-season sale, and how a
   product's effective discount is worked out.

   Every collections/sales surface reads through here so the same product
   shows the same collection and the same price everywhere:
       collections.html   — the four collections, ordered by the calendar
       collection.html    — one collection's pieces
       sales.html         — every discounted piece, deepest cut first

   Usage:
     <script src="product-overrides.js"></script>   (optional, folds in seller edits)
     <script src="collections.js"></script>

   A product's collection is resolved in this order:
     1. an explicit `collection` chosen by the seller on upload
     2. inferred from the legacy `season` chip (Summer/Winter/Transitional)
     3. inferred from the month it was listed
     4. the collection that is currently in season
------------------------------------------------------------------ */
(function () {
    'use strict';

    // ---- The four collections -------------------------------------------------
    // months: 1-12 that belong to the season. eos: end-of-season discount (%)
    // applied to the whole collection while it is the season that just ended.
    var COLLECTIONS = {
        spring: { key: 'spring', he: 'אביב',  en: 'Spring', emoji: '🌸', months: [3, 4, 5],    hero: 'women-hero.jpg',    accent: '#6f8f6a', eos: 40 },
        summer: { key: 'summer', he: 'קיץ',   en: 'Summer', emoji: '☀️', months: [6, 7, 8],    hero: 'hero-beach.jpg',    accent: '#c99a3a', eos: 50 },
        autumn: { key: 'autumn', he: 'סתיו',  en: 'Autumn', emoji: '🍂', months: [9, 10, 11],  hero: 'clothing-hero.jpg', accent: '#a5622e', eos: 40 },
        winter: { key: 'winter', he: 'חורף',  en: 'Winter', emoji: '❄️', months: [12, 1, 2],   hero: 'men-hero.jpg',      accent: '#4a6c8f', eos: 45 }
    };
    var ORDER = ['spring', 'summer', 'autumn', 'winter'];

    function list() { return ORDER.map(function (k) { return COLLECTIONS[k]; }); }
    function get(key) { return COLLECTIONS[key] || null; }

    // ---- Calendar ------------------------------------------------------------
    // Which collection owns the current month.
    function currentKey(now) {
        var m = (now ? new Date(now) : new Date()).getMonth() + 1;   // 1-12
        for (var i = 0; i < ORDER.length; i++) {
            if (COLLECTIONS[ORDER[i]].months.indexOf(m) !== -1) return ORDER[i];
        }
        return 'spring';
    }
    // The season that just ended runs the end-of-season sale — "summer's over,
    // the summer sale is on". It is the season before the current one.
    function saleKey(now) {
        var idx = ORDER.indexOf(currentKey(now));
        return ORDER[(idx + ORDER.length - 1) % ORDER.length];
    }

    // ---- Price helpers -------------------------------------------------------
    function toNum(v) {
        if (typeof v === 'number') return v;
        var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, ''));
        return isNaN(n) ? 0 : n;
    }
    function money(n) { return '₪' + Math.round(Number(n)).toLocaleString('en-US'); }

    // Map a legacy season chip to a collection.
    var SEASON_MAP = {
        summer: 'summer', winter: 'winter',
        spring: 'spring', autumn: 'autumn', fall: 'autumn',
        transitional: 'autumn', 'all-season': null
    };

    // Resolve a product's collection key.
    function collectionOf(p) {
        if (!p) return currentKey();
        if (p.collection && COLLECTIONS[p.collection]) return p.collection;
        var s = String(p.season || '').trim().toLowerCase();
        if (s && SEASON_MAP.hasOwnProperty(s) && SEASON_MAP[s]) return SEASON_MAP[s];
        var at = p.createdAt || p.listedAt;
        if (at) return currentKey(at);
        return currentKey();
    }

    // The seller's own discount, as a percent (0 when none). Reads a stored
    // salePercent/discount, or derives it from a salePrice vs. price pair, and
    // folds in any seller override from product-overrides.js.
    function ownPercent(p) {
        var price = toNum(p.price);
        var pct = 0;
        if (p.salePercent != null) pct = toNum(p.salePercent);
        else if (p.discount != null) pct = toNum(p.discount);
        var sp = p.salePrice;
        if (window.veroApplyOverride) {
            try {
                var m = window.veroApplyOverride(p);
                if (m && m.onSale && m.originalPrice) {
                    var was = toNum(m.originalPrice), now = toNum(m.price);
                    if (was > 0) { pct = Math.max(pct, Math.round((1 - now / was) * 100)); price = was; }
                }
            } catch (e) {}
        }
        if (!pct && sp != null && price > 0) {
            var s = toNum(sp);
            if (s > 0 && s < price) pct = Math.round((1 - s / price) * 100);
        }
        return Math.max(0, Math.min(95, Math.round(pct)));
    }

    // The effective discount on a product = the deeper of its own sale and the
    // end-of-season sale on its collection (when that collection's sale is on).
    function discountOf(p, now) {
        var price = toNum(p.price);
        // Own sale can carry the real "was" price up in ownPercent; recompute base.
        var own = ownPercent(p);
        var base = price;
        if (window.veroApplyOverride) {
            try {
                var m = window.veroApplyOverride(p);
                if (m && m.onSale && m.originalPrice) base = toNum(m.originalPrice);
            } catch (e) {}
        }
        var col = collectionOf(p);
        var eos = (col === saleKey(now)) ? (COLLECTIONS[col] ? COLLECTIONS[col].eos : 0) : 0;
        var pct = Math.max(own, eos);
        var salePrice = pct > 0 ? Math.round(base * (1 - pct / 100)) : base;
        return {
            percent: pct,
            onSale: pct > 0,
            eos: eos > 0 && eos >= own,             // this cut is the collection sale
            original: base,
            price: salePrice,
            collection: col
        };
    }

    // ---- Catalogue -----------------------------------------------------------
    function readJSON(k, fb) {
        try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }
        catch (e) { return fb; }
    }

    // A spread of demo pieces so every collection and the sale hub always have
    // something to show on a fresh device. Seeded once into vero_listings so
    // seller edits and discounts attach to them like any real listing.
    function demoSeed() {
        var D = 864e5, now = Date.now();
        return [
            { id: 'c_sp1', collection: 'spring', name: 'Linen shirt',      seller: 'Studio Noir',       category: 'Shirts',    price: 220, icon: '👔', salePercent: 20 },
            { id: 'c_sp2', collection: 'spring', name: 'Floral midi',      seller: 'Designer Collection', category: 'Dresses', price: 340, icon: '👗' },
            { id: 'c_sp3', collection: 'spring', name: 'Trench coat',      seller: 'Luxe Atelier',      category: 'Outerwear', price: 480, icon: '🧥', salePercent: 15 },
            { id: 'c_su1', collection: 'summer', name: 'Straw hat',        seller: 'Sole Society',      category: 'Accessories', price: 90, icon: '👒', salePercent: 35 },
            { id: 'c_su2', collection: 'summer', name: 'Beach linen set',  seller: 'Studio Vero',       category: 'Sets',      price: 260, icon: '🩳', salePercent: 45 },
            { id: 'c_su3', collection: 'summer', name: 'Leather sandals',  seller: 'Sole Society',      category: 'Shoes',     price: 180, icon: '👡' },
            { id: 'c_au1', collection: 'autumn', name: 'Wool cardigan',    seller: 'Vintage Vault',     category: 'Knitwear',  price: 300, icon: '🧶', salePercent: 25 },
            { id: 'c_au2', collection: 'autumn', name: 'Suede boots',      seller: 'Sole Society',      category: 'Shoes',     price: 420, icon: '👢' },
            { id: 'c_au3', collection: 'autumn', name: 'Plaid scarf',      seller: 'Art House',         category: 'Accessories', price: 120, icon: '🧣', salePercent: 30 },
            { id: 'c_wi1', collection: 'winter', name: 'Down parka',       seller: 'Studio Noir',       category: 'Outerwear', price: 640, icon: '🧥', salePercent: 10 },
            { id: 'c_wi2', collection: 'winter', name: 'Cashmere sweater', seller: 'Luxe Atelier',      category: 'Knitwear',  price: 390, icon: '🧶', salePercent: 50 },
            { id: 'c_wi3', collection: 'winter', name: 'Leather gloves',   seller: 'Vintage Vault',     category: 'Accessories', price: 150, icon: '🧤' }
        ].map(function (p, i) { p.status = 'active'; p.createdAt = now - (i + 1) * D; p.demo = true; return p; });
    }

    // Real listings + demo pieces, merged at read time. The demo spread is kept
    // in memory only — never written into vero_listings — so it fills the
    // collections and sale hub without ever polluting a seller's own inventory.
    function catalogue() {
        var listings = readJSON('vero_listings', null);
        if (!Array.isArray(listings)) listings = [];
        return listings.concat(demoSeed());
    }

    // Every active piece, normalised to the shape the card renderer expects.
    function allProducts() {
        var listings = catalogue();
        return listings
            .filter(function (p) { return p && (p.status === 'active' || p.status == null); })
            .map(function (p) {
                return {
                    id: p.id,
                    name: p.name || p.title || 'Untitled',
                    seller: p.seller || p.brand || 'moravchick',
                    category: p.category || p.itemType || '',
                    price: toNum(p.price),
                    icon: p.icon || p.emoji || '🛍️',
                    cover: p.cover || (p.photos && (p.photos.cover || p.photos.detail)) || '',
                    collection: collectionOf(p),
                    season: p.season || '',
                    createdAt: p.createdAt || p.listedAt || 0,
                    _raw: p
                };
            });
    }

    function byCollection(key) {
        return allProducts().filter(function (p) { return p.collection === key; });
    }

    // Every discounted piece, deepest cut first.
    function onSale(now) {
        return allProducts()
            .map(function (p) { p._d = discountOf(p._raw, now); return p; })
            .filter(function (p) { return p._d.onSale; })
            .sort(function (a, b) { return b._d.percent - a._d.percent; });
    }

    // ---- Card renderer -------------------------------------------------------
    // Emits the site's shared .product-card markup (see product-card.css), with
    // the sale price block when a discount is on.
    function priceBlock(d) {
        if (!d.onSale) return '<span class="vprice">' + money(d.original) + '</span>';
        return '<span class="vprice-wrap">' +
                    '<span class="vprice-off">-' + d.percent + '%</span>' +
                    '<span class="vprice-was">' + money(d.original) + '</span>' +
                    '<span class="vprice vprice-sale">' + money(d.price) + '</span>' +
                '</span>';
    }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

    function cardHTML(p, now) {
        var d = p._d || discountOf(p._raw, now);
        var media = p.cover
            ? '<img class="pc-photo" src="' + esc(p.cover) + '" alt="' + esc(p.name) + '">'
            : esc(p.icon);
        return '<a class="product-card' + (d.onSale ? ' is-sale' : '') + '" href="product.html" title="' + esc(p.name) + '">' +
                    '<div class="product-image">' + media +
                        '<button class="product-icon cart" type="button" aria-label="Add to cart" onclick="return false">' +
                            '<svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle><path d="M2 3h3l2.4 12a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L22 7H6"></path></svg>' +
                        '</button>' +
                    '</div>' +
                    '<div class="product-info">' +
                        '<div class="pc-left"><div class="product-price">' + priceBlock(d) + '</div></div>' +
                        '<div class="pc-right">' +
                            '<div class="product-seller">' + esc(p.seller) + '</div>' +
                            '<div class="product-name">' + esc(p.name) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</a>';
    }

    window.veroCollections = {
        list: list, get: get, order: ORDER,
        currentKey: currentKey, saleKey: saleKey,
        collectionOf: collectionOf, discountOf: discountOf, ownPercent: ownPercent,
        allProducts: allProducts, byCollection: byCollection, onSale: onSale,
        cardHTML: cardHTML, priceBlock: priceBlock, money: money, toNum: toNum
    };
})();
