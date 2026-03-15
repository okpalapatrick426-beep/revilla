import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  // stage 0: logo animates in
  // stage 1: tagline fades in
  // stage 2: buttons slide up

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={styles.container}>
      {/* Background glow */}
      <div style={styles.glow} />

      {/* Logo */}
      <div style={{ ...styles.logoWrap, ...(stage >= 0 ? styles.logoVisible : {}) }}>
        <div style={styles.logoRing}>
          <div style={styles.logoInner}>
            <span style={styles.logoLetter}>R</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <div style={{ ...styles.textWrap, opacity: stage >= 1 ? 1 : 0, transform: stage >= 1 ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.7s ease' }}>
        <h1 style={styles.appName}>Revilla</h1>
        <p style={styles.tagline}>The way you love it</p>
        <p style={styles.subtitle}>Connect. Share. Sell. All in one place.</p>
      </div>

      {/* Buttons */}
      <div style={{ ...styles.btnWrap, opacity: stage >= 2 ? 1 : 0, transform: stage >= 2 ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.6s ease' }}>
        <button
          style={styles.btnPrimary}
          onClick={() => navigate('/register')}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Get Started
        </button>
        <button
          style={styles.btnSecondary}
          onClick={() => navigate('/login')}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          I already have an account
        </button>
      </div>

      {/* Bottom tag */}
      <p style={styles.bottomTag}>revilla.vercel.app</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    minHeight: '100dvh',
    width: '100vw',
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    gap: '0px',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  logoWrap: {
    opacity: 0,
    transform: 'scale(0.6)',
    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
    marginBottom: '40px',
  },
  logoVisible: {
    opacity: 1,
    transform: 'scale(1)',
  },
  logoRing: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, #7c3aed, #22c55e, #7c3aed)',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 60px rgba(124,58,237,0.4), 0 0 120px rgba(34,197,94,0.15)',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: '4rem',
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    letterSpacing: '-2px',
  },
  textWrap: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  appName: {
    fontSize: '2.4rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: '1.1rem',
    color: '#a78bfa',
    margin: '0 0 10px',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#484f58',
    margin: 0,
  },
  btnWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '340px',
  },
  btnPrimary: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.15s',
    boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
    letterSpacing: '0.3px',
  },
  btnSecondary: {
    width: '100%',
    padding: '15px',
    background: 'transparent',
    color: '#e6edf3',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.15s',
    backdropFilter: 'blur(8px)',
  },
  bottomTag: {
    position: 'absolute',
    bottom: '24px',
    fontSize: '0.75rem',
    color: '#2a2a3a',
    letterSpacing: '0.5px',
  },
};
