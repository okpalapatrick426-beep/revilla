import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MagicCallback() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/'); }, []);
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a1628',color:'#fff'}}>Redirecting...</div>;
}
