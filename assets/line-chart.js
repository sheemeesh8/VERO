/* ------------------------------------------------------------------
   moravchick — the site's line chart (styles in line-chart.css).

     el.innerHTML = veroLineChart(values, {
         color:  '#111',            // line colour (values stay in ink)
         format: v => '₪' + v,      // how a value reads (dots + tooltip)
         labels: ['Jan', …],        // optional: point names for the tooltip
         axis:   ['Jan', …]         // optional: a date row under the chart
     });

   Values run oldest → newest, left → right. The line spans the screen
   from edge to edge. Every change of trend (a peak or a dip) gets a dot
   with its value; long, noisy series only mark the significant swings so
   the labels never pile up. Hover / tap shows the value at any point.
------------------------------------------------------------------ */
(function () {
    'use strict';

    var TOP = 16, BOT = 90;   // plot band, % of the height (room for labels above / below)

    // Points where the trend turns: a zig-zag over the series that only counts
    // a reversal once it moves by `min` — every wiggle on short series, only the
    // real swings on long ones.
    function turningPoints(v) {
        var n = v.length; if (n < 3) return [];
        var max = Math.max.apply(null, v), min = Math.min.apply(null, v), range = (max - min) || 1;
        var th = range * (n <= 12 ? 0 : n <= 45 ? 0.12 : 0.2);
        var out = [], dir = 0, ext = 0, i;
        for (i = 1; i < n; i++) {
            if (dir === 0) {
                if (v[i] !== v[0] && Math.abs(v[i] - v[0]) >= th) { dir = v[i] > v[0] ? 1 : -1; ext = i; }
                continue;
            }
            if (dir === 1) {
                if (v[i] >= v[ext]) ext = i;
                else if (v[ext] - v[i] > th || (th === 0 && v[i] < v[ext])) { out.push({ i: ext, peak: true }); dir = -1; ext = i; }
            } else {
                if (v[i] <= v[ext]) ext = i;
                else if (v[i] - v[ext] > th || (th === 0 && v[i] > v[ext])) { out.push({ i: ext, peak: false }); dir = 1; ext = i; }
            }
        }
        // Keep labels apart: at least ~9% of the width between marked points.
        var kept = [], gap = Math.max(1, Math.round((n - 1) * 0.09));
        out.forEach(function (p) { if (!kept.length || p.i - kept[kept.length - 1].i >= gap) kept.push(p); });
        return kept;
    }

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    window.veroLineChart = function (vals, opts) {
        opts = opts || {};
        var color = opts.color || '#16150f';
        var fmt = opts.format || function (x) { return Math.round(x).toLocaleString('en-US'); };
        var v = (vals || []).map(function (x) { return Number(x) || 0; });
        var n = v.length;
        if (!n) return '<div class="vlc"></div>';
        var max = Math.max.apply(null, v), min = Math.min(0, Math.min.apply(null, v));
        var span = (max - min) || 1;
        var xp = function (i) { return n <= 1 ? 50 : (i / (n - 1)) * 100; };
        var yp = function (x) { return BOT - ((x - min) / span) * (BOT - TOP); };

        var d = v.map(function (x, i) { return (i ? 'L' : 'M') + xp(i).toFixed(3) + ' ' + yp(x).toFixed(3); }).join(' ');
        var svg = '<svg class="vlc-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
            '<line class="vlc-base" x1="0" x2="100" y1="' + BOT + '" y2="' + BOT + '" vector-effect="non-scaling-stroke"/>' +
            '<path class="vlc-line" d="' + d + '" stroke="' + color + '" vector-effect="non-scaling-stroke"/></svg>';

        var marks = turningPoints(v).map(function (p, k) {
            var x = xp(p.i), y = yp(v[p.i]);
            var edge = x < 7 ? ' at-l' : x > 93 ? ' at-r' : '';
            var delay = 'animation-delay:' + (0.5 + k * 0.06).toFixed(2) + 's';
            return '<span class="vlc-pt" style="left:' + x + '%;top:' + y + '%;color:' + color + ';' + delay + '"></span>' +
                   '<span class="vlc-val' + (p.peak ? '' : ' dip') + edge + '" style="left:' + x + '%;top:' + y + '%;' + delay + '">' + esc(fmt(v[p.i])) + '</span>';
        }).join('');

        var data = { y: v.map(function (x) { return +yp(x).toFixed(3); }), t: v.map(function (x) { return fmt(x); }), l: opts.labels || null };
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
