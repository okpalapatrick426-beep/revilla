import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page-new">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card-new">
        <button className="auth-back-btn" onClick={() => navigate('/')}>← Back</button>

        <div className="auth-logo-new">
          <div className="auth-r-icon">R</div>
          <span>Revilla</span>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="auth-form-new">
          <div className="auth-field">
            <label>Email or Username</label>
            <input type="text" placeholder="you@example.com"
              value={form.emailOrUsername}
              onChange={e => setForm(p => ({ ...p, emailOrUsername: e.target.value }))} required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch-new">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
