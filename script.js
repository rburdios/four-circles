function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      items.forEach(other => {
        other.classList.remove('is-open');
        const otherPanel = other.querySelector('.accordion-panel');
        if (otherPanel) otherPanel.style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

function initScrollReveal() {
  const revealElements = document.querySelectorAll(
    '.services-header, .accordion-item, ' +
    '.hwt-left, .hwt-card, .lets-talk-content, .footer'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initNavScroll() {
  const nav = document.querySelector('.nav');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          nav.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
        } else {
          nav.style.boxShadow = 'none';
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

function initMazeIconMotion() {
  var item = document.querySelector('.accordion-item');
  if (!item) return;
  var svg = item.querySelector('.icon-maze');
  if (!svg) return;
  var arcEls = svg.querySelectorAll('.icon-maze-arc');
  var dot = svg.querySelector('.icon-maze-dot');
  if (!dot || arcEls.length < 4) return;

  var CX = 60, CY = 60, OUTER = 52, CYCLE = 4;
  var PI = Math.PI;

  var arcs = [
    { r: 46, gap: -PI / 2, half: 0.6, speed: 0.35 },
    { r: 34, gap: 0,       half: 0.62, speed: -0.5 },
    { r: 22, gap: PI / 2,  half: 0.62, speed: 0.65 },
    { r: 10, gap: PI,      half: 0.64, speed: -0.4 }
  ];

  var hovering = false, t0 = 0, raf = null;

  function gapAt(i, t) { return arcs[i].gap + arcs[i].speed * t; }

  function lerpA(a, b, t) {
    var d = b - a;
    d -= Math.round(d / (2 * PI)) * 2 * PI;
    return a + d * t;
  }

  function smoothstep(x) { return x * x * (3 - 2 * x); }

  function tick(ts) {
    if (!t0) t0 = ts;
    var t = (ts - t0) / 1000;
    var ct = t % (CYCLE + 0.6);
    var p = Math.min(ct / CYCLE, 1);
    var ep = smoothstep(p);

    for (var i = 0; i < 4; i++) {
      var deg = arcs[i].speed * t * (180 / PI);
      arcEls[i].setAttribute('transform', 'rotate(' + deg + ' ' + CX + ' ' + CY + ')');
    }

    var dotR = OUTER * (1 - ep);
    var angle;
    if (dotR > 46) {
      angle = gapAt(0, t);
    } else if (dotR > 34) {
      angle = lerpA(gapAt(0, t), gapAt(1, t), (46 - dotR) / 12);
    } else if (dotR > 22) {
      angle = lerpA(gapAt(1, t), gapAt(2, t), (34 - dotR) / 12);
    } else if (dotR > 10) {
      angle = lerpA(gapAt(2, t), gapAt(3, t), (22 - dotR) / 12);
    } else {
      angle = gapAt(3, t);
    }

    if (p >= 1) {
      dot.setAttribute('cx', CX);
      dot.setAttribute('cy', CY);
      dot.style.opacity = String(Math.max(0, 1 - (ct - CYCLE) * 3));
    } else {
      dot.setAttribute('cx', CX + Math.cos(angle) * dotR);
      dot.setAttribute('cy', CY + Math.sin(angle) * dotR);
      dot.style.opacity = '1';
    }

    if (hovering) raf = requestAnimationFrame(tick);
  }

  item.addEventListener('mouseenter', function() {
    hovering = true;
    t0 = 0;
    raf = requestAnimationFrame(tick);
  });

  item.addEventListener('mouseleave', function() {
    hovering = false;
    if (raf) cancelAnimationFrame(raf);
    dot.style.opacity = '0';
    for (var i = 0; i < 4; i++) arcEls[i].removeAttribute('transform');
  });
}

function initHamburgerMenu() {
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');
  if (!hamburger || !navLinks) return;

  function toggle() {
    const isOpen = hamburger.classList.toggle('active');
    navLinks.classList.toggle('open', isOpen);
    if (overlay) overlay.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function close() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggle);
  if (overlay) overlay.addEventListener('click', close);
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', close);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAccordion();
  initScrollReveal();
  initNavScroll();
  initMazeIconMotion();
  initHamburgerMenu();
});
