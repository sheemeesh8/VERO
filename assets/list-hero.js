/* ------------------------------------------------------------------
   moravchick — List hero for the cart and the wishlist (styles: assets/list-hero.css).
   Opens the page like the home page's hero: a light-grey ground with the list's
   own pieces scattered in layers at its foot and the title and count centred
   above, then the page's own search, a "You may also like" slider and the list.

     <body data-list="cart">  or  data-list="wishlist"
     <script src="assets/list-hero.js"></script>   (end of body)
------------------------------------------------------------------ */
(function () {
    'use strict';
    if (document.documentElement.classList.contains('embed')) return;   // in the personal area: its own hero
    var kind = document.body.getAttribute('data-list') === 'wishlist' ? 'wishlist' : 'cart';
    var C = {
        cart:     { key: 'vero_cart',     eyebrow: 'Your selection', title: 'Cart',     img: 'assets/hero/men-slide.jpg',   rail: 'You may also like' },
        wishlist: { key: 'vero_wishlist', eyebrow: 'Saved for later', title: 'Wishlist', img: 'assets/hero/women-slide.jpg', rail: 'You may also like' }
    }[kind];
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
    var items = [];
    try { items = JSON.parse(localStorage.getItem(C.key)) || []; } catch (e) {}
    if (!Array.isArray(items)) items = [];
    var n = items.reduce(function (s, i) { return s + ((i && i.qty) || 1); }, 0);
    var total = items.reduce(function (s, i) { var p = parseFloat(String((i && i.price) || 0).replace(/[^\d.]/g, '')) || 0; return s + p * ((i && i.qty) || 1); }, 0);
    var sub = !n ? (kind === 'cart' ? 'Nothing in your cart yet.' : 'Nothing saved yet — tap the heart on a piece you love.')
        : n + (n === 1 ? ' piece' : ' pieces') + (kind === 'cart' && total ? ' · ₪' + Math.round(total).toLocaleString('en-US') : kind === 'wishlist' ? ' you love' : '');

    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    // As on the home page: the list's own pieces (their cut-outs) scattered in layers
    // at the foot of a light-grey hero, the words centred above them. Up to four
    // pieces; with none to show, the home page's four garments stand in.
    var seen = {}, pics = [];
    items.forEach(function (i) {
        if (!i || !i.cover || seen[i.cover] || pics.length >= 4) return;
        seen[i.cover] = 1; pics.push({ src: i.cover, name: i.name || '' });
    });
    var stand = !pics.length;
    if (stand) pics = ['unisex', 'men', 'kids', 'women'].map(function (g) { return { src: 'assets/hero/layer-' + g + '.webp?v=2', name: '' }; });
    var pile = pics.map(function (p, k) {
        return '<span class="lh-pc" style="--k:' + k + '"><img src="' + esc(p.src) + '" alt="' + esc(p.name) + '" decoding="async"></span>';
    }).join('');
    var hero = document.createElement('section');
    hero.className = 'lh-hero lh-light'; hero.id = 'lhHero';
    hero.innerHTML =
        '<div class="lh-copy"><div class="lh-eyebrow">' + esc(C.eyebrow) + '</div><h1 class="lh-title">' + esc(C.title) + '</h1><p class="lh-sub">' + esc(sub) + '</p></div>' +
        '<div class="lh-pile' + (stand ? ' is-garments' : '') + '" data-n="' + pics.length + '"><div class="lh-pile-in">' + pile + '</div></div>' +
        '<div class="lh-band"><p class="lh-rail-head">' + esc(C.rail) + '</p><div class="lh-rail" id="lhRail"></div></div>';
    wrap.parentNode.insertBefore(hero, wrap);
    document.documentElement.classList.add('has-lh', 'has-lh-light');
    // As on the home page: the search + filter row right under the hero (top of
    // .wrap), then the slider under it.
    var band = hero.querySelector('.lh-band'), controls = wrap.querySelector('.list-controls');
    if (controls && controls.nextSibling) wrap.insertBefore(band, controls.nextSibling); else wrap.insertBefore(band, wrap.firstChild);
    // The page header goes clear over the photo, solid once past it (page-header.js).
    var hdr = document.querySelector('.page-header');
    if (hdr) { hdr.classList.add('ph-overlay', 'ph-float'); hdr.setAttribute('data-hero', '#lhHero'); }

    // "You may also like": pieces not already in the list, best rated first (collections.js).
    function card(vc, p) {
        var d = vc.discountOf(p._raw) || {};
        var pct = d.onSale ? '<span class="lh-pct">-' + d.percent + '%</span>' : '';
        var inner = p.cover ? '<img src="' + esc(p.cover) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<span class="lh-card-emoji">' + esc(p.icon || '🛍️') + '</span>';
        var price = d.onSale ? '<span class="lh-was">' + vc.money(d.original) + '</span>' + vc.money(d.price) : vc.money(p.price);
        var data = JSON.stringify({ name: p.name, price: vc.toNum(d.onSale ? d.price : d.original), icon: p.icon, cover: p.cover || '', category: p.category || '', seller: p.seller });
        return '<a class="lh-card' + (d.onSale ? ' is-sale' : '') + '" href="product-showcase.html?product=' + esc(encodeURIComponent(data)) + '">' +
            '<div class="lh-card-img">' + pct + inner + '</div>' +
            '<div class="lh-cap"><div class="lh-brand">' + esc(p.seller || '') + '</div><div class="lh-name">' + esc(p.name) + '</div><div class="lh-price">' + price + '</div></div></a>';
    }
    function rail() {
        var vc = window.veroCollections; if (!vc) return false;
        var mine = {}; items.forEach(function (i) { if (i) { mine[i.id] = 1; mine[i.name] = 1; } });
        var list = (vc.allProducts() || []).filter(function (p) { return !mine[p.id] && !mine[p.name]; }).sort(function (a, b) {
            var ra = (a._raw && a._raw.rating) || 0, rb = (b._raw && b._raw.rating) || 0;
            return rb - ra || (b.createdAt || 0) - (a.createdAt || 0);
        }).slice(0, 10);
        var el = document.getElementById('lhRail');
        if (list.length) el.innerHTML = list.map(function (p) { return card(vc, p); }).join('');
        else { el.remove(); hero.querySelector('.lh-rail-head').remove(); }
        return true;
    }
    if (!rail()) {
        var s = document.createElement('script'); s.src = 'collections.js';
        s.onload = function () { rail(); };
        document.body.appendChild(s);
    }
})();
