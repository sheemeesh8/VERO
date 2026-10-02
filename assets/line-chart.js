/* ------------------------------------------------------------------
   moravchick — the site's line chart (styles in line-chart.css).

     el.innerHTML = veroLineChart(values, {
         color:  (ignored)          // colour follows the trend: green up, blue sideways, red down
         format: v => '₪' + v,      // how a value reads (dots + tooltip)
         group:  'sum' | 'last',    // how a long series is grouped (default 'sum')
         labels: ['Jan', …],        // optional: point names for the tooltip
         axis:   ['Jan', …]         // optional: a date row under the chart
     });

   Values run oldest → newest, left → right, from one edge of the screen to
   the other. The shape is drawn by a field of thin vertical lines cut by a
   smooth curve through the data; every point where the line breaks (each
   change of direction or angle, and both ends) gets a solid dot with its
   value. The colour follows the overall trend — green rising, blue
   sideways, red falling — and the lines fade toward the base. Series
   longer than 12 points are grouped first so every label has room.
   Hover / tap shows the value at any point.
------------------------------------------------------------------ */
(function () {
    'use strict';

    var TOP = 16, BOT = 86;   // plot band, % of the height (room for labels above / below)
    var MAX_PTS = 12;         // a value label on every break needs room: long series are grouped

    // Group a long series into at most MAX_PTS points: 'sum' for flows (revenue,
    // spend per day), 'last' for levels (followers, cumulative totals).
    function group(v, how) {
        if (v.length <= MAX_PTS) return v.slice();
        var out = [], size = v.length / MAX_PTS;
        for (var g = 0; g < MAX_PTS; g++) {
            var a = Math.round(g * size), b = Math.round((g + 1) * size), part = v.slice(a, b);
            out.push(how === 'last' ? part[part.length - 1] : part.reduce(function (s, x) { return s + x; }, 0));
        }
        return out;
    }

    // Every break in the line: each point where its direction or angle changes,
    // plus both ends. A point exactly in line with its neighbours isn't a break.
    // The value sits above a point that rises over its neighbours, below one that dips.
    function breaks(v) {
        var n = v.length, out = [];
        for (var i = 0; i < n; i++) {
            if (i > 0 && i < n - 1 && (v[i] - v[i - 1]) === (v[i + 1] - v[i])) continue;
            var ref = i === 0 ? v[1] : i === n - 1 ? v[n - 2] : (v[i - 1] + v[i + 1]) / 2;
            out.push({ i: i, up: n < 2 || v[i] >= ref });
        }
        return out;
    }

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    // Monotone cubic interpolation (Fritsch–Carlson) through (xs, ys):
    // returns y(x) for any x in 0..100.
    function curve(xs, ys) {
        var n = xs.length;
        if (n < 2) return function () { return ys[0]; };
        var d = [], m = [], i;
        for (i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
        m.push(d[0]);
        for (i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
        m.push(d[n - 2]);
        return function (x) {
            var j = Math.min(n - 2, Math.max(0, Math.floor((x - xs[0]) / (xs[n - 1] - xs[0]) * (n - 1))));
            var h = xs[j + 1] - xs[j], t = (x - xs[j]) / h, t2 = t * t, t3 = t2 * t;
            return (2 * t3 - 3 * t2 + 1) * ys[j] + (t3 - 2 * t2 + t) * h * m[j] +
                   (-2 * t3 + 3 * t2) * ys[j + 1] + (t3 - t2) * h * m[j + 1];
        };
    }

    // The chart's colour follows its overall trend: a least-squares line through
    // every point, as a share of the series' typical size. Rising ≥ 10% over the
    // period → green; falling ≥ 10% → red; anything between (sideways) → blue.
    var TREND = { up: '#1f8a4c', flat: '#2f6fb5', down: '#c0392b' };
    function trendOf(v) {
        var n = v.length; if (n < 2) return 'flat';
        var mx = (n - 1) / 2, my = v.reduce(function (s, x) { return s + x; }, 0) / n, num = 0, den = 0;
        for (var i = 0; i < n; i++) { num += (i - mx) * (v[i] - my); den += (i - mx) * (i - mx); }
        var size = v.reduce(function (s, x) { return s + Math.abs(x); }, 0) / n || 1;
        var change = (num / den) * (n - 1) / size;
        return change >= 0.1 ? 'up' : change <= -0.1 ? 'down' : 'flat';
    }
    window.veroTrendColor = function (vals) { return TREND[trendOf(vals || [])]; };

    window.veroLineChart = function (vals, opts) {
        opts = opts || {};
        var color = opts.color || '#16150f';
        var fmt = opts.format || function (x) { return Math.round(x).toLocaleString('en-US'); };
        var v = group((vals || []).map(function (x) { return Number(x) || 0; }), opts.group);
        var lbl = opts.labels && opts.labels.length === v.length ? opts.labels : null;
        var n = v.length;
        if (!n) return '<div class="vlc"></div>';
        var trend = trendOf(v);
        color = TREND[trend];   // green rising, blue sideways, red falling
        var max = Math.max.apply(null, v), min = Math.min(0, Math.min.apply(null, v));
        var span = (max - min) || 1;
        var xp = function (i) { return n <= 1 ? 50 : (i / (n - 1)) * 100; };
        var yp = function (x) { return BOT - ((x - min) / span) * (BOT - TOP); };

        // A smooth curve through every point (monotone: no overshoot past the
        // data), drawn only by where a field of vertical hairlines is cut.
        var cy = curve(v.map(function (_, i) { return xp(i); }), v.map(yp));
        var count = Math.max(60, Math.min(220, Math.round((window.innerWidth || 400) / 4.6)));
        var lines = '';
        for (var k = 0; k < count; k++) {
            var lx = (k + 0.5) / count * 100;
            lines += '<line x1="' + lx.toFixed(3) + '" x2="' + lx.toFixed(3) + '" y1="' + cy(lx).toFixed(3) + '" y2="' + BOT + '"/>';
        }
        var svg = '<svg class="vlc-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
            '<g class="vlc-lines" stroke="' + color + '">' + lines + '</g></svg>';

        var marks = breaks(v).map(function (p, k) {
            var x = xp(p.i), y = yp(v[p.i]);
            var edge = x < 7 ? ' at-l' : x > 93 ? ' at-r' : '';
            var delay = 'animation-delay:' + (0.5 + k * 0.06).toFixed(2) + 's';
            return '<span class="vlc-pt" style="left:' + x + '%;top:' + y + '%;color:' + color + ';' + delay + '"></span>' +
                   '<span class="vlc-val' + (p.up ? '' : ' dip') + edge + '" style="left:' + x + '%;top:' + y + '%;' + delay + '">' + esc(fmt(v[p.i])) + '</span>';
        }).join('');

        var data = { y: v.map(function (x) { return +yp(x).toFixed(3); }), t: v.map(function (x) { return fmt(x); }), l: lbl };
        var summary = 'Line chart, ' + n + ' points, from ' + fmt(v[0]) + ' to ' + fmt(v[n - 1]);
        var axis = opts.axis ? '<div class="vlc-x">' + opts.axis.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '';
        summary += ', trend ' + (trend === 'up' ? 'rising' : trend === 'down' ? 'falling' : 'sideways');
        return '<div class="vlc trend-' + trend + '" role="img" aria-label="' + esc(summary) + '" style="color:' + color + '" data-vlc="' + esc(JSON.stringify(data)) + '">' +
            svg + marks +
            '<div class="vlc-hover"><i class="vlc-vline"></i><i class="vlc-hdot"></i><span class="vlc-tip"></span></div>' +
            '</div>' + axis;
    };

    // ---- Values and dots wear a patch of the surface the chart sits on, so they
    //      read clearly over the lines. Found once per chart after it lands. ----
    function opaque(c) { return c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c); }
    // The colour actually showing behind the chart: the first painted surface
    // under its lower part on screen (a page can paint its backdrop with a fixed
    // layer that isn't an ancestor). Null while the chart isn't on screen yet.
    function surfaceOf(el) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height || !document.elementsFromPoint) return null;
        var x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
        var y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height * 0.95));
        var stack = document.elementsFromPoint(x, y);
        for (var i = 0; i < stack.length; i++) {
            if (el.contains(stack[i])) continue;
            var c = getComputedStyle(stack[i]).backgroundColor;
            if (opaque(c)) return c;
        }
        return '#fff';
    }
    function paint() {
        document.querySelectorAll('.vlc:not([data-bg])').forEach(function (c) {
            var bg = surfaceOf(c);
            if (!bg) return;                     // not on screen yet — try again later
            c.style.setProperty('--vlc-bg', bg);
            c.setAttribute('data-bg', '1');
        });
    }
    var queued = false;
    function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; paint(); }); }
    function bootPaint() {
        schedule();
        try {
            new MutationObserver(schedule).observe(document.body,
                { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
        } catch (e) {}
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        window.addEventListener('load', schedule);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootPaint);
    else bootPaint();

    // ---- Hover / tap: one delegated handler for every chart on the page ----
    var hideTimer = null;
    function show(chart, clientX) {
        var data; try { data = JSON.parse(chart.getAttribute('data-vlc')); } catch (e) { return; }
        var n = data.y.length; if (!n) return;
        var r = chart.getBoundingClientRect();
        var f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        var i = n <= 1 ? 0 : Math.round(f * (n - 1));
        var x = n <= 1 ? 50 : i / (n - 1) * 100;
        var h = chart.querySelector('.vlc-hover');
        h.querySelector('.vlc-vline').style.left = x + '%';
        var dot = h.querySelector('.vlc-hdot'); dot.style.left = x + '%'; dot.style.top = data.y[i] + '%';
        var tip = h.querySelector('.vlc-tip');
        tip.innerHTML = esc(data.t[i]) + (data.l && data.l[i] ? '<small>' + esc(data.l[i]) + '</small>' : '');
        // Keep the bubble on screen near the edges.
        tip.style.left = Math.min(Math.max(x, 9), 91) + '%';
        chart.classList.add('is-hover');
    }
    function hide(chart) { if (chart) chart.classList.remove('is-hover'); }
    document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var c = e.target.closest && e.target.closest('.vlc');
        document.querySelectorAll('.vlc.is-hover').forEach(function (x) { if (x !== c) hide(x); });
        if (c) show(c, e.clientX);
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) {
        var c = e.target.closest && e.target.closest('.vlc');
        if (!c || e.pointerType === 'mouse') return;
        show(c, e.clientX);
        clearTimeout(hideTimer); hideTimer = setTimeout(function () { hide(c); }, 2600);
    }, { passive: true });
})();
