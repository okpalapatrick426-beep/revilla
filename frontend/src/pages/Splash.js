import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── REVILLA LOGO SVG ─────────────────────────────────────────────────────────
// Custom R lettermark inside a rounded square with glow ring
const RevillaLogo = ({ size = 90 }) => (
  <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D580FF" />
        <stop offset="100%" stopColor="#8B00FF" />
      </linearGradient>
      <linearGradient id="ringGrad" x1="0" y1="0" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BF5FFF" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#8B00FF" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#BF5FFF" stopOpacity="0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Outer glow ring */}
    <circle cx="45" cy="45" r="43" stroke="url(#ringGrad)" strokeWidth="1.5" fill="none" filter="url(#glow)" />
    {/* Inner rounded square background */}
    <rect x="12" y="12" width="66" height="66" rx="18" fill="url(#logoGrad)" />
    {/* R lettermark */}
    <text
      x="45" y="62"
      textAnchor="middle"
      fill="white"
      fontSize="42"
      fontWeight="800"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif"
      letterSpacing="-1"
    >R</text>
  </svg>
);

export default function Splash() {
  const [phase, setPhase] = useState('logo'); // logo → tagline → cta
  const navigate = useNavigate();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 1600);
    const t2 = setTimeout(() => setPhase('cta'),     2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={s.page}>
      {/* Purple glow orbs */}
      <div style={{ ...s.orb, ...s.orb1 }} />
      <div style={{ ...s.orb, ...s.orb2 }} />
      <div style={{ ...s.orb, ...s.orb3 }} />

      <div style={s.content}>

        {/* ── LOGO + NAME ── */}
        <div style={{
          ...s.logoWrap,
          transform: phase !== 'logo' ? 'translateY(-20px)' : 'translateY(0)',
          transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Pulsing glow behind logo */}
          <div style={s.logoGlow} />
          <RevillaLogo size={96} />
          <div style={s.brandName}>Revilla</div>
        </div>

        {/* ── TAGLINE ── */}
        <div style={{
          ...s.tagline,
          opacity:    phase === 'tagline' || phase === 'cta' ? 1 : 0,
          transform:  phase === 'tagline' || phase === 'cta' ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          the way you love it
        </div>

        {/* ── CTA ── */}
        <div style={{
          ...s.ctaWrap,
          opacity:       phase === 'cta' ? 1 : 0,
          transform:     phase === 'cta' ? 'translateY(0)' : 'translateY(22px)',
          transition:    'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
          pointerEvents: phase === 'cta' ? 'auto' : 'none',
        }}>
          <p style={s.sub}>Connect. Share. Sell. All in one place.</p>

          <button style={s.btnPrimary}
            onClick={() => navigate('/register')}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Get Started
          </button>

          <button style={s.btnSecondary}
            onClick={() => navigate('/login')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(191,95,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            I already have an account
          </button>
        </div>
      </div>

      <div style={s.bottomLabel}>revilla.vercel.app</div>

      <style>{`
        @keyframes orbFloat {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes logoPulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.6) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0A0A0F',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  orb1: {
    width: 360, height: 360,
    background: 'rgba(191,95,255,0.20)',
    top: '-100px', right: '-80px',
    animation: 'orbFloat 7s ease-in-out infinite',
  },
  orb2: {
    width: 280, height: 280,
    background: 'rgba(139,0,255,0.12)',
    bottom: '-70px', left: '-60px',
    animation: 'orbFloat 7s ease-in-out infinite 2.5s',
  },
  orb3: {
    width: 180, height: 180,
    background: 'rgba(191,95,255,0.10)',
    top: '40%', left: '25%',
    animation: 'orbFloat 7s ease-in-out infinite 5s',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 22,
    zIndex: 1,
    width: '100%',
    maxWidth: 400,
    padding: '0 28px',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    animation: 'logoIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  logoGlow: {
    position: 'absolute',
    width: 130, height: 130,
    borderRadius: '50%',
    background: 'rgba(191,95,255,0.25)',
    filter: 'blur(30px)',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'logoPulse 2.5s ease-in-out infinite',
    pointerEvents: 'none',
  },
  brandName: {
    fontSize: 44,
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-1.5px',
    lineHeight: 1,
  },
  tagline: {
    fontSize: 17,
    color: '#BF5FFF',
    fontWeight: 500,
    letterSpacing: '0.3px',
  },
  ctaWrap: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  sub: {
    fontSize: 13,
    color: '#44445A',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  btnPrimary: {
    width: '100%',
    padding: '15px 0',
    background: '#BF5FFF',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    boxShadow: '0 6px 24px rgba(191,95,255,0.35)',
  },
  btnSecondary: {
    width: '100%',
    padding: '14px 0',
    background: 'transparent',
    color: '#BF5FFF',
    border: '1px solid rgba(191,95,255,0.35)',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  bottomLabel: {
    position: 'absolute',
    bottom: 20,
    fontSize: 11,
    color: '#1A1A26',
    letterSpacing: '0.5px',
  },
};
