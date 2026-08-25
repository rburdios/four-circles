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
    '.hero-left, .hero-right, .services-header, .accordion-item, ' +
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

function initDigitalIconMotion() {
  const item = document.querySelector('.accordion-item');
  if (!item) return;
  const motion = item.querySelector('.icon-digital-motion');
  if (!motion) return;

  item.addEventListener('mouseenter', () => {
    motion.beginElement();
  });

  item.addEventListener('mouseleave', () => {
    motion.endElement();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAccordion();
  initScrollReveal();
  initNavScroll();
  initDigitalIconMotion();
});
