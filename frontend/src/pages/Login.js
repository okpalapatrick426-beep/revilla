import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Login() {
  const navigate = useNavigate();
  const [isNew, setIsNew] = useState(false); // toggle register/login
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/app');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email'); return; }
    if (!password.trim()) { setError('Enter your password'); return; }
    if (isNew && !username.trim()) { setError('Enter a username'); return; }

    setLoading(true);
    setError('');

    try {
      const endpoint = isNew ? '/api/auth/register' : '/api/auth/login';
      const body = isNew
        ? { username: username.trim(), email: email.trim().toLowerCase(), password }
        : { emailOrUsername: email.trim().toLowerCase(), password };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <h1 style={s.title}>{isNew ? 'Create your account' : 'Welcome back'}</h1>
          <p style={s.sub}>{isNew ? 'Join Revilla today.' : 'Sign in to continue.'}</p>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          {isNew && (
            <input
              style={s.input}
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
            />
          )}
          <input
            style={s.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            autoFocus
            autoComplete="email"
          />
          <input
            style={s.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            autoComplete={isNew ? 'new-password' : 'current-password'}
          />
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? (
              <span style={s.loadingWrap}><span style={s.spinner} />Please wait...</span>
            ) : isNew ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={s.toggle}>
          {isNew ? 'Already have an account? ' : "Don't have an account? "}
          <span style={s.toggleLink} onClick={() => { setIsNew(!isNew); setError(''); }}>
            {isNew ? 'Sign in' : 'Sign up'}
          </span>
        </p>
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
  toggle: { textAlign: 'center', color: '#8b949e', fontSize: '0.85rem', margin: 0 },
  toggleLink: { color: '#a78bfa', cursor: 'pointer', fontWeight: '600' },
};