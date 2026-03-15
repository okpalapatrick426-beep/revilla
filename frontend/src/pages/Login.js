import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'expired') setError('Your magic link expired. Request a new one.');
    if (err === 'invalid') setError('Invalid link. Please try again.');

    // Check if already logged in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/app');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/magic`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.back} onClick={() => navigate('/')}>← Back</button>

        <div style={s.logoWrap}>
          <div style={s.logo}>R</div>
          <h1 style={s.title}>{sent ? 'Check your inbox' : 'Sign in to Revilla'}</h1>
          <p style={s.sub}>
            {sent
              ? `We sent a magic link to ${email}`
              : "Enter your email — we'll send you a link to sign in instantly. No password needed."}
          </p>
        </div>

        {!sent ? (
          <>
            {error && <div style={s.error}>{error}</div>}
            <form onSubmit={handleSubmit} style={s.form}>
              <input
                style={s.input}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoFocus
                autoComplete="email"
              />
              <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? (
                  <span style={s.loadingWrap}>
                    <span style={s.spinner} />
                    Sending...
                  </span>
                ) : 'Send Magic Link ✨'}
              </button>
            </form>
            <p style={s.note}>New to Revilla? Just enter your email — we'll create your account automatically.</p>
          </>
        ) : (
          <div style={s.sentWrap}>
            <div style={s.mailIcon}>✉️</div>
            <div style={s.sentSteps}>
              <div style={s.step}><span style={s.stepNum}>1</span><span>Open your email app</span></div>
              <div style={s.step}><span style={s.stepNum}>2</span><span>Find the email from Revilla</span></div>
              <div style={s.step}><span style={s.stepNum}>3</span><span>Tap "Sign In to Revilla"</span></div>
            </div>
            <p style={s.expiry}>Link expires in 60 minutes</p>
            <button style={s.resendBtn} onClick={() => { setSent(false); setError(''); }}>
              Use different email
            </button>
            <button style={s.resendBtn2} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Resending...' : 'Resend link'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: #7c3aed !important; outline: none; }`}</style>
    </div>
  );
}

const s = {
  page: { minHeight: '100dvh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' },
  card: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column' },
  back: { background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: '0.875rem', padding: '0 0 20px', textAlign: 'left', alignSelf: 'flex-start' },
  logoWrap: { textAlign: 'center', marginBottom: '28px' },
  logo: { width: '56px', height: '56px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginBottom: '18px', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' },
  title: { margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '700', color: '#fff' },
  sub: { margin: 0, fontSize: '0.875rem', color: '#8b949e', lineHeight: '1.6' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '14px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' },
  input: { width: '100%', background: '#161b22', border: '1.5px solid #21262d', borderRadius: '12px', padding: '14px 16px', color: '#e6edf3', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' },
  loadingWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  spinner: { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' },
  note: { textAlign: 'center', color: '#21262d', fontSize: '0.8rem', margin: '0 0 8px', lineHeight: '1.5' },
  sentWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  mailIcon: { fontSize: '4rem' },
  sentSteps: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' },
  step: { display: 'flex', alignItems: 'center', gap: '12px', background: '#161b22', border: '1px solid #21262d', borderRadius: '10px', padding: '12px 16px', color: '#e6edf3', fontSize: '0.875rem' },
  stepNum: { width: '24px', height: '24px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 },
  expiry: { color: '#484f58', fontSize: '0.78rem', margin: 0 },
  resendBtn: { background: 'none', border: '1px solid #21262d', color: '#8b949e', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.85rem', width: '100%' },
  resendBtn2: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.85rem', width: '100%' },
};
