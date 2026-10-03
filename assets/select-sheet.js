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

    function open(sel) {
        current = sel;
        var field = sel.closest('.pu-field');
        var lbl = field && field.querySelector('label');
        title.textContent = lbl ? lbl.textContent : '';
        list.innerHTML = '';
        Array.prototype.forEach.call(sel.options, function (o) {
            if (!o.value) return;   // the placeholder row
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'pu-pick-row' + (o.value === sel.value ? ' on' : '');
            b.setAttribute('role', 'option');
            b.setAttribute('aria-selected', o.value === sel.value ? 'true' : 'false');
            b.innerHTML = '<span></span>' + TICK;
            b.firstChild.textContent = o.textContent;
            b.addEventListener('click', function () {
                if (sel.value !== o.value) {
                    sel.value = o.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                }
                close();
            });
            list.appendChild(b);
        });
        sheet.hidden = false;
        requestAnimationFrame(function () { sheet.classList.add('on'); });
        var on = list.querySelector('.on') || list.firstChild;
        if (on) { on.scrollIntoView({ block: 'nearest' }); on.focus({ preventScroll: true }); }
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
