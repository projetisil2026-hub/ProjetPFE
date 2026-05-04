require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io for real-time messaging
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
  }

  socket.on('send_message', async (data) => {
    const { toId, chatId } = data;
    io.to(`user:${toId}`).emit('new_message', data);
  });

  socket.on('send_notification', (data) => {
    io.emit('new_notification', data);
  });

  socket.on('disconnect', () => {
    if (userId) onlineUsers.delete(userId);
  });
});

app.set('io', io);

server.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    console.log(`🚀 Tatabu backend running on port ${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
});
