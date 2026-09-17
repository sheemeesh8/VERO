/* ------------------------------------------------------------------
   moravchick — Dynamic Category Photo Guide (FEATURE 2, native web component).

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
            title: 'Shoes',
            heroAngle: 'Both shoes together, from an angle 45° from above',
            tip: 'Place one shoe slightly ahead of the other — this gives depth, not a flat image "Flat".',
            slots: ['Main photo (angle 45°)', 'Full side', 'Bottom sole', 'Size label'],
            help: [
                'Both shoes together, from above at an angle 45°. This is the first photo people see, so it\'s sharp and well lit.',
                'One shoe from the side, Full length within the frame — shows the cut and the item\'s condition.',
                'Flip one shoe and photograph the sole — so the buyer sees how worn it is.',
                'Close-up of the label inside the shoe, where the size appears, so it\'s legible.',
            ],
        },
        tops: {
            title: 'Flat shirts / tops',
            heroAngle: 'Laid flat on a surface, or hung on a wooden hanger',
            tip: 'Stretch the sleeves symmetrically and make sure there are no visible wrinkles.',
            slots: ['Full front', 'Shirt back', 'Brand and size label', 'Fabric close-up'],
            help: [
                'The shirt laid flat, The whole front in frame and aligned. This is the main photo.',
                'Flip the shirt and photograph the back the exact same way.',
                'Close-up of the collar label — the brand and size should be legible.',
                'Get close to the fabric to show the texture and condition (no stains or wear).',
            ],
        },
        outerwear: {
            title: "Coats and jackets",
            heroAngle: 'Buttoned and full, Hanging on a quality hanger',
            tip: 'Photograph the main image buttoned up, and open in another photo — to show the lining.',
            slots: ['Buttoned front', 'Inner lining', 'Zipper / buttons', 'Fabric composition label'],
            help: [
                'The coat buttoned and full on a hanger, The whole front in frame. This is the main photo.',
                'Open the coat and photograph the lining inside.',
                'Close-up of the zipper or buttons to show they are intact and working.',
                'Close-up of the label with the fabric composition and washing instructions.',
            ],
        },
        bags: {
            title: 'Bags and leather accessories',
            heroAngle: 'Straight front, at eye level',
            tip: 'Fill the bag with paper or cloth so it holds its shape and doesn\'t look crumpled.',
            slots: ['Bag front', 'Back and bottom', 'The bag\'s interior and compartments', 'Serial number / clasp'],
            help: [
                'The bag standing full (padded inside) to hold its shape, Full front. This is the main photo.',
                'Photograph the back and the bottom — that\'s usually where wear shows.',
                'Open the bag and photograph the inside and the compartments.',
                'Close-up of the serial number or clasp/logo — helps verify authenticity.',
            ],
        },
        bottoms: {
            title: "Trousers and jeans",
            heroAngle: 'laid flat and straight on a surface',
            tip: 'Align the legs parallel and take a close-up of the main button/zipper.',
            slots: ['Full front', 'Back and pockets', 'Size label at the waist'],
            help: [
                'The trousers laid flat and straight, Full length in frame. This is the main photo.',
                'Flip and photograph the back and the pockets.',
                'Close-up of the size label inside the waist.',
            ],
        },
        accessories: {
            title: 'Eyewear and watches',
            heroAngle: 'A sharp close-up of the front (macro)',
            tip: 'Avoid glare from light or flash on glass/metal — tilt the item slightly.',
            slots: ['Front close-up', 'Brand engraving / back', 'Original packaging / box'],
            help: [
                'A sharp close-up of the front, No light reflection on the glass or metal. This is the main photo.',
                'Photograph the engraving or marking on the back — they verify the brand.',
                'Photograph the original box/packaging if any — it adds value and trust.',
            ],
        },
    };

    // The three core tips shown for every category.
    const VERO_CORE_TIPS = [
        { icon: '☀', title: 'Daylight, No flash', text: 'Shoot by a window in natural light. Turn off the flash — it flattens the item and shifts color.' },
        { icon: '◐', title: 'A clean, even background', text: 'Place it on a wall or a smooth sheet in a solid color, No objects around that distract the eye.' },
        { icon: '⧉', title: 'Leave air (15%)', text: 'Don\'t fill the whole frame with the item — leave some margin and don\'t crop the edges.' },
    ];

    // Expose the schema so the rest of the site (and tests) can read it.
    window.VERO_PHOTO_GUIDE = VERO_PHOTO_GUIDE;

    const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="4 12 10 18 20 6"></polyline></svg>';

    const STYLE = `
        :host {
            display: block;
            direction: ltr;
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            color: #1a1a1a;
            --pg-accent: #1c1c1c;
            --pg-line: rgba(0,0,0,0.14);
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
            display: grid; place-items: center; font-size: 14.17px;
        }
        .pg-head .tt { flex: 1; min-width: 0; }
        .pg-head .tt b { display: block; font-size: 12.50px; font-weight: 700; }
        .pg-head .tt span { display: block; font-size: 10.00px; color: var(--pg-muted); }
        .pg-head .count {
            font-size: 10.00px; font-weight: 700; color: var(--pg-accent);
            background: rgba(0,0,0,0.06); border-radius: 999px; padding: 4px 10px;
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
            font-size: 10.83px; line-height: 1.6; color: #45413a;
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
        .pg-core .c .g { font-size: 15.00px; }
        .pg-core .c b { display: block; font-size: 10.00px; margin-top: 6px; }
        .pg-core .c span { display: block; font-size: 9.17px; color: var(--pg-muted); line-height: 1.45; margin-top: 3px; }

        .pg-slots-h {
            font-size: 9.17px; letter-spacing: 1px; text-transform: uppercase;
            color: var(--pg-muted); font-weight: 700; margin-bottom: 4px;
        }
        .pg-slots-sub { font-size: 10.00px; color: var(--pg-muted); line-height: 1.5; margin-bottom: 12px; }
        .pg-slots { display: flex; flex-direction: column; gap: 8px; }
        .pg-slot {
            display: flex; align-items: flex-start; gap: 12px;
            border: 1px solid var(--pg-line); border-radius: 9px;
            padding: 12px 13px; transition: background 0.2s, border-color 0.2s;
        }
        .pg-slot .dot {
            width: 22px; height: 22px; flex: 0 0 auto; border-radius: 50%; margin-top: 1px;
            border: 1.5px dashed #cfccc4; display: grid; place-items: center;
            color: #fff;
        }
        .pg-slot .dot svg { width: 13px; height: 13px; fill: none; stroke: #fff;
            stroke-width: 1.25.4; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
        .pg-slot .lbl { flex: 1; min-width: 0; }
        .pg-slot .lbl b { display: block; font-size: 11.25px; font-weight: 700; line-height: 1.35; }
        .pg-slot .lbl .hint { display: block; font-size: 10.00px; color: var(--pg-muted); line-height: 1.5; margin-top: 3px; }
        .pg-slot.done .lbl .hint { color: #6f8a7e; }
        .pg-slot .num { font-size: 9.17px; color: var(--pg-muted); font-weight: 700; margin-top: 2px; }
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
            const help = data.help || [];
            const doneCount = Array.from(this._done).filter(i => i < slots.length).length;

            const core = VERO_CORE_TIPS.map(t => `
                <div class="c"><span class="g">${t.icon}</span><b>${t.title}</b><span>${t.text}</span></div>
            `).join('');

            const slotRows = slots.map((label, i) => `
                <div class="pg-slot ${this._done.has(i) ? 'done' : ''}">
                    <span class="dot">${CHECK}</span>
                    <span class="lbl"><b>${label}</b>${help[i] ? `<span class="hint">${help[i]}</span>` : ''}</span>
                    <span class="num">${String(i + 1).padStart(2, '0')}</span>
                </div>
            `).join('');

            this.shadowRoot.innerHTML = `
                <style>${STYLE}</style>
                <div class="pg">
                    <button class="pg-head" type="button" part="head">
                        <span class="ic">📸</span>
                        <span class="tt">
                            <b>Photo guide — ${data.title}</b>
                            <span>How to photograph this item right</span>
                        </span>
                        <span class="count">${doneCount}/${slots.length}</span>
                        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="pg-body"><div class="inner"><div class="pg-pad">
                        <div class="pg-hero">
                            <b>The main photo:</b> ${data.heroAngle}
                            <span class="tip">💡 ${data.tip}</span>
                        </div>
                        <div class="pg-core">${core}</div>
                        <div class="pg-slots-h">Required photos · ${slots.length}</div>
                        <div class="pg-slots-sub">Take all the following photos. Each is marked with-✓ automatically when you move it up.</div>
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
