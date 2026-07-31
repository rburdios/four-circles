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
 * Service icon animations: entrance draw-in (once per card, triggered on
 * scroll into view), a near-imperceptible ambient loop that only runs
 * while the card is both settled and on screen, and a short hover/focus
 * replay. All actual motion lives in CSS keyframes (styles.css, "SERVICE
 * ICON ANIMATIONS"); this just toggles the classes those keyframes key off.
 *
 * Per-icon timing below mirrors the CSS: `settleMs` is when the entrance
 * finishes drawing, `ambientMs` is when any "lock-in" finishing touch has
 * also finished, so the idle loop never overlaps the entrance.
 */
function initIconAnimations() {
  const cards = document.querySelectorAll('.card[data-icon]');
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // base CSS already renders icons fully drawn/settled

  const TIMING = {
    digital: { settleMs: 1780, ambientMs: 2800 },
    brand: { settleMs: 1710, ambientMs: 1910 },
    product: { settleMs: 1900, ambientMs: 2400 },
    creative: { settleMs: 1690, ambientMs: 2190 }
  };

  // --- Entrance: runs once, the first time each card is well into view ---
  if ('IntersectionObserver' in window) {
    const entranceObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const timing = TIMING[card.dataset.icon] || { settleMs: 1800, ambientMs: 2400 };

        card.classList.add('is-visible');
        setTimeout(() => card.classList.add('is-settled'), timing.settleMs);
        setTimeout(() => card.classList.add('is-ambient'), timing.ambientMs);

        entranceObserver.unobserve(card);
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(card => entranceObserver.observe(card));

    // --- Ambient pause/resume: ongoing, toggles every time visibility changes ---
    const viewportObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.1 });

    cards.forEach(card => viewportObserver.observe(card));
  }

  // --- Hover / keyboard focus: one short ambient replay, not the full entrance ---
  cards.forEach(card => {
    const replay = () => {
      card.classList.remove('is-hover-pulse');
      void card.offsetWidth; // force reflow so the animation restarts if retriggered quickly
      card.classList.add('is-hover-pulse');
    };
    const release = () => card.classList.remove('is-hover-pulse');

    card.addEventListener('mouseenter', replay);
    card.addEventListener('mouseleave', release);
    card.addEventListener('focusin', replay);
    card.addEventListener('focusout', release);
  });
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
  initScrollReveal();
  initIconAnimations();
});
