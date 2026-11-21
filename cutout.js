/* ------------------------------------------------------------------
   moravchick — the product cut-out.

   A photographed piece arrives on whatever the seller had behind it: a bed, a
   floor, a room. The card is one object across the whole site, so the pieces
   have to sit on one ground. This lifts the product off its background, once,
   at upload time — never while a card is being drawn, so the feed stays fast.

   The work is done in the seller's own browser by @imgly/background-removal
   (ONNX, runs on WASM in a worker). Nothing is uploaded anywhere and no key is
   needed.

   Speed. The engine is ~45MB (the "small" model, ~44MB, plus a ~10MB runtime).
   Waiting for that only after the seller picks a photo is what made the first
   cut-out crawl, so:
     • veroCutoutWarm() fetches exactly those files in the background as soon
       as the upload flow opens; by the time a photo is chosen they are cached.
     • The files are kept in Cache Storage (versioned), so each device
       downloads them once — later listings start the cut straight away.
     • The photo is scaled to 1280px before the model sees it. The model works
       at 1024px anyway; a 12–48MP phone photo only cost seconds (and memory)
       resizing in and out, and the result is a 1000px square regardless.
     • "small" rather than "medium": the same cut on product shots, half the
       download, a little quicker to run.

   Quality. The raw matte leaves a faint haze where the model was unsure (a
   ghost of the background around the piece). The matte is cleaned — haze to
   clear, the body of the piece to solid — before the piece is trimmed, so the
   trim hugs the product and nothing smudges the card's ground.

   If the engine can't be loaded — offline, an old browser — the original photo is
   kept and used as-is. A listing never fails because a cut-out failed.

   Usage:
     <script src="cutout.js"></script>
     veroCutoutWarm();                       // optional, as early as possible
     const out = await veroCutout(fileOrDataUrl, { onStatus: msg => ... });
     // out.image  — the cut-out, a transparent 1000px square PNG (data URL)
     // out.ok     — false if it fell back to the original
------------------------------------------------------------------ */

/* The square every product ends up in, so the grid never has to crop. */
const VERO_CUTOUT_SIZE = 1000;
/* Air around the piece, as a share of the square. */
const VERO_CUTOUT_PAD = 0.06;
/* Longest side of the photo handed to the model. */
const VERO_CUTOUT_INPUT = 1280;

// The engine is served from the site itself (vendor/bg-removal/<version>/): the
// library, bundled into one file, plus exactly the files a cut-out uses — the
// "small" model and the WASM runtime. Nothing depends on an outside CDN being
// up, reachable or still serving this version, and the files are same-origin.
// Rebuild: bundle @imgly/background-removal@<v> with esbuild and copy the
// matching chunks from @imgly/background-removal-data@<v> (see resources.json).
const VERO_CUTOUT_VERSION = '1.4.5';
const VERO_CUTOUT_PUBLIC_PATH =
    new URL('vendor/bg-removal/' + VERO_CUTOUT_VERSION + '/', document.baseURI).href;
const VERO_CUTOUT_MODEL = 'small';

/* Clocks. A blocked CDN hangs rather than fails, so nothing waits forever —
   but a slow phone line is not a failure either: the download is only given
   up on when it stops moving, not after a fixed time. */
const VERO_CUTOUT_LIB_TIMEOUT = 30000;      // importing the library
const VERO_CUTOUT_STALL_TIMEOUT = 30000;    // no download progress for this long
const VERO_CUTOUT_RUN_TIMEOUT = 90000;      // the cut itself, once everything is here

function veroCutoutDeadline(promise, ms, what) {
    let t;
    return Promise.race([
        promise,
        new Promise((_, reject) => { t = setTimeout(() => reject(new Error(what + ' timed out')), ms); })
    ]).finally(() => clearTimeout(t));
}

function veroCutoutConfig(extra) {
    return Object.assign({
        publicPath: VERO_CUTOUT_PUBLIC_PATH,
        model: VERO_CUTOUT_MODEL,
        output: { format: 'image/png' }
    }, extra || {});
}

let veroCutoutLibPromise = null;
// One import, the first time it is needed. Kept out of page load so the site
// does not pay for it on pages where nobody lists anything.
function veroCutoutLoad() {
    if (!veroCutoutLibPromise) {
        veroCutoutLibPromise = import(VERO_CUTOUT_PUBLIC_PATH + 'background-removal.js')
            .catch(err => { veroCutoutLibPromise = null; throw err; });
    }
    return veroCutoutLibPromise;
}

/* ---- The engine's files, kept by us ----
   The model and runtime are kept in Cache Storage under a versioned name, so
   they are downloaded once per device — not once per visit, and not again
   when the phone's HTTP cache decides 45MB is too big to keep. The library
   asks for them with plain fetch(); a small shim answers those requests from
   the store (or fills it), so a file is never fetched twice. */
const VERO_CUTOUT_CACHE = 'vero-cutout-' + VERO_CUTOUT_VERSION + '-' + VERO_CUTOUT_MODEL + '-local';
const veroCutoutFiles = new Map();          // url → Promise<Blob>, shared by every caller

function veroCutoutGet(url) {
    if (veroCutoutFiles.has(url)) return veroCutoutFiles.get(url);
    const p = (async () => {
        let store = null;
        try { store = self.caches ? await caches.open(VERO_CUTOUT_CACHE) : null; } catch (e) {}
        if (store) {
            const hit = await store.match(url).catch(() => null);
            if (hit) return hit.blob();
        }
        const res = await veroCutoutFetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error('fetch ' + res.status + ' ' + url);
        if (store) await store.put(url, res.clone()).catch(() => {});
        return res.blob();
    })();
    p.catch(() => veroCutoutFiles.delete(url));   // a failure may be retried later
    veroCutoutFiles.set(url, p);
    return p;
}

// The page's own fetch, before the shim below wraps it.
const veroCutoutFetch = self.fetch.bind(self);
self.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (url.indexOf(VERO_CUTOUT_PUBLIC_PATH) === 0) {
        return veroCutoutGet(url).then(blob => new Response(blob, { status: 200 }));
    }
    return veroCutoutFetch(input, init);
};

/* ---- Warm-up: fetch the engine before it is asked for ----
   Only the files a cut-out will actually use: the model and the one runtime
   build this browser will pick (threaded builds need cross-origin isolation,
   which the site does not have). Network only — no CPU is spent, so it never
   slows the page the seller is typing into. */
let veroCutoutWarmPromise = null;
function veroCutoutWarm() {
    if (veroCutoutWarmPromise) return veroCutoutWarmPromise;
    const base = VERO_CUTOUT_PUBLIC_PATH;
    const simd = typeof WebAssembly === 'object' && WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
    const threads = !!self.crossOriginIsolated;
    const wasm = '/onnxruntime-web/ort-wasm' + (simd ? '-simd' : '') + (threads ? '-threaded' : '') + '.wasm';
    veroCutoutWarmPromise = Promise.all([
        veroCutoutLoad(),
        veroCutoutGet(base + 'resources.json').then(b => b.text()).then(t => JSON.parse(t)).then(map =>
            Promise.all(['/models/' + VERO_CUTOUT_MODEL, wasm].map(key =>
                Promise.all(((map[key] && map[key].chunks) || []).map(c =>
                    veroCutoutGet(new URL(c.hash, base).toString()))))))
    ]).catch(err => {
        // A failed warm-up costs nothing: the real cut-out simply fetches again.
        veroCutoutWarmPromise = null;
        console.warn('[cutout] warm-up skipped:', err);
    });
    return veroCutoutWarmPromise;
}

/* ---- Helpers ---- */
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

function veroCutoutBlobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve(e.target.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

/* Scale a phone photo down to what the model can use. Orientation from the
   camera's EXIF is applied while decoding, so a portrait shot stays upright. */
async function veroCutoutShrink(blob) {
    let src;
    try { src = await createImageBitmap(blob, { imageOrientation: 'from-image' }); }
    catch (e) { src = await veroCutoutLoadImage(blob); }
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
    const k = Math.min(1, VERO_CUTOUT_INPUT / Math.max(w, h));
    if (k === 1 && blob.type && blob.type !== 'image/heic') { if (src.close) src.close(); return blob; }
    const c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    if (src.close) src.close();
    return new Promise(resolve => c.toBlob(b => resolve(b || blob), 'image/jpeg', 0.92));
}

/* Clean the matte, trim to the piece, and centre it in a transparent square.
   Without the clean-up the model's faint haze keeps a ghost of the background
   and stretches the trim; without the trim a piece shot from far away stays a
   speck in the middle of its card. */
function veroCutoutCompose(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const scan = document.createElement('canvas');
    scan.width = w; scan.height = h;
    const sctx = scan.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    const id = sctx.getImageData(0, 0, w, h), data = id.data;

    // Haze (alpha ≤ LO) goes clear, the body (alpha ≥ HI) goes solid, and the
    // soft edge in between is stretched across the full range so it stays smooth.
    const LO = 40, HI = 215, span = HI - LO;
    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4 + 3, a = data[i];
            const v = a <= LO ? 0 : a >= HI ? 255 : Math.round((a - LO) * 255 / span);
            data[i] = v;
            if (v) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }
    // Nothing (or next to nothing) survived the cut — keep the original instead.
    if (right < 0 || (right - left) * (bottom - top) < w * h * 0.01) return null;
    sctx.putImageData(id, 0, 0);

    const cw = right - left + 1, ch = bottom - top + 1;
    const out = document.createElement('canvas');
    out.width = out.height = VERO_CUTOUT_SIZE;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    // No fill: the square stays transparent and the card paints the ground.
    const box = VERO_CUTOUT_SIZE * (1 - VERO_CUTOUT_PAD * 2);
    const scale = Math.min(box / cw, box / ch);
    const dw = cw * scale, dh = ch * scale;
    ctx.drawImage(scan, left, top, cw, ch,
        (VERO_CUTOUT_SIZE - dw) / 2, (VERO_CUTOUT_SIZE - dh) / 2, dw, dh);

    // PNG, not JPEG — JPEG has no alpha and would fill the transparency black.
    return out.toDataURL('image/png');
}

/* ---- The cut-out ---- */
async function veroCutout(src, opts = {}) {
    const say = opts.onStatus || (() => {});
    const original = src instanceof Blob ? await veroCutoutBlobToDataUrl(src) : src;
    try {
        say('Preparing…');
        const blob = await veroCutoutShrink(await veroCutoutToBlob(src));
        const lib = await veroCutoutDeadline(veroCutoutLoad(), VERO_CUTOUT_LIB_TIMEOUT, 'library');

        // The download is watched, not timed: it fails only if it stops moving.
        let stall, failStall;
        const stalled = new Promise((_, reject) => { failStall = reject; });
        const kick = () => {
            clearTimeout(stall);
            stall = setTimeout(() => failStall(new Error('download stalled')), VERO_CUTOUT_STALL_TIMEOUT);
        };
        let fetched = {}, cutting = false;
        kick();
        const config = veroCutoutConfig({
            progress: (key, current, total) => {
                if (key.indexOf('fetch:') === 0) {
                    kick();
                    fetched[key] = [current, total];
                    let c = 0, t = 0;
                    for (const k in fetched) { c += fetched[k][0]; t += fetched[k][1]; }
                    if (t && current < total) say('Preparing… ' + Math.floor(c * 100 / t) + '%');
                } else if (key.indexOf('compute:') === 0 && !cutting) {
                    cutting = true;
                    clearTimeout(stall);
                    say('Removing background…');
                }
            }
        });
        let cut;
        try {
            cut = await Promise.race([
                veroCutoutDeadline(lib.removeBackground(blob, config), VERO_CUTOUT_RUN_TIMEOUT + VERO_CUTOUT_STALL_TIMEOUT, 'cut-out'),
                stalled
            ]);
        } finally { clearTimeout(stall); }

        const img = await veroCutoutLoadImage(cut);
        const composed = veroCutoutCompose(img);
        URL.revokeObjectURL(img.src);
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
