(function () {
  var PARTICLE_COUNT = 160;
  var MOUSE_RADIUS = 140;
  var COLORS = ['255, 191, 0', '201, 143, 0', '255, 255, 255'];

  var containers = document.querySelectorAll('.flow-bg');
  if (!containers.length) return;

  // Base fill was hardcoded to the site's original navy, so it never
  // matched a page that overrides --blue-ink for its own theme (teal on
  // Careers, wine on Free Consultation). Read the page's actual value
  // instead, so this canvas always matches whatever theme it's drawn on.
  function hexToRgbTriplet(hex) {
    hex = hex.trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var num = parseInt(hex, 16);
    return ((num >> 16) & 255) + ', ' + ((num >> 8) & 255) + ', ' + (num & 255);
  }
  var themeRgb = hexToRgbTriplet(
    getComputedStyle(document.documentElement).getPropertyValue('--blue-ink') || '#121A38'
  );

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
    reducedMotion = e.matches;
  });

  containers.forEach(function (container) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'flow-canvas';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var mouse = { x: -9999, y: -9999 };
    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var frame = 0;
    var visible = true;
    var particles = [];

    function angleAt(x, y, t) {
      // Layered sine/cosine fields as a cheap, dependency-free stand-in for curl noise.
      return (
        Math.sin(x * 0.0022 + t * 0.35) * Math.PI +
        Math.cos(y * 0.0025 - t * 0.25) * Math.PI +
        Math.sin((x + y) * 0.0015 + t * 0.15) * Math.PI
      );
    }

    function spawnParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: Math.random() * 200
      };
    }

    function resize() {
      var rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.fillStyle = 'rgba(' + themeRgb + ', 1)';
      ctx.fillRect(0, 0, width, height);
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(spawnParticle());
    }

    function handleMove(clientX, clientY) {
      var rect = container.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
    }

    function onMouseMove(e) { handleMove(e.clientX, e.clientY); }
    function onTouchMove(e) {
      var touch = e.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    }
    function onMouseLeave() { mouse.x = -9999; mouse.y = -9999; }

    function step() {
      frame += 1;
      var t = frame * 0.01;

      ctx.fillStyle = 'rgba(' + themeRgb + ', 0.07)';
      ctx.fillRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var angle = angleAt(p.x, p.y, t);
        var vx = Math.cos(angle) * 0.6;
        var vy = Math.sin(angle) * 0.6;

        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.hypot(dx, dy);
        if (dist < MOUSE_RADIUS) {
          var force = (1 - dist / MOUSE_RADIUS) * 2.2;
          vx += (dx / (dist || 1)) * force;
          vy += (dy / (dist || 1)) * force;
        }

        var px = p.x;
        var py = p.y;
        p.x += vx;
        p.y += vy;
        p.life -= 1;

        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          var fresh = spawnParticle();
          p.x = fresh.x; p.y = fresh.y; p.color = fresh.color; p.life = fresh.life;
          continue;
        }

        ctx.strokeStyle = 'rgba(' + p.color + ', 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }

    var rafId = null;
    function loop() {
      if (visible && !reducedMotion) step();
      rafId = requestAnimationFrame(loop);
    }

    resize();
    loop();

    var resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    var intersectionObserver = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 });
    intersectionObserver.observe(container);

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave);
  });
})();
