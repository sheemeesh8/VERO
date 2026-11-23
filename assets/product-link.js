/* Short product links.
 *
 * Product links carry the piece in the URL (product-showcase.html?product=<json>).
 * When the piece has an uploaded photo, its cover is a base64 data: URL hundreds of
 * KB long, and the server refuses the request with "414 URI Too Long".
 *
 * Any link whose ?product= would make the URL too long is rewritten, just before it
 * is followed, to ?pid=<key>; the payload itself is kept in localStorage under that
 * key. The product pages read it back with veroReadProductParam().
 */
(function () {
    if (window.veroShortProductUrl) return;

    var MAX_URL = 1800;            // well under every server / browser limit
    var STORE = 'vero_plinks';
    var KEEP = 40;                 // most recent payloads kept

    function hash(s) {
        var h = 5381;
        for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
        return (h >>> 0).toString(36) + s.length.toString(36);
    }
    function readStore() {
        try { var o = JSON.parse(localStorage.getItem(STORE) || '{}'); return (o && typeof o === 'object') ? o : {}; }
        catch (e) { return {}; }
    }
    function writeStore(o) {
        var ids = Object.keys(o).sort(function (a, b) { return (o[b].t || 0) - (o[a].t || 0); });
        ids.slice(KEEP).forEach(function (id) { delete o[id]; });
        // Out of space: drop the oldest entries until it fits (keep at least the newest).
        while (true) {
            try { localStorage.setItem(STORE, JSON.stringify(o)); return true; }
            catch (e) {
                ids = Object.keys(o).sort(function (a, b) { return (o[b].t || 0) - (o[a].t || 0); });
                if (ids.length <= 1) return false;
                delete o[ids[ids.length - 1]];
            }
        }
    }
    // The payload without its inline (data:) images — small enough for a URL; the
    // product page fills the photos back in from the catalogue by name + seller.
    function withoutInlineImages(json) {
        try {
            var o = JSON.parse(json), changed = false;
            Object.keys(o).forEach(function (k) {
                var v = o[k];
                if (typeof v === 'string' && /^data:/i.test(v)) { o[k] = ''; changed = true; }
                else if (Array.isArray(v) && v.some(function (x) { return typeof x === 'string' && /^data:/i.test(x); })) {
                    o[k] = v.filter(function (x) { return !(typeof x === 'string' && /^data:/i.test(x)); }); changed = true;
                }
            });
            return changed ? JSON.stringify(o) : json;
        } catch (e) { return json; }
    }

    // Returns the same URL, or a short ?pid= one when ?product= makes it too long.
    function shortUrl(href) {
        if (!href || href.length <= MAX_URL || href.indexOf('product=') < 0) return href;
        var u;
        try { u = new URL(href, location.href); } catch (e) { return href; }
        var raw = u.searchParams.get('product');
        if (!raw) return href;
        var id = hash(raw);
        var o = readStore();
        o[id] = { t: Date.now(), d: raw };
        u.searchParams.delete('product');
        if (writeStore(o)) {
            u.searchParams.set('pid', id);
        } else {
            // No room to keep it: send it without the inline photos instead.
            u.searchParams.set('product', withoutInlineImages(raw));
        }
        // Keep a relative link relative (the phone frame matches local filenames).
        var out = u.href;
        if (!/^[a-z]+:/i.test(href) && u.origin === location.origin) {
            out = u.pathname.split('/').pop() + u.search + u.hash;
        }
        return out;
    }

    // The product JSON string a page was opened with (from ?product= or ?pid=), or null.
    function readParam(params) {
        params = params || new URLSearchParams(location.search);
        var raw = params.get('product');
        if (raw) return raw;
        var id = params.get('pid');
        if (!id) return null;
        var o = readStore();
        if (o[id] && o[id].d) {
            o[id].t = Date.now();
            writeStore(o);
            return o[id].d;
        }
        return null;
    }

    window.veroShortProductUrl = shortUrl;
    window.veroReadProductParam = readParam;

    // Rewrite a long product link the moment it is about to be used — tapped,
    // clicked, middle-clicked, opened from the keyboard or the context menu — so
    // every page's link builder is covered without changing each one.
    function fix(e) {
        var a = e.target && e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || href.length <= MAX_URL || href.indexOf('product=') < 0) return;
        var s = shortUrl(href);
        if (s !== href) a.setAttribute('href', s);
    }
    ['pointerdown', 'mousedown', 'touchstart', 'focusin', 'contextmenu', 'auxclick', 'click', 'keydown'].forEach(function (t) {
        document.addEventListener(t, fix, { capture: true, passive: true });
    });

    // Navigations started from script (location.href = …) where the browser
    // supports the Navigation API: swap a too-long product URL for the short one.
    try {
        if (window.navigation && navigation.addEventListener) {
            navigation.addEventListener('navigate', function (e) {
                var url = e.destination && e.destination.url;
                if (!url || url.length <= MAX_URL || url.indexOf('product=') < 0 || !e.cancelable) return;
                var s = shortUrl(url);
                if (s === url) return;
                e.preventDefault();
                location.href = s;
            });
        }
    } catch (e) {}
})();
