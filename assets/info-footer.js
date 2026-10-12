/* ------------------------------------------------------------------
   moravchick — compact footer for the information & legal pages only
   (About-style docs: FAQ, Contact, Terms, Privacy, Cookies, Returns,
   Pickup & Delivery, Trust & Safety, How it works, 404).

   The app views (feed, profile, dashboards…) stay footer-free — this file
   is only included on the doc pages, where a legal footer is expected.
------------------------------------------------------------------ */
(function () {
    if (/[?&]embed=1\b/.test(location.search)) return;

    var css =
        '.info-footer{border-top:1px solid #eee;background:#fafaf8;color:#6b6b66;' +
        ' font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}' +
        '.info-footer .if-inner{max-width:760px;margin:0 auto;padding:40px clamp(20px,5vw,32px) 36px;' +
        ' display:flex;flex-direction:column;gap:22px;}' +
        '.info-footer .if-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}' +
        '.info-footer h4{margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:2px;' +
        ' text-transform:uppercase;color:#1c1c1c;font-family:inherit !important;}' +
        '.info-footer ul{list-style:none;margin:0;padding:0;}' +
        '.info-footer li{margin:0 0 7px;}' +
        '.info-footer a{font-size:12.5px;color:#6b6b66;text-decoration:none;}' +
        '.info-footer a:hover{color:#1c1c1c;text-decoration:underline;}' +
        '.info-footer .if-copy{border-top:1px solid #ececea;padding-top:18px;font-size:11px;' +
        ' letter-spacing:.3px;color:#9a9a95;}' +
        '@media (max-width:520px){.info-footer .if-cols{grid-template-columns:1fr 1fr;}}';

    var cols = [
        ['Company', [['About', 'about.html'], ['How it works', 'how-it-works.html'], ['Trust & Safety', 'safety.html']]],
        ['Support', [['FAQ', 'faq.html'], ['Pickup & Delivery', 'shipping.html'], ['Returns', 'returns.html'], ['Contact', 'contact.html']]],
        ['Legal', [['Terms & Conditions', 'terms.html'], ['Privacy Policy', 'privacy.html'], ['Cookie Policy', 'cookies.html']]]
    ];

    function esc(s) { return s.replace(/&/g, '&amp;'); }

    function run() {
        if (document.querySelector('.info-footer')) return;
        var st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);

        var f = document.createElement('footer');
        f.className = 'info-footer';
        f.innerHTML =
            '<div class="if-inner">' +
                '<div class="if-cols">' + cols.map(function (c) {
                    return '<div><h4>' + c[0] + '</h4><ul>' + c[1].map(function (l) {
                        return '<li><a href="' + l[1] + '">' + esc(l[0]) + '</a></li>';
                    }).join('') + '</ul></div>';
                }).join('') + '</div>' +
                '<div class="if-copy">&copy; ' + new Date().getFullYear() + ' moravchick. All rights reserved.</div>' +
            '</div>';
        document.body.appendChild(f);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
