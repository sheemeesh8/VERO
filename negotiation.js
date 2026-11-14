/* moravchick negotiation engine — one model for every price negotiation.
 *
 * A negotiation is a thread of events between "me" and "them" over one item:
 *
 *   { id, side: 'selling' | 'buying', party, item: { name, icon, cover, ask },
 *     status: 'open' | 'accepted' | 'declined' | 'withdrawn' | 'expired',
 *     events: [{ by: 'me' | 'them' | 'system', type, amount, note, final, at }],
 *     agreed, createdAt, updatedAt, expiresAt, demo }
 *
 * Event types: 'offer' (an opening offer or a counter), 'accept', 'decline',
 * 'withdraw', 'expire'. Whoever did NOT make the latest offer holds the turn.
 *
 * Everything lives in localStorage under vero_negotiations. The older keys
 * (vero_received_offers, vero_offers, vero_sent_offers) are still read by the
 * chats and dashboards and still written by the product page, so the engine
 * keeps them in step: entries without an `nid` are imported, and the engine
 * writes its own state back out tagged with `nid`.
 *
 * PROTOTYPE NOTE: there is no server, so nobody is on the other end. With
 * SIMULATE on, the engine answers on the counterparty's behalf a few seconds
 * after your move, so the flow can be used end to end. Turn it off the day
 * real counterparties exist.
 */
(function () {
    'use strict';

    var KEY = 'vero_negotiations', SETTINGS_KEY = 'vero_nego_settings';
    var SIMULATE = true;
    var MAX_OFFERS = 6;                       // total offers in a thread, both sides
    var H = 36e5, D = 864e5;

    var readJSON = function (k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } };
    var writeJSON = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    var uid = function () { return 'n' + Math.random().toString(36).slice(2, 10); };
    var round5 = function (n) { return Math.max(1, Math.round(n / 5) * 5); };

    var DEFAULT_SETTINGS = { enabled: true, autoAccept: 0, autoDecline: 0, expiryHours: 48 };
    function settings() { return Object.assign({}, DEFAULT_SETTINGS, readJSON(SETTINGS_KEY, {}) || {}); }
    function saveSettings(patch) { var s = Object.assign(settings(), patch || {}); writeJSON(SETTINGS_KEY, s); emit(); return s; }

    var list = null, listeners = [];
    function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

    /* ------------------------------ Derived ------------------------------ */
    function offers(n) { return n.events.filter(function (e) { return e.type === 'offer'; }); }
    function lastOffer(n, by) {
        var o = offers(n); if (by) o = o.filter(function (e) { return e.by === by; });
        return o[o.length - 1] || null;
    }
    // A snapshot of where a thread stands — what the UI needs to draw it.
    function state(n) {
        var last = lastOffer(n), mine = lastOffer(n, 'me'), theirs = lastOffer(n, 'them');
        var open = n.status === 'open', count = offers(n).length;
        return {
            open: open, last: last, mine: mine, theirs: theirs,
            turn: !open ? null : (last && last.by === 'them' ? 'me' : 'them'),
            price: n.status === 'accepted' ? n.agreed : (last ? last.amount : n.item.ask),
            rounds: count, roundsLeft: Math.max(0, MAX_OFFERS - count),
            canCounter: open && last && last.by === 'them' && !last.final && count < MAX_OFFERS,
            // The band a counter of mine must fall in.
            min: n.side === 'selling' ? (theirs ? theirs.amount + 1 : 1) : (mine ? mine.amount + 1 : 1),
            max: n.side === 'selling' ? (mine ? mine.amount - 1 : n.item.ask) : (theirs ? theirs.amount - 1 : n.item.ask - 1),
            msLeft: open ? n.expiresAt - Date.now() : 0
        };
    }

    /* --------------------------- Legacy bridges --------------------------- */
    function make(side, party, item, at) {
        return { id: uid(), side: side, party: party || (side === 'selling' ? 'Buyer' : 'Seller'),
                 item: { name: item.name || 'Item', icon: item.icon || '🛍️', cover: item.cover || '', ask: Number(item.ask) || 0 },
                 status: 'open', events: [], createdAt: at, updatedAt: at, expiresAt: at + settings().expiryHours * H };
    }
    function push(n, ev) {
        ev.at = ev.at || Date.now();
        n.events.push(ev); n.updatedAt = ev.at;
        if (ev.type === 'offer') n.expiresAt = ev.at + settings().expiryHours * H;
        return n;
    }
    function coverOf(o) { return o.processed_cover || o.image || o.cover || o.img || o.photo || ''; }

    function fromLegacy(o, side) {
        var at = Number(o.at) || Date.now();
        var n = make(side, side === 'selling' ? o.buyer : o.seller, { name: o.name, icon: o.icon, cover: coverOf(o), ask: o.askPrice }, at);
        var opener = side === 'selling' ? 'them' : 'me', other = side === 'selling' ? 'me' : 'them';
        push(n, { by: opener, type: 'offer', amount: Number(o.offer) || 0, at: at });
        if (o.status === 'countered' && o.counter) push(n, { by: other, type: 'offer', amount: Number(o.counter), at: at + 1 });
        else if (o.status === 'accepted') { push(n, { by: other, type: 'accept', amount: Number(o.offer), at: at + 1 }); n.status = 'accepted'; n.agreed = Number(o.offer); }
        else if (o.status === 'declined') { push(n, { by: other, type: 'decline', at: at + 1 }); n.status = 'declined'; }
        // An old thread should not expire the moment it is imported.
        if (n.status === 'open') n.expiresAt = Math.max(n.expiresAt, Date.now() + 24 * H);
        return n;
    }

    function importLegacy() {
        var changed = false;
        var take = function (key, side) {
            var arr = readJSON(key, []); if (!Array.isArray(arr)) return;
            arr.forEach(function (o) {
                if (!o || o.nid || !o.name || !(Number(o.offer) > 0) || !(Number(o.askPrice) > 0)) return;
                var who = side === 'selling' ? o.buyer : o.seller;
                // The product page and the old "offers made" page could both hold the same offer.
                var dup = list.some(function (n) {
                    return n.side === side && n.party === who && n.item.name === o.name && n.events[0] && Math.abs(n.events[0].at - (Number(o.at) || 0)) < 2000;
                });
                if (!dup) { var n = fromLegacy(o, side); if (side === 'selling') applyRules(n); list.push(n); changed = true; }
            });
        };
        take('vero_received_offers', 'selling');
        take('vero_offers', 'buying');
        take('vero_sent_offers', 'buying');
        return changed;
    }

    function exportLegacy() {
        var recv = [], sent = [], offs = [];
        list.forEach(function (n) {
            var st = state(n), opener = n.side === 'selling' ? 'them' : 'me';
            var theirs = lastOffer(n, opener), reply = lastOffer(n, opener === 'me' ? 'them' : 'me');
            var row = {
                nid: n.id, name: n.item.name, icon: n.item.icon, askPrice: n.item.ask,
                offer: n.status === 'accepted' ? n.agreed : (theirs ? theirs.amount : 0), at: n.updatedAt,
                status: n.status === 'accepted' ? 'accepted' : n.status !== 'open' ? 'declined'
                      : (st.last && st.last.by === opener ? 'pending' : 'countered')
            };
            if (n.item.cover) row.image = n.item.cover;
            if (row.status === 'countered' && reply) row.counter = reply.amount;
            if (n.side === 'selling') { row.buyer = n.party; recv.push(row); }
            else {
                row.seller = n.party; sent.push(row);
                if (!n.demo && n.status !== 'withdrawn') offs.push({ nid: n.id, name: row.name, seller: row.seller, askPrice: row.askPrice, offer: row.offer, at: n.createdAt });
            }
        });
        writeJSON('vero_received_offers', recv);
        writeJSON('vero_sent_offers', sent);
        writeJSON('vero_offers', offs);
    }

    function seed(side) {
        var now = Date.now(), mk = function (party, name, icon, ask, steps, ago, closing) {
            var n = make(side, party, { name: name, icon: icon, ask: ask }, now - ago); n.demo = true;
            var opener = side === 'selling' ? 'them' : 'me', other = opener === 'me' ? 'them' : 'me';
            steps.forEach(function (amt, i) { push(n, { by: i % 2 ? other : opener, type: 'offer', amount: amt, at: now - ago + i * 40 * 60000 }); });
            var last = n.events[n.events.length - 1];
            if (closing === 'accepted') { push(n, { by: last.by === 'me' ? 'them' : 'me', type: 'accept', amount: last.amount, at: last.at + H }); n.status = 'accepted'; n.agreed = last.amount; }
            if (closing === 'declined') { push(n, { by: last.by === 'me' ? 'them' : 'me', type: 'decline', at: last.at + H }); n.status = 'declined'; }
            if (n.status === 'open') n.expiresAt = now + (10 + Math.round(Math.random() * 34)) * H;
            return n;
        };
        if (side === 'selling') return [
            mk('Maya L.',   'Wool coat',    '🧥', 269, [230],            4 * H),
            mk('Omer T.',   'Raw denim',    '👖', 129, [100],            9 * H),
            mk('Noa B.',    'Silk scarf',   '🧣', 210, [175, 195],       1 * D),
            mk('Daniel K.', 'Leather tote', '👜', 540, [460, 510, 480],  2 * D, 'accepted'),
            mk('Tal R.',    'Linen shirt',  '👔', 95,  [60],             3 * D, 'declined')
        ];
        return [
            mk('Studio Noa',  'Vintage blazer', '🧥', 320, [260, 295],  5 * H),
            mk('Atelier Gal', 'Ceramic vase',   '🏺', 180, [140],       1 * D),
            mk('Yael S.',     'Suede boots',    '👢', 410, [350, 390, 370], 2 * D, 'accepted')
        ];
    }

    /* ----------------------------- Load / save ----------------------------- */
    function load() {
        list = readJSON(KEY, null);
        var fresh = !Array.isArray(list);
        if (fresh) list = [];
        var changed = importLegacy();
        ['selling', 'buying'].forEach(function (side) {
            if (fresh && !list.some(function (n) { return n.side === side; })) { list = list.concat(seed(side)); changed = true; }
        });
        if (expire()) changed = true;
        if (changed || fresh) persist();
        return list;
    }
    function persist() { writeJSON(KEY, list); exportLegacy(); }
    function save() { persist(); emit(); }
    function all() { return list || load(); }
    function get(id) { return all().filter(function (n) { return n.id === id; })[0] || null; }
    function bySide(side) {
        return all().filter(function (n) { return n.side === side; }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    }

    function expire() {
        var now = Date.now(), hit = false;
        (list || []).forEach(function (n) {
            if (n.status === 'open' && n.expiresAt && n.expiresAt < now) {
                n.events.push({ by: 'system', type: 'expire', at: n.expiresAt }); n.status = 'expired'; n.updatedAt = n.expiresAt; hit = true;
            }
        });
        return hit;
    }

    /* ------------------------------ Closing ------------------------------ */
    // An agreed deal opens the chat with that person so pickup can be arranged.
    function openDeal(n) {
        try {
            var deals = readJSON('vero_deals', {}) || {};
            deals[n.party] = { item: n.item.name, status: 'coordinating', price: n.agreed, updatedAt: Date.now() };
            writeJSON('vero_deals', deals);
            var chats = readJSON('vero_chats', {}) || {};
            if (!Array.isArray(chats[n.party])) chats[n.party] = [];
            chats[n.party].push({ sender: 'system', content: 'Deal agreed on ' + n.item.name + ' at ₪' + Math.round(n.agreed).toLocaleString('en-US') + ' — arrange pickup', at: Date.now() });
            writeJSON('vero_chats', chats);
        } catch (e) {}
    }
    function close(n, by, type, amount) {
        push(n, { by: by, type: type, amount: amount });
        n.status = { accept: 'accepted', decline: 'declined', withdraw: 'withdrawn' }[type];
        if (type === 'accept') { n.agreed = amount; openDeal(n); }
    }

    // The seller's standing rules, applied to a buyer's offer as it arrives.
    function applyRules(n) {
        if (n.side !== 'selling' || n.status !== 'open') return;
        var s = settings(), o = lastOffer(n); if (!o || o.by !== 'them' || !n.item.ask) return;
        var pct = o.amount / n.item.ask * 100;
        if (s.autoAccept && pct >= s.autoAccept) { close(n, 'me', 'accept', o.amount); n.events[n.events.length - 1].auto = true; }
        else if (s.autoDecline && pct < s.autoDecline) { close(n, 'me', 'decline'); n.events[n.events.length - 1].auto = true; }
    }

    /* ------------------------------- Actions ------------------------------- */
    // act(id, 'offer' | 'accept' | 'decline' | 'withdraw', { amount, note, final })
    // Returns { ok } or { ok: false, error }.
    function act(id, action, opts) {
        var n = get(id); opts = opts || {};
        if (!n) return { ok: false, error: 'This negotiation no longer exists.' };
        expire();
        var st = state(n);
        if (!st.open) return { ok: false, error: 'This negotiation is already closed.' };

        if (action === 'accept') {
            if (st.turn !== 'me') return { ok: false, error: 'There is nothing to accept yet.' };
            close(n, 'me', 'accept', st.last.amount);
        } else if (action === 'decline') {
            close(n, 'me', 'decline');
        } else if (action === 'withdraw') {
            close(n, 'me', 'withdraw');
        } else if (action === 'offer') {
            var amount = Math.round(Number(opts.amount));
            if (!st.canCounter) return { ok: false, error: st.last && st.last.final ? 'That was a final offer — accept or decline it.' : 'No more counters are possible here.' };
            if (!(amount > 0)) return { ok: false, error: 'Enter an amount.' };
            if (amount === st.last.amount) { close(n, 'me', 'accept', amount); save(); return { ok: true, accepted: true }; }
            if (amount < st.min || amount > st.max) {
                return { ok: false, error: 'Choose an amount between ₪' + st.min.toLocaleString('en-US') + ' and ₪' + st.max.toLocaleString('en-US') + '.' };
            }
            push(n, { by: 'me', type: 'offer', amount: amount, note: String(opts.note || '').trim().slice(0, 200), final: !!opts.final || st.rounds + 1 >= MAX_OFFERS });
        } else {
            return { ok: false, error: 'Unknown action.' };
        }
        save();
        return { ok: true };
    }

    // A new offer I make as a buyer (from a product page or anywhere else).
    function create(o) {
        var n = make('buying', o.seller, { name: o.name, icon: o.icon, cover: o.cover, ask: o.ask }, Date.now());
        push(n, { by: 'me', type: 'offer', amount: Math.round(Number(o.amount)), note: String(o.note || '').trim().slice(0, 200) });
        all().push(n); save();
        return n;
    }

    /* ----------------------- Stand-in counterparty ----------------------- */
    function reply(id) {
        var n = get(id); if (!n) return;
        var st = state(n); if (!st.open || st.turn !== 'them' || !st.mine) return;
        var mine = st.mine.amount, ask = n.item.ask, note = '';
        if (n.side === 'selling') {
            // They are the buyer; I countered at `mine`. Their last offer is the floor.
            var theirs = st.theirs ? st.theirs.amount : Math.round(mine * 0.8), gap = (mine - theirs) / mine;
            if (gap <= 0.07 || st.mine.final && gap <= 0.15) close(n, 'them', 'accept', mine);
            else if (st.mine.final || st.roundsLeft <= 0) close(n, 'them', 'decline');
            else {
                var up = Math.min(mine - 1, Math.max(theirs + 1, round5(theirs + (mine - theirs) * 0.55)));
                push(n, { by: 'them', type: 'offer', amount: up, note: 'Can we meet here?', final: st.roundsLeft <= 1 });
                applyRules(n);
            }
        } else {
            // They are the seller; I offered `mine`. Their last counter (or the ask) is the ceiling.
            var top = st.theirs ? st.theirs.amount : ask, ratio = mine / top;
            if (ratio >= 0.92 || st.mine.final && ratio >= 0.85) close(n, 'them', 'accept', mine);
            else if (mine < ask * 0.5 || st.mine.final || st.roundsLeft <= 0) close(n, 'them', 'decline');
            else {
                var down = Math.max(mine + 1, Math.min(top - 1, round5(top - (top - mine) * 0.45)));
                push(n, { by: 'them', type: 'offer', amount: down, note: note || 'This is the best I can do for now.', final: st.roundsLeft <= 1 });
            }
        }
        save();
    }
    var timers = {};
    // Schedule the stand-in's answer for every thread waiting on the other side.
    function simulate(soon) {
        if (!SIMULATE) return;
        all().forEach(function (n) {
            var st = state(n);
            if (!st.open || st.turn !== 'them') return;
            if (timers[n.id]) { if (!soon) return; clearTimeout(timers[n.id]); }
            var wait = soon ? 3500 + Math.random() * 3000 : 6000 + Math.random() * 6000;
            timers[n.id] = setTimeout(function () { delete timers[n.id]; reply(n.id); }, wait);
        });
    }

    // Another tab or frame changed the data — pick it up.
    window.addEventListener('storage', function (e) {
        if (e.key === KEY || e.key === 'vero_offers' || e.key === SETTINGS_KEY) { list = null; load(); emit(); }
    });

    window.VeroNego = {
        MAX_OFFERS: MAX_OFFERS,
        all: all, get: get, bySide: bySide, state: state, act: act, create: create,
        settings: settings, saveSettings: saveSettings, simulate: simulate,
        refresh: function () { if (expire()) save(); },
        onChange: function (fn) { listeners.push(fn); }
    };
})();
