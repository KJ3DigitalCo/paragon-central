// Scroll-pinned "Protect Grow" collision/shatter transition — faithful
// vanilla-JS port of KJ3's BuildTransition.jsx (GSAP + ScrollTrigger).
// Words and palette swapped for Paragon Central; logic and timing kept as
// close to the original as plain HTML/CSS/JS allows.
(function () {
  var section = document.querySelector('.build-transition');
  if (!section) return;

  var WEDGE_COUNT = 12;
  var SPARK_COUNT = 28;
  var TAGLINE = 'A division of Mega Paragon.';

  // Radial wedges from the center point, like a pizza cut (approximate, not
  // exact) — each piece is a triangle fan from center outward; points beyond
  // 0-100% just get clipped to the element's own box, so this is a cheap way
  // to get pizza-slice-shaped fragments without rectangle-intersection math.
  function wedgeClipPath(index) {
    var angleStep = 360 / WEDGE_COUNT;
    // Each wedge overlaps its neighbors well past their exact boundary —
    // adjacent clip-path edges otherwise leave a hairline anti-aliasing seam
    // that reads as a crack any time text passes through it, not just at rest.
    var overlap = 7;
    var start = index * angleStep - overlap;
    var end = start + angleStep + overlap * 2;
    function far(deg) {
      var rad = (deg * Math.PI) / 180;
      return (50 + 200 * Math.cos(rad)).toFixed(1) + '% ' + (50 + 200 * Math.sin(rad)).toFixed(1) + '%';
    }
    return 'polygon(50% 50%, ' + far(start) + ', ' + far((start + end) / 2) + ', ' + far(end) + ')';
  }

  section.innerHTML =
    '<div class="bt-flash"></div>' +
    '<div class="bt-ring"></div>' +
    '<div class="bt-sparks"></div>' +
    '<div class="bt-stage">' +
      '<div class="bt-wordmark" aria-hidden="true"></div>' +
      '<p class="bt-tagline">' + TAGLINE + '</p>' +
    '</div>';

  var flash = section.querySelector('.bt-flash');
  var ring = section.querySelector('.bt-ring');
  var sparksWrap = section.querySelector('.bt-sparks');
  var stage = section.querySelector('.bt-stage');
  var wordmark = section.querySelector('.bt-wordmark');
  var tagline = section.querySelector('.bt-tagline');

  var pieces = [];
  var letsEls = [];
  var learnEls = [];
  for (var i = 0; i < WEDGE_COUNT; i++) {
    var piece = document.createElement('div');
    piece.className = 'bt-piece';
    piece.style.clipPath = wedgeClipPath(i);

    var lets = document.createElement('span');
    lets.className = 'bt-lets';
    lets.textContent = "Protect";

    var learn = document.createElement('span');
    learn.className = 'bt-learn';
    learn.textContent = 'Grow';

    piece.appendChild(lets);
    piece.appendChild(learn);
    wordmark.appendChild(piece);
    pieces.push(piece);
    letsEls.push(lets);
    learnEls.push(learn);
  }

  var sparkColorClasses = ['spark-white', 'spark-gold', 'spark-gold-deep'];
  var sparks = [];
  for (var s = 0; s < SPARK_COUNT; s++) {
    var spark = document.createElement('div');
    spark.className = 'bt-spark ' + sparkColorClasses[s % sparkColorClasses.length];
    var width = 3 + (s % 3) * 1.2;
    var height = 18 + ((s * 7) % 18) * 1.8;
    spark.style.width = width + 'px';
    spark.style.height = height + 'px';
    sparksWrap.appendChild(spark);
    sparks.push(spark);
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !window.gsap || !window.ScrollTrigger) {
    // No animation attached: everything stays at its natural CSS position,
    // which is the complete "Protect Grow" heading, no shatter, no pin.
    return;
  }

  // Disable the browser's own scroll-position restoration and force the
  // viewport to the top BEFORE any ScrollTrigger is created. Without this,
  // reloading the page while scrolled deep into this section lets the
  // browser jump there via native scroll restoration before GSAP has
  // measured anything — which corrupts the pin, and scrolling afterward
  // snaps incorrectly back toward the hero instead of playing normally.
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  gsap.registerPlugin(ScrollTrigger);

  // Solid buffer painted right at the pin boundary, overlapping whatever
  // follows. Mobile browsers resize the real viewport by 50-80px when the
  // address bar shows/hides mid-scroll, which drifts GSAP's cached
  // pin-spacer height away from the live dvh value — this strip takes zero
  // net document space (equal negative top margin) and just paints over
  // the seam regardless of how far the cached measurement has drifted.
  var buffer = document.createElement('div');
  buffer.className = 'build-transition-buffer';
  buffer.setAttribute('aria-hidden', 'true');
  section.parentNode.insertBefore(buffer, section.nextSibling);

  gsap.set(letsEls, { x: '-60vw' });
  gsap.set(learnEls, { x: '60vw' });
  gsap.set(flash, { opacity: 0 });
  gsap.set(tagline, { opacity: 0 });
  gsap.set(ring, { opacity: 0, scale: 0 });
  // Each spark is a tiny ember that actually FLIES outward at its own
  // random angle (not a fixed radial ray) with a downward gravity bias,
  // like a welding/grinder spark shower — not a clean symmetric burst.
  gsap.set(sparks, {
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    rotation: function () { return gsap.utils.random(0, 360); },
    scale: function () { return gsap.utils.random(0.9, 1.8); },
    opacity: 0,
  });

  // The collision -> recoil -> spark -> hold -> tagline beat plays on its
  // own real-time clock once triggered, instead of being tied to scroll
  // position — so it always reads smoothly regardless of how fast or slow
  // the user scrolls. Only the slide-in and the shatter remain
  // scroll-scrubbed.
  // NOTE: this timeline deliberately never touches `x` on letsEls/learnEls
  // — the recoil lives in the scroll-scrubbed master timeline instead. Two
  // independent timelines both driving the same property on the same
  // target is what caused the reverse-scroll bug: a TO-tween caches its
  // start value the first time it plays, so reversing it later snaps back
  // to that stale cached value instead of wherever the OTHER timeline has
  // since moved the property to.
  var autoTl = gsap.timeline({ paused: true });
  autoTl
    // Burst (flash, ring, sparks) fires FIRST, right at 0 — the bump
    // follows a beat after, instead of happening at the same time. This
    // reads as: impact flashes, then the physical thump lands.
    .to(flash, { opacity: 1, duration: 0.075, ease: 'power1.out' }, 0)
    .fromTo(ring, { scale: 0, opacity: 1 }, { scale: 26, opacity: 0, duration: 0.3, ease: 'power2.out' }, 0)
    .to(sparks, { opacity: 1, duration: 0.05 }, 0)
    .to(
      sparks,
      {
        x: function (i, target) {
          var angle = (gsap.getProperty(target, 'rotation') * Math.PI) / 180;
          return Math.cos(angle) * gsap.utils.random(50, 170);
        },
        y: function (i, target) {
          var angle = (gsap.getProperty(target, 'rotation') * Math.PI) / 180;
          return Math.sin(angle) * gsap.utils.random(50, 170) + gsap.utils.random(15, 50);
        },
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.006,
      },
      0,
    )
    .to(stage, { scale: 1.04, duration: 0.075, ease: 'power1.out' }, 0.04)
    .to(stage, { scale: 1, duration: 0.15, ease: 'power2.out' }, 0.115)
    .to(flash, { opacity: 0, duration: 0.175, ease: 'power1.in' }, '+=0.025');

  // autoState tracks whether the auto-beat has played forward, so it can be
  // properly REVERSED when the user scrolls back up past the collision
  // point — otherwise its effects (recoil offset, tagline opacity) just
  // stay stuck while the master timeline tries to reverse the entrance
  // underneath it.
  var autoState = 0; // 0 = not yet played, 1 = played forward
  var collisionThreshold = 2 / 7;

  // Scroll-scrubbed master timeline: only the slide-in (0 -> 2) and the
  // shatter (4 -> 7) are tied to scroll position. The gap between them
  // (2 -> 4) is just enough for the auto-playing beat to finish.
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=230%',
      scrub: true,
      pin: true,
      anticipatePin: 1,
      onUpdate: function (self) {
        if (self.direction === 1 && self.progress >= collisionThreshold && autoState === 0) {
          autoState = 1;
          autoTl.play(0);
        } else if (self.direction === -1 && self.progress < collisionThreshold && autoState === 1) {
          autoState = 0;
          autoTl.reverse();
        }
      },
    },
  })
    // A brief pull-back further off-screen before the real launch —
    // anticipation, so the entrance has some wind-up instead of just
    // coasting straight in.
    .to(letsEls, { x: '-64vw', duration: 0.15, ease: 'power1.inOut' }, 0)
    .to(learnEls, { x: '64vw', duration: 0.15, ease: 'power1.inOut' }, 0)
    .to(letsEls, { x: 0, duration: 1.85, ease: 'power2.out' }, 0.15)
    .to(learnEls, { x: 0, duration: 1.85, ease: 'power2.out' }, 0.15)
    // Recoil lives here (scroll-scrubbed), not in autoTl — see the note on
    // autoTl above for why. The tagline's opacity lives entirely here too,
    // for the same reason: two timelines driving one property caused the
    // fade-out to get stuck.
    .to(letsEls, { x: '-2.2vw', duration: 0.25, ease: 'back.out(2)' }, 2)
    .to(learnEls, { x: '2.2vw', duration: 0.25, ease: 'back.out(2)' }, 2)
    .fromTo(tagline, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power1.out' }, 2.55)
    // Tagline falls away with the rest as the shatter begins.
    .to(tagline, { opacity: 0, y: 40, duration: 0.6, ease: 'power1.in' }, 4)
    .to(
      pieces,
      {
        x: function (i) {
          var angleStep = 360 / WEDGE_COUNT;
          var centerAngle = i * angleStep + angleStep / 2;
          var rad = (centerAngle * Math.PI) / 180;
          var dir = Math.cos(rad) < 0 ? -1 : 1;
          return (dir * gsap.utils.random(18, 38)) + 'vw';
        },
        y: function () { return gsap.utils.random(140, 220) + 'vh'; },
        rotation: function () { return gsap.utils.random(-12, 12); },
        opacity: 0,
        duration: 3,
        ease: 'power2.in',
        stagger: { each: 0.045, from: 'center' },
      },
      4,
    );

  // Only refresh once everything (fonts, images) has actually finished
  // loading — refreshing earlier, or synchronously on script run, is what
  // let a mid-load layout shift (or a scroll-restoration race) corrupt the
  // pin's measured start/end in the first place.
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
})();
