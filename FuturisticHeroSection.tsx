'use client';

/**
 * FuturisticHeroSection
 *
 * Dependencies:
 *   npm install framer-motion
 *   (Tailwind CSS already configured in your Next.js project)
 *
 * Drop this file into your app/components/ directory and import it
 * into any page.  No external 3D libraries required.
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RingConfig {
  id: string;
  /** Text repeated to fill the full circumference */
  text: string;
  /** Circle radius in px (at 1× scale) */
  radius: number;
  /** rotateX tilt in degrees — higher = more overhead perspective */
  tiltX: number;
  /** Full rotation duration in seconds */
  speed: number;
  /** 1 = clockwise, -1 = counter-clockwise */
  direction: 1 | -1;
  /** Base font size in px */
  fontSize: number;
  /** stdDeviation for the SVG glow filter */
  glowBlur: number;
  /** Entrance animation delay in seconds */
  delay: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ring definitions
// ─────────────────────────────────────────────────────────────────────────────

// Pre-repeat each string so it always fills the full circumference.
// Circumference ≈ 2π × r; at ~13 px/char we need (2πr)/13 chars.
const RINGS: RingConfig[] = [
  {
    id: 'ring-inner',
    text: 'SMARTER EVERYDAY LIVING  ·  '.repeat(6),  // r 155 → circ ≈ 975 px
    radius: 155,
    tiltX: 72,
    speed: 26,
    direction: 1,
    fontSize: 11.5,
    glowBlur: 4,
    delay: 0.4,
  },
  {
    id: 'ring-mid',
    text: 'TECH THAT SIMPLIFIES LIFE  ·  '.repeat(7), // r 215 → circ ≈ 1351 px
    radius: 215,
    tiltX: 68,
    speed: 38,
    direction: -1,
    fontSize: 11,
    glowBlur: 3.5,
    delay: 0.7,
  },
  {
    id: 'ring-outer',
    text: 'CURATED MODERN ESSENTIALS  ·  '.repeat(9), // r 275 → circ ≈ 1728 px
    radius: 275,
    tiltX: 74,
    speed: 52,
    direction: 1,
    fontSize: 10.5,
    glowBlur: 3,
    delay: 1.0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: TextRing
//
// Rendering strategy:
//   Container  → centers the ring at the canvas centre
//   TiltDiv    → rotateX(n°) creates the overhead-perspective ellipse look
//   SpinDiv    → Framer Motion continuously rotates around Z
//   SVG        → textPath lays the text along a circle
//
// The spin happens in the TiltDiv's LOCAL coordinate space, so the ring
// orbits in its own tilted plane — this produces the 3-D orbital illusion
// without any canvas or WebGL.
// ─────────────────────────────────────────────────────────────────────────────

function TextRing({ ring }: { ring: RingConfig }) {
  const pad  = 60;                       // extra space around the circle
  const size = ring.radius * 2 + pad;
  const c    = size / 2;                 // centre of SVG
  const r    = ring.radius;
  const pathId   = `${ring.id}-path`;
  const filterId = `${ring.id}-glow`;

  // SVG circle as a path (two arcs) for textPath compatibility
  const d = [
    `M ${c - r} ${c}`,
    `a ${r} ${r} 0 1 1 ${r * 2} 0`,
    `a ${r} ${r} 0 1 1 -${r * 2} 0`,
  ].join(' ');

  return (
    <motion.div
      key={ring.id}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { delay: ring.delay, duration: 1.8, ease: 'easeOut' },
        scale:   { delay: ring.delay, duration: 1.8, ease: [0.16, 1, 0.3, 1] },
      }}
      className="absolute"
      style={{
        width:      size,
        height:     size,
        left:       '50%',
        top:        '50%',
        marginLeft: -size / 2,
        marginTop:  -size / 2,
      }}
    >
      {/* 3-D tilt — CSS only so it never fights Framer Motion's transform */}
      <div
        style={{
          width:           '100%',
          height:          '100%',
          transform:       `perspective(1100px) rotateX(${ring.tiltX}deg)`,
          transformStyle:  'preserve-3d',
        }}
      >
        {/* Continuous spin — Framer Motion rotates in the tilted plane */}
        <motion.div
          animate={{ rotate: ring.direction > 0 ? 360 : -360 }}
          transition={{
            duration:   ring.speed,
            ease:       'linear',
            repeat:     Infinity,
            repeatType: 'loop',
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <path id={pathId} d={d} />
              {/* Neon-glow filter: two blurred layers beneath the crisp text */}
              <filter
                id={filterId}
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation={ring.glowBlur * 2}
                  result="bigBlur"
                />
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation={ring.glowBlur}
                  result="smallBlur"
                />
                <feMerge>
                  <feMergeNode in="bigBlur" />
                  <feMergeNode in="smallBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glow layer (blurred, slightly thicker) */}
            <text
              fill="rgba(255,255,255,0.35)"
              fontSize={ring.fontSize + 1}
              fontFamily="'Inter','Helvetica Neue',sans-serif"
              fontWeight="700"
              letterSpacing="0.18em"
              filter={`url(#${filterId})`}
            >
              <textPath href={`#${pathId}`} startOffset="0%">
                {ring.text}
              </textPath>
            </text>

            {/* Crisp white text on top */}
            <text
              fill="rgba(255,255,255,0.92)"
              fontSize={ring.fontSize}
              fontFamily="'Inter','Helvetica Neue',sans-serif"
              fontWeight="600"
              letterSpacing="0.18em"
            >
              <textPath href={`#${pathId}`} startOffset="0%">
                {ring.text}
              </textPath>
            </text>
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: GlassCenterObject
// ─────────────────────────────────────────────────────────────────────────────

function GlassCenterObject() {
  return (
    <div
      className="absolute"
      style={{
        left:       '50%',
        top:        '50%',
        transform:  'translate(-50%, -50%)',
        zIndex:     20,
      }}
    >
      {/* Ambient halo behind the object */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset:      '-60px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 68%)',
          filter:     'blur(24px)',
        }}
      />

      {/* Float animation */}
      <motion.div
        animate={{ y: [-14, 14] }}
        transition={{
          duration:   4.5,
          ease:       'easeInOut',
          repeat:     Infinity,
          repeatType: 'mirror',
        }}
      >
        {/* Entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, rotateY: -25 }}
          animate={{ opacity: 1, scale: 1,    rotateY:   0 }}
          transition={{ delay: 0.15, duration: 2, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: '700px' }}
        >
          {/* ── Glass box ── */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width:              148,
              height:             148,
              borderRadius:       28,
              background:         'linear-gradient(135deg,rgba(255,255,255,0.13) 0%,rgba(255,255,255,0.03) 60%,rgba(255,255,255,0.07) 100%)',
              backdropFilter:     'blur(28px)',
              WebkitBackdropFilter:'blur(28px)',
              border:             '1px solid rgba(255,255,255,0.18)',
              boxShadow: [
                'inset 0 1px 0 rgba(255,255,255,0.28)',
                'inset 0 -1px 0 rgba(255,255,255,0.06)',
                '0 0 0 1px rgba(255,255,255,0.04)',
                '0 24px 100px rgba(0,0,0,0.9)',
                '0 0 80px  rgba(255,255,255,0.05)',
              ].join(', '),
            }}
          >
            {/* Top-edge highlight streak */}
            <div
              className="absolute top-0 pointer-events-none"
              style={{
                left:       '20%',
                right:      '20%',
                height:     '1px',
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)',
                borderRadius: '999px',
              }}
            />

            {/* Slowly rotating inner conic gradient */}
            <motion.div
              className="absolute"
              style={{
                inset:        '12px',
                borderRadius: '20px',
                background:   'conic-gradient(from 0deg,rgba(255,255,255,0.25),transparent 40%,rgba(255,255,255,0.1) 70%,transparent)',
                opacity:      0.18,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 9, ease: 'linear', repeat: Infinity }}
            />

            {/* "IC" logotype */}
            <div className="relative z-10 select-none">
              <span
                style={{
                  display:       'block',
                  fontSize:      '54px',
                  fontWeight:    900,
                  lineHeight:    1,
                  letterSpacing: '-0.07em',
                  color:         'rgba(255,255,255,0.95)',
                  textShadow: [
                    '0 0  8px rgba(255,255,255,1)',
                    '0 0 20px rgba(255,255,255,0.85)',
                    '0 0 40px rgba(255,255,255,0.55)',
                    '0 0 80px rgba(255,255,255,0.25)',
                  ].join(', '),
                }}
              >
                IC
              </span>
            </div>

            {/* Bottom inner fade */}
            <div
              className="absolute bottom-0 inset-x-0 pointer-events-none"
              style={{
                height:       '40%',
                borderRadius: '0 0 28px 28px',
                background:   'linear-gradient(to top, rgba(255,255,255,0.03), transparent)',
              }}
            />
          </div>

          {/* Shadow / reflection underneath */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom:    '-28px',
              left:      '50%',
              transform: 'translateX(-50%)',
              width:     '70%',
              height:    '28px',
              background:'radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.28) 0%,transparent 70%)',
              filter:    'blur(10px)',
              opacity:   0.35,
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: LightStreak
// ─────────────────────────────────────────────────────────────────────────────

function LightStreak({ angle, delay }: { angle: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left:       '50%',
        top:        '50%',
        width:      '40vw',
        height:     '1px',
        marginTop:  '-0.5px',
        transformOrigin: 'left center',
        rotate:     angle,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, transparent 100%)',
      }}
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{
        opacity: [0, 0.18, 0.18, 0],
        scaleX:  [0, 0,    1,    1],
      }}
      transition={{
        duration:    2.8,
        delay,
        ease:        'easeOut',
        repeat:      Infinity,
        repeatDelay: 9,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: FloatingParticle
// ─────────────────────────────────────────────────────────────────────────────

function FloatingParticle({
  x, y, size, delay,
}: {
  x: string; y: string; size: number; delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left:      x,
        top:       y,
        width:     size,
        height:    size,
        background:'rgba(255,255,255,0.6)',
        boxShadow: `0 0 ${size * 3}px rgba(255,255,255,0.4)`,
      }}
      animate={{
        y:       [0, -30, 0],
        opacity: [0, 0.7, 0],
      }}
      transition={{
        duration:    4 + delay * 0.8,
        delay,
        ease:        'easeInOut',
        repeat:      Infinity,
        repeatDelay: 3 + delay,
      }}
    />
  );
}

const PARTICLES = [
  { x: '15%', y: '30%', size: 2,   delay: 0   },
  { x: '80%', y: '20%', size: 1.5, delay: 1.2 },
  { x: '25%', y: '65%', size: 1,   delay: 2.5 },
  { x: '70%', y: '70%', size: 2,   delay: 0.8 },
  { x: '50%', y: '15%', size: 1.5, delay: 3.2 },
  { x: '88%', y: '55%', size: 1,   delay: 1.8 },
  { x: '10%', y: '80%', size: 2,   delay: 2.1 },
  { x: '60%', y: '88%', size: 1,   delay: 0.5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main export: FuturisticHeroSection
// ─────────────────────────────────────────────────────────────────────────────

export default function FuturisticHeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // ── Responsive scale: shrink the ring animation on small viewports ──
  const [ringScale, setRingScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      // Natural size needs ~660 px; shrink proportionally below 700 px
      setRingScale(Math.min(1, vw / 680));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Mouse parallax ──────────────────────────────────────────────────
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springCfg = { damping: 28, stiffness: 90, mass: 0.6 };
  const smoothX = useSpring(rawX, springCfg);
  const smoothY = useSpring(rawY, springCfg);

  // Map ±0.5 (normalised mouse offset) to ±9° rotation
  const parallaxRotateY = useTransform(smoothX, [-0.5, 0.5], [-9, 9]);
  const parallaxRotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      rawX.set((e.clientX - rect.left - rect.width / 2)  / rect.width);
      rawY.set((e.clientY - rect.top  - rect.height / 2) / rect.height);
    },
    [rawX, rawY],
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col"
      style={{ perspective: '1400px' }}
    >

      {/* ── Background: radial ambient glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(255,255,255,0.055) 0%, transparent 70%)',
        }}
      />

      {/* ── Background: subtle noise texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.028,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
        }}
      />

      {/* ── Floating ambient particles ── */}
      {PARTICLES.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* ── Top brand label ── */}
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 pt-9 pb-0 flex justify-center"
      >
        <span
          className="text-[11px] font-semibold text-white uppercase"
          style={{
            letterSpacing: '0.42em',
            textShadow:    '0 0 22px rgba(255,255,255,0.55)',
          }}
        >
          INSTAZCART
        </span>
      </motion.header>

      {/* ── Center animation zone (parallax wrapper) ── */}
      <motion.div
        style={{
          rotateX:        parallaxRotateX,
          rotateY:        parallaxRotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative flex-1 flex items-center justify-center"
      >
        {/* Light streaks radiating from centre */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <LightStreak key={angle} angle={angle} delay={1.6 + i * 0.25} />
        ))}

        {/* Ring + object stage — uniformly scaled for small viewports */}
        <div
          style={{
            position:        'relative',
            width:           660,
            height:          660,
            transform:       `scale(${ringScale})`,
            transformOrigin: 'center center',
          }}
        >
          {RINGS.map((ring) => (
            <TextRing key={ring.id} ring={ring} />
          ))}

          <GlassCenterObject />
        </div>
      </motion.div>

      {/* ── Hero text ── */}
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 text-center px-6 pb-16"
      >
        {/* Main headline */}
        <h1
          className="font-black text-white leading-none tracking-tight mb-5"
          style={{
            fontSize:   'clamp(2.6rem, 7vw, 5.5rem)',
            textShadow: '0 0 60px rgba(255,255,255,0.18)',
          }}
        >
          Smarter Everyday Living
        </h1>

        {/* Subheading */}
        <p
          className="mx-auto mb-10 leading-relaxed"
          style={{
            maxWidth:  '460px',
            fontSize:  'clamp(0.9rem, 2vw, 1.1rem)',
            color:     'rgba(255,255,255,0.48)',
          }}
        >
          Curated tech essentials designed to simplify,
          upgrade, and elevate daily life.
        </p>

        {/* CTA button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="relative inline-flex items-center gap-3 text-black bg-white font-semibold uppercase rounded-full overflow-hidden"
          style={{
            padding:       '1rem 2.5rem',
            fontSize:      '0.8rem',
            letterSpacing: '0.14em',
            boxShadow:     '0 0 40px rgba(255,255,255,0.18)',
          }}
        >
          {/* Shimmer sweep on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg,transparent 25%,rgba(0,0,0,0.07) 50%,transparent 75%)',
            }}
            animate={{ x: ['-120%', '120%'] }}
            transition={{
              duration:    1.6,
              repeat:      Infinity,
              repeatDelay: 2.5,
              ease:        'easeInOut',
            }}
          />
          <span>Explore Collections</span>
          {/* Arrow icon */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 6.5H12M6.5 1L12 6.5L6.5 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </motion.div>
    </section>
  );
}
