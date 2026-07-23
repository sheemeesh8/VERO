/* ============================================================================
   water-hero.js — Calm top-down water animation hero (WebGL, shader-based)

   A single, dependency-free module. It renders an infinite, seamless
   ripple animation into a <canvas> behind whatever hero content you place
   over it. No video files — every frame is generated in a fragment shader.

   USAGE
   -----
   <section class="wh-hero" data-water-hero>
       <canvas class="wh-canvas"></canvas>
       <div class="wh-content"> ... your H1 / sub / CTA ... </div>
   </section>
   <script src="water-hero.js"></script>

   Auto-mounts every [data-water-hero] on load. Or mount manually:
       WaterHero.mount(document.querySelector('.wh-hero'), { parallax: true });

   OPTIONS
   -------
   parallax   {boolean} subtle mouse-driven drift            (default true)
   maxDPR     {number}  device-pixel-ratio cap for perf      (default 1.75)
   speed      {number}  overall animation speed multiplier   (default 1)
   tint       {[r,g,b,r,g,b]} deep + shallow water colours (0..1, optional)
   ========================================================================== */
(function (global) {
    'use strict';

    // ---- Shaders --------------------------------------------------------------
    const VERT = `
        attribute vec2 a_pos;
        void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    // Top-down calm water: a few gentle directional ripples, warped by low-octave
    // value noise so the interference never reads as a repeating grid. Lighting is
    // analytic (cheap), giving soft moving specular glints. Muted blue-teal palette,
    // finished with a vignette so light text stays readable in the centre.
    const FRAG = `
        precision highp float;

        uniform vec2  u_res;
        uniform float u_time;
        uniform vec2  u_mouse;   // -0.5..0.5 parallax offset
        uniform vec3  u_deep;    // deep water colour
        uniform vec3  u_shallow; // crest / shallow colour

        // -- cheap value-noise fbm ------------------------------------------------
        float hash(vec2 p){
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }
        float noise(vec2 p){
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        float fbm(vec2 p){
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
            return v;
        }

        // -- water height field ---------------------------------------------------
        float waves(vec2 p, float t){
            // organic warp so the ripples drift instead of marching in step
            p += 0.18 * vec2(fbm(p * 1.3 + t * 0.10),
                             fbm(p * 1.3 - t * 0.10 + 7.0));
            float h = 0.0;
            h += sin(dot(p, vec2( 1.00, 0.30)) *  6.0 + t * 0.80) * 0.50;
            h += sin(dot(p, vec2(-0.40, 1.00)) *  7.3 + t * 0.70) * 0.40;
            h += sin(dot(p, vec2( 0.80,-0.60)) *  9.1 + t * 1.05) * 0.26;
            h += sin(dot(p, vec2( 0.20, 0.95)) * 12.0 + t * 0.92) * 0.18;
            h += (fbm(p * 2.5 + t * 0.15) - 0.5) * 0.35; // fine surface detail
            return h;
        }

        void main(){
            vec2 uv = gl_FragCoord.xy / u_res.xy;
            float aspect = u_res.x / u_res.y;

            // fixed top-down framing; parallax only nudges the sampling point
            vec2 p = uv;
            p.x *= aspect;
            p += u_mouse * 0.06;
            p *= 3.2;                       // ripple density

            float t = u_time;

            // analytic normal from the height field (3 samples, all cheap sines)
            float e = 0.012;
            float h  = waves(p, t);
            float hx = waves(p + vec2(e, 0.0), t);
            float hy = waves(p + vec2(0.0, e), t);
            vec3 n = normalize(vec3((h - hx) / e, (h - hy) / e, 2.4));

            // lighting — one soft key light, gentle glints
            vec3 lightDir = normalize(vec3(0.35, 0.55, 0.75));
            vec3 viewDir  = vec3(0.0, 0.0, 1.0);
            float diff = clamp(dot(n, lightDir) * 0.5 + 0.5, 0.0, 1.0);
            vec3 refl  = reflect(-lightDir, n);
            float spec = pow(max(dot(refl, viewDir), 0.0), 42.0);

            // colour: deep -> shallow by height, plus subtle glints
            float shade = smoothstep(-0.8, 0.9, h) * 0.65 + diff * 0.35;
            vec3 col = mix(u_deep, u_shallow, shade);
            col += spec * vec3(0.55, 0.72, 0.80) * 0.6;

            // vignette — darker edges keep centred text legible
            vec2 c = uv - 0.5;
            float vig = smoothstep(0.95, 0.35, length(c * vec2(aspect, 1.0)));
            col *= mix(0.55, 1.0, vig);

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    // ---- WebGL helpers --------------------------------------------------------
    function compile(gl, type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn('[water-hero] shader error:', gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    }

    function program(gl, vsrc, fsrc) {
        const vs = compile(gl, gl.VERTEX_SHADER, vsrc);
        const fs = compile(gl, gl.FRAGMENT_SHADER, fsrc);
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.warn('[water-hero] link error:', gl.getProgramInfoLog(p));
            return null;
        }
        return p;
    }

    // ---- Instance -------------------------------------------------------------
    function mount(host, opts) {
        opts = opts || {};
        const parallax = opts.parallax !== false;
        const maxDPR   = opts.maxDPR   || 1.75;
        const speed    = opts.speed    || 1.0;
        const deep     = opts.tint ? opts.tint.slice(0, 3) : [0.03, 0.16, 0.20];
        const shallow  = opts.tint ? opts.tint.slice(3, 6) : [0.16, 0.44, 0.49];

        const canvas = host.querySelector('canvas') || host.appendChild(
            Object.assign(document.createElement('canvas'), { className: 'wh-canvas' }));

        const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
                || canvas.getContext('experimental-webgl');

        // Graceful fallback: a static teal gradient if WebGL is unavailable.
        if (!gl) {
            host.classList.add('wh-nogl');
            return { destroy() {} };
        }

        const prog = program(gl, VERT, FRAG);
        if (!prog) { host.classList.add('wh-nogl'); return { destroy() {} }; }

        // full-screen triangle
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'a_pos');

        const u = {
            res:     gl.getUniformLocation(prog, 'u_res'),
            time:    gl.getUniformLocation(prog, 'u_time'),
            mouse:   gl.getUniformLocation(prog, 'u_mouse'),
            deep:    gl.getUniformLocation(prog, 'u_deep'),
            shallow: gl.getUniformLocation(prog, 'u_shallow'),
        };

        let dpr = 1, running = true, raf = 0;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resize() {
            // Cap DPR for fill-rate; mobile stays smooth at a lower internal res.
            dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
            const w = Math.max(1, Math.round(host.clientWidth  * dpr));
            const h = Math.max(1, Math.round(host.clientHeight * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w; canvas.height = h;
            }
            gl.viewport(0, 0, w, h);
        }

        // Smoothed mouse parallax (eased toward the target each frame).
        const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        function onMove(e) {
            const r = host.getBoundingClientRect();
            mouse.tx = (e.clientX - r.left) / r.width  - 0.5;
            mouse.ty = (e.clientY - r.top)  / r.height - 0.5;
        }
        if (parallax && !reduce) window.addEventListener('mousemove', onMove, { passive: true });

        const t0 = performance.now();
        function frame(now) {
            if (!running) return;
            resize();
            const t = ((now - t0) / 1000) * speed * (reduce ? 0.0 : 1.0);

            mouse.x += (mouse.tx - mouse.x) * 0.05;
            mouse.y += (mouse.ty - mouse.y) * 0.05;

            gl.useProgram(prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

            gl.uniform2f(u.res, canvas.width, canvas.height);
            gl.uniform1f(u.time, reduce ? 8.0 : t);      // frozen-but-lit if reduced
            gl.uniform2f(u.mouse, mouse.x, -mouse.y);
            gl.uniform3fv(u.deep, deep);
            gl.uniform3fv(u.shallow, shallow);

            gl.drawArrays(gl.TRIANGLES, 0, 3);

            // With reduced motion we render a single settled frame and stop.
            if (reduce) { running = false; return; }
            raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);

        // Pause when the hero scrolls out of view — no wasted GPU work.
        let io;
        if ('IntersectionObserver' in window) {
            io = new IntersectionObserver((ents) => {
                const vis = ents[0].isIntersecting;
                if (vis && !running && !reduce) { running = true; raf = requestAnimationFrame(frame); }
                else if (!vis) { running = false; cancelAnimationFrame(raf); }
            }, { threshold: 0.01 });
            io.observe(host);
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) { running = false; cancelAnimationFrame(raf); }
            else if (!reduce) { running = true; raf = requestAnimationFrame(frame); }
        });

        const onResize = () => resize();
        window.addEventListener('resize', onResize);

        return {
            destroy() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener('resize', onResize);
                window.removeEventListener('mousemove', onMove);
                if (io) io.disconnect();
            }
        };
    }

    const WaterHero = {
        mount,
        auto() {
            document.querySelectorAll('[data-water-hero]').forEach((el) => {
                if (!el.__waterHero) el.__waterHero = mount(el, el.dataset.parallax === 'off'
                    ? { parallax: false } : {});
            });
        }
    };

    if (document.readyState !== 'loading') WaterHero.auto();
    else document.addEventListener('DOMContentLoaded', WaterHero.auto);

    global.WaterHero = WaterHero;
})(window);
