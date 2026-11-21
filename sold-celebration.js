// "Sold!" — after a seller marks an item as sold, open the Sold page
// (listing-done.html?state=sold): confetti, the piece and its price, and what next.
//
//   veroSoldCelebration({ item: 'Leather tote', amount: 480 });
(function () {
  // Inside an embed (e.g. chats inside profile.html) the host page navigates,
  // so the page isn't trapped in the small iframe.
  function goTo(url) {
    var w = window;
    try { if (document.documentElement.classList.contains('embed') && window.parent !== window) w = window.parent; } catch (e) {}
    try { w.location.href = url; } catch (e) { location.href = url; }
  }

  // Marking a piece as sold now opens the "Sold!" page (listing-done.html?state=sold):
  // the same confetti, then the sale on a page of its own with somewhere to go next,
  // instead of a three-second overlay that dropped the seller on the feed.
  window.veroSoldCelebration = function (opts) {
    opts = opts || {};
    var back = '';
    try { back = location.pathname.split('/').pop() + location.search.replace(/([?&])_ts=\d+&?/, '$1').replace(/[?&]$/, ''); } catch (e) {}
    var enc = function (v) { return encodeURIComponent(v).replace(/[!'()*~]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }); };
    goTo('listing-done.html?state=sold&name=' + enc(opts.item || '') + (opts.amount ? '&amount=' + enc(Math.round(opts.amount)) : '') +
         (opts.id ? '&id=' + enc(opts.id) : '') + (back ? '&back=' + enc(back) : ''));
  };
})();
