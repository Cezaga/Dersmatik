const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Kayıt
router.post('/register', (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanılıyor' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare(`INSERT INTO users (id, username, email, password, display_name) VALUES (?, ?, ?, ?, ?)`)
      .run(id, username, email, hashedPassword, displayName);

    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const user = db.prepare('SELECT id, username, email, display_name, avatar, level, xp, streak_days FROM users WHERE id = ?').get(id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
  }
});

// Giriş
router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);
    if (!user) return res.status(400).json({ error: 'Kullanıcı bulunamadı' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Şifre hatalı' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Giriş sırasında hata oluştu' });
  }
});

// Mevcut kullanıcı
router.get('/me', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, display_name, avatar, level, xp, total_xp, streak_days, last_study_date, target_rank, target_department, daily_goal_minutes, daily_goal_questions, mood, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
