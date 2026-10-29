/* ============================================================================
   edit-mode.js — in-page visual editor ("edit mode") for moravchick / VERO.

   A floating pencil button toggles edit mode. In edit mode you click any
   element on the page and change it in place — text, image/video, colours,
   size, or hide it. Nothing touches the code: every change is saved to the
   browser (localStorage) per page, and re-applied automatically on reload,
   including on content the site builds dynamically.

   Drop it on any page:  <script src="edit-mode.js" defer></script>
   Storage key:          vero_edit_<pathname>
   Clear a page:         press "איפוס" in the edit bar, or
                         localStorage.removeItem('vero_edit_' + location.pathname)
   ========================================================================== */
(function () {
    'use strict';
    if (window.__veroEditMode) return;          // guard against double-load
    window.__veroEditMode = true;

    var KEY = 'vero_edit_' + location.pathname;
    var store = {};
    try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }

    var ACCENT = '#2A6FEB';
    var active = false;
    var editingEl = null;       // element currently contentEditable
    var applying = false;       // guard so re-apply doesn't fight the observer
    var observer = null;

    /* ---------- stable selector path for an element ---------- */
    function pathOf(el) {
        if (!el || el.nodeType !== 1) return null;
        if (el.id) {
            try { if (document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id); } catch (e) {}
        }
        var parts = [];
        while (el && el.nodeType === 1 && el !== document.body && el.parentNode) {
            var parent = el.parentNode;
            var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === el.tagName; });
            var idx = same.indexOf(el) + 1;
            parts.unshift(el.tagName.toLowerCase() + ':nth-of-type(' + idx + ')');
            if (parent.id) {
                try { if (document.querySelectorAll('#' + CSS.escape(parent.id)).length === 1) { parts.unshift('#' + CSS.escape(parent.id)); return parts.join(' > '); } } catch (e) {}
            }
            el = parent;
        }
        return 'body > ' + parts.join(' > ');
    }

    /* ---------- persistence ---------- */
    function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
    function entry(path) { return (store[path] = store[path] || {}); }

    function applyOne(path, d) {
        var el;
        try { el = document.querySelector(path); } catch (e) { return; }
        if (!el) return;
        if (d.hidden) { el.style.setProperty('display', 'none', 'important'); return; }
        if ('html' in d && el !== editingEl) el.innerHTML = d.html;
        if (d.href && el.tagName === 'A') el.setAttribute('href', d.href);
        if (d.color) el.style.setProperty('color', d.color, 'important');
        if (d.bg) el.style.setProperty('background-color', d.bg, 'important');
        if (d.fontSize) el.style.setProperty('font-size', d.fontSize, 'important');
        /* move: CSS `translate` (independent of `transform`, so it won't clobber
           an existing transform such as a centering translateX(-50%)). */
        if (d.move) el.style.setProperty('translate', d.move);
        if (d.w) el.style.setProperty('width', d.w, 'important');
        if (d.h) el.style.setProperty('height', d.h, 'important');
        if (d.bgImage) el.style.setProperty('background-image', 'url("' + d.bgImage + '")', 'important');
        if (d.src) {
            if (el.tagName === 'IMG' || el.tagName === 'VIDEO') { el.removeAttribute('poster'); el.src = d.src; }
            var src = el.querySelector && el.querySelector('source'); if (src) { src.src = d.src; try { el.load && el.load(); } catch (e) {} }
        }
    }

    function applyAll() {
        applying = true;
        if (observer) observer.disconnect();
        for (var p in store) applyOne(p, store[p]);
        if (observer && active === false) observeOn();   // keep observing on live pages even when not editing
        if (observer) observeOn();
        applying = false;
    }

    function observeOn() {
        if (!observer) return;
        try { observer.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }

    /* Re-apply on dynamically injected content (the feed builds late). */
    var reapplyT;
    observer = new MutationObserver(function () {
        if (applying) return;
        clearTimeout(reapplyT);
        reapplyT = setTimeout(function () { applyAll(); }, 150);
    });

    /* ===================== UI ===================== */
    function el(tag, css, html) { var n = document.createElement(tag); if (css) n.style.cssText = css; if (html != null) n.innerHTML = html; n.setAttribute('data-em', '1'); return n; }

    // Pencil FAB
    var fab = el('button', [
        'position:fixed;left:16px;bottom:88px;z-index:2147483000;width:52px;height:52px;border-radius:50%;',
        'border:none;cursor:pointer;background:#1b1916;color:#fff;font-size:22px;line-height:1;',
        'box-shadow:0 6px 20px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;',
        'transition:transform .15s,background .15s;'
    ].join(''), '✎');
    fab.title = 'מצב עריכה';
    fab.addEventListener('click', function () { active ? exit() : enter(); });

    // Top bar (shown in edit mode)
    var bar = el('div', [
        'position:fixed;left:0;right:0;top:0;z-index:2147483000;display:none;align-items:center;gap:10px;',
        'justify-content:center;padding:9px 12px;background:' + ACCENT + ';color:#fff;',
        "font-family:'Jost','Inter',sans-serif;font-size:12px;letter-spacing:.5px;",
        'box-shadow:0 2px 12px rgba(0,0,0,.2);direction:rtl;'
    ].join(''));
    bar.innerHTML = '<span style="font-weight:600">מצב עריכה</span>' +
        '<span style="opacity:.85">— לחץ על כל אלמנט בדף כדי לשנות אותו</span>' +
        '<span style="flex:1"></span>' +
        '<button data-em="1" id="emUnhide" style="all:unset;cursor:pointer;padding:5px 10px;border:1px solid rgba(255,255,255,.6);border-radius:3px">הצג הכל</button>' +
        '<button data-em="1" id="emReset" style="all:unset;cursor:pointer;padding:5px 10px;border:1px solid rgba(255,255,255,.6);border-radius:3px">איפוס</button>' +
        '<button data-em="1" id="emDone" style="all:unset;cursor:pointer;padding:5px 12px;background:#fff;color:' + ACCENT + ';border-radius:3px;font-weight:600">סיום</button>';

    // Popover toolbar for a selected element
    var pop = el('div', [
        'position:fixed;z-index:2147483001;display:none;background:#1b1916;color:#fff;border-radius:8px;',
        'padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.35);direction:rtl;',
        "font-family:'Jost','Inter',sans-serif;font-size:12px;gap:4px;flex-wrap:wrap;max-width:300px;"
    ].join(''));

    function popBtn(label, fn) {
        var b = el('button', 'all:unset;cursor:pointer;padding:7px 10px;border-radius:5px;white-space:nowrap;', label);
        b.addEventListener('mouseenter', function () { b.style.background = 'rgba(255,255,255,.14)'; });
        b.addEventListener('mouseleave', function () { b.style.background = 'none'; });
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
        return b;
    }

    // Hidden helper inputs
    var colorInp = el('input'); colorInp.type = 'color'; colorInp.style.cssText = 'position:fixed;left:-9999px;';
    var fileInp = el('input'); fileInp.type = 'file'; fileInp.accept = 'image/*,video/*'; fileInp.style.cssText = 'position:fixed;left:-9999px;';

    var outline = el('div', 'position:fixed;z-index:2147482999;pointer-events:none;border:2px dashed ' + ACCENT + ';display:none;border-radius:3px;');

    /* ---------- selection + popover ---------- */
    var sel = null;   // currently selected element
    function showPopFor(target, x, y) {
        sel = target;
        pop.innerHTML = '';
        pop.style.display = 'flex';
        var isMedia = target.tagName === 'IMG' || target.tagName === 'VIDEO' || !!(target.querySelector && target.querySelector('source'));
        var hasBgImg = getComputedStyle(target).backgroundImage !== 'none';

        pop.appendChild(popBtn('✎ טקסט', function () { startText(target); hidePop(); }));
        pop.appendChild(popBtn('🎨 צבע טקסט', function () { pick('color'); }));
        pop.appendChild(popBtn('🖌 רקע', function () { pick('bg'); }));
        pop.appendChild(popBtn('A+ גדול', function () { bumpFont(target, 1.1); }));
        pop.appendChild(popBtn('A− קטן', function () { bumpFont(target, 0.9); }));
        pop.appendChild(popBtn('✥ הזז', function () { startMove(target); hidePop(); }));
        pop.appendChild(popBtn('⤢ גודל', function () { startResize(target); hidePop(); }));
        if (isMedia || hasBgImg) pop.appendChild(popBtn('🖼 החלף מדיה', function () { replaceMedia(target, hasBgImg && !isMedia); }));
        pop.appendChild(popBtn('🔗 קישור', function () { editLink(target); }));
        pop.appendChild(popBtn('🔒 הסתר', function () { hideEl(target); hidePop(); }));

        // position (clamped to viewport)
        var pw = 290, ph = 44;
        var px = Math.min(Math.max(8, x - pw / 2), window.innerWidth - pw - 8);
        var py = y + 14; if (py + ph > window.innerHeight - 8) py = y - ph - 14;
        pop.style.left = px + 'px'; pop.style.top = Math.max(50, py) + 'px';
        drawOutline(target);
    }
    function hidePop() { pop.style.display = 'none'; outline.style.display = 'none'; sel = null; }

    function drawOutline(target) {
        var r = target.getBoundingClientRect();
        outline.style.display = 'block';
        outline.style.left = r.left + 'px'; outline.style.top = r.top + 'px';
        outline.style.width = r.width + 'px'; outline.style.height = r.height + 'px';
    }

    /* ---------- actions ---------- */
    function startText(target) {
        editingEl = target;
        target.setAttribute('contenteditable', 'true');
        target.style.outline = '2px solid ' + ACCENT;
        target.focus();
        var done = function () {
            target.removeAttribute('contenteditable');
            target.style.outline = '';
            entry(pathOf(target)).html = target.innerHTML;
            save();
            editingEl = null;
            target.removeEventListener('blur', done);
        };
        target.addEventListener('blur', done);
    }

    function pick(kind) {
        if (!sel) return;
        var t = sel;
        colorInp.value = kind === 'color' ? toHex(getComputedStyle(t).color) : toHex(getComputedStyle(t).backgroundColor);
        colorInp.oninput = function () {
            if (kind === 'color') { t.style.setProperty('color', colorInp.value, 'important'); entry(pathOf(t)).color = colorInp.value; }
            else { t.style.setProperty('background-color', colorInp.value, 'important'); entry(pathOf(t)).bg = colorInp.value; }
            save(); drawOutline(t);
        };
        colorInp.click();
    }

    function bumpFont(t, factor) {
        var cur = parseFloat(getComputedStyle(t).fontSize) || 16;
        var next = Math.max(8, Math.round(cur * factor)) + 'px';
        t.style.setProperty('font-size', next, 'important');
        entry(pathOf(t)).fontSize = next; save(); drawOutline(t);
    }

    /* ---------- move + resize sessions ---------- */
    var session = null;   // active drag/resize session (suppresses click selection)

    function parsePair(str) {
        var m = /(-?\d+(?:\.\d+)?)\s*px?\s+(-?\d+(?:\.\d+)?)/.exec(str || '');
        return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
    }

    // Floating "done" hint shown during a move/resize session.
    var hint = el('div', [
        'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:2147483002;',
        'display:none;align-items:center;gap:10px;background:#1b1916;color:#fff;border-radius:999px;',
        'padding:8px 10px 8px 16px;box-shadow:0 8px 24px rgba(0,0,0,.4);direction:rtl;',
        "font-family:'Jost','Inter',sans-serif;font-size:12px;white-space:nowrap;"
    ].join(''));

    // Resize handle (bottom-right corner).
    var handle = el('div', [
        'position:fixed;z-index:2147483002;display:none;width:26px;height:26px;border-radius:50%;',
        'background:' + ACCENT + ';border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);',
        'cursor:nwse-resize;touch-action:none;'
    ].join(''));

    function endSession() {
        if (session && session.cleanup) session.cleanup();
        session = null;
        hint.style.display = 'none';
        handle.style.display = 'none';
        outline.style.display = 'none';
    }

    function showHint(label) {
        hint.innerHTML = '<span>' + label + '</span>' +
            '<button data-em="1" id="emSessDone" style="all:unset;cursor:pointer;padding:6px 14px;background:#fff;color:#1b1916;border-radius:999px;font-weight:600">✓ סיום</button>';
        hint.style.display = 'flex';
        hint.querySelector('#emSessDone').addEventListener('click', function (e) { e.stopPropagation(); endSession(); });
    }

    function startMove(t) {
        endSession();
        var p = pathOf(t), e2 = entry(p);
        t.style.setProperty('cursor', 'move');
        t.style.setProperty('touch-action', 'none');
        drawOutline(t);
        showHint('גרור את האלמנט למיקום הרצוי');
        var dragging = false, sx = 0, sy = 0, base = parsePair(e2.move);
        function down(ev) {
            ev.preventDefault(); ev.stopPropagation();
            dragging = true; base = parsePair(e2.move);
            sx = ev.clientX; sy = ev.clientY;
            try { t.setPointerCapture(ev.pointerId); } catch (e) {}
        }
        function move(ev) {
            if (!dragging) return;
            ev.preventDefault();
            var nx = base.x + (ev.clientX - sx), ny = base.y + (ev.clientY - sy);
            t.style.setProperty('translate', nx + 'px ' + ny + 'px');
            drawOutline(t);
        }
        function up(ev) {
            if (!dragging) return; dragging = false;
            var nx = base.x + (ev.clientX - sx), ny = base.y + (ev.clientY - sy);
            e2.move = nx + 'px ' + ny + 'px'; save();
        }
        t.addEventListener('pointerdown', down, true);
        t.addEventListener('pointermove', move, true);
        t.addEventListener('pointerup', up, true);
        session = { el: t, cleanup: function () {
            t.style.removeProperty('cursor'); t.style.removeProperty('touch-action');
            t.removeEventListener('pointerdown', down, true);
            t.removeEventListener('pointermove', move, true);
            t.removeEventListener('pointerup', up, true);
        } };
    }

    function startResize(t) {
        endSession();
        var p = pathOf(t), e2 = entry(p);
        drawOutline(t);
        showHint('גרור את הידית כדי לשנות גודל');
        function placeHandle() {
            var r = t.getBoundingClientRect();
            handle.style.display = 'block';
            handle.style.left = (r.right - 13) + 'px';
            handle.style.top = (r.bottom - 13) + 'px';
        }
        placeHandle();
        var dragging = false, sx = 0, sy = 0, bw = 0, bh = 0;
        function down(ev) {
            ev.preventDefault(); ev.stopPropagation();
            dragging = true;
            var r = t.getBoundingClientRect(); bw = r.width; bh = r.height;
            sx = ev.clientX; sy = ev.clientY;
            try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
        }
        function move(ev) {
            if (!dragging) return;
            ev.preventDefault();
            var nw = Math.max(20, bw + (ev.clientX - sx)), nh = Math.max(20, bh + (ev.clientY - sy));
            t.style.setProperty('width', nw + 'px', 'important');
            t.style.setProperty('height', nh + 'px', 'important');
            drawOutline(t); placeHandle();
        }
        function up() {
            if (!dragging) return; dragging = false;
            var r = t.getBoundingClientRect();
            e2.w = Math.round(r.width) + 'px'; e2.h = Math.round(r.height) + 'px'; save();
        }
        handle.addEventListener('pointerdown', down, true);
        handle.addEventListener('pointermove', move, true);
        handle.addEventListener('pointerup', up, true);
        session = { el: t, reposition: placeHandle, cleanup: function () {
            handle.removeEventListener('pointerdown', down, true);
            handle.removeEventListener('pointermove', move, true);
            handle.removeEventListener('pointerup', up, true);
        } };
    }

    function replaceMedia(t, asBackground) {
        var ask = confirm('אישור = העלאת קובץ מהמכשיר.\nביטול = הדבקת כתובת (URL).');
        if (ask) {
            fileInp.onchange = function () {
                var f = fileInp.files && fileInp.files[0]; if (!f) return;
                var rd = new FileReader();
                rd.onload = function () { setMedia(t, rd.result, asBackground); };
                rd.readAsDataURL(f); fileInp.value = '';
            };
            fileInp.click();
        } else {
            var url = prompt('הדבק כתובת תמונה/וידאו:'); if (url) setMedia(t, url.trim(), asBackground);
        }
    }
    function setMedia(t, src, asBackground) {
        var p = pathOf(t);
        if (asBackground) { t.style.setProperty('background-image', 'url("' + src + '")', 'important'); entry(p).bgImage = src; }
        else { entry(p).src = src; applyOne(p, { src: src }); }
        save(); drawOutline(t);
    }

    function editLink(t) {
        var a = t.closest ? t.closest('a') : null;
        if (!a) { alert('האלמנט הזה אינו קישור.'); return; }
        var url = prompt('כתובת היעד של הקישור:', a.getAttribute('href') || '');
        if (url == null) return;
        a.setAttribute('href', url);
        entry(pathOf(a)).html = a.innerHTML;   // keep as-is; href stored via attribute on this session
        // store href explicitly
        var e2 = entry(pathOf(a)); e2.href = url; save();
    }

    function hideEl(t) { t.style.setProperty('display', 'none', 'important'); entry(pathOf(t)).hidden = true; save(); }
    function unhideAll() {
        for (var p in store) if (store[p].hidden) {
            delete store[p].hidden;
            var e2; try { e2 = document.querySelector(p); } catch (ex) {}
            if (e2) e2.style.removeProperty('display');
        }
        save();
    }

    function resetPage() {
        if (!confirm('לאפס את כל השינויים בדף הזה? הפעולה אינה הפיכה.')) return;
        store = {}; try { localStorage.removeItem(KEY); } catch (e) {}
        location.reload();
    }

    /* ---------- colour helper ---------- */
    function toHex(c) {
        var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
        if (!m) return '#000000';
        return '#' + [1, 2, 3].map(function (i) { return ('0' + (+m[i]).toString(16)).slice(-2); }).join('');
    }

    /* ---------- edit-mode click interception ---------- */
    function onClick(e) {
        if (!active) return;
        var t = e.target;
        if (t.closest && t.closest('[data-em]')) return;   // our own UI
        if (editingEl) return;                               // let text editing proceed
        if (session) { e.preventDefault(); e.stopPropagation(); return; }  // move/resize in progress
        e.preventDefault(); e.stopPropagation();
        showPopFor(t, e.clientX, e.clientY);
    }
    function onOver(e) {
        if (!active || editingEl || session) return;
        var t = e.target; if (t.closest && t.closest('[data-em]')) return;
        drawOutline(t);
    }

    function enter() {
        active = true;
        document.body.classList.add('vero-em-active');
        bar.style.display = 'flex';
        fab.style.background = ACCENT; fab.textContent = '✓';
        document.documentElement.style.setProperty('scroll-behavior', 'auto');
    }
    function exit() {
        active = false;
        endSession();
        document.body.classList.remove('vero-em-active');
        bar.style.display = 'none'; hidePop();
        fab.style.background = '#1b1916'; fab.textContent = '✎';
    }

    /* ---------- boot ---------- */
    function boot() {
        document.body.appendChild(fab);
        document.body.appendChild(bar);
        document.body.appendChild(pop);
        document.body.appendChild(outline);
        document.body.appendChild(colorInp);
        document.body.appendChild(fileInp);
        document.body.appendChild(hint);
        document.body.appendChild(handle);

        var style = document.createElement('style');
        style.textContent = '.vero-em-active, .vero-em-active * { cursor: crosshair !important; }' +
            '.vero-em-active [data-em], .vero-em-active [data-em] * { cursor: pointer !important; }';
        document.head.appendChild(style);

        document.addEventListener('click', onClick, true);
        document.addEventListener('mouseover', onOver, true);
        window.addEventListener('scroll', function () {
            if (session) { drawOutline(session.el); if (session.reposition) session.reposition(); }
            else if (sel) drawOutline(sel);
        }, true);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (editingEl) editingEl.blur(); else if (session) endSession(); else hidePop(); } });

        bar.querySelector('#emDone').addEventListener('click', exit);
        bar.querySelector('#emReset').addEventListener('click', resetPage);
        bar.querySelector('#emUnhide').addEventListener('click', unhideAll);

        applyAll();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
