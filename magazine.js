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

    .mag-page { max-width: 1120px; margin: 0 auto; padding: clamp(56px,9vh,120px) clamp(24px,6vw,72px); box-sizing: border-box; }
    .mag-rule { height: 1px; background: #111; width: 100%; }
    .mag-rule.thin { background: #dcdcdc; }

    /* Grayscale image plate — the emoji stands in for the shoot. */
    .mag-plate {
        position: relative; background: #ededeb; display: flex; align-items: center; justify-content: center;
        overflow: hidden; filter: grayscale(1) contrast(1.02);
    }
    .mag-plate .glyph { font-size: clamp(90px,16vw,190px); line-height: 1; filter: grayscale(1); opacity: .92; }
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
    .mag-cover .cov-right .glyph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: clamp(120px,22vw,300px); filter: grayscale(1); }
    .mag-cover .cov-tag { position: absolute; bottom: 26px; left: 26px; right: 26px; color: #111; }

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
    .contrib-card .sq2 { aspect-ratio: 1/1; background: #ededeb; display: flex; align-items: center; justify-content: center; font-size: 46px; filter: grayscale(1); }
    .contrib-card .nm { margin-top: 12px; font-weight: 600; font-size: 14px; }
    .contrib-card .rl { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8a8a8a; margin-top: 3px; }

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
        return {
            isArt,
            masthead: isArt ? 'THE GALLERY' : 'THE CLOSET',
            edition: isArt ? 'The VERO editorial on collectible art' : 'The VERO editorial on second-hand fashion',
            statement: isArt
                ? 'Every piece has a maker, a moment and a next home. This is where we write about the work and the hands behind it.'
                : 'Clothes carry stories. We follow the pieces from one wardrobe to the next — and the people who choose to pass them on.',
            items,
            collections,
        };
    }

    // ---- Page builders ------------------------------------------------------
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
        d.items.forEach((it, i) => rows.push({ n: i + 1, t: it.name, p: (i + 1) * 6 + 2 }));
        d.collections.slice(0, 6).forEach((c, i) => rows.push({ n: d.items.length + i + 1, t: c.name + ' — Collection', p: 40 + i * 4 }));
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

    function feature(it, index, d) {
        const flip = index % 2 === 1;
        const specs = [
            ['Category', it.category], ['Colour', it.color], ['Material', it.material], ['Size', it.size], ['Seller', it.brand],
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
                        ${specs.map(s => `<li><span>${esc(s[0])}</span><span>${esc(s[1])}</span></li>`).join('')}
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
                        <div class="nm">${esc(it.brand)}</div>
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

    // ---- Assemble + mount ---------------------------------------------------
    function render(mode) {
        const d = getData(mode);
        const pages = [
            cover(d),
            contents(d),
            statement(d),
            ...d.items.map((it, i) => feature(it, i, d)),
            pull(d),
            collection(d),
            contributors(d),
            back(d),
        ];
        return pages.join('\n<div class="mag-rule thin" style="max-width:1120px;margin:0 auto"></div>\n');
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
    }

    function closeMagazine() {
        const root = document.getElementById('magRoot');
        if (root) root.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.openMagazine = openMagazine;
    window.closeMagazine = closeMagazine;
})();
