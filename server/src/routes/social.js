const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Arkadaşlık isteği gönder
router.post('/friends/request', auth, (req, res) => {
  try {
    const { friendId } = req.body;
    if (friendId === req.userId) return res.status(400).json({ error: 'Kendinize istek gönderemezsiniz' });

    const existing = db.prepare('SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)').get(req.userId, friendId, friendId, req.userId);
    if (existing) return res.status(400).json({ error: 'Zaten bir arkadaşlık isteği mevcut' });

    const id = uuidv4();
    db.prepare('INSERT INTO friendships (id, user_id, friend_id, status) VALUES (?, ?, ?, ?)')
      .run(id, req.userId, friendId, 'pending');

    res.status(201).json({ message: 'Arkadaşlık isteği gönderildi' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Arkadaşlık isteği kabul et
router.post('/friends/accept', auth, (req, res) => {
  try {
    const { friendshipId } = req.body;
    db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ? AND friend_id = ?").run(friendshipId, req.userId);
    res.json({ message: 'Arkadaşlık kabul edildi' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Rakip olarak işaretle
router.post('/friends/rival', auth, (req, res) => {
  try {
    const { friendId } = req.body;
    db.prepare("UPDATE friendships SET status = 'rival' WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = 'accepted'")
      .run(req.userId, friendId, friendId, req.userId);
    res.json({ message: 'Rakip olarak işaretlendi' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Arkadaş listesi
router.get('/friends', auth, (req, res) => {
  try {
    const friends = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.level, u.xp, u.streak_days, u.last_study_date, f.status, f.id as friendship_id
      FROM friendships f JOIN users u ON (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) = u.id
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status IN ('accepted', 'rival')
    `).all(req.userId, req.userId, req.userId);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Bekleyen istekler
router.get('/friends/pending', auth, (req, res) => {
  try {
    const pending = db.prepare(`SELECT f.id as friendship_id, u.id, u.username, u.display_name, u.avatar, u.level
      FROM friendships f JOIN users u ON f.user_id = u.id WHERE f.friend_id = ? AND f.status = 'pending'`).all(req.userId);
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Leaderboard
router.get('/leaderboard', auth, (req, res) => {
  try {
    const { type = 'xp', period = 'weekly' } = req.query;

    // Arkadaşların ID'lerini al
    const friendIds = db.prepare(`SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END as fid
      FROM friendships WHERE (user_id = ? OR friend_id = ?) AND status IN ('accepted', 'rival')`)
      .all(req.userId, req.userId, req.userId).map(f => f.fid);
    friendIds.push(req.userId);

    const placeholders = friendIds.map(() => '?').join(',');

    let query;
    if (type === 'xp') {
      query = `SELECT id, username, display_name, avatar, level, total_xp, streak_days FROM users WHERE id IN (${placeholders}) ORDER BY total_xp DESC`;
    } else if (type === 'questions') {
      query = `SELECT u.id, u.username, u.display_name, u.avatar, u.level, COUNT(ua.id) as question_count
        FROM users u LEFT JOIN user_answers ua ON u.id = ua.user_id WHERE u.id IN (${placeholders}) GROUP BY u.id ORDER BY question_count DESC`;
    } else {
      query = `SELECT u.id, u.username, u.display_name, u.avatar, u.level, COALESCE(SUM(sl.duration_minutes), 0) as study_minutes
        FROM users u LEFT JOIN study_logs sl ON u.id = sl.user_id WHERE u.id IN (${placeholders}) GROUP BY u.id ORDER BY study_minutes DESC`;
    }

    const leaderboard = db.prepare(query).all(...friendIds);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Not paylaşımı
router.get('/notes', auth, (req, res) => {
  try {
    const notes = db.prepare(`SELECT n.*, u.display_name as author_name, u.avatar as author_avatar, s.name as subject_name
      FROM notes n JOIN users u ON n.user_id = u.id LEFT JOIN subjects s ON n.subject_id = s.id
      WHERE n.is_public = 1 ORDER BY n.created_at DESC LIMIT 50`).all();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// XP bahsi oluştur
router.post('/bets', auth, (req, res) => {
  try {
    const { opponentId, xpAmount, betType, description, expiresAt } = req.body;
    const user = db.prepare('SELECT xp FROM users WHERE id = ?').get(req.userId);
    if (user.xp < xpAmount) return res.status(400).json({ error: 'Yeterli XP yok' });

    const id = uuidv4();
    db.prepare('INSERT INTO xp_bets (id, challenger_id, opponent_id, xp_amount, bet_type, description, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, opponentId, xpAmount, betType, description, expiresAt);
    res.status(201).json({ id, message: 'Bahis oluşturuldu' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Çalışma sözleşmesi oluştur
router.post('/contracts', auth, (req, res) => {
  try {
    const { title, targetHours, targetPeriod, startDate, endDate } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO study_contracts (id, user_id, title, target_hours, target_period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, title, targetHours, targetPeriod, startDate, endDate);
    res.status(201).json({ id, message: 'Sözleşme oluşturuldu' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Zaman kapsülü oluştur
router.post('/time-capsules', auth, (req, res) => {
  try {
    const { message, openDate, friendId } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO time_capsules (id, user_id, message, open_date, from_friend_id) VALUES (?, ?, ?, ?, ?)')
      .run(id, friendId || req.userId, message, openDate, friendId ? req.userId : null);
    res.status(201).json({ id, message: 'Zaman kapsülü oluşturuldu' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
