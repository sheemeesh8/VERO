/* moravchick storefront sections — one renderer, two consumers.
 *
 * A storefront is an ordered list of sections saved on
 * vero_store_config.sections (the published design) and
 * vero_store_config.sectionsDraft (what the builder is working on). This file
 * turns that list into markup; store-sections.css styles it. The builder
 * (store-editor.html) and the live storefront (buyer-profile.html) both call
 * VeroStore.render(), so what the seller builds is exactly what buyers see.
 *
 * Images live in IndexedDB (media-store.js). A section stores only a pointer:
 * 'idb:<key>'. Anything else (data URL, file name, http URL) is used as-is.
 */
(function () {
    'use strict';

    var esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    var nis = function (n) { return '₪' + Math.round(Number(n) || 0).toLocaleString('en-US'); };
    var uid = function () { return Math.random().toString(36).slice(2, 9); };
    var clamp = function (n, lo, hi) { n = Number(n); if (!isFinite(n)) n = lo; return Math.min(hi, Math.max(lo, n)); };
    var oneOf = function (v, list, fb) { return list.indexOf(v) >= 0 ? v : fb; };
    var COLOR = /^#[0-9a-f]{3,8}$/i;

    /* ---------------- Section catalogue (name, description, defaults) ---------------- */
    var TYPES = {
        banner:   { name: 'Banner',          desc: 'A picture with a headline and a button' },
        slider:   { name: 'Slider',          desc: 'Several banners that slide' },
        products: { name: 'Products',        desc: 'Your items as a grid, carousel or list' },
        grid:     { name: 'Custom grid',     desc: 'Build your own mosaic of tiles' },
        split:    { name: 'Image with text', desc: 'A picture beside a short story' },
        text:     { name: 'Text',            desc: 'A heading and a paragraph' },
        marquee:  { name: 'Announcement',    desc: 'A moving line of text' },
        spacer:   { name: 'Spacer',          desc: 'Empty room or a divider line' }
    };

    function defaults(type) {
        var base = { id: uid(), type: type };
        switch (type) {
            case 'banner': return Object.assign(base, {
                image: '', kicker: 'New in', title: 'The new collection', text: '', cta: 'Shop now',
                pos: 'bl', height: 'm', width: 'full', tone: 'light', overlay: 30, bg: '' });
            case 'slider': return Object.assign(base, {
                style: 'full', height: 'm', autoplay: true, interval: 4, pos: 'bl', overlay: 30,
                slides: [
                    { id: uid(), image: '', title: 'First slide', text: 'Tell buyers what is new' },
                    { id: uid(), image: '', title: 'Second slide', text: '' }
                ] });
            case 'products': return Object.assign(base, {
                title: 'Items for sale', layout: 'grid', cols: 2, limit: 0, sort: 'default' });
            case 'grid': return Object.assign(base, {
                cols: 3, gap: 8,
                cells: [
                    { id: uid(), w: 2, h: 2, kind: 'image', image: '', title: 'Featured', text: '' },
                    { id: uid(), w: 1, h: 1, kind: 'product', product: 0 },
                    { id: uid(), w: 1, h: 1, kind: 'color', color: '', title: 'Sale' },
                    { id: uid(), w: 3, h: 1, kind: 'text', title: 'Hand-picked pieces', text: '' }
                ] });
            case 'split': return Object.assign(base, {
                image: '', side: 'left', title: 'Our story', text: 'A few lines about your shop and the pieces you choose.', cta: '' });
            case 'text': return Object.assign(base, {
                title: 'A word from the shop', text: 'Write something buyers should know.', align: 'center', size: 'm' });
            case 'marquee': return Object.assign(base, { text: 'Free pickup · New pieces every week', speed: 18, invert: true });
            case 'spacer': return Object.assign(base, { size: 28, line: false });
        }
        return base;
    }

    /* ------------------------------ Media ------------------------------ */
    // key → paintable URL. The builder seeds this right after an upload so the
    // canvas never flashes while IndexedDB answers.
    var mediaCache = new Map();
    function setMedia(pointer, url) { mediaCache.set(pointer, url); }
    function resolveMedia(pointer) {
        if (!pointer) return Promise.resolve(null);
        if (mediaCache.has(pointer)) return Promise.resolve(mediaCache.get(pointer));
        if (pointer.indexOf('idb:') !== 0) { mediaCache.set(pointer, pointer); return Promise.resolve(pointer); }
        if (typeof window.veroMediaURL !== 'function') return Promise.resolve(null);
        return window.veroMediaURL(pointer.slice(4)).then(function (u) { if (u) mediaCache.set(pointer, u); return u; });
    }
    function media(pointer, bg) {
        var style = bg && COLOR.test(bg) ? ' style="--ss-bg:' + bg + '"' : '';
        return '<div class="ss-media"' + (pointer ? ' data-ss-media="' + esc(pointer) + '"' : '') + style + '></div>';
    }

    /* ---------------------------- Section HTML --------------------------- */
    var POS = ['tl', 'tc', 'tr', 'cl', 'cc', 'cr', 'bl', 'bc', 'br'];
    var HEIGHTS = ['s', 'm', 'l', 'xl'];

    function copy(o) {
        var h = '<div class="ss-copy">';
        if (o.kicker) h += '<div class="ss-kicker">' + esc(o.kicker) + '</div>';
        if (o.title)  h += '<div class="ss-hl">' + esc(o.title) + '</div>';
        if (o.text)   h += '<p class="ss-text">' + esc(o.text) + '</p>';
        if (o.cta)    h += '<button type="button" class="ss-cta" data-ss-shop>' + esc(o.cta) + '</button>';
        return h + '</div>';
    }
    var ov = function (s) { return '--ss-ov:' + (clamp(s.overlay == null ? 30 : s.overlay, 0, 80) / 100); };

    function banner(s) {
        return '<section class="ss ss-banner ss-h-' + oneOf(s.height, HEIGHTS, 'm') + ' ss-pos-' + oneOf(s.pos, POS, 'bl') +
            ' ss-tone-' + oneOf(s.tone, ['light', 'dark'], 'light') + (s.width === 'boxed' ? ' ss-boxed' : '') +
            '" style="' + ov(s) + '">' + media(s.image, s.bg) + '<div class="ss-shade"></div>' + copy(s) + '</section>';
    }

    function slider(s) {
        var slides = Array.isArray(s.slides) ? s.slides : [];
        var cls = 'ss ss-slider ss-style-' + oneOf(s.style, ['full', 'cards'], 'full') + ' ss-pos-' + oneOf(s.pos, POS, 'bl') + ' ss-tone-light';
        var h = oneOf(s.height, HEIGHTS, 'm');
        var body = slides.map(function (sl) {
            return '<div class="ss-slide">' + media(sl.image) + '<div class="ss-shade"></div>' + copy(sl) + '</div>';
        }).join('') || '<div class="ss-slide">' + media('') + copy({ text: 'Add a slide' }) + '</div>';
        var dots = slides.length > 1 ? '<div class="ss-dots">' + slides.map(function (_, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '';
        return '<section class="' + cls + '" style="' + ov(s) + '"><div class="ss-track ss-h-' + h + '" data-ss-slider' +
            (s.autoplay ? ' data-auto="' + clamp(s.interval || 4, 2, 12) + '"' : '') + '>' + body + '</div>' + dots + '</section>';
    }

    function defaultCard(p) {
        return '<a class="ss-card" href="#" title="' + esc(p.name) + '"><div class="ss-card-img">' +
            (p.cover ? '<img src="' + esc(p.cover) + '" alt="" draggable="false">' : esc(p.icon || '🛍️')) + '</div>' +
            '<div class="ss-card-meta"><span class="ss-card-name">' + esc(p.name) + '</span><span class="ss-card-price">' + nis(p.price) + '</span></div></a>';
    }
    function rowCard(p) {
        return '<a class="ss-row" href="#"><div class="ss-row-img">' +
            (p.cover ? '<img src="' + esc(p.cover) + '" alt="" draggable="false">' : esc(p.icon || '🛍️')) + '</div>' +
            '<div class="ss-row-name">' + esc(p.name) + '</div><div class="ss-row-price">' + nis(p.price) + '</div></a>';
    }

    function products(s, ctx) {
        var list = (ctx.products || []).slice();
        if (s.sort === 'low')  list.sort(function (a, b) { return a.price - b.price; });
        if (s.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
        var limit = clamp(s.limit || 0, 0, 60);
        if (limit) list = list.slice(0, limit);
        var layout = oneOf(s.layout, ['grid', 'carousel', 'list', 'feature'], 'grid');
        var card = layout === 'list' ? rowCard : (ctx.card || defaultCard);
        var inner = list.length ? list.map(card).join('')
            : '<div class="ss-empty">' + (ctx.editing ? 'Your items will appear here once you upload them.' : 'No items here yet.') + '</div>';
        return '<section class="ss ss-products ss-pad">' +
            '<div class="ss-head"><h3>' + esc(s.title || '') + '</h3><span>' + list.length + ' item' + (list.length === 1 ? '' : 's') + '</span></div>' +
            '<div class="ss-pgrid ss-l-' + layout + '" style="--ss-cols:' + clamp(s.cols || 2, 1, 4) + '">' + inner + '</div></section>';
    }

    function cell(c, cols, ctx) {
        var kind = oneOf(c.kind, ['image', 'text', 'product', 'color'], 'image');
        var style = '--w:' + clamp(c.w || 1, 1, cols) + ';--h:' + clamp(c.h || 1, 1, 4);
        var inner = '', cls = 'ss-cell k-' + kind, tag = 'div', extra = '';
        var label = (c.title ? '<b>' + esc(c.title) + '</b>' : '') + (c.text ? '<small>' + esc(c.text) + '</small>' : '');
        if (kind === 'product') {
            var p = (ctx.products || [])[clamp(c.product || 0, 0, 999)];
            if (p) {
                inner = (p.cover ? '<div class="ss-media" style="background-image:url(&quot;' + esc(encodeURI(p.cover)) + '&quot;)"></div>'
                                 : '<div class="ss-cell-ico">' + esc(p.icon || '🛍️') + '</div>') +
                    '<div class="ss-cell-copy"><b>' + esc(p.name) + '</b><small>' + nis(p.price) + '</small></div>';
            } else {
                inner = '<div class="ss-cell-copy" style="color:inherit;background:none;justify-content:center;align-items:center"><small>Product</small></div>';
            }
        } else if (kind === 'image') {
            inner = media(c.image) + (label ? '<div class="ss-cell-copy">' + label + '</div>' : '');
            if (!label) cls += ' is-bare';
        } else if (kind === 'color') {
            style += ';background:' + (COLOR.test(c.color || '') ? c.color : 'var(--sf-accent,#111)');
            inner = '<div class="ss-cell-copy">' + label + '</div>';
        } else {
            inner = '<div class="ss-cell-copy">' + label + '</div>';
        }
        return '<' + tag + ' class="' + cls + '" data-cell="' + esc(c.id) + '" style="' + style + '"' + extra + '>' + inner + '</' + tag + '>';
    }

    function grid(s, ctx) {
        var cols = clamp(s.cols || 3, 2, 4), cells = Array.isArray(s.cells) ? s.cells : [];
        return '<section class="ss ss-grid ss-pad"><div class="ss-gridbox" style="--g-cols:' + cols + ';--g-gap:' + clamp(s.gap == null ? 8 : s.gap, 0, 24) + 'px">' +
            (cells.map(function (c) { return cell(c, cols, ctx); }).join('') || '<div class="ss-empty">Add tiles to build your grid.</div>') +
            '</div></section>';
    }

    function split(s) {
        return '<section class="ss ss-split ss-pad ss-side-' + oneOf(s.side, ['left', 'right', 'top'], 'left') + (s.side === 'top' ? ' ss-stack' : '') + '">' +
            '<div class="ss-split-img">' + media(s.image) + '</div><div class="ss-split-copy">' +
            (s.title ? '<div class="ss-hl">' + esc(s.title) + '</div>' : '') +
            (s.text ? '<p class="ss-text">' + esc(s.text) + '</p>' : '') +
            (s.cta ? '<button type="button" class="ss-cta" data-ss-shop>' + esc(s.cta) + '</button>' : '') + '</div></section>';
    }

    function text(s) {
        return '<section class="ss ss-textblock ss-pad ss-al-' + oneOf(s.align, ['left', 'center', 'right'], 'center') + ' ss-sz-' + oneOf(s.size, ['s', 'm', 'l'], 'm') + '">' +
            (s.title ? '<div class="ss-hl">' + esc(s.title) + '</div>' : '') + (s.text ? '<p class="ss-text">' + esc(s.text) + '</p>' : '') + '</section>';
    }

    function marquee(s) {
        var one = '<span>' + esc(s.text || '') + '</span>', half = new Array(7).join(one);
        return '<section class="ss ss-marquee' + (s.invert ? ' ss-invert' : '') + '" style="--ss-speed:' + clamp(s.speed || 18, 6, 60) + 's">' +
            '<div class="ss-marquee-run">' + half + half + '</div></section>';
    }

    function spacer(s) {
        return '<section class="ss ss-spacer" style="height:' + clamp(s.size == null ? 28 : s.size, 4, 160) + 'px">' + (s.line ? '<hr>' : '') + '</section>';
    }

    var RENDER = { banner: banner, slider: slider, products: products, grid: grid, split: split, text: text, marquee: marquee, spacer: spacer };

    function sectionHTML(s, ctx) {
        var fn = s && RENDER[s.type];
        return fn ? fn(s, ctx || {}) : '';
    }

    /* ------------------------------ Hydrate ------------------------------ */
    // Paints images, wires sliders and buttons. Safe to call after every render.
    function hydrate(root) {
        (root._ssTimers || []).forEach(clearInterval);
        root._ssTimers = [];

        root.querySelectorAll('[data-ss-media]').forEach(function (el) {
            resolveMedia(el.getAttribute('data-ss-media')).then(function (u) {
                if (u) el.style.backgroundImage = 'url("' + String(u).replace(/["\\\n]/g, '') + '")';
            });
        });

        root.querySelectorAll('[data-ss-slider]').forEach(function (track) {
            var dots = track.parentElement.querySelectorAll('.ss-dots i');
            var n = track.children.length;
            var current = function () {
                var best = 0, mid = track.scrollLeft + track.clientWidth / 2, d = Infinity;
                for (var i = 0; i < n; i++) {
                    var c = track.children[i], cd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
                    if (cd < d) { d = cd; best = i; }
                }
                return best;
            };
            var go = function (i) {
                var c = track.children[i]; if (!c) return;
                track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
            };
            track.addEventListener('scroll', function () {
                var i = current();
                dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
            }, { passive: true });
            var auto = Number(track.getAttribute('data-auto'));
            if (auto && n > 1 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                var paused = false;
                ['pointerdown', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }, { passive: true }); });
                root._ssTimers.push(setInterval(function () {
                    if (paused || !track.isConnected || !track.offsetParent) return;
                    go((current() + 1) % n);
                }, auto * 1000));
            }
        });

        if (!root._ssClicks) {
            root._ssClicks = true;
            root.addEventListener('click', function (e) {
                if (!e.target.closest('[data-ss-shop]')) return;
                var target = root.querySelector('.ss-products') || document.getElementById('feed');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    function render(root, sections, ctx) {
        ctx = ctx || {};
        var list = (Array.isArray(sections) ? sections : []).filter(function (s) { return s && !s.hidden; });
        root.classList.add('ss-root');
        root.innerHTML = list.map(function (s) { return sectionHTML(s, ctx); }).join('');
        hydrate(root);
    }

    window.VeroStore = {
        TYPES: TYPES, defaults: defaults, sectionHTML: sectionHTML, render: render, hydrate: hydrate,
        setMedia: setMedia, resolveMedia: resolveMedia, uid: uid, esc: esc, nis: nis
    };
})();
