import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.emailOrUsername || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />

      <button style={styles.backBtn} onClick={() => navigate('/')}>
        ← Back
      </button>

      <div style={styles.card}>
        <div style={styles.logoSmall}>R</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to Revilla</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email or Username</label>
            <input
              style={styles.input}
              name="emailOrUsername"
              type="text"
              placeholder="your@email.com"
              value={form.emailOrUsername}
              onChange={handleChange}
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <span style={styles.link} onClick={() => navigate('/register')}>
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    minHeight: '100dvh',
    width: '100vw',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflowY: 'auto',
  },
  glow: {
    position: 'fixed',
    top: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '500px', height: '300px',
    background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  backBtn: {
    position: 'fixed',
    top: '20px', left: '20px',
    background: 'none',
    border: 'none',
    color: '#8b949e',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    zIndex: 10,
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(22,27,34,0.8)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '36px 28px',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1,
  },
  logoSmall: {
    width: '44px', height: '44px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '1.2rem', color: '#fff',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#e6edf3',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#484f58',
    margin: '0 0 28px',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#f87171',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '500',
    color: '#8b949e',
  },
  input: {
    background: 'rgba(13,17,23,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '13px 16px',
    color: '#e6edf3',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
    transition: 'opacity 0.15s, transform 0.15s',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#484f58',
    marginTop: '20px',
  },
  link: {
    color: '#a78bfa',
    cursor: 'pointer',
    fontWeight: '600',
  },
};
