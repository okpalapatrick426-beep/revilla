import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    username: '', email: '', password: '', displayName: '',
    referralCode: params.get('ref') || '',
  });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user);
      toast.success('Welcome to Revilla!');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
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
        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Join Revilla today</p>
        <form onSubmit={handleSubmit} className="auth-form-new">
          <div className="auth-field">
            <label>Display Name</label>
            <input type="text" placeholder="Your full name"
              value={form.displayName}
              onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} required />
          </div>
          <div className="auth-field">
            <label>Username</label>
            <input type="text" placeholder="yourname"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
          </div>
          <div className="auth-field">
            <label>Referral Code (optional)</label>
            <input type="text" placeholder="Enter code if you have one"
              value={form.referralCode}
              onChange={e => setForm(p => ({ ...p, referralCode: e.target.value }))} />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch-new">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
