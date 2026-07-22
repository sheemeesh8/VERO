/* ------------------------------------------------------------------
   VERO — the product cut-out.

   A photographed piece arrives on whatever the seller had behind it: a bed, a
   floor, a room. The card is one object across the whole site, so the pieces
   have to sit on one ground. This lifts the product off its background and
   drops it on the site's off-white, once, at upload time — never while a card
   is being drawn, so the feed stays fast.

   The work is done in the seller's own browser by @imgly/background-removal
   (ONNX, runs on WASM). Nothing is uploaded anywhere and no key is needed. The
   model is ~5MB and is fetched from a CDN the first time it runs, then cached
   by the browser; the first cut-out on a cold cache takes a few seconds, the
   ones after are quick.

   If the model can't be reached — offline, blocked CDN — the original photo is
   kept and used as-is. A listing never fails because a cut-out failed.

   Usage:
     <script src="cutout.js"></script>
     const out = await veroCutout(fileOrDataUrl, { onStatus: msg => ... });
     // out.image  — the cut-out on the site's ground, as a data URL
     // out.ok     — false if it fell back to the original
------------------------------------------------------------------ */

/* The ground the pieces stand on: off-white, a touch grey, so a white shirt
   still reads as an object. Same value as the card's own field. */
const VERO_CUTOUT_BG = '#f1efea';

/* The square every product ends up in, so the grid never has to crop. */
const VERO_CUTOUT_SIZE = 1000;
/* Air around the piece, as a share of the square. */
const VERO_CUTOUT_PAD = 0.06;

/* A cut-out that never returns is worse than no cut-out: the seller sits on a
   slot that says "removing background" for as long as they are willing to wait.
   A blocked CDN hangs rather than fails, so the whole thing is on a clock. */
const VERO_CUTOUT_TIMEOUT = 45000;

function veroCutoutDeadline(promise, ms = VERO_CUTOUT_TIMEOUT) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('cut-out timed out')), ms))
    ]);
}

let veroCutoutLib = null;

// One import, the first time a seller uploads. Kept out of page load so the
// site does not pay 5MB for visitors who never list anything.
async function veroCutoutLoad() {
    if (veroCutoutLib) return veroCutoutLib;
    veroCutoutLib = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm');
    return veroCutoutLib;
}

function veroCutoutToBlob(src) {
    if (src instanceof Blob) return Promise.resolve(src);
    return fetch(src).then(r => r.blob());   // a data: URL is fetchable
}

function veroCutoutLoadImage(blobOrUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = blobOrUrl instanceof Blob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
    });
}

/* Trim the transparent margin the cut-out leaves, then centre what's left in a
   square on the site's ground. Without the trim a piece shot from far away
   stays a speck in the middle of its card. */
function veroCutoutCompose(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const scan = document.createElement('canvas');
    scan.width = w; scan.height = h;
    const sctx = scan.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);

    const data = sctx.getImageData(0, 0, w, h).data;
    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // Anything but near-transparent counts as the product.
            if (data[(y * w + x) * 4 + 3] > 12) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }
    // Nothing survived the cut — treat it as a failure and keep the original.
    if (right < 0) return null;

    const cw = right - left + 1, ch = bottom - top + 1;
    const out = document.createElement('canvas');
    out.width = out.height = VERO_CUTOUT_SIZE;
    const ctx = out.getContext('2d');
    ctx.fillStyle = VERO_CUTOUT_BG;
    ctx.fillRect(0, 0, VERO_CUTOUT_SIZE, VERO_CUTOUT_SIZE);

    const box = VERO_CUTOUT_SIZE * (1 - VERO_CUTOUT_PAD * 2);
    const scale = Math.min(box / cw, box / ch);
    const dw = cw * scale, dh = ch * scale;
    ctx.drawImage(img, left, top, cw, ch,
        (VERO_CUTOUT_SIZE - dw) / 2, (VERO_CUTOUT_SIZE - dh) / 2, dw, dh);

    return out.toDataURL('image/jpeg', 0.92);
}

async function veroCutout(src, opts = {}) {
    const say = opts.onStatus || (() => {});
    const original = src instanceof Blob ? await veroCutoutBlobToDataUrl(src) : src;
    try {
        say('טוען מנוע…');
        const lib = await veroCutoutDeadline(veroCutoutLoad());
        say('מסיר רקע…');
        const blob = await veroCutoutToBlob(src);
        const cut = await veroCutoutDeadline(lib.removeBackground(blob));
        const img = await veroCutoutLoadImage(cut);
        const composed = veroCutoutCompose(img);
        if (!composed) throw new Error('empty cut-out');
        say('');
        return { ok: true, image: composed, original };
    } catch (err) {
        // Offline, a blocked CDN, or a photo the model found nothing in. The
        // listing goes on with the photograph as it was taken.
        console.warn('[cutout] keeping the original photo:', err);
        say('');
        return { ok: false, image: original, original, error: err };
    }
}

function veroCutoutBlobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve(e.target.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}
