/* ------------------------------------------------------------------
   VERO — seller edits and sale prices.

   ONE store for every change a seller makes to a piece they listed: an
   edited field, or a discount. Every surface that draws a product reads
   through here — the feed, the category pages, the promoted sliders, the
   personal area, the seller area and the product page — so a discount set
   once shows up everywhere, in the same shape.

   RULE: never format a sale price by hand in a page. Call veroPriceHTML()
   (or veroApplyOverride() when you need the numbers) so the struck-through
   original and the sale colour stay identical across the site.

   Usage:
     <script src="product-overrides.js"></script>   (before the page's own JS)

   Shape stored under localStorage['vero_overrides']:
     { "<key>": { name, category, desc, price, salePrice, saleAt } }
   where <key> is name|seller — the pair a page can always rebuild from a
   card, since neither the feed nor the seller area carries a real id yet.
------------------------------------------------------------------ */
(function () {
    const KEY = 'vero_overrides';
    // A sale badges the card for a week from the moment it was set.
    const SALE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

    function readAll() {
        try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
        catch (e) { return {}; }          // malformed store — treat as empty
    }

    function writeAll(map) {
        try { localStorage.setItem(KEY, JSON.stringify(map)); return true; }
        catch (e) { return false; }       // storage full or blocked
    }

    // The identity of a piece across pages. Falls back to the name alone so a
    // card without a seller still resolves to something stable.
    function keyOf(p) {
        if (!p) return '';
        return `${(p.name || '').trim()}|${(p.seller || p.brand || '').trim()}`;
    }

    // "₪120.00" / 120 / "120" → 120
    function toNum(v) {
        if (typeof v === 'number') return v;
        const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    function money(n) {
        return '₪' + Number(n).toFixed(2);
    }

    // A product with its seller's edits folded in. Returns a copy — callers
    // render from it without mutating the catalogue behind them.
    function apply(p) {
        const o = readAll()[keyOf(p)] || {};
        const merged = { ...p };
        ['name', 'category', 'desc', 'seller'].forEach(f => {
            if (o[f] != null && o[f] !== '') merged[f] = o[f];
        });
        if (o.price != null) merged.price = money(toNum(o.price));

        // A seller's own discount (the override) wins; otherwise a sale seeded on
        // the product itself in the base catalogue is honoured too. Either way the
        // rest of the site draws the sale identically.
        const salePrice = o.salePrice != null ? o.salePrice : p.salePrice;
        const saleAt    = o.salePrice != null ? o.saleAt    : p.saleAt;
        const sale = salePrice != null && toNum(salePrice) > 0;
        if (sale) {
            merged.originalPrice = merged.price;       // what it was before the cut
            merged.price = money(toNum(salePrice));
            merged.onSale = true;
            // The green frame is a "new sale" marker, not the sale itself: it
            // lapses after a week even though the price stays cut.
            merged.saleFresh = Date.now() - (saleAt || 0) < SALE_WINDOW_MS;
        } else {
            merged.onSale = false;
            merged.saleFresh = false;
        }
        return merged;
    }

    // The price block, identical on a card and on the product page: the sale
    // price, with the old one struck through above it.
    function priceHTML(p) {
        const m = apply(p);
        if (!m.onSale) return `<span class="vprice">${m.price}</span>`;
        // How much came off, worked out from the two figures the card already
        // holds — the card corner shows it, and nothing has to store it.
        const was = toNum(m.originalPrice), now = toNum(m.price);
        const off = was > 0 ? Math.round((1 - now / was) * 100) : 0;
        return `<span class="vprice-wrap">` +
               (off > 0 ? `<span class="vprice-off">-${off}%</span>` : '') +
               `<span class="vprice-was">${m.originalPrice}</span>` +
               `<span class="vprice vprice-sale">${m.price}</span>` +
               `</span>`;
    }

    // Class list for the card element, so the green frame is applied the same
    // way everywhere.
    function cardClass(p) {
        const m = apply(p);
        return (m.onSale ? ' is-sale' : '') + (m.saleFresh ? ' is-sale-new' : '');
    }

    function save(p, patch) {
        const map = readAll();
        const k = keyOf(p);
        const prev = map[k] || {};
        const next = { ...prev, ...patch };
        // Setting a discount stamps it, which starts the week-long marker.
        if (patch.salePrice != null && toNum(patch.salePrice) !== toNum(prev.salePrice)) {
            next.saleAt = Date.now();
        }
        map[k] = next;
        return writeAll(map);
    }

    function clearSale(p) {
        const map = readAll();
        const k = keyOf(p);
        if (!map[k]) return true;
        delete map[k].salePrice;
        delete map[k].saleAt;
        return writeAll(map);
    }

    window.veroOverrides = {
        key: keyOf, apply, priceHTML, cardClass, save, clearSale,
        toNum, money, all: readAll,
    };
    // Shorthands the pages call directly.
    window.veroApplyOverride = apply;
    window.veroPriceHTML = priceHTML;
    window.veroCardClass = cardClass;
})();
