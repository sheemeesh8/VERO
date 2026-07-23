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
        if (!map[key]) map[key] = { dx: 0, dy: 0, scale: 1 };
        return map[key];
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {} }

    function applyKey(key) {
        const el = document.querySelector(key);
        if (!el) return;
        const s = map[key];
        const tf = [];
        if (s.dx || s.dy) tf.push(`translate(${s.dx}px, ${s.dy}px)`);
        if (s.scale !== 1) tf.push(`scale(${s.scale})`);
        el.style.transform = tf.join(' ');
    }
    function applyAll() { Object.keys(map).forEach(applyKey); }

    // ---- Selection -----------------------------------------------------------
    function select(el) {
        if (sel) sel.classList.remove('vero-ed-selected');
        sel = el;
        el.classList.add('vero-ed-selected');
        el.__veroKey = el.__veroKey || cssPath(el);
        const s = stateOf(el.__veroKey);
        ui.name.textContent = el.__veroKey;
        ui.scale.disabled = false;
        ui.scale.value = s.scale;
        updateReadout();
    }
    function updateReadout() {
        if (!sel) { ui.readout.textContent = 'בחר פריט — לחיצה בוחרת, גרירה מזיזה'; return; }
        const s = stateOf(sel.__veroKey);
        ui.readout.innerHTML =
            `translate(<b>${s.dx}px</b>, <b>${s.dy}px</b>) · scale(<b>${s.scale.toFixed(2)}</b>)`;
        ui.scaleOut.textContent = '×' + s.scale.toFixed(2);
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
            #vero-ed-toggle {
                position: fixed; left: 18px; bottom: 18px; z-index: 100000;
                width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
                background: #111; color: #fff; border: none; font-size: 20px;
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
                font-family: 'Segoe UI', sans-serif; font-size: 13px;
            }
            #vero-ed-panel.open { display: block; }
            #vero-ed-panel h4 { margin: 0 0 10px; font-size: 12px; letter-spacing: 1px;
                text-transform: uppercase; color: #004225; }
            #vero-ed-panel .vero-ed-sel {
                direction: ltr; text-align: left; background: #f4f3f0; border-radius: 6px;
                padding: 7px 9px; font-family: monospace; font-size: 11px; color: #333;
                word-break: break-all; margin-bottom: 10px; max-height: 64px; overflow: auto;
            }
            #vero-ed-panel .vero-ed-read { direction: ltr; text-align: left; color: #555;
                font-size: 12px; margin-bottom: 12px; }
            #vero-ed-panel .vero-ed-read b { color: #111; }
            #vero-ed-panel label { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
            #vero-ed-panel input[type=range] { flex: 1; }
            #vero-ed-panel .vero-ed-btns { display: flex; flex-wrap: wrap; gap: 6px; }
            #vero-ed-panel button.b {
                flex: 1 1 auto; padding: 8px 10px; border-radius: 6px; cursor: pointer;
                border: 1px solid #d8d5cc; background: #fff; color: #111; font-size: 11px;
                letter-spacing: 0.5px; font-family: inherit;
            }
            #vero-ed-panel button.b:hover { background: #f0efeb; }
            #vero-ed-panel button.b.dark { background: #004225; border-color: #004225; color: #fff; }
            #vero-ed-panel .vero-ed-hint { color: #9a9a9a; font-size: 11px; margin-top: 10px; line-height: 1.5; }
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
            <div class="vero-ed-hint">גרירה מזיזה · חיצים 1px (Shift 10px) · הסליידר או [ ] מגדילים</div>
        `;
        document.body.appendChild(panel);

        ui = {
            toggle, panel,
            name: panel.querySelector('#vero-ed-name'),
            readout: panel.querySelector('#vero-ed-read'),
            scale: panel.querySelector('#vero-ed-scale'),
            scaleOut: panel.querySelector('#vero-ed-scaleout')
        };

        ui.scale.addEventListener('input', e => {
            if (!sel) return;
            stateOf(sel.__veroKey).scale = +e.target.value;
            applyKey(sel.__veroKey); updateReadout(); save();
        });
        panel.querySelector('#vero-ed-reset').onclick = () => {
            if (!sel) return;
            delete map[sel.__veroKey];
            sel.style.transform = '';
            ui.scale.value = 1; updateReadout(); save();
        };
        panel.querySelector('#vero-ed-resetall').onclick = () => {
            Object.keys(map).forEach(k => { const el = document.querySelector(k); if (el) el.style.transform = ''; });
            map = {}; save();
            if (sel) ui.scale.value = 1;
            updateReadout();
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
        for (const [selector, s] of Object.entries(map)) {
            if (!s.dx && !s.dy && s.scale === 1) continue;
            const tf = [];
            if (s.dx || s.dy) tf.push(`translate(${s.dx}px, ${s.dy}px)`);
            if (s.scale !== 1) tf.push(`scale(${s.scale})`);
            rules.push(`${selector} {\n    transform: ${tf.join(' ')};\n}`);
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
    }

    // ---- Wiring: hover highlight, select + drag, keys ------------------------
    function eligible(el) {
        if (!el || el.nodeType !== 1) return null;
        if (el.closest('#vero-ed-panel') || el.closest('#vero-ed-toggle')) return null;
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
        if (!drag) return;
        const s = stateOf(drag.el.__veroKey);
        s.dx = Math.round(drag.dx + (e.clientX - drag.x));
        s.dy = Math.round(drag.dy + (e.clientY - drag.y));
        applyKey(drag.el.__veroKey); updateReadout();
    });
    window.addEventListener('pointerup', () => { if (drag) { drag = null; save(); } });

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
            case '[': s.scale = Math.max(0.3, +(s.scale - 0.05).toFixed(2)); break;
            case ']': s.scale = Math.min(3, +(s.scale + 0.05).toFixed(2)); break;
            default: hit = false;
        }
        if (!hit) return;
        e.preventDefault();
        ui.scale.value = s.scale;
        applyKey(sel.__veroKey); updateReadout(); save();
    });

    // ---- Boot ----------------------------------------------------------------
    function boot() { buildUI(); applyAll(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
