(function () {
  function interactiveCapable() {
    return (
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !window.matchMedia('(max-width: 767px)').matches
    );
  }
  if (!interactiveCapable()) return;

  // Magnetic buttons: pull the whole button toward the cursor while hovered.
  var BTN_STRENGTH = 0.3;
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var rect = btn.getBoundingClientRect();
      var dx = e.clientX - (rect.left + rect.width / 2);
      var dy = e.clientY - (rect.top + rect.height / 2);
      // -2px folds in the existing .btn:hover lift so the magnetic pull
      // doesn't fight it — inline style wins over the CSS hover transform.
      btn.style.transform = 'translate(' + (dx * BTN_STRENGTH).toFixed(2) + 'px, ' + (dy * BTN_STRENGTH - 2).toFixed(2) + 'px)';
    });
    btn.addEventListener('pointerleave', function () {
      btn.style.transform = '';
    });
  });

  // Magnetic text: split marked headings into letters that individually
  // pull toward the cursor within a radius, like iron filings.
  var targets = document.querySelectorAll('[data-magnetic-text]');
  if (!targets.length) return;

  var RADIUS = 110;
  var TEXT_STRENGTH = 0.4;
  var letters = [];

  targets.forEach(function (el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    var words = text.split(' ');
    el.innerHTML = '';
    words.forEach(function (word, wi) {
      var wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-flex';
      wordSpan.style.whiteSpace = 'nowrap';
      word.split('').forEach(function (ch) {
        var letterSpan = document.createElement('span');
        letterSpan.className = 'magnetic-letter';
        letterSpan.textContent = ch;
        wordSpan.appendChild(letterSpan);
        letters.push(letterSpan);
      });
      el.appendChild(wordSpan);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  var rects = [];
  function measure() {
    rects = letters.map(function (l) { return l.getBoundingClientRect(); });
  }
  measure();

  var pointer = { x: -9999, y: -9999 };
  var raf = null;
  function applyTransforms() {
    letters.forEach(function (node, i) {
      var rect = rects[i];
      if (!rect) return;
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = pointer.x - cx;
      var dy = pointer.y - cy;
      var dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        var pull = (1 - dist / RADIUS) * TEXT_STRENGTH;
        node.style.transform = 'translate(' + (dx * pull).toFixed(2) + 'px, ' + (dy * pull).toFixed(2) + 'px)';
      } else {
        node.style.transform = '';
      }
    });
    raf = null;
  }
  function queueApply() {
    if (raf == null) raf = requestAnimationFrame(applyTransforms);
  }

  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    queueApply();
  });
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', measure, { passive: true });
  document.addEventListener('pointerleave', function () {
    pointer = { x: -9999, y: -9999 };
    queueApply();
  });
})();
