import { useState, useEffect } from 'react';
import { getLocationOptIns } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function LiveMap() {
  const [optedInUsers, setOptedInUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    getLocationOptIns().then(res => { setOptedInUsers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId, username, lat, lng, updatedAt }) => {
      setOptedInUsers(prev => {
        const existing = prev.find(u => u.id === userId);
        if (existing) return prev.map(u => u.id === userId ? { ...u, locationLat: lat, locationLng: lng, locationUpdatedAt: updatedAt } : u);
        return [...prev, { id: userId, username, locationLat: lat, locationLng: lng, locationUpdatedAt: updatedAt }];
      });
    };
    socket.on('user_location_update', handler);
    return () => socket.off('user_location_update', handler);
  }, [socket]);

  if (loading) return <div className="loading">Loading location data...</div>;

  return (
    <div className="live-map-container">
      <div className="consent-notice">
        <span>🔒</span>
        <div>
          <strong>Consent-based location display</strong>
          <p>Only users who explicitly opted in to location sharing in their privacy settings are shown here. Users can disable this at any time.</p>
        </div>
      </div>
      <div className="map-stats"><span>{optedInUsers.length} user{optedInUsers.length !== 1 ? 's' : ''} sharing location</span></div>
      <div className="map-placeholder"><div className="map-mock">🗺️ Map View<p style={{fontSize:'0.8rem',marginTop:'0.5rem',opacity:0.6}}>Connect react-leaflet with OpenStreetMap for production</p></div></div>
      <div className="opted-in-users-list">
        <h4>Users sharing location ({optedInUsers.length})</h4>
        {optedInUsers.length === 0 ? (
          <div className="empty-state">No users have opted in to location sharing</div>
        ) : optedInUsers.map(u => (
          <div key={u.id} className="location-user-row">
            <div className="user-avatar">{(u.displayName || u.username || '?')[0]}</div>
            <div className="user-location-info">
              <div className="user-name">{u.displayName || u.username}</div>
              <div className="user-coords">{u.locationLat?.toFixed(4)}, {u.locationLng?.toFixed(4)}<span className="location-time"> · {u.locationUpdatedAt ? new Date(u.locationUpdatedAt).toLocaleTimeString() : 'N/A'}</span></div>
            </div>
            <div className="opt-in-badge">✅ Opted in</div>
          </div>
        ))}
      </div>
    </div>
  );
}
