import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const [phase, setPhase] = useState('logo'); // logo → tagline → cta
  const navigate = useNavigate();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 1600);
    const t2 = setTimeout(() => setPhase('cta'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={styles.page}>
      {/* Purple glow orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />

      <div style={styles.content}>
        {/* Logo */}
        <div style={{
          ...styles.logoWrap,
          transform: phase !== 'logo' ? 'translateY(-24px)' : 'translateY(0)',
          transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={styles.logoCircle}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
              <circle cx="40" cy="40" r="38" stroke="#BF5FFF" strokeWidth="2.5" opacity="0.6"/>
              <circle cx="40" cy="40" r="30" fill="#BF5FFF" fillOpacity="0.15"/>
              <text x="40" y="54" textAnchor="middle" fill="white" fontSize="38"
                fontWeight="800" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">R</text>
            </svg>
          </div>
          <div style={styles.brandName}>Revilla</div>
        </div>

        {/* Tagline */}
        <div style={{
          ...styles.tagline,
          opacity: phase === 'tagline' || phase === 'cta' ? 1 : 0,
          transform: phase === 'tagline' || phase === 'cta' ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          the way you love it
        </div>

        {/* Sub + CTAs */}
        <div style={{
          ...styles.ctaWrap,
          opacity: phase === 'cta' ? 1 : 0,
          transform: phase === 'cta' ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
          pointerEvents: phase === 'cta' ? 'auto' : 'none',
        }}>
          <p style={styles.sub}>Connect. Share. Sell. All in one place.</p>
          <button style={styles.btnPrimary} onClick={() => navigate('/register')}
            onMouseEnter={e => e.target.style.opacity = '0.9'}
            onMouseLeave={e => e.target.style.opacity = '1'}>
            Get Started
          </button>
          <button style={styles.btnSecondary} onClick={() => navigate('/login')}
            onMouseEnter={e => { e.target.style.background = 'rgba(191,95,255,0.1)'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; }}>
            I already have an account
          </button>
        </div>
      </div>

      <div style={styles.bottomLabel}>revilla.vercel.app</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0A0A0F',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  orb1: {
    width: 320,
    height: 320,
    background: 'rgba(191,95,255,0.18)',
    top: '-80px',
    right: '-60px',
  },
  orb2: {
    width: 260,
    height: 260,
    background: 'rgba(191,95,255,0.10)',
    bottom: '-60px',
    left: '-40px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    zIndex: 1,
    width: '100%',
    maxWidth: 400,
    padding: '0 28px',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
  },
  brandName: {
    fontSize: 42,
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '-1px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  tagline: {
    fontSize: 18,
    color: '#BF5FFF',
    fontWeight: 500,
    letterSpacing: '0.2px',
  },
  ctaWrap: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  sub: {
    fontSize: 13,
    color: '#666',
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
    color: '#333',
    letterSpacing: '0.5px',
  },
};
