/* ============================================================================
   motion.js — site-wide motion: pages and content come in and go out.

   Load it in <head> (not deferred) so the page can fade in from its first paint:
       <script src="assets/motion.js"></script>

   1. Page in   — the page fades in when it opens.
   2. Page out  — tapping a link to another page fades this one out first.
   3. Content   — cards, headings, text, pictures and sections rise and fade in
                  as they come into view, and fade back out as they leave it
                  (up past the top, or down past the bottom), so scrolling
                  either way plays them again.

   Safe by design:
   • prefers-reduced-motion → nothing moves, nothing is hidden.
   • Only what is OFF screen is ever hidden; what is on screen at load stays.
   • Chrome is never touched: fixed / sticky bars, the header, heroes, sliders,
     the date wheel, sheets, drawers, dialogs, overlays — and anything marked
     data-no-motion.
   • Uses the Web Animations API, so the elements' own CSS transitions (hover,
     press) keep working. Replaces reveal.js.
   ========================================================================== */
/* ---- Night mode (Settings → Display → Night mode: off / on / auto) ----------
   The whole page is turned to its negative and hue-rotated back, so whites go
   near-black and inks go light while colours keep their hue; photos, video and
   embedded pages are turned back so they look as they are. Lives here because
   this file loads in the <head> of every page, before the first paint. */
(function () {
    'use strict';
    if (window.veroApplyNight) return;
    var root = document.documentElement;
    var css = document.createElement('style');
    css.id = 'vero-night-css';
    // Media are turned back once; anything inside something already turned back
    // is left alone (two turns would make it a negative again).
    var M = 'img,video,canvas,iframe,.vn-bg';
    css.textContent =
        'html.vero-night{filter:invert(1) hue-rotate(180deg);background:#fff}' +
        M.split(',').map(function (m) { return 'html.vero-night ' + m; }).join(',') + '{filter:invert(1) hue-rotate(180deg)}' +
        M.split(',').map(function (m) { return 'html.vero-night .vn-bg ' + m; }).join(',') + '{filter:none}';
    (document.head || root).appendChild(css);
    var mq = null;
    try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch (e) {}
    function wanted() {
        var t = 'light';
        try { t = (JSON.parse(localStorage.getItem('vero_settings')) || {}).theme || 'light'; } catch (e) {}
        return t === 'dark' || (t === 'system' && !!(mq && mq.matches));
    }
    // Photos set as a CSS background (covers, avatars) are found by their
    // computed style — a url(), not a gradient — and marked to be turned back.
    function tag(scope) {
        var els = (scope || document).querySelectorAll('*');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (/^(IMG|VIDEO|CANVAS|IFRAME|SCRIPT|STYLE|SVG|PATH)$/i.test(el.tagName)) continue;
            var bg = getComputedStyle(el).backgroundImage;
            el.classList.toggle('vn-bg', !!bg && bg.indexOf('url(') !== -1);
        }
    }
    var obs = null, tagT = null;
    function watch(on) {
        if (on && !obs && window.MutationObserver) {
            obs = new MutationObserver(function () { clearTimeout(tagT); tagT = setTimeout(function () { tag(); }, 300); });
            var start = function () { tag(); obs.observe(document.body || root, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] }); };
            if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
        } else if (!on && obs) { obs.disconnect(); obs = null; }
    }
    function apply() { var on = wanted(); root.classList.toggle('vero-night', on); watch(on); }
    window.veroApplyNight = apply;
    apply();
    window.addEventListener('storage', function (e) { if (!e.key || e.key === 'vero_settings') apply(); });
    if (mq && mq.addEventListener) mq.addEventListener('change', apply);
})();

/* ---- Sound effects: loads assets/sounds.js; until it is in, calls queue. ---- */
(function () {
    if (window.veroSound) return;
    window.__veroSoundQ = [];
    window.veroSound = function (name) { window.__veroSoundQ.push(name); };
    var src = (document.currentScript && document.currentScript.src || '').replace(/motion\.js(\?.*)?$/, 'sounds.js?v=1');
    if (!src) return;
    var sc = document.createElement('script'); sc.src = src; sc.async = true;
    (document.head || document.documentElement).appendChild(sc);
})();

(function () {
    'use strict';
    if (window.__veroMotion) return;
    window.__veroMotion = true;

    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    // Settings → Display → Reduce animations (vero_settings.reduceMotion).
    try { if ((JSON.parse(localStorage.getItem('vero_settings')) || {}).reduceMotion) reduce = true; } catch (e) {}
    if (reduce) return;

    var root = document.documentElement;
    var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

    // ---- 1 + 2. Page transitions --------------------------------------------
    // Where the browser has cross-page View Transitions (Chrome / Edge, Safari 18.2+),
    // every navigation — a link, a form, a script setting location — is animated by
    // the browser itself: the page you leave drifts left and fades, the new one slides
    // in from the right; going Back runs it the other way. The header is its own
    // layer, so it holds still (and morphs if it differs) while the pages change
    // under it. Elsewhere, a lighter version in script: the page slides out on a
    // link tap and slides in on arrival.
    var VT = !!(window.CSS && CSS.supports && document.startViewTransition && ('onpagereveal' in window));
    var css = document.createElement('style');
    css.id = 'vero-motion-css';
    css.textContent = VT ? (
        '@view-transition{navigation:auto}' +
        '#siteHeader{view-transition-name:vero-header}' +
        '::view-transition-group(vero-header){animation-duration:.4s;animation-timing-function:' + EASE + ';z-index:2}' +
        '::view-transition-old(root){animation:moVtOut .34s cubic-bezier(.4,0,1,1) both}' +
        '::view-transition-new(root){animation:moVtIn .56s ' + EASE + ' .06s both}' +
        ':active-view-transition-type(back)::view-transition-old(root){animation-name:moVtOutBack}' +
        ':active-view-transition-type(back)::view-transition-new(root){animation-name:moVtInBack}' +
        '@keyframes moVtOut{to{opacity:0;transform:translateX(-7%) scale(.985)}}' +
        '@keyframes moVtIn{from{opacity:0;transform:translateX(9%)}}' +
        '@keyframes moVtOutBack{to{opacity:0;transform:translateX(7%) scale(.985)}}' +
        '@keyframes moVtInBack{from{opacity:0;transform:translateX(-9%)}}' +
        'html .mo-h{opacity:0 !important}'
    ) : (
        'html.mo-enter body{animation:moPageIn .55s ' + EASE + ' both}' +
        '@keyframes moPageIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}' +
        'html.mo-leave body{opacity:0;transform:translateX(-14px);transition:opacity .22s ease,transform .22s ease}' +
        'html .mo-h{opacity:0 !important}'
    );
    (document.head || root).appendChild(css);

    if (VT) {
        // Back / forward through history plays the transition the other way.
        function isBack() {
            try {
                var a = window.navigation && navigation.activation;
                return !!(a && a.navigationType === 'traverse' && a.from && a.entry && a.from.index > a.entry.index);
            } catch (e) { return false; }
        }
        window.addEventListener('pagereveal', function (e) {
            if (e.viewTransition && isBack()) { try { e.viewTransition.types.add('back'); } catch (err) {} }
        });
        window.addEventListener('pageswap', function (e) {
            if (!e.viewTransition || !e.activation) return;
            try {
                var a = e.activation;
                if (a.navigationType === 'traverse' && a.from && a.entry && a.from.index > a.entry.index) e.viewTransition.types.add('back');
            } catch (err) {}
        });
    } else {
        root.classList.add('mo-enter');
        setTimeout(function () { root.classList.remove('mo-enter'); }, 700);
        // Back / forward from the page cache: show the page again.
        window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('mo-leave'); });

        document.addEventListener('click', function (e) {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a || a.hasAttribute('download') || a.hasAttribute('data-no-motion')) return;
            var t = (a.getAttribute('target') || '').toLowerCase();
            if (t && t !== '_self') return;
            var raw = a.getAttribute('href') || '';
            if (!raw || raw.charAt(0) === '#' || /^(javascript|mailto|tel|sms|whatsapp):/i.test(raw)) return;
            var url;
            try { url = new URL(a.href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin) return;
            if (url.pathname === location.pathname && url.search === location.search && url.hash) return;   // same page, other anchor
            e.preventDefault();
            root.classList.add('mo-leave');
            setTimeout(function () { location.href = url.href; }, 200);
            // If the navigation is cancelled, never leave the page blank.
            setTimeout(function () { root.classList.remove('mo-leave'); }, 2500);
        });
    }

    // ---- 3. Content in / out ------------------------------------------------
    if (typeof IntersectionObserver === 'undefined' || !Element.prototype.animate) return;

    var TARGETS = [
        '.product-card', '.rt-card', '.card', '.kpi', '.cart-item', '.mp-cell', '.prod-cell', '.draft-cell',
        'h1', 'h2', 'h3', 'p', 'li', 'figure', 'img', 'blockquote', 'table', 'form',
        'section', 'article', '.hm-sale-pic', '.doc > *', 'main > *', '.wrap > *'
    ].join(',');
    var SKIP = [
        'header', 'nav', 'footer', '#siteHeader', '[class*="hero"]', '[class*="Hero"]', '[class*="slider"]',
        '.hm-rail', '.hm-cats', '.hm-wait', '.vwc', '.hm-wo-wheel', '.hm-sc',
        '[role="dialog"]', '[aria-modal="true"]', '.mag-root', '.mag-pop',
        '[class*="sheet"]', '[class*="drawer"]', '[class*="modal"]', '[class*="overlay"]', '[class*="popup"]',
        '[class*="toast"]', '[class*="menu"]', '[class*="tooltip"]', '[class*="cookie"]', '#veroCookie',
        '[data-no-motion]', 'button', 'select', 'label', 'svg',
        // Things that already run their own entrance (the dashboards, the home sliders).
        '[class*="am-wait"]', '[class*="am-in"]', '[class*="am-hold"]', '.vr-init', '.vr-in'
    ].join(',');
    // Fixed / sticky things (and what is inside them) stay put.
    function pinned(el) {
        for (var n = el; n && n !== document.body; n = n.parentElement) {
            var p;
            try { p = getComputedStyle(n).position; } catch (e) { return true; }
            if (p === 'fixed' || p === 'sticky') return true;
        }
        return false;
    }

    // Inside something that already moves → it moves with it.
    function inTracked(el) {
        for (var n = el.parentElement; n && n !== document.body; n = n.parentElement) if (n.__moT) return true;
        return false;
    }
    var io, seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null, batch = 0;
    function vh() { return window.innerHeight || root.clientHeight; }

    function show(el, delay) {
        if (el.__mo === 'in') return;
        el.__mo = 'in';
        if (el.__moA) { try { el.__moA.cancel(); } catch (e) {} }
        var from = el.__moFrom || '0 26px';
        el.classList.remove('mo-h');
        el.__moA = el.animate(
            [{ opacity: 0, translate: from, scale: '0.985' }, { opacity: 1, translate: '0 0', scale: '1' }],
            { duration: 720, delay: delay || 0, easing: EASE, fill: 'backwards' });
    }
    function hide(el, up) {
        if (el.__mo === 'out') return;
        el.__mo = 'out';
        el.__moFrom = up ? '0 -22px' : '0 26px';
        if (el.__moA) { try { el.__moA.cancel(); } catch (e) {} }
        var a = el.__moA = el.animate(
            [{ opacity: 1, translate: '0 0', scale: '1' }, { opacity: 0, translate: up ? '0 -22px' : '0 22px', scale: '0.985' }],
            { duration: 420, easing: 'ease-in', fill: 'forwards' });
        a.onfinish = function () {
            if (el.__mo !== 'out') return;
            el.classList.add('mo-h');
            try { a.cancel(); } catch (e) {}
        };
    }

    function onEntries(entries) {
        var i = 0;
        entries.forEach(function (en) {
            var el = en.target, r = en.boundingClientRect, h = vh();
            if (en.isIntersecting) { show(el, Math.min(i++, 5) * 60); return; }
            // Out of view sideways (a horizontal row) — leave it as it is.
            if (r.bottom > h * 0.06 && r.top < h * 0.94) return;
            hide(el, r.bottom <= h * 0.06);
        });
    }

    function scan() {
        var nodes;
        try { nodes = document.querySelectorAll(TARGETS); } catch (e) { return; }
        var fresh = [];
        for (var i = 0; i < nodes.length && fresh.length < 600; i++) {
            var el = nodes[i];
            if (seen ? seen.has(el) : el.__moSeen) continue;
            if (seen) seen.add(el); else el.__moSeen = true;
            if (el.closest(SKIP) || pinned(el) || inTracked(el)) continue;
            fresh.push(el);
        }
        // Keep the innermost: a block that holds other animated things lets them move on their own.
        var set = fresh.filter(function (el) {
            for (var j = 0; j < fresh.length; j++) if (fresh[j] !== el && el.contains(fresh[j])) return false;
            return true;
        });
        if (!io) io = new IntersectionObserver(onEntries, { rootMargin: '-6% 0px -6% 0px', threshold: 0 });
        var h = vh();
        set.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (!r.width && !r.height) return;              // hidden for now (display:none) — never touched
            el.__moT = true;
            if (r.bottom > 0 && r.top < h) el.__mo = 'in';  // on screen already: stays as it is
            else { el.__mo = 'out'; el.__moFrom = r.top >= h ? '0 26px' : '0 -22px'; el.classList.add('mo-h'); }
            io.observe(el);
        });
    }

    // Safety net: anything still hidden that sits well inside the screen is shown.
    var sweepT = null;
    function sweep() {
        sweepT = null;
        var h = vh(), list = document.querySelectorAll('.mo-h');
        for (var i = 0; i < list.length; i++) {
            var r = list[i].getBoundingClientRect();
            if (r.top < h * 0.85 && r.bottom > h * 0.15) show(list[i], 0);
        }
    }
    window.addEventListener('scroll', function () { if (!sweepT) sweepT = setTimeout(sweep, 260); }, { passive: true });

    function start() {
        scan();
        // Lists built by script (the feed, the cart, My products…) are picked up as they mount.
        var t = null;
        new MutationObserver(function () {
            if (t) return;
            t = setTimeout(function () { t = null; scan(); }, 150);
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
