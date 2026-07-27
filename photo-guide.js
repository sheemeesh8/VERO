/* ------------------------------------------------------------------
   VERO — Dynamic Category Photo Guide (FEATURE 2, native web component).

   A collapsible drawer that coaches the seller through photographing a piece.
   It shows three core tips (natural light, high-contrast background, safe 15%
   margins) plus the exact shot list for the CURRENT item category, and marks
   each required slot as done or still missing as photos come in.

   Framework-free: a <vero-photo-guide> custom element with its own shadow DOM,
   so it drops into the vanilla upload flow without touching global CSS. The
   same data + UX is also shipped as a React <PhotoGuide/> under /studio-engine.

   Usage:
     <script src="photo-guide.js"></script>
     <vero-photo-guide category="shoes" open></vero-photo-guide>

     const g = document.querySelector('vero-photo-guide');
     g.category = 'bags';     // swap the shot list when the category changes
     g.filled = 2;            // mark the first N required slots as done
     // or, precise control over which slots are done:
     g.setDone([0, 2]);
------------------------------------------------------------------ */
(function () {
    'use strict';

    // ---- Category schema (single source of truth for the native component) ----
    const VERO_PHOTO_GUIDE = {
        shoes: {
            title: 'נעליים',
            heroAngle: 'זווית 45° מורמת (הצד הראשי + החרטום)',
            tip: 'הנח נעל אחת מעט קדימה מהשנייה ליצירת נפח תלת-ממדי.',
            slots: ['תמונת שער (זווית 45°)', 'פרופיל צד מלא', 'סוליה תחתית', 'תווית מידה'],
        },
        tops: {
            title: 'חולצות שטוחות / טופים',
            heroAngle: 'פריסה שטוחה (Flat Lay) או תלייה על קולב עץ',
            tip: 'מתח את השרוולים בצורה סימטרית וודא שאין קמטים בולטים.',
            slots: ['חזית מלאה', 'גב החולצה', 'תווית מותג ומידה', 'תקריב בד'],
        },
        outerwear: {
            title: "מעילים וז'קטים",
            heroAngle: 'תלייה על קולב איכותי או רכוס מלא',
            tip: "צלם רכוס בתמונת השער, וצלם ז'קט פתוח בתמונה משנית להצגת הבטנה.",
            slots: ['חזית רכוסה', 'בטנה פנימית', 'רוכסן / כפתורים', 'תווית הרכב בד'],
        },
        bags: {
            title: 'תיקים ואביזרי עור',
            heroAngle: 'חזית ישרה בגובה העיניים',
            tip: 'מלא את התיק בנייר סופג/בד כדי שישמור על צורתו הטבעית ולא ייראה מעוך.',
            slots: ['חזית התיק', 'גב ותחתית', 'פנים התיק ותאים', 'מספר סידורי / אבזם'],
        },
        bottoms: {
            title: "מכנסיים וג'ינסים",
            heroAngle: 'פריסה שטוחה ישרה (Flat Lay)',
            tip: 'ישר את הרגליים בצורה מקבילה וצלם תקריב של הכפתור/רוכסן הראשי.',
            slots: ['חזית מלאה', 'גב וכיסים', 'תווית מידה במותן'],
        },
        accessories: {
            title: 'משקפיים ושעונים',
            heroAngle: 'תקריב זוויתי (Macro)',
            tip: 'הימנע מהשתקפות ישירה של תאורה או הפלאש על הזכוכית/מתכת.',
            slots: ['תקריב חזיתי', 'חריטת מותג / גב', 'אריזה / קופסה מקורית'],
        },
    };

    // The three core tips shown for every category.
    const VERO_CORE_TIPS = [
        { icon: '☀', title: 'תאורה טבעית', text: 'צלם ליד חלון באור יום רך, ללא פלאש ישיר.' },
        { icon: '◐', title: 'רקע בקונטרסט גבוה', text: 'רקע נקי ואחיד שמפריד את הפריט מהסביבה.' },
        { icon: '⧉', title: 'שוליים בטוחים (15%)', text: 'השאר כ-15% אוויר מסביב לפריט, בלי לחתוך קצוות.' },
    ];

    // Expose the schema so the rest of the site (and tests) can read it.
    window.VERO_PHOTO_GUIDE = VERO_PHOTO_GUIDE;

    const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="4 12 10 18 20 6"></polyline></svg>';

    const STYLE = `
        :host {
            display: block;
            direction: rtl;
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            color: #1a1a1a;
            --pg-accent: #004225;
            --pg-line: rgba(0,0,0,0.10);
            --pg-muted: #8a857c;
        }
        * { box-sizing: border-box; }
        .pg {
            border: 1px solid var(--pg-line);
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
        }
        .pg-head {
            width: 100%;
            display: flex; align-items: center; gap: 12px;
            padding: 16px 18px;
            background: none; border: none; cursor: pointer;
            font: inherit; text-align: right;
        }
        .pg-head .ic {
            width: 34px; height: 34px; flex: 0 0 auto;
            border-radius: 50%; background: #f2f1ee;
            display: grid; place-items: center; font-size: 17px;
        }
        .pg-head .tt { flex: 1; min-width: 0; }
        .pg-head .tt b { display: block; font-size: 15px; font-weight: 700; }
        .pg-head .tt span { display: block; font-size: 12px; color: var(--pg-muted); }
        .pg-head .count {
            font-size: 12px; font-weight: 700; color: var(--pg-accent);
            background: rgba(0,66,37,0.08); border-radius: 999px; padding: 4px 10px;
            flex: 0 0 auto;
        }
        .pg-head .chev {
            width: 18px; height: 18px; flex: 0 0 auto; color: var(--pg-muted);
            transition: transform 0.25s ease;
        }
        :host([open]) .pg-head .chev { transform: rotate(180deg); }

        .pg-body {
            display: grid; grid-template-rows: 0fr;
            transition: grid-template-rows 0.32s cubic-bezier(0.22,1,0.36,1);
        }
        :host([open]) .pg-body { grid-template-rows: 1fr; }
        .pg-body > .inner { overflow: hidden; }
        .pg-pad { padding: 4px 18px 20px; }

        .pg-hero {
            font-size: 13px; line-height: 1.6; color: #45413a;
            background: #faf9f7; border: 1px solid var(--pg-line);
            border-radius: 9px; padding: 12px 14px; margin-bottom: 16px;
        }
        .pg-hero b { color: #1a1a1a; }
        .pg-hero .tip { display: block; margin-top: 6px; color: var(--pg-muted); }

        .pg-core { display: flex; gap: 10px; margin-bottom: 18px; }
        .pg-core .c {
            flex: 1; border: 1px solid var(--pg-line); border-radius: 9px;
            padding: 12px 10px; text-align: center;
        }
        .pg-core .c .g { font-size: 18px; }
        .pg-core .c b { display: block; font-size: 12px; margin-top: 6px; }
        .pg-core .c span { display: block; font-size: 11px; color: var(--pg-muted); line-height: 1.45; margin-top: 3px; }

        .pg-slots-h {
            font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
            color: var(--pg-muted); font-weight: 700; margin-bottom: 10px;
        }
        .pg-slots { display: flex; flex-direction: column; gap: 8px; }
        .pg-slot {
            display: flex; align-items: center; gap: 12px;
            border: 1px solid var(--pg-line); border-radius: 9px;
            padding: 11px 13px; transition: background 0.2s, border-color 0.2s;
        }
        .pg-slot .dot {
            width: 22px; height: 22px; flex: 0 0 auto; border-radius: 50%;
            border: 1.5px dashed #cfccc4; display: grid; place-items: center;
            color: #fff;
        }
        .pg-slot .dot svg { width: 13px; height: 13px; fill: none; stroke: #fff;
            stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
        .pg-slot .lbl { flex: 1; font-size: 13.5px; }
        .pg-slot .num { font-size: 11px; color: var(--pg-muted); font-weight: 700; }
        .pg-slot.done {
            background: rgba(0,66,37,0.05); border-color: rgba(0,66,37,0.25);
        }
        .pg-slot.done .dot { border-style: solid; border-color: var(--pg-accent); background: var(--pg-accent); }
        .pg-slot.done .dot svg { opacity: 1; }
        .pg-slot.done .lbl { color: var(--pg-accent); }
    `;

    class VeroPhotoGuide extends HTMLElement {
        static get observedAttributes() { return ['category', 'filled', 'open']; }

        constructor() {
            super();
            this._done = new Set();
            this.attachShadow({ mode: 'open' });
        }

        connectedCallback() {
            if (!this.hasAttribute('category')) this.setAttribute('category', 'shoes');
            this.render();
        }

        attributeChangedCallback(name) {
            if (name === 'filled') {
                const n = parseInt(this.getAttribute('filled') || '0', 10) || 0;
                this._done = new Set(Array.from({ length: n }, (_, i) => i));
            }
            if (this.shadowRoot) this.render();
        }

        // ---- Public API ----
        get category() { return this.getAttribute('category') || 'shoes'; }
        set category(v) { this.setAttribute('category', v); }
        get filled() { return this._done.size; }
        set filled(n) { this.setAttribute('filled', String(n)); }
        setDone(indices) { this._done = new Set(indices || []); this.render(); }
        toggle(forceOpen) {
            const open = forceOpen === undefined ? !this.hasAttribute('open') : forceOpen;
            if (open) this.setAttribute('open', ''); else this.removeAttribute('open');
        }

        render() {
            const data = VERO_PHOTO_GUIDE[this.category] || VERO_PHOTO_GUIDE.shoes;
            const slots = data.slots;
            const doneCount = Array.from(this._done).filter(i => i < slots.length).length;

            const core = VERO_CORE_TIPS.map(t => `
                <div class="c"><span class="g">${t.icon}</span><b>${t.title}</b><span>${t.text}</span></div>
            `).join('');

            const slotRows = slots.map((label, i) => `
                <div class="pg-slot ${this._done.has(i) ? 'done' : ''}">
                    <span class="dot">${CHECK}</span>
                    <span class="lbl">${label}</span>
                    <span class="num">${String(i + 1).padStart(2, '0')}</span>
                </div>
            `).join('');

            this.shadowRoot.innerHTML = `
                <style>${STYLE}</style>
                <div class="pg">
                    <button class="pg-head" type="button" part="head">
                        <span class="ic">📸</span>
                        <span class="tt">
                            <b>מדריך צילום — ${data.title}</b>
                            <span>איך לצלם את הפריט הזה נכון</span>
                        </span>
                        <span class="count">${doneCount}/${slots.length}</span>
                        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="pg-body"><div class="inner"><div class="pg-pad">
                        <div class="pg-hero">
                            <b>זווית שער:</b> ${data.heroAngle}
                            <span class="tip">💡 ${data.tip}</span>
                        </div>
                        <div class="pg-core">${core}</div>
                        <div class="pg-slots-h">תמונות נדרשות</div>
                        <div class="pg-slots">${slotRows}</div>
                    </div></div></div>
                </div>
            `;
            this.shadowRoot.querySelector('.pg-head')
                .addEventListener('click', () => this.toggle());
        }
    }

    if (!customElements.get('vero-photo-guide')) {
        customElements.define('vero-photo-guide', VeroPhotoGuide);
    }
})();
