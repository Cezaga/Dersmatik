require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exams');
const trialRoutes = require('./routes/trials');
const flashcardRoutes = require('./routes/flashcards');
const studyRoomRoutes = require('./routes/studyRooms');
const socialRoutes = require('./routes/social');
const statsRoutes = require('./routes/stats');
const plannerRoutes = require('./routes/planner');
const gamificationRoutes = require('./routes/gamification');
const notebookRoutes = require('./routes/notebook');
const setupSockets = require('./sockets');

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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study-rooms', studyRoomRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notebook', notebookRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dersmatik API çalışıyor!' });
});

// Socket.io
setupSockets(io);
app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Dersmatik API ${PORT} portunda çalışıyor`);
});
