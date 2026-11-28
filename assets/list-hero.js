/* ------------------------------------------------------------------
   moravchick — List hero for the cart and the wishlist (styles: assets/list-hero.css).
   Opens the page like the home page's hero: a light-grey ground with the last
   piece added to the list at its foot and the title and count centred above, then the page's own search, a "You may also like" slider and the list.

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
    // As on the home page: a light-grey hero with the words centred above a piece at
    // its foot: the last piece added to the list (new ones are added at the end)
    // that has a photo, as its cut-out. With none to show, the home page's four
    // garments stand in.
    var pics = [];
    for (var j = items.length - 1; j >= 0; j--) {
        if (items[j] && items[j].cover) { pics.push({ src: items[j].cover, name: items[j].name || '' }); break; }
    }
    // The cart: the hero is the last piece added, whatever it is: under the title,
    // the piece itself, then its details laid out as the home feed's promoted
    // slider (Editor's pick): the name, its facts, the description, the price,
    // its likes and the link to it.
    var last = null;
    if (kind === 'cart') for (var q = items.length - 1; q >= 0; q--) { if (items[q] && items[q].name) { last = items[q]; break; } }
    if (last) return lastHero(last);
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
        else { el.remove(); var hd = document.querySelector('#lhHero .lh-rail-head, .lh-rail-head'); if (hd) hd.remove(); }
        return true;
    }
    loadCollections(rail);

    function loadCollections(fn) {
        if (fn()) return;
        var s = document.createElement('script'); s.src = 'collections.js';
        s.onload = function () { fn(); };
        document.body.appendChild(s);
    }

    // ----- The cart's hero: the last piece added, with its details -----------
    function hash(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    // Likes: a steady count per piece (from its name + seller, until the backend
    // counts real ones), plus one when the viewer has it in their wishlist.
    function likesOf(p) {
        if (p.likes != null && !isNaN(+p.likes)) return +p.likes;
        var n = 24 + (hash((p.name || '') + '|' + (p.seller || '')) % 460), wish = [];
        try { wish = JSON.parse(localStorage.getItem('vero_wishlist')) || []; } catch (e) {}
        if (Array.isArray(wish) && wish.some(function (w) { return w && w.name === p.name && (w.seller || '') === (p.seller || ''); })) n++;
        return n;
    }
    // What the line under the name cycles through, as on the promoted slider.
    function factsOf(p) {
        var size = Array.isArray(p.size) ? p.size.join(' / ') : (p.size || '');
        var style = Array.isArray(p.style) ? p.style[0] : (p.style || '');
        return [p.seller || 'Vero Store', size && ('Size ' + size), style, p.fabric || p.material || '', p.category || ''].filter(Boolean);
    }
    function hrefOfItem(p) {
        var data = {};
        ['id', 'name', 'price', 'icon', 'cover', 'category', 'seller', 'rating', 'type', 'brand', 'fabric', 'material', 'color', 'size', 'condition', 'style', 'description', 'onSale', 'originalPrice']
            .forEach(function (k) { if (p[k] != null && p[k] !== '') data[k] = p[k]; });
        return 'product-showcase.html?product=' + encodeURIComponent(JSON.stringify(data));
    }
    function lastHero(it) {
        var num = function (v) { return Math.round(parseFloat(String(v == null ? 0 : v).replace(/[^\d.]/g, '')) || 0).toLocaleString('en-US'); };
        var href = esc(hrefOfItem(it));
        var piece = it.cover ? '<img src="' + esc(it.cover) + '" alt="' + esc(it.name) + '" decoding="async">'
                             : '<span class="lh-last-emoji" aria-hidden="true">' + esc(it.icon || '🛍️') + '</span>';
        var price = it.onSale && it.originalPrice ? '<s>' + num(it.originalPrice) + '₪</s> <b>' + num(it.price) + '₪</b>' : num(it.price) + '₪';
        var likes = likesOf(it);
        var hero = document.createElement('section');
        hero.className = 'lh-hero lh-light lh-last'; hero.id = 'lhHero';
        hero.innerHTML =
            '<div class="lh-copy"><div class="lh-eyebrow">' + esc(C.eyebrow) + '</div><h1 class="lh-title">' + esc(C.title) + '</h1><p class="lh-sub">' + esc(sub) + '</p></div>' +
            '<a class="lh-last-piece" href="' + href + '" aria-label="' + esc(it.name) + '">' + piece + '</a>' +
            '<article class="lh-last-info hm-ep">' +
                '<div class="hm-ep-head"><span class="hm-ep-k">Last added</span><span class="hm-ep-n">' + (n < 10 ? '0' : '') + n + '</span></div>' +
                '<div class="lh-last-text">' +
                    '<a class="hm-ep-name" href="' + href + '">' + esc(it.name) + '</a>' +
                    '<span class="hm-ep-by lh-last-rot" data-vals="' + esc(JSON.stringify(factsOf(it))) + '">' + esc(it.seller || 'Vero Store') + '</span>' +
                    '<p class="hm-ep-desc lh-last-desc"' + (it.description ? '' : ' hidden') + '>' + esc(it.description || '') + '</p>' +
                    '<div class="lh-last-row">' +
                        '<div class="hm-ep-price">' + price + '</div>' +
                        '<div class="lh-last-likes" aria-label="' + likes + ' likes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>' +
                            '<b>' + likes.toLocaleString('en-US') + '</b> ' + (likes === 1 ? 'like' : 'likes') + '</div>' +
                    '</div>' +
                    '<a class="hm-ep-more" href="' + href + '">See the piece <span aria-hidden="true">&rarr;</span></a>' +
                '</div>' +
            '</article>' +
            '<div class="lh-band"><p class="lh-rail-head">' + esc(C.rail) + '</p><div class="lh-rail" id="lhRail"></div></div>';
        wrap.parentNode.insertBefore(hero, wrap);
        document.documentElement.classList.add('has-lh', 'has-lh-light');
        var band = hero.querySelector('.lh-band'), controls = wrap.querySelector('.list-controls');
        if (controls && controls.nextSibling) wrap.insertBefore(band, controls.nextSibling); else wrap.insertBefore(band, wrap.firstChild);
        var hdr = document.querySelector('.page-header');
        if (hdr) { hdr.classList.add('ph-overlay', 'ph-float'); hdr.setAttribute('data-hero', '#lhHero'); }

        // The line under the name fades between the seller, size, style and fabric.
        var rot = hero.querySelector('.lh-last-rot'), ri = 0, rt = 0;
        function spin() {
            clearInterval(rt);
            var vals = []; try { vals = JSON.parse(rot.getAttribute('data-vals')) || []; } catch (e) {}
            if (vals.length < 2 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
            rt = setInterval(function () {
                rot.classList.add('is-out');
                setTimeout(function () { ri = (ri + 1) % vals.length; rot.textContent = vals[ri]; rot.classList.remove('is-out'); }, 380);
            }, 2600);
        }
        spin();

        // The slider, and the piece's fuller listing (description, size, style…) from
        // the catalogue when the cart line carries less.
        loadCollections(function () {
            var vc = window.veroCollections; if (!vc) return false;
            var full = (vc.allProducts() || []).filter(function (p) { return (it.id && p.id === it.id) || p.name === it.name; })[0];
            if (full) {
                var r = full._raw || full, merged = {};
                Object.keys(r).forEach(function (k) { merged[k] = r[k]; });
                Object.keys(it).forEach(function (k) { if (it[k] != null && it[k] !== '') merged[k] = it[k]; });
                if (!merged.seller) merged.seller = full.seller;
                var desc = hero.querySelector('.lh-last-desc');
                if (merged.description && desc.hidden) { desc.textContent = merged.description; desc.hidden = false; }
                rot.setAttribute('data-vals', JSON.stringify(factsOf(merged)));
                spin();
            }
            return rail();
        });
    }
})();
