/* ------------------------------------------------------------------
   VERO — social proof on the product card (feed option 8h).

   The third copy row (saves · offers · views) under the product name has
   been removed from product cards. This file is kept as a no-op so pages
   that still load it, or still call its globals, keep working without the
   row ever rendering.
------------------------------------------------------------------ */
(function () {
    function noopStats() { return { saves: 0, offers: 0, views: 0 }; }
    function noopHTML() { return ''; }
    function noopFill() {}

    window.veroSocialStats = noopStats;
    window.veroSocialHTML = noopHTML;
    window.veroSocialFill = noopFill;
})();
