function initNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const THRESHOLD = 40; // px scrolled before the solid backing fades in
  let ticking = false;

  const update = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > THRESHOLD);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update(); // set correct state on load (e.g. page opened mid-scroll on refresh)
}

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length || !('IntersectionObserver' in window)) return;

  revealElements.forEach(el => el.classList.add('reveal-init'));

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

  revealElements.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initNavScroll();
  initScrollReveal();
});
