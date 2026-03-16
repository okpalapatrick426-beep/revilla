import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Register() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Enter your name'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/easy-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.back} onClick={() => navigate('/')}>← Back</button>
        <div style={s.logoWrap}>
          <div style={s.logo}>R</div>
          <h1 style={s.title}>Join Revilla</h1>
          <p style={s.sub}>The way you love it — Connect. Share. Sell.</p>
        </div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Your name</label>
            <input
              style={s.input}
              placeholder="e.g. Patrick Okpala"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Email address</label>
            <input
              style={s.input}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Getting you in...' : 'Enter Revilla →'}
          </button>
        </form>
        <p style={s.note}>No password needed — ever.</p>
      </div>
      <style>{`input:focus { border-color: #7c3aed !important; outline: none; }`}</style>
    </div>
  );
}

const s = {
  page: { minHeight: '100dvh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' },
  card: { width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column' },
  back: { background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: '0.875rem', padding: '0 0 20px', textAlign: 'left', alignSelf: 'flex-start' },
  logoWrap: { textAlign: 'center', marginBottom: '28px' },
  logo: { width: '56px', height: '56px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginBottom: '18px', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' },
  title: { margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '700', color: '#fff' },
  sub: { margin: 0, fontSize: '0.875rem', color: '#8b949e', lineHeight: '1.5' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '14px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', fontWeight: '600', color: '#8b949e' },
  input: { width: '100%', background: '#161b22', border: '1.5px solid #21262d', borderRadius: '12px', padding: '13px 16px', color: '#e6edf3', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' },
  note: { textAlign: 'center', color: '#484f58', fontSize: '0.78rem', margin: 0 },
};