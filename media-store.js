/* VERO media store — keeps big binaries (hero image, hero video, avatar) in
 * IndexedDB instead of localStorage, whose ~5MB per-origin cap can't hold a
 * camera photo or a short clip. Values are stored as Blobs; callers get a
 * short-lived object URL to paint with.
 *
 * localStorage still holds the small pointers (e.g. vero_store_config.hero =
 * 'idb' means "the real image lives in IndexedDB under the 'hero' key"). Old
 * data-URL / filename values keep working — veroResolveMedia passes them
 * through unchanged.
 */
(function () {
    const DB_NAME = 'vero_media', STORE = 'media', VERSION = 1;
    const IDB_FLAG = 'idb';   // sentinel stored in localStorage pointers

    function openDB() {
        return new Promise((resolve, reject) => {
            let req;
            try { req = indexedDB.open(DB_NAME, VERSION); }
            catch (e) { return reject(e); }
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    window.VERO_IDB_FLAG = IDB_FLAG;

    window.veroMediaSet = async function (key, blob) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(blob, key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('idb abort'));
        });
    };

    window.veroMediaGet = async function (key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const rq = tx.objectStore(STORE).get(key);
            rq.onsuccess = () => resolve(rq.result || null);
            rq.onerror = () => reject(rq.error);
        });
    };

    window.veroMediaDelete = async function (key) {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).delete(key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) { return false; }
    };

    // A blob URL for a stored key, or null when nothing is there.
    window.veroMediaURL = async function (key) {
        try {
            const b = await window.veroMediaGet(key);
            return b ? URL.createObjectURL(b) : null;
        } catch (e) { return null; }
    };

    // Turn a stored pointer into something paintable. 'idb' → the blob URL under
    // `key`; anything else (data URL, filename, http URL) is returned as-is.
    window.veroResolveMedia = async function (value, key) {
        if (value === IDB_FLAG) return await window.veroMediaURL(key);
        return value || null;
    };
})();
