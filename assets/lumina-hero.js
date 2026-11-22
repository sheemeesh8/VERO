/* ------------------------------------------------------------------
   moravchick — Lumina hero (vanilla port of components/ui/lumina-interactive-list.tsx)

   The site is plain HTML/JS, so the React component stays in components/ui as
   the reference and ships as this port. Same idea: full-bleed slides that change
   through a WebGL "glass bubble" transition (a refracting circle that grows
   from the centre, with chromatic edges), the title re-set letter by letter
   with a different entrance per slide, and a row of progress lines that fill
   while a slide is shown — tap one to jump to it.

   Differences, on purpose:
     • No three.js / GSAP. The effect is a single full-screen quad and one
       fragment shader, so it runs on raw WebGL1 (no 600 KB of libraries); the
       tweens are requestAnimationFrame, the letter entrances are CSS.
     • Draws only while a transition runs — a still slide costs nothing.
     • Pauses when the hero is scrolled away or the tab is hidden.
     • mono: true renders the photos in black and white (the site's look).
     • Without WebGL, or with reduced motion, slides cross-fade instead.

     var hero = VeroLumina(el, {
       slides: [{ title, description, media, href }],
       interval: 5000, duration: 2.5, mono: true,
       onChange: function (slide, i) {},
       mount: bandEl                     // optional: where the counter / title / nav go
     });
     hero.go(2);  hero.destroy();
   Styles: .lu-* (in the page that uses it — events.html).
------------------------------------------------------------------ */
(function () {
    'use strict';

    var VERT = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';
    // The component's glass effect, as written there (the other effects were stubs).
    var FRAG = [
        'precision mediump float;',
        'uniform sampler2D uTexture1, uTexture2;',
        'uniform float uProgress, uMono;',
        'uniform vec2 uResolution, uTexture1Size, uTexture2Size;',
        'uniform float uRefraction, uChromatic, uClarity, uEdgeGlow, uFlow;',
        'varying vec2 vUv;',
        'vec2 cover(vec2 uv, vec2 ts){ vec2 s = uResolution / ts; float k = max(s.x, s.y); vec2 sz = ts * k; vec2 off = (uResolution - sz) * 0.5; return (uv * uResolution - off) / sz; }',
        'vec4 glass(vec2 uv, float progress){',
        '  float time = progress * 5.0;',
        '  vec2 uv1 = cover(uv, uTexture1Size); vec2 uv2 = cover(uv, uTexture2Size);',
        '  float maxR = length(uResolution) * 0.85; float br = progress * maxR;',
        '  vec2 p = uv * uResolution; vec2 c = uResolution * 0.5;',
        '  float d = length(p - c); float nd = d / max(br, 0.001);',
        '  float inside = smoothstep(br + 3.0, br - 3.0, d);',
        '  vec4 img;',
        '  if (inside > 0.0) {',
        '    float ro = 0.08 * uRefraction * pow(smoothstep(0.3 * uClarity, 1.0, nd), 1.5);',
        '    vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);',
        '    vec2 duv = uv2 - dir * ro;',
        '    duv += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uFlow * nd * inside;',
        '    float ca = 0.02 * uChromatic * pow(smoothstep(0.3, 1.0, nd), 1.2);',
        '    img = vec4(texture2D(uTexture2, duv + dir * ca * 1.2).r, texture2D(uTexture2, duv + dir * ca * 0.2).g, texture2D(uTexture2, duv - dir * ca * 0.8).b, 1.0);',
        '    float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));',
        '    img.rgb += rim * 0.08 * uEdgeGlow;',
        '  } else { img = texture2D(uTexture2, uv2); }',
        '  vec4 old = texture2D(uTexture1, uv1);',
        '  if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);',
        '  return mix(old, img, inside);',
        '}',
        'void main(){',
        '  vec4 col = glass(vUv, uProgress);',
        '  if (uMono > 0.5) { float l = dot(col.rgb, vec3(0.299, 0.587, 0.114)); col.rgb = vec3(l); }',
        '  gl_FragColor = col;',
        '}'
    ].join('\n');

    var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
    var pad = function (n) { return String(n).padStart(2, '0'); };

    // Title → one span per letter (words kept together so lines break between words).
    function letters(text) {
        var i = 0;
        return String(text).split(' ').map(function (w) {
            return '<span class="lu-w">' + w.split('').map(function (ch) {
                return '<span class="lu-l" style="--i:' + (i++) + ';--r:' + Math.floor(Math.random() * 16) + '">' + esc(ch) + '</span>';
            }).join('') + '</span>';
        }).join(' ');
    }

    window.VeroLumina = function (host, opts) {
        opts = opts || {};
        var slides = (opts.slides || []).filter(function (s) { return s && s.media; });
        if (!host || !slides.length) return null;
        var INTERVAL = opts.interval || 5000, reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        var DURATION = reduce ? 0.6 : (opts.duration || 2.5);
        var n = slides.length, cur = 0, busy = false, alive = true, visible = true;

        // ---- DOM ----
        host.classList.add('lu');
        host.innerHTML =
            '<canvas class="lu-canvas" aria-hidden="true"></canvas>' +
            '<div class="lu-fallback" aria-hidden="true"></div>' +
            '<div class="lu-count" aria-hidden="true"><span class="lu-num">01</span><span class="lu-of">/</span><span class="lu-total">' + pad(n) + '</span></div>' +
            '<div class="lu-content"><a class="lu-title" aria-live="polite"></a><p class="lu-desc"></p></div>' +
            '<nav class="lu-nav" aria-label="Slides">' + slides.map(function (s, i) {
                return '<button type="button" class="lu-item' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" aria-label="' + esc(s.title) + '">' +
                    '<span class="lu-line"><span class="lu-fill"></span></span><span class="lu-name">' + esc(s.title) + '</span></button>';
            }).join('') + '</nav>';
        // mount: an element (e.g. the hero's text band) to hold the counter, title and
        // nav, so they sit in the page's own layout over the picture.
        if (opts.mount) ['.lu-count', '.lu-content', '.lu-nav'].forEach(function (q) { opts.mount.appendChild(host.querySelector(q)); });
        var root = opts.mount || host;
        var canvas = host.querySelector('.lu-canvas'), fb = host.querySelector('.lu-fallback');
        var titleEl = root.querySelector('.lu-title'), descEl = root.querySelector('.lu-desc');
        var items = [].slice.call(root.querySelectorAll('.lu-item'));
        var numEl = root.querySelector('.lu-num');

        // ---- Text: out, then in with this slide's entrance (six, as in the component) ----
        function setText(i, first) {
            var s = slides[i];
            var put = function () {
                titleEl.className = 'lu-title pre v' + (i % 6);
                titleEl.innerHTML = letters(s.title);
                if (s.href) titleEl.setAttribute('href', s.href); else titleEl.removeAttribute('href');
                descEl.className = 'lu-desc pre';
                descEl.textContent = s.description || '';
                void titleEl.offsetWidth;                                          // commit the start state
                requestAnimationFrame(function () { titleEl.classList.remove('pre'); descEl.classList.remove('pre'); });
            };
            if (first || reduce) { put(); return; }
            titleEl.classList.add('out'); descEl.classList.add('out');
            setTimeout(function () { if (alive) put(); }, 500);
        }

        // ---- WebGL ----
        var gl = null, prog, U = {}, tex = [], sizes = [];
        try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false }); } catch (e) {}
        function shader(type, src) {
            var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
            return sh;
        }
        if (gl) {
            try {
                prog = gl.createProgram();
                gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
                gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
                gl.useProgram(prog);
                var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
                var loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
                ['uTexture1', 'uTexture2', 'uProgress', 'uMono', 'uResolution', 'uTexture1Size', 'uTexture2Size', 'uRefraction', 'uChromatic', 'uClarity', 'uEdgeGlow', 'uFlow']
                    .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
                gl.uniform1i(U.uTexture1, 0); gl.uniform1i(U.uTexture2, 1);
                gl.uniform1f(U.uMono, opts.mono ? 1 : 0);
                gl.uniform1f(U.uRefraction, 1); gl.uniform1f(U.uChromatic, 1); gl.uniform1f(U.uClarity, 1); gl.uniform1f(U.uEdgeGlow, 1); gl.uniform1f(U.uFlow, 1);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            } catch (err) { console.warn('Lumina: WebGL unavailable, cross-fading instead', err); gl = null; }
        }
        if (!gl) host.classList.add('lu-nogl');
        if (opts.mono) host.classList.add('lu-mono');

        function size() {
            var r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
            if (gl) { gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U.uResolution, r.width, r.height); }
        }
        function bind(unit, i) {
            gl.activeTexture(unit ? gl.TEXTURE1 : gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
            gl.uniform2f(unit ? U.uTexture2Size : U.uTexture1Size, sizes[i][0], sizes[i][1]);
        }
        function draw(p) { if (!gl) return; gl.uniform1f(U.uProgress, p); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
        function load(i) {
            return new Promise(function (res) {
                var img = new Image();
                img.decoding = 'async';
                img.onload = function () {
                    sizes[i] = [img.naturalWidth, img.naturalHeight];
                    if (gl) {
                        var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                        tex[i] = t;
                    }
                    res(true);
                };
                img.onerror = function () { res(false); };
                img.src = slides[i].media;
            });
        }
        function showFallback(i) { fb.style.backgroundImage = 'url("' + slides[i].media.replace(/"/g, '%22') + '")'; }

        // ---- Progress + autoplay ----
        var shownAt = 0, timer = null, held = 0;
        function fill(i, pct) { var f = items[i] && items[i].querySelector('.lu-fill'); if (f) f.style.width = pct + '%'; }
        function tick() {
            timer = null;
            if (!alive) return;
            if (!visible || busy || document.hidden) return;
            var pct = Math.min(100, (performance.now() - shownAt) / INTERVAL * 100);
            fill(cur, pct);
            if (pct >= 100) { go((cur + 1) % n); return; }
            timer = requestAnimationFrame(tick);
        }
        function resume() { if (timer === null && alive && visible && !busy && n > 1) { shownAt = performance.now() - held; held = 0; timer = requestAnimationFrame(tick); } }
        function pause() { if (timer !== null) { cancelAnimationFrame(timer); timer = null; held = performance.now() - shownAt; } }

        function mark(i) {
            items.forEach(function (it, k) { it.classList.toggle('active', k === i); it.setAttribute('aria-current', k === i ? 'true' : 'false'); if (k !== i) fill(k, 0); });
            numEl.textContent = pad(i + 1);
        }

        function go(target) {
            if (busy || target === cur || target < 0 || target >= n) return;
            if (timer !== null) { cancelAnimationFrame(timer); timer = null; }
            held = 0;
            var from = cur; cur = target;
            mark(cur); setText(cur);
            if (opts.onChange) opts.onChange(slides[cur], cur);
            var useGL = gl && tex[from] && tex[cur];
            if (!useGL) {                                                       // cross-fade
                host.classList.add('lu-fade');
                setTimeout(function () { showFallback(cur); host.classList.remove('lu-fade'); shownAt = performance.now(); resume(); }, reduce ? 0 : 350);
                return;
            }
            busy = true;
            bind(0, from); bind(1, cur);
            var t0 = performance.now(), dur = DURATION * 1000;
            (function step(now) {
                if (!alive) return;
                var t = Math.min(1, (now - t0) / dur);
                draw(easeInOut(t));
                if (t < 1) { requestAnimationFrame(step); return; }
                bind(0, cur); draw(0);
                busy = false; shownAt = performance.now(); resume();
            })(t0);
        }

        items.forEach(function (it, i) { it.addEventListener('click', function (e) { e.stopPropagation(); go(i); }); });

        // Pause off screen / in a background tab.
        var io = null;
        if ('IntersectionObserver' in window) {
            io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) resume(); else pause(); }, { threshold: 0.15 });
            io.observe(host);
        }
        function onVis() { if (document.hidden) pause(); else resume(); }
        document.addEventListener('visibilitychange', onVis);
        function onResize() { size(); if (gl && tex[cur]) { bind(0, cur); draw(0); } }
        window.addEventListener('resize', onResize);

        // ---- Start: first slide's text at once, the picture as soon as it loads ----
        size(); mark(0); setText(0, true); showFallback(0);
        load(0).then(function () {
            if (!alive) return;
            if (gl && tex[0]) { bind(0, 0); bind(1, 0); draw(0); host.classList.add('lu-ready'); }
            shownAt = performance.now(); resume();
            for (var i = 1; i < n; i++) load(i);                                // the rest in the background
        });

        return {
            go: go,
            get index() { return cur; },
            destroy: function () {
                alive = false; pause();
                if (io) io.disconnect();
                document.removeEventListener('visibilitychange', onVis);
                window.removeEventListener('resize', onResize);
                if (gl) { tex.forEach(function (t) { if (t) gl.deleteTexture(t); }); var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
                if (opts.mount) ['.lu-count', '.lu-content', '.lu-nav'].forEach(function (q) { var el = opts.mount.querySelector(q); if (el) el.remove(); });
                host.innerHTML = ''; host.classList.remove('lu', 'lu-nogl', 'lu-mono', 'lu-ready', 'lu-fade');
            }
        };
    };
})();
