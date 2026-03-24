import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { searchInstitutions } from './institutions';

const steps = [
  { id: 'name',      label: "What's your name?",  fields: ['displayName', 'username'] },
  { id: 'contact',   label: 'Your contact info',   fields: ['email', 'password'] },
  { id: 'community', label: 'Your community',       fields: ['university', 'department'] },
];

export default function Register() {
  const [params]   = useSearchParams();
  const [step,     setStep]     = useState(0);
  const [form,     setForm]     = useState({
    username: '', email: '', password: '', displayName: '',
    university: '', department: '',
    referralCode: params.get('ref') || '',
  });
  const [loading,     setLoading]     = useState(false);
  const [uniSuggestions, setUniSugg]  = useState([]);
  const [showSugg,       setShowSugg] = useState(false);
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

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleUniversityChange = (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, university: val }));
    const suggestions = searchInstitutions(val);
    setUniSugg(suggestions);
    setShowSugg(suggestions.length > 0 && val.length >= 2);
  };

  const selectInstitution = (inst) => {
    setForm(p => ({ ...p, university: inst }));
    setShowSugg(false);
    setUniSugg([]);
  };

  const current  = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div style={s.page}>
      <div style={{ ...s.orb, ...s.orb1 }}/>
      <div style={{ ...s.orb, ...s.orb2 }}/>

      <div style={s.card}>
        <button style={s.backBtn}
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}>
          ← Back
        </button>

        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }}/>
        </div>
        <div style={s.progressLabel}>Step {step + 1} of {steps.length}</div>

        <div style={s.logoRow}>
          <div style={s.rIcon}>R</div>
          <span style={s.brandName}>Revilla</span>
        </div>

        <h2 style={s.title}>{current.label}</h2>

        <form onSubmit={handleNext} style={s.form}>

          {current.fields.includes('displayName') && (
            <Field label="Display Name" type="text" placeholder="How people see you"
              value={form.displayName} onChange={set('displayName')} required/>
          )}
          {current.fields.includes('username') && (
            <Field label="Username" type="text" placeholder="@yourname"
              value={form.username} onChange={set('username')} required/>
          )}
          {current.fields.includes('email') && (
            <Field label="Email" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required/>
          )}
          {current.fields.includes('password') && (
            <Field label="Password" type="password" placeholder="Min 6 characters"
              value={form.password} onChange={set('password')} required minLength={6}/>
          )}

          {current.fields.includes('university') && (
            <div style={{ position: 'relative' }}>
              <label style={s.fieldLabel}>
                University / School
                <span style={{ color:'#555', fontWeight:400 }}> (optional)</span>
              </label>
              <input
                style={s.fieldInput}
                type="text"
                placeholder="Start typing e.g. UNILAG, LASU, UI..."
                value={form.university}
                onChange={handleUniversityChange}
                onFocus={() => form.university.length >= 2 && setShowSugg(uniSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                autoComplete="off"
              />
              {showSugg && (
                <div style={s.suggestions}>
                  {uniSuggestions.map(inst => (
                    <button key={inst} type="button"
                      style={s.suggItem}
                      onMouseDown={() => selectInstitution(inst)}>
                      🏛️ {inst}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {current.fields.includes('department') && (
            <Field label="Department / Faculty" type="text"
              placeholder="e.g. Computer Science, Engineering..."
              value={form.department} onChange={set('department')} optional/>
          )}

          {step === steps.length - 1 && (
            <>
              <Field label="Referral Code" type="text"
                placeholder="Enter code if you have one"
                value={form.referralCode} onChange={set('referralCode')} optional/>
              <p style={s.locationNote}>
                📍 We'll auto-detect your city when you enter the app
              </p>
            </>
          )}

          <button type="submit"
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}>
            {loading
              ? <span style={s.spinner}/>
              : step < steps.length - 1 ? 'Continue →' : 'Enter Revilla →'}
          </button>
        </form>

        {step === 0 && (
          <p style={s.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>
        )}

        <p style={s.terms}>
          By joining you agree to our Terms of Service. Direct messages are private.
        </p>
      </div>
    </div>
  );
}

function Field({ label, optional, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={s.fieldLabel}>
        {label}
        {optional && <span style={{ color:'#555', fontWeight:400 }}> (optional)</span>}
      </label>
      <input
        {...props}
        style={{
          ...s.fieldInput,
          borderColor: focused ? 'rgba(191,95,255,0.6)' : 'rgba(255,255,255,0.08)',
          boxShadow:   focused ? '0 0 0 3px rgba(191,95,255,0.12)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

const s = {
  page: {
    minHeight:'100vh', background:'#0A0A0F',
    display:'flex', alignItems:'center', justifyContent:'center',
    position:'relative', overflow:'hidden', padding:'20px 16px',
    fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  orb:  { position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' },
  orb1: { width:300, height:300, background:'rgba(191,95,255,0.14)', top:'-80px', right:'-60px' },
  orb2: { width:220, height:220, background:'rgba(191,95,255,0.08)', bottom:'-40px', left:'-30px' },
  card: {
    width:'100%', maxWidth:420,
    background:'#13131A', border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:24, padding:'24px 24px 20px',
    position:'relative', zIndex:1,
    display:'flex', flexDirection:'column', gap:0,
  },
  backBtn: {
    background:'none', border:'none', color:'#BF5FFF',
    fontSize:13, cursor:'pointer', padding:0,
    marginBottom:14, fontFamily:'inherit', textAlign:'left',
  },
  progressBar:  { height:3, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', background:'#BF5FFF', borderRadius:99, transition:'width 0.4s cubic-bezier(0.34,1.56,0.64,1)' },
  progressLabel:{ fontSize:11, color:'#555', marginBottom:20 },
  logoRow:  { display:'flex', alignItems:'center', gap:10, marginBottom:16 },
  rIcon:    { width:36, height:36, background:'#BF5FFF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff' },
  brandName:{ fontSize:18, fontWeight:600, color:'#fff' },
  title:    { fontSize:22, fontWeight:700, color:'#fff', marginBottom:20, letterSpacing:'-0.3px' },
  form:     { display:'flex', flexDirection:'column', gap:14 },
  fieldLabel: { fontSize:13, color:'#888', fontWeight:500 },
  fieldInput: {
    background:'#1A1A24', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:12, padding:'13px 14px', fontSize:15, color:'#fff',
    outline:'none', fontFamily:'inherit', transition:'border-color 0.2s, box-shadow 0.2s', width:'100%',
  },
  suggestions: {
    position:'absolute', top:'100%', left:0, right:0, zIndex:100,
    background:'#1A1A2E', border:'1px solid rgba(191,95,255,0.3)',
    borderRadius:12, overflow:'hidden',
    boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
    maxHeight:240, overflowY:'auto',
  },
  suggItem: {
    display:'block', width:'100%', padding:'10px 14px',
    background:'none', border:'none', color:'#F0F0F5',
    fontSize:13, textAlign:'left', cursor:'pointer',
    fontFamily:'inherit', borderBottom:'1px solid rgba(255,255,255,0.05)',
    transition:'background 0.1s',
  },
  locationNote: { fontSize:11, color:'#555', textAlign:'center', marginTop:-4 },
  submitBtn: {
    width:'100%', padding:'15px 0', background:'#BF5FFF', color:'#fff',
    border:'none', borderRadius:13, fontSize:15, fontWeight:600,
    cursor:'pointer', fontFamily:'inherit', marginTop:4,
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'opacity 0.15s',
  },
  spinner: {
    width:18, height:18,
    border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff',
    borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block',
  },
  switchText: { fontSize:13, color:'#666', textAlign:'center', marginTop:16 },
  link:  { color:'#BF5FFF', textDecoration:'none', fontWeight:500 },
  terms: { fontSize:11, color:'#444', textAlign:'center', marginTop:12, lineHeight:1.5 },
};
