// frontend/src/components/User/Feed/FeedPage.js  — COMPLETE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';

const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
const mediaFull  = (url) => !url ? '' : url.startsWith('http') ? url : `${BASE}${url}`;
const avatarFull = (a)   => !a   ? null : a.startsWith('http') ? a   : `${BASE}${a}`;

const HeartIcon    = ({ filled }) => filled
  ? <svg viewBox="0 0 24 24" fill="#ef4444" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
  : <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>;

const CommentIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>;
const ImgIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
const SendIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;

export default function FeedPage({ currentUser }) {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newText,    setNewText]    = useState('');
  const [newFile,    setNewFile]    = useState(null);
  const [newPreview, setNewPreview] = useState(null);
  const [posting,    setPosting]    = useState(false);
  const [openComments, setOpenComments] = useState(null); // postId
  const [commentText,  setCommentText]  = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/feed');
      setPosts(res.data || []);
    } catch (err) {
      console.error('feed load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setNewFile(f);
    setNewPreview(URL.createObjectURL(f));
  };

  const submitPost = async () => {
    if (posting || (!newText.trim() && !newFile)) return;
    setPosting(true);
    try {
      if (newFile) {
        const fd = new FormData();
        fd.append('media', newFile);
        fd.append('content', newText);
        await api.post('/feed', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/feed', { content: newText });
      }
      setNewText(''); setNewFile(null); setNewPreview(null);
      load();
    } catch (err) {
      console.error('post error:', err);
      alert('Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await api.post(`/feed/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: res.data.likes } : p));
    } catch (err) { console.error('like error:', err); }
  };

  const submitComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/feed/${postId}/comment`, { content: commentText });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, Comments: [...(p.Comments || []), res.data] } : p
      ));
      setCommentText('');
    } catch (err) { console.error('comment error:', err); }
  };

  return (
    <div className="feed-page">
      <div className="feed-header"><h2>Feed</h2></div>

      {/* Compose */}
      <div className="feed-compose">
        <div className="feed-compose-avatar">
          {avatarFull(currentUser?.avatar)
            ? <img src={avatarFull(currentUser.avatar)} alt="" />
            : <div className="feed-avatar-placeholder">{(currentUser?.displayName || 'M')[0].toUpperCase()}</div>
          }
        </div>
        <div className="feed-compose-right">
          <textarea
            placeholder={`What's on your mind, ${currentUser?.displayName?.split(' ')[0] || 'there'}?`}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            rows={2}
          />
          {newPreview && (
            <div className="feed-compose-preview">
              <img src={newPreview} alt="" />
              <button onClick={() => { setNewFile(null); setNewPreview(null); }}>✕</button>
            </div>
          )}
          <div className="feed-compose-actions">
            <button className="feed-img-btn" onClick={() => fileRef.current?.click()}><ImgIcon /> Photo</button>
            <input type="file" ref={fileRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button className="feed-post-btn" onClick={submitPost} disabled={posting || (!newText.trim() && !newFile)}>
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading && <p className="feed-empty">Loading feed…</p>}
      {!loading && posts.length === 0 && <p className="feed-empty">No posts yet. Be the first! 🎉</p>}

      {posts.map(post => {
        const likes  = Array.isArray(post.likes) ? post.likes : [];
        const liked  = likes.includes(currentUser?.id);
        const author = post.Author || {};
        const comments = post.Comments || [];
        const isOpen = openComments === post.id;

        return (
          <div key={post.id} className="feed-post">
            {/* Post header */}
            <div className="feed-post-header">
              <div className="feed-post-avatar">
                {avatarFull(author.avatar)
                  ? <img src={avatarFull(author.avatar)} alt="" />
                  : <div className="feed-avatar-placeholder sm">{(author.displayName || '?')[0].toUpperCase()}</div>
                }
              </div>
              <div>
                <strong>{author.displayName || author.username}</strong>
                <span className="feed-post-time">
                  {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {' · '}
                  {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Content */}
            {post.content && <p className="feed-post-content">{post.content}</p>}
            {post.mediaUrl && (
              <img src={mediaFull(post.mediaUrl)} alt="" className="feed-post-image"
                onClick={() => window.open(mediaFull(post.mediaUrl), '_blank')} />
            )}

            {/* Actions */}
            <div className="feed-post-actions">
              <button className={`feed-like-btn ${liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                <HeartIcon filled={liked} />
                <span>{likes.length > 0 ? likes.length : ''}</span>
              </button>
              <button className="feed-comment-btn" onClick={() => setOpenComments(isOpen ? null : post.id)}>
                <CommentIcon />
                <span>{comments.length > 0 ? comments.length : ''}</span>
              </button>
            </div>

            {/* Comments */}
            {isOpen && (
              <div className="feed-comments">
                {comments.map(c => (
                  <div key={c.id} className="feed-comment">
                    <strong>{c.Author?.displayName || c.Author?.username || 'User'}</strong>
                    <span>{c.content}</span>
                  </div>
                ))}
                <div className="feed-comment-input">
                  <input
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                  />
                  <button onClick={() => submitComment(post.id)}><SendIcon /></button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
