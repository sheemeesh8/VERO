/* ============================================================================
 * moravchick · auth.js — Instagram-style session persistence + client-side auth guard
 * ----------------------------------------------------------------------------
 * Single source of truth for "who is signed in" on the personal (buyer) side of
 * the marketplace. Everything is client-only (the rest of the site is a
 * localStorage prototype), but the shape mirrors a real token flow so it can be
 * swapped for a server later without touching the pages that call it.
 *
 * Storage map
 *   vero_session          – the ACTIVE session. Present ⇒ logged in.
 *                           { userId, accessToken, issuedAt, expiresAt }
 *                           Cleared on logout (tokens are "revoked").
 *   vero_saved_accounts   – Instagram-style device roster kept ACROSS logout.
 *                           [{ id, username, name, avatar, refresh, lastLogin }]
 *                           `refresh` is an obfuscated refresh-token stand-in.
 *   vero_users            – local "users" table (see types/schema.ts).
 *   vero_onboarded:<id>   – "1" once a user finished the onboarding quiz.
 *
 * SecureStore below is a thin obfuscation wrapper standing in for the platform
 * EncryptedLocalStorage / Keychain / Keystore a native build would use. It is
 * deliberately NOT real cryptography — it only keeps refresh tokens from being
 * copy-paste readable in devtools. Replace with a real secure store in prod.
 * ==========================================================================*/
(function (global) {
    'use strict';

    // ---- tiny JSON helpers -------------------------------------------------
    function read(key, fallback) {
        try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
        catch (e) { return fallback; }
    }
    function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    // ---- SecureStore: obfuscated refresh-token stand-in --------------------
    // XOR against a fixed device pepper, then base64. Good enough to represent
    // "EncryptedLocalStorage"; a real app hands this to the OS secure enclave.
    var PEPPER = 'vero.device.v1';
    function xor(str) {
        var out = '';
        for (var i = 0; i < str.length; i++) {
            out += String.fromCharCode(str.charCodeAt(i) ^ PEPPER.charCodeAt(i % PEPPER.length));
        }
        return out;
    }
    var SecureStore = {
        seal:   function (plain) { try { return btoa(unescape(encodeURIComponent(xor(String(plain))))); } catch (e) { return ''; } },
        open:   function (sealed) { try { return xor(decodeURIComponent(escape(atob(String(sealed))))); } catch (e) { return ''; } }
    };

    // ---- token minting (client stand-in) -----------------------------------
    function rand() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
    var SESSION_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

    function mintSession(userId) {
        var now = Date.now();
        return { userId: userId, accessToken: 'at_' + rand(), issuedAt: now, expiresAt: now + SESSION_TTL };
    }

    // ---- users table -------------------------------------------------------
    function allUsers() { return read('vero_users', []); }
    function findUserByEmail(email) {
        email = String(email || '').trim().toLowerCase();
        return allUsers().filter(function (u) { return u.email === email; })[0] || null;
    }
    function findUserById(id) {
        return allUsers().filter(function (u) { return u.id === id; })[0] || null;
    }

    // Persist the buyer identity used across the rest of the site so the header
    // avatar / name reflect the signed-in user immediately.
    function syncProfile(user) {
        var prof = read('vero_profile', {}) || {};
        if (user.name)   prof.name = user.name;
        if (user.avatar) prof.avatarImg = user.avatar;
        write('vero_profile', prof);
        localStorage.setItem('vero_active_account', 'buyer');
    }

    // ---- saved-accounts roster (survives logout) ---------------------------
    function savedAccounts() { return read('vero_saved_accounts', []); }

    function rememberAccount(user, refreshPlain) {
        var list = savedAccounts().filter(function (a) { return a.id !== user.id; });
        list.unshift({
            id:        user.id,
            username:  user.username || user.email,
            name:      user.name || user.username || user.email,
            avatar:    user.avatar || '',
            refresh:   SecureStore.seal(refreshPlain),
            lastLogin: Date.now()
        });
        write('vero_saved_accounts', list.slice(0, 8)); // cap the device roster
    }

    function forgetAccount(id) {
        write('vero_saved_accounts', savedAccounts().filter(function (a) { return a.id !== id; }));
    }

    // ---- public API --------------------------------------------------------
    var VeroAuth = {
        SecureStore: SecureStore,

        session: function () {
            var s = read('vero_session', null);
            if (!s) return null;
            if (s.expiresAt && s.expiresAt < Date.now()) { localStorage.removeItem('vero_session'); return null; }
            return s;
        },
        isLoggedIn: function () { return !!this.session(); },
        currentUser: function () { var s = this.session(); return s ? findUserById(s.userId) : null; },

        savedAccounts: savedAccounts,
        forgetAccount: forgetAccount,

        // Register a brand-new personal account. Returns the user record.
        // (Password is intentionally NOT stored in plaintext — we keep only a
        //  hashed stand-in, since this is a prototype with no backend.)
        signUp: function (email, password, name) {
            email = String(email || '').trim().toLowerCase();
            if (!email) throw new Error('EMAIL_REQUIRED');
            if (findUserByEmail(email)) throw new Error('EMAIL_TAKEN');
            var user = {
                id:        'u_' + rand(),
                email:     email,
                username:  email.split('@')[0],
                name:      name || email.split('@')[0],
                avatar:    '',
                pwHash:    SecureStore.seal(password || ''),   // stand-in only
                createdAt: Date.now()
            };
            var users = allUsers(); users.push(user); write('vero_users', users);

            var refresh = 'rt_' + rand();
            write('vero_session', mintSession(user.id));
            rememberAccount(user, refresh);
            syncProfile(user);
            return user;
        },

        // Email/password login. Throws NO_USER / BAD_PASSWORD on failure.
        login: function (email, password) {
            var user = findUserByEmail(email);
            if (!user) throw new Error('NO_USER');
            if (SecureStore.open(user.pwHash) !== String(password || '')) throw new Error('BAD_PASSWORD');
            var refresh = 'rt_' + rand();
            write('vero_session', mintSession(user.id));
            rememberAccount(user, refresh);
            syncProfile(user);
            return user;
        },

        // One-tap: re-authenticate a saved account using its stored refresh
        // token, no password prompt. Throws NOT_SAVED / STALE_TOKEN on failure.
        oneTap: function (accountId) {
            var acct = savedAccounts().filter(function (a) { return a.id === accountId; })[0];
            if (!acct) throw new Error('NOT_SAVED');
            var refresh = SecureStore.open(acct.refresh);
            if (!refresh) throw new Error('STALE_TOKEN');
            var user = findUserById(accountId);
            if (!user) throw new Error('NOT_SAVED');
            // Refresh rotates: mint a fresh session + a new refresh token.
            write('vero_session', mintSession(user.id));
            rememberAccount(user, 'rt_' + rand());
            syncProfile(user);
            return user;
        },

        // Logout: revoke the active session (access token) but KEEP the saved
        // account + its refresh token on the device for one-tap next time.
        logout: function () { localStorage.removeItem('vero_session'); },

        // ---- onboarding gate ----
        hasOnboarded: function (userId) {
            userId = userId || (this.session() && this.session().userId);
            return userId ? localStorage.getItem('vero_onboarded:' + userId) === '1' : false;
        },
        markOnboarded: function (userId) {
            userId = userId || (this.session() && this.session().userId);
            if (userId) localStorage.setItem('vero_onboarded:' + userId, '1');
        },

        /* ------------------------------------------------------------------
         * Route guard. Call at the top of a page's <script> with the page's
         * role. Enforces:
         *   New user  → sign-up → onboarding → feed
         *   Logged-out (has saved accounts) → login (one-tap) → feed
         *   Logged-out (fresh device)       → login (form)    → feed
         * Returns true if the page may render, false if it redirected.
         * ------------------------------------------------------------------*/
        guard: function (role) {
            var s = this.session();
            var loginUrl = 'login.html';

            if (role === 'protected') {
                if (!s) { location.replace(loginUrl); return false; }
                if (!this.hasOnboarded(s.userId)) { location.replace('onboarding.html'); return false; }
                return true;
            }
            if (role === 'onboarding') {
                if (!s) { location.replace(loginUrl); return false; }
                if (this.hasOnboarded(s.userId)) { location.replace('index.html'); return false; }
                return true;
            }
            if (role === 'auth') { // login / signup pages
                if (s) {
                    location.replace(this.hasOnboarded(s.userId) ? 'index.html' : 'onboarding.html');
                    return false;
                }
                return true;
            }
            return true;
        }
    };

    global.VeroAuth = VeroAuth;
})(window);
