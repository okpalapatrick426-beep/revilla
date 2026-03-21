import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MagicCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login');
  }, [navigate]);
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#0a1628', color:'#fff', flexDirection:'column', gap:'1rem'
    }}>
      <div style={{width:40,height:40,border:'3px solid rgba(0,168,132,0.2)',borderTopColor:'#00a884',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p>Redirecting...</p>
    </div>
  );
}
