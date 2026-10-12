/* ------------------------------------------------------------------
   moravchick — line icons in place of emoji placeholders.

   Items without a photo, chat avatars, season badges etc. carry an emoji
   (p.icon = '👗'). Rendered as-is they look like a chat app, not a fashion
   house, and differ per device. This swaps any element text that is a single
   known emoji for a thin monochrome line icon that inherits the text colour
   and size (1em), so it slots into the existing layout unchanged.

   Data is untouched (p.icon stays '👗'); only the rendering changes. A
   MutationObserver keeps up with content the pages render later.
------------------------------------------------------------------ */
(function () {
    var P = {
        shirt:  '<path d="M8.5 3 3.5 6l2 4 2-1v12h9V9l2 1 2-4-5-3c0 1.6-1.4 2.8-3.5 2.8S8.5 4.6 8.5 3z"/>',
        dress:  '<path d="M9.5 2.5h5l-1 4.5 4.5 14h-12l4.5-14z"/><path d="M10.2 7h3.6"/>',
        pants:  '<path d="M6.5 3h11l1 18h-4.5L12 10l-2 11H5.5z"/><path d="M6.4 6.5h11.2"/>',
        jacket: '<path d="M8.5 3 4 5.5 3.2 21h7.3V11.5L12 13.5l1.5-2V21h7.3L20 5.5 15.5 3 12 8z"/><path d="m8.5 3 2 8.5M15.5 3l-2 8.5"/>',
        shoe:   '<path d="M2.5 15.5V19h19v-1.6c0-1.5-1-2.5-3-2.9l-5-1-3.2-3.8H8.6l-1 1.8H5.2L3.4 10z"/><path d="M2.5 16h19"/>',
        heel:   '<path d="M3 17c3 0 5.5-1.6 7.6-4.3L14 8c1-1.3 2.6-1 3.2.4L21 17v2h-4l-2.2-5.2"/><path d="M3 17v2h7"/><path d="M5 19v2"/>',
        bag:    '<path d="M5 8.5h14L18 21H6z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
        hat:    '<ellipse cx="12" cy="17" rx="10" ry="3"/><path d="M6.5 15.6V11a5.5 5.5 0 0 1 11 0v4.6"/>',
        watch:  '<circle cx="12" cy="12" r="5"/><path d="M9.2 7.8 10 3h4l.8 4.8M9.2 16.2 10 21h4l.8-4.8M12 10v2l1.4 1"/>',
        glasses:'<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M3.5 14 2.5 8M20.5 14l1-6"/>',
        scarf:  '<path d="M7 3h10v6l-2 2v10h-4v-8L7 9z"/><path d="M11 15h4M11 18h4"/>',
        ring:   '<circle cx="12" cy="15" r="6"/><path d="m9.5 6 2.5-3 2.5 3-2.5 3z"/>',
        art:    '<rect x="3" y="4.5" width="18" height="15" rx=".5"/><path d="m3 16 5-5 4.5 4.5 3-3L21 18"/><circle cx="15.5" cy="9" r="1.3"/>',
        vase:   '<path d="M9.5 3h5M10.2 3v3.2C7.4 7.4 6 10 6 13c0 4.4 2.7 8 6 8s6-3.6 6-8c0-3-1.4-5.6-4.2-6.8V3"/>',
        sofa:   '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M2.5 12.5a2 2 0 0 1 4 0V15h11v-2.5a2 2 0 0 1 4 0V19h-19z"/><path d="M5 19v2M19 19v2"/>',
        chat:   '<path d="M4 5h16v11H9.5L5 20v-4H4z"/>',
        user:   '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
        store:  '<path d="M3 9 5 4h14l2 5M4 9v11h16V9M3 9h18M9.5 20v-6h5v6"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
        leaf:   '<path d="M5 19C5 10.5 10.5 5 20 4c-1 9.5-6.5 15-15 15z"/><path d="m5 19 8-8"/>',
        flower: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10 6 10.6 3 12 3s2 3 0 6.8zM12 14.2c2 3.8 1.4 6.8 0 6.8s-2-3 0-6.8zM9.8 12C6 14 3 13.4 3 12s3-2 6.8 0zM14.2 12c3.8-2 6.8-1.4 6.8 0s-3 2-6.8 0z"/>',
        sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
        snow:   '<path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.5 4 12 6l2.5-2M9.5 20l2.5-2 2.5 2"/>',
        heart:  '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
        calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
        camera: '<path d="M3 8h4l1.8-2.5h6.4L17 8h4v11.5H3z"/><circle cx="12" cy="13.5" r="3.5"/>',
        award:  '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.3-1.5 7.7 5-2.5 5 2.5-1.5-7.7"/>',
        bolt:   '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
        cash:   '<rect x="2.5" y="6.5" width="19" height="11" rx="1"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
        card:   '<rect x="2.5" y="5.5" width="19" height="13" rx="1.5"/><path d="M2.5 10h19M6 15h4"/>',
        bank:   '<path d="M3 9.5 12 4l9 5.5M4.5 20h15M6 10.5V18M10 10.5V18M14 10.5V18M18 10.5V18"/>',
        pin:    '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
        ruler:  '<path d="m3 16.5 13.5-13.5 4.5 4.5L7.5 21z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
        clock:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        megaphone:'<path d="M3.5 10v4h3l9 5V5l-9 5z"/><path d="M8 14.5 9.5 20h2.5l-1-4.4M19 9.5a3.5 3.5 0 0 1 0 5"/>',
        eye:    '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
        plus:   '<path d="M12 5v14M5 12h14"/>',
        bulb:   '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
        tag:    '<path d="M3 12V3.5h8.5l9 9-8.5 8.5z"/><circle cx="7.5" cy="8" r="1.3"/>',
        note:   '<path d="M5 3.5h10l4 4v13H5z"/><path d="M15 3.5v4h4M8.5 12h7M8.5 15.5h7"/>',
        hanger: '<path d="M12 8.5V8c0-1.3 2-1.7 2-3.2a2 2 0 1 0-4 0"/><path d="M12 8.5 2.5 16h19z"/>'
    };
    var MAP = {
        shirt:  '👕👔👚🎽🥻',
        dress:  '👗👘👙',
        pants:  '👖🩳🩲',
        jacket: '🧥🥼🦺',
        shoe:   '👟👞🥾🩴🛼',
        heel:   '👠👡👢',
        bag:    '👜👝🎒🛍💼🧳👛',
        hat:    '👒🎩🧢⛑',
        watch:  '⌚⏱',
        glasses:'👓🕶🥽',
        scarf:  '🧣🧤🧦🧶🧵',
        ring:   '💍💎📿',
        art:    '🎨🖼🖌🏔🌫💧⚙',
        vase:   '🏺🗿⚱🪴',
        sofa:   '🛋🪑🛏',
        chat:   '💬🗨',
        user:   '🧑👤👩👨',
        store:  '🏬🏪🏛',
        search: '🔎🔍',
        leaf:   '🍂🍁🌿',
        flower: '🌸🌷🌺',
        sun:    '☀🌞',
        snow:   '❄⛄',
        heart:  '❤🤍🖤',
        calendar:'🗓📅📆',
        camera: '📷📸',
        award:  '🏅🏆🎖',
        bolt:   '⚡',
        cash:   '💵💰',
        card:   '💳',
        bank:   '🏦',
        pin:    '📍',
        ruler:  '📏',
        clock:  '🕒🕐⏰',
        megaphone:'📣📢',
        eye:    '👁',
        plus:   '➕',
        bulb:   '💡',
        tag:    '🏷',
        note:   '📝'
    };
    var LOOKUP = {};
    Object.keys(MAP).forEach(function (k) {
        Array.from(MAP[k]).forEach(function (ch) { LOOKUP[ch] = k; });
    });

    // A whole text node that is one emoji (optionally with VS16 / ZWJ parts).
    var LONE = /^\s*(\p{Extended_Pictographic})(?:️|‍\p{Extended_Pictographic}️?)*\s*$/u;
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, SELECT: 1, TITLE: 1, NOSCRIPT: 1 };

    var st = document.createElement('style');
    st.textContent =
        '.vli{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;line-height:0;}' +
        '.vli svg{width:100%;height:100%;display:block;fill:none;stroke:currentColor;' +
        ' stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;opacity:.72;}';
    (document.head || document.documentElement).appendChild(st);

    function iconFor(text) {
        var m = text.match(LONE);
        return m ? LOOKUP[m[1]] : null;
    }

    function swap(node) {
        var key = iconFor(node.nodeValue);
        if (!key) return;
        var p = node.parentNode;
        if (!p || SKIP[p.nodeName] || p.isContentEditable) return;
        var span = document.createElement('span');
        span.className = 'vli';
        span.setAttribute('aria-hidden', 'true');
        span.innerHTML = '<svg viewBox="0 0 24 24">' + P[key] + '</svg>';
        p.replaceChild(span, node);
    }

    function scan(root) {
        if (!root) return;
        if (root.nodeType === 3) { swap(root); return; }
        if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
        while ((n = w.nextNode())) if (n.nodeValue.trim().length <= 12) list.push(n);
        list.forEach(swap);
    }

    var queued = [], pending = false;
    function flush() {
        pending = false;
        var q = queued; queued = [];
        q.forEach(scan);
    }
    function run() {
        scan(document.body);
        new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                if (m.type === 'characterData') queued.push(m.target);
                else m.addedNodes.forEach(function (n) { queued.push(n); });
            });
            if (!pending) { pending = true; requestAnimationFrame(flush); }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
