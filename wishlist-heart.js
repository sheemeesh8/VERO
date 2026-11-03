/* ============================================================================
 * wishlist-heart.js — the top-left "save to wishlist" heart on product cards.
 * A vanilla take on the Uiverse/framer "Like" bloom: press the heart and a red
 * disc blooms and hollows, seven spokes of coloured confetti burst out, and the
 * heart springs back in red past its size. It also persists to vero_wishlist and
 * reflects the saved state on every card (filled red heart when already saved).
 * Pairs with wishlist-heart.css.
 * ==========================================================================*/
(function () {
    'use strict';

    var KEY = 'vero_wishlist';
    var COLORS = ['#f48ea7', '#cc8ef5', '#8ce8c3', '#91d2fa', '#f5a524', '#e5484d', '#9fc7fa'];

    function readJSON(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
    function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

    function itemOf(card) {
        var raw = card.getAttribute('data-product');
        if (raw) { try { return JSON.parse(raw); } catch (e) { } }
        return {
            name: card.getAttribute('data-name') || '',
            seller: card.getAttribute('data-seller') || '',
            price: parseFloat(card.getAttribute('data-price')) || 0,
            icon: card.getAttribute('data-icon') || '',
            cover: card.getAttribute('data-cover') || ''
        };
    }
    function keyOf(it) {
        if (it == null) return '';
        if (it.id != null) return 'id:' + it.id;
        return (it.name || '') + '|' + (it.seller || '') + '|' + (it.price != null ? it.price : '');
    }
    function indexOfItem(wish, it) {
        var k = keyOf(it);
        for (var i = 0; i < wish.length; i++) { if (keyOf(wish[i]) === k) return i; }
        return -1;
    }

    function bloom(btn) {
        var old = btn.querySelector('.wish-burst');
        if (old) old.parentNode.removeChild(old);

        var burst = document.createElement('span');
        burst.className = 'wish-burst';
        burst.setAttribute('aria-hidden', 'true');
        var html = '<span class="wish-bloom"></span>';
        for (var k = 0; k < 7; k++) {
            var a = (k * (360 / 7) - 90);
            html += '<span class="wish-spoke" style="--a:' + a + 'deg">' +
                        '<i style="--c:' + COLORS[k % 7] + '"></i>' +
                        '<i style="--c:' + COLORS[(k + 3) % 7] + '"></i>' +
                    '</span>';
        }
        burst.innerHTML = html;
        btn.appendChild(burst);

        btn.classList.remove('wish-pop');
        void btn.offsetWidth;          // restart the spring animation
        btn.classList.add('wish-pop');

        setTimeout(function () {
            if (burst.parentNode) burst.parentNode.removeChild(burst);
            btn.classList.remove('wish-pop');
        }, 950);
    }

    window.veroWishHeart = function (btn, ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        var card = btn.closest('.product-card');
        if (!card) return;
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
        if (added) bloom(btn);
        if (typeof window.toast === 'function') {
            try { window.toast(added ? 'Added to wishlist' : 'Removed from wishlist'); } catch (e) { }
        }
    };

    // Reflect the saved state on cards (filled red heart when already saved).
    function markCard(card) {
        var btn = card.querySelector ? card.querySelector('.pc-front-heart') : null;
        if (!btn || btn.dataset.wmark) return;
        btn.dataset.wmark = '1';
        var wish = readJSON(KEY, []);
        if (Array.isArray(wish) && indexOfItem(wish, itemOf(card)) !== -1) {
            btn.classList.add('wish-on');
            btn.setAttribute('aria-pressed', 'true');
        }
    }
    function scan(root) {
        var scope = (root && root.querySelectorAll) ? root : document;
        var cards = scope.querySelectorAll('.product-card');
        [].forEach.call(cards, markCard);
    }
    window.veroWishScan = scan;

    function start() {
        scan(document);
        try {
            var obs = new MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    var nodes = muts[i].addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        var n = nodes[j];
                        if (n.nodeType !== 1) continue;
                        if (n.classList && n.classList.contains('product-card')) markCard(n);
                        else if (n.querySelectorAll) scan(n);
                    }
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        } catch (e) { }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
