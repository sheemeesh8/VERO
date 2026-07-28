/* ==========================================================================
   VERO — The Closet / The Gallery Magazine
   A mode-aware editorial, composed ONLY from items that exist on the site
   (featuredProducts + the category index). Minimalist black-and-white layout
   in the spirit of a print fashion/art magazine: big serif display type,
   numbered features, image plates, pull quotes, a contents page and
   contributors. Self-contained — injects its own styles and overlay.
   ========================================================================== */
(function () {
    'use strict';

    // ---- Styles (scoped under .mag-root) -----------------------------------
    const CSS = `
    .mag-root {
        position: fixed; inset: 0; z-index: 700; background: #ffffff;
        color: #111; overflow-y: auto; overflow-x: hidden; display: none;
        font-family: 'Inter','Helvetica Neue',Arial,sans-serif;
        -webkit-font-smoothing: antialiased; direction: ltr;
    }
    .mag-root.open { display: block; animation: magFade .45s ease both; }
    @keyframes magFade { from { opacity: 0 } to { opacity: 1 } }

    .mag-close {
        position: fixed; top: 22px; right: 24px; z-index: 6; width: 46px; height: 46px;
        border-radius: 50%; border: 1px solid #111; background: #fff; color: #111;
        font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, color .2s;
    }
    .mag-close:hover { background: #111; color: #fff; }

    .mag-serif { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
    .mag-kicker { font-size: 11px; letter-spacing: 3.5px; text-transform: uppercase; color: #111; font-weight: 600; }
    .mag-muted { color: #7c7c7c; }

    .mag-page { max-width: none; margin: 0 auto; padding: clamp(56px,9vh,120px) clamp(28px,5vw,110px); box-sizing: border-box; }
    .mag-rule { height: 1px; background: #111; width: 100%; }
    .mag-rule.thin { background: #dcdcdc; }

    /* Grayscale image plate — the emoji stands in for the shoot. */
    .mag-plate {
        position: relative; background: #ededeb; display: flex; align-items: center; justify-content: center;
        overflow: hidden; filter: contrast(1.02);
    }
    .mag-plate .glyph { font-size: clamp(90px,16vw,190px); line-height: 1; filter: none; opacity: .92; }
    .mag-plate .plate-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.03); }
    .mag-plate.tall { aspect-ratio: 3/4; }
    .mag-plate.wide { aspect-ratio: 4/3; }
    .mag-plate.sq { aspect-ratio: 1/1; }
    .mag-plate .plate-tag {
        position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 16px;
        background: linear-gradient(0deg, rgba(0,0,0,.55), transparent);
        color: #fff; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    }

    /* --- Cover --- */
    .mag-cover { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .mag-cover .cov-left { padding: clamp(40px,6vw,84px); display: flex; flex-direction: column; justify-content: space-between; border-right: 1px solid #111; }
    .mag-cover .cov-topbar { display: flex; justify-content: space-between; align-items: baseline; }
    .mag-cover h1 { font-size: clamp(52px,8vw,112px); line-height: .92; margin: 0; font-weight: 500; letter-spacing: -1px; }
    .mag-cover h1 .sub { display: block; font-size: clamp(20px,2.6vw,34px); letter-spacing: 8px; font-weight: 400; margin-top: 10px; }
    .mag-cover .cov-right { position: relative; background: #ededeb; }
    .mag-cover .cov-right .glyph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(120px,22vw,300px); filter: none; }
    .mag-cover .cov-tag { position: absolute; z-index: 1; bottom: 26px; left: 26px; right: 26px; color: #111; }

    /* --- Contents --- */
    .mag-contents .con-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(30px,5vw,70px); align-items: start; }
    .mag-contents h2 { font-size: clamp(40px,6vw,84px); margin: 0 0 30px; font-weight: 500; }
    .con-item { display: flex; gap: 18px; padding: 16px 0; border-top: 1px solid #e2e2e2; align-items: baseline; }
    .con-item:last-child { border-bottom: 1px solid #e2e2e2; }
    .con-num { font-size: 13px; color: #111; min-width: 34px; font-weight: 700; }
    .con-title { font-size: 19px; font-weight: 500; }
    .con-page { margin-left: auto; font-size: 13px; color: #7c7c7c; }

    /* --- Statement --- */
    .mag-statement { text-align: center; }
    .mag-statement .q { font-size: clamp(26px,4vw,52px); line-height: 1.28; font-weight: 500; max-width: 20ch; margin: 26px auto; }

    /* --- Feature spread --- */
    .mag-feature .feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px,5vw,64px); align-items: center; }
    .mag-feature.flip .feat-grid { direction: rtl; }
    .mag-feature.flip .feat-grid > * { direction: ltr; }
    .feat-num { font-size: clamp(64px,9vw,132px); line-height: .8; font-weight: 500; color: #111; margin-bottom: 8px; }
    .feat-title { font-size: clamp(30px,4.4vw,58px); line-height: 1.02; margin: 10px 0 16px; font-weight: 500; }
    .feat-body { font-size: 15px; line-height: 1.75; color: #333; max-width: 42ch; }
    .feat-specs { list-style: none; padding: 0; margin: 24px 0 0; }
    .feat-specs li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #e6e6e6; font-size: 13px; }
    .feat-specs li span:first-child { letter-spacing: 2px; text-transform: uppercase; color: #8a8a8a; font-size: 11px; }
    .feat-price { font-size: 22px; font-weight: 600; margin-top: 22px; }

    /* --- Pull quote --- */
    .mag-pull { text-align: center; }
    .mag-pull .mark { font-size: 90px; line-height: .5; }
    .mag-pull .pq { font-size: clamp(24px,3.4vw,44px); line-height: 1.3; font-weight: 500; max-width: 24ch; margin: 10px auto 18px; }
    .mag-pull .by { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #7c7c7c; }

    /* --- Collection grid --- */
    .mag-collection h2 { font-size: clamp(34px,5vw,72px); margin: 0 0 6px; font-weight: 500; }
    .col-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: clamp(14px,2vw,26px); margin-top: 34px; }
    .col-card .cap { display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; font-size: 12px; }
    .col-card .cap .nm { font-weight: 600; }
    .col-card .cap .dc { color: #8a8a8a; text-align: right; }

    /* --- Contributors --- */
    .mag-contrib h2 { font-size: clamp(30px,4.5vw,60px); margin: 0 0 30px; font-weight: 500; }
    .contrib-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: clamp(16px,2.5vw,34px); }
    .contrib-card .sq2 { aspect-ratio: 1/1; background: #ededeb; display: flex; align-items: center; justify-content: center; font-size: 46px; filter: none; }
    .contrib-card .nm { margin-top: 12px; font-weight: 600; font-size: 14px; }
    .contrib-card .rl { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8a8a8a; margin-top: 3px; }

    /* --- Full-bleed editorial photo page --- */
    .mag-photo { position: relative; width: 100%; height: 88vh; overflow: hidden; background: #ededeb; }
    .mag-photo-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.04); }
    .mag-photo-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: clamp(28px,5vw,72px);
        background: linear-gradient(0deg, rgba(0,0,0,.6), transparent 65%); color: #fff; }
    .mag-photo-cap .mag-kicker.light { color: #fff; opacity: .85; }
    .mag-photo-line { font-size: clamp(30px,5vw,72px); line-height: 1.02; font-weight: 500; margin: 10px 0 0; max-width: 22ch; }

    /* --- The Edit (big product grid) --- */
    .mag-edit h2 { font-size: clamp(34px,5vw,72px); margin: 0 0 6px; font-weight: 500; }
    .edit-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: clamp(16px,2vw,30px); margin-top: 34px; }
    .edit-card { margin: 0; }
    .edit-card figcaption { margin-top: 12px; }
    .edit-card .ec-name { font-size: 17px; font-weight: 500; line-height: 1.2; }
    .edit-card .ec-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-top: 6px; }
    .edit-card .ec-price { font-size: 13px; font-weight: 600; }

    /* Tappable seller name */
    .mag-brand {
        border: none; background: none; padding: 0; cursor: pointer; font: inherit;
        color: #111; text-decoration: underline; text-decoration-thickness: 1px;
        text-underline-offset: 3px; text-decoration-color: #b5b5b5; transition: text-decoration-color .2s;
    }
    .mag-brand:hover { text-decoration-color: #111; }

    /* Brand-fact popup */
    .mag-pop { position: fixed; inset: 0; z-index: 720; display: none; }
    .mag-pop.open { display: block; animation: magFade .25s ease both; }
    .mag-pop-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.55); }
    .mag-pop-card {
        position: relative; z-index: 1; background: #fff; color: #111; max-width: 460px; width: calc(100% - 48px);
        margin: 16vh auto 0; padding: 34px 34px 38px; border: 1px solid #111;
        box-shadow: 0 30px 80px rgba(0,0,0,.3); animation: magPopIn .3s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes magPopIn { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
    .mag-pop-card h3 { font-size: 34px; font-weight: 500; margin: 8px 0 0; }
    .mag-pop-x { position: absolute; top: 14px; right: 16px; border: none; background: none; font-size: 18px; cursor: pointer; color: #111; }
    .mag-pop-fact { font-size: 15.5px; line-height: 1.75; color: #333; margin: 0; }

    /* --- Back cover --- */
    .mag-back { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-top: 1px solid #111; }
    .mag-back .bk { font-size: clamp(40px,7vw,96px); font-weight: 500; letter-spacing: 6px; }

    @media (max-width: 820px) {
        .mag-cover { grid-template-columns: 1fr; }
        .mag-cover .cov-left { border-right: none; border-bottom: 1px solid #111; min-height: 60vh; }
        .mag-cover .cov-right { min-height: 46vh; }
        .mag-contents .con-grid,
        .mag-feature .feat-grid { grid-template-columns: 1fr; }
        .mag-feature.flip .feat-grid { direction: ltr; }
        .col-grid { grid-template-columns: repeat(2,1fr); }
        .contrib-grid { grid-template-columns: repeat(2,1fr); }
        .edit-grid { grid-template-columns: repeat(2,1fr); }
    }

    /* ===== Layouts 2-6: a shared 12-column editorial grid ===== */
    /* Each layout page reads as a full magazine spread — it fills (near) the
       whole viewport, with its grid centred vertically. */
    .mag-l { min-height: 90vh; display: flex; flex-direction: column; justify-content: center; }
    .mag-l-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: clamp(16px,2vw,36px); align-items: start; width: 100%; }
    .mag-l .mag-plate { border-radius: 0; }
    /* Cap plate height so a full-width image never fills the whole screen —
       it stays in normal desktop proportions. */
    .mag-l-plate { position: relative; background: #b8b8b8; overflow: hidden; max-height: 66vh; }
    .mag-l-plate .glyph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(60px,10vw,150px); color: rgba(0,0,0,.18); }
    .mag-l-plate img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .mag-l-body { font-size: 13px; line-height: 1.85; color: #333; margin: 0 0 14px; }
    .mag-l-body + .mag-l-body { margin-top: 0; }
    .mag-l-cols { column-count: 2; column-gap: clamp(20px,3vw,44px); }
    .mag-l-cols .mag-l-body { break-inside: avoid; }
    .mag-l-kicker { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #111; font-weight: 700; display: block; margin: 0 0 10px; }
    .mag-l-title { font-size: clamp(22px,3vw,40px); font-weight: 500; line-height: 1.12; margin: 0 0 18px; }
    .mag-l-foot { grid-column: 1 / -1; display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #9a9a9a; border-top: 1px solid #e2e2e2; margin-top: clamp(24px,4vh,50px); padding-top: 12px; }
    /* per-page placement helpers */
    .gc-1-7  { grid-column: 1 / 7; }
    .gc-7-13 { grid-column: 7 / 13; }
    .gc-1-6  { grid-column: 1 / 6; }
    .gc-6-13 { grid-column: 6 / 13; }
    .gc-1-8  { grid-column: 1 / 8; }
    .gc-8-13 { grid-column: 8 / 13; }
    .gc-1-13 { grid-column: 1 / 13; }
    .gc-1-5  { grid-column: 1 / 5; }
    .gc-5-13 { grid-column: 5 / 13; }
    .ar-tall { aspect-ratio: 3/4; }
    .ar-wide { aspect-ratio: 16/10; }
    .ar-sq   { aspect-ratio: 1/1; }
    .ar-big  { aspect-ratio: 4/3; }

    @media (max-width: 820px) {
        .mag-l-grid { grid-template-columns: 1fr; }
        .mag-l-grid > * { grid-column: 1 / -1 !important; }
        .mag-l-cols { column-count: 1; }
    }
    `;

    function ensureStyles() {
        if (document.getElementById('magStyles')) return;
        const s = document.createElement('style');
        s.id = 'magStyles';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    // ---- Data composition (reads live site globals at call time) -----------
    function pick(name) { try { return eval(name); } catch (e) { return undefined; } }

    function getData(mode) {
        const isArt = mode === 'art';
        const featured = (pick('featuredProducts') || []);
        const items = featured.filter(p => p.type === (isArt ? 'art' : 'clothing'));
        const collections = (isArt ? pick('artCategories') : pick('clothingCategories')) || [];
        // The full site catalogue — the "lots of products" behind the big edit grid.
        const catalog = (isArt ? pick('artProducts') : pick('clothingProducts')) || [];
        return {
            isArt,
            masthead: isArt ? 'THE GALLERY' : 'THE CLOSET',
            edition: isArt ? 'The VERO editorial on collectible art' : 'The VERO editorial on second-hand fashion',
            statement: isArt
                ? 'Every piece has a maker, a moment and a next home. This is where we write about the work and the hands behind it.'
                : 'Clothes carry stories. We follow the pieces from one wardrobe to the next — and the people who choose to pass them on.',
            items,
            collections,
            catalog,
            // The same editorial image the feed's magazine slide uses.
            coverImg: isArt ? 'gallery-hero.jpg' : 'magazine-hero.jpg',
            // Real editorial photographs already in the project — cycled through the
            // feature plates so the issue reads like a shot magazine (emoji fallback).
            heroImgs: isArt
                ? ['gallery-hero.jpg', 'art-hero.png', 'magazine-hero.jpg']
                : ['men-hero.jpg', 'women-hero.jpg', 'hero-beach.jpg', 'clothing-hero.png', 'magazine-hero.jpg'],
        };
    }

    // ---- Page builders ------------------------------------------------------
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // Facts about the clothing companies behind the pieces — shown in a popup
    // when a seller's name is tapped anywhere in the issue.
    const BRAND_FACTS = {
        'Nike': 'Founded 1964 as Blue Ribbon Sports. The Swoosh was designed in 1971 by student Carolyn Davidson — for a flat $35.',
        'Adidas': 'Founded 1949 by Adi Dassler in Bavaria. Its three stripes were bought from Finnish brand Karhu in 1952 for two bottles of whisky.',
        'Zara': 'Founded 1975 in Galicia by Amancio Ortega. It can take a design from sketch to store shelf in roughly two to three weeks.',
        'H&M': 'Opened 1947 in Sweden as “Hennes” (women only). It became Hennes & Mauritz after buying a hunting-and-fishing store in 1968.',
        "Levi's": 'Founded 1853. In 1873 Levi Strauss and tailor Jacob Davis patented copper-riveted work trousers — the first blue jeans.',
        'Ralph Lauren': 'Founded 1967. Ralph Lauren began by selling neckties, and named his label “Polo” for the sport’s air of prestige.',
        'Calvin Klein': 'Founded 1968 in New York. Its stark, minimalist advertising in the 1980s–90s made the logo waistband a cultural icon.',
        'Supreme': 'Founded 1994 as a downtown NYC skate shop. Its red box logo and weekly “drops” built one of streetwear’s biggest resale markets.',
        'Tommy Hilfiger': 'Founded 1985. Hilfiger’s red-white-and-blue flag logo made preppy American style a 1990s hip-hop staple.',
        'Burberry': 'Founded 1856 by 21-year-old Thomas Burberry, who invented weatherproof gabardine — the fabric of the classic trench coat.',
        'Lacoste': 'Founded 1933 by tennis champion René Lacoste, nicknamed “the Crocodile.” He helped invent the modern piqué polo shirt.',
        'Diesel': 'Founded 1978 in Italy by Renzo Rosso. The name was chosen as an “alternative fuel” — a word that reads the same worldwide.',
        'Carhartt': 'Founded 1889 in Detroit making overalls for railroad workers. Its heavy-duty workwear later became a streetwear staple.',
        'The North Face': 'Founded 1966 in San Francisco. It’s named for the coldest, most unforgiving face of a mountain in the northern hemisphere.',
        "Arc'teryx": 'Founded 1989 near Vancouver. It’s named after Archaeopteryx, the first known feathered dinosaur to take to the air.',
        'Hugo Boss': 'Founded 1924 in Metzingen, Germany. Today it’s best known for sharp tailoring and menswear suiting.',
        'Stüssy': 'Began in the early 1980s when surfer Shawn Stussy scrawled his name on boards and tees — a founding label of streetwear.',
        'COS': 'Short for “Collection of Style,” launched in 2007 by the H&M group as its minimalist, design-led line.',
        'Massimo Dutti': 'Founded 1985 and now part of Inditex, the same group as Zara — known for understated tailored basics.',
        'AllSaints': 'A British label founded 1994 in London, recognised for its dark, edgy leather-and-denim aesthetic.',
        'Rick Owens': 'The American designer’s avant-garde label, based in Paris, is known for a draped, monochrome “glunge” look.',
        'Free People': 'A US bohemian brand founded 1984, part of the URBN group alongside Urban Outfitters and Anthropologie.',
        'Zimmermann': 'An Australian label founded 1991 by sisters Nicky and Simone Zimmermann, famous for romantic resort dresses.',
        'Juicy Couture': 'Founded 1997 in Los Angeles. Its velour tracksuit became the defining Y2K status symbol.',
        'Hugo': 'Part of Hugo Boss — the younger, more contemporary line.',
        'Lacoste ': 'Founded 1933 by tennis champion René Lacoste.',
    };

    // A grayscale image plate with an emoji fallback (photo layered over the glyph;
    // if the photo 404s it hides itself and the glyph shows through).
    function plate(icon, opts) {
        opts = opts || {};
        const img = opts.img
            ? `<img class="plate-img" src="${esc(opts.img)}" alt="" onerror="this.style.display='none'">` : '';
        const tag = opts.tag ? `<span class="plate-tag">${esc(opts.tag)}</span>` : '';
        return `<div class="mag-plate ${opts.cls || 'tall'}"><span class="glyph">${esc(icon)}</span>${img}${tag}</div>`;
    }

    // A tappable seller name (data-brand drives the delegated popup handler).
    function brandChip(name) {
        if (!name) return '';
        return `<button type="button" class="mag-brand" data-brand="${esc(name)}">${esc(name)}</button>`;
    }

    function cover(d) {
        const hero = d.items[0] || { icon: d.isArt ? '🎨' : '👕' };
        return `
        <section class="mag-cover">
            <div class="cov-left">
                <div class="cov-topbar">
                    <span class="mag-kicker">Issue 01 · 2025</span>
                    <span class="mag-kicker">VERO</span>
                </div>
                <h1 class="mag-serif">${esc(d.masthead)}<span class="sub">MAGAZINE</span></h1>
                <div>
                    <div class="mag-rule" style="margin-bottom:16px"></div>
                    <p class="mag-muted" style="max-width:34ch;font-size:14px;line-height:1.7;margin:0">${esc(d.edition)}. Composed entirely from pieces currently on VERO.</p>
                </div>
            </div>
            <div class="cov-right">
                <div class="glyph">${esc(hero.icon)}</div>
                <div class="cov-tag mag-kicker">${esc(hero.name || 'The Feature')}</div>
            </div>
        </section>`;
    }

    function contents(d) {
        const rows = [];
        // Styles first (the clothing collections), then the individual items.
        d.collections.slice(0, 6).forEach((c) => rows.push({ t: c.name + ' — Collection' }));
        d.items.forEach((it) => rows.push({ t: it.name }));
        // Number and paginate sequentially in the final order.
        rows.forEach((r, i) => { r.n = i + 1; r.p = (i + 1) * 6 + 2; });
        return `
        <section class="mag-page mag-contents">
            <div class="con-grid">
                <div>
                    <span class="mag-kicker">In this issue</span>
                    <h2 class="mag-serif">Contents</h2>
                    ${rows.map(r => `
                        <div class="con-item">
                            <span class="con-num">${String(r.n).padStart(2, '0')}</span>
                            <span class="con-title mag-serif">${esc(r.t)}</span>
                            <span class="con-page">P. ${r.p}</span>
                        </div>`).join('')}
                </div>
                <div>
                    <div class="mag-plate tall"><span class="glyph">${esc((d.items[1] || d.items[0] || {}).icon || '◼')}</span>
                        <span class="plate-tag">${esc((d.items[1] || d.items[0] || {}).category || '')}</span></div>
                </div>
            </div>
        </section>`;
    }

    function statement(d) {
        return `
        <section class="mag-page mag-statement">
            <span class="mag-kicker">Editor's Note</span>
            <p class="q mag-serif">${esc(d.statement)}</p>
            <div class="mag-rule thin" style="max-width:120px;margin:0 auto"></div>
        </section>`;
    }

    // A standalone full-bleed editorial photograph — its own page, never over a product.
    function photoSpread(img, kicker, line) {
        return `
        <section class="mag-photo">
            <img class="mag-photo-img" src="${esc(img)}" alt="" onerror="this.closest('.mag-photo').remove()">
            <div class="mag-photo-cap">
                <span class="mag-kicker light">${esc(kicker)}</span>
                <p class="mag-photo-line mag-serif">${esc(line)}</p>
            </div>
        </section>`;
    }

    function feature(it, index, d) {
        const flip = index % 2 === 1;
        const specs = [
            ['Category', it.category], ['Colour', it.color], ['Material', it.material], ['Size', it.size],
            ['Seller', it.brand ? brandChip(it.brand) : '', true],   // value is raw HTML
        ].filter(s => s[1]);
        return `
        <section class="mag-page mag-feature${flip ? ' flip' : ''}">
            <div class="feat-grid">
                <div class="mag-plate tall"><span class="glyph">${esc(it.icon)}</span>
                    <span class="plate-tag">${esc(it.brand || '')}</span></div>
                <div>
                    <span class="mag-kicker">${esc(d.isArt ? 'The Work' : 'The Piece')} · ${esc(it.category || '')}</span>
                    <div class="feat-num mag-serif">${String(index + 1).padStart(2, '0')}</div>
                    <h3 class="feat-title mag-serif">${esc(it.name)}</h3>
                    <p class="feat-body">${esc(it.desc || '')}</p>
                    <ul class="feat-specs">
                        ${specs.map(s => `<li><span>${esc(s[0])}</span><span>${s[2] ? s[1] : esc(s[1])}</span></li>`).join('')}
                    </ul>
                    <div class="feat-price mag-serif">${esc(it.price || '')}</div>
                </div>
            </div>
        </section>`;
    }

    function pull(d) {
        const it = d.items[0] || {};
        const line = d.isArt
            ? 'A work chosen, not bought — it changes the room it lives in.'
            : 'The best wardrobe is one that has already lived a little.';
        return `
        <section class="mag-page mag-pull">
            <div class="mark mag-serif">“</div>
            <p class="pq mag-serif">${esc(line)}</p>
            <div class="by">${esc(it.brand || 'VERO')}</div>
        </section>`;
    }

    function collection(d) {
        const cards = d.collections.slice(0, 9);
        return `
        <section class="mag-page mag-collection">
            <span class="mag-kicker">${d.isArt ? 'The Gallery' : 'The Closet'} · 2025</span>
            <h2 class="mag-serif">The Collection</h2>
            <p class="mag-muted" style="max-width:44ch;font-size:14px;line-height:1.7">Every aisle on VERO, at a glance — the worlds these pieces come from.</p>
            <div class="col-grid">
                ${cards.map(c => `
                    <div class="col-card">
                        <div class="mag-plate sq"><span class="glyph" style="font-size:clamp(56px,8vw,110px)">${esc(c.icon)}</span></div>
                        <div class="cap"><span class="nm">${esc(c.name)}</span><span class="dc">${esc(c.desc || '')}</span></div>
                    </div>`).join('')}
            </div>
        </section>`;
    }

    // The big product spread — many real pieces from the catalogue, same B&W line.
    function theEdit(d) {
        const items = d.catalog.slice(0, 24);
        return `
        <section class="mag-page mag-edit">
            <span class="mag-kicker">${d.isArt ? 'Every work on VERO' : 'Every piece on VERO'}</span>
            <h2 class="mag-serif">The Edit</h2>
            <p class="mag-muted" style="max-width:46ch;font-size:14px;line-height:1.7">${items.length} pieces from the current catalogue — tap a seller to read about the house behind it.</p>
            <div class="edit-grid">
                ${items.map(it => `
                    <figure class="edit-card">
                        <div class="mag-plate tall"><span class="glyph">${esc(it.icon)}</span></div>
                        <figcaption>
                            <div class="ec-name mag-serif">${esc(it.name)}</div>
                            <div class="ec-meta">${brandChip(it.seller)}<span class="ec-price">${esc(it.price)}</span></div>
                        </figcaption>
                    </figure>`).join('')}
            </div>
        </section>`;
    }

    function contributors(d) {
        // "Contributors" = the sellers/brands behind the featured pieces.
        const seen = new Set(); const list = [];
        d.items.forEach(it => { if (it.brand && !seen.has(it.brand)) { seen.add(it.brand); list.push(it); } });
        return `
        <section class="mag-page mag-contrib">
            <span class="mag-kicker">Behind the issue</span>
            <h2 class="mag-serif">Contributors</h2>
            <div class="contrib-grid">
                ${list.map(it => `
                    <div class="contrib-card">
                        <div class="sq2">${esc(it.icon)}</div>
                        <div class="nm">${brandChip(it.brand)}</div>
                        <div class="rl">${esc(it.category || 'Seller')}</div>
                    </div>`).join('')}
            </div>
        </section>`;
    }

    function back(d) {
        return `
        <section class="mag-page mag-back">
            <span class="mag-kicker">${esc(d.masthead)} Magazine · Issue 01</span>
            <div class="bk mag-serif">VERO</div>
            <p class="mag-muted" style="font-size:13px;margin-top:14px">Every piece in this issue is available now on VERO.</p>
        </section>`;
    }

    // ---- Layout registry ----------------------------------------------------
    // The issue is composed of numbered layouts, rendered in order 1..N. Each
    // layout is a function(d) -> HTML string of one or more magazine pages.
    // Layout 1 is the original editorial design; layouts 2-6 are added below as
    // their wireframes come in, and the magazine "works by them" in numeric order.
    const LAYOUTS = {};

    LAYOUTS[1] = function (d) {
        const pages = [
            cover(d),
            contents(d),
            statement(d),
            ...d.items.map((it, i) => feature(it, i, d)),
            pull(d),
            collection(d),
            theEdit(d),
            contributors(d),
        ];
        return pages.join('\n<div class="mag-rule thin"></div>\n');
    };

    // ---- Helpers shared by layouts 2-6 -------------------------------------
    // The data for the issue currently rendering, so lBody can pull additional
    // real seller descriptions when a layout asks for more than one paragraph.
    let _md = null;
    // A grey editorial plate (photo over a glyph fallback) at a given column span
    // + aspect ratio.
    function lPlate(item, gc, ar) {
        item = item || {};
        const img = item.img ? `<img src="${esc(item.img)}" alt="" onerror="this.style.display='none'">` : '';
        return `<div class="mag-l-plate ${gc} ${ar}"><span class="glyph">${esc(item.icon || '◼')}</span>${img}</div>`;
    }
    // Body paragraphs built ONLY from the descriptions the sellers actually wrote
    // for their products. If a layout wants more paragraphs than this item has,
    // we fill from other items' real descriptions — never lorem.
    function lBody(item, n) {
        item = item || {};
        n = n || 1;
        const parts = [];
        if (item.desc) parts.push(item.desc);
        const pool = (_md && _md.items) || [];
        for (const it of pool) {
            if (parts.length >= n) break;
            if (it && it.desc && parts.indexOf(it.desc) === -1) parts.push(it.desc);
        }
        if (!parts.length) parts.push(`${item.name || 'This piece'} — available now on VERO.`);
        return parts.slice(0, n).map(t => `<p class="mag-l-body">${esc(t)}</p>`).join('');
    }
    function lFoot(d, page) {
        return `<div class="mag-l-foot"><span>${esc(d.masthead)} Magazine</span><span>Page ${page}</span><span>vero.style</span></div>`;
    }
    // Cycle through the issue's items so each layout shows different pieces.
    function lItem(d, i) { return d.items.length ? d.items[i % d.items.length] : {}; }

    // ---- Layout 2: image-lead — a large image beside a short text column, then
    // a wide image with three small plates and a caption column. ----
    LAYOUTS[2] = function (d) {
        return `
        <section class="mag-page mag-l mag-l2">
            <div class="mag-l-grid">
                ${lPlate(lItem(d, 0), 'gc-1-7', 'ar-tall')}
                <div class="gc-8-13">
                    <span class="mag-l-kicker">Feature 01</span>
                    <h2 class="mag-l-title mag-serif">${esc(lItem(d, 0).name || 'The Feature')}</h2>
                    ${lBody(lItem(d, 0), 2)}
                </div>
                ${lFoot(d, '02')}
            </div>
        </section>
        <section class="mag-page mag-l mag-l2">
            <div class="mag-l-grid">
                ${lPlate(lItem(d, 1), 'gc-1-8', 'ar-big')}
                ${lPlate(lItem(d, 2), 'gc-8-13', 'ar-tall')}
                <div class="gc-1-8"><div class="mag-l-cols">${lBody(lItem(d, 1), 2)}</div></div>
                <div class="gc-8-13">${lBody(lItem(d, 2), 1)}</div>
                ${lFoot(d, '03')}
            </div>
        </section>`;
    };

    // ---- Layout 3: split — a full-height image on one side, an editorial text
    // block on the other, then a dominant image with a small caption. ----
    LAYOUTS[3] = function (d) {
        return `
        <section class="mag-page mag-l mag-l3">
            <div class="mag-l-grid">
                ${lPlate(lItem(d, 3), 'gc-1-6', 'ar-tall')}
                <div class="gc-6-13">
                    <span class="mag-l-kicker">The Story</span>
                    <h2 class="mag-l-title mag-serif">${esc(lItem(d, 3).name || 'On Provenance')}</h2>
                    <div class="mag-l-cols">${lBody(lItem(d, 3), 3)}</div>
                </div>
                ${lFoot(d, '04')}
            </div>
        </section>
        <section class="mag-page mag-l mag-l3">
            <div class="mag-l-grid">
                ${lPlate(lItem(d, 4), 'gc-1-13', 'ar-wide')}
                <div class="gc-1-8">${lBody(lItem(d, 4), 1)}</div>
                <div class="gc-8-13"><span class="mag-l-kicker">Detail</span>${lBody(lItem(d, 5), 1)}</div>
                ${lFoot(d, '05')}
            </div>
        </section>`;
    };

    // ---- Layout 4: grid of four — a 2x2 plate grid with a running caption. ----
    LAYOUTS[4] = function (d) {
        return `
        <section class="mag-page mag-l mag-l4">
            <div class="mag-l-grid">
                <div class="gc-1-8">
                    <span class="mag-l-kicker">The Collection</span>
                    <h2 class="mag-l-title mag-serif">Four Ways</h2>
                    ${lBody(lItem(d, 0), 1)}
                </div>
                ${lPlate(lItem(d, 0), 'gc-1-7', 'ar-sq')}
                ${lPlate(lItem(d, 1), 'gc-7-13', 'ar-sq')}
                ${lPlate(lItem(d, 2), 'gc-1-7', 'ar-sq')}
                ${lPlate(lItem(d, 3), 'gc-7-13', 'ar-sq')}
                ${lFoot(d, '06')}
            </div>
        </section>
        <section class="mag-page mag-l mag-l4">
            <div class="mag-l-grid">
                ${lPlate(lItem(d, 4), 'gc-1-8', 'ar-big')}
                <div class="gc-8-13">
                    <span class="mag-l-kicker">In Detail</span>
                    ${lBody(lItem(d, 4), 2)}
                </div>
                ${lFoot(d, '07')}
            </div>
        </section>`;
    };

    // ---- Layout 5: editorial columns — two body columns beside a tall image. ----
    LAYOUTS[5] = function (d) {
        return `
        <section class="mag-page mag-l mag-l5">
            <div class="mag-l-grid">
                <div class="gc-1-8">
                    <span class="mag-l-kicker">Essay</span>
                    <h2 class="mag-l-title mag-serif">${esc(lItem(d, 2).name || 'A Second Life')}</h2>
                    <div class="mag-l-cols">${lBody(lItem(d, 2), 4)}</div>
                </div>
                ${lPlate(lItem(d, 2), 'gc-8-13', 'ar-tall')}
                ${lFoot(d, '08')}
            </div>
        </section>
        <section class="mag-page mag-l mag-l5">
            <div class="mag-l-grid">
                ${lPlate(lItem(d, 3), 'gc-1-6', 'ar-tall')}
                <div class="gc-6-13">
                    <span class="mag-l-kicker">Continued</span>
                    <div class="mag-l-cols">${lBody(lItem(d, 3), 3)}</div>
                </div>
                ${lFoot(d, '09')}
            </div>
        </section>`;
    };

    // ---- Layout 6: full-bleed feature — one dominant image with a lead text. ----
    LAYOUTS[6] = function (d) {
        return `
        <section class="mag-page mag-l mag-l6">
            <div class="mag-l-grid">
                <div class="gc-1-13">
                    <span class="mag-l-kicker">Closing Feature</span>
                    <h2 class="mag-l-title mag-serif">${esc(lItem(d, 1).name || 'The Last Word')}</h2>
                </div>
                ${lPlate(lItem(d, 1), 'gc-1-13', 'ar-wide')}
                <div class="gc-1-6">${lBody(lItem(d, 1), 1)}</div>
                <div class="gc-7-13">${lBody(lItem(d, 5), 1)}</div>
                ${lFoot(d, '10')}
            </div>
        </section>
        <section class="mag-page mag-l mag-l6">
            <div class="mag-l-grid">
                <div class="gc-1-6">
                    <span class="mag-l-kicker">Colophon</span>
                    <h2 class="mag-l-title mag-serif">${esc(d.masthead)}</h2>
                    ${lBody(lItem(d, 0), 2)}
                </div>
                ${lPlate(lItem(d, 0), 'gc-7-13', 'ar-tall')}
                ${lFoot(d, '11')}
            </div>
        </section>`;
    };

    // ---- Assemble + mount ---------------------------------------------------
    function render(mode) {
        const d = getData(mode);
        _md = d;   // so lBody can draw on the issue's real seller descriptions
        const nums = Object.keys(LAYOUTS).map(Number).sort((a, b) => a - b);
        return nums
            .map(n => `<div class="mag-layout" data-layout="${n}">${LAYOUTS[n](d)}</div>`)
            .join('\n<div class="mag-rule thin"></div>\n');
    }

    function openMagazine(mode) {
        ensureStyles();
        const m = mode || (typeof pick('currentCategory') !== 'undefined' ? pick('currentCategory') : 'clothing');
        let root = document.getElementById('magRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'magRoot';
            root.className = 'mag-root';
            document.body.appendChild(root);
        }
        root.innerHTML = `<button class="mag-close" aria-label="Close" onclick="closeMagazine()">✕</button>${render(m)}`;
        root.classList.add('open');
        root.scrollTop = 0;
        document.body.style.overflow = 'hidden';
        // One delegated handler for every tappable seller name in the issue.
        if (!root.dataset.brandBound) {
            root.addEventListener('click', e => {
                const b = e.target.closest('[data-brand]');
                if (b) magBrandPopup(b.getAttribute('data-brand'));
            });
            root.dataset.brandBound = '1';
        }
    }

    // Popup with a fact about the clothing company (same B&W editorial line).
    function magBrandPopup(name) {
        const fact = BRAND_FACTS[name] || `${name} is one of the houses whose pieces find a second life on VERO.`;
        let pop = document.getElementById('magBrandPop');
        if (!pop) {
            pop = document.createElement('div');
            pop.id = 'magBrandPop';
            pop.className = 'mag-pop';
            document.body.appendChild(pop);
        }
        pop.innerHTML = `
            <div class="mag-pop-backdrop" onclick="closeMagBrand()"></div>
            <div class="mag-pop-card" role="dialog" aria-modal="true">
                <button class="mag-pop-x" aria-label="Close" onclick="closeMagBrand()">✕</button>
                <span class="mag-kicker">The House</span>
                <h3 class="mag-serif">${esc(name)}</h3>
                <div class="mag-rule thin" style="margin:14px 0 18px"></div>
                <p class="mag-pop-fact">${esc(fact)}</p>
            </div>`;
        pop.classList.add('open');
    }
    function closeMagBrand() {
        const pop = document.getElementById('magBrandPop');
        if (pop) pop.classList.remove('open');
    }

    function closeMagazine() {
        const root = document.getElementById('magRoot');
        if (root) root.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.openMagazine = openMagazine;
    window.closeMagazine = closeMagazine;
    window.magBrandPopup = magBrandPopup;
    window.closeMagBrand = closeMagBrand;
})();
