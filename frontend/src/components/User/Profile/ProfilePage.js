import { useState } from 'react';
import { updateLocationSharing, updateProfile } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ displayName: user?.displayName || '', bio: user?.bio || '' });
  const [locationEnabled, setLocationEnabled] = useState(user?.locationSharingEnabled || false);
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(form);
      setUser(res.data);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleLocationToggle = async () => {
    const enabling = !locationEnabled;
    if (enabling) {
      // Must ask for explicit consent
      const confirmed = window.confirm(
        '📍 Enable Location Sharing?\n\n' +
        'By enabling this, your approximate location will be visible to platform moderators and admins. ' +
        'This is disclosed in our Terms of Service.\n\n' +
        'You can disable this at any time from settings.'
      );
      if (!confirmed) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await updateLocationSharing({ enabled: true, lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationEnabled(true);
            setUser(prev => ({ ...prev, locationSharingEnabled: true }));
            toast.success('Location sharing enabled');
          } catch { toast.error('Failed to enable location sharing'); }
        },
        () => toast.error('Location permission denied. Please allow location access in your browser.')
      );
    } else {
      try {
        await updateLocationSharing({ enabled: false });
        setLocationEnabled(false);
        setUser(prev => ({ ...prev, locationSharingEnabled: false }));
        toast.success('Location sharing disabled and data cleared');
      } catch { toast.error('Failed to disable location sharing'); }
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-large">{user?.displayName?.[0]}</div>
        <div>
          <h2>{user?.displayName}</h2>
          <p>@{user?.username}</p>
        </div>
      </div>

      <div className="profile-section">
        <h3>Edit Profile</h3>
        <div className="form-group">
          <label>Display Name</label>
          <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
        </div>
        <button className="save-btn" onClick={handleProfileSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="profile-section">
        <h3>Privacy Settings</h3>

        {/* Location sharing — explicit opt-in with clear disclosure */}
        <div className="privacy-row">
          <div className="privacy-info">
            <div className="privacy-title">📍 Location Sharing</div>
            <div className="privacy-desc">
              {locationEnabled
                ? '✅ Your location is visible to platform moderators. Click to disable and clear your location data.'
                : '🔒 Your location is private. Enable to share with moderators (disclosed in ToS).'}
            </div>
          </div>
          <div
            className={`toggle ${locationEnabled ? 'toggle-on' : ''}`}
            onClick={handleLocationToggle}
          />
        </div>

        <div className="privacy-notice">
          <strong>ℹ️ About data collection:</strong> As disclosed in our Terms of Service, platform moderators
          can see: reported messages in groups, your profile information, and your location if you opt in above.
          Direct messages between users are private and not monitored unless reported.
        </div>
      </div>

      <div className="profile-section danger-zone">
        <h3>Account</h3>
        <div className="referral-code-display">
          <span>Your referral code: </span>
          <strong>{user?.referralCode}</strong>
          <button onClick={() => { navigator.clipboard.writeText(user?.referralCode); toast.success('Copied!'); }}>Copy</button>
        </div>
      </div>
    </div>
  );
}
