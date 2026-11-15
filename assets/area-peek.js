/* ============================================================================
   area-peek.js — the hero of the seller area and the personal area is a peek
   at the public page (storefront / profile): next to the name and the figures
   it shows where the shop is and its social links, the way a visitor sees them.

     veroHeroMeta(el, { location: 'Tel Aviv', socials: { instagram: '…', … } })

   Fills `el` with a location line (only when there is one) and a row of
   social icons (only the networks that are filled in). Nothing to show → the
   element is hidden. Also runs the hero's Follow button (.ah-follow), a preview.
   Styles: assets/area.css (.ah-meta, .ah-follow …).
   ========================================================================== */
(function (global) {
    'use strict';
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var NETS = {
        instagram: { name: 'Instagram', base: 'https://instagram.com/',
                     icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="0.6"/>' },
        tiktok:    { name: 'TikTok', base: 'https://tiktok.com/@',
                     icon: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2 4.300 5 4.600"/>' },
        facebook:  { name: 'Facebook', base: 'https://facebook.com/',
                     icon: '<path d="M14.500 8.500V7a1.500 1.500 0 0 1 1.500-1.500h1.500V2.500H15A4 4 0 0 0 11 6.500v2H8.500v3H11v10h3.500v-10h2.600l.4-3z"/>' },
        website:   { name: 'Website', base: 'https://',
                     icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.600 2.500 4 5.500 4 9s-1.400 6.500-4 9c-2.600-2.500-4-5.500-4-9s1.400-6.500 4-9z"/>' }
    };
    var PIN = '<path d="M12 21s-7-6.200-7-11.500a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>';
    var svg = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };

    // A full link stays as typed; a bare handle (@name / name) goes on the network's address.
    function link(key, raw) {
        var v = String(raw || '').trim(); if (!v) return '';
        if (/^https?:\/\//i.test(v)) return v;
        if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return 'https://' + v;         // typed without the scheme
        return NETS[key].base + encodeURIComponent(v.replace(/^@/, ''));
    }

    global.veroHeroMeta = function (el, o) {
        if (!el) return;
        o = o || {};
        var loc = String(o.location || '').trim(), soc = o.socials || {};
        var icons = Object.keys(NETS).map(function (k) {
            var url = link(k, soc[k]);
            return url ? '<a class="ah-soc-a" href="' + esc(url) + '" target="_blank" rel="noopener" aria-label="' + NETS[k].name + '">' + svg(NETS[k].icon) + '</a>' : '';
        }).join('');
        el.innerHTML = (loc ? '<span class="ah-loc">' + svg(PIN) + '<span>' + esc(loc) + '</span></span>' : '') +
                       (icons ? '<span class="ah-soc">' + icons + '</span>' : '');
        el.hidden = !(loc || icons);
    };

    // The Follow button on the hero is a preview of what a visitor gets: it flips
    // between Follow and Following so the owner sees both, and changes no data
    // (nobody follows their own page).
    document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.ah-follow'); if (!b) return;
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? 'Following' : 'Follow';
    });
})(window);
