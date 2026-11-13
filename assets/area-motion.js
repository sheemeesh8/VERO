/* ============================================================================
   area-motion.js — scroll-in reveals and counting figures for the personal
   area, the seller area and their statistics dashboards (area-motion.css).

   Fails open: with reduced motion, or without IntersectionObserver, it does
   nothing and the page is simply shown. Elements are only hidden once they
   are being watched, and a safety timer shows anything still waiting.
   ========================================================================== */
(function veroAreaMotion() {
    'use strict';
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce || typeof IntersectionObserver === 'undefined' || typeof WeakSet === 'undefined') return;

    // Blocks that fade up as they come on screen.
    var REVEAL = [
        '.card', '.gstat', '.row', '.vdn-row', '.vdn-ring', '.quick .btn', '.na-grid > *', '.po-tabs',
        '.sss-meter', '.sss-cap', '.sss-field', '.ar-cap', '.ps-field', '.ps-update'
    ].join(',');
    // Section rules: the line draws instead of the block moving.
    var RULES = '.sec-title, .sss-head, .ar-h, .ps-title--sub';
    // Figures that count up from zero the first time they are seen.
    var COUNT = '.kpi-num, .gstat-num, .vdn-mid b, .sa-reach b, .psa-stats b, .sss-meter-pct';

    var seen = new WeakSet(), counted = new WeakSet(), waitingCount = [];

    /* ---------- reveal ---------- */
    var batch = [], batchTimer = null;
    function flush() {
        batchTimer = null;
        batch.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
        batch.forEach(function (el, i) {
            el.style.setProperty('--am-d', (Math.min(i, 7) * 0.06).toFixed(2) + 's');
            el.classList.add('am-in');
            // Once it has arrived, drop the classes so nothing lingers on the element.
            setTimeout(function () { el.classList.remove('am-wait', 'am-in', 'am-rule'); el.style.removeProperty('--am-d'); }, 1700 + Math.min(i, 7) * 60);
        });
        batch = [];
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            batch.push(en.target);
        });
        if (batch.length && !batchTimer) batchTimer = setTimeout(flush, 40);
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

    /* ---------- counting figures ---------- */
    function parse(text) {
        var m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/.exec((text || '').trim());
        if (!m) return null;
        var raw = m[2].replace(/,/g, ''), dec = (raw.split('.')[1] || '').length, val = parseFloat(raw);
        if (!isFinite(val) || val === 0) return null;
        return { pre: m[1], post: m[3], val: val, dec: dec };
    }
    function count(el) {
        var p = parse(el.textContent);
        if (!p) return false;
        counted.add(el);
        var final = el.textContent, t0 = null, last = null, dur = 900 + Math.min(500, String(Math.round(p.val)).length * 90);
        var fmt = function (v) { return p.pre + v.toLocaleString('en-US', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) + p.post; };
        function step(t) {
            // The page wrote a new value meanwhile (range switch, live data): leave it alone.
            if (last !== null && el.textContent !== last) return;
            if (t0 === null) t0 = t;
            var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            last = k < 1 ? fmt(p.val * e) : final;
            el.textContent = last;
            if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        return true;
    }
    var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting || counted.has(en.target)) return;
            if (count(en.target)) cio.unobserve(en.target);
            else if (waitingCount.indexOf(en.target) < 0) waitingCount.push(en.target);   // no value yet ("—")
        });
    }, { threshold: 0.4 });

    /* ---------- scanning (content is rendered and re-rendered by the pages) ---------- */
    function scan() {
        var els;
        try { els = document.querySelectorAll(REVEAL + ',' + RULES); } catch (e) { return; }
        els.forEach(function (el) {
            if (seen.has(el)) return;
            seen.add(el);
            // Sheets, sliders' off-screen pages and fixed chrome keep their own motion.
            if (el.closest('.po-modal, [hidden]')) return;
            if (el.matches(RULES)) el.classList.add('am-rule');
            el.classList.add('am-wait');
            io.observe(el);
        });
        document.querySelectorAll(COUNT).forEach(function (el) {
            if (seen.has(el)) return;
            seen.add(el);
            cio.observe(el);
        });
        // Figures that were on screen but empty: count them once their value lands.
        waitingCount = waitingCount.filter(function (el) { return !(document.contains(el) && !counted.has(el) && count(el) && (cio.unobserve(el), true)); });
    }

    /* The headline figure eases in again whenever its range tab changes it. */
    function watchHeadline() {
        var el = document.getElementById('hcTotal');
        if (!el) return;
        document.addEventListener('click', function (e) {
            if (!e.target.closest || !e.target.closest('.hc-dots span')) return;
            el.classList.remove('am-swap'); void el.offsetWidth; el.classList.add('am-swap');
        });
    }

    var pending = false;
    function schedule() { if (pending) return; pending = true; setTimeout(function () { pending = false; scan(); }, 60); }
    function boot() {
        scan(); watchHeadline();
        try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
        // Safety net: never leave anything hidden if an observer misses it.
        setInterval(function () {
            document.querySelectorAll('.am-wait:not(.am-in)').forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) return;                    // not laid out (hidden tab)
                if (r.top < (window.innerHeight || 800) && r.bottom > 0) { io.unobserve(el); batch.push(el); }
            });
            if (batch.length && !batchTimer) batchTimer = setTimeout(flush, 40);
        }, 1500);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
