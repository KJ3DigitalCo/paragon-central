(function () {
  function wireToggle(toggleSel, linksSel) {
    var toggle = document.querySelector(toggleSel);
    var links = document.querySelector(linksSel);
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('click', function (e) {
      if (!links.classList.contains('open')) return;
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });
  }

  wireToggle('.nav-toggle', '.nav-links');
  wireToggle('.left-menu-toggle', '.left-menu-links');
})();
