(function () {
  var supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsHover || reducedMotion) return;

  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  var ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');

  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add('cursor-active');

  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  var ringPos = { x: mouse.x, y: mouse.y };
  var frame;

  function handleMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    dot.style.transform = 'translate3d(' + mouse.x + 'px,' + mouse.y + 'px,0) translate(-50%,-50%)';
  }
  function handleLeave() {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  }
  function handleEnter() {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  }
  function tick() {
    ringPos.x += (mouse.x - ringPos.x) * 0.18;
    ringPos.y += (mouse.y - ringPos.y) * 0.18;
    ring.style.transform = 'translate3d(' + ringPos.x + 'px,' + ringPos.y + 'px,0) translate(-50%,-50%)';
    frame = requestAnimationFrame(tick);
  }

  window.addEventListener('pointermove', handleMove);
  document.addEventListener('mouseleave', handleLeave);
  document.addEventListener('mouseenter', handleEnter);
  frame = requestAnimationFrame(tick);
})();
