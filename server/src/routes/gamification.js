const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Pomodoro başlat
router.post('/pomodoro/start', auth, (req, res) => {
  try {
    const { duration = 25, subjectId, type = 'work' } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO pomodoro_sessions (id, user_id, subject_id, duration, type) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.userId, subjectId, duration, type);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Pomodoro bitir
router.post('/pomodoro/:id/complete', auth, (req, res) => {
  try {
    db.prepare(`UPDATE pomodoro_sessions SET completed = 1, completed_at = datetime('now') WHERE id = ? AND user_id = ?`)
      .run(req.params.id, req.userId);

    const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(req.params.id);
    if (session && session.completed) {
      const xpGain = session.type === 'work' ? 15 : 5;
      db.prepare('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?').run(xpGain, xpGain, req.userId);

      // Study log
      db.prepare(`INSERT INTO study_logs (id, user_id, subject_id, activity_type, duration_minutes, xp_earned) VALUES (?, ?, ?, 'pomodoro', ?, ?)`)
        .run(uuidv4(), req.userId, session.subject_id, session.duration, xpGain);

      // Streak güncelle
      const today = new Date().toISOString().split('T')[0];
      const user = db.prepare('SELECT last_study_date, streak_days FROM users WHERE id = ?').get(req.userId);
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (user.last_study_date === yesterday) {
        db.prepare('UPDATE users SET streak_days = streak_days + 1, last_study_date = ? WHERE id = ?').run(today, req.userId);
      } else if (user.last_study_date !== today) {
        db.prepare('UPDATE users SET streak_days = 1, last_study_date = ? WHERE id = ?').run(today, req.userId);
      }

      res.json({ xpGained: xpGain, message: 'Pomodoro tamamlandı!' });
    } else {
      res.json({ message: 'Pomodoro zaten tamamlanmış' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Rozetler
router.get('/badges', auth, (req, res) => {
  try {
    const allBadges = db.prepare('SELECT * FROM badges ORDER BY category, requirement_value').all();
    const userBadges = db.prepare('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?').all(req.userId);
    const earnedIds = new Set(userBadges.map(b => b.badge_id));

    const badges = allBadges.map(b => ({
      ...b,
      earned: earnedIds.has(b.id),
      earnedAt: userBadges.find(ub => ub.badge_id === b.id)?.earned_at
    }));

    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Rozet kontrolü ve ödüllendirme
router.post('/badges/check', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM user_answers WHERE user_id = ?').get(req.userId).count;
    const totalStudyMinutes = db.prepare('SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE user_id = ?').get(req.userId).total;
    const totalPomodoros = db.prepare('SELECT COUNT(*) as count FROM pomodoro_sessions WHERE user_id = ? AND completed = 1').get(req.userId).count;

    const badges = db.prepare('SELECT * FROM badges').all();
    const earnedBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(req.userId);
    const earnedIds = new Set(earnedBadges.map(b => b.badge_id));
    const newBadges = [];

    for (const badge of badges) {
      if (earnedIds.has(badge.id)) continue;

      let earned = false;
      switch (badge.requirement_type) {
        case 'streak_days': earned = user.streak_days >= badge.requirement_value; break;
        case 'total_questions': earned = totalQuestions >= badge.requirement_value; break;
        case 'total_study_minutes': earned = totalStudyMinutes >= badge.requirement_value; break;
        case 'total_pomodoros': earned = totalPomodoros >= badge.requirement_value; break;
        case 'level': earned = user.level >= badge.requirement_value; break;
        case 'total_xp': earned = user.total_xp >= badge.requirement_value; break;
      }

      if (earned) {
        db.prepare('INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)').run(uuidv4(), req.userId, badge.id);
        if (badge.xp_reward > 0) {
          db.prepare('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?').run(badge.xp_reward, badge.xp_reward, req.userId);
        }
        newBadges.push(badge);
      }
    }

    res.json({ newBadges });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Skill tree
router.get('/skill-tree', auth, (req, res) => {
  try {
    const { subjectId } = req.query;
    let query = `SELECT t.id, t.name, t.parent_topic_id, t.order_index, s.name as subject_name, s.color,
      COALESCE(stp.mastery_level, 0) as mastery_level, COALESCE(stp.questions_solved, 0) as questions_solved,
      COALESCE(stp.correct_rate, 0) as correct_rate, COALESCE(stp.unlocked, 0) as unlocked
      FROM topics t JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN skill_tree_progress stp ON t.id = stp.topic_id AND stp.user_id = ?
      WHERE 1=1`;
    const params = [req.userId];

    if (subjectId) { query += ' AND t.subject_id = ?'; params.push(subjectId); }
    query += ' ORDER BY t.order_index';

    const tree = db.prepare(query).all(...params);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// YKS geri sayım
router.get('/yks-countdown', auth, (req, res) => {
  // 2026 YKS tahmini tarih (Haziran ortası)
  const yksDate = new Date('2026-06-20T10:00:00+03:00');
  const now = new Date();
  const diff = yksDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const hours = Math.ceil((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  res.json({ yksDate: yksDate.toISOString(), daysLeft: days, hoursLeft: hours });
});

// Manuel çalışma kaydı ekle
router.post('/study-log', auth, (req, res) => {
  try {
    const { subjectId, durationMinutes, questionsSolved, activityType = 'manual' } = req.body;
    const id = uuidv4();

    db.prepare('INSERT INTO study_logs (id, user_id, subject_id, activity_type, duration_minutes, questions_solved, xp_earned) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, subjectId || null, activityType, durationMinutes || 0, questionsSolved || 0, Math.round((durationMinutes || 0) / 5 + (questionsSolved || 0) * 2));

    const xpGain = Math.round((durationMinutes || 0) / 5 + (questionsSolved || 0) * 2);
    if (xpGain > 0) {
      db.prepare('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?').run(xpGain, xpGain, req.userId);
    }

    // Streak güncelle
    const today = new Date().toISOString().split('T')[0];
    const user = db.prepare('SELECT last_study_date, streak_days FROM users WHERE id = ?').get(req.userId);
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.last_study_date === yesterday) {
      db.prepare('UPDATE users SET streak_days = streak_days + 1, last_study_date = ? WHERE id = ?').run(today, req.userId);
    } else if (user.last_study_date !== today) {
      db.prepare('UPDATE users SET streak_days = 1, last_study_date = ? WHERE id = ?').run(today, req.userId);
    }

    res.status(201).json({ id, xpGained: xpGain, message: 'Çalışma kaydedildi!' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Haftalık rapor
router.get('/weekly-report', auth, (req, res) => {
  try {
    const studyTime = db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE user_id = ? AND created_at >= datetime('now', '-7 days')").get(req.userId);
    const questions = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct FROM user_answers WHERE user_id = ? AND created_at >= datetime('now', '-7 days')").get(req.userId);
    const pomodoros = db.prepare("SELECT COUNT(*) as total FROM pomodoro_sessions WHERE user_id = ? AND completed = 1 AND completed_at >= datetime('now', '-7 days')").get(req.userId);
    const xpGained = db.prepare("SELECT COALESCE(SUM(xp_earned), 0) as total FROM study_logs WHERE user_id = ? AND created_at >= datetime('now', '-7 days')").get(req.userId);
    const prevWeekStudy = db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE user_id = ? AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')").get(req.userId);
    const dailyBreakdown = db.prepare("SELECT date(created_at) as date, SUM(duration_minutes) as minutes, SUM(questions_solved) as questions FROM study_logs WHERE user_id = ? AND created_at >= datetime('now', '-7 days') GROUP BY date(created_at) ORDER BY date ASC").all(req.userId);

    const user = db.prepare('SELECT streak_days, level, xp, total_xp FROM users WHERE id = ?').get(req.userId);

    res.json({
      studyMinutes: studyTime.total,
      totalQuestions: questions.total,
      correctQuestions: questions.correct,
      accuracy: questions.total > 0 ? Math.round(questions.correct / questions.total * 100) : 0,
      pomodoros: pomodoros.total,
      xpGained: xpGained.total,
      prevWeekMinutes: prevWeekStudy.total,
      changePercent: prevWeekStudy.total > 0 ? Math.round((studyTime.total - prevWeekStudy.total) / prevWeekStudy.total * 100) : 0,
      dailyBreakdown,
      streak: user.streak_days,
      level: user.level,
      xp: user.xp,
      totalXp: user.total_xp
    });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
