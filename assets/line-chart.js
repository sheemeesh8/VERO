/* ------------------------------------------------------------------
   moravchick — the site's line chart (styles in line-chart.css).

     el.innerHTML = veroLineChart(values, {
         color:  (ignored)          // colour follows the trend: green up, blue sideways, red down
         format: v => '₪' + v,      // how a value reads (dots + tooltip)
         group:  'sum' | 'last',    // how a long series is grouped (default 'sum')
         labels: ['Jan', …],        // optional: point names for the tooltip
         axis:   ['Jan', …]         // optional: a date row under the chart
         style:  'hairline' (default) | 'area' | 'step' | 'dots' | 'baseline' | 'delta'
     });

   Styles — the same data, hover and trend colour, drawn differently:
     hairline  the field of thin vertical lines described below
     area      a smooth line over a fill that fades down
     step      a right-angled line (levels that jump: totals, counts)
     dots      one dot per point with a dashed trend line through them
     baseline  green above the first point's level, red below it
     delta     a bar per point for its change from the one before (up / down)
   veroSpark(values) returns a tiny line for inside a figure tile.

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
        if (opts.style && opts.style !== 'hairline') return styled(opts.style, v, lbl, fmt, trend, color, opts);
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
            svg + '<i class="vlc-sheen" aria-hidden="true"></i>' + marks +
            '<div class="vlc-hover"><i class="vlc-vline"></i><i class="vlc-hdot"></i><span class="vlc-tip"></span></div>' +
            '</div>' + axis;
    };

    // ---- The other styles (see the header). Same wrapper + data as the hairline
    //      chart, so the hover layer, axis row and trend colour work unchanged. ----
    function styled(style, v, lbl, fmt, trend, color, opts) {
        var n = v.length, i, T = 14, B = 88;
        var max = Math.max.apply(null, v), min = Math.min.apply(null, v), pad = (max - min) * 0.14 || Math.abs(max) * 0.1 || 1;
        var lo = min - pad, span = (max - lo) || 1;
        var xs = v.map(function (_, k) { return n <= 1 ? 50 : (k / (n - 1)) * 100; });
        var yp = function (x) { return B - ((x - lo) / span) * (B - T); };
        var ys = v.map(yp), texts = v.map(function (x) { return fmt(x); });
        var NS = ' vector-effect="non-scaling-stroke"', inner = '', dots = '', id = 'vl' + Math.random().toString(36).slice(2, 8);
        var smooth = function () {
            var cy = curve(xs, ys), d = '', steps = Math.max(40, n * 8);
            for (var k = 0; k <= steps; k++) { var x = k / steps * 100; d += (k ? ' L' : 'M') + x.toFixed(2) + ',' + cy(x).toFixed(2); }
            return d;
        };
        var endDot = function (c) { return '<span class="vlc-pt vlc-end" style="left:' + xs[n - 1] + '%;top:' + ys[n - 1] + '%;color:' + c + '"></span>'; };

        if (style === 'area') {
            var d = smooth();
            inner = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity="0.28"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
                '<path d="' + d + ' L100,100 L0,100 Z" fill="url(#' + id + ')"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2"' + NS + ' stroke-linejoin="round"/>';
            dots = endDot(color);
        } else if (style === 'step') {
            var sd = 'M0,' + ys[0].toFixed(2);
            for (i = 1; i < n; i++) sd += ' H' + xs[i].toFixed(2) + ' V' + ys[i].toFixed(2);
            inner = '<path d="' + sd + ' V100 H0 Z" fill="' + color + '" fill-opacity="0.08"/><path d="' + sd + '" fill="none" stroke="' + color + '" stroke-width="2"' + NS + '/>';
            dots = endDot(color);
        } else if (style === 'dots') {
            var mx = (n - 1) / 2, my = v.reduce(function (a, b) { return a + b; }, 0) / n, num = 0, den = 0;
            for (i = 0; i < n; i++) { num += (i - mx) * (v[i] - my); den += (i - mx) * (i - mx); }
            var k1 = den ? num / den : 0, a0 = my - k1 * mx;
            inner = '<line x1="0" y1="' + yp(a0).toFixed(2) + '" x2="100" y2="' + yp(a0 + k1 * (n - 1)).toFixed(2) + '" stroke="' + color + '" stroke-width="2" stroke-dasharray="6 6"' + NS + '/>';
            // Inset a little so the first and last dots are whole.
            xs = xs.map(function (x) { return 4 + x * 0.92; });
            for (i = 0; i < n - 1; i++) dots += '<span class="vlc-dot" style="left:' + xs[i] + '%;top:' + ys[i] + '%"></span>';
            dots += endDot(color);
        } else if (style === 'baseline') {
            var bd = smooth(), by = ys[0], area = bd + ' L100,' + by + ' L0,' + by + ' Z';
            inner = '<defs><clipPath id="' + id + 'a"><rect x="0" y="-10" width="100" height="' + (by + 10) + '"/></clipPath><clipPath id="' + id + 'b"><rect x="0" y="' + by + '" width="100" height="' + (110 - by) + '"/></clipPath></defs>' +
                '<g clip-path="url(#' + id + 'a)"><path d="' + area + '" fill="' + TREND.up + '" fill-opacity="0.14"/><path d="' + bd + '" fill="none" stroke="' + TREND.up + '" stroke-width="2"' + NS + '/></g>' +
                '<g clip-path="url(#' + id + 'b)"><path d="' + area + '" fill="' + TREND.down + '" fill-opacity="0.14"/><path d="' + bd + '" fill="none" stroke="' + TREND.down + '" stroke-width="2"' + NS + '/></g>' +
                '<line x1="0" x2="100" y1="' + by + '" y2="' + by + '" stroke="#8d887e" stroke-width="1" stroke-dasharray="3 4"' + NS + '/>';
            dots = endDot(v[n - 1] >= v[0] ? TREND.up : TREND.down);
        } else {   // delta
            var dl = v.map(function (x, k) { return k ? x - v[k - 1] : 0; }), m = Math.max.apply(null, dl.map(Math.abs)) || 1, mid = (T + B) / 2, hh = (B - T) / 2, bw = 100 / n;
            xs = v.map(function (_, k) { return (k + 0.5) * bw; });
            inner = '<line x1="0" x2="100" y1="' + mid + '" y2="' + mid + '" stroke="#b9b4aa" stroke-width="1"' + NS + '/>';
            ys = dl.map(function (x, k) {
                var h = Math.abs(x) / m * hh, up = x >= 0;
                if (k) inner += '<rect x="' + (xs[k] - bw * 0.3).toFixed(2) + '" y="' + (up ? mid - h : mid).toFixed(2) + '" width="' + (bw * 0.6).toFixed(2) + '" height="' + Math.max(0.6, h).toFixed(2) + '" fill="' + (up ? TREND.up : TREND.down) + '"/>';
                return up ? mid - h : mid + h;
            });
            texts = dl.map(function (x, k) { return k ? (x >= 0 ? '+' : '−') + fmt(Math.abs(x)) : fmt(v[0]); });
        }
        // One value label: the latest point (never a number on every point).
        var lastX = xs[n - 1], val = style === 'delta' ? '' :
            '<span class="vlc-val' + (lastX > 93 ? ' at-r' : '') + '" style="left:' + lastX + '%;top:' + ys[n - 1] + '%">' + esc(texts[n - 1]) + '</span>';
        var data = { y: ys.map(function (y) { return +y.toFixed(3); }), x: xs.map(function (x) { return +x.toFixed(3); }), t: texts, l: lbl };
        var summary = 'Chart, ' + n + ' points, from ' + fmt(v[0]) + ' to ' + fmt(v[n - 1]) + ', trend ' + (trend === 'up' ? 'rising' : trend === 'down' ? 'falling' : 'sideways');
        var axis = opts.axis ? '<div class="vlc-x">' + opts.axis.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '';
        return '<div class="vlc vlc-s vlc-' + style + ' trend-' + trend + '" role="img" aria-label="' + esc(summary) + '" style="color:' + color + '" data-vlc="' + esc(JSON.stringify(data)) + '">' +
            '<svg class="vlc-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + inner + '</svg>' + dots + val +
            '<div class="vlc-hover"><i class="vlc-vline"></i><i class="vlc-hdot"></i><span class="vlc-tip"></span></div></div>' + axis;
    }

    // A tiny line for inside a figure tile: takes the tile's text colour.
    window.veroSpark = function (vals) {
        var v = (vals || []).map(function (x) { return Number(x) || 0; }), n = v.length;
        if (n < 2) return '';
        var max = Math.max.apply(null, v), min = Math.min.apply(null, v), span = (max - min) || 1;
        var xs = v.map(function (_, k) { return k / (n - 1) * 100; }), ys = v.map(function (x) { return 26 - (x - min) / span * 22; });
        var cy = curve(xs, ys), d = '';
        for (var k = 0; k <= 40; k++) { var x = k / 40 * 100; d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + cy(x).toFixed(1); }
        return '<svg class="vsp" viewBox="0 -2 100 32" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>';
    };

    // ---- Hover / tap: one delegated handler for every chart on the page ----
    var hideTimer = null;
    function show(chart, clientX) {
        var data; try { data = JSON.parse(chart.getAttribute('data-vlc')); } catch (e) { return; }
        var n = data.y.length; if (!n) return;
        var r = chart.getBoundingClientRect();
        var f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        var i = n <= 1 ? 0 : Math.round(f * (n - 1));
        var x = n <= 1 ? 50 : i / (n - 1) * 100;
        if (data.x) {   // styles that place points off the even grid (bars, inset dots)
            var best = 1e9; for (var k = 0; k < n; k++) { var dd = Math.abs(data.x[k] - f * 100); if (dd < best) { best = dd; i = k; } }
            x = data.x[i];
        }
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

/* ------------------------------------------------------------------
   Two more chart types, same look (styles in line-chart.css).

     el.innerHTML = veroDonut([{ label, value }, …], { format, center, centerLabel });
       A ring split by share, the total in the middle, a legend beneath.

     el.innerHTML = veroBars(values, { format, labels });
       Thin rounded columns, oldest → newest; the value sits on each column
       and the newest column takes the trend colour.
------------------------------------------------------------------ */
(function () {
    'use strict';
    var PALETTE = ['#16150f', '#c9922b', '#2f6fb5', '#1f8a4c', '#b9b4aa', '#c0392b'];
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function num(x) { return Math.round(x).toLocaleString('en-US'); }

    window.veroDonut = function (items, opts) {
        opts = opts || {};
        var fmt = opts.format || num;
        items = (items || []).filter(function (it) { return (Number(it.value) || 0) > 0; });
        var total = items.reduce(function (s, it) { return s + Number(it.value); }, 0);
        if (!total) return '<div class="empty">No data yet</div>';
        var R = 15.915, C = 2 * Math.PI * R, off = 0, gap = items.length > 1 ? 0.6 : 0;
        var arcs = items.map(function (it, i) {
            var len = Number(it.value) / total * C, seg = Math.max(0.01, len - gap);
            var a = '<circle class="vdn-seg" cx="21" cy="21" r="' + R + '" stroke="' + PALETTE[i % PALETTE.length] +
                    '" stroke-dasharray="' + seg.toFixed(3) + ' ' + (C - seg).toFixed(3) + '" stroke-dashoffset="' + (-off).toFixed(3) +
                    '" style="animation-delay:' + (i * 0.08).toFixed(2) + 's"/>';
            off += len; return a;
        }).join('');
        var legend = items.map(function (it, i) {
            var pct = Math.round(Number(it.value) / total * 100);
            return '<div class="vdn-row"><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' +
                   '<span class="vdn-name">' + esc(it.label) + '</span><span class="vdn-pct">' + pct + '%</span>' +
                   '<span class="vdn-val">' + esc(fmt(Number(it.value))) + '</span></div>';
        }).join('');
        return '<div class="vdn" role="img" aria-label="' + esc('Share chart, ' + items.length + ' parts, total ' + fmt(total)) + '">' +
            '<div class="vdn-ring"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="' + R + '" class="vdn-track"/>' + arcs + '</svg>' +
            '<div class="vdn-mid"><b>' + esc(opts.center != null ? opts.center : fmt(total)) + '</b><span>' + esc(opts.centerLabel || 'Total') + '</span></div></div>' +
            '<div class="vdn-legend">' + legend + '</div></div>';
    };

    window.veroBars = function (vals, opts) {
        opts = opts || {};
        var fmt = opts.format || num;
        var v = (vals || []).map(function (x) { return Number(x) || 0; });
        if (!v.length) return '<div class="vbr"></div>';
        var max = Math.max.apply(null, v) || 1;
        var tone = window.veroTrendColor ? window.veroTrendColor(v) : '#16150f';
        var cols = v.map(function (x, i) {
            var h = Math.max(2, x / max * 100), last = i === v.length - 1;
            return '<div class="vbr-col' + (last ? ' is-last' : '') + '">' +
                '<span class="vbr-val">' + esc(fmt(x)) + '</span>' +
                '<span class="vbr-bar" style="height:' + h.toFixed(1) + '%;' + (last ? 'background:' + tone + ';' : '') +
                'animation-delay:' + (i * 0.05).toFixed(2) + 's"></span>' +
                (opts.labels ? '<span class="vbr-lbl">' + esc(opts.labels[i] || '') + '</span>' : '') + '</div>';
        }).join('');
        return '<div class="vbr" role="img" aria-label="' + esc('Bar chart, ' + v.length + ' bars, latest ' + fmt(v[v.length - 1])) + '">' + cols + '</div>';
    };
})();
