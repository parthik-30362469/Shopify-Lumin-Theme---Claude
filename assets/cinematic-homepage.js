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

  /* ── 6. Marquee drag-to-scroll (mouse + touch) ── */
  (function () {
    var viewport = qs('.lumin-marquee-viewport');
    var track    = qs('.lumin-marquee-track');
    if (!viewport || !track) return;

    /*
     * WHY JS time-tracking instead of getComputedStyle:
     * Mobile Safari runs CSS animations on the GPU compositor thread.
     * getComputedStyle(track).transform returns the *static* value (0),
     * not the live animated frame. So drag always started from 0 = first card.
     * Instead we track elapsed time ourselves and compute the position from that.
     */
    var animStartMs = performance.now();   /* updated every time we set a new delay */
    var dragging    = false;
    var startX      = 0;
    var startY      = 0;
    var basePos     = 0;    /* animation x at moment drag started */
    var currentPos  = 0;    /* live x during drag */

    function halfTrack() {
      /* scrollWidth is unaffected by transforms — safe to read during drag */
      return (track.scrollWidth / 2) || 1440;
    }

    function getDurMs() {
      return window.matchMedia('(max-width: 749px)').matches ? 13000 : 20000;
    }

    /* Compute where the CSS animation is RIGHT NOW using our wall-clock tracker */
    function getJsPos() {
      var ht  = halfTrack();
      var dur = getDurMs();
      var elapsed = (performance.now() - animStartMs) % dur;
      return -(elapsed / dur) * ht;
    }

    /* Resume the CSS animation seamlessly from any pixel offset */
    function resumeFrom(pos) {
      var ht  = halfTrack();
      var dur = getDurMs();

      /* Normalize pos to [-ht, 0) using sign-safe modulo */
      var mag      = ((-pos) % ht + ht) % ht;
      var progress = mag / ht;                         /* 0 → 1 */
      var delaySec = -(progress * dur / 1000);         /* negative = start mid-cycle */

      /* Keep our JS clock in sync with the new starting point */
      animStartMs = performance.now() - progress * dur;

      /* Set delay first (paused animation updates its frozen frame to match),
         then in the next paint remove the inline overrides — zero visual snap */
      track.style.setProperty('animation-delay', delaySec + 's', 'important');
      requestAnimationFrame(function () {
        track.style.removeProperty('transform');
        track.style.removeProperty('animation-play-state');
      });
    }

    function dragStart(x, y) {
      dragging   = true;
      startX     = x;
      startY     = y;
      basePos    = getJsPos();      /* read position from JS clock, not getComputedStyle */
      currentPos = basePos;
      /* Lock the track at exactly this pixel — no snap, even on mobile Safari */
      track.style.setProperty('transform', 'translateX(' + basePos + 'px)', 'important');
      track.style.setProperty('animation-play-state', 'paused', 'important');
    }

    function dragMove(x, y) {
      if (!dragging) return;
      currentPos = basePos + (x - startX);
      track.style.setProperty('transform', 'translateX(' + currentPos + 'px)', 'important');
    }

    function dragEnd() {
      if (!dragging) return;
      dragging = false;
      resumeFrom(currentPos);
    }

    /* ── Mouse ── */
    viewport.addEventListener('mousedown', function (e) {
      dragStart(e.clientX, e.clientY);
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) { dragMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup',   dragEnd);

    /* ── Touch ── */
    viewport.addEventListener('touchstart', function (e) {
      dragStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    viewport.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var dx = Math.abs(e.touches[0].clientX - startX);
      var dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy) e.preventDefault();   /* only block scroll for horizontal swipes */
      dragMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    viewport.addEventListener('touchend',    dragEnd, { passive: true });
    viewport.addEventListener('touchcancel', dragEnd, { passive: true });
  }());

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
