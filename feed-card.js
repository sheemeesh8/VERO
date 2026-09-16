/* ============================================================================
   feed-card.js — the press-and-hold interaction for the feed-style cards on the
   Sale and Collection pages (paired with feed-card.css). Hold a card ~0.5s to
   reveal the frosted-glass back with the wishlist + cart icons; tap an icon to
   add the item. A normal tap still follows the card's link.

   Scoped to .prod-grid / .sale-slider so the home feed (its own renderer in
   index.html) is untouched.
   ========================================================================== */
(function veroFeedCards() {
    'use strict';
    var HOLD = 480, MOVE_TOL = 12;
    var SCOPE = '.prod-grid .product-card, .sale-slider .product-card';

    var timer = null, held = false, startX = 0, startY = 0, openCard = null;

    function readJSON(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
    function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    function toast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);' +
            'background:#111;color:#fff;font:600 12px/1.2 Oswald,Segoe UI,sans-serif;letter-spacing:.4px;' +
            'padding:12px 18px;border-radius:999px;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none;';
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.style.opacity = '1'; });
        setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 250); }, 1400);
    }

    function itemFrom(card) {
        return {
            name: card.dataset.name || card.getAttribute('title') || 'פריט',
            seller: card.dataset.seller || '',
            icon: card.dataset.icon || '🛍️',
            cover: card.dataset.cover || '',
            price: parseFloat(card.dataset.price) || 0,
            qty: 1,
            addedAt: Date.now()
        };
    }

    function addToCart(card) {
        var cart = readJSON('vero_cart', []);
        if (!Array.isArray(cart)) cart = [];
        cart.push(itemFrom(card));
        writeJSON('vero_cart', cart);
        toast('נוסף לעגלה');
    }
    function toggleWishlist(card, btn) {
        var wish = readJSON('vero_wishlist', []);
        if (!Array.isArray(wish)) wish = [];
        var it = itemFrom(card);
        var idx = wish.findIndex(function (w) { return w && w.name === it.name && w.seller === it.seller; });
        if (idx === -1) { wish.push(it); btn.classList.add('wish-on'); toast('נוסף לרשימת המשאלות'); }
        else { wish.splice(idx, 1); btn.classList.remove('wish-on'); toast('הוסר מרשימת המשאלות'); }
        writeJSON('vero_wishlist', wish);
    }

    function closeOpen() {
        if (openCard) { openCard.classList.remove('showback'); openCard = null; }
    }
    function cardAt(t) { return t && t.closest ? t.closest(SCOPE) : null; }

    document.addEventListener('pointerdown', function (e) {
        var card = cardAt(e.target);
        if (!card) { closeOpen(); return; }
        // Tapping an icon on an already-open card is handled in click.
        if (e.target.closest('[data-action]')) return;
        held = false; startX = e.clientX; startY = e.clientY;
        clearTimeout(timer);
        timer = setTimeout(function () {
            timer = null; held = true;
            closeOpen();
            card.classList.add('showback');
            openCard = card;
            try { if (navigator.vibrate) navigator.vibrate(15); } catch (e2) {}
        }, HOLD);
    }, true);

    document.addEventListener('pointermove', function (e) {
        if (timer && (Math.abs(e.clientX - startX) > MOVE_TOL || Math.abs(e.clientY - startY) > MOVE_TOL)) {
            clearTimeout(timer); timer = null;
        }
    }, true);

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        document.addEventListener(ev, function () { clearTimeout(timer); timer = null; }, true);
    });

    // Intercept clicks: icon taps act; a hold-open card swallows the nav.
    document.addEventListener('click', function (e) {
        var actionBtn = e.target.closest ? e.target.closest('[data-action]') : null;
        if (actionBtn) {
            var card = cardAt(actionBtn);
            if (card) {
                e.preventDefault(); e.stopPropagation();
                if (actionBtn.dataset.action === 'cart') addToCart(card);
                else toggleWishlist(card, actionBtn);
                return;
            }
        }
        var c = cardAt(e.target);
        if (held) { held = false; e.preventDefault(); e.stopPropagation(); return; }   // the hold already flipped it
        if (c && c.classList.contains('showback')) {   // open card: a plain tap closes it, no nav
            e.preventDefault(); e.stopPropagation(); c.classList.remove('showback'); openCard = null; return;
        }
        if (!c) closeOpen();
    }, true);
})();
