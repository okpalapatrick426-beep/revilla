import React, { useState, useRef } from 'react';
import api from '../../../services/api';

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm7-12H5l-2 2.4V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5.4L19 3.2zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>
  </svg>
);

export default function ProfilePage({ currentUser, setCurrentUser }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  const avatarSrc = avatarPreview
    ? avatarPreview
    : currentUser?.avatar
      ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BASE}${currentUser.avatar}`)
      : null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (setCurrentUser) setCurrentUser(res.data);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const initial = (currentUser?.displayName || currentUser?.username || 'U')[0].toUpperCase();

  return (
    <div className="profile-page">

      {/* Cover */}
      <div className="profile-cover" />

      {/* Avatar */}
      <div className="profile-avatar-wrap">
        <div className="profile-avatar-ring">
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" className="profile-avatar-img" />
            : <div className="profile-avatar-placeholder">{initial}</div>}
        </div>
        {editing && (
          <button className="avatar-camera-btn" onClick={() => fileInputRef.current?.click()}>
            <CameraIcon />
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handleAvatarChange} />
      </div>

      {/* Info */}
      <div className="profile-info">
        {editing ? (
          <div>
            <input className="profile-edit-input" value={displayName}
              onChange={e => setDisplayName(e.target.value)} placeholder="Display name" />
            <textarea className="profile-edit-bio" value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Bio — tell people about yourself" rows={3} />
            <div className="profile-edit-actions">
              <button className="btn-cancel" onClick={() => {
                setEditing(false); setAvatarPreview(null); setAvatarFile(null);
              }}>Cancel</button>
              <button className="btn-save" onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="profile-name">{currentUser?.displayName || currentUser?.username}</h2>
            <p className="profile-username">@{currentUser?.username}</p>
            {currentUser?.bio && <p className="profile-bio">{currentUser.bio}</p>}
            <button className="btn-edit-profile" onClick={() => setEditing(true)}>
              <EditIcon /> Edit Profile
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="profile-stats">
        {[
          { num: 0, label: 'Posts' },
          { num: currentUser?.followersCount || 0, label: 'Followers' },
          { num: currentUser?.followingCount || 0, label: 'Following' },
          { num: (currentUser?.followersCount || 0) + (currentUser?.followingCount || 0), label: 'Connections' },
        ].map(({ num, label }) => (
          <div key={label} className="stat-item">
            <span className="stat-number">{num}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div className="profile-referral">
        <span className="ref-label">Your invite code</span>
        <div className="ref-code-wrap">
          <span className="ref-code">{currentUser?.referralCode || '------'}</span>
          <button className="ref-copy-btn"
            onClick={() => navigator.clipboard.writeText(currentUser?.referralCode || '')}>
            Copy
          </button>
        </div>
      </div>

      {/* Posts grid */}
      <div className="profile-posts-header">
        <GridIcon /> <span>Posts</span>
      </div>
      <div className="profile-posts-grid">
        <div className="no-posts">No posts yet</div>
      </div>

    </div>
  );
}
