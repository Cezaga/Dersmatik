const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Profil güncelle
router.put('/profile', auth, (req, res) => {
  try {
    const { displayName, avatar, bio, targetRank, targetDepartment, dailyGoalMinutes, dailyGoalQuestions, obp } = req.body;
    db.prepare(`UPDATE users SET display_name = COALESCE(?, display_name), avatar = COALESCE(?, avatar),
      bio = COALESCE(?, bio), target_rank = COALESCE(?, target_rank), target_department = COALESCE(?, target_department),
      daily_goal_minutes = COALESCE(?, daily_goal_minutes), daily_goal_questions = COALESCE(?, daily_goal_questions),
      obp = COALESCE(?, obp),
      updated_at = datetime('now') WHERE id = ?`)
      .run(displayName, avatar, bio, targetRank, targetDepartment, dailyGoalMinutes, dailyGoalQuestions, obp, req.userId);

    const user = db.prepare('SELECT id, username, email, display_name, avatar, bio, level, xp, total_xp, streak_days, target_rank, target_department, daily_goal_minutes, daily_goal_questions, obp FROM users WHERE id = ?').get(req.userId);
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
    const user = db.prepare('SELECT id, username, display_name, avatar, bio, level, xp, total_xp, streak_days, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const stats = db.prepare('SELECT COUNT(*) as total_questions, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers FROM user_answers WHERE user_id = ?').get(req.params.id);
    const studyTime = db.prepare('SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes FROM study_logs WHERE user_id = ?').get(req.params.id);
    const todayStudy = db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) as minutes FROM study_logs WHERE user_id = ? AND date(created_at) = date('now')").get(req.params.id);
    const recentTrials = db.prepare('SELECT trial_name, exam_type, total_net, exam_date FROM trial_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(req.params.id);
    const badges = db.prepare('SELECT b.name, b.icon, b.description FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = ?').all(req.params.id);

    res.json({ ...user, stats: { ...stats, total_study_minutes: studyTime.total_minutes, today_study_minutes: todayStudy.minutes }, recentTrials, badges });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
