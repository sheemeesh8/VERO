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
       resizing in and out, and the result is a 680×1000 frame regardless.
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
     // out.image  — the cut-out: a transparent 680×1000 PNG in the card's shape (data URL)
     // out.ok     — false if it fell back to the original
------------------------------------------------------------------ */

/* The frame every product ends up in: the shape of the card's image field
   (product-card.css: aspect-ratio 0.68, filled with object-fit: cover). A cut-out
   in exactly that shape is never cropped by the card, and being transparent it
   sits on the card's own ground instead of a square of a slightly different grey. */
const VERO_CUTOUT_W = 1020;
const VERO_CUTOUT_H = 1500;
/* The piece fills this share of the frame, centred, with even air around it. */
const VERO_CUTOUT_FILL = 0.84;
/* A watch is zoomed to its head: the case spans this share of the frame's width. */
const VERO_CUTOUT_WATCH_HEAD = 0.62;
/* Longest side of the photo whose pixels are kept. The model works on a
   smaller copy (below); its matte is scaled up and laid over this one, so the
   piece keeps the camera's detail instead of the model's thumbnail. */
const VERO_CUTOUT_FULL = 2048;
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

/* The photo at full working size, upright, on a canvas. */
async function veroCutoutFullCanvas(blob) {
    let src;
    try { src = await createImageBitmap(blob, { imageOrientation: 'from-image' }); }
    catch (e) { src = await veroCutoutLoadImage(blob); }
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
    const k = Math.min(1, VERO_CUTOUT_FULL / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    if (src.close) src.close();
    return c;
}

/* Lay the model's matte (made on the small copy) over the full-size photo. */
function veroCutoutApplyMatte(full, cut) {
    const ctx = full.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(cut, 0, 0, full.width, full.height);
    ctx.globalCompositeOperation = 'source-over';
    return full;
}

/* Clean the matte, trim to the piece, and centre it in a transparent square.
   Without the clean-up the model's faint haze keeps a ghost of the background
   and stretches the trim; without the trim a piece shot from far away stays a
   speck in the middle of its card. */
/* Where the watch head is, and how to turn it. The strap is the long axis of
   the piece (principal axis of the matte); the head is where the piece is
   widest across that axis. Returns the head's centre and size in source pixels
   and the rotation that lays the strap from top-left to bottom-right at 45°,
   with 12 o'clock towards the top-left. A piece with no clear long axis (a
   strap curled round, a bare case) is taken as shot upright. */
/* The angle of a case's sides (no strap to go by): the turn at which the
   piece's bounding box is smallest, as the angle of its "vertical" side. */
function veroCutoutCaseAngle(data, w, h) {
    const step = Math.max(1, Math.round(Math.max(w, h) / 400));
    const xs = [], ys = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 127) { xs.push(x); ys.push(y); }
    }
    let best = 0, bestArea = Infinity;
    for (let d = 0; d < 90; d++) {
        const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
        for (let i = 0; i < xs.length; i++) {
            const u = xs[i] * c + ys[i] * s, v = -xs[i] * s + ys[i] * c;
            if (u < u0) u0 = u; if (u > u1) u1 = u;
            if (v < v0) v0 = v; if (v > v1) v1 = v;
        }
        const area = (u1 - u0) * (v1 - v0);
        if (area < bestArea - 1e-6) { bestArea = area; best = a; }
    }
    return best + Math.PI / 2;
}

function veroCutoutWatchPose(data, w, h) {
    let n = 0, sx = 0, sy = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 127) { n++; sx += x; sy += y; }
    }
    if (n < 50) return null;
    const mx = sx / n, my = sy / n;
    let cxx = 0, cyy = 0, cxy = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] <= 127) continue;
        const dx = x - mx, dy = y - my;
        cxx += dx * dx; cyy += dy * dy; cxy += dx * dy;
    }
    cxx /= n; cyy /= n; cxy /= n;
    const tr = cxx + cyy, det = cxx * cyy - cxy * cxy;
    const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc, l2 = Math.max(1e-6, tr / 2 - disc);
    const elongated = Math.sqrt(l1 / l2) >= 1.6;
    let theta = elongated ? 0.5 * Math.atan2(2 * cxy, cxx - cyy) : veroCutoutCaseAngle(data, w, h);

    // Profile along the axis: how much of the piece sits in each slice.
    const cos = Math.cos(theta), sin = Math.sin(theta);
    let umin = Infinity, umax = -Infinity;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] <= 127) continue;
        const u = (x - mx) * cos + (y - my) * sin;
        if (u < umin) umin = u;
        if (u > umax) umax = u;
    }
    const BINS = 120, len = Math.max(1, umax - umin), bw = len / BINS;
    const count = new Float64Array(BINS), sumV = new Float64Array(BINS);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] <= 127) continue;
        const dx = x - mx, dy = y - my;
        const b = Math.min(BINS - 1, Math.floor((dx * cos + dy * sin - umin) / bw));
        count[b]++; sumV[b] += -dx * sin + dy * cos;
    }
    // Smooth, so a lug or a buckle doesn't pass for the head.
    const width = new Float64Array(BINS), R = 3;
    for (let b = 0; b < BINS; b++) {
        let s = 0, k = 0;
        for (let j = Math.max(0, b - R); j <= Math.min(BINS - 1, b + R); j++) { s += count[j]; k++; }
        width[b] = s / k / bw;
    }
    let peak = 0;
    for (let b = 1; b < BINS; b++) if (width[b] > width[peak]) peak = b;
    let a = peak, z = peak;
    while (a > 0 && width[a - 1] >= width[peak] * 0.75) a--;
    while (z < BINS - 1 && width[z + 1] >= width[peak] * 0.75) z++;
    let c = 0, v = 0;
    for (let b = a; b <= z; b++) { c += count[b]; v += sumV[b]; }
    const u0 = umin + (a + z + 1) / 2 * bw, v0 = c ? v / c : 0;
    const cx = mx + u0 * cos - v0 * sin, cy = my + u0 * sin + v0 * cos;
    const size = elongated ? Math.max(width[peak], (z - a + 1) * bw) : Math.sqrt(l1) * 4;

    // Lay the axis at 45° (screen y runs down), turning it the short way round.
    // A bare case is square-ish, so any of its sides will do: a quarter turn
    // is the most it ever needs.
    const period = elongated ? Math.PI : Math.PI / 2;
    let rot = Math.PI / 4 - theta;
    while (rot > period / 2 + 1e-6) rot -= period;
    while (rot <= -period / 2 - 1e-6) rot += period;
    return { cx, cy, size, rotate: rot };
}

function veroCutoutCompose(img, opts) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const scan = document.createElement('canvas');
    scan.width = w; scan.height = h;
    const sctx = scan.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    const id = sctx.getImageData(0, 0, w, h), data = id.data;

    // Haze (alpha ≤ LO) goes clear, the body (alpha ≥ HI) goes solid, and the
    // soft edge in between is stretched across the full range so it stays smooth.
    const LO = 40, HI = 215, span = HI - LO, n = w * h;
    const mask = new Uint8Array(n);
    for (let p = 0; p < n; p++) {
        const i = p * 4 + 3, a = data[i];
        const v = a <= LO ? 0 : a >= HI ? 255 : Math.round((a - LO) * 255 / span);
        data[i] = v;
        if (v) mask[p] = 1;
    }

    // Keep the piece, drop the specks. The model leaves small islands of
    // "foreground" in the background (a crease, a shadow, a fleck of pattern);
    // left in, they stretch the trim and the piece ends up small and off-centre.
    // Regions are labelled and only those of real size are kept — any region at
    // least 3% of the largest, so a pair of shoes or an earring set survives.
    const label = new Int32Array(n), sizes = [0], stack = new Int32Array(n);
    let count = 0;
    for (let p = 0; p < n; p++) {
        if (!mask[p] || label[p]) continue;
        const id = ++count; let sp = 0, size = 0;
        stack[sp++] = p; label[p] = id;
        while (sp) {
            const q = stack[--sp]; size++;
            const x = q % w, y = (q - x) / w;
            if (x > 0     && mask[q - 1] && !label[q - 1]) { label[q - 1] = id; stack[sp++] = q - 1; }
            if (x < w - 1 && mask[q + 1] && !label[q + 1]) { label[q + 1] = id; stack[sp++] = q + 1; }
            if (y > 0     && mask[q - w] && !label[q - w]) { label[q - w] = id; stack[sp++] = q - w; }
            if (y < h - 1 && mask[q + w] && !label[q + w]) { label[q + w] = id; stack[sp++] = q + w; }
        }
        sizes.push(size);
    }
    let biggest = 0;
    for (let k = 1; k <= count; k++) if (sizes[k] > biggest) biggest = sizes[k];
    const keep = new Uint8Array(count + 1);
    for (let k = 1; k <= count; k++) keep[k] = sizes[k] >= biggest * 0.03 ? 1 : 0;

    let top = h, left = w, right = -1, bottom = -1;
    for (let p = 0; p < n; p++) {
        if (!mask[p]) continue;
        if (!keep[label[p]]) { data[p * 4 + 3] = 0; continue; }
        const x = p % w, y = (p - x) / w;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
    }
    // Nothing (or next to nothing) survived the cut — keep the original instead.
    if (right < 0 || (right - left) * (bottom - top) < w * h * 0.01) return null;
    sctx.putImageData(id, 0, 0);

    const cw = right - left + 1, ch = bottom - top + 1;
    const out = document.createElement('canvas');
    out.width = VERO_CUTOUT_W; out.height = VERO_CUTOUT_H;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // No fill: the frame stays transparent and the card paints the ground.
    const pose = opts && opts.pose === 'watch' ? veroCutoutWatchPose(data, w, h) : null;
    if (pose) {
        // The head goes to the middle of the frame, the strap runs corner to
        // corner at 45° and bleeds off the edges, like a watch shot on a table.
        const s = Math.min(VERO_CUTOUT_W, VERO_CUTOUT_H) * VERO_CUTOUT_WATCH_HEAD / pose.size;
        ctx.translate(VERO_CUTOUT_W / 2, VERO_CUTOUT_H / 2);
        ctx.rotate(pose.rotate);
        ctx.scale(s, s);
        ctx.drawImage(scan, -pose.cx, -pose.cy);
    } else {
        const scale = Math.min(VERO_CUTOUT_W * VERO_CUTOUT_FILL / cw, VERO_CUTOUT_H * VERO_CUTOUT_FILL / ch);
        const dw = cw * scale, dh = ch * scale;
        ctx.drawImage(scan, left, top, cw, ch,
            (VERO_CUTOUT_W - dw) / 2, (VERO_CUTOUT_H - dh) / 2, dw, dh);
    }

    // Transparent, so never JPEG (it has no alpha and would fill it black).
    // WebP keeps the alpha at a fraction of PNG's size — it matters, because the
    // listing lives in the browser's ~5MB storage. Browsers that cannot encode
    // WebP (Safari) hand back a PNG from the same call; that is used as it is.
    const webp = out.toDataURL('image/webp', 0.9);
    return webp.indexOf('data:image/webp') === 0 ? webp : out.toDataURL('image/png');
}

/* Re-pose a cut-out that is already stored (transparent, background gone):
   used when a photo was cut before the item was marked as a watch. */
async function veroCutoutRepose(src, opts = {}) {
    try {
        const img = await veroCutoutLoadImage(await veroCutoutToBlob(src));
        const out = veroCutoutCompose(img, { pose: opts.pose });
        URL.revokeObjectURL(img.src);
        return out || src;
    } catch (e) { return src; }
}

/* ---- The cut-out ---- */
async function veroCutout(src, opts = {}) {
    const say = opts.onStatus || (() => {});
    const original = src instanceof Blob ? await veroCutoutBlobToDataUrl(src) : src;
    try {
        say('Preparing…');
        const photo = await veroCutoutToBlob(src);
        const blob = await veroCutoutShrink(photo);
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
        let source = img;
        try { source = veroCutoutApplyMatte(await veroCutoutFullCanvas(photo), img); }
        catch (e) { console.warn('[cutout] full-size matte failed, using the model\'s copy:', e); }
        const composed = veroCutoutCompose(source, { pose: opts.pose });
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
