import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import api from '../services/api';

export default function MagicCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Supabase handles the token from the URL hash automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // Try to exchange the token from URL
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          if (exchangeError || !data.session) {
            setStatus('Link expired or invalid. Redirecting...');
            setTimeout(() => navigate('/login?error=expired'), 2000);
            return;
          }
        }

        // Get the session again after exchange
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (!finalSession) {
          setStatus('Something went wrong. Redirecting...');
          setTimeout(() => navigate('/login?error=invalid'), 2000);
          return;
        }

        setStatus('Setting up your account...');

        // Sync with our backend — create/update user in our DB
        try {
          const res = await api.post('/auth/supabase-sync', {
            supabaseId: finalSession.user.id,
            email: finalSession.user.email,
            displayName: finalSession.user.user_metadata?.display_name || finalSession.user.email?.split('@')[0],
            referralCode: finalSession.user.user_metadata?.referral_code || null,
          }, {
            headers: { Authorization: `Bearer ${finalSession.access_token}` }
          });

          // Store our JWT for API calls
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('supabase_token', finalSession.access_token);

          setStatus('Welcome to Revilla ✨');
          setTimeout(() => navigate('/app'), 600);
        } catch (syncErr) {
          console.error('Sync error:', syncErr);
          // Still navigate if sync fails — they can retry
          localStorage.setItem('supabase_token', finalSession.access_token);
          setTimeout(() => navigate('/app'), 600);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => navigate('/login?error=invalid'), 2000);
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: '#fff', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>R</div>
      <div style={{ width: 36, height: 36, border: '3px solid #21262d', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#8b949e', fontSize: '0.9rem', margin: 0 }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
