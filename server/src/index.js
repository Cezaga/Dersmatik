require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const db = require('./db');

async function main() {
  // Initialize database
  await db.init();

  // Run migrations and seed
  const migrate = require('./db/migrate');
  migrate(db);
  const seed = require('./db/seed');
  seed(db);

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/questions', require('./routes/questions'));
  app.use('/api/exams', require('./routes/exams'));
  app.use('/api/trials', require('./routes/trials'));
  app.use('/api/flashcards', require('./routes/flashcards'));
  app.use('/api/study-rooms', require('./routes/studyRooms'));
  app.use('/api/social', require('./routes/social'));
  app.use('/api/stats', require('./routes/stats'));
  app.use('/api/planner', require('./routes/planner'));
  app.use('/api/gamification', require('./routes/gamification'));
  app.use('/api/notebook', require('./routes/notebook'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Dersmatik API çalışıyor!' });
  });

  // Socket.io
  const setupSockets = require('./sockets');
  setupSockets(io);
  app.set('io', io);

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Dersmatik API ${PORT} portunda çalışıyor`);
  });
}

main().catch(err => {
  console.error('Başlatma hatası:', err);
  process.exit(1);
});
