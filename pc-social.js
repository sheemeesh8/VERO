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

    // Size and stroke are set on the element too, so even with no stylesheet at
    // all the icons stay small outline marks.
    function ico(d) {
        return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#5b5750" ' +
               'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
    }

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

    // The row's own styles travel with the script: if a browser holds an older
    // product-card.css, the row still renders right (never as bare black icons).
    //
    // The row sits inside the card, on the copy template's fourth row under the
    // name, "spread": the three marks run across the copy's width, the first
    // and last flush with the two ends of the hairline rule. The piece's field
    // gives up one row of height for it.
    var CSS = [
        '.product-card { --pc-stats-h: 20px; }',
        '.product-card:has(.pc-stats) .product-image {',
        '    inset: 0 0 calc(var(--foot-h) + var(--pc-stats-h)) 0;',
        '}',
        '.product-card .product-info .pc-stats {',
        '    grid-area: 4 / 1 / 5 / -1;',
        '    margin: 6px 0 0;',
        '    padding: 0;',
        '    display: flex;',
        '    justify-content: space-between;',
        '    align-items: center;',
        '    direction: ltr;',
        '}',
        '.pc-stats span {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 3px;',
        '    font-family: \'Oswald\', \'Segoe UI\', Helvetica, Arial, sans-serif !important;',
        '    font-size: 10px;',
        '    font-weight: 300;',
        '    letter-spacing: 0.3px;',
        '    line-height: 1;',
        '    color: #5b5750;',
        '}',
        '.pc-stats svg {',
        '    width: 12px;',
        '    height: 12px;',
        '    flex: none;',
        '    fill: none;',
        '    stroke: #5b5750;',
        '    stroke-width: 1.6 !important;',
        '    stroke-linecap: round;',
        '    stroke-linejoin: round;',
        '}'
    ].join('\n');
    function injectCSS() {
        if (document.getElementById('pc-social-css')) return;
        var st = document.createElement('style');
        st.id = 'pc-social-css';
        st.textContent = CSS;
        (document.head || document.documentElement).appendChild(st);
    }
    injectCSS();

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
