/* moravchick storefront sections — one renderer, every consumer.
 *
 * A storefront is an ordered list of sections saved on
 * vero_store_config.sections (the published design) and
 * vero_store_config.sectionsDraft (unpublished work). This file turns that list
 * into markup; store-sections.css styles it. The live storefront
 * (buyer-profile.html), its in-place editor (store-live-edit.js) and the older
 * builder (store-editor.html) all call VeroStore.render(), so what the seller
 * builds is exactly what buyers see.
 *
 * Every editable text is rendered with data-f="<path>" (e.g. "title" or
 * "slides.1.text") and every picture with data-fm="<path>", so the in-place
 * editor can write straight back into the section object. With ctx.editing set,
 * empty fields are still rendered (as placeholders) so they can be filled in.
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
        nav:      { name: 'Menu bar',        desc: 'Your shop name and a menu that jumps to each part' },
        slider:   { name: 'Slider',          desc: 'Several banners that slide' },
        banner:   { name: 'Banner',          desc: 'A picture with a headline and a button' },
        products: { name: 'Products',        desc: 'Your items as a grid, carousel or list' },
        features: { name: 'Highlights',      desc: 'Three short promises with icons' },
        grid:     { name: 'Custom grid',     desc: 'Build your own mosaic of tiles' },
        split:    { name: 'Image with text', desc: 'A picture beside a short story' },
        text:     { name: 'Text',            desc: 'A heading and a paragraph' },
        marquee:  { name: 'Announcement',    desc: 'A moving line of text' },
        footer:   { name: 'Footer',          desc: 'Closing block with contact details' },
        spacer:   { name: 'Spacer',          desc: 'Empty room or a divider line' }
    };

    function defaults(type) {
        var base = { id: uid(), type: type };
        switch (type) {
            case 'nav': return Object.assign(base, {
                brand: '', sticky: true,
                links: [
                    { id: uid(), label: 'Shop', to: 'products' },
                    { id: uid(), label: 'About', to: 'split' },
                    { id: uid(), label: 'Contact', to: 'footer' }
                ] });
            case 'banner': return Object.assign(base, {
                image: '', kicker: 'New in', title: 'The new collection', text: '', cta: 'Shop now',
                pos: 'bl', height: 'm', width: 'full', tone: 'light', overlay: 30, bg: '' });
            case 'slider': return Object.assign(base, {
                style: 'full', height: 'l', autoplay: true, interval: 5, pos: 'bl', overlay: 30,
                slides: [
                    { id: uid(), image: '', kicker: '', title: 'First slide', text: 'Tell buyers what is new', cta: 'Shop now' },
                    { id: uid(), image: '', kicker: '', title: 'Second slide', text: '', cta: '' }
                ] });
            case 'products': return Object.assign(base, {
                title: 'Items for sale', layout: 'grid', cols: 2, limit: 0, sort: 'default' });
            case 'features': return Object.assign(base, {
                title: '', style: 'plain',
                items: [
                    { id: uid(), icon: '✦', title: 'Hand-picked', text: 'Every piece checked by hand' },
                    { id: uid(), icon: '⇄', title: 'Meet in person', text: 'See it before you pay' },
                    { id: uid(), icon: '✉', title: 'Quick replies', text: 'Ask anything in chat' }
                ] });
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
            case 'footer': return Object.assign(base, {
                title: '', text: 'Pre-loved pieces, chosen with care.', contact: 'Message us any time · Pickup by appointment',
                note: '', dark: true });
            case 'spacer': return Object.assign(base, { size: 28, line: false });
        }
        return base;
    }

    /* A whole website for a store that never designed one: menu, hero slider,
       announcement, highlights, products, a banner, the story and a footer. */
    function starter(opts) {
        opts = opts || {};
        var name = opts.storeName || 'My shop';
        var nav = defaults('nav'), slider = defaults('slider'), marquee = defaults('marquee'),
            feat = defaults('features'), prod = defaults('products'), banner = defaults('banner'),
            split = defaults('split'), foot = defaults('footer');
        nav.brand = name;
        slider.slides = [
            { id: uid(), image: 'women-hero.jpg', kicker: 'New season', title: 'Fresh pieces just landed', text: 'Hand-picked and ready for a second life.', cta: 'Shop now' },
            { id: uid(), image: 'clothing-hero.jpg', kicker: 'Wardrobe', title: 'Everyday favourites', text: 'Quality basics at a fair price.', cta: 'See all items' },
            { id: uid(), image: 'gallery-hero.jpg', kicker: 'One of a kind', title: 'Pieces you will not find twice', text: '', cta: 'Discover' }
        ];
        marquee.text = 'Welcome to ' + name + ' · New pieces every week · Pickup by appointment';
        prod.title = 'Shop the collection';
        prod.cols = Math.min(3, Math.max(2, Number(opts.cols) || 2));
        banner.image = 'sale-hero.jpg'; banner.kicker = 'Limited time'; banner.title = 'The sale corner';
        banner.text = 'Make an offer on selected pieces.'; banner.cta = 'Browse'; banner.pos = 'cc'; banner.height = 'm';
        split.image = 'men-hero.jpg'; split.title = 'About ' + name;
        split.text = 'Tell buyers who you are, where your pieces come from and what makes your shop special.';
        foot.title = name;
        nav.links = [
            { id: uid(), label: 'Shop', to: prod.id },
            { id: uid(), label: 'Sale', to: banner.id },
            { id: uid(), label: 'About', to: split.id },
            { id: uid(), label: 'Contact', to: foot.id }
        ];
        return [nav, slider, marquee, feat, prod, banner, split, foot];
    }

    /* ------------------------------ Media ------------------------------ */
    // key → paintable URL. The editors seed this right after an upload so the
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
    function media(pointer, bg, path) {
        var style = bg && COLOR.test(bg) ? ' style="--ss-bg:' + bg + '"' : '';
        return '<div class="ss-media"' + (pointer ? ' data-ss-media="' + esc(pointer) + '"' : '') +
            (path ? ' data-fm="' + esc(path) + '"' : '') + style + '></div>';
    }

    /* An editable text field. Published pages skip empty fields; while editing
       they render as a placeholder the seller can type into. */
    function F(ctx, tag, cls, path, val, ph, attrs) {
        var has = val != null && String(val).trim() !== '';
        if (!has && !ctx.editing) return '';
        return '<' + tag + ' class="' + cls + (has ? '' : ' ss-ph') + '" data-f="' + esc(path) + '" data-ph="' + esc(ph || '') + '"' +
            (attrs || '') + '>' + (has ? esc(val) : '') + '</' + tag + '>';
    }
    var CTA_ATTRS = ' href="#shop" role="button" data-ss-shop';

    /* ---------------------------- Section HTML --------------------------- */
    var POS = ['tl', 'tc', 'tr', 'cl', 'cc', 'cr', 'bl', 'bc', 'br'];
    var HEIGHTS = ['s', 'm', 'l', 'xl'];

    function copy(o, pre, ctx) {
        return '<div class="ss-copy">' +
            F(ctx, 'div', 'ss-kicker', pre + 'kicker', o.kicker, 'Small line') +
            F(ctx, 'div', 'ss-hl', pre + 'title', o.title, 'Headline') +
            F(ctx, 'p', 'ss-text', pre + 'text', o.text, 'A line of text') +
            F(ctx, 'a', 'ss-cta', pre + 'cta', o.cta, 'Button', CTA_ATTRS) +
            '</div>';
    }
    var ov = function (s) { return '--ss-ov:' + (clamp(s.overlay == null ? 30 : s.overlay, 0, 80) / 100); };

    function nav(s, ctx) {
        var links = Array.isArray(s.links) ? s.links : [];
        var brand = s.brand || (ctx.editing ? '' : ctx.storeName || '');
        return '<section class="ss ss-nav' + (s.sticky === false ? '' : ' ss-sticky') + '">' +
            F(ctx, 'div', 'ss-nav-brand', 'brand', brand, 'Shop name') +
            '<nav class="ss-nav-links">' + links.map(function (l, i) {
                return F(ctx, 'a', 'ss-nav-link', 'links.' + i + '.label', l.label, 'Link',
                    ' href="#" data-ss-go="' + esc(l.to || '') + '"');
            }).join('') + '</nav></section>';
    }

    function banner(s, ctx) {
        return '<section class="ss ss-banner ss-h-' + oneOf(s.height, HEIGHTS, 'm') + ' ss-pos-' + oneOf(s.pos, POS, 'bl') +
            ' ss-tone-' + oneOf(s.tone, ['light', 'dark'], 'light') + (s.width === 'boxed' ? ' ss-boxed' : '') +
            '" style="' + ov(s) + '">' + media(s.image, s.bg, 'image') + '<div class="ss-shade"></div>' + copy(s, '', ctx) + '</section>';
    }

    var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    function slider(s, ctx) {
        var slides = Array.isArray(s.slides) ? s.slides : [];
        var cls = 'ss ss-slider ss-style-' + oneOf(s.style, ['full', 'cards'], 'full') + ' ss-pos-' + oneOf(s.pos, POS, 'bl') + ' ss-tone-light';
        var h = oneOf(s.height, HEIGHTS, 'm');
        var body = slides.map(function (sl, i) {
            return '<div class="ss-slide" data-slide="' + i + '">' + media(sl.image, '', 'slides.' + i + '.image') +
                '<div class="ss-shade"></div>' + copy(sl, 'slides.' + i + '.', ctx) + '</div>';
        }).join('') || '<div class="ss-slide">' + media('') + copy({ text: 'Add a slide' }, '', {}) + '</div>';
        var many = slides.length > 1;
        var dots = many ? '<div class="ss-dots">' + slides.map(function (_, i) { return '<i data-dot="' + i + '"' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '';
        var arrows = many ? '<button type="button" class="ss-arrow ss-prev" data-ss-step="-1" aria-label="Previous slide">' + ARROW + '</button>' +
            '<button type="button" class="ss-arrow ss-next" data-ss-step="1" aria-label="Next slide">' + ARROW + '</button>' : '';
        return '<section class="' + cls + '" style="' + ov(s) + '"><div class="ss-track ss-h-' + h + '" data-ss-slider' +
            (s.autoplay ? ' data-auto="' + clamp(s.interval || 4, 2, 12) + '"' : '') + '>' + body + '</div>' + arrows + dots + '</section>';
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
            '<div class="ss-head">' + F(ctx, 'h3', 'ss-ptitle', 'title', s.title, 'Section title') +
            '<span>' + list.length + ' item' + (list.length === 1 ? '' : 's') + '</span></div>' +
            '<div class="ss-pgrid ss-l-' + layout + '" style="--ss-cols:' + clamp(s.cols || 2, 1, 4) + '">' + inner + '</div></section>';
    }

    function features(s, ctx) {
        var items = Array.isArray(s.items) ? s.items : [];
        return '<section class="ss ss-features ss-pad ss-fs-' + oneOf(s.style, ['plain', 'boxed'], 'plain') + '">' +
            F(ctx, 'div', 'ss-hl ss-ftitle', 'title', s.title, 'Section title (optional)') +
            '<div class="ss-frow" style="--ss-n:' + Math.max(1, Math.min(4, items.length)) + '">' + items.map(function (it, i) {
                var p = 'items.' + i + '.';
                return '<div class="ss-fitem">' + F(ctx, 'div', 'ss-ficon', p + 'icon', it.icon, '★') +
                    F(ctx, 'b', 'ss-fname', p + 'title', it.title, 'Title') + F(ctx, 'small', 'ss-ftext', p + 'text', it.text, 'Short line') + '</div>';
            }).join('') + '</div></section>';
    }

    function cell(c, i, cols, ctx) {
        var kind = oneOf(c.kind, ['image', 'text', 'product', 'color'], 'image');
        var style = '--w:' + clamp(c.w || 1, 1, cols) + ';--h:' + clamp(c.h || 1, 1, 4);
        var inner = '', cls = 'ss-cell k-' + kind, p = 'cells.' + i + '.';
        var label = F(ctx, 'b', 'ss-cell-t', p + 'title', c.title, 'Title') + F(ctx, 'small', 'ss-cell-s', p + 'text', c.text, 'Text');
        if (kind === 'product') {
            var pr = (ctx.products || [])[clamp(c.product || 0, 0, 999)];
            if (pr) {
                inner = (pr.cover ? '<div class="ss-media" style="background-image:url(&quot;' + esc(encodeURI(pr.cover)) + '&quot;)"></div>'
                                  : '<div class="ss-cell-ico">' + esc(pr.icon || '🛍️') + '</div>') +
                    '<div class="ss-cell-copy"><b>' + esc(pr.name) + '</b><small>' + nis(pr.price) + '</small></div>';
            } else {
                inner = '<div class="ss-cell-copy" style="color:inherit;background:none;justify-content:center;align-items:center"><small>Product</small></div>';
            }
        } else if (kind === 'image') {
            inner = media(c.image, '', p + 'image') + (label ? '<div class="ss-cell-copy">' + label + '</div>' : '');
            if (!label) cls += ' is-bare';
        } else if (kind === 'color') {
            style += ';background:' + (COLOR.test(c.color || '') ? c.color : 'var(--sf-accent,#111)');
            inner = '<div class="ss-cell-copy">' + label + '</div>';
        } else {
            inner = '<div class="ss-cell-copy">' + label + '</div>';
        }
        return '<div class="' + cls + '" data-cell="' + esc(c.id) + '" style="' + style + '">' + inner + '</div>';
    }

    function grid(s, ctx) {
        var cols = clamp(s.cols || 3, 2, 4), cells = Array.isArray(s.cells) ? s.cells : [];
        return '<section class="ss ss-grid ss-pad"><div class="ss-gridbox" style="--g-cols:' + cols + ';--g-gap:' + clamp(s.gap == null ? 8 : s.gap, 0, 24) + 'px">' +
            (cells.map(function (c, i) { return cell(c, i, cols, ctx); }).join('') || '<div class="ss-empty">Add tiles to build your grid.</div>') +
            '</div></section>';
    }

    function split(s, ctx) {
        return '<section class="ss ss-split ss-pad ss-side-' + oneOf(s.side, ['left', 'right', 'top'], 'left') + (s.side === 'top' ? ' ss-stack' : '') + '">' +
            '<div class="ss-split-img">' + media(s.image, '', 'image') + '</div><div class="ss-split-copy">' +
            F(ctx, 'div', 'ss-hl', 'title', s.title, 'Headline') +
            F(ctx, 'p', 'ss-text', 'text', s.text, 'Your story') +
            F(ctx, 'a', 'ss-cta', 'cta', s.cta, 'Button', CTA_ATTRS) + '</div></section>';
    }

    function text(s, ctx) {
        return '<section class="ss ss-textblock ss-pad ss-al-' + oneOf(s.align, ['left', 'center', 'right'], 'center') + ' ss-sz-' + oneOf(s.size, ['s', 'm', 'l'], 'm') + '">' +
            F(ctx, 'div', 'ss-hl', 'title', s.title, 'Headline') + F(ctx, 'p', 'ss-text', 'text', s.text, 'Paragraph') + '</section>';
    }

    function marquee(s, ctx) {
        var cls = 'ss ss-marquee' + (s.invert ? ' ss-invert' : '');
        var style = '--ss-speed:' + clamp(s.speed || 18, 6, 60) + 's';
        // While editing, the line stands still so it can be typed into.
        if (ctx.editing) return '<section class="' + cls + ' ss-still" style="' + style + '">' + F(ctx, 'div', 'ss-marquee-edit', 'text', s.text, 'Announcement text') + '</section>';
        var one = '<span>' + esc(s.text || '') + '</span>', half = new Array(7).join(one);
        return '<section class="' + cls + '" style="' + style + '"><div class="ss-marquee-run">' + half + half + '</div></section>';
    }

    function footer(s, ctx) {
        var year = new Date().getFullYear();
        var note = s.note || (ctx.editing ? '' : '© ' + year + ' ' + (s.title || ctx.storeName || ''));
        return '<section class="ss ss-footer ss-pad' + (s.dark === false ? '' : ' ss-foot-dark') + '">' +
            F(ctx, 'div', 'ss-hl ss-foot-title', 'title', s.title || (ctx.editing ? '' : ctx.storeName), 'Shop name') +
            F(ctx, 'p', 'ss-text', 'text', s.text, 'A line about the shop') +
            F(ctx, 'p', 'ss-foot-contact', 'contact', s.contact, 'Contact details / hours') +
            '<a class="ss-foot-top" href="#" data-ss-top>Back to top ↑</a>' +
            F(ctx, 'small', 'ss-foot-note', 'note', note, '© ' + year + ' Your shop') + '</section>';
    }

    function spacer(s) {
        return '<section class="ss ss-spacer" style="height:' + clamp(s.size == null ? 28 : s.size, 4, 160) + 'px">' + (s.line ? '<hr>' : '') + '</section>';
    }

    var RENDER = { nav: nav, banner: banner, slider: slider, products: products, features: features, grid: grid,
        split: split, text: text, marquee: marquee, footer: footer, spacer: spacer };

    function sectionHTML(s, ctx) {
        var fn = s && RENDER[s.type];
        if (!fn) return '';
        var html = fn(s, ctx || {});
        var cls = s.hidden ? ' ss-is-hidden' : '';
        return html.replace(/^<section class="/, '<section id="ss-' + esc(s.id) + '" data-sid="' + esc(s.id) + '" class="' + cls.trim() + (cls ? ' ' : ''));
    }

    /* ------------------------------ Hydrate ------------------------------ */
    // Paints images, wires sliders and buttons. Safe to call after every render.
    function hydrate(root) {
        (root._ssTimers || []).forEach(clearInterval);
        root._ssTimers = [];
        var editing = root.classList.contains('ss-editing');

        root.querySelectorAll('[data-ss-media]').forEach(function (el) {
            resolveMedia(el.getAttribute('data-ss-media')).then(function (u) {
                if (u) el.style.backgroundImage = 'url("' + String(u).replace(/["\\\n]/g, '') + '")';
            });
        });

        root.querySelectorAll('[data-ss-slider]').forEach(function (track) {
            var sec = track.parentElement;
            var dots = sec.querySelectorAll('.ss-dots i');
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
                var c = track.children[(i + n) % n]; if (!c) return;
                track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
            };
            track._ssGo = go; track._ssCurrent = current;
            track.addEventListener('scroll', function () {
                var i = current();
                dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
            }, { passive: true });
            sec.querySelectorAll('[data-ss-step]').forEach(function (b) {
                b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(current() + Number(b.getAttribute('data-ss-step'))); });
            });
            dots.forEach(function (d, k) { d.style.pointerEvents = 'auto'; d.addEventListener('click', function () { go(k); }); });
            var auto = Number(track.getAttribute('data-auto'));
            if (!editing && auto && n > 1 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                var paused = false;
                ['pointerdown', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }, { passive: true }); });
                root._ssTimers.push(setInterval(function () {
                    if (paused || !track.isConnected || !track.offsetParent) return;
                    go(current() + 1);
                }, auto * 1000));
            }
        });

        if (!root._ssClicks) {
            root._ssClicks = true;
            root.addEventListener('click', function (e) {
                if (root.classList.contains('ss-editing')) return;   // the editor owns clicks
                var go = e.target.closest('[data-ss-go]'), top = e.target.closest('[data-ss-top]');
                if (top) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
                if (go) {
                    e.preventDefault();
                    var to = go.getAttribute('data-ss-go');
                    var t = root.querySelector('[data-sid="' + to + '"]') || root.querySelector('.ss-' + to);
                    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                }
                if (!e.target.closest('[data-ss-shop]')) return;
                e.preventDefault();
                var target = root.querySelector('.ss-products') || document.getElementById('feed');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    function render(root, sections, ctx) {
        ctx = ctx || {};
        var list = (Array.isArray(sections) ? sections : []).filter(function (s) { return s && (ctx.editing || !s.hidden); });
        root.classList.add('ss-root');
        root.classList.toggle('ss-editing', !!ctx.editing);
        root.innerHTML = list.map(function (s) { return sectionHTML(s, ctx); }).join('');
        hydrate(root);
    }

    window.VeroStore = {
        TYPES: TYPES, defaults: defaults, starter: starter, sectionHTML: sectionHTML, render: render, hydrate: hydrate,
        setMedia: setMedia, resolveMedia: resolveMedia, uid: uid, esc: esc, nis: nis
    };
})();
