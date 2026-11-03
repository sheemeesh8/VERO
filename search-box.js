/* ============================================================================
 * search-box.js — upgrades every search field on the page to the shared
 * animated search component (see search-box.css). WhatsApp-style: the
 * magnifier rotates into a green arrow while typing, and a round clear button
 * appears to empty the field.
 *
 * It wraps each search input in a .usearch host, adds the swap icon + clear
 * button, toggles .has-value as the user types, and hides the field's original
 * static search icon. A MutationObserver re-runs for inputs injected later
 * (the header search page, the JS-rendered hero search, etc.).
 * ==========================================================================*/
(function () {
    'use strict';

    var SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    var ARROW_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><polyline points="13 5 20 12 13 19"></polyline></svg>';
    var CLOSE_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>';

    function isSearchField(el) {
        if (!el || el.tagName !== 'INPUT') return false;
        if (el.dataset.usearch) return false;                 // already done
        var type = (el.getAttribute('type') || 'text').toLowerCase();
        if (type === 'search') return true;
        if (type !== 'text') return false;                    // never touch password/number/etc.
        var ph = el.getAttribute('placeholder') || '';
        if (/search|חיפוש|חפש/i.test(ph)) return true;
        return !!el.closest('[role="search"]');
    }

    function syncValue(wrap, input) {
        if (input.value && input.value.length) wrap.classList.add('has-value');
        else wrap.classList.remove('has-value');
    }

    function upgrade(input) {
        if (input.dataset.usearch) return;
        var host = input.parentElement;
        if (!host) return;
        input.dataset.usearch = 'done';

        // Use the input's own parent as the positioning host.
        host.classList.add('usearch');

        // Hide any pre-existing static search icon so ours is the only one.
        [].forEach.call(host.children, function (c) {
            if (c !== input && c.tagName === 'svg') c.classList.add('usearch-legacy-hide');
            // some fields wrap the icon in a span/i
            if (c !== input && c !== null && c.querySelector && c.querySelector('svg') &&
                !c.classList.contains('usearch-icon') && !c.classList.contains('usearch-close')) {
                c.classList.add('usearch-legacy-hide');
            }
        });

        // Swap icon (search <-> arrow).
        var icon = document.createElement('span');
        icon.className = 'usearch-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<span class="swap-on" style="display:flex">' + SEARCH_SVG + '</span>' +
                         '<span class="swap-off" style="display:flex">' + ARROW_SVG + '</span>';

        // Clear button.
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'usearch-close';
        close.setAttribute('aria-label', 'Clear search');
        close.innerHTML = CLOSE_SVG;
        close.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            syncValue(host, input);
            input.focus();
        });

        // Icon/close must come AFTER the input for the CSS sibling rules.
        host.appendChild(icon);
        host.appendChild(close);

        input.addEventListener('input', function () { syncValue(host, input); });
        input.addEventListener('change', function () { syncValue(host, input); });
        syncValue(host, input);
    }

    function scan(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var inputs = scope.querySelectorAll('input');
        [].forEach.call(inputs, function (el) { if (isSearchField(el)) upgrade(el); });
    }

    // Expose so dynamically-built UIs (e.g. the header search page) can refresh.
    window.veroUpgradeSearch = scan;

    function start() {
        scan(document);
        var obs = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var nodes = muts[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                    var n = nodes[j];
                    if (n.nodeType !== 1) continue;
                    if (n.tagName === 'INPUT' && isSearchField(n)) upgrade(n);
                    else if (n.querySelectorAll) scan(n);
                }
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
