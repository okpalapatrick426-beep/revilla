import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';

const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

const HeartIcon = ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth="2" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const CommentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const ShareIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
const PlusIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const ImageIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;

const BG_COLORS = ['#0d1117','#1a1a2e','#7c3aed','#0f3460','#16213e','#1b1b2f','#0a1628','#1e1e2e'];

export default function ReelsPage({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [creating, setCreating] = useState(false);
  const [postText, setPostText] = useState('');
  const [postBg, setPostBg] = useState(BG_COLORS[0]);
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/posts').catch(() => ({ data: [] }));
      setPosts(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPostImage(file);
    const reader = new FileReader();
    reader.onload = () => setPostImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submitPost = async () => {
    if (!postText.trim() && !postImage) return;
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('content', postText);
      fd.append('backgroundColor', postBg);
      if (postImage) fd.append('media', postImage);
      await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPostText('');
      setPostImage(null);
      setPostImagePreview(null);
      setCreating(false);
      await load();
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const likePost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const liked = p.likedByMe;
        return { ...p, likesCount: liked ? p.likesCount - 1 : p.likesCount + 1, likedByMe: !liked };
      }));
    } catch {}
  };

  const avatarUrl = (u) => u?.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`) : null;

  return (
    <div className="reels-page">
      {/* Header */}
      <div className="reels-header">
        <h2>Reels</h2>
        <button className="reels-create-btn" onClick={() => setCreating(true)}><PlusIcon /> Post</button>
      </div>

      {/* Posts feed */}
      <div className="reels-feed">
        {loading && <p className="reels-empty">Loading...</p>}
        {!loading && posts.length === 0 && (
          <div className="reels-empty-state">
            <div className="reels-empty-icon">🎬</div>
            <h3>No posts yet</h3>
            <p>Be the first to post something</p>
            <button className="reels-first-post-btn" onClick={() => setCreating(true)}>Create Post</button>
          </div>
        )}
        {posts.map(post => {
          const user = post.User || {};
          const src = avatarUrl(user);
          return (
            <div key={post.id} className="reel-card" style={{ background: post.mediaUrl ? undefined : post.backgroundColor }}>
              {/* User info */}
              <div className="reel-user">
                <div className="reel-avatar">
                  {src ? <img src={src} alt="" /> : <div className="reel-avatar-placeholder">{(user.displayName || '?')[0].toUpperCase()}</div>}
                </div>
                <div>
                  <strong>{user.displayName || user.username}</strong>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Content */}
              {post.mediaUrl && (
                post.type === 'video'
                  ? <video src={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${BASE}${post.mediaUrl}`} controls className="reel-media" />
                  : <img src={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${BASE}${post.mediaUrl}`} alt="" className="reel-media" />
              )}
              {post.content && <p className="reel-text">{post.content}</p>}

              {/* Actions */}
              <div className="reel-actions">
                <button className={`reel-action-btn ${post.likedByMe ? 'liked' : ''}`} onClick={() => likePost(post.id)}>
                  <HeartIcon filled={post.likedByMe} />
                  <span>{post.likesCount || 0}</span>
                </button>
                <button className="reel-action-btn">
                  <CommentIcon />
                  <span>{post.commentsCount || 0}</span>
                </button>
                <button className="reel-action-btn" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`)}>
                  <ShareIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create post modal */}
      {creating && (
        <div className="reels-create-overlay">
          <div className="reels-create-modal">
            <div className="reels-create-top">
              <h3>New Post</h3>
              <button className="icon-btn" onClick={() => { setCreating(false); setPostImage(null); setPostImagePreview(null); setPostText(''); }}><CloseIcon /></button>
            </div>

            {/* Preview */}
            <div className="reels-preview" style={{ background: postImagePreview ? undefined : postBg }}>
              {postImagePreview
                ? <img src={postImagePreview} alt="" className="reels-preview-img" />
                : <p className="reels-preview-text">{postText || 'Your post preview...'}</p>
              }
            </div>

            <textarea
              className="reels-text-input"
              placeholder="What's on your mind?"
              value={postText}
              onChange={e => setPostText(e.target.value)}
              rows={3}
            />

            {/* Background colors */}
            {!postImagePreview && (
              <div className="reels-bg-picker">
                {BG_COLORS.map(c => (
                  <button key={c} className={`bg-swatch ${postBg === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setPostBg(c)} />
                ))}
              </div>
            )}

            <div className="reels-create-actions">
              <button className="reels-img-btn" onClick={() => fileRef.current?.click()}>
                <ImageIcon /> {postImagePreview ? 'Change image' : 'Add image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              <button className="reels-post-btn" onClick={submitPost} disabled={posting || (!postText.trim() && !postImage)}>
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
