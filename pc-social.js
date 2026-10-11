/* ------------------------------------------------------------------
   VERO — social proof on the product card (feed option 8h).

   ONE source for the third copy row every product card carries: saves ·
   offers · views as outline icons, under the product name. Load it next to
   product-card.css on any page that shows product cards:

     <link rel="stylesheet" href="product-card.css">
     <script src="pc-social.js"></script>

   Renderers may emit the row themselves with veroSocialHTML(prod); any card
   that reaches the page without one gets it added here, so a page needs no
   changes of its own. Draft cards are skipped — a draft is not listed yet.

   A product's own counts (saves / likes, offers, views) are used when it
   carries them. Until the backend tracks these, steady demo figures are
   derived from the product's name + seller, so a piece shows the same
   numbers on every page and every render.
------------------------------------------------------------------ */
(function () {
    function hash(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }

    function stats(prod) {
        prod = prod || {};
        var h = hash((prod.name || '') + '|' + (prod.seller || ''));
        var saves = prod.saves != null ? prod.saves : prod.likes != null ? prod.likes : (h % 96) + 4;
        var offers = prod.offers != null ? prod.offers : Math.floor(saves / 9) + ((h >>> 8) % 3);
        var views = prod.views != null ? prod.views : saves * (4 + ((h >>> 12) % 5)) + ((h >>> 16) % 40);
        return { saves: saves, offers: offers, views: views };
    }

    function ico(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }

    function html(prod) {
        var s = stats(prod);
        return '<div class="pc-stats">' +
            '<span title="Saves">' + ico('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>') + s.saves + '</span>' +
            '<span title="Offers">' + ico('<path d="M4 5h16v11H9l-5 4V5z"/>') + s.offers + '</span>' +
            '<span title="Views">' + ico('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>') + s.views + '</span>' +
            '</div>';
    }

    // Read the product off a card that was rendered without the row.
    function prodOf(card) {
        var d = card.dataset || {};
        var p = {};
        try { if (d.product) p = JSON.parse(d.product) || {}; } catch (e) { p = {}; }
        var text = function (sel) { var el = card.querySelector(sel); return el ? el.textContent.trim() : ''; };
        return {
            name: p.name || d.name || text('.product-name') || card.getAttribute('title') || '',
            seller: p.seller || d.seller || text('.product-seller'),
            saves: p.saves, likes: p.likes, offers: p.offers, views: p.views
        };
    }

    function fill(root) {
        if (!root || !root.querySelectorAll) return;
        var cards = root.matches && root.matches('.product-card') ? [root] : [];
        cards = cards.concat(Array.prototype.slice.call(root.querySelectorAll('.product-card')));
        cards.forEach(function (card) {
            if (card.classList.contains('draft-card')) return;
            var info = card.querySelector('.product-info');
            if (!info || info.querySelector('.pc-stats')) return;
            info.insertAdjacentHTML('beforeend', html(prodOf(card)));
        });
    }

    window.veroSocialStats = stats;
    window.veroSocialHTML = html;
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
