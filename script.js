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
    '.featured-work-header, .work-card, ' +
    '.hwt-left, .hwt-card, .lets-talk-content'
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
  const progress = document.querySelector('.nav-progress');
  if (!nav || !progress) return;
  let ticking = false;

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = Math.min(100, Math.max(0, pct)) + '%';
    nav.style.boxShadow = window.scrollY > 50 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });

  update();
}

function initProjectSwitcher() {
  const trigger = document.querySelector('.case-nav-select');
  const menu = document.querySelector('.case-nav-menu');
  if (!trigger || !menu) return;

  function close() {
    menu.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function open() {
    menu.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  });

  menu.querySelectorAll('.case-nav-menu__item').forEach(item => {
    item.addEventListener('click', () => {
      const href = item.dataset.href;
      if (href) window.location.href = href;
    });
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== trigger) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function initMazeIconMotion() {
  var item = document.querySelector('.accordion-item');
  if (!item) return;
  var motion = item.querySelector('.icon-maze-motion');
  if (!motion) return;

  item.addEventListener('mouseenter', function() {
    motion.beginElement();
  });

  item.addEventListener('mouseleave', function() {
    motion.endElement();
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
  initProjectSwitcher();
  initMazeIconMotion();
  initHamburgerMenu();
});
