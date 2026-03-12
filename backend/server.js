require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sequelize } = require('./models');
const { initSocketHandlers } = require('./socket/socketHandlers');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const statusRoutes = require('./routes/status');
const productRoutes = require('./routes/products');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');
const friendRoutes = require('./routes/friends');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Attach io to req
app.use((req, res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/products', productRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/friends', friendRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io
initSocketHandlers(io);

const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database synced');
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => console.error('❌ DB sync error:', err));

module.exports = { app, io };

