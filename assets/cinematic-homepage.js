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

  /* ── 4. Testimonial marquee — cards duplicated in Liquid for seamless loop ── */

  /* ── 5. Mobile auto-looping slideshow for product cards ── */
  (function () {
    var mq = window.matchMedia('(max-width: 749px)');
    if (!mq.matches) return;

    var slider = qs('.product-grid.slider--tablet');
    if (!slider) return;

    var items   = qsa('.grid__item', slider);
    if (items.length < 2) return;

    var current = 0;
    var INTERVAL = 2600; // ms between advances

    function advance() {
      var next = (current + 1) % items.length;

      if (next === 0) {
        // Wrap: jump to start instantly, then let the interval continue
        slider.style.scrollBehavior = 'auto';
        slider.scrollLeft = 0;
        requestAnimationFrame(function () {
          slider.style.scrollBehavior = '';
        });
      } else {
        // Scroll to next item's left edge
        var itemLeft = items[next].offsetLeft - slider.offsetLeft;
        slider.scrollTo({ left: itemLeft, behavior: 'smooth' });
      }

      current = next;
    }

    var timer = setInterval(advance, INTERVAL);

    // Pause auto-scroll while user is swiping
    slider.addEventListener('touchstart', function () {
      clearInterval(timer);
    }, { passive: true });

    slider.addEventListener('touchend', function () {
      // Resume after user finishes swiping — figure out which slide is now visible
      setTimeout(function () {
        var itemWidth = items[0] ? items[0].offsetWidth : 0;
        if (itemWidth > 0) {
          current = Math.round(slider.scrollLeft / (itemWidth + 16)) % items.length;
        }
        timer = setInterval(advance, INTERVAL);
      }, 600);
    }, { passive: true });
  }());

})();
