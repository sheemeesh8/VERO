/* ============================================================================
   card-flip.js — press and hold a product card to flip it over.

   On the shop pages (home feed, collections and sales, the product page's
   "more like this", a seller's store) a long press (~0.45s) on a product card
   turns it over like a real card; its back carries two buttons: Add to bag and
   Add to wishlist. A tap anywhere else (or on the back itself) turns it back.
   A normal tap still opens the product.

   Not loaded in the personal area or the seller pages.
   Cart / wishlist entries use the same shape as the product page
   (id = "name|price"), so they show up in the bag and the wishlist as usual.
   ========================================================================== */
(function veroCardFlip() {
    'use strict';
    if (window.__veroCardFlip) return;
    window.__veroCardFlip = true;

    var HOLD = 450, MOVE_TOL = 10, HOLD_MS = 48 * 60 * 60 * 1000;
    var SCOPE = '.product-card';
    var SKIP = '.cart-item, .draft-card, [data-no-flip]';
    var REDUCE = false; try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    /* ---- styles ---- */
    var css = document.createElement('style');
    css.id = 'vero-card-flip-css';
    css.textContent =
        '.cf-card{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;}' +
        '.cf-card img{-webkit-user-drag:none;}' +
        // The turn is played in two halves (to edge-on, swap faces, back to flat), so at
        // rest the back is a plain flat layer that takes taps like anything else.
        '.cf-ready{position:relative;}' +
        '.cf-ready.cf-press:not(.cf-flipped){scale:.97;transition:scale .45s ease;}' +
        '.cf-ready.cf-flipped>*:not(.cf-back){visibility:hidden;}' +
        '.cf-back{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;align-items:stretch;justify-content:center;gap:10px;' +
            'padding:16px 14px;background:#F2F2F2;color:#111;text-align:center;cursor:default;}' +
        '.cf-ready.cf-flipped>.cf-back{display:flex;}' +
        '.cf-back .cf-n{font:300 13px/1.25 Raleway,Inter,sans-serif;letter-spacing:.3px;text-transform:uppercase;overflow:hidden;' +
            'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}' +
        '.cf-back .cf-p{font:600 13px Poppins,Inter,sans-serif;margin:-4px 0 6px;}' +
        '.cf-back .cf-b:focus{outline:none;}.cf-back .cf-b{display:flex;align-items:center;justify-content:center;gap:8px;height:40px;border:1px solid #111;border-radius:999px;' +
            'background:#fff;color:#111;font:500 10px Raleway,Inter,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;padding:0 10px;}' +
        '.cf-back .cf-b.dk{background:#111;color:#fff;}' +
        '.cf-back .cf-b svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none;}' +
        '.cf-back .cf-b.on svg{fill:currentColor;}' +
        '.cf-back .cf-x{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;background:none;color:#6b665c;font-size:18px;line-height:1;cursor:pointer;}' +
        '.cf-toast{position:fixed;left:50%;bottom:calc(26px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#111;color:#fff;' +
            'font:500 12px/1.2 Raleway,Inter,sans-serif;letter-spacing:.3px;padding:12px 18px;border-radius:999px;z-index:9999;opacity:0;' +
            'transition:opacity .2s;pointer-events:none;white-space:nowrap;}' +
        '@media (prefers-reduced-motion:reduce){.cf-ready{transition:none;}}';
    (document.head || document.documentElement).appendChild(css);
    // The site squares every corner; the buttons on the back stay round.
    var round = document.createElement('style');
    round.textContent = 'html:not(#cf0):not(#cf1):not(#cf2):not(#cf3):not(#cf4):not(#cf5) .cf-back .cf-b,' +
        'html:not(#cf0):not(#cf1):not(#cf2):not(#cf3):not(#cf4):not(#cf5) .cf-toast{border-radius:999px !important;}';
    (document.head || document.documentElement).appendChild(round);

    /* ---- data ---- */
    function readJSON(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
    function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; }
    function text(card, sel) { var e = card.querySelector(sel); return e ? e.textContent.trim() : ''; }

    // What the card is: from its data-* attributes, else from the product carried in its link.
    function itemOf(card) {
        var p = {};
        try { if (card.dataset.product) p = JSON.parse(card.dataset.product); } catch (e) {}
        if (!p.name) {
            try { var href = card.getAttribute('href') || ''; var raw = new URL(href, location.href).searchParams.get('product'); if (raw) p = JSON.parse(raw); } catch (e) {}
        }
        var name = card.dataset.name || p.name || text(card, '.product-name') || card.getAttribute('title') || 'Item';
        var price = num(card.dataset.price) || num(p.price) || num(text(card, '.vprice')) || num(text(card, '.product-price'));
        return {
            id: name + '|' + price, name: name, price: price,
            seller: card.dataset.seller || p.seller || text(card, '.product-seller') || '',
            icon: card.dataset.icon || p.icon || '🛍️', cover: card.dataset.cover || p.cover || '',
            category: p.category || '', type: p.type || '', rating: p.rating || 4.5
        };
    }
    function inWish(it) { return (readJSON('vero_wishlist', []) || []).some(function (w) { return w && (w.id === it.id || (w.name === it.name && w.seller === it.seller)); }); }
    function badges() {
        var cart = readJSON('vero_cart', []) || [], wish = readJSON('vero_wishlist', []) || [];
        var nCart = cart.reduce(function (s, c) { return s + (Number(c && c.qty) || 1); }, 0), nWish = wish.length;
        [['cartBadge', nCart], ['cartMenuBadge', nCart], ['drawerCartBadge', nCart], ['wishlistBadge', nWish], ['wishMenuBadge', nWish], ['drawerWishBadge', nWish]]
            .forEach(function (b) { var el = document.getElementById(b[0]); if (el) { el.textContent = b[1]; el.classList.toggle('show', b[1] > 0); } });
        if (typeof window.updateBadges === 'function') { try { window.updateBadges(); } catch (e) {} }
    }
    function toast(msg) {
        var t = document.createElement('div'); t.className = 'cf-toast'; t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.style.opacity = '1'; });
        setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 250); }, 1500);
    }
    function addToBag(it) {
        var cart = readJSON('vero_cart', []); if (!Array.isArray(cart)) cart = [];
        var now = Date.now(), ex = cart.find(function (c) { return c && c.id === it.id; });
        if (ex) { ex.qty = (Number(ex.qty) || 1) + 1; ex.addedAt = now; ex.expiresAt = now + HOLD_MS; }
        else cart.push({ id: it.id, name: it.name, price: it.price, seller: it.seller, icon: it.icon, cover: it.cover,
            category: it.category, type: it.type, rating: it.rating, qty: 1, addedAt: now, expiresAt: now + HOLD_MS });
        writeJSON('vero_cart', cart); badges(); toast('Added to bag');
    }
    function toggleWish(it) {
        var wl = readJSON('vero_wishlist', []); if (!Array.isArray(wl)) wl = [];
        var i = wl.findIndex(function (w) { return w && (w.id === it.id || (w.name === it.name && w.seller === it.seller)); });
        if (i >= 0) { wl.splice(i, 1); writeJSON('vero_wishlist', wl); badges(); toast('Removed from wishlist'); return false; }
        wl.push({ id: it.id, name: it.name, price: it.price, seller: it.seller, icon: it.icon, cover: it.cover,
            category: it.category, type: it.type, rating: it.rating, addedAt: Date.now() });
        writeJSON('vero_wishlist', wl); badges(); toast('Added to wishlist'); return true;
    }

    /* ---- the back ---- */
    var BAG = '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>';
    var HEART = '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function backOf(card) {
        var it = itemOf(card), back = card.querySelector(':scope > .cf-back');
        if (!back) { back = document.createElement('div'); back.className = 'cf-back'; card.appendChild(back); }
        var w = inWish(it);
        back.innerHTML = '<button type="button" class="cf-x" data-cf="close" aria-label="Turn back">×</button>' +
            '<div class="cf-n">' + esc(it.name) + '</div>' + (it.price ? '<div class="cf-p">₪' + Math.round(it.price).toLocaleString('en-US') + '</div>' : '') +
            '<button type="button" class="cf-b dk" data-cf="bag">' + BAG + 'Add to bag</button>' +
            '<button type="button" class="cf-b' + (w ? ' on' : '') + '" data-cf="wish">' + HEART + (w ? 'In wishlist' : 'Add to wishlist') + '</button>';
        return back;
    }

    /* ---- press and hold ---- */
    var timer = null, pressCard = null, x0 = 0, y0 = 0, suppressClick = false, flipped = null;
    function eligible(el) {
        var card = el && el.closest ? el.closest(SCOPE) : null;
        if (!card || card.closest(SKIP) || card.matches(SKIP)) return null;
        return card;
    }
    function prep(card) {
        if (!card.classList.contains('cf-ready')) {
            card.classList.add('cf-ready', 'cf-card');
            if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
        }
    }
    var P = 'perspective(1100px) ';
    // Turn the card to edge-on, swap which face shows, turn it flat again.
    function turn(card, toBack) {
        if (card.__cfAnim) { try { card.__cfAnim.cancel(); } catch (e) {} }
        var swap = function () { card.classList.toggle('cf-flipped', toBack); };
        if (REDUCE || !card.animate) { swap(); return; }
        var a = card.__cfAnim = card.animate([{ transform: P + 'rotateY(0deg)' }, { transform: P + 'rotateY(' + (toBack ? 90 : -90) + 'deg)' }],
            { duration: 230, easing: 'cubic-bezier(.55,0,.8,.4)' });
        a.onfinish = function () {
            swap();
            card.__cfAnim = card.animate([{ transform: P + 'rotateY(' + (toBack ? -90 : 90) + 'deg)' }, { transform: P + 'rotateY(0deg)' }],
                { duration: 300, easing: 'cubic-bezier(.2,.7,.3,1)' });
        };
    }
    function flip(card) {
        if (flipped && flipped !== card) unflip(flipped);
        prep(card); backOf(card);
        card.classList.remove('cf-press');
        flipped = card;
        turn(card, true);
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    }
    function unflip(card) {
        if (!card) return;
        card.classList.remove('cf-press');
        if (flipped === card) flipped = null;
        if (card.classList.contains('cf-flipped')) turn(card, false);
    }
    function cancel() { clearTimeout(timer); timer = null; if (pressCard) pressCard.classList.remove('cf-press'); pressCard = null; }

    document.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        // A button on the back must not take focus: focusing inside the turned card
        // makes the browser scroll the page to "reveal" it.
        if (e.target.closest && e.target.closest('.cf-back')) { e.preventDefault(); return; }
        var card = eligible(e.target);
        if (flipped && (!card || card !== flipped)) unflip(flipped);
        if (!card || card === flipped || card.classList.contains('cf-flipped')) return;
        prep(card);
        pressCard = card; x0 = e.clientX; y0 = e.clientY;
        clearTimeout(timer);
        if (!REDUCE) card.classList.add('cf-press');
        timer = setTimeout(function () { timer = null; suppressClick = true; flip(card); pressCard = null; }, HOLD);
    }, true);
    document.addEventListener('pointermove', function (e) {
        if (timer && (Math.abs(e.clientX - x0) > MOVE_TOL || Math.abs(e.clientY - y0) > MOVE_TOL)) cancel();
    }, true);
    document.addEventListener('pointerup', function () { if (timer) cancel(); }, true);
    document.addEventListener('pointercancel', cancel, true);
    window.addEventListener('scroll', function () { if (timer) cancel(); }, { passive: true, capture: true });
    // No browser long-press menu or image drag on the cards.
    document.addEventListener('contextmenu', function (e) { if (eligible(e.target)) e.preventDefault(); }, true);
    document.addEventListener('dragstart', function (e) { if (eligible(e.target)) e.preventDefault(); }, true);

    // Clicks: the one that ends a long press does nothing; on a flipped card the
    // buttons act and anything else turns it back — never following the link.
    document.addEventListener('click', function (e) {
        var card = eligible(e.target);
        if (suppressClick) { suppressClick = false; if (card) { e.preventDefault(); e.stopPropagation(); return; } }
        if (!card || (card !== flipped && !card.classList.contains('cf-flipped'))) return;
        e.preventDefault(); e.stopPropagation();
        var b = e.target.closest('[data-cf]'), act = b && b.getAttribute('data-cf');
        var it = itemOf(card);
        if (act === 'bag') { addToBag(it); setTimeout(function () { unflip(card); }, 650); }
        else if (act === 'wish') { var on = toggleWish(it); backOf(card); if (on) setTimeout(function () { unflip(card); }, 650); }
        else unflip(card);
    }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && flipped) unflip(flipped); });
})();
