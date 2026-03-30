const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Genel istatistikler
router.get('/overview', auth, (req, res) => {
  try {
    const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM user_answers WHERE user_id = ?').get(req.userId);
    const correctAnswers = db.prepare('SELECT COUNT(*) as count FROM user_answers WHERE user_id = ? AND is_correct = 1').get(req.userId);
    const totalStudyTime = db.prepare('SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE user_id = ?').get(req.userId);
    const streak = db.prepare('SELECT streak_days FROM users WHERE id = ?').get(req.userId);
    const todayQuestions = db.prepare(`SELECT COUNT(*) as count FROM user_answers WHERE user_id = ? AND date(created_at) = date('now')`).get(req.userId);
    const todayStudyTime = db.prepare(`SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE user_id = ? AND date(created_at) = date('now')`).get(req.userId);

    res.json({
      totalQuestions: totalQuestions.count,
      correctAnswers: correctAnswers.count,
      correctRate: totalQuestions.count > 0 ? (correctAnswers.count / totalQuestions.count * 100).toFixed(1) : 0,
      totalStudyMinutes: totalStudyTime.total,
      streakDays: streak.streak_days,
      todayQuestions: todayQuestions.count,
      todayStudyMinutes: todayStudyTime.total
    });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Ders bazlı analiz
router.get('/by-subject', auth, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT s.id, s.name, s.exam_type, s.category, s.color,
        COUNT(ua.id) as total_questions,
        SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN ua.is_correct = 0 THEN 1 ELSE 0 END) as wrong
      FROM subjects s LEFT JOIN questions q ON s.id = q.subject_id
      LEFT JOIN user_answers ua ON q.id = ua.question_id AND ua.user_id = ?
      GROUP BY s.id ORDER BY total_questions DESC
    `).all(req.userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Zayıf konu analizi
router.get('/weak-topics', auth, (req, res) => {
  try {
    const weakTopics = db.prepare(`
      SELECT t.id, t.name, s.name as subject_name, s.color,
        COUNT(ua.id) as total,
        SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(ua.id) * 100, 1) as success_rate
      FROM topics t JOIN subjects s ON t.subject_id = s.id
      JOIN questions q ON t.id = q.topic_id
      JOIN user_answers ua ON q.id = ua.question_id AND ua.user_id = ?
      GROUP BY t.id HAVING COUNT(ua.id) >= 3
      ORDER BY success_rate ASC LIMIT 10
    `).all(req.userId);
    res.json(weakTopics);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Günlük çalışma geçmişi
router.get('/daily', auth, (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daily = db.prepare(`
      SELECT date(created_at) as date,
        SUM(duration_minutes) as study_minutes,
        SUM(questions_solved) as questions,
        SUM(xp_earned) as xp
      FROM study_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY date(created_at) ORDER BY date ASC
    `).all(req.userId, days);
    res.json(daily);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Hata defteri
router.get('/errors', auth, (req, res) => {
  try {
    const errors = db.prepare(`
      SELECT el.*, q.question_text, q.correct_answer, s.name as subject_name, t.name as topic_name
      FROM error_log el LEFT JOIN questions q ON el.question_id = q.id
      LEFT JOIN subjects s ON el.subject_id = s.id LEFT JOIN topics t ON el.topic_id = t.id
      WHERE el.user_id = ? ORDER BY el.created_at DESC LIMIT 50
    `).all(req.userId);
    res.json(errors);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Mood & performans korelasyonu
router.get('/mood-performance', auth, (req, res) => {
  try {
    const data = db.prepare(`
      SELECT dc.mood, dc.energy_level, dc.motivation_level, dc.checkin_date,
        COALESCE(SUM(sl.duration_minutes), 0) as study_minutes,
        COALESCE(SUM(sl.questions_solved), 0) as questions_solved
      FROM daily_checkins dc LEFT JOIN study_logs sl ON dc.user_id = sl.user_id AND date(sl.created_at) = dc.checkin_date
      WHERE dc.user_id = ? GROUP BY dc.checkin_date ORDER BY dc.checkin_date DESC LIMIT 30
    `).all(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Verimli saatler analizi
router.get('/productive-hours', auth, (req, res) => {
  try {
    const hours = db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as questions_solved,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM user_answers WHERE user_id = ? GROUP BY hour ORDER BY hour
    `).all(req.userId);
    res.json(hours);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
