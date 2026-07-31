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

/**
 * Service icon animations: the draw-in sequence (and its per-icon "lock-in"
 * finishing touch) plays only on hover or keyboard focus — never on load,
 * never on scroll, and nothing loops while idle. At rest the icon just
 * shows fully drawn (the plain, unanimated CSS state), so the page never
 * looks unfinished if JS fails to load. All the actual motion lives in
 * CSS keyframes (styles.css, "SERVICE ICON ANIMATIONS"); this only resets
 * and re-triggers them on each hover/focus so they can replay every time.
 *
 * `settleMs` mirrors the CSS: it's when the draw-in finishes, which is
 * also when each icon's "lock-in" (.is-settled) touch should start.
 */
function initIconAnimations() {
  const cards = document.querySelectorAll('.card[data-icon]');
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // base CSS already renders icons fully drawn; hover keeps only its plain opacity change

  const SETTLE_MS = {
    digital: 1780,
    brand: 1710,
    product: 1900,
    creative: 1690
  };

  cards.forEach(card => {
    const settleMs = SETTLE_MS[card.dataset.icon] || 1800;

    const replay = () => {
      clearTimeout(card._iconSettleTimer);
      card.classList.remove('is-visible', 'is-settled');
      void card.offsetWidth; // force reflow so the animation restarts on every hover, not just the first
      card.classList.add('is-visible');
      card._iconSettleTimer = setTimeout(() => card.classList.add('is-settled'), settleMs);
    };

    card.addEventListener('mouseenter', replay);
    card.addEventListener('focusin', replay);
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
  initIconAnimations();
});
