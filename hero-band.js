/* ------------------------------------------------------------------
   VERO — the hero band's height, dialled in by hand.

   Ctrl+Shift+H (or enableHeroBandEditing() in the console) turns the band on
   screen into a draggable object: grab the strip along its bottom edge and
   pull, or use the panel in the corner.

   ONE BAND AT A TIME. The height is written as --band-h on that page's own
   .acat-hero, so editing the cart moves the cart and nothing else — the
   category, the wishlist, the seller area and the buyer area all stay where
   they are. Each band's number is stored under its own key, so a reload holds
   all of them.

   The value is printed on every drop. Bake it into that band's own rule when
   it looks right:
     cart / wishlist   → the #cartHero / #wishlistHero rule in index.html
     everything else   → --hero-band-h in hero-box.css
   heroBandReset() drops the band on screen back to its stylesheet value.

   Usage — after hero-box.css, on any page that has an .acat-hero:
     <script src="hero-band.js"></script>
------------------------------------------------------------------ */

const HERO_BAND_MIN = 240, HERO_BAND_MAX = 900;
// Set by initHeroBandEditing() once the panel exists — it keeps the panel's
// readout in step with a drag or a call from the console.
let heroBandSync = () => {};

// The band being edited: the one on screen. Views are display:none until
// opened, so only ever one of them is visible.
function heroBandTarget() {
    return [...document.querySelectorAll('.acat-hero')]
        .find(el => el.offsetParent !== null) || null;
}

// Its name, for the readout and for its own storage key.
function heroBandName(band) {
    return band && (band.id || (band.closest('div[id]') || {}).id
        || document.body.dataset.page || location.pathname.split('/').pop() || 'hero');
}

function heroBandHeight(band = heroBandTarget()) {
    if (!band) return 0;
    return parseInt(getComputedStyle(band).getPropertyValue('--band-h'), 10) || 0;
}

function setHeroBandHeight(px, band = heroBandTarget()) {
    if (!band) return 0;
    const h = Math.max(HERO_BAND_MIN, Math.min(HERO_BAND_MAX, Math.round(px)));
    band.style.setProperty('--band-h', h + 'px');
    localStorage.setItem('veroBand:' + heroBandName(band), h);
    heroBandSync();
    return h;
}

function heroBandReset(band = heroBandTarget()) {
    if (!band) return 0;
    band.style.removeProperty('--band-h');
    localStorage.removeItem('veroBand:' + heroBandName(band));
    heroBandSync();
    console.log('[hero-band]', heroBandName(band), 'back to its stylesheet value:', heroBandHeight(band) + 'px');
    return heroBandHeight(band);
}

function enableHeroBandEditing(on = true) {
    document.body.classList.toggle('band-edit', on);
    const band = heroBandTarget();
    if (on) console.log('[hero-band] editing', heroBandName(band), '— drag the strip at the bottom of the band. Now:', heroBandHeight(band) + 'px');
    heroBandSync();
    return heroBandHeight(band);
}

(function initHeroBandEditing() {
    // The page's own <script> may run before this file; wait for the markup.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroBandEditing);
        return;
    }

    // Whatever each band was last dialled in to, restored band by band.
    document.querySelectorAll('.acat-hero').forEach(band => {
        const saved = parseInt(localStorage.getItem('veroBand:' + heroBandName(band)) || '', 10);
        if (saved) band.style.setProperty('--band-h', saved + 'px');
    });

    // The on-screen controls, so the height can be set without the console:
    // Ctrl+Shift+H toggles them. The arrows step by 10px, the readout is live.
    const panel = document.createElement('div');
    panel.className = 'hero-band-panel';
    panel.innerHTML = `
        <span class="hbp-name">BAND</span>
        <button type="button" data-step="-10" title="נמוך יותר">&minus;</button>
        <span class="hbp-val">—</span>
        <button type="button" data-step="10" title="גבוה יותר">+</button>
        <button type="button" class="hbp-reset">RESET</button>
        <button type="button" class="hbp-close">&times;</button>`;
    document.body.appendChild(panel);
    const readout = panel.querySelector('.hbp-val');
    const nameOut = panel.querySelector('.hbp-name');
    // The panel names the band it is pointed at, so it is never a guess which
    // page a drag is about to move.
    const sync = () => {
        const band = heroBandTarget();
        nameOut.textContent = (heroBandName(band) || 'band').toUpperCase();
        readout.textContent = heroBandHeight(band) + 'px';
    };
    panel.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.step) setHeroBandHeight(heroBandHeight() + Number(b.dataset.step));
        else if (b.classList.contains('hbp-reset')) heroBandReset();
        else enableHeroBandEditing(false);
        sync();
    });
    document.addEventListener('keydown', e => {
        if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h')) return;
        e.preventDefault();
        enableHeroBandEditing(!document.body.classList.contains('band-edit'));
    });
    heroBandSync = sync;
    sync();

    let drag = null;
    document.addEventListener('mousedown', e => {
        if (!document.body.classList.contains('band-edit')) return;
        const band = e.target.closest('.acat-hero');
        if (!band) return;
        // Only the grip strip along the bottom edge — the rest of the band stays
        // clickable so the slider still works while editing.
        const r = band.getBoundingClientRect();
        if (e.clientY < r.bottom - 34) return;   // the grip bar's own height
        // The band that was grabbed is the only one this drag touches.
        drag = { y: e.clientY, h: heroBandHeight(band), band };
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!drag) return;
        setHeroBandHeight(drag.h + (e.clientY - drag.y), drag.band);
    });
    document.addEventListener('mouseup', () => {
        if (!drag) return;
        console.log('[hero-band]', heroBandName(drag.band), '--band-h:', heroBandHeight(drag.band) + 'px');
        drag = null;
    });
})();
