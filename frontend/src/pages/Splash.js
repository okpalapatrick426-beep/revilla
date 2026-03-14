import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const [phase, setPhase] = useState('logo'); // logo → tagline → cta
  const navigate = useNavigate();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 1800);
    const t2 = setTimeout(() => setPhase('cta'), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="splash-page">
      {/* Animated background orbs */}
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />
      <div className="splash-orb splash-orb-3" />

      <div className="splash-content">
        {/* Logo */}
        <div className={`splash-logo-wrap ${phase !== 'logo' ? 'splash-logo-up' : ''}`}>
          <div className="splash-r-logo">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" stroke="url(#grad1)" strokeWidth="3"/>
              <text x="40" y="54" textAnchor="middle" fill="white" fontSize="40" fontWeight="800" fontFamily="serif">R</text>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="80" y2="80">
                  <stop offset="0%" stopColor="#00a884"/>
                  <stop offset="100%" stopColor="#005c4b"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="splash-brand-name">Revilla</div>
        </div>

        {/* Tagline */}
        <div className={`splash-tagline ${phase === 'tagline' || phase === 'cta' ? 'splash-visible' : ''}`}>
          The way you love it
        </div>

        {/* CTA buttons */}
        <div className={`splash-cta ${phase === 'cta' ? 'splash-visible' : ''}`}>
          <div className="splash-cta-sub">Connect. Share. Sell. All in one place.</div>
          <button className="splash-btn-primary" onClick={() => navigate('/register')}>
            Get Started
          </button>
          <button className="splash-btn-secondary" onClick={() => navigate('/login')}>
            I already have an account
          </button>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="splash-wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="rgba(0,168,132,0.08)"/>
        </svg>
      </div>
    </div>
  );
}
