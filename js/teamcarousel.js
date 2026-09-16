(function () {
  var track = document.querySelector('.team-carousel');
  if (!track) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Clone every child once, back to back, so the track is 2x the original
  // content — scrollLeft can then wrap by exactly half its scrollWidth with
  // no visible jump, since that half-point looks identical to the start.
  var children = Array.prototype.slice.call(track.children);
  children.forEach(function (node) {
    track.appendChild(node.cloneNode(true));
  });

  var pausedUntil = 0;

  track.addEventListener('mouseenter', function () { pausedUntil = Infinity; });
  track.addEventListener('mouseleave', function () { pausedUntil = 0; });
  // Time-based pause (not a start/end-paired flag): a touch the browser
  // treats as a page scroll can fire touchstart with no matching touchend,
  // which would leave a paired boolean stuck "paused" forever. A refreshing
  // timestamp self-heals regardless of which touch events actually fire.
  track.addEventListener('touchstart', function () { pausedUntil = Date.now() + 2500; }, { passive: true });
  track.addEventListener('touchmove', function () { pausedUntil = Date.now() + 2500; }, { passive: true });

  (function tick() {
    if (Date.now() > pausedUntil) {
      track.scrollLeft += 1.2; // px per frame — tune speed here
      var half = track.scrollWidth / 2;
      if (track.scrollLeft >= half) track.scrollLeft -= half;
    }
    requestAnimationFrame(tick);
  })();
})();
