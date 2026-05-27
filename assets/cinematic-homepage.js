/**
 * Cinematic Homepage Animations
 * Parallax hero, scroll-reveal, mouse indicator, header fade
 */

(function () {
  'use strict';

  if (!document.body.classList.contains('template-index')) return;

  /* ── Utilities ─────────────────────────────────────────── */

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ── 1. Parallax hero image ─────────────────────────────── */

  const heroMedia = qs('.banner .banner__media');

  if (heroMedia) {
    let rafPending = false;

    function onScrollParallax() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () {
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        if (scrollY <= vh) {
          heroMedia.style.transform = 'translateY(' + (scrollY * 0.28) + 'px)';
        }
        rafPending = false;
      });
    }

    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  /* ── 2. Scroll-reveal (IntersectionObserver) ───────────── */

  const revealSelectors = [
    '.banner__content',
    '.collection__title',
    '.card-wrapper',
    '.image-with-text',
    '.rich-text__heading',
    '.lumin-slide__section',
    '.logo-wrapper',
  ];

  const revealTargets = qsa(revealSelectors.join(', '));

  revealTargets.forEach(function (el) {
    el.classList.add('cine-reveal');
  });

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('cine-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
  );

  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  /* ── 3. Mouse / scroll indicator on hero ──────────────── */

  const heroSection = qs('.banner');

  if (heroSection) {
    const indicator = document.createElement('div');
    indicator.className = 'cine-scroll-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    indicator.innerHTML =
      '<div class="cine-scroll-indicator__mouse">' +
        '<div class="cine-scroll-indicator__dot"></div>' +
      '</div>' +
      '<div class="cine-scroll-indicator__line"></div>';

    heroSection.appendChild(indicator);

    /* Fade indicator out as user scrolls */
    let indicatorRaf = false;
    window.addEventListener(
      'scroll',
      function () {
        if (indicatorRaf) return;
        indicatorRaf = true;
        requestAnimationFrame(function () {
          const progress = Math.min(window.scrollY / (window.innerHeight * 0.4), 1);
          indicator.style.opacity = String(1 - progress);
          indicatorRaf = false;
        });
      },
      { passive: true }
    );
  }

  /* ── 4. Header: add .cine-scrolled once user scrolls ──── */

  const headerWrapper = qs('.header-wrapper');
  let headerRaf = false;

  function updateHeader() {
    if (!headerWrapper) return;
    if (window.scrollY > 70) {
      headerWrapper.classList.add('cine-scrolled');
    } else {
      headerWrapper.classList.remove('cine-scrolled');
    }
  }

  window.addEventListener(
    'scroll',
    function () {
      if (headerRaf) return;
      headerRaf = true;
      requestAnimationFrame(function () {
        updateHeader();
        headerRaf = false;
      });
    },
    { passive: true }
  );

  /* Run once on load in case page is restored mid-scroll */
  updateHeader();

  /* ── 5. Stagger reveal for product-grid cards ──────────── */

  qsa('.product-grid > .grid__item').forEach(function (item, idx) {
    const card = qs('.card-wrapper', item);
    if (card) {
      card.style.setProperty('--cine-delay', (idx * 0.1) + 's');
    }
  });

})();
