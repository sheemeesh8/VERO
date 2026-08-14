/* ============================================================================
   VERO — site-wide manual editor.

   A live visual overlay you can turn on over ANY page that loads this file.
   Turn it on, click any piece to select it, then:
     • drag it to move it,
     • use the slider (or [ ] keys) to grow / shrink it,
     • nudge with the arrow keys (1px, Shift = 10px).
   Every change is CSS transform only — visual, exactly as the copied rule will
   behave on the real page — so neighbours never reflow. Changes are remembered
   per page in localStorage and re-applied on reload, and "Copy CSS" gives you a
   rule per moved piece (keyed by a real selector) to paste into the page's own
   stylesheet when you want it permanent.

   Usage: add near the end of <body>:
     <script src="vero-editor.js"></script>
   A small ✎ button appears at the bottom-left. Click it (or press Ctrl+Shift+E)
   to toggle edit mode. Nothing runs until you turn it on.
   ========================================================================== */
(function () {
    'use strict';

    // Per-page store, so each page keeps its own placements.
    const KEY = 'veroEditor::' + location.pathname.split('/').pop();
    let map = {};
    try { map = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { map = {}; }

    let editing = false;
    let sel = null;      // selected element
    let drag = null;     // active drag gesture

    // ---- A stable-ish CSS selector for an arbitrary element ------------------
    function cssPath(el) {
        if (!el || el.nodeType !== 1) return null;
        if (el.id) return '#' + CSS.escape(el.id);
        const parts = [];
        let node = el;
        while (node && node.nodeType === 1 && node !== document.body) {
            if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
            let seg = node.tagName.toLowerCase();
            const cls = [...node.classList].filter(c => !c.startsWith('vero-ed-'));
            if (cls.length) seg += '.' + cls.slice(0, 2).map(c => CSS.escape(c)).join('.');
            const parent = node.parentElement;
            if (parent) {
                const sibs = [...parent.children].filter(c => c.tagName === node.tagName);
                if (sibs.length > 1) seg += ':nth-of-type(' + (sibs.indexOf(node) + 1) + ')';
            }
            parts.unshift(seg);
            node = node.parentElement;
        }
        return parts.join(' > ');
    }

    function stateOf(key) {
        if (!map[key]) map[key] = { dx: 0, dy: 0, sx: 1, sy: 1 };
        const s = map[key];
        // Migrate old uniform-scale entries to independent sx / sy.
        if (s.scale !== undefined) {
            if (s.sx === undefined) s.sx = s.scale;
            if (s.sy === undefined) s.sy = s.scale;
            delete s.scale;
        }
        if (s.sx === undefined) s.sx = 1;
        if (s.sy === undefined) s.sy = 1;
        return s;
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {} }

    function applyKey(key) {
        const el = document.querySelector(key);
        if (!el) return;
        const s = stateOf(key);
        const tf = [];
        if (s.dx || s.dy) tf.push(`translate(${s.dx}px, ${s.dy}px)`);
        if (s.sx !== 1 || s.sy !== 1) tf.push(`scale(${s.sx}, ${s.sy})`);
        el.style.transform = tf.join(' ');
        // Grow from the top-left so a stretch handle moves the edge you grab.
        el.style.transformOrigin = tf.length ? 'top left' : '';
    }
    function applyAll() { Object.keys(map).forEach(applyKey); }

    // ---- Un-clip ancestors while editing -------------------------------------
    // Moves are CSS transforms, which are clipped by any ancestor with
    // overflow:hidden/auto/scroll (e.g. cards, the page wrap, body's overflow-x).
    // That's why a piece "gets stuck" when dragged toward the edges. While edit
    // mode is on we lift that clipping on the selected piece's ancestor chain,
    // then restore the exact inline values when editing ends.
    let unclipped = [];
    function unclipAncestors(el) {
        let node = el && el.parentElement;
        while (node && node !== document.documentElement) {
            if (!node.__veroUnclipped) {
                const cs = getComputedStyle(node);
                if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
                    node.__veroUnclipped = { o: node.style.overflow, ox: node.style.overflowX, oy: node.style.overflowY };
                    node.style.overflow = 'visible';
                    node.style.overflowX = 'visible';
                    node.style.overflowY = 'visible';
                    unclipped.push(node);
                }
            }
            node = node.parentElement;
        }
    }
    function reclipAll() {
        unclipped.forEach(node => {
            const o = node.__veroUnclipped;
            if (o) { node.style.overflow = o.o; node.style.overflowX = o.ox; node.style.overflowY = o.oy; }
            delete node.__veroUnclipped;
        });
        unclipped = [];
    }

    // ---- Selection -----------------------------------------------------------
    function select(el) {
        if (sel) sel.classList.remove('vero-ed-selected');
        sel = el;
        el.classList.add('vero-ed-selected');
        unclipAncestors(el);
        el.__veroKey = el.__veroKey || cssPath(el);
        const s = stateOf(el.__veroKey);
        ui.name.textContent = el.__veroKey;
        ui.scale.disabled = false;
        ui.scale.value = s.sx;
        updateReadout();
        positionFrame();
    }
    function updateReadout() {
        if (!sel) { ui.readout.textContent = 'בחר פריט — לחיצה בוחרת, גרירה מזיזה'; return; }
        const s = stateOf(sel.__veroKey);
        ui.readout.innerHTML =
            `translate(<b>${s.dx}px</b>, <b>${s.dy}px</b>) · scale(<b>${s.sx.toFixed(2)}</b>, <b>${s.sy.toFixed(2)}</b>)`;
        ui.scaleOut.textContent = '×' + s.sx.toFixed(2);
    }

    // ---- Stretch frame: handles that follow the selected element --------------
    let resize = null;
    function positionFrame() {
        if (!ui.frame) return;
        if (!sel || !editing) { ui.frame.classList.remove('on'); return; }
        const r = sel.getBoundingClientRect();
        const f = ui.frame;
        f.style.left = r.left + 'px'; f.style.top = r.top + 'px';
        f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
        f.classList.add('on');
    }

    // ---- The editor's own UI (never selectable) ------------------------------
    let ui = {};
    function buildUI() {
        const style = document.createElement('style');
        style.textContent = `
            body.vero-editing [data-vero-hover]:not(#vero-ed-panel *) { cursor: grab; }
            .vero-ed-selected { outline: 2px solid #004225 !important; outline-offset: 2px; }
            body.vero-editing .vero-ed-hovering {
                outline: 1.5px dashed rgba(0,66,37,0.6) !important; outline-offset: 2px;
            }
            #vero-ed-frame { position: fixed; z-index: 99999; pointer-events: none; display: none; }
            #vero-ed-frame.on { display: block; }
            #vero-ed-frame .h {
                position: absolute; width: 14px; height: 14px; box-sizing: border-box;
                background: #fff; border: 2px solid #004225; border-radius: 3px;
                pointer-events: auto;
            }
            #vero-ed-frame .h.e  { right: -7px; top: 50%; margin-top: -7px; cursor: ew-resize; }
            #vero-ed-frame .h.s  { bottom: -7px; left: 50%; margin-left: -7px; cursor: ns-resize; }
            #vero-ed-frame .h.se { right: -7px; bottom: -7px; cursor: nwse-resize; border-radius: 50%; }
            #vero-ed-toggle {
                position: fixed; left: 18px; bottom: 18px; z-index: 100000;
                width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
                background: #111; color: #fff; border: none; font-size: 16.67px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 8px 24px rgba(0,0,0,0.28); transition: background 0.2s, transform 0.2s;
                font-family: 'Segoe UI', sans-serif;
            }
            #vero-ed-toggle:hover { transform: scale(1.06); }
            #vero-ed-toggle.on { background: #004225; }
            #vero-ed-panel {
                position: fixed; left: 18px; bottom: 76px; z-index: 100000;
                width: 300px; background: #fff; color: #111; border: 1px solid #e6e4de;
                border-radius: 12px; box-shadow: 0 18px 50px rgba(0,0,0,0.18);
                padding: 16px; display: none; direction: rtl;
                font-family: 'Segoe UI', sans-serif; font-size: 10.83px;
            }
            #vero-ed-panel.open { display: block; }
            #vero-ed-panel h4 { margin: 0 0 10px; font-size: 10.00px; letter-spacing: 1px;
                text-transform: uppercase; color: #004225; }
            #vero-ed-panel .vero-ed-sel {
                direction: ltr; text-align: left; background: #f4f3f0; border-radius: 6px;
                padding: 7px 9px; font-family: monospace; font-size: 9.17px; color: #333;
                word-break: break-all; margin-bottom: 10px; max-height: 64px; overflow: auto;
            }
            #vero-ed-panel .vero-ed-read { direction: ltr; text-align: left; color: #555;
                font-size: 10.00px; margin-bottom: 12px; }
            #vero-ed-panel .vero-ed-read b { color: #111; }
            #vero-ed-panel label { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
            #vero-ed-panel input[type=range] { flex: 1; }
            #vero-ed-panel .vero-ed-btns { display: flex; flex-wrap: wrap; gap: 6px; }
            #vero-ed-panel button.b {
                flex: 1 1 auto; padding: 8px 10px; border-radius: 6px; cursor: pointer;
                border: 1px solid #d8d5cc; background: #fff; color: #111; font-size: 9.17px;
                letter-spacing: 0.5px; font-family: inherit;
            }
            #vero-ed-panel button.b:hover { background: #f0efeb; }
            #vero-ed-panel button.b.dark { background: #004225; border-color: #004225; color: #fff; }
            #vero-ed-panel .vero-ed-hint { color: #9a9a9a; font-size: 9.17px; margin-top: 10px; line-height: 1.5; }
        `;
        document.head.appendChild(style);

        const toggle = document.createElement('button');
        toggle.id = 'vero-ed-toggle';
        toggle.title = 'עריכה ידנית (Ctrl+Shift+E)';
        toggle.textContent = '✎';
        toggle.onclick = () => setEditing(!editing);
        document.body.appendChild(toggle);

        const panel = document.createElement('div');
        panel.id = 'vero-ed-panel';
        panel.innerHTML = `
            <h4>עריכה ידנית</h4>
            <div class="vero-ed-sel" id="vero-ed-name">—</div>
            <div class="vero-ed-read" id="vero-ed-read">בחר פריט — לחיצה בוחרת, גרירה מזיזה</div>
            <label>הגדלה
                <input type="range" id="vero-ed-scale" min="0.3" max="3" step="0.05" value="1" disabled>
                <span id="vero-ed-scaleout">×1.00</span>
            </label>
            <div class="vero-ed-btns">
                <button class="b" id="vero-ed-reset">אפס פריט</button>
                <button class="b" id="vero-ed-resetall">אפס הכל</button>
                <button class="b dark" id="vero-ed-copy">העתק CSS</button>
            </div>
            <div class="vero-ed-hint">גרירה מזיזה · הידיות הירוקות מותחות (רוחב/גובה) · חיצים 1px (Shift 10px) · הסליידר או [ ] מגדילים אחיד</div>
        `;
        document.body.appendChild(panel);

        // Stretch frame with resize handles (right = width, bottom = height,
        // corner = both). Lives on top of the selected element.
        const frame = document.createElement('div');
        frame.id = 'vero-ed-frame';
        frame.innerHTML = '<i class="h e"></i><i class="h s"></i><i class="h se"></i>';
        document.body.appendChild(frame);

        ui = {
            toggle, panel, frame,
            name: panel.querySelector('#vero-ed-name'),
            readout: panel.querySelector('#vero-ed-read'),
            scale: panel.querySelector('#vero-ed-scale'),
            scaleOut: panel.querySelector('#vero-ed-scaleout')
        };

        // Begin a stretch when a handle is grabbed.
        frame.querySelectorAll('.h').forEach(h => {
            h.addEventListener('pointerdown', e => {
                if (!sel) return;
                e.preventDefault(); e.stopPropagation();
                const s = stateOf(sel.__veroKey);
                const r = sel.getBoundingClientRect();
                resize = {
                    dir: h.classList.contains('se') ? 'se' : (h.classList.contains('e') ? 'e' : 's'),
                    x: e.clientX, y: e.clientY, w: r.width, h: r.height,
                    baseW: r.width / s.sx, baseH: r.height / s.sy
                };
            });
        });

        ui.scale.addEventListener('input', e => {
            if (!sel) return;
            const s = stateOf(sel.__veroKey);
            s.sx = s.sy = +e.target.value;          // slider = uniform
            applyKey(sel.__veroKey); updateReadout(); positionFrame(); save();
        });
        panel.querySelector('#vero-ed-reset').onclick = () => {
            if (!sel) return;
            delete map[sel.__veroKey];
            sel.style.transform = ''; sel.style.transformOrigin = '';
            ui.scale.value = 1; updateReadout(); positionFrame(); save();
        };
        panel.querySelector('#vero-ed-resetall').onclick = () => {
            Object.keys(map).forEach(k => {
                const el = document.querySelector(k);
                if (el) { el.style.transform = ''; el.style.transformOrigin = ''; }
            });
            map = {}; save();
            if (sel) ui.scale.value = 1;
            updateReadout(); positionFrame();
        };
        panel.querySelector('#vero-ed-copy').onclick = async () => {
            const out = cssOut();
            try { await navigator.clipboard.writeText(out); } catch (e) {}
            const b = panel.querySelector('#vero-ed-copy');
            const t = b.textContent; b.textContent = 'הועתק ✓';
            setTimeout(() => b.textContent = t, 1200);
        };
    }

    function cssOut() {
        const rules = [];
        for (const [selector, raw] of Object.entries(map)) {
            const s = stateOf(selector);
            if (!selector) continue;                       // skip stray empty keys
            if (!s.dx && !s.dy && s.sx === 1 && s.sy === 1) continue;
            const tf = [];
            if (s.dx || s.dy) tf.push(`translate(${s.dx}px, ${s.dy}px)`);
            if (s.sx !== 1 || s.sy !== 1) tf.push(`scale(${s.sx}, ${s.sy})`);
            rules.push(`${selector} {\n    transform: ${tf.join(' ')};\n    transform-origin: top left;\n}`);
        }
        return rules.length
            ? '/* VERO manual placement — from the site editor */\n' + rules.join('\n\n')
            : '/* Nothing moved yet — select a piece, drag or grow it, then copy. */';
    }

    // ---- Turning edit mode on / off ------------------------------------------
    function setEditing(on) {
        editing = on;
        document.body.classList.toggle('vero-editing', on);
        ui.toggle.classList.toggle('on', on);
        ui.panel.classList.toggle('open', on);
        if (!on && sel) { sel.classList.remove('vero-ed-selected'); sel = null; }
        if (!on) reclipAll();   // restore ancestor clipping when leaving edit mode
        positionFrame();
    }

    // ---- Wiring: hover highlight, select + drag, keys ------------------------
    function eligible(el) {
        if (!el || el.nodeType !== 1) return null;
        if (el.closest('#vero-ed-panel') || el.closest('#vero-ed-toggle') ||
            el.closest('#vero-ed-frame')) return null;
        return el;
    }

    let hovered = null;
    document.addEventListener('mousemove', e => {
        if (!editing || drag) return;
        const el = eligible(e.target);
        if (hovered && hovered !== el) hovered.classList.remove('vero-ed-hovering');
        if (el && el !== sel) { el.classList.add('vero-ed-hovering'); hovered = el; }
    }, true);

    document.addEventListener('pointerdown', e => {
        if (!editing) return;
        const el = eligible(e.target);
        if (!el) return;
        e.preventDefault(); e.stopPropagation();
        if (hovered) { hovered.classList.remove('vero-ed-hovering'); hovered = null; }
        select(el);
        const s = stateOf(el.__veroKey);
        drag = { x: e.clientX, y: e.clientY, dx: s.dx, dy: s.dy, el };
    }, true);

    window.addEventListener('pointermove', e => {
        // Stretch takes priority over move while a handle is held.
        if (resize && sel) {
            const s = stateOf(sel.__veroKey);
            if (resize.dir === 'e' || resize.dir === 'se') {
                const nw = Math.max(20, resize.w + (e.clientX - resize.x));
                s.sx = +(nw / resize.baseW).toFixed(3);
            }
            if (resize.dir === 's' || resize.dir === 'se') {
                const nh = Math.max(20, resize.h + (e.clientY - resize.y));
                s.sy = +(nh / resize.baseH).toFixed(3);
            }
            ui.scale.value = s.sx;
            applyKey(sel.__veroKey); updateReadout(); positionFrame();
            return;
        }
        if (!drag) return;
        const s = stateOf(drag.el.__veroKey);
        s.dx = Math.round(drag.dx + (e.clientX - drag.x));
        s.dy = Math.round(drag.dy + (e.clientY - drag.y));
        applyKey(drag.el.__veroKey); updateReadout(); positionFrame();
    });
    window.addEventListener('pointerup', () => {
        if (resize) { resize = null; save(); }
        if (drag) { drag = null; save(); }
    });
    // Keep the stretch frame glued to the element as the page scrolls / resizes.
    window.addEventListener('scroll', () => positionFrame(), true);
    window.addEventListener('resize', () => positionFrame());

    // Swallow the click that follows a select/drag so nothing navigates.
    document.addEventListener('click', e => {
        if (!editing) return;
        if (eligible(e.target)) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    window.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
            e.preventDefault(); setEditing(!editing); return;
        }
        if (!editing || !sel) return;
        const s = stateOf(sel.__veroKey);
        const step = e.shiftKey ? 10 : 1;
        let hit = true;
        switch (e.key) {
            case 'ArrowLeft':  s.dx -= step; break;
            case 'ArrowRight': s.dx += step; break;
            case 'ArrowUp':    s.dy -= step; break;
            case 'ArrowDown':  s.dy += step; break;
            case '[': s.sx = s.sy = Math.max(0.3, +(s.sx - 0.05).toFixed(2)); break;
            case ']': s.sx = s.sy = Math.min(3, +(s.sx + 0.05).toFixed(2)); break;
            default: hit = false;
        }
        if (!hit) return;
        e.preventDefault();
        ui.scale.value = s.sx;
        applyKey(sel.__veroKey); updateReadout(); positionFrame(); save();
    });

    // ---- Boot ----------------------------------------------------------------
    function boot() { buildUI(); applyAll(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
