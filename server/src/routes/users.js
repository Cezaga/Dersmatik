const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Profil güncelle
router.put('/profile', auth, (req, res) => {
  try {
    const { displayName, avatar, targetRank, targetDepartment, dailyGoalMinutes, dailyGoalQuestions } = req.body;
    db.prepare(`UPDATE users SET display_name = COALESCE(?, display_name), avatar = COALESCE(?, avatar),
      target_rank = COALESCE(?, target_rank), target_department = COALESCE(?, target_department),
      daily_goal_minutes = COALESCE(?, daily_goal_minutes), daily_goal_questions = COALESCE(?, daily_goal_questions),
      updated_at = datetime('now') WHERE id = ?`)
      .run(displayName, avatar, targetRank, targetDepartment, dailyGoalMinutes, dailyGoalQuestions, req.userId);

    const user = db.prepare('SELECT id, username, email, display_name, avatar, level, xp, total_xp, streak_days, target_rank, target_department, daily_goal_minutes, daily_goal_questions FROM users WHERE id = ?').get(req.userId);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
  }
});

// Kullanıcı ara
router.get('/search', auth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const users = db.prepare(`SELECT id, username, display_name, avatar, level, xp FROM users WHERE (username LIKE ? OR display_name LIKE ?) AND id != ? LIMIT 20`)
      .all(`%${q}%`, `%${q}%`, req.userId);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Arama sırasında hata oluştu' });
  }
});

// Kullanıcı profili
router.get('/:id', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, display_name, avatar, level, xp, total_xp, streak_days, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const stats = db.prepare(`SELECT COUNT(*) as total_questions, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers FROM user_answers WHERE user_id = ?`).get(req.params.id);
    const studyTime = db.prepare(`SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes FROM study_logs WHERE user_id = ?`).get(req.params.id);

    res.json({ ...user, stats: { ...stats, total_study_minutes: studyTime.total_minutes } });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
