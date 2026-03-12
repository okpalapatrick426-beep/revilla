# Revilla Web Platform — Setup Guide

## Project Structure
```
revilla/
├── backend/          ← Node.js + Express + Socket.io + SQLite
└── frontend/         ← React app
```

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # edit JWT_SECRET
npm run dev            # starts on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start              # starts on port 3000
```

---

## Environment Variables (backend/.env)
```
PORT=5000
JWT_SECRET=your_super_secret_key_change_this
CLIENT_URL=http://localhost:3000
```

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

### Users
- GET  /api/users/search?q=query
- GET  /api/users/:id
- PUT  /api/users/me
- PUT  /api/users/me/location   ← OPT-IN location sharing

### Messages
- GET  /api/messages/conversation/:userId
- GET  /api/messages/group/:groupId
- POST /api/messages
- DELETE /api/messages/:id
- POST /api/messages/:id/react

### Status, Products, Referrals, Friends
- Standard CRUD — see routes/ folder

### Admin (requires moderator/admin role)
- GET /api/admin/stats
- GET /api/admin/users
- PUT /api/admin/users/:id/ban
- GET /api/admin/location-optins   ← Only opted-in users
- GET /api/admin/groups/:id/messages

---

## Socket Events

### Client → Server
- join_dm { userId }
- join_group { groupId }
- send_message { recipientId, groupId, content, type }
- typing_start / typing_stop
- update_location { lat, lng }  ← Only works if user opted in
- mark_read { messageId, senderId }

### Server → Client
- new_message
- message_deleted
- typing / stop_typing
- user_online / user_offline
- message_read
- user_location_update (admin room only)

---

## Privacy Architecture

Location sharing is OPT-IN at every layer:
1. **Database**: locationSharingEnabled defaults to FALSE
2. **API**: /users/me/location requires explicit { enabled: true }
3. **Socket**: update_location event is blocked server-side if not opted in
4. **Frontend**: Shows confirmation dialog before enabling
5. **Admin**: /admin/location-optins only returns opted-in users

---

## Expanding to Production
- Replace SQLite with PostgreSQL
- Add Redis for session/socket scaling
- Add file upload (S3/Cloudinary) for media
- Add WebRTC signaling for real voice/video calls
- Deploy backend to Railway/Render, frontend to Vercel
