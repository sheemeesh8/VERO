/* ------------------------------------------------------------------
   VERO — one FOOTER for the whole site.

   Loaded on every page (right after back-button.js). It injects a small
   stylesheet and appends a shared <footer> to the end of <body>, so every
   page closes with the same minimalist VERO footer.

   Skipped for embedded views (?embed=1) — panels loaded inside another
   page's iframe (dashboards, cards) must not carry their own footer.
------------------------------------------------------------------ */
(function () {
    // Don't add a footer to embedded/iframed panels.
    if (/[?&]embed=1\b/.test(location.search)) return;
    try { if (/[?&]embed=1\b/.test(decodeURIComponent(window.top.location.hash || ''))) return; } catch (e) {}

    var css =
        '.vero-footer{width:100%;margin-top:0;background:#fff;border-top:1px solid #000;' +
        ' font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1c1c1c;}' +
        '.vero-footer .vf-inner{max-width:520px;margin:0 auto;padding:44px 26px 40px;' +
        ' display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px;}' +
        '.vero-footer .vf-brand{font-size:26px;font-weight:300;letter-spacing:10px;text-transform:uppercase;' +
        ' padding-left:10px;color:#111;}' +
        '.vero-footer .vf-tag{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#9a9a95;margin-top:-10px;}' +
        '.vero-footer .vf-links{display:flex;flex-wrap:wrap;justify-content:center;gap:22px;}' +
        '.vero-footer .vf-links a{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#57524a;' +
        ' text-decoration:none;transition:color .2s;}' +
        '.vero-footer .vf-links a:hover{color:#000;}' +
        '.vero-footer .vf-socials{display:flex;gap:14px;}' +
        '.vero-footer .vf-socials a{width:38px;height:38px;border-radius:50%;border:1px solid #d9d5cc;' +
        ' display:grid;place-items:center;color:#1c1c1c;transition:background .2s,color .2s,border-color .2s;}' +
        '.vero-footer .vf-socials a:hover{background:#000;color:#fff;border-color:#000;}' +
        '.vero-footer .vf-socials svg{width:17px;height:17px;}' +
        '.vero-footer .vf-copy{font-size:9px;letter-spacing:1.5px;color:#b0b0aa;}';
    var style = document.createElement('style');
    style.setAttribute('data-vero-footer', '1');
    style.textContent = css;
    document.head.appendChild(style);

    var YEAR = new Date().getFullYear();
    var HTML =
        '<div class="vf-inner">' +
            '<div class="vf-brand">VERO</div>' +
            '<div class="vf-tag">Fashion &amp; Art Marketplace</div>' +
            '<nav class="vf-links">' +
                '<a href="index.html">Home</a>' +
                '<a href="about.html">About</a>' +
                '<a href="seller-area.html">Sell</a>' +
                '<a href="profile.html">My Area</a>' +
            '</nav>' +
            '<div class="vf-socials">' +
                '<a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg></a>' +
                '<a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.1 3c.3 2.2 1.7 3.9 3.9 4.2v2.6c-1.4 0-2.8-.5-3.9-1.2v5.7a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1v2.7a2.6 2.6 0 1 0 1.8 2.5V3h2.6z"/></svg></a>' +
                '<a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.75-1.6 1.5V12h2.7l-.43 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></a>' +
            '</div>' +
            '<div class="vf-copy">&copy; ' + YEAR + ' VERO. All rights reserved.</div>' +
        '</div>';

    function run() {
        if (document.querySelector('.vero-footer')) return;   // avoid double-inject
        var f = document.createElement('footer');
        f.className = 'vero-footer';
        f.innerHTML = HTML;
        document.body.appendChild(f);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
