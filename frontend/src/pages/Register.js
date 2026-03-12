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
      toast.success('Welcome to NexChat!');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Revilla</div>
        <h2>Create account</h2>
        <p>Join NexChat today</p>
        <form onSubmit={handleSubmit}>
          {[
            { key: 'displayName', label: 'Display Name', type: 'text' },
            { key: 'username', label: 'Username', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: 'Password', type: 'password' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
            </div>
          ))}
          <div className="form-group">
            <label>Referral Code (optional)</label>
            <input type="text" value={form.referralCode} onChange={e => setForm(p => ({ ...p, referralCode: e.target.value }))} />
          </div>

          <div className="terms-notice">
            By registering you agree to our Terms of Service. Platform moderators can see group messages and, 
            if you opt in, your location. Direct messages are private.
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
