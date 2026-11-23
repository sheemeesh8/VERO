/* ------------------------------------------------------------------
   moravchick — in the list-an-item flow a <select> opens our own bottom
   sheet instead of the phone's system picker. The <select> stays in the
   page as the value holder: picking a row sets its value and fires
   `change`, so the flow's own bindings run unchanged.
   (Styles in upload-flow.css.)
------------------------------------------------------------------ */
(function () {
    'use strict';
    var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

    var sheet = document.createElement('div');
    sheet.className = 'pu-pick';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.hidden = true;
    sheet.innerHTML = '<div class="pu-pick-box"><div class="pu-pick-grab"></div>' +
        '<p class="pu-pick-t"></p><div class="pu-pick-list" role="listbox"></div></div>';
    document.body.appendChild(sheet);
    var title = sheet.querySelector('.pu-pick-t');
    var list = sheet.querySelector('.pu-pick-list');
    var current = null;

    var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    var BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

    function pick(sel, value) {
        if (sel.value !== value) {
            sel.value = value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        close();
    }
    function optionRow(sel, o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pu-pick-row' + (o.value === sel.value ? ' on' : '');
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', o.value === sel.value ? 'true' : 'false');
        b.innerHTML = '<span></span>' + TICK;
        b.firstChild.textContent = o.textContent;
        b.addEventListener('click', function () { pick(sel, o.value); });
        return b;
    }
    function slideIn(dir) {
        list.classList.remove('in-l', 'in-r');
        void list.offsetWidth;
        list.classList.add(dir === 'back' ? 'in-l' : 'in-r');
        list.scrollTop = 0;
    }
    function focusOn() {
        var on = list.querySelector('.on') || list.querySelector('.pu-pick-row');
        if (on) { on.scrollIntoView({ block: 'nearest' }); on.focus({ preventScroll: true }); }
    }

    // Grouped selects open like My Sizes in the personal area: first a row per
    // category (with a chevron and what's chosen in it), then — slid in — that
    // category's own options, with a back arrow to the categories.
    function showGroups(sel, dir) {
        list.innerHTML = '';
        Array.prototype.forEach.call(sel.querySelectorAll('optgroup'), function (g) {
            var opts = Array.prototype.filter.call(g.querySelectorAll('option'), function (o) { return o.value; });
            if (!opts.length) return;
            var chosen = opts.filter(function (o) { return o.value === sel.value; })[0];
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'pu-pick-row pu-pick-cat' + (chosen ? ' on' : '');
            b.innerHTML = '<span class="pu-pick-cat-main"><span class="pu-pick-cat-name"></span><span class="pu-pick-cat-val"></span></span>' + CHEV;
            b.querySelector('.pu-pick-cat-name').textContent = g.label;
            b.querySelector('.pu-pick-cat-val').textContent = chosen ? chosen.textContent
                : opts.slice(0, 3).map(function (o) { return o.textContent; }).join(', ') + (opts.length > 3 ? '…' : '');
            b.addEventListener('click', function () {
                if (opts.length === 1) return pick(sel, opts[0].value);   // nothing to choose between
                showGroup(sel, g);
            });
            list.appendChild(b);
        });
        if (dir) slideIn(dir);
        focusOn();
    }
    function showGroup(sel, g) {
        list.innerHTML = '';
        var head = document.createElement('button');
        head.type = 'button';
        head.className = 'pu-pick-back';
        head.innerHTML = BACK + '<span></span>';
        head.lastChild.textContent = g.label;
        head.setAttribute('aria-label', 'Back to all categories');
        head.addEventListener('click', function () { showGroups(sel, 'back'); });
        list.appendChild(head);
        Array.prototype.forEach.call(g.querySelectorAll('option'), function (o) {
            if (o.value) list.appendChild(optionRow(sel, o));
        });
        slideIn('fwd');
        focusOn();
    }

    function open(sel) {
        current = sel;
        var field = sel.closest('.pu-field');
        var lbl = field && field.querySelector('label');
        title.textContent = lbl ? lbl.textContent : '';
        list.classList.remove('in-l', 'in-r');
        if (sel.querySelector('optgroup')) {
            showGroups(sel);
        } else {
            list.innerHTML = '';
            Array.prototype.forEach.call(sel.options, function (o) {
                if (o.value) list.appendChild(optionRow(sel, o));   // skip the placeholder row
            });
        }
        sheet.hidden = false;
        requestAnimationFrame(function () { sheet.classList.add('on'); });
        focusOn();
    }
    function close() {
        sheet.classList.remove('on');
        setTimeout(function () { sheet.hidden = true; }, 250);
        if (current) current.focus({ preventScroll: true });
        current = null;
    }
    sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });

    document.querySelectorAll('select.pu-select').forEach(function (sel) {
        // The select itself never takes the tap (that would open the system
        // picker); its wrapper does, and opens the sheet.
        var wrap = sel.parentElement;
        wrap.classList.add('pu-pick-field');
        wrap.addEventListener('click', function () { open(sel); });
        sel.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault(); open(sel);
            }
        });
    });
})();
