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

/**
 * Expandable service cards. Each card's toggle button reveals a second
 * layer of content (overview, deliverables, problem solved, CTA) inside
 * the same card — the height/opacity animation itself is pure CSS (a
 * grid-template-rows transition, see styles.css), this only manages
 * state: which card is open, the button's label/aria-expanded, and
 * making the collapsed panel properly unreachable via `inert` (so
 * keyboard/screen-reader users can't tab into content that isn't
 * visible, even though it's still in the DOM for the CSS transition).
 *
 * Only one card is open at a time — opening a card closes whichever
 * other one was open, on every screen size.
 */
function initExpandableCards() {
  const cards = document.querySelectorAll('.card[data-icon]');
  if (!cards.length) return;

  const closeCard = (card) => {
    const toggle = card.querySelector('.card__toggle');
    const panel = card.querySelector('.card__panel');
    const label = toggle.querySelector('.card__toggle-label');
    card.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = 'Explore the service';
    if (panel) panel.setAttribute('inert', '');
  };

  const openCard = (card) => {
    const toggle = card.querySelector('.card__toggle');
    const panel = card.querySelector('.card__panel');
    const label = toggle.querySelector('.card__toggle-label');
    card.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = 'Close';
    if (panel) panel.removeAttribute('inert');
  };

  cards.forEach(card => {
    const toggle = card.querySelector('.card__toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const wasOpen = card.classList.contains('is-open');

      cards.forEach(other => {
        if (other !== card) closeCard(other);
      });

      if (wasOpen) {
        closeCard(card);
      } else {
        openCard(card);
      }
    });
  });
}

/**
 * "Discuss this service ->" inside each expanded panel: scrolls to the
 * contact section and preselects the matching option in the service
 * field, so the inquiry form arrives already scoped to what the visitor
 * was just reading about.
 */
function initServiceCta() {
  const ctas = document.querySelectorAll('.card__cta[data-service]');
  if (!ctas.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ctas.forEach(cta => {
    cta.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      const select = document.getElementById('contact-service');
      if (select) select.value = cta.dataset.service;
      if (contact) contact.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      const nameField = document.getElementById('contact-name');
      if (nameField) {
        // delay the focus until the scroll has roughly settled, so
        // focusing the field doesn't yank the viewport mid-scroll
        setTimeout(() => nameField.focus({ preventScroll: true }), reduceMotion ? 0 : 500);
      }
    });
  });
}

/**
 * The site has no backend, so — consistent with every other CTA on this
 * page — submitting the form composes a mailto: with the details filled
 * in rather than pretending to POST somewhere. Honest about what it
 * actually does instead of showing a fake "message sent" state.
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const SERVICE_LABELS = {
    'digital-experiences': 'Digital Experiences',
    'brand-identity': 'Brand & Identity',
    'product-design': 'Product Design',
    'creative-systems': 'Creative Systems',
    general: 'General inquiry'
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const service = form.elements.service.value;
    const message = form.elements.message.value.trim();
    const serviceLabel = SERVICE_LABELS[service] || service;

    const subject = service ? `New inquiry: ${serviceLabel}` : 'New inquiry';
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      service ? `Service: ${serviceLabel}` : null,
      '',
      message
    ].filter(line => line !== null).join('\n');

    window.location.href = `mailto:hello@fourcircles.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initNavScroll();
  initScrollReveal();
  initIconAnimations();
  initExpandableCards();
  initServiceCta();
  initContactForm();
});
