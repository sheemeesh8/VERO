/* ------------------------------------------------------------------
   VERO — product-card foot layout.

   One source for the card's new foot, applied to every product card on
   every page (the file is already loaded site-wide). Per card it:
     • lifts the price node into the image field's top-right corner,
     • injects the SIZE mark in the top-left corner (demo value until the
       backend tracks real dimensions — steady per piece, from its name),
     • injects the wishlist heart where the price used to sit; a tap fills
       it solid black and records the piece in vero_wishlist.
   The cart icon is dropped from the card face in product-card.css.

   Draft cards are skipped — a draft is not listed yet.
------------------------------------------------------------------ */
(function () {
    function hash(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }

    // A steady demo size for a piece, derived from its name + seller so it
    // reads the same on every page and every render. Replace with the real
    // dimensions once the product carries them (data-size / prod.size).
    function demoSize(name, seller) {
        var h = hash((name || '') + '|' + (seller || ''));
        var w = 40 + (h % 160);                 // 40–199
        var d = 30 + ((h >>> 8) % 90);          // 30–119
        return w + '×' + d + ' cm';
    }

    var HEART = '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>';

    function readJSON(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
    function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    function text(card, sel) { var el = card.querySelector(sel); return el ? el.textContent.trim() : ''; }

    function sizeOf(card) {
        var d = card.dataset || {};
        if (d.size) return d.size;
        try { if (d.product) { var p = JSON.parse(d.product) || {}; if (p.size) return p.size; } } catch (e) {}
        return demoSize(d.name || text(card, '.product-name') || card.getAttribute('title') || '',
                        d.seller || text(card, '.product-seller'));
    }

    function wishKey(card) {
        var d = card.dataset || {};
        return (d.name || text(card, '.product-name') || card.getAttribute('title') || '') + '|' +
               (d.seller || text(card, '.product-seller'));
    }
    function isSaved(card) {
        var wish = readJSON('vero_wishlist', []);
        if (!Array.isArray(wish)) return false;
        var key = wishKey(card);
        return wish.some(function (w) { return w && (w.name + '|' + (w.seller || '')) === key; });
    }
    function toggleSave(card, btn) {
        var wish = readJSON('vero_wishlist', []);
        if (!Array.isArray(wish)) wish = [];
        var d = card.dataset || {};
        var name = d.name || text(card, '.product-name') || card.getAttribute('title') || 'Item';
        var seller = d.seller || text(card, '.product-seller') || '';
        var key = name + '|' + seller;
        var idx = wish.findIndex(function (w) { return w && (w.name + '|' + (w.seller || '')) === key; });
        if (idx === -1) {
            wish.push({ name: name, seller: seller, icon: d.icon || '🛍️', cover: d.cover || '',
                        price: parseFloat(d.price) || 0, addedAt: Date.now() });
            btn.classList.add('saved');
        } else {
            wish.splice(idx, 1);
            btn.classList.remove('saved');
        }
        writeJSON('vero_wishlist', wish);
    }

    function decorate(card) {
        if (card.classList.contains('draft-card')) return;
        if (card.dataset.pcFoot === '1') return;
        card.dataset.pcFoot = '1';

        var image = card.querySelector('.product-image');
        var info = card.querySelector('.product-info');
        if (!image) return;

        // VC.cardHTML flip cards (.pc-e, used by the feed-style grids) build
        // their own foot — leave them exactly as they are.
        if (card.classList.contains('pc-e')) return;

        // Editorial foot (matches the home feed's .cv-card): the price belongs
        // in the footer beside the name, not floated in the image corner. Keep
        // it in .product-info; no size mark and no front wishlist heart — the
        // feed card carries neither (wishlist lives on the product page).
    }

    function fill(root) {
        if (!root || !root.querySelectorAll) return;
        if (root.matches && root.matches('.product-card')) decorate(root);
        Array.prototype.forEach.call(root.querySelectorAll('.product-card'), decorate);
    }

    // Kept as safe stubs for any page that still calls these.
    window.veroSocialStats = function () { return {}; };
    window.veroSocialHTML = function () { return ''; };
    window.veroSocialFill = fill;

    function start() {
        fill(document.body);
        new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var added = muts[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    if (added[j].nodeType === 1) fill(added[j]);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
