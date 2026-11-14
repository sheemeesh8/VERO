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
     line      a straight line from point to point with a marker on each
     lollipop  a thin stem and a marker per point
     heat      a strip of blocks, darker where the value is higher
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

    // Every chart remembers its numbers so it can also be shown as a pie
    // (swipe sideways on the chart, or use the small switch under it).
    var SHARE = window.__veroShare = window.__veroShare || { n: 0, map: {} };
    function remember(v, lbl, fmt, opts) {
        var id = 's' + (++SHARE.n);
        SHARE.map[id] = { v: v, l: lbl, fmt: fmt, level: opts.level != null ? !!opts.level : opts.group === 'last' };
        return ' data-vsw="' + id + '"';
    }
    window.veroRememberShare = remember;

    /* Plain words around every chart, so nobody has to decode it:
         • a sentence ABOVE it saying what the numbers show (opts.say: a string
           replaces it, false removes it);
         • a short key BELOW it saying how to read the drawing. */
    function sayFor(v, lbl, fmt, opts) {
        if (opts.say === false) return '';
        if (typeof opts.say === 'string') return '<p class="vsay">' + opts.say + '</p>';
        var n = v.length; if (n < 2 || !lbl) return '';
        var last = v[n - 1], prev = v[n - 2], hi = v.indexOf(Math.max.apply(null, v)), lo = v.indexOf(Math.min.apply(null, v)), t;
        if (opts.parts) {            // separate things side by side (weekdays): name the most and the least
            t = 'Most on <b>' + esc(lbl[hi]) + '</b> (' + esc(fmt(v[hi])) + '), least on <b>' + esc(lbl[lo]) + '</b> (' + esc(fmt(v[lo])) + ').';
        } else if (opts.level != null ? opts.level : opts.group === 'last') {   // a running total
            var d = last - prev;
            t = '<b>' + esc(fmt(last)) + '</b> so far. ' + esc(lbl[n - 1]) + (d >= 0 ? ' added ' : ' took off ') + esc(fmt(Math.abs(d))) + '.';
        } else {
            t = '<b>' + esc(lbl[n - 1]) + ': ' + (last === 0 ? 'nothing yet' : esc(fmt(last))) + '</b>';
            if (prev > 0 && last !== 0) { var pc = Math.round((last - prev) / prev * 100); t += pc === 0 ? ', the same as ' + esc(lbl[n - 2]) : ', ' + Math.abs(pc) + '% ' + (pc > 0 ? 'more' : 'less') + ' than ' + esc(lbl[n - 2]); }
            t += '.' + (hi !== n - 1 ? ' The highest was ' + esc(lbl[hi]) + ' (' + esc(fmt(v[hi])) + ').' : ' That is the highest so far.');
        }
        return '<p class="vsay">' + t + '</p>';
    }
    var UP = '<i class="vkey-sw" style="background:#1f8a4c"></i>', DOWN = '<i class="vkey-sw" style="background:#c0392b"></i>', INK = '<i class="vkey-sw" style="background:#16150f"></i>';
    var KEYS = {
        hairline: 'Left is the oldest, right is the newest. Higher means more.',
        area:     'Left is the oldest, right is the newest. Higher means more.',
        line:     'Each marker is one period, oldest on the left.',
        step:     'A running total: every step up is what that period added.',
        dots:     'Each dot is one period. The dashed line shows the overall direction.',
        baseline: UP + 'above where it started &nbsp; ' + DOWN + 'below where it started',
        delta:    UP + 'more than the period before &nbsp; ' + DOWN + 'less than the period before',
        lollipop: 'Each stick is one period. Taller means more; the coloured one is the latest.',
        heat:     'Each block is one day. ' + INK + 'darker means more.',
        bars:     'Each column is one period. ' + INK + 'the dark one is the latest.',
        barsmax:  'Each column is one day. ' + INK + 'the dark one is the highest.',
        hbars:    'Longer bar means more. ' + INK + 'the dark one is the highest.'
    };
    function keyFor(name, opts) { return opts.key === false ? '' : '<p class="vkey">' + (typeof opts.key === 'string' ? opts.key : KEYS[name] || '') + '</p>'; }
    window.veroChartWords = { say: sayFor, key: keyFor };
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
        return sayFor(v, lbl, fmt, opts) + '<div class="vlc trend-' + trend + '"' + remember(v, lbl, fmt, opts) + ' role="img" aria-label="' + esc(summary) + '" style="color:' + color + '" data-vlc="' + esc(JSON.stringify(data)) + '">' +
            svg + '<i class="vlc-sheen" aria-hidden="true"></i>' + marks +
            '<div class="vlc-hover"><i class="vlc-vline"></i><i class="vlc-hdot"></i><span class="vlc-tip"></span></div>' +
            '</div>' + axis + keyFor('hairline', opts);
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
            for (i = 0; i < n - 1; i++) dots += '<span class="vlc-dot" style="left:' + xs[i] + '%;top:' + ys[i] + '%;animation-delay:' + (0.2 + i * 0.06).toFixed(2) + 's"></span>';
            dots += endDot(color);
        } else if (style === 'baseline') {
            var bd = smooth(), by = ys[0], area = bd + ' L100,' + by + ' L0,' + by + ' Z';
            inner = '<defs><clipPath id="' + id + 'a"><rect x="0" y="-10" width="100" height="' + (by + 10) + '"/></clipPath><clipPath id="' + id + 'b"><rect x="0" y="' + by + '" width="100" height="' + (110 - by) + '"/></clipPath></defs>' +
                '<g clip-path="url(#' + id + 'a)"><path d="' + area + '" fill="' + TREND.up + '" fill-opacity="0.14"/><path d="' + bd + '" fill="none" stroke="' + TREND.up + '" stroke-width="2"' + NS + '/></g>' +
                '<g clip-path="url(#' + id + 'b)"><path d="' + area + '" fill="' + TREND.down + '" fill-opacity="0.14"/><path d="' + bd + '" fill="none" stroke="' + TREND.down + '" stroke-width="2"' + NS + '/></g>' +
                '<line x1="0" x2="100" y1="' + by + '" y2="' + by + '" stroke="#8d887e" stroke-width="1" stroke-dasharray="3 4"' + NS + '/>';
            dots = endDot(v[n - 1] >= v[0] ? TREND.up : TREND.down);
        } else if (style === 'line') {
            var ld = '';
            for (i = 0; i < n; i++) ld += (i ? ' L' : 'M') + xs[i].toFixed(2) + ',' + ys[i].toFixed(2);
            inner = '<path d="' + ld + '" fill="none" stroke="' + color + '" stroke-width="2"' + NS + ' stroke-linejoin="miter"/>';
            for (i = 0; i < n - 1; i++) dots += '<span class="vlc-dot vlc-dot--mark" style="left:' + xs[i] + '%;top:' + ys[i] + '%;background:' + color + ';animation-delay:' + (0.2 + i * 0.07).toFixed(2) + 's"></span>';
            dots += endDot(color);
        } else if (style === 'lollipop') {
            var lw = 100 / n;
            xs = v.map(function (_, k) { return (k + 0.5) * lw; });
            for (i = 0; i < n; i++) {
                inner += '<line x1="' + xs[i].toFixed(2) + '" x2="' + xs[i].toFixed(2) + '" y1="' + B + '" y2="' + ys[i].toFixed(2) + '" stroke="' + (i === n - 1 ? color : '#b9b4aa') + '" stroke-width="2"' + NS + ' class="vlc-stem" style="animation-delay:' + (0.1 + i * 0.06).toFixed(2) + 's"/>';
                if (i < n - 1) dots += '<span class="vlc-dot vlc-dot--mark" style="left:' + xs[i] + '%;top:' + ys[i] + '%;animation-delay:' + (0.4 + i * 0.06).toFixed(2) + 's"></span>';
            }
            inner += '<line x1="0" x2="100" y1="' + B + '" y2="' + B + '" stroke="#d6d2c8" stroke-width="1"' + NS + '/>';
            dots += endDot(color);
        } else if (style === 'heat') {
            var hw = 100 / n, hmax = max || 1;
            xs = v.map(function (_, k) { return (k + 0.5) * hw; });
            for (i = 0; i < n; i++) inner += '<rect x="' + (i * hw + 0.4).toFixed(2) + '" y="6" width="' + (hw - 0.8).toFixed(2) + '" height="88" fill="#16150f" fill-opacity="' + (0.1 + 0.9 * (v[i] - min) / ((hmax - min) || 1)).toFixed(3) + '" class="vlc-cell" style="animation-delay:' + (0.1 + i * 0.07).toFixed(2) + 's"/>';   // lightest = the lowest value, darkest = the highest
            ys = v.map(function () { return 50; });
        } else {   // delta
            var dl = v.map(function (x, k) { return k ? x - v[k - 1] : 0; }), m = Math.max.apply(null, dl.map(Math.abs)) || 1, mid = (T + B) / 2, hh = (B - T) / 2, bw = 100 / n;
            xs = v.map(function (_, k) { return (k + 0.5) * bw; });
            inner = '<line x1="0" x2="100" y1="' + mid + '" y2="' + mid + '" stroke="#b9b4aa" stroke-width="1"' + NS + '/>';
            ys = dl.map(function (x, k) {
                var h = Math.abs(x) / m * hh, up = x >= 0;
                if (k) inner += '<rect x="' + (xs[k] - bw * 0.3).toFixed(2) + '" y="' + (up ? mid - h : mid).toFixed(2) + '" width="' + (bw * 0.6).toFixed(2) + '" height="' + Math.max(0.6, h).toFixed(2) + '" fill="' + (up ? TREND.up : TREND.down) + '" class="vlc-bar ' + (up ? 'is-up' : 'is-down') + '" style="animation-delay:' + (0.15 + k * 0.05).toFixed(2) + 's"/>';
                return up ? mid - h : mid + h;
            });
            texts = dl.map(function (x, k) { return k ? (x >= 0 ? '+' : '−') + fmt(Math.abs(x)) : fmt(v[0]); });
        }
        // One value label: the latest point (never a number on every point).
        var lastX = xs[n - 1], val = (style === 'delta' || style === 'heat') ? '' :
            '<span class="vlc-val' + (lastX > 93 ? ' at-r' : '') + '" style="left:' + lastX + '%;top:' + ys[n - 1] + '%">' + esc(texts[n - 1]) + '</span>';
        var data = { y: ys.map(function (y) { return +y.toFixed(3); }), x: xs.map(function (x) { return +x.toFixed(3); }), t: texts, l: lbl };
        var summary = 'Chart, ' + n + ' points, from ' + fmt(v[0]) + ' to ' + fmt(v[n - 1]) + ', trend ' + (trend === 'up' ? 'rising' : trend === 'down' ? 'falling' : 'sideways');
        var axis = opts.axis ? '<div class="vlc-x">' + opts.axis.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '';
        if (style === 'heat' && opts.parts == null) opts.parts = true;
        return sayFor(v, lbl, fmt, opts) + '<div class="vlc vlc-s vlc-' + style + ' trend-' + trend + '"' + remember(v, lbl, fmt, opts) + ' role="img" aria-label="' + esc(summary) + '" style="color:' + color + '" data-vlc="' + esc(JSON.stringify(data)) + '">' +
            '<svg class="vlc-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + inner + '</svg>' + dots + val +
            '<div class="vlc-hover"><i class="vlc-vline"></i><i class="vlc-hdot"></i><span class="vlc-tip"></span></div></div>' + axis + keyFor(style, opts);
    }

    // A tiny line for inside a figure tile: takes the tile's text colour.
    window.veroSpark = function (vals) {
        var v = (vals || []).map(function (x) { return Number(x) || 0; }), n = v.length;
        if (n < 2) return '';
        var max = Math.max.apply(null, v), min = Math.min.apply(null, v), span = (max - min) || 1;
        var xs = v.map(function (_, k) { return k / (n - 1) * 100; }), ys = v.map(function (x) { return 26 - (x - min) / span * 22; });
        var cy = curve(xs, ys), d = '';
        for (var k = 0; k <= 40; k++) { var x = k / 40 * 100; d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + cy(x).toFixed(1); }
        return '<svg class="vsp" viewBox="0 -2 100 32" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" pathLength="1" class="vsp-line"/></svg>';
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

     el.innerHTML = veroDonut([{ label, value }, …], { format, center, centerLabel, style });
       A ring split by share, the total in the middle, a legend beneath.
       style picks another way to draw the same shares:
         'ring' (default)  thin ring            'donut'   thick ring with gaps
         'pie'             full pie             'half'    half ring, total at the base
         'split'           one bar cut by share 'ranked'  a row and bar per part
         'waffle'          100 squares, 1% each 'rings'   one arc per part, nested
         'stack'           one upright column   'blocks'  a square per part, sized by share
         'tree'            a rectangle cut into areas by share

     el.innerHTML = veroBars(values, { format, labels, mark, horizontal });
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
        // In plain words: which part is the biggest (opts.say: a string replaces it, false removes it).
        var top = items.reduce(function (a, b) { return Number(b.value) > Number(a.value) ? b : a; }, items[0]);
        var named = top.label === 'Other' && items.length > 1 ? items.filter(function (it) { return it.label !== 'Other'; }).reduce(function (a, b) { return Number(b.value) > Number(a.value) ? b : a; }) : top;
        opts._say = opts.say === false ? '' : '<p class="vsay">' + (typeof opts.say === 'string' ? opts.say :
            'The biggest part is <b>' + esc(named.label) + '</b>: ' + Math.round(Number(named.value) / total * 100) + '% (' + esc(fmt(Number(named.value))) + ').') + '</p>';
        opts._key = opts.key ? '<p class="vkey">' + opts.key + '</p>' : '';
        if (opts.style && opts.style !== 'ring') return share(opts.style, items, total, fmt, opts);
        var R = 15.915, C = 2 * Math.PI * R, off = 0, gap = items.length > 1 ? 0.6 : 0;
        var arcs = items.map(function (it, i) {
            var len = Number(it.value) / total * C, seg = Math.max(0.01, len - gap);
            var a = '<circle class="vdn-seg" data-i="' + i + '" cx="21" cy="21" r="' + R + '" stroke="' + PALETTE[i % PALETTE.length] +
                    '" stroke-dasharray="' + seg.toFixed(3) + ' ' + (C - seg).toFixed(3) + '" stroke-dashoffset="' + (-off).toFixed(3) +
                    '" style="animation-delay:' + (i * 0.08).toFixed(2) + 's"/>';
            off += len; return a;
        }).join('');
        var legend = items.map(function (it, i) {
            var pct = Math.round(Number(it.value) / total * 100);
            return '<div class="vdn-row" data-i="' + i + '"><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' +
                   '<span class="vdn-name">' + esc(it.label) + '</span><span class="vdn-pct">' + pct + '%</span>' +
                   '<span class="vdn-val">' + esc(fmt(Number(it.value))) + '</span></div>';
        }).join('');
        return '<div class="vdn" role="img" aria-label="' + esc('Share chart, ' + items.length + ' parts, total ' + fmt(total)) + '">' + opts._say +
            '<div class="vdn-ring"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="' + R + '" class="vdn-track"/>' + arcs + '</svg>' +
            '<div class="vdn-mid"><b>' + esc(opts.center != null ? opts.center : fmt(total)) + '</b><span>' + esc(opts.centerLabel || 'Total') + '</span></div></div>' +
            '<div class="vdn-legend">' + legend + '</div>' + opts._key + '</div>';
    };

    // ---- The other share styles. One ink ramp, largest part darkest; same legend. ----
    var RAMP = ['#16150f', '#56524a', '#8d887e', '#b9b4aa', '#d6d2c8', '#c9922b'];
    function share(style, items, total, fmt, opts) {
        var col = function (i) { return RAMP[i % RAMP.length]; };
        var pctOf = function (it) { return Math.round(Number(it.value) / total * 100); };
        var P = function (cx, cy, r, a) { return (cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2); };
        // A slice between two angles; r0 = inner radius (0 draws a pie wedge).
        var slice = function (r1, r0, a0, a1) {
            if (a1 - a0 >= Math.PI * 2 - 0.001) a1 = a0 + Math.PI * 2 - 0.001;
            var big = a1 - a0 > Math.PI ? 1 : 0;
            return r0 ? 'M' + P(50, 50, r1, a0) + ' A' + r1 + ',' + r1 + ' 0 ' + big + ' 1 ' + P(50, 50, r1, a1) + ' L' + P(50, 50, r0, a1) + ' A' + r0 + ',' + r0 + ' 0 ' + big + ' 0 ' + P(50, 50, r0, a0) + ' Z'
                      : 'M50,50 L' + P(50, 50, r1, a0) + ' A' + r1 + ',' + r1 + ' 0 ' + big + ' 1 ' + P(50, 50, r1, a1) + ' Z';
        };
        var arcs = function (r1, r0, start, sweep, gap) {
            var a = start, out = '', g = items.length > 1 ? gap / r1 / 2 : 0;
            items.forEach(function (it, i) {
                var w = Number(it.value) / total * sweep;
                out += '<path class="vdn-p vdn-arc" data-i="' + i + '" d="' + slice(r1, r0, a + g, Math.max(a + g + 0.002, a + w - g)) + '" fill="' + col(i) + '" style="animation-delay:' + (i * 0.07).toFixed(2) + 's"/>';
                a += w;
            });
            return out;
        };
        var mid = function (cls) { return '<div class="vdn-mid' + (cls || '') + '"><b>' + esc(opts.center != null ? opts.center : fmt(total)) + '</b><span>' + esc(opts.centerLabel || 'Total') + '</span></div>'; };
        var legend = '<div class="vdn-legend">' + items.map(function (it, i) {
            return '<div class="vdn-row" data-i="' + i + '"><i style="background:' + col(i) + '"></i><span class="vdn-name">' + esc(it.label) + '</span><span class="vdn-pct">' + pctOf(it) + '%</span>' +
                   '<span class="vdn-val">' + esc(fmt(Number(it.value))) + '</span></div>';
        }).join('') + '</div>';
        var TOP = -Math.PI / 2, FULL = Math.PI * 2, fig, body;
        var svg = function (inner, vb) { return '<svg viewBox="' + (vb || '0 0 100 100') + '" aria-hidden="true">' + inner + '</svg>'; };

        if (style === 'donut')      fig = '<div class="vdn-fig">' + svg(arcs(48, 28, TOP, FULL, 2.4)) + mid() + '</div>';
        else if (style === 'pie')   fig = '<div class="vdn-fig">' + svg(arcs(48, 0, TOP, FULL, 1.6)) + '</div>';
        else if (style === 'half')  fig = '<div class="vdn-fig vdn-fig--half">' + svg(arcs(48, 30, Math.PI, Math.PI, 2.2), '0 0 100 52') + mid(' vdn-mid--low') + '</div>';
        else if (style === 'split') {
            var x = 0, bars = '';
            items.forEach(function (it, i) { var w = Number(it.value) / total * 100; bars += '<i data-i="' + i + '" style="width:' + w.toFixed(2) + '%;background:' + col(i) + ';animation-delay:' + (i * 0.07).toFixed(2) + 's"></i>'; x += w; });
            fig = '<div class="vdn-split">' + bars + '</div>';
        } else if (style === 'waffle') {
            var cells = [], sq = '';
            items.forEach(function (it, i) { for (var k = 0; k < pctOf(it); k++) cells.push(i); });
            while (cells.length < 100) cells.push(items.length - 1);
            cells.length = 100;
            cells.forEach(function (c, k) { sq += '<rect class="vdn-p vdn-sq" data-i="' + c + '" x="' + (k % 10 * 10 + 0.8) + '" y="' + (Math.floor(k / 10) * 10 + 0.8) + '" width="8.4" height="8.4" fill="' + col(c) + '" style="animation-delay:' + (k * 0.006).toFixed(3) + 's"/>'; });
            fig = '<div class="vdn-fig">' + svg(sq) + '</div>';
        } else if (style === 'rings') {
            var top = Math.max.apply(null, items.map(function (it) { return Number(it.value); })) || 1, step = Math.min(7, 40 / items.length), rg = '';
            items.forEach(function (it, i) {
                var r1 = 48 - i * step, r0 = r1 - step * 0.66;
                rg += '<path d="' + slice(r1, r0, TOP, TOP + FULL * 0.75) + '" fill="#ecebe6"/>' +
                      '<path class="vdn-p vdn-arc" data-i="' + i + '" d="' + slice(r1, r0, TOP, TOP + Number(it.value) / top * FULL * 0.75) + '" fill="' + col(i) + '" style="animation-delay:' + (i * 0.07).toFixed(2) + 's"/>';
            });
            fig = '<div class="vdn-fig">' + svg(rg) + '</div>';
        } else if (style === 'stack') {
            fig = '<div class="vdn-stack">' + items.map(function (it, i) { return '<i data-i="' + i + '" style="flex:' + Number(it.value) + ' 1 0;background:' + col(i) + ';animation-delay:' + (i * 0.07).toFixed(2) + 's"></i>'; }).join('') + '</div>';
        } else if (style === 'blocks') {
            var bmax = Math.max.apply(null, items.map(function (it) { return Number(it.value); })) || 1;
            fig = '<div class="vdn-blocks">' + items.map(function (it, i) { var side = (22 + 62 * Math.sqrt(Number(it.value) / bmax)).toFixed(1);
                return '<i data-i="' + i + '" style="width:' + side + 'px;height:' + side + 'px;background:' + col(i) + ';animation-delay:' + (i * 0.07).toFixed(2) + 's"></i>'; }).join('') + '</div>';
        } else if (style === 'tree') {
            // Slice the rectangle: the largest part takes its share off one side, the rest recurse.
            var tr = '', cut = function (list, sum, x, y, w, h, i) {
                if (!list.length) return;
                var f = Number(list[0].value) / sum, wide = w >= h, cw = wide ? w * f : w, ch = wide ? h : h * f;
                if (list.length === 1) { cw = w; ch = h; }
                tr += '<rect class="vdn-p vdn-tr" data-i="' + i + '" x="' + (x + 0.4).toFixed(2) + '" y="' + (y + 0.4).toFixed(2) + '" width="' + Math.max(0.2, cw - 0.8).toFixed(2) + '" height="' + Math.max(0.2, ch - 0.8).toFixed(2) + '" fill="' + col(i) + '" style="animation-delay:' + (i * 0.07).toFixed(2) + 's"/>';
                if (wide) cut(list.slice(1), sum - Number(list[0].value), x + cw, y, w - cw, h, i + 1); else cut(list.slice(1), sum - Number(list[0].value), x, y + ch, w, h - ch, i + 1);
            };
            cut(items, total, 0, 0, 100, 62, 0);
            fig = '<div class="vdn-fig vdn-fig--wide">' + svg(tr, '0 0 100 62') + '</div>';
        } else {   // ranked
            var big = Math.max.apply(null, items.map(function (it) { return Number(it.value); })) || 1;
            body = '<div class="vdn-rank">' + items.map(function (it, i) {
                return '<div class="vdn-rr vdn-row-r" data-i="' + i + '"><span class="vdn-name">' + esc(it.label) + '</span><span class="vdn-rb"><i style="width:' + (Number(it.value) / big * 100).toFixed(1) + '%;animation-delay:' + (i * 0.07).toFixed(2) + 's"></i></span>' +
                       '<span class="vdn-val">' + esc(fmt(Number(it.value))) + '</span></div>';
            }).join('') + '</div>';
        }
        return '<div class="vdn vdn--' + style + '" role="img" aria-label="' + esc('Share chart, ' + items.length + ' parts, total ' + fmt(total)) + '">' + opts._say + (body || fig + legend) + opts._key + '</div>';
    }

    window.veroBars = function (vals, opts) {
        opts = opts || {};
        var fmt = opts.format || num;
        var v = (vals || []).map(function (x) { return Number(x) || 0; });
        if (!v.length) return '<div class="vbr"></div>';
        var max = Math.max.apply(null, v) || 1;
        var tag = window.veroRememberShare ? window.veroRememberShare(v, opts.labels && opts.labels.length === v.length ? opts.labels : null, fmt, opts) : '';
        var W = window.veroChartWords, blbl = opts.labels && opts.labels.length === v.length ? opts.labels : null;
        if ((opts.horizontal || opts.mark === 'max') && opts.parts == null) opts.parts = true;
        var bsay = W ? W.say(v, blbl, fmt, opts) : '';
        if (opts.horizontal) {   // a row per value: label, bar, value — the longest bar is dark
            return bsay + '<div class="vhb"' + tag + ' role="img" aria-label="' + esc('Bar chart, ' + v.length + ' bars') + '">' + v.map(function (x, i) {
                return '<div class="vhb-r' + (i === v.indexOf(max) ? ' is-top' : '') + '"><span class="vhb-l">' + esc(opts.labels ? opts.labels[i] || '' : '') + '</span>' +
                       '<span class="vhb-t"><i style="width:' + Math.max(1, x / max * 100).toFixed(1) + '%;animation-delay:' + (i * 0.05).toFixed(2) + 's"></i></span><span class="vhb-v">' + esc(fmt(x)) + '</span></div>';
            }).join('') + '</div>' + (W ? W.key('hbars', opts) : '');
        }
        var tone = window.veroTrendColor ? window.veroTrendColor(v) : '#16150f';
        var cols = v.map(function (x, i) {
            // The dark column is the newest one, or the tallest with { mark: 'max' } (e.g. weekdays).
            var h = Math.max(2, x / max * 100), last = opts.mark === 'max' ? i === v.indexOf(max) : i === v.length - 1;
            return '<div class="vbr-col' + (last ? ' is-last' : '') + '">' +
                '<span class="vbr-val">' + esc(fmt(x)) + '</span>' +
                '<span class="vbr-bar" style="height:' + h.toFixed(1) + '%;' + (last && opts.mark !== 'max' ? 'background:' + tone + ';' : '') +
                'animation-delay:' + (i * 0.05).toFixed(2) + 's"></span>' +
                (opts.labels ? '<span class="vbr-lbl">' + esc(opts.labels[i] || '') + '</span>' : '') + '</div>';
        }).join('');
        return bsay + '<div class="vbr"' + tag + ' role="img" aria-label="' + esc('Bar chart, ' + v.length + ' bars, latest ' + fmt(v[v.length - 1])) + '">' + cols + '</div>' + (W ? W.key(opts.mark === 'max' ? 'barsmax' : 'bars', opts) : '');
    };
})();


/* ------------------------------------------------------------------
   Graph ⇄ pie. Every line / bar chart can also be read as a pie of the same
   numbers: swipe sideways on the chart (or on the pie to come back), or tap
   the small switch under it. Each part is one period's share of the total;
   for running totals (levels) it is what each period added. More than six
   periods keep the five largest and fold the rest into "Other".
------------------------------------------------------------------ */
(function () {
    'use strict';
    var SHARE = window.__veroShare; if (!SHARE || !window.veroDonut) return;
    var ICON_G = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l5-6 4 3 8-9"/></svg>';
    var ICON_P = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l7 5"/></svg>';

    function items(rec) {
        var v = rec.v.slice(), l = rec.l ? rec.l.slice() : v.map(function (_, i) { return 'Period ' + (i + 1); });
        if (rec.level) {   // a running total: show what each period added
            v = v.map(function (x, i) { return i ? x - rec.v[i - 1] : 0; }).slice(1); l = l.slice(1);
        }
        var out = v.map(function (x, i) { return { label: String(l[i]), value: Math.max(0, x) }; }).filter(function (it) { return it.value > 0; });
        out.sort(function (a, b) { return b.value - a.value; });
        if (out.length > 6) {
            var rest = out.slice(5).reduce(function (s, it) { return s + it.value; }, 0);
            out = out.slice(0, 5).concat([{ label: 'Other', value: rest }]);
        }
        return out;
    }

    // Every pie on a page is drawn differently: a chart's pie takes the first
    // style not used by the page's own share charts or by another chart's pie.
    // It is remembered on the chart's holder, so a re-drawn chart keeps its style.
    var ALL = ['pie', 'half', 'ring', 'rings', 'stack', 'blocks', 'tree', 'ranked', 'donut', 'split', 'waffle'], turn = 0;
    function styleFor(chart) {
        var host = chart.parentNode;
        if (host._vswStyle) return host._vswStyle;
        var used = {};
        document.querySelectorAll('.vdn').forEach(function (d) {
            if (d.closest('[hidden]') || d.closest('.vsw-pie')) return;
            var m = /vdn--(\w+)/.exec(d.className); used[m ? m[1] : 'ring'] = 1;
        });
        document.querySelectorAll('[data-vsw]').forEach(function (c) { if (c.parentNode._vswStyle && !c.closest('[hidden]')) used[c.parentNode._vswStyle] = 1; });
        var free = ALL.filter(function (s) { return !used[s]; });
        return (host._vswStyle = free.length ? free[0] : ALL[turn++ % ALL.length]);
    }

    function setMode(chart, pie) {
        var rec = SHARE.map[chart.getAttribute('data-vsw')]; if (!rec) return;
        var box = chart._vswPie, sw = chart._vswSwitch;
        if (pie && !box) {
            box = chart._vswPie = document.createElement('div');
            box.className = 'vsw-pie';
            box.innerHTML = window.veroDonut(items(rec), { format: rec.fmt, style: styleFor(chart), centerLabel: rec.level ? 'Added' : 'Total',
                key: rec.level ? 'The same numbers as a pie: each part is what one period added.' : 'The same numbers as a pie: each part is one period’s share of the total.' });
            chart.parentNode.insertBefore(box, chart);
            swipe(box, function () { setMode(chart, false); });
        }
        chart.classList.toggle('vsw-off', pie);
        chart.classList.toggle('is-back', !pie && !!box);
        if (box) box.hidden = !pie;
        // The date row belongs to the graph: hide it with the graph.
        var ax = chart.nextElementSibling;
        while (ax && /\b(vlc-x|vkey)\b/.test(ax.className)) { ax.classList.toggle('vsw-off', pie); ax = ax.nextElementSibling; }
        if (chart._vswKey) chart._vswKey.classList.toggle('vsw-off', pie);
        var sy = chart.previousElementSibling; if (sy === box) sy = box.previousElementSibling;
        if (sy && sy.classList.contains('vsay')) sy.classList.toggle('vsw-off', pie);
        var px = chart.parentNode.nextElementSibling; if (px && px.classList.contains('lc-x')) px.classList.toggle('vsw-off', pie);
        if (sw) { sw.children[0].classList.toggle('on', !pie); sw.children[1].classList.toggle('on', pie);
                  sw.children[0].setAttribute('aria-pressed', String(!pie)); sw.children[1].setAttribute('aria-pressed', String(pie)); }
    }

    // A sideways swipe (touch or mouse drag). Handled on the element itself and
    // not passed on, so a card that swipes for something else doesn't also react.
    function swipe(el, fn) {
        var x0 = null, y0 = 0;
        el.addEventListener('touchstart', function (e) { if (e.touches.length !== 1) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; e.stopPropagation(); }, { passive: true });
        el.addEventListener('touchend', function (e) {
            e.stopPropagation();
            if (x0 === null) return;
            var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
            if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) fn();
        }, { passive: true });
        var mx = null;
        el.addEventListener('mousedown', function (e) { mx = e.clientX; e.stopPropagation(); });
        el.addEventListener('mouseup', function (e) { e.stopPropagation(); if (mx === null) return; var dx = e.clientX - mx; mx = null; if (Math.abs(dx) > 44) fn(); });
        el.addEventListener('mouseleave', function () { mx = null; });
    }

    function enhance(chart) {
        if (chart._vsw) return; chart._vsw = true;
        var rec = SHARE.map[chart.getAttribute('data-vsw')];
        if (!rec || items(rec).length < 2) return;            // nothing to split
        var sw = chart._vswSwitch = document.createElement('div');
        sw.className = 'vsw'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Show as');
        sw.innerHTML = '<button type="button" class="on" aria-pressed="true">' + ICON_G + 'Graph</button><button type="button" aria-pressed="false">' + ICON_P + 'Pie</button>';
        var after = chart;   // the switch goes under the chart, its date row and its key
        while (after.nextElementSibling && /\b(vlc-x|vkey)\b/.test(after.nextElementSibling.className)) after = after.nextElementSibling;
        after.parentNode.insertBefore(sw, after.nextSibling);
        // Where the page keeps the date row outside the chart's holder, the key and
        // the switch go under that row, so the order is always: chart, dates, key, switch.
        var host = chart.parentNode, px = host.nextElementSibling, key = after !== chart && /\bvkey\b/.test(after.className) ? after : null;
        (host._vswExtras || []).forEach(function (el) { if (el.parentNode && el.parentNode !== host) el.parentNode.removeChild(el); });   // left by an earlier drawing
        if (px && px.classList.contains('lc-x')) {
            px.parentNode.insertBefore(sw, px.nextSibling);
            if (key) px.parentNode.insertBefore(key, sw);
        }
        host._vswExtras = [key, sw].filter(Boolean);
        chart._vswKey = key;
        sw.children[0].addEventListener('click', function () { setMode(chart, false); });
        sw.children[1].addEventListener('click', function () { setMode(chart, true); });
        swipe(chart, function () { setMode(chart, true); });
        styleFor(chart);   // settle the pie style now, in page order
    }
    function scan() { document.querySelectorAll('[data-vsw]').forEach(enhance); }
    var pending = false;
    function schedule() { if (pending) return; pending = true; setTimeout(function () { pending = false; scan(); }, 50); }
    function boot() { scan(); try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


/* ------------------------------------------------------------------
   Touch a part: tapping (or hovering) a row of a pie's legend lights up
   that part in the drawing and dims the rest; tapping it again, or leaving,
   brings everything back.
------------------------------------------------------------------ */
(function () {
    'use strict';
    function focus(vdn, i) {
        var on = i != null;
        vdn.classList.toggle('has-focus', on);
        vdn.querySelectorAll('[data-i]').forEach(function (el) { el.classList.toggle('is-focus', on && el.getAttribute('data-i') === String(i)); });
        vdn._focus = on ? String(i) : null;
    }
    document.addEventListener('click', function (e) {
        var row = e.target.closest && e.target.closest('.vdn-row'); if (!row) return;
        var vdn = row.closest('.vdn'), i = row.getAttribute('data-i'); if (!vdn || i == null) return;
        focus(vdn, vdn._focus === i ? null : i);
    });
    document.addEventListener('pointerover', function (e) {
        if (e.pointerType !== 'mouse') return;
        var row = e.target.closest && e.target.closest('.vdn-row'); if (!row) return;
        var vdn = row.closest('.vdn'); if (vdn) focus(vdn, row.getAttribute('data-i'));
    });
    document.addEventListener('pointerout', function (e) {
        if (e.pointerType !== 'mouse') return;
        var row = e.target.closest && e.target.closest('.vdn-row'); if (!row) return;
        if (e.relatedTarget && row.contains(e.relatedTarget)) return;
        var vdn = row.closest('.vdn'); if (vdn) focus(vdn, null);
    });
})();
