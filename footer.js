/* ------------------------------------------------------------------
   VERO — shared site footer.
   Vanilla-HTML/CSS adaptation of the shadcn "Footer7" block, styled to
   match the rest of the site. Single source of truth: edit this file to
   change the footer everywhere.

   Usage:
     <script src="footer.js"></script>
   Place near the end of <body>. The footer is appended to <body>.

   On pages that own multiple views (index.html: cart / wishlist / main),
   set <body data-footer="manual"> so the footer starts hidden and the page
   toggles it with showSiteFooter() / hideSiteFooter().
------------------------------------------------------------------ */
(function () {
    const STYLES = `
        #siteFooter {
            width: 100%;
            box-sizing: border-box;
            background: #22372B;
            border-top: 1px solid rgba(255,255,255,0.12);
            padding: 72px 0 40px;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            color: #ffffff;
            direction: ltr;
            text-align: center;
        }
        #siteFooter .foot-container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 0 var(--spacing-2xl, 40px);
            box-sizing: border-box;
        }
        #siteFooter .foot-top {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 40px;
        }
        #siteFooter .foot-brand {
            display: flex;
            flex-direction: column;
            gap: 22px;
            align-items: center;
        }
        #siteFooter .foot-logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #siteFooter .foot-logo .mark {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 26px; font-weight: 700; letter-spacing: 4px;
            text-transform: uppercase; color: #ffffff;
        }
        #siteFooter .foot-social {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 22px;
            list-style: none;
            margin: 0; padding: 0;
        }
        #siteFooter .foot-social a {
            color: rgba(255,255,255,0.7);
            display: inline-flex;
            transition: color 0.2s ease;
        }
        #siteFooter .foot-social a:hover { color: #ffffff; }
        #siteFooter .foot-social svg { width: 20px; height: 20px; }
        #siteFooter .foot-cols {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
        }
        #siteFooter .foot-col h3 {
            margin: 0 0 16px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #ffffff;
            text-transform: uppercase;
        }
        #siteFooter .foot-col ul { list-style: none; margin: 0; padding: 0; }
        #siteFooter .foot-col li { margin-bottom: 12px; }
        #siteFooter .foot-col a {
            font-size: 14px;
            color: rgba(255,255,255,0.72);
            text-decoration: none;
            transition: color 0.2s ease;
        }
        #siteFooter .foot-col a:hover { color: #ffffff; }
        #siteFooter .foot-bottom {
            margin-top: 48px;
            padding-top: 28px;
            border-top: 1px solid rgba(255,255,255,0.15);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: rgba(255,255,255,0.6);
        }
        #siteFooter .foot-legal {
            display: flex;
            justify-content: center;
            gap: 22px;
            list-style: none;
            margin: 0; padding: 0;
            flex-wrap: wrap;
        }
        #siteFooter .foot-legal a { color: rgba(255,255,255,0.6); text-decoration: none; }
        #siteFooter .foot-legal a:hover { color: #ffffff; }
        @media (max-width: 620px) {
            #siteFooter .foot-cols { grid-template-columns: 1fr 1fr; gap: 28px; }
        }
    `;

    // Inline SVG icons (lucide-style) — no external icon library.
    const ICONS = {
        instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
        twitter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>'
    };

    const sections = [
        { title: 'Shop', links: [
            { name: 'Women', href: '#' },
            { name: 'Men', href: '#' },
            { name: 'Kids', href: '#' },
            { name: 'Art', href: '#' },
        ]},
        { title: 'Company', links: [
            { name: 'About Us', href: 'about.html' },
            { name: 'Seller Area', href: 'seller-area.html' },
            { name: 'The Closet Magazine', href: '#' },
            { name: 'Careers', href: '#' },
        ]},
        { title: 'Support', links: [
            { name: 'Help Center', href: '#' },
            { name: 'Shipping', href: '#' },
            { name: 'Returns', href: '#' },
            { name: 'Contact', href: '#' },
        ]},
    ];

    const social = [
        { icon: ICONS.instagram, href: '#', label: 'Instagram' },
        { icon: ICONS.facebook, href: '#', label: 'Facebook' },
        { icon: ICONS.twitter, href: '#', label: 'Twitter' },
        { icon: ICONS.linkedin, href: '#', label: 'LinkedIn' },
    ];

    const legal = [
        { name: 'Terms and Conditions', href: '#' },
        { name: 'Privacy Policy', href: '#' },
    ];

    const MARKUP = `
        <div class="foot-container">
            <div class="foot-top">
                <div class="foot-brand">
                    <div class="foot-logo">
                        <span class="mark">VERO</span>
                    </div>
                    <ul class="foot-social">
                        ${social.map(s => `<li><a href="${s.href}" aria-label="${s.label}">${s.icon}</a></li>`).join('')}
                    </ul>
                </div>
                <div class="foot-cols">
                    ${sections.map(sec => `
                        <div class="foot-col">
                            <h3>${sec.title}</h3>
                            <ul>${sec.links.map(l => `<li><a href="${l.href}">${l.name}</a></li>`).join('')}</ul>
                        </div>`).join('')}
                </div>
            </div>
            <div class="foot-bottom">
                <p>&copy; 2026 VERO. All rights reserved.</p>
                <ul class="foot-legal">
                    ${legal.map(l => `<li><a href="${l.href}">${l.name}</a></li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    function mount() {
        if (!document.getElementById('vero-footer-styles')) {
            const st = document.createElement('style');
            st.id = 'vero-footer-styles';
            st.textContent = STYLES;
            document.head.appendChild(st);
        }
        if (document.getElementById('siteFooter')) return;
        const manual = document.body.getAttribute('data-footer') === 'manual';
        const footer = document.createElement('footer');
        footer.id = 'siteFooter';
        if (manual) footer.style.display = 'none';
        footer.innerHTML = MARKUP;
        document.body.appendChild(footer);
    }

    // Toggles for pages that own multiple views (index.html).
    window.showSiteFooter = function () {
        const f = document.getElementById('siteFooter');
        if (f) f.style.display = '';
    };
    window.hideSiteFooter = function () {
        const f = document.getElementById('siteFooter');
        if (f) f.style.display = 'none';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
