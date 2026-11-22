/* ============================================================================
   store-live-edit.js — edit the storefront in place, on the store page itself.

   The store (buyer-profile.html) is the seller's own website: a menu bar, a
   hero slider, banners, products, a story, a footer… This file lets the seller
   change all of it right where buyers see it:

     • "Edit store" (or ?edit=1) turns the page into an editor.
     • Tap any text and type. Tap 📷 on any picture to replace it.
     • Tap a section to get its toolbar: move, settings, duplicate, hide, delete.
     • "+" between sections adds a new one (slider, banner, products, …).
     • Sliders get their own bar: add / remove / reorder slides.
     • The cover picture and the bio in the header are editable too.
     • Theme picks the store's template and accent colour.
     • Every change is kept as a draft (vero_store_config.sectionsDraft) until
       "Publish" makes it the live store (vero_store_config.sections).

   Needs store-sections.js (window.VeroStore) and the storefront hook that
   buyer-profile.html exposes as window.VeroStorefront.
   ========================================================================== */
(function () {
    'use strict';
    var V = window.VeroStore, SF = window.VeroStorefront;
    var host = document.getElementById('sfSections');
    if (!V || !SF || !host) return;

    var KEY = 'vero_store_config';
    var qs = new URLSearchParams(location.search);
    if (qs.get('visitor') === '1') return;          // looking at it as a buyer would

    /* ------------------------------ helpers ------------------------------ */
    var esc = V.esc, uid = V.uid;
    var $ = function (id) { return document.getElementById(id); };
    var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
    var readCfg = function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
    var writeCfg = function (o) {
        try { localStorage.setItem(KEY, JSON.stringify(o)); return true; }
        catch (e) { toast('Storage is full — remove a picture and try again'); return false; }
    };
    function getPath(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
    function setPath(o, path, val) {
        var ks = path.split('.'), last = ks.pop();
        var t = ks.reduce(function (a, k) { return a == null ? a : a[k]; }, o);
        if (t != null) t[last] = val;
    }
    var ICON = {
        pen:   '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
        up:    '<path d="M12 19V5M6 11l6-6 6 6"/>',
        down:  '<path d="M12 5v14M6 13l6 6 6-6"/>',
        gear:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
        copy:  '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
        eye:   '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        eyeOff:'<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>',
        trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
        undo:  '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
        redo:  '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
        theme: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 21a3 3 0 0 1 0-6h2"/>',
        close: '<path d="M6 6l12 12M18 6L6 18"/>',
        cam:   '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
        plus:  '<path d="M12 5v14M5 12h14"/>',
        left:  '<path d="M15 5l-7 7 7 7"/>',
        right: '<path d="M9 5l7 7-7 7"/>'
    };
    var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>'; };

    var TEMPLATES = [
        ['t1', 'Minimal', '#EB2323', '#ffffff'], ['t2', 'Editorial', '#9a7d52', '#f7f3ec'], ['t3', 'Noir', '#d9d9d9', '#141414'],
        ['t4', 'Blush', '#c0707e', '#fbf1f1'], ['t5', 'Street', '#ff5a1f', '#ffffff'], ['t6', 'Luxe', '#c8a24a', '#0f2a22'],
        ['t7', 'Lavender', '#8a6fd1', '#f6f3fc'], ['t8', 'Gallery', '#555555', '#f4f4f4'], ['t9', 'Classic', '#1f3a5f', '#fbf8f2'],
        ['t10', 'Coast', '#1f9e9e', '#f2fafa']
    ];
    var ACCENTS = ['', '#111111', '#EB2323', '#c8a24a', '#9a7d52', '#c0707e', '#ff5a1f', '#2f6bff', '#1f9e9e', '#3c7a3c', '#8a6fd1'];
    var SWATCHES = ['', '#111111', '#ffffff', '#f2f0ef', '#EB2323', '#c8a24a', '#1f3a5f', '#2f6bff', '#1f9e9e', '#c0707e', '#3c7a3c'];

    /* ------------------------------- state ------------------------------- */
    var active = false, previewing = false;
    var sections = [], baseline = '', hist = [], hi = 0, selId = null;
    var theme = null, themeBase = null;              // {template, accent}
    var heroDraft = { bio: null, coverBlob: null, coverURL: null };
    var ui = {};                                     // fixed chrome nodes

    function ctx() {
        return { products: SF.products(), card: SF.card, storeName: SF.storeName(), editing: active && !previewing };
    }
    function byId(id) { for (var i = 0; i < sections.length; i++) if (sections[i].id === id) return sections[i]; return null; }
    function indexOf(id) { for (var i = 0; i < sections.length; i++) if (sections[i].id === id) return i; return -1; }
    function isDirty() {
        return JSON.stringify(sections) !== baseline ||
            JSON.stringify(theme) !== JSON.stringify(themeBase) ||
            heroDraft.bio != null || !!heroDraft.coverBlob;
    }

    /* ---------------------------- persistence ---------------------------- */
    function saveDraft() {
        var cfg = readCfg();
        if (JSON.stringify(sections) === baseline) delete cfg.sectionsDraft; else cfg.sectionsDraft = sections;
        writeCfg(cfg);
        paintStatus();
    }
    function commit() {
        var snap = JSON.stringify(sections);
        if (hist[hi] === snap) { saveDraft(); return; }
        hist = hist.slice(0, hi + 1); hist.push(snap); if (hist.length > 80) hist.shift(); hi = hist.length - 1;
        saveDraft();
    }
    function travel(d) {
        var n = hi + d; if (n < 0 || n >= hist.length) return;
        hi = n; sections = JSON.parse(hist[hi]);
        if (selId && !byId(selId)) selId = null;
        saveDraft(); paint();
        if (ui.sheet && ui.sheet.dataset.kind === 'settings') { if (selId) openSettings(selId); else closeSheet(); }
    }

    /* ------------------------------- toast ------------------------------- */
    var toastT;
    function toast(msg) {
        var t = $('leToast');
        if (!t) { t = document.createElement('div'); t.id = 'leToast'; t.className = 'le-toast le-ui'; document.body.appendChild(t); }
        t.textContent = msg; t.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2400);
    }

    /* ---------------------------- entry button --------------------------- */
    var fab = document.createElement('button');
    fab.type = 'button'; fab.id = 'leFab'; fab.className = 'le-fab le-ui';
    fab.innerHTML = svg('pen') + '<span>Edit store</span>';
    fab.addEventListener('click', enter);
    document.body.appendChild(fab);

    /* --------------------------- enter / leave --------------------------- */
    function enter() {
        if (active) return;
        var cfg = readCfg();
        var published = Array.isArray(cfg.sections) ? cfg.sections : SF.currentSections();
        sections = clone(Array.isArray(cfg.sectionsDraft) ? cfg.sectionsDraft : published);
        baseline = JSON.stringify(published);
        hist = [JSON.stringify(sections)]; hi = 0; selId = null;
        theme = { template: cfg.template || '', accent: cfg.accent || '' };
        themeBase = clone(theme);
        heroDraft = { bio: null, coverBlob: null, coverURL: null };
        active = true; previewing = false;
        document.documentElement.classList.add('le-on');
        buildChrome();
        paint();
        editHero(true);
        if (Array.isArray(cfg.sectionsDraft)) toast('Your unpublished draft is open');
    }

    function leave() {
        active = false; previewing = false; selId = null;
        document.documentElement.classList.remove('le-on', 'le-preview');
        closeSheet();
        ['bar', 'pill'].forEach(function (k) { if (ui[k]) ui[k].remove(); ui[k] = null; });
        editHero(false);
        applyTheme(themeBase);                       // drop unpublished theme previews
        host.classList.remove('ss-editing');
        SF.rerender();
        if (qs.get('edit') === '1') { qs.delete('edit'); history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash); }
    }

    function askLeave() {
        if (!isDirty()) { leave(); return; }
        openSheet('leave', '<div class="le-sh-h">Leave the editor?</div>' +
            '<p class="le-sh-note">You have changes buyers can\'t see yet.</p>' +
            '<button type="button" class="le-btn le-primary le-wide" data-act="publish">Publish now</button>' +
            '<button type="button" class="le-btn le-wide" data-act="keep">Keep as draft &amp; leave</button>' +
            '<button type="button" class="le-btn le-danger le-wide" data-act="discard">Discard changes</button>');
    }

    function publish() {
        var cfg = readCfg();
        cfg.sections = clone(sections);
        delete cfg.sectionsDraft;
        if (theme.template) cfg.template = theme.template; else delete cfg.template;
        if (theme.accent) cfg.accent = theme.accent; else delete cfg.accent;
        var jobs = [];
        if (heroDraft.coverBlob && typeof window.veroMediaSet === 'function') {
            jobs.push(window.veroMediaSet('hero', heroDraft.coverBlob).then(function () {
                cfg.hero = window.VERO_IDB_FLAG || 'idb'; delete cfg.heroVideo;
            }).catch(function () { toast('Could not save the cover picture'); }));
        }
        Promise.all(jobs).then(function () {
            if (!writeCfg(cfg)) return;
            if (heroDraft.bio != null) {
                try {
                    var prof = JSON.parse(localStorage.getItem('vero_profile')) || {};
                    prof.bio = heroDraft.bio; localStorage.setItem('vero_profile', JSON.stringify(prof));
                } catch (e) {}
            }
            baseline = JSON.stringify(sections); themeBase = clone(theme);
            heroDraft = { bio: null, coverBlob: null, coverURL: heroDraft.coverURL };
            paintStatus();
            toast('Published — buyers now see this version');
        });
    }

    /* ------------------------------- chrome ------------------------------ */
    function buildChrome() {
        var bar = document.createElement('div');
        bar.className = 'le-bar le-ui';
        bar.innerHTML =
            '<button type="button" class="le-ib" data-act="exit" aria-label="Close editor">' + svg('close') + '</button>' +
            '<div class="le-bar-mid"><b>Editing your store</b><span id="leStatus"></span></div>' +
            '<button type="button" class="le-ib" data-act="undo" id="leUndo" aria-label="Undo">' + svg('undo') + '</button>' +
            '<button type="button" class="le-ib" data-act="redo" id="leRedo" aria-label="Redo">' + svg('redo') + '</button>' +
            '<button type="button" class="le-ib" data-act="theme" aria-label="Theme">' + svg('theme') + '</button>' +
            '<button type="button" class="le-ib" data-act="preview" aria-label="Preview">' + svg('eye') + '</button>' +
            '<button type="button" class="le-pub" data-act="publish" id="lePub">Publish</button>';
        document.body.appendChild(bar);
        ui.bar = bar;

        var pill = document.createElement('button');
        pill.type = 'button'; pill.className = 'le-back le-ui'; pill.setAttribute('data-act', 'unpreview');
        pill.innerHTML = svg('pen') + '<span>Back to editing</span>';
        document.body.appendChild(pill);
        ui.pill = pill;
        paintStatus();
    }

    function paintStatus() {
        if (!ui.bar) return;
        var d = isDirty();
        $('leStatus').textContent = d ? 'Draft · not published yet' : 'Live · everything published';
        $('leStatus').classList.toggle('is-draft', d);
        $('lePub').disabled = !d;
        $('leUndo').disabled = hi <= 0;
        $('leRedo').disabled = hi >= hist.length - 1;
    }

    // One click router for every editor control, wherever it sits.
    document.addEventListener('click', function (e) {
        if (!active) return;
        var b = e.target.closest('[data-act]');
        if (!b || !b.closest('.le-ui')) return;
        e.preventDefault(); e.stopPropagation();
        act(b.getAttribute('data-act'), b);
    }, true);

    function act(a, b) {
        var sid = b.getAttribute('data-sid') || selId, s = byId(sid), i = indexOf(sid);
        switch (a) {
            case 'exit': askLeave(); break;
            case 'undo': travel(-1); break;
            case 'redo': travel(1); break;
            case 'publish': closeSheet(); publish(); break;
            case 'keep': closeSheet(); leave(); toast('Saved as a draft'); break;
            case 'discard':
                sections = JSON.parse(baseline); closeSheet();
                var cfg = readCfg(); delete cfg.sectionsDraft; writeCfg(cfg);
                heroDraft = { bio: null, coverBlob: null, coverURL: null };
                leave(); setTimeout(function () { location.reload(); }, 50);
                break;
            case 'theme': openTheme(); break;
            case 'preview': setPreview(true); break;
            case 'unpreview': setPreview(false); break;
            case 'sheet-close': closeSheet(); break;

            /* section toolbar */
            case 'up': case 'down':
                var j = i + (a === 'up' ? -1 : 1);
                if (i < 0 || j < 0 || j >= sections.length) return;
                sections.splice(j, 0, sections.splice(i, 1)[0]);
                commit(); paint(); scrollToSection(sid); break;
            case 'settings': openSettings(sid); break;
            case 'dup':
                if (!s) return;
                var c = clone(s); c.id = uid();
                ['slides', 'cells', 'items', 'links'].forEach(function (k) { (c[k] || []).forEach(function (x) { x.id = uid(); }); });
                sections.splice(i + 1, 0, c); selId = c.id; commit(); paint(); scrollToSection(c.id); toast('Section duplicated'); break;
            case 'hide':
                if (!s) return; s.hidden = !s.hidden; commit(); paint();
                toast(s.hidden ? 'Hidden from buyers' : 'Visible to buyers'); break;
            case 'del':
                if (!s) return;
                sections.splice(i, 1); selId = null; commit(); paint(); closeSheet();
                toast((V.TYPES[s.type] || {}).name + ' removed · Undo to bring it back'); break;
            case 'add': openAdd(Number(b.getAttribute('data-at'))); break;
            case 'add-type':
                var ns = V.defaults(b.getAttribute('data-type'));
                var at = Number(ui.sheet && ui.sheet.dataset.at); if (!isFinite(at)) at = sections.length;
                if (ns.type === 'nav') { ns.brand = SF.storeName(); ns.links = linkTargets().slice(0, 4).map(function (t) { return { id: uid(), label: t[2], to: t[0] }; }); }
                if (ns.type === 'footer') ns.title = SF.storeName();
                sections.splice(at, 0, ns); selId = ns.id; closeSheet(); commit(); paint(); scrollToSection(ns.id); break;

            /* images */
            case 'img': pickImage(b.getAttribute('data-sid'), b.getAttribute('data-path')); break;
            case 'img-clear':
                if (!s) return; setPath(s, b.getAttribute('data-path'), ''); commit(); paint(); refreshSettings(); break;

            /* slider bar */
            case 'slide-add': case 'slide-del': case 'slide-left': case 'slide-right':
                slideAct(a, s, b); break;

            /* settings sheet */
            case 'set':
                if (!s) return;
                var raw = b.getAttribute('data-v'), path = b.getAttribute('data-path');
                setPath(s, path, b.hasAttribute('data-num') ? Number(raw) : raw);
                commit(); paint(); refreshSettings(); break;
            case 'list-add': listAdd(s, b.getAttribute('data-list')); break;
            case 'list-del': case 'list-up':
                if (!s) return;
                var arr = s[b.getAttribute('data-list')], k = Number(b.getAttribute('data-i'));
                if (!Array.isArray(arr)) return;
                if (a === 'list-del') arr.splice(k, 1); else if (k > 0) arr.splice(k - 1, 0, arr.splice(k, 1)[0]);
                commit(); paint(); refreshSettings(); break;

            /* theme */
            case 'tpl': theme.template = b.getAttribute('data-v'); applyTheme(theme); paintStatus(); openTheme(); break;
            case 'accent': theme.accent = b.getAttribute('data-v'); applyTheme(theme); paintStatus(); openTheme(); break;

            /* header */
            case 'cover': pickCover(); break;

            case 'reset-layout':
                sections = V.starter({ storeName: SF.storeName(), cols: readCfg().grid }); selId = null;
                closeSheet(); commit(); paint(); window.scrollTo({ top: 0, behavior: 'smooth' });
                toast('Recommended layout loaded · Undo to go back'); break;
        }
    }

    function setPreview(on) {
        previewing = on; selId = null; closeSheet();
        document.documentElement.classList.toggle('le-preview', on);
        editHero(!on);
        paint();
        if (on) toast('Preview — this is what buyers will see');
    }

    /* -------------------------------- paint ------------------------------- */
    function paint() {
        // Keep each slider on the slide it was showing.
        var keep = {};
        host.querySelectorAll('[data-ss-slider]').forEach(function (t) {
            var sec = t.closest('[data-sid]'); if (sec) keep[sec.getAttribute('data-sid')] = t.scrollLeft;
        });
        var c = ctx();
        V.render(host, sections, c);
        host.hidden = false;
        ['feed', 'feedHead', 'feedEmpty'].forEach(function (id) { var el = $(id); if (el) el.style.display = 'none'; });
        host.querySelectorAll('[data-ss-slider]').forEach(function (t) {
            var sec = t.closest('[data-sid]'), k = sec && keep[sec.getAttribute('data-sid')];
            if (k) { t.style.scrollBehavior = 'auto'; t.scrollLeft = k; t.style.scrollBehavior = ''; }
        });
        if (c.editing) decorate();
        paintStatus();
    }

    function decorate() {
        var secs = host.querySelectorAll(':scope > [data-sid]');
        secs.forEach(function (el, i) {
            var sid = el.getAttribute('data-sid'), s = byId(sid);
            if (!s) return;
            el.classList.add('le-sec');
            el.classList.toggle('le-sel', sid === selId);
            host.insertBefore(insertBtn(i), el);

            var tools = document.createElement('div');
            tools.className = 'le-tools le-ui';
            tools.innerHTML = '<span class="le-tag">' + esc((V.TYPES[s.type] || {}).name || s.type) + (s.hidden ? ' · hidden' : '') + '</span>' +
                tb('up', 'up', 'Move up', i === 0) + tb('down', 'down', 'Move down', i === secs.length - 1) +
                tb('settings', 'gear', 'Settings') + tb('dup', 'copy', 'Duplicate') +
                tb('hide', s.hidden ? 'eyeOff' : 'eye', s.hidden ? 'Show' : 'Hide') + tb('del', 'trash', 'Delete', false, 'le-t-del');
            tools.querySelectorAll('[data-act]').forEach(function (b) { b.setAttribute('data-sid', sid); });
            el.appendChild(tools);

            // Pictures: a camera chip on each one.
            el.querySelectorAll('[data-fm]').forEach(function (m) {
                var chip = document.createElement('button');
                chip.type = 'button'; chip.className = 'le-img le-ui';
                chip.setAttribute('data-act', 'img'); chip.setAttribute('data-sid', sid); chip.setAttribute('data-path', m.getAttribute('data-fm'));
                chip.innerHTML = svg('cam') + '<span>' + (getPath(s, m.getAttribute('data-fm')) ? 'Change picture' : 'Add picture') + '</span>';
                m.parentElement.appendChild(chip);
            });

            // Slider: its own bar for the slides.
            if (s.type === 'slider') {
                var n = (s.slides || []).length;
                var sb = document.createElement('div');
                sb.className = 'le-slidebar le-ui';
                sb.innerHTML = '<button type="button" data-act="slide-left" aria-label="Move slide earlier">' + svg('left') + '</button>' +
                    '<button type="button" data-act="slide-add">' + svg('plus') + 'Slide</button>' +
                    '<button type="button" data-act="slide-del"' + (n > 1 ? '' : ' disabled') + '>' + svg('trash') + 'This slide</button>' +
                    '<button type="button" data-act="slide-right" aria-label="Move slide later">' + svg('right') + '</button>';
                sb.querySelectorAll('[data-act]').forEach(function (b) { b.setAttribute('data-sid', sid); });
                el.appendChild(sb);
            }

            // Texts: type straight into them.
            el.querySelectorAll('[data-f]').forEach(function (f) {
                f.setAttribute('contenteditable', 'plaintext-only');
                if (f.contentEditable !== 'plaintext-only') f.setAttribute('contenteditable', 'true');
                f.setAttribute('spellcheck', 'false');
                f.classList.add('le-txt');
                f.setAttribute('data-sid', sid);
            });
        });
        host.appendChild(insertBtn(sections.length, true));
    }
    function tb(a, icon, label, disabled, cls) {
        return '<button type="button" class="le-t ' + (cls || '') + '" data-act="' + a + '" aria-label="' + label + '" title="' + label + '"' + (disabled ? ' disabled' : '') + '>' + svg(icon) + '</button>';
    }
    function insertBtn(at, big) {
        var d = document.createElement('div');
        d.className = 'le-ins le-ui' + (big ? ' le-ins-big' : '');
        d.innerHTML = '<button type="button" data-act="add" data-at="' + at + '">' + svg('plus') + (big ? '<span>Add a section</span>' : '') + '</button>';
        return d;
    }
    function scrollToSection(sid) {
        var el = host.querySelector('[data-sid="' + sid + '"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* ------------------------ selection & clicks ------------------------ */
    host.addEventListener('click', function (e) {
        if (!active || previewing) return;
        if (e.target.closest('.le-ui')) return;          // editor controls handle themselves
        var txt = e.target.closest('[data-f]');
        // Links/buttons inside the store never navigate while editing.
        if (e.target.closest('a, button')) e.preventDefault();
        var sec = e.target.closest('[data-sid]');
        if (!sec || !sec.classList.contains('le-sec')) return;
        var sid = sec.getAttribute('data-sid');
        if (sid !== selId) {
            selId = sid;
            host.querySelectorAll('.le-sec').forEach(function (x) { x.classList.toggle('le-sel', x === sec); });
        }
        if (txt) return;
    }, true);

    /* ------------------------------ texts ------------------------------- */
    var typing = null;
    host.addEventListener('input', function (e) {
        var f = e.target.closest && e.target.closest('[data-f]');
        if (!f || !active) return;
        var s = byId(f.getAttribute('data-sid')); if (!s) return;
        var v = f.innerText.replace(/ /g, ' ');
        if (!f.classList.contains('ss-text')) v = v.replace(/\n+/g, ' ');
        setPath(s, f.getAttribute('data-f'), v.trim() ? v : '');
        f.classList.toggle('ss-ph', !v.trim());
        clearTimeout(typing); typing = setTimeout(saveDraft, 400);
    });
    host.addEventListener('focusout', function (e) {
        if (!active || !e.target.closest || !e.target.closest('[data-f]')) return;
        clearTimeout(typing); commit();
    });
    host.addEventListener('keydown', function (e) {
        var f = e.target.closest && e.target.closest('[data-f]');
        if (!f) return;
        if (e.key === 'Enter' && !f.classList.contains('ss-text')) { e.preventDefault(); f.blur(); }
        if (e.key === 'Escape') f.blur();
    });
    host.addEventListener('paste', function (e) {
        var f = e.target.closest && e.target.closest('[data-f]');
        if (!f) return;
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, t);
    });

    document.addEventListener('keydown', function (e) {
        if (!active) return;
        var inField = e.target.closest && (e.target.closest('[data-f]') || e.target.closest('input, textarea'));
        if ((e.ctrlKey || e.metaKey) && !inField && e.key.toLowerCase() === 'z') { e.preventDefault(); travel(e.shiftKey ? 1 : -1); }
        if (e.key === 'Escape' && !inField) { if (ui.sheet && ui.sheet.classList.contains('open')) closeSheet(); else if (selId) { selId = null; paint(); } }
    });

    /* ------------------------------ images ------------------------------ */
    var fileIn = document.createElement('input');
    fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.hidden = true; fileIn.className = 'le-ui';
    document.body.appendChild(fileIn);
    var pickFor = null;
    fileIn.addEventListener('change', function () {
        var f = fileIn.files && fileIn.files[0]; fileIn.value = '';
        if (!f || !pickFor) return;
        var job = pickFor; pickFor = null;
        shrink(f, 1800).then(job);
    });
    function choose(fn) { pickFor = fn; fileIn.click(); }

    // Downscale big camera photos so storage stays light.
    function shrink(file, max) {
        return new Promise(function (resolve) {
            if (!/^image\/(jpeg|png|webp)/.test(file.type)) return resolve(file);
            var url = URL.createObjectURL(file), img = new Image();
            img.onload = function () {
                var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
                if (k >= 1 && file.size < 900000) { URL.revokeObjectURL(url); return resolve(file); }
                var c = document.createElement('canvas');
                c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                URL.revokeObjectURL(url);
                c.toBlob(function (b) { resolve(b || file); }, 'image/jpeg', 0.86);
            };
            img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        });
    }

    function pickImage(sid, path) {
        choose(function (blob) {
            var s = byId(sid); if (!s) return;
            var done = function (pointer, url) {
                V.setMedia(pointer, url);
                setPath(s, path, pointer); commit(); paint(); refreshSettings();
            };
            if (typeof window.veroMediaSet === 'function') {
                var key = 'sf_' + uid() + uid();
                window.veroMediaSet(key, blob).then(function () { done('idb:' + key, URL.createObjectURL(blob)); })
                    .catch(function () { toast('Could not save that picture'); });
            } else {
                var r = new FileReader();
                r.onload = function () { done(r.result, r.result); };
                r.readAsDataURL(blob);
            }
        });
    }

    /* ------------------------------ slider ------------------------------ */
    function currentSlide(sid) {
        var t = host.querySelector('[data-sid="' + sid + '"] [data-ss-slider]');
        return t && t._ssCurrent ? t._ssCurrent() : 0;
    }
    function showSlide(sid, i) {
        requestAnimationFrame(function () {
            var t = host.querySelector('[data-sid="' + sid + '"] [data-ss-slider]');
            var c = t && t.children[i];
            if (c) { t.style.scrollBehavior = 'auto'; t.scrollLeft = c.offsetLeft - (t.clientWidth - c.offsetWidth) / 2; t.style.scrollBehavior = ''; }
        });
    }
    function slideAct(a, s, b) {
        if (!s || !Array.isArray(s.slides)) return;
        var i = currentSlide(s.id), n = s.slides.length, to = i;
        if (a === 'slide-add') {
            s.slides.splice(i + 1, 0, { id: uid(), image: '', kicker: '', title: 'New slide', text: '', cta: '' }); to = i + 1;
            toast('Slide added — tap 📷 to give it a picture');
        } else if (a === 'slide-del') {
            if (n < 2) return; s.slides.splice(i, 1); to = Math.min(i, n - 2);
        } else {
            var j = i + (a === 'slide-left' ? -1 : 1);
            if (j < 0 || j >= n) return;
            s.slides.splice(j, 0, s.slides.splice(i, 1)[0]); to = j;
        }
        commit(); paint(); showSlide(s.id, to); refreshSettings();
    }

    /* ------------------------------- sheets ------------------------------ */
    function openSheet(kind, html) {
        if (!ui.sheet) {
            ui.scrim = document.createElement('div'); ui.scrim.className = 'le-scrim le-ui';
            ui.scrim.addEventListener('click', closeSheet);
            ui.sheet = document.createElement('div'); ui.sheet.className = 'le-sheet le-ui';
            document.body.appendChild(ui.scrim); document.body.appendChild(ui.sheet);
        }
        var top = ui.sheet.dataset.kind === kind ? ui.sheet.scrollTop : 0;
        ui.sheet.dataset.kind = kind;
        ui.sheet.innerHTML = '<div class="le-grab"></div><button type="button" class="le-sh-x" data-act="sheet-close" aria-label="Close">' + svg('close') + '</button>' + html;
        ui.sheet.scrollTop = top;
        requestAnimationFrame(function () { ui.sheet.classList.add('open'); ui.scrim.classList.add('open'); });
    }
    function closeSheet() {
        if (!ui.sheet) return;
        ui.sheet.classList.remove('open'); ui.scrim.classList.remove('open');
        ui.sheet.dataset.kind = '';
    }

    function openAdd(at) {
        var order = ['slider', 'banner', 'products', 'features', 'split', 'grid', 'text', 'marquee', 'nav', 'footer', 'spacer'];
        var PIC = { nav: '☰', slider: '⇆', banner: '▭', products: '▦', features: '✦', grid: '⊞', split: '◧', text: '¶', marquee: '≋', footer: '▁', spacer: '↕' };
        openSheet('add', '<div class="le-sh-h">Add a section</div><div class="le-types">' + order.map(function (t) {
            var T = V.TYPES[t];
            return '<button type="button" class="le-type" data-act="add-type" data-type="' + t + '"><i>' + PIC[t] + '</i><b>' + esc(T.name) + '</b><small>' + esc(T.desc) + '</small></button>';
        }).join('') + '</div>');
        ui.sheet.dataset.at = at;
    }

    function openTheme() {
        openSheet('theme', '<div class="le-sh-h">Store theme</div>' +
            '<div class="le-lbl">Template</div><div class="le-tpls">' + TEMPLATES.map(function (t) {
                return '<button type="button" class="le-tpl' + (theme.template === t[0] ? ' on' : '') + '" data-act="tpl" data-v="' + t[0] + '">' +
                    '<i style="background:' + t[3] + '"><em style="background:' + t[2] + '"></em></i><span>' + t[1] + '</span></button>';
            }).join('') + '</div>' +
            '<div class="le-lbl">Accent colour</div><div class="le-sw">' + ACCENTS.map(function (c) {
                return '<button type="button" class="le-swatch' + ((theme.accent || '') === c ? ' on' : '') + (c ? '' : ' le-auto') + '" data-act="accent" data-v="' + c + '"' +
                    (c ? ' style="background:' + c + '"' : '') + ' aria-label="' + (c || 'Template colour') + '">' + (c ? '' : 'A') + '</button>';
            }).join('') + '</div><p class="le-sh-note">Theme changes go live when you publish.</p>' +
            '<div class="le-lbl">Layout</div><button type="button" class="le-btn le-wide" data-act="reset-layout">Use the recommended layout</button>' +
            '<p class="le-sh-note">Hero slider by gender → pushed items slider → banner → all items. Replaces the current sections (Undo brings them back).</p>');
    }
    function applyTheme(t) {
        if (!t) return;
        var r = document.documentElement;
        if (t.template) r.setAttribute('data-store-template', t.template); else r.removeAttribute('data-store-template');
        if (t.accent) r.style.setProperty('--sf-accent', t.accent); else r.style.removeProperty('--sf-accent');
    }

    /* ----------------------------- settings ----------------------------- */
    var HEIGHT = [['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']];
    function seg(s, path, label, opts, num) {
        var v = getPath(s, path);
        return '<div class="le-f"><span>' + label + '</span><div class="le-seg">' + opts.map(function (o) {
            return '<button type="button" data-act="set" data-path="' + path + '" data-v="' + esc(o[0]) + '"' + (num ? ' data-num' : '') +
                (String(v) === String(o[0]) ? ' class="on"' : '') + '>' + esc(o[1]) + '</button>';
        }).join('') + '</div></div>';
    }
    function toggle(s, path, label) {
        var v = !!getPath(s, path);
        return '<label class="le-tg"><span>' + label + '</span><input type="checkbox" data-path="' + path + '"' + (v ? ' checked' : '') + '><i></i></label>';
    }
    function range(s, path, label, min, max, unit) {
        var v = getPath(s, path); if (v == null) v = min;
        return '<label class="le-f"><span>' + label + ' <em>' + v + unit + '</em></span><input type="range" min="' + min + '" max="' + max + '" value="' + v + '" data-path="' + path + '" data-unit="' + unit + '"></label>';
    }
    function pos(s, path, label) {
        var v = getPath(s, path);
        return '<div class="le-f"><span>' + label + '</span><div class="le-pos">' + ['tl', 'tc', 'tr', 'cl', 'cc', 'cr', 'bl', 'bc', 'br'].map(function (k) {
            return '<button type="button" data-act="set" data-path="' + path + '" data-v="' + k + '"' + (v === k ? ' class="on"' : '') + ' aria-label="' + k + '"><i></i></button>';
        }).join('') + '</div></div>';
    }
    function swatches(s, path, label) {
        var v = getPath(s, path) || '';
        return '<div class="le-f"><span>' + label + '</span><div class="le-sw">' + SWATCHES.map(function (c) {
            return '<button type="button" class="le-swatch' + (v === c ? ' on' : '') + (c ? '' : ' le-auto') + '" data-act="set" data-path="' + path + '" data-v="' + c + '"' +
                (c ? ' style="background:' + c + '"' : '') + ' aria-label="' + (c || 'Theme colour') + '">' + (c ? '' : 'A') + '</button>';
        }).join('') + '</div></div>';
    }
    function select(s, path, label, opts) {
        var v = String(getPath(s, path));
        return '<label class="le-f"><span>' + label + '</span><select data-path="' + path + '">' + opts.map(function (o) {
            return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
        }).join('') + '</select></label>';
    }
    function textIn(s, path, label, ph) {
        return '<label class="le-f"><span>' + label + '</span><input type="text" data-path="' + path + '" value="' + esc(getPath(s, path) || '') + '" placeholder="' + esc(ph || '') + '"></label>';
    }
    function imgRow(s, path, label) {
        var v = getPath(s, path);
        return '<div class="le-f"><span>' + label + '</span><div class="le-imgrow">' +
            '<button type="button" class="le-btn" data-act="img" data-sid="' + s.id + '" data-path="' + path + '">' + svg('cam') + (v ? 'Replace' : 'Upload') + '</button>' +
            (v ? '<button type="button" class="le-btn" data-act="img-clear" data-path="' + path + '">Remove</button>' : '') + '</div></div>';
    }
    function listHead(s, list, i, n, title) {
        return '<div class="le-sub-top"><b>' + title + '</b>' +
            '<button type="button" class="le-mini" data-act="list-up" data-list="' + list + '" data-i="' + i + '"' + (i ? '' : ' disabled') + ' aria-label="Move up">' + svg('up') + '</button>' +
            '<button type="button" class="le-mini" data-act="list-del" data-list="' + list + '" data-i="' + i + '"' + (n > 1 ? '' : ' disabled') + ' aria-label="Remove">' + svg('trash') + '</button></div>';
    }
    // Section ids a menu link can jump to.
    function linkTargets() {
        return sections.filter(function (x) { return x.type !== 'nav' && x.type !== 'spacer' && x.type !== 'marquee'; }).map(function (x) {
            var name = (V.TYPES[x.type] || {}).name || x.type;
            var label = x.title || (x.slides && x.slides[0] && x.slides[0].title) || name;
            var short = { products: 'Shop', footer: 'Contact', split: 'About', banner: 'Sale', slider: 'Home', features: 'Why us', text: 'Info', grid: 'Lookbook' }[x.type] || name;
            return [x.id, name + ' — ' + String(label).slice(0, 28), short];
        });
    }

    function settingsHTML(s) {
        var p = s.type, h = '';
        switch (p) {
            case 'nav':
                h += toggle(s, 'sticky', 'Stay at the top while scrolling') + '<div class="le-lbl">Menu links</div>';
                var tg = linkTargets();
                (s.links || []).forEach(function (l, i) {
                    h += '<div class="le-sub">' + listHead(s, 'links', i, s.links.length, 'Link ' + (i + 1)) +
                        textIn(s, 'links.' + i + '.label', 'Label') + select(s, 'links.' + i + '.to', 'Jumps to', tg) + '</div>';
                });
                h += '<button type="button" class="le-btn le-wide" data-act="list-add" data-list="links">' + svg('plus') + 'Add link</button>';
                break;
            case 'banner':
                h += imgRow(s, 'image', 'Picture') + seg(s, 'height', 'Height', HEIGHT) + pos(s, 'pos', 'Text position') +
                    seg(s, 'tone', 'Text colour', [['light', 'Light'], ['dark', 'Dark']]) + seg(s, 'width', 'Width', [['full', 'Edge to edge'], ['boxed', 'Boxed']]) +
                    range(s, 'overlay', 'Picture dimming', 0, 80, '%') + swatches(s, 'bg', 'Background when there is no picture');
                break;
            case 'slider':
                h += seg(s, 'style', 'Style', [['full', 'Full width'], ['cards', 'Cards']]) + seg(s, 'height', 'Height', HEIGHT) +
                    pos(s, 'pos', 'Text position') + toggle(s, 'autoplay', 'Slide automatically') +
                    range(s, 'interval', 'Seconds per slide', 2, 12, 's') + range(s, 'overlay', 'Picture dimming', 0, 80, '%') +
                    '<div class="le-lbl">Slides</div>';
                (s.slides || []).forEach(function (sl, i) {
                    h += '<div class="le-sub">' + listHead(s, 'slides', i, s.slides.length, 'Slide ' + (i + 1) + (sl.title ? ' · ' + esc(sl.title) : '')) +
                        imgRow(s, 'slides.' + i + '.image', 'Picture') +
                        select(s, 'slides.' + i + '.gender', 'Its button opens', V.GENDERS.map(function (g) { return [g[0], g[0] ? g[1] + '\'s items' : 'The items (no filter)']; })) + '</div>';
                });
                h += '<button type="button" class="le-btn le-wide" data-act="list-add" data-list="slides">' + svg('plus') + 'Add slide</button>' +
                    '<p class="le-sh-note">Tip: type on the slide itself to change its texts.</p>';
                break;
            case 'products':
                h += seg(s, 'filter', 'Which items', [['all', 'All'], ['promoted', 'Pushed'], ['women', 'Women'], ['men', 'Men'], ['kids', 'Kids']]) +
                    toggle(s, 'bare', 'No background behind the cards') +
                    seg(s, 'layout', 'Layout', [['grid', 'Grid'], ['feature', 'Featured'], ['carousel', 'Carousel'], ['list', 'List']]) +
                    (s.layout === 'grid' || s.layout === 'carousel' || !s.layout ? seg(s, 'cols', s.layout === 'carousel' ? 'Cards in view' : 'Columns', [[1, '1'], [2, '2'], [3, '3'], [4, '4']], true) : '') +
                    seg(s, 'sort', 'Order', [['default', 'Newest'], ['low', 'Price ↑'], ['high', 'Price ↓']]) +
                    seg(s, 'limit', 'How many', [[0, 'All'], [4, '4'], [6, '6'], [8, '8'], [12, '12']], true);
                if (s.filter === 'promoted') {
                    var mine = SF.products();
                    h += '<div class="le-lbl">Pushed items</div>' + (mine.length ? mine.map(function (pr, k) {
                        return '<label class="le-tg"><span>' + esc(pr.name) + ' · ' + V.nis(pr.price) + '</span><input type="checkbox" data-push="' + k + '"' +
                            (pr.promoted || pr.pushed ? ' checked' : '') + '><i></i></label>';
                    }).join('') + '<p class="le-sh-note">Pushing an item is saved right away.</p>' : '<p class="le-sh-note">Upload items first, then push the ones to feature here.</p>');
                }
                break;
            case 'features':
                h += seg(s, 'style', 'Style', [['plain', 'Plain'], ['boxed', 'Boxed']]) + '<div class="le-lbl">Highlights</div>';
                (s.items || []).forEach(function (it, i) {
                    h += '<div class="le-sub">' + listHead(s, 'items', i, s.items.length, 'Highlight ' + (i + 1)) + textIn(s, 'items.' + i + '.icon', 'Icon (any emoji or symbol)') + '</div>';
                });
                if ((s.items || []).length < 4) h += '<button type="button" class="le-btn le-wide" data-act="list-add" data-list="items">' + svg('plus') + 'Add highlight</button>';
                break;
            case 'grid':
                h += seg(s, 'cols', 'Columns', [[2, '2'], [3, '3'], [4, '4']], true) + range(s, 'gap', 'Gap', 0, 24, 'px') + '<div class="le-lbl">Tiles</div>';
                var prods = SF.products().map(function (pr, k) { return [k, pr.name]; });
                (s.cells || []).forEach(function (c, i) {
                    var pp = 'cells.' + i + '.';
                    h += '<div class="le-sub">' + listHead(s, 'cells', i, s.cells.length, 'Tile ' + (i + 1)) +
                        seg(s, pp + 'kind', 'Type', [['image', 'Picture'], ['product', 'Product'], ['color', 'Colour'], ['text', 'Text']]) +
                        '<div class="le-two">' + seg(s, pp + 'w', 'Width', [[1, '1'], [2, '2'], [3, '3'], [4, '4']].slice(0, s.cols || 3), true) +
                        seg(s, pp + 'h', 'Height', [[1, '1'], [2, '2'], [3, '3']], true) + '</div>' +
                        (c.kind === 'image' ? imgRow(s, pp + 'image', 'Picture') : '') +
                        (c.kind === 'product' ? (prods.length ? select(s, pp + 'product', 'Which item', prods) : '<p class="le-sh-note">Upload items to show them here.</p>') : '') +
                        (c.kind === 'color' ? swatches(s, pp + 'color', 'Colour') : '') + '</div>';
                });
                h += '<button type="button" class="le-btn le-wide" data-act="list-add" data-list="cells">' + svg('plus') + 'Add tile</button>';
                break;
            case 'split':
                h += imgRow(s, 'image', 'Picture') + seg(s, 'side', 'Picture side', [['left', 'Left'], ['right', 'Right'], ['top', 'Top']]);
                break;
            case 'text':
                h += seg(s, 'align', 'Alignment', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']]) + seg(s, 'size', 'Size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']]);
                break;
            case 'marquee':
                h += range(s, 'speed', 'Loop time (lower is faster)', 6, 60, 's') + toggle(s, 'invert', 'Accent background');
                break;
            case 'footer':
                h += toggle(s, 'dark', 'Dark background');
                break;
            case 'spacer':
                h += range(s, 'size', 'Height', 4, 160, 'px') + toggle(s, 'line', 'Show a divider line');
                break;
        }
        return h;
    }

    function openSettings(sid) {
        var s = byId(sid); if (!s) return;
        selId = sid;
        host.querySelectorAll('.le-sec').forEach(function (x) { x.classList.toggle('le-sel', x.getAttribute('data-sid') === sid); });
        openSheet('settings', '<div class="le-sh-h">' + esc((V.TYPES[s.type] || {}).name) + '</div>' +
            '<p class="le-sh-note">Texts are edited right on the page — tap them.</p>' + settingsHTML(s) +
            '<div class="le-sh-foot"><button type="button" class="le-btn" data-act="dup" data-sid="' + sid + '">' + svg('copy') + 'Duplicate</button>' +
            '<button type="button" class="le-btn le-danger" data-act="del" data-sid="' + sid + '">' + svg('trash') + 'Delete</button></div>');
        ui.sheet.dataset.sid = sid;
    }
    function refreshSettings() {
        if (ui.sheet && ui.sheet.dataset.kind === 'settings' && ui.sheet.classList.contains('open')) openSettings(ui.sheet.dataset.sid);
    }

    function listAdd(s, list) {
        if (!s) return;
        s[list] = s[list] || [];
        var item = { id: uid() };
        if (list === 'slides') Object.assign(item, { image: '', kicker: '', title: 'New slide', text: '', cta: '' });
        if (list === 'links') { var t = linkTargets()[0]; Object.assign(item, { label: 'Link', to: t ? t[0] : '' }); }
        if (list === 'items') Object.assign(item, { icon: '✦', title: 'New highlight', text: '' });
        if (list === 'cells') Object.assign(item, { w: 1, h: 1, kind: 'image', image: '', title: '', text: '' });
        s[list].push(item);
        commit(); paint(); refreshSettings();
        if (list === 'slides') showSlide(s.id, s.slides.length - 1);
    }

    // Inputs inside the settings sheet (text, range, select, checkbox).
    document.addEventListener('input', function (e) {
        var el = e.target;
        if (!active || !ui.sheet || !ui.sheet.contains(el) || !el.hasAttribute('data-path')) return;
        var s = byId(ui.sheet.dataset.sid); if (!s) return;
        var path = el.getAttribute('data-path');
        if (el.type === 'range') {
            setPath(s, path, Number(el.value));
            var em = el.parentElement.querySelector('em'); if (em) em.textContent = el.value + (el.getAttribute('data-unit') || '');
            paint();
        } else if (el.type === 'text') {
            setPath(s, path, el.value); paint();
        }
    });
    // Push / un-push one of the seller's items (written straight to vero_listings).
    document.addEventListener('change', function (e) {
        var el = e.target;
        if (!active || !el.hasAttribute || !el.hasAttribute('data-push')) return;
        var pr = SF.products()[Number(el.getAttribute('data-push'))]; if (!pr) return;
        pr.promoted = el.checked;
        if (pr.lid != null) {
            try {
                var L = JSON.parse(localStorage.getItem('vero_listings')) || [];
                if (L[pr.lid]) { L[pr.lid].promoted = el.checked; localStorage.setItem('vero_listings', JSON.stringify(L)); }
            } catch (err) {}
        }
        paint();
        toast(el.checked ? pr.name + ' is pushed' : pr.name + ' is no longer pushed');
    });
    document.addEventListener('change', function (e) {
        var el = e.target;
        if (el.hasAttribute && el.hasAttribute('data-push')) return;
        if (!active || !ui.sheet || !ui.sheet.contains(el) || !el.hasAttribute('data-path')) return;
        var s = byId(ui.sheet.dataset.sid); if (!s) return;
        var path = el.getAttribute('data-path');
        if (el.type === 'checkbox') setPath(s, path, el.checked);
        else if (el.tagName === 'SELECT') setPath(s, path, /^\d+$/.test(el.value) && /product$/.test(path) ? Number(el.value) : el.value);
        commit(); paint();
        if (el.tagName === 'SELECT' || el.type === 'checkbox') refreshSettings();
    });

    /* ------------------------------ header ------------------------------ */
    // The cover picture and the bio in the store's header are edited in place too.
    var bioEl = $('storeBio'), heroEl = $('hero'), coverChip = null;
    function editHero(on) {
        if (bioEl) {
            if (on) {
                bioEl.setAttribute('contenteditable', 'plaintext-only');
                if (bioEl.contentEditable !== 'plaintext-only') bioEl.setAttribute('contenteditable', 'true');
                bioEl.classList.add('le-txt', 'le-bio');
                bioEl.setAttribute('data-ph', 'Write a line about your shop');
            } else {
                bioEl.removeAttribute('contenteditable'); bioEl.classList.remove('le-txt', 'le-bio');
            }
        }
        if (heroEl) {
            if (on && !coverChip) {
                coverChip = document.createElement('button');
                coverChip.type = 'button'; coverChip.className = 'le-img le-cover le-ui'; coverChip.setAttribute('data-act', 'cover');
                coverChip.innerHTML = svg('cam') + '<span>Change cover</span>';
                heroEl.appendChild(coverChip);
            } else if (!on && coverChip) { coverChip.remove(); coverChip = null; }
        }
    }
    if (bioEl) {
        bioEl.addEventListener('input', function () {
            if (!active) return;
            heroDraft.bio = bioEl.innerText.replace(/\n+/g, ' ').trim();
            paintStatus();
        });
        bioEl.addEventListener('keydown', function (e) { if (active && e.key === 'Enter') { e.preventDefault(); bioEl.blur(); } });
    }
    function pickCover() {
        choose(function (blob) {
            heroDraft.coverBlob = blob;
            if (heroDraft.coverURL) URL.revokeObjectURL(heroDraft.coverURL);
            heroDraft.coverURL = URL.createObjectURL(blob);
            var u = 'url("' + heroDraft.coverURL + '")';
            if (heroEl) { heroEl.style.backgroundImage = u; var v = heroEl.querySelector('video.hero-video'); if (v) v.style.display = 'none'; }
            var bg = $('dnBg'); if (bg) bg.style.backgroundImage = u;
            paintStatus();
            toast('New cover — publish to keep it');
        });
    }

    window.addEventListener('beforeunload', function (e) {
        if (active && (heroDraft.coverBlob || heroDraft.bio != null)) { e.preventDefault(); e.returnValue = ''; }
    });

    if (qs.get('edit') === '1') enter();
    window.VeroLiveEdit = { enter: enter, leave: leave, isActive: function () { return active; } };
})();
