import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL + '/api' : '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const logout = () => API.post('/auth/logout');
export const getMe = () => API.get('/auth/me');

// Users
export const getProfile = (id) => API.get(`/users/${id}`);
export const updateProfile = (data) => API.put('/users/me', data);
export const updateLocationSharing = (data) => API.put('/users/me/location', data);
export const searchUsers = (q) => API.get(`/users/search?q=${q}`);

// Messages
export const getConversation = (userId) => API.get(`/messages/conversation/${userId}`);
export const getGroupMessages = (groupId) => API.get(`/messages/group/${groupId}`);
export const sendMessage = (data) => API.post('/messages', data);
export const deleteMessage = (id, forEveryone) => API.delete(`/messages/${id}`, { data: { forEveryone } });
export const reactToMessage = (id, emoji) => API.post(`/messages/${id}/react`, { emoji });

// Status
export const getStatuses = () => API.get('/status');
export const createStatus = (data) => API.post('/status', data);
export const viewStatus = (id) => API.post(`/status/${id}/view`);
export const deleteStatus = (id) => API.delete(`/status/${id}`);

// Products
export const getProducts = (params) => API.get('/products', { params });
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Referrals
export const getMyReferrals = () => API.get('/referrals/my');

// Friends
export const getFriends = () => API.get('/friends');
export const getFriendRequests = () => API.get('/friends/requests');
export const sendFriendRequest = (userId) => API.post(`/friends/request/${userId}`);
export const acceptFriendRequest = (userId) => API.put(`/friends/accept/${userId}`);
export const removeFriend = (userId) => API.delete(`/friends/${userId}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAllUsers = (params) => API.get('/admin/users', { params });
export const banUser = (id, reason) => API.put(`/admin/users/${id}/ban`, { reason });
export const unbanUser = (id) => API.put(`/admin/users/${id}/unban`);
export const updateUserRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const getLocationOptIns = () => API.get('/admin/location-optins');
export const getGroupMessagesAdmin = (groupId) => API.get(`/admin/groups/${groupId}/messages`);
export const adminDeleteMessage = (id) => API.delete(`/admin/messages/${id}`);
export const getReferralStats = () => API.get('/admin/referrals');

export default API;

