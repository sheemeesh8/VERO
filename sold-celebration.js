// "Sold!" celebration — a full-screen confetti moment shown after a seller
// marks an item as sold. No buttons: it plays (~3s), fades, then the app
// returns to the feed.
//
//   veroSoldCelebration({ item: 'Leather tote', amount: 480, then: 'index.html' });
(function () {
  var CSS = '' +
    '.vsc{position:fixed;inset:0;z-index:2147483000;background:#fff;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;text-align:center;overflow:hidden;color:#16150f;' +
      "font-family:'Poppins',-apple-system,'Segoe UI',sans-serif;animation:vscIn .35s ease both}" +
    '.vsc.out{animation:vscOut .45s ease forwards}' +
    '@keyframes vscIn{from{opacity:0}to{opacity:1}}' +
    '@keyframes vscOut{to{opacity:0}}' +
    '.vsc-k{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8f8d86}' +
    ".vsc-t{font-family:'Bodoni Moda','Didot',Georgia,serif;font-size:58px;line-height:1.05;margin-top:6px}" +
    '.vsc-t i{font-style:italic}' +
    '.vsc-a{font-size:15px;color:#8f8d86;margin-top:10px}.vsc-a b{color:#16150f;font-weight:500}' +
    '.vsc-up{opacity:0;animation:vscUp .7s cubic-bezier(.2,.8,.2,1) forwards}' +
    '@keyframes vscUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}' +
    '.vsc-c{position:absolute;inset:0;pointer-events:none}' +
    '.vsc-c i{position:absolute;top:-20px;width:9px;height:14px;opacity:0;animation:vscFall 2.6s ease-in forwards}' +
    '@keyframes vscFall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:1;transform:translateY(110vh) rotate(720deg)}}' +
    '.vsc-b i{top:50%;left:50%;width:8px;height:12px;animation:vscBurst 1.6s cubic-bezier(.1,.7,.3,1) forwards}' +
    '@keyframes vscBurst{0%{opacity:1;transform:translate(-50%,-50%) rotate(0)}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(540deg)}}' +
    '@media (prefers-reduced-motion:reduce){.vsc-c{display:none}}';

  var COLORS = ['#d9a441', '#16150f', '#e8842b', '#1f8f4e', '#c23a2e', '#7aa6c2', '#f0d9b5'];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function confetti() {
    var rain = '<div class="vsc-c">', burst = '<div class="vsc-c vsc-b">', i;
    for (i = 0; i < 60; i++) {
      rain += '<i style="left:' + rnd(0, 100).toFixed(1) + '%;background:' + COLORS[i % COLORS.length] +
        ';animation-delay:' + rnd(0.4, 1.3).toFixed(2) + 's;animation-duration:' + rnd(2, 3.2).toFixed(2) +
        's;border-radius:' + (i % 3 ? '2px' : '50%') + '"></i>';
    }
    for (i = 0; i < 36; i++) {
      var a = rnd(0, Math.PI * 2), d = rnd(130, 300);
      burst += '<i style="--x:' + (Math.cos(a) * d).toFixed(0) + 'px;--y:' + (Math.sin(a) * d).toFixed(0) +
        'px;background:' + COLORS[i % COLORS.length] + ';animation-delay:' + rnd(0.05, 0.2).toFixed(2) + 's"></i>';
    }
    return burst + '</div>' + rain + '</div>';
  }

  // Leave for the feed. Inside an embed (e.g. chats inside profile.html) the
  // host page navigates, so the feed isn't trapped in the small iframe.
  function goTo(url) {
    var w = window;
    try { if (document.documentElement.classList.contains('embed') && window.parent !== window) w = window.parent; } catch (e) {}
    try { w.location.href = url; } catch (e) { location.href = url; }
  }

  window.veroSoldCelebration = function (opts) {
    opts = opts || {};
    if (!document.getElementById('vsc-css')) {
      var st = document.createElement('style'); st.id = 'vsc-css'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    var amt = opts.amount ? '₪' + Math.round(opts.amount).toLocaleString('en-US') : '';
    var line = [opts.item ? esc(opts.item) : '', amt ? '<b>' + amt + '</b>' : ''].filter(Boolean).join(' · ');
    var el = document.createElement('div');
    el.className = 'vsc';
    el.setAttribute('role', 'status');
    el.innerHTML = confetti() +
      '<div class="vsc-k vsc-up">Congratulations</div>' +
      '<div class="vsc-t vsc-up" style="animation-delay:.25s">Sold<i>!</i></div>' +
      (line ? '<div class="vsc-a vsc-up" style="animation-delay:.5s">' + line + '</div>' : '');
    document.body.appendChild(el);
    var then = opts.then === undefined ? 'index.html' : opts.then;
    setTimeout(function () { el.classList.add('out'); }, 3000);
    setTimeout(function () { if (then) goTo(then); else el.remove(); }, 3450);
  };
})();
