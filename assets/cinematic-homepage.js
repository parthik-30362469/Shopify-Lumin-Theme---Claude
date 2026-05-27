/**
 * Awwwards-Inspired Homepage
 * Scroll reveal, header border, quick-add hide
 */

(function () {
  'use strict';

  if (!document.body.classList.contains('template-index')) return;

  /* ── Utilities ────────────────────────────────────── */
  function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ── 1. Scroll-reveal via IntersectionObserver ───── */
  const revealSelectors = [
    '.banner__content',
    '.banner__media',
    '.logo-wrapper',
    '.collection__title',
    '.card-wrapper',
    '.image-with-text',
    '.rich-text__blocks',
    '.lumin-slide__section',
  ];

  const targets = qsa(revealSelectors.join(', '));

  targets.forEach(function (el) {
    el.classList.add('aw-reveal');
  });

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('aw-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { io.observe(el); });

  /* ── 2. Stagger delay on product cards ───────────── */
  qsa('.product-grid > .grid__item').forEach(function (item, idx) {
    var card = qs('.card-wrapper', item);
    if (card) card.style.setProperty('--aw-delay', (idx * 0.07) + 's');
  });

  /* ── 3. Hide quick-add buttons on product cards ──── */
  qsa('.quick-add, .card__badge').forEach(function (el) {
    el.style.display = 'none';
  });

})();
