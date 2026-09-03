/* ------------------------------------------------------------------
   moravchick — Studio Background Engine (FEATURE 1, native / in-browser).

   Takes a seller's photo, lifts the subject off its background, and drops it
   onto a standardised editorial studio canvas: soft off-white ground, ~15%
   air on every side, and a subtle contact shadow under the piece. The result
   is a clean "cover" that reads the same across the whole catalogue.

   This runs entirely in the seller's browser (no server, no API key), reusing
   the same @imgly/background-removal model that cutout.js uses — so the two
   features share one download and one cache. If the model can't be reached,
   the pipeline keeps the original photo and reports ok:false, exactly like the
   cut-out: a listing never fails because segmentation failed.

   A Node/Python + Photoroom/Remove.bg version of this same pipeline (matching
   the original spec) lives standalone under /studio-engine — see its README.

   Usage:
     <script src="studio.js"></script>
     const cover = await veroStudioCover(fileOrDataUrl, {
        ratio: '4:5',                 // '4:5' (default) or '1:1'
        onStatus: msg => badge(msg),
     });
     // cover.processed_cover — studio render, data URL (or null on failure)
     // cover.original_cover  — the photo as uploaded, data URL
     // cover.ok              — false if it fell back to the original
------------------------------------------------------------------ */

/* Standardised, high-res cover canvases. */
const VERO_STUDIO_SIZES = {
    '4:5': { w: 1080, h: 1350 },
    '1:1': { w: 1200, h: 1200 },
};
/* Editorial soft off-white ground. */
const VERO_STUDIO_BG = '#F4F4F2';
/* Air around the subject, as a share of the shorter canvas edge. */
const VERO_STUDIO_PAD = 0.15;
/* Subtle contact shadow under the piece. */
const VERO_STUDIO_SHADOW = { color: 'rgba(0,0,0,0.18)', blur: 18, y: 12 };
/* A model that never returns is worse than none — the whole thing is on a clock. */
const VERO_STUDIO_TIMEOUT = 45000;

function veroStudioDeadline(promise, ms = VERO_STUDIO_TIMEOUT) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('studio render timed out')), ms)),
    ]);
}

/* Reuse cutout.js's loader when it's on the page, so the ~5MB model is fetched
   and cached once; fall back to importing it here if studio.js is used alone. */
let _veroStudioLib = null;
async function veroStudioLoadLib() {
    if (typeof veroCutoutLoad === 'function') return veroCutoutLoad();
    if (_veroStudioLib) return _veroStudioLib;
    _veroStudioLib = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm');
    return _veroStudioLib;
}

function veroStudioToBlob(src) {
    if (src instanceof Blob) return Promise.resolve(src);
    return fetch(src).then(r => r.blob());   // a data: URL is fetchable
}

function veroStudioBlobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve(e.target.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

function veroStudioLoadImage(blobOrUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = blobOrUrl instanceof Blob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
    });
}

/* Find the subject's bounding box inside a transparent cut-out, so a piece shot
   from far away is scaled to fill the frame rather than left a speck. */
function veroStudioTrim(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const scan = document.createElement('canvas');
    scan.width = w; scan.height = h;
    const sctx = scan.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    const data = sctx.getImageData(0, 0, w, h).data;
    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 12) {   // anything not near-transparent
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }
    if (right < 0) return null;                       // nothing survived the cut
    return { left, top, w: right - left + 1, h: bottom - top + 1 };
}

/* Compose the trimmed subject onto the studio canvas: off-white ground, 15%
   padding, centred, with the contact shadow baked underneath. */
function veroStudioCompose(cutImg, ratio = '4:5') {
    const size = VERO_STUDIO_SIZES[ratio] || VERO_STUDIO_SIZES['4:5'];
    const box = veroStudioTrim(cutImg);
    if (!box) return null;

    const canvas = document.createElement('canvas');
    canvas.width = size.w; canvas.height = size.h;
    const ctx = canvas.getContext('2d');

    // Editorial off-white ground.
    ctx.fillStyle = VERO_STUDIO_BG;
    ctx.fillRect(0, 0, size.w, size.h);

    // Fit the subject inside the padded frame, keeping its aspect ratio.
    const pad = Math.min(size.w, size.h) * VERO_STUDIO_PAD;
    const innerW = size.w - pad * 2, innerH = size.h - pad * 2;
    const scale = Math.min(innerW / box.w, innerH / box.h);
    const dw = box.w * scale, dh = box.h * scale;
    const dx = (size.w - dw) / 2, dy = (size.h - dh) / 2;

    // Subtle contact shadow: a single blurred, offset copy of the subject's
    // silhouette, drawn once so it never doubles up.
    ctx.save();
    ctx.shadowColor = VERO_STUDIO_SHADOW.color;
    ctx.shadowBlur = VERO_STUDIO_SHADOW.blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = VERO_STUDIO_SHADOW.y;
    ctx.drawImage(cutImg, box.left, box.top, box.w, box.h, dx, dy, dw, dh);
    ctx.restore();

    // JPEG: the cover has a solid ground, so there is no alpha to preserve and
    // the file stays small.
    return canvas.toDataURL('image/jpeg', 0.92);
}

/* The full pipeline: original photo in, studio cover + original out. */
async function veroStudioCover(src, opts = {}) {
    const say = opts.onStatus || (() => {});
    const ratio = opts.ratio || '4:5';
    const original_cover = src instanceof Blob ? await veroStudioBlobToDataUrl(src) : src;
    try {
        say('טוען מנוע…');
        const lib = await veroStudioDeadline(veroStudioLoadLib());
        say('מסיר רקע…');
        const blob = await veroStudioToBlob(src);
        const cut = await veroStudioDeadline(lib.removeBackground(blob));
        say('מרכיב סטודיו…');
        const cutImg = await veroStudioLoadImage(cut);
        const processed_cover = veroStudioCompose(cutImg, ratio);
        if (!processed_cover) throw new Error('empty studio render');
        say('');
        return { ok: true, processed_cover, original_cover };
    } catch (err) {
        console.warn('[studio] keeping the original photo:', err);
        say('');
        return { ok: false, processed_cover: null, original_cover, error: err };
    }
}

// Expose for callers that already hold a transparent cut-out and only need the
// studio composition (e.g. to avoid running the model twice).
window.veroStudioCover = veroStudioCover;
window.veroStudioCompose = veroStudioCompose;
