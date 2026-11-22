/* ------------------------------------------------------------------
   moravchick — the events behind the calendar.

   One source for both places that show them: the home feed's "What's on"
   strip and the events page. Curated physical events (markets, fairs,
   meetups, pop-ups) dated relative to today, plus the events sellers host
   themselves (vero_events), plus the booths sellers book (vero_event_booths).

     <script src="assets/events-data.js"></script>
     veroEvents.all()            → every event, sorted by date then time
     veroEvents.on('2026-11-24') → that day's events
     veroEvents.upcoming(n)      → the next n events from today
     veroEvents.attendees(e)     → sellers with a booth at e
     veroEvents.ics(e)           → an .ics file for "Add to calendar"
     veroEvents.isGoing(id) / setGoing(id, on) → your "I'm going" (vero_event_going)
     veroEvents.goingCount(e)    → how many people are going (you included)
     veroEvents.mine()           → events you're going to or hosting
------------------------------------------------------------------ */
(function () {
    'use strict';
    var TYPES = {
        market: { name: 'Market',  plural: 'Markets', color: '#9a7d52' },
        fair:   { name: 'Fair',    plural: 'Fairs',   color: '#2b6d9a' },
        meetup: { name: 'Meetup',  plural: 'Meetups', color: '#1f8f4e' },
        popup:  { name: 'Pop-up',  plural: 'Pop-ups', color: '#b23b3b' }
    };
    var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var MONF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var DOWF = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function shift(days) { var x = today(); x.setDate(x.getDate() + days); return iso(x); }
    function read(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
    function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

    // Curated physical events. Dates are relative to today so the calendar always
    // has something behind and ahead of it.
    function curated() {
        return [
            { id: 'e1',  title: 'Vintage Flea Market',   date: shift(-40), type: 'market', time: '10:00–18:00', place: 'Dizengoff Sq, Tel Aviv',  blurb: 'Two hundred stalls of pre-loved clothing, records and homeware under the square’s trees.' },
            { id: 'e2',  title: 'Makers Meetup',         date: shift(-19), type: 'meetup', time: '19:00',       place: 'Jaffa Port',              blurb: 'An evening for independent sellers to swap tips on sourcing, pricing and photographing pieces.' },
            { id: 'e3',  title: 'Weekend Craft Fair',    date: shift(-5),  type: 'fair',   time: '09:00–15:00', place: 'Sarona Market',           blurb: 'Handmade ceramics, prints and textiles from local studios.' },
            { id: 'e4',  title: 'Rooftop Pop-up',        date: shift(3),   type: 'popup',  time: '17:00–22:00', place: 'Florentin, Tel Aviv',     blurb: 'Five moravchick sellers take over a rooftop for one evening of curated vintage and music.' },
            { id: 'e5',  title: 'Winter Design Market',  date: shift(8),   type: 'market', time: '10:00–20:00', place: 'Habima Sq, Tel Aviv',     blurb: 'Designers and collectors bring their winter edits — coats, knitwear and pieces for the home.' },
            { id: 'e9',  title: 'Denim & Leather Swap',  date: shift(8),   type: 'popup',  time: '12:00–16:00', place: 'Levinsky Market',         blurb: 'Bring one, take one: a swap table for denim and leather, with a repair corner.' },
            { id: 'e6',  title: 'Designers Meetup',      date: shift(15),  type: 'meetup', time: '18:30',       place: 'Herzliya Marina',         blurb: 'Meet the people behind the shops — short talks, then drinks by the water.' },
            { id: 'e7',  title: 'Artisans Fair',         date: shift(26),  type: 'fair',   time: '10:00–17:00', place: 'Ramat Gan Park',          blurb: 'Craft, art and one-of-a-kind pieces across the park’s lawns.' },
            { id: 'e10', title: 'Archive Sample Sale',   date: shift(33),  type: 'popup',  time: '11:00–19:00', place: 'Neve Tzedek',             blurb: 'Past-season pieces from moravchick’s archive collection at sample-sale prices.' },
            { id: 'e8',  title: 'Vintage Flea Market',   date: shift(40),  type: 'market', time: '10:00–18:00', place: 'Dizengoff Sq, Tel Aviv',  blurb: 'Two hundred stalls of pre-loved clothing, records and homeware under the square’s trees.' }
        ];
    }
    function hosted() { var u = read('vero_events', []); return Array.isArray(u) ? u : []; }
    function sortKey(e) { return e.date + ' ' + (e.time || ''); }
    function all() { return curated().concat(hosted()).sort(function (a, b) { return sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0; }); }
    function on(day) { return all().filter(function (e) { return e.date === day; }); }
    function upcoming(n) { var t = iso(today()); var l = all().filter(function (e) { return e.date >= t; }); return n ? l.slice(0, n) : l; }
    function byId(id) { var l = all(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }

    function addHosted(e) { var u = hosted(); u.push(e); return write('vero_events', u); }
    function removeHosted(id) {
        write('vero_events', hosted().filter(function (u) { return u.id !== id; }));
        var b = booths(); if (b[id]) { delete b[id]; write('vero_event_booths', b); }
    }

    // A seller's booth reservations: { eventId: { products: [names], ... } }.
    function booths() { var b = read('vero_event_booths', {}); return b && typeof b === 'object' ? b : {}; }
    function setBooth(id, data) { var b = booths(); if (data) b[id] = data; else delete b[id]; return write('vero_event_booths', b); }

    // Who is coming: a few demo sellers per event (stable per event), plus you if
    // you booked a booth.
    var SELLERS = [
        { name: 'Studio Noir',   cat: 'Fashion boutique' },
        { name: 'Vintage Vault', cat: 'Vintage' },
        { name: 'Knit & Co',     cat: 'Clothing' },
        { name: 'Sole Society',  cat: 'Footwear' },
        { name: 'Atelier V',     cat: 'Fashion boutique' },
        { name: 'Bloom & Co',    cat: 'Accessories' },
        { name: 'Canvas Home',   cat: 'Art & home' }
    ];
    function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function shopName() { var s = read('vero_store_config', {}) || {}; return s.name || 'Your shop'; }
    function attendees(e) {
        var h = hash(e.id || e.title), n = 2 + (h % 4), out = [];
        for (var i = 0; i < n; i++) out.push(SELLERS[(h + i * 3) % SELLERS.length]);
        var b = booths()[e.id];
        if (b) out.unshift({ name: shopName(), cat: b.category || 'Fashion boutique', you: true, items: (b.products || []).length });
        return out;
    }

    // "Add to calendar": an all-day or timed .ics event the phone's calendar opens.
    function ics(e) {
        var d = e.date.replace(/-/g, ''), m = /^(\d{1,2}):(\d{2})(?:\s*[–-]\s*(\d{1,2}):(\d{2}))?/.exec(e.time || '');
        var pad = function (x) { return String(x).padStart(2, '0'); };
        var start, end;
        if (m) {
            start = 'DTSTART:' + d + 'T' + pad(m[1]) + m[2] + '00';
            end = m[3] ? 'DTEND:' + d + 'T' + pad(m[3]) + m[4] + '00' : 'DTEND:' + d + 'T' + pad((+m[1] + 2) % 24) + m[2] + '00';
        } else {
            var n = parse(e.date); n.setDate(n.getDate() + 1);
            start = 'DTSTART;VALUE=DATE:' + d; end = 'DTEND;VALUE=DATE:' + iso(n).replace(/-/g, '');
        }
        var txt = function (s) { return String(s || '').replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n'); };
        return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//moravchick//events//EN', 'BEGIN:VEVENT',
            'UID:' + (e.id || hash(e.title)) + '@moravchick', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
            start, end, 'SUMMARY:' + txt(e.title), e.place ? 'LOCATION:' + txt(e.place) : '', e.blurb ? 'DESCRIPTION:' + txt(e.blurb) : '',
            'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    }
    function downloadIcs(e) {
        var url = URL.createObjectURL(new Blob([ics(e)], { type: 'text/calendar' }));
        var a = document.createElement('a'); a.href = url; a.download = (e.title || 'event').replace(/[^\w]+/g, '-').toLowerCase() + '.ics';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }
    // "I'm going": the events you said you'd come to, { eventId: savedAt }.
    function goingMap() { var g = read('vero_event_going', {}); return g && typeof g === 'object' ? g : {}; }
    function isGoing(id) { return !!goingMap()[id]; }
    function setGoing(id, on) { var g = goingMap(); if (on) g[id] = Date.now(); else delete g[id]; return write('vero_event_going', g); }
    // A steady demo crowd per event (none yet for one you host), plus you.
    function goingCount(e) {
        var base = e.own ? 0 : 14 + (hash('going' + (e.id || e.title)) % 70);
        return base + (isGoing(e.id) || e.own ? 1 : 0);
    }
    function mine() { return all().filter(function (e) { return e.own || isGoing(e.id); }); }
    // A starter "going" list, once: the next two events, so My events never opens empty.
    (function seedGoing() {
        try {
            if (localStorage.getItem('vero_event_going_seeded') || Object.keys(goingMap()).length) return;
            var g = {}; upcoming(2).forEach(function (e) { g[e.id] = Date.now(); });
            write('vero_event_going', g); localStorage.setItem('vero_event_going_seeded', '1');
        } catch (e) {}
    })();

    function mapsUrl(e) { return 'https://maps.google.com/?q=' + encodeURIComponent(e.place || e.title); }

    window.veroEvents = {
        TYPES: TYPES, MON: MON, MONF: MONF, DOW: DOW, DOWF: DOWF,
        today: today, iso: iso, parse: parse,
        all: all, on: on, upcoming: upcoming, byId: byId,
        addHosted: addHosted, removeHosted: removeHosted,
        booths: booths, setBooth: setBooth, attendees: attendees,
        ics: ics, downloadIcs: downloadIcs, mapsUrl: mapsUrl,
        isGoing: isGoing, setGoing: setGoing, goingCount: goingCount, mine: mine
    };
})();
