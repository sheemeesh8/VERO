/* ============================================================================
 * wishlist-heart.js — injects a top-left "save to wishlist" heart onto product
 * cards as a pure overlay (no markup/layout changes), with the Uiverse/framer
 * "Like" bloom. Persists to vero_wishlist and reflects the saved state.
 * Pairs with wishlist-heart.css.
 * ==========================================================================*/
(function () {
    'use strict';

    var KEY = 'vero_wishlist';
    var COLORS = ['#f48ea7', '#cc8ef5', '#8ce8c3', '#91d2fa', '#f5a524', '#e5484d', '#9fc7fa'];
    var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>';

    function readJSON(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
    function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
    function txt(card, sel) { var e = card.querySelector(sel); return e ? e.textContent.trim() : ''; }

    function itemOf(card) {
        var raw = card.getAttribute('data-product');
        if (raw) { try { return JSON.parse(raw); } catch (e) { } }
        var priceTxt = (txt(card, '.vprice') || txt(card, '.cv-card-price') || txt(card, '.product-price')).replace(/[^\d.]/g, '');
        return {
            name: txt(card, '.cv-card-name') || txt(card, '.product-name') || card.getAttribute('data-name') || '',
            seller: txt(card, '.cv-card-brand') || txt(card, '.product-seller') || card.getAttribute('data-seller') || '',
            price: parseFloat(priceTxt) || parseFloat(card.getAttribute('data-price')) || 0
        };
    }
    function keyOf(it) {
        if (it == null) return '';
        if (it.id != null) return 'id:' + it.id;
        return (it.name || '') + '|' + (it.seller || '');
    }
    function indexOfItem(wish, it) {
        var k = keyOf(it);
        for (var i = 0; i < wish.length; i++) { if (keyOf(wish[i]) === k) return i; }
        return -1;
    }

    function bloom(card, btn) {
        var old = btn.querySelector('.vwish-burst');
        if (old) old.parentNode.removeChild(old);
        var burst = document.createElement('span');
        burst.className = 'vwish-burst';
        burst.setAttribute('aria-hidden', 'true');
        var html = '<span class="vwish-bloom"></span>';
        for (var k = 0; k < 7; k++) {
            var a = (k * (360 / 7) - 90);
            html += '<span class="vwish-spoke" style="--a:' + a + 'deg">' +
                        '<i style="--c:' + COLORS[k % 7] + '"></i>' +
                        '<i style="--c:' + COLORS[(k + 3) % 7] + '"></i>' +
                    '</span>';
        }
        burst.innerHTML = html;
        btn.appendChild(burst);

        card.classList.add('vwish-anim');        // lift the card clip for the burst
        btn.classList.remove('wish-pop');
        void btn.offsetWidth;
        btn.classList.add('wish-pop');

        setTimeout(function () {
            if (burst.parentNode) burst.parentNode.removeChild(burst);
            btn.classList.remove('wish-pop');
            card.classList.remove('vwish-anim');
        }, 950);
    }

    function toggle(card, btn) {
        var it = itemOf(card);
        var wish = readJSON(KEY, []);
        if (!Array.isArray(wish)) wish = [];
        var idx = indexOfItem(wish, it);
        var added;
        if (idx === -1) { wish.push(it); added = true; }
        else { wish.splice(idx, 1); added = false; }
        writeJSON(KEY, wish);
        btn.classList.toggle('wish-on', added);
        btn.setAttribute('aria-pressed', added ? 'true' : 'false');
        if (added) bloom(card, btn);
        if (typeof window.toast === 'function') { try { window.toast(added ? 'Added to wishlist' : 'Removed from wishlist'); } catch (e) { } }
    }

    function addHeart(card) {
        if (!card || card.dataset.vwish) return;
        if (card.classList.contains('cart-item')) return;         // skip cart/wishlist select cards
        // only real product cards (must have an image container and a name)
        if (!card.querySelector('.cv-card-img, .product-image')) return;
        if (!card.querySelector('.cv-card-name, .product-name')) return;
        card.dataset.vwish = '1';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'vwish';
        btn.setAttribute('aria-label', 'Add to wishlist');
        btn.innerHTML = HEART;
        btn.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            toggle(card, btn);
        });
        card.appendChild(btn);

        var wish = readJSON(KEY, []);
        if (Array.isArray(wish) && indexOfItem(wish, itemOf(card)) !== -1) {
            btn.classList.add('wish-on');
            btn.setAttribute('aria-pressed', 'true');
        }
    }

    function scan(root) {
        var scope = (root && root.querySelectorAll) ? root : document;
        [].forEach.call(scope.querySelectorAll('.cv-card, .product-card'), addHeart);
    }
    window.veroWishScan = scan;

    function start() {
        scan(document);
        try {
            new MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    var nodes = muts[i].addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        var n = nodes[j];
                        if (n.nodeType !== 1) continue;
                        if (n.classList && (n.classList.contains('cv-card') || n.classList.contains('product-card'))) addHeart(n);
                        else if (n.querySelectorAll) scan(n);
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        } catch (e) { }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
