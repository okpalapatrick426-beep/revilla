import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const steps = [
  { id: 'name', label: 'What\'s your name?', fields: ['displayName', 'username'] },
  { id: 'contact', label: 'Your contact info', fields: ['email', 'password'] },
];

export default function Register() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    username: '', email: '', password: '', displayName: '',
    referralCode: params.get('ref') || '',
  });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (step < steps.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user);
      toast.success('Welcome to Revilla! 🎉');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="auth-page-new">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card-new">
        <button className="auth-back-btn" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}>← Back</button>

        {/* Progress bar */}
        <div className="auth-progress-bar">
          <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="auth-progress-label">Step {step + 1} of {steps.length}</div>

        <div className="auth-logo-new">
          <div className="auth-r-icon">R</div>
          <span>Revilla</span>
        </div>

        <h2 className="auth-title">{current.label}</h2>

        <form onSubmit={handleNext} className="auth-form-new">
          {current.fields.includes('displayName') && (
            <div className="auth-field">
              <label>Display Name</label>
              <input type="text" placeholder="How people see you"
                value={form.displayName}
                onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} required />
            </div>
          )}
          {current.fields.includes('username') && (
            <div className="auth-field">
              <label>Username</label>
              <input type="text" placeholder="@yourname"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
            </div>
          )}
          {current.fields.includes('email') && (
            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
          )}
          {current.fields.includes('password') && (
            <div className="auth-field">
              <label>Password</label>
              <input type="password" placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
          )}
          {step === steps.length - 1 && (
            <div className="auth-field">
              <label>Referral Code (optional)</label>
              <input type="text" placeholder="Enter code if you have one"
                value={form.referralCode}
                onChange={e => setForm(p => ({ ...p, referralCode: e.target.value }))} />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : step < steps.length - 1 ? 'Continue →' : 'Create Account 🎉'}
          </button>
        </form>

        {step === 0 && (
          <p className="auth-switch-new">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        )}

        <p className="auth-terms">
          By joining you agree to our Terms of Service. Direct messages are private.
        </p>
      </div>
    </div>
  );
}
