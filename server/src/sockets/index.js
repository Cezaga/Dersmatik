const jwt = require('jsonwebtoken');
const db = require('../db');

const setupSockets = (io) => {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth gerekli'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Geçersiz token'));
    }
  });

  const onlineUsers = new Map(); // userId -> socketId
  const roomTimers = new Map(); // roomId -> { userId: startTime }

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId, online: true });

    // Çalışma odasına katıl
    socket.on('room:join', (roomId) => {
      socket.join(`room:${roomId}`);
      const user = db.prepare('SELECT id, display_name, avatar, level FROM users WHERE id = ?').get(userId);
      io.to(`room:${roomId}`).emit('room:user-joined', { user, roomId });

      if (!roomTimers.has(roomId)) roomTimers.set(roomId, new Map());
      roomTimers.get(roomId).set(userId, Date.now());
    });

    // Odadan ayrıl
    socket.on('room:leave', (roomId) => {
      socket.leave(`room:${roomId}`);
      io.to(`room:${roomId}`).emit('room:user-left', { userId, roomId });

      if (roomTimers.has(roomId)) {
        roomTimers.get(roomId).delete(userId);
      }
    });

    // Oda sohbet
    socket.on('room:message', ({ roomId, message }) => {
      const user = db.prepare('SELECT id, display_name, avatar FROM users WHERE id = ?').get(userId);
      const { v4: uuidv4 } = require('uuid');
      db.prepare('INSERT INTO chat_messages (id, room_id, user_id, message) VALUES (?, ?, ?, ?)').run(uuidv4(), roomId, userId, message);
      io.to(`room:${roomId}`).emit('room:new-message', { user, message, timestamp: new Date().toISOString() });
    });

    // Çalışma durumu güncelle
    socket.on('study:status', ({ roomId, isStudying }) => {
      db.prepare('UPDATE study_room_members SET is_studying = ? WHERE room_id = ? AND user_id = ?').run(isStudying ? 1 : 0, roomId, userId);
      io.to(`room:${roomId}`).emit('room:study-status', { userId, isStudying });
    });

    // Pomodoro sync (odadakilerle senkronize)
    socket.on('pomodoro:start', ({ roomId, duration }) => {
      io.to(`room:${roomId}`).emit('pomodoro:started', { userId, duration, startedAt: Date.now() });
    });

    socket.on('pomodoro:complete', ({ roomId }) => {
      io.to(`room:${roomId}`).emit('pomodoro:completed', { userId });
    });

    // Quiz düellosu
    socket.on('duel:invite', ({ opponentId, quizData }) => {
      const opponentSocket = onlineUsers.get(opponentId);
      if (opponentSocket) {
        const user = db.prepare('SELECT id, display_name, avatar FROM users WHERE id = ?').get(userId);
        io.to(opponentSocket).emit('duel:invitation', { from: user, quizData });
      }
    });

    socket.on('duel:accept', ({ challengerId, quizData }) => {
      const challengerSocket = onlineUsers.get(challengerId);
      if (challengerSocket) {
        io.to(challengerSocket).emit('duel:accepted', { opponentId: userId, quizData });
      }
    });

    socket.on('duel:answer', ({ opponentId, questionIndex, isCorrect, timeSpent }) => {
      const opponentSocket = onlineUsers.get(opponentId);
      if (opponentSocket) {
        io.to(opponentSocket).emit('duel:opponent-answer', { questionIndex, isCorrect, timeSpent });
      }
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:online', { userId, online: false });

      // Tüm odalardan çıkar
      for (const [roomId, users] of roomTimers) {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(`room:${roomId}`).emit('room:user-left', { userId, roomId });
        }
      }
    });
  });
};

module.exports = setupSockets;
