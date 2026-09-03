/* ============================================================================
 * moravchick · username.js — Instagram-style usernames (handles)
 * ----------------------------------------------------------------------------
 * Client-only, like the rest of the prototype. A username is unique, lowercase,
 * and made of a–z, 0–9, dot and underscore (3–30 chars) — the Instagram rule
 * set. It is stored on:
 *   - vero_profile.username           (the shared buyer identity used app-wide)
 *   - vero_users[uid].username        (the local "users" table)
 *   - vero_saved_accounts[*].username (device roster)
 *
 * Uniqueness is enforced against the accounts stored ON THIS DEVICE. There is
 * no server, so global uniqueness (across every moravchick user in the world) needs a
 * backend — this module is shaped so isTaken()/reserve() can be swapped for an
 * API call later without touching the pages that use it.
 * ==========================================================================*/
(function (global) {
    'use strict';

    function read(key, fb) {
        try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; }
        catch (e) { return fb; }
    }
    function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

    var MIN = 3, MAX = 30;
    // Names we never let anyone take.
    var RESERVED = ['admin', 'vero', 'support', 'help', 'about', 'login', 'signup',
                    'settings', 'profile', 'store', 'shop', 'root', 'null', 'undefined'];

    // Turn arbitrary text into a candidate handle: lowercase, spaces→dot, strip
    // anything that isn't a–z/0–9/dot/underscore, collapse repeats, trim edges.
    function normalize(s) {
        s = String(s == null ? '' : s).toLowerCase().trim();
        s = s.replace(/[\s]+/g, '.');
        s = s.replace(/[^a-z0-9._]/g, '');
        s = s.replace(/[._]{2,}/g, function (m) { return m.charAt(0); }); // no doubles
        s = s.replace(/^[._]+|[._]+$/g, '');                              // no edge . or _
        return s.slice(0, MAX);
    }

    // Validate a FINAL handle. Returns { ok:true } or { ok:false, msg:'…' }.
    function validate(s) {
        s = String(s == null ? '' : s).toLowerCase();
        if (!s) return { ok: false, msg: 'יש לבחור שם משתמש' };
        if (s.length < MIN) return { ok: false, msg: 'שם המשתמש קצר מדי (לפחות ' + MIN + ' תווים)' };
        if (s.length > MAX) return { ok: false, msg: 'שם המשתמש ארוך מדי (עד ' + MAX + ' תווים)' };
        if (!/^[a-z0-9._]+$/.test(s)) return { ok: false, msg: 'רק אותיות באנגלית, מספרים, נקודה וקו תחתון' };
        if (/^[._]|[._]$/.test(s)) return { ok: false, msg: 'לא יכול להתחיל או להסתיים בנקודה/קו תחתון' };
        if (/[._]{2,}/.test(s)) return { ok: false, msg: 'לא ניתן להשתמש בשתי נקודות/קווים ברצף' };
        if (RESERVED.indexOf(s) !== -1) return { ok: false, msg: 'שם המשתמש הזה שמור' };
        return { ok: true };
    }

    // Every handle currently in use on this device, lowercased.
    function takenSet() {
        var set = {};
        read('vero_users', []).forEach(function (u) {
            if (u && u.username) set[String(u.username).toLowerCase()] = u.id || true;
        });
        read('vero_saved_accounts', []).forEach(function (a) {
            if (a && a.username && /^[a-z0-9._]+$/i.test(a.username)) {
                set[String(a.username).toLowerCase()] = a.id || true;
            }
        });
        var prof = read('vero_profile', {}) || {};
        if (prof.username) set[String(prof.username).toLowerCase()] = prof.userId || true;
        return set;
    }

    // Is `name` taken by someone OTHER than exceptId?
    function isTaken(name, exceptId) {
        name = String(name || '').toLowerCase();
        var owner = takenSet()[name];
        if (owner == null) return false;
        if (exceptId && owner === exceptId) return false;   // it's mine → not "taken"
        return true;
    }

    // Live check for UI: returns { state:'ok'|'invalid'|'taken', msg }.
    function check(name, exceptId) {
        var v = validate(name);
        if (!v.ok) return { state: 'invalid', msg: v.msg };
        if (isTaken(name, exceptId)) return { state: 'taken', msg: 'שם המשתמש כבר תפוס' };
        return { state: 'ok', msg: 'פנוי' };
    }

    // Build up to `n` AVAILABLE suggestions from one or more seed strings
    // (e.g. the user's name and email prefix).
    function suggest(seeds, exceptId, n) {
        n = n || 5;
        if (!Array.isArray(seeds)) seeds = [seeds];
        var bases = [];
        seeds.forEach(function (s) { var b = normalize(s); if (b && bases.indexOf(b) === -1) bases.push(b); });
        if (!bases.length) bases = ['vero.user'];

        var out = [], seen = {};
        function tryAdd(cand) {
            cand = normalize(cand);
            if (cand.length < MIN) cand = (cand + '.vero').slice(0, MAX);
            if (seen[cand]) return;
            seen[cand] = 1;
            if (validate(cand).ok && !isTaken(cand, exceptId)) out.push(cand);
        }
        // First the clean bases, then decorated variants until we have enough.
        bases.forEach(tryAdd);
        var suffixes = ['_', '.', '__'];
        for (var round = 0; out.length < n && round < 400; round++) {
            var base = bases[round % bases.length];
            if (round < 3) { tryAdd(base + suffixes[round]); continue; }
            var num = Math.floor(Math.random() * 9000) + 100;
            var joiner = round % 2 ? '.' : '';
            tryAdd(base + joiner + num);
        }
        return out.slice(0, n);
    }

    // The current user's handle (or '').
    function get() {
        var prof = read('vero_profile', {}) || {};
        if (prof.username) return String(prof.username).toLowerCase();
        var u = (global.VeroAuth && VeroAuth.currentUser && VeroAuth.currentUser()) || null;
        return u && u.username && /^[a-z0-9._]+$/i.test(u.username) ? String(u.username).toLowerCase() : '';
    }

    // Persist a chosen handle across the three stores. Returns { ok, msg }.
    function set(name, userId) {
        name = normalize(name);
        var chk = check(name, userId || currentUserId());
        if (chk.state !== 'ok') return { ok: false, msg: chk.msg };
        var uid = userId || currentUserId();

        var prof = read('vero_profile', {}) || {};
        prof.username = name;
        if (uid) prof.userId = uid;
        write('vero_profile', prof);

        if (uid) {
            var users = read('vero_users', []);
            users.forEach(function (u) { if (u.id === uid) u.username = name; });
            write('vero_users', users);
            var roster = read('vero_saved_accounts', []);
            roster.forEach(function (a) { if (a.id === uid) a.username = name; });
            write('vero_saved_accounts', roster);
        }
        return { ok: true, username: name };
    }

    function currentUserId() {
        var s = (global.VeroAuth && VeroAuth.session && VeroAuth.session()) || null;
        return s ? s.userId : null;
    }

    global.VeroUsername = {
        MIN: MIN, MAX: MAX,
        normalize: normalize,
        validate: validate,
        isTaken: isTaken,
        check: check,
        suggest: suggest,
        get: get,
        set: set,
        currentUserId: currentUserId
    };
})(window);
