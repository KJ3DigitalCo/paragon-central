(function () {
  var supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!supportsHover) return;

  var nodes = document.querySelectorAll('.flag-spotlight');
  if (!nodes.length) return;

  // Listen on window: each wrapper sits behind sibling overlay/content
  // layers, so a listener on the node itself would never receive events
  // that hit those layers (siblings don't bubble to each other).
  window.addEventListener('pointermove', function (event) {
    nodes.forEach(function (node) {
      var rect = node.getBoundingClientRect();
      node.style.setProperty('--spot-x', (event.clientX - rect.left) + 'px');
      node.style.setProperty('--spot-y', (event.clientY - rect.top) + 'px');
    });
  });

  // Chromium sometimes never paints the mask-image on first load (it shows
  // as a flat, fully-opaque overlay with no cutout until something forces a
  // repaint, e.g. scrolling). Nudge a paint-triggering property once after
  // load so the mask renders without the user needing to scroll or move the
  // mouse first.
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        nodes.forEach(function (node) {
          var mask = node.querySelector('.flag-spotlight-mask');
          if (!mask) return;
          mask.style.transform = 'translateZ(0)';
          void mask.offsetHeight;
          mask.style.transform = '';
        });
      });
    });
  });
})();
