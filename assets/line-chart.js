/* ------------------------------------------------------------------
   moravchick — the site's line chart (styles in line-chart.css).

     el.innerHTML = veroLineChart(values, {
         color:  '#111',            // line colour (values stay in ink)
         format: v => '₪' + v,      // how a value reads (dots + tooltip)
         group:  'sum' | 'last',    // how a long series is grouped (default 'sum')
         labels: ['Jan', …],        // optional: point names for the tooltip
         axis:   ['Jan', …]         // optional: a date row under the chart
     });

   Values run oldest → newest, left → right, like a stock chart: the line
   spans the screen from edge to edge over a soft fill, and every break in
   the line (each change of direction or angle, and both ends) gets a solid
   dot with its value. Series longer than 12 points are grouped first so
   every label has room. Hover / tap shows the value at any point.
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

    window.veroLineChart = function (vals, opts) {
        opts = opts || {};
        var color = opts.color || '#16150f';
        var fmt = opts.format || function (x) { return Math.round(x).toLocaleString('en-US'); };
        var v = group((vals || []).map(function (x) { return Number(x) || 0; }), opts.group);
        var lbl = opts.labels && opts.labels.length === v.length ? opts.labels : null;
        var n = v.length;
        if (!n) return '<div class="vlc"></div>';
        var max = Math.max.apply(null, v), min = Math.min(0, Math.min.apply(null, v));
        var span = (max - min) || 1;
        var xp = function (i) { return n <= 1 ? 50 : (i / (n - 1)) * 100; };
        var yp = function (x) { return BOT - ((x - min) / span) * (BOT - TOP); };

        var d = v.map(function (x, i) { return (i ? 'L' : 'M') + xp(i).toFixed(3) + ' ' + yp(x).toFixed(3); }).join(' ');
        var gid = 'vlcg' + Math.random().toString(36).slice(2, 8);
        var area = d + ' L100 ' + BOT + ' L0 ' + BOT + ' Z';
        var svg = '<svg class="vlc-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
            '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1">' +
            '<stop offset="0" stop-color="' + color + '" stop-opacity="0.16"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
            '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
            '<line class="vlc-base" x1="0" x2="100" y1="' + BOT + '" y2="' + BOT + '" vector-effect="non-scaling-stroke"/>' +
            '<path class="vlc-line" d="' + d + '" stroke="' + color + '" vector-effect="non-scaling-stroke"/></svg>';

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
        return '<div class="vlc" role="img" aria-label="' + esc(summary) + '" style="color:' + color + '" data-vlc="' + esc(JSON.stringify(data)) + '">' +
            svg + marks +
            '<div class="vlc-hover"><i class="vlc-vline"></i><i class="vlc-hdot"></i><span class="vlc-tip"></span></div>' +
            '</div>' + axis;
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
