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

  /* ── 6. Marquee — rAF-driven animation + drag override ── */
  (function () {
    var viewport = qs('.lumin-marquee-viewport');
    var track    = qs('.lumin-marquee-track');
    if (!viewport || !track) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /*
     * We drive the marquee with requestAnimationFrame instead of CSS @keyframes.
     * CSS animations on mobile Safari run on the GPU compositor thread, so
     * getComputedStyle always returns the *static* (non-animated) transform value.
     * Any drag that reads position via getComputedStyle gets 0 → resets to card 1.
     *
     * With rAF, `pos` is an in-memory JS number — always accurate, no compositor
     * issue, no animation-delay hacks, drag resumes from exactly where it left off.
     */
    track.style.setProperty('animation', 'none', 'important');

    var pos      = 0;       /* current translateX in px, always in [-ht, 0) */
    var ht       = 0;       /* half-track width px — lazily read once layout is stable */
    var lastTs   = null;    /* rAF timestamp of last painted frame */
    var hovered  = false;   /* desktop hover-pause */
    var dragging = false;
    var startX   = 0;
    var startY   = 0;
    var basePos  = 0;

    function getHt() {
      if (!ht) ht = track.scrollWidth / 2;
      return ht || 1920;            /* fallback: 6 cards × (300 + 20)px */
    }

    function speedPxPerMs() {
      var dur = window.matchMedia('(max-width: 749px)').matches ? 13000 : 20000;
      return getHt() / dur;
    }

    /* Wrap x into [-ht, 0) so the loop is seamless */
    function wrap(x) {
      var h = getHt();
      var r = x % -h;               /* JS % keeps sign of dividend */
      return r > 0 ? r - h : r;    /* if x was positive, shift into negative range */
    }

    function applyPos(x) {
      pos = wrap(x);
      track.style.setProperty('transform', 'translateX(' + pos + 'px)', 'important');
    }

    /* ── Animation loop ── */
    function loop(ts) {
      if (!hovered && !dragging) {
        if (lastTs !== null) applyPos(pos - (ts - lastTs) * speedPxPerMs());
        lastTs = ts;
      } else {
        lastTs = null;              /* zero lastTs so resume never jumps */
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* Hover-pause on pointer (non-touch) devices only */
    if (window.matchMedia('(hover: hover)').matches) {
      viewport.addEventListener('mouseenter', function () { hovered = true; });
      viewport.addEventListener('mouseleave', function () { hovered = false; });
    }

    /* ── Drag handlers ── */
    function onStart(x, y) {
      dragging = true;
      startX   = x;
      startY   = y;
      basePos  = pos;   /* pos is always current — rAF updates it every frame */
    }

    function onMove(x, y) {
      if (!dragging) return;
      applyPos(basePos + (x - startX));
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      /* rAF loop restarts automatically; lastTs = null prevents a velocity spike */
    }

    /* Mouse */
    viewport.addEventListener('mousedown', function (e) {
      onStart(e.clientX, e.clientY);
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup',   onEnd);

    /* Touch */
    viewport.addEventListener('touchstart', function (e) {
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    viewport.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var dx = Math.abs(e.touches[0].clientX - startX);
      var dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy) e.preventDefault();    /* let vertical page-scroll through */
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    viewport.addEventListener('touchend',    onEnd, { passive: true });
    viewport.addEventListener('touchcancel', onEnd, { passive: true });
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
