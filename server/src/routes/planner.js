const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Hedefler
router.get('/goals', auth, (req, res) => {
  try {
    const goals = db.prepare(`SELECT g.*, s.name as subject_name FROM goals g
      LEFT JOIN subjects s ON g.subject_id = s.id WHERE g.user_id = ? ORDER BY g.completed ASC, g.end_date ASC`).all(req.userId);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

router.post('/goals', auth, (req, res) => {
  try {
    const { title, goalType, targetValue, unit, subjectId, startDate, endDate } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO goals (id, user_id, title, goal_type, target_value, unit, subject_id, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, title, goalType, targetValue, unit, subjectId, startDate, endDate);
    res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

router.put('/goals/:id', auth, (req, res) => {
  try {
    const { currentValue, completed } = req.body;
    db.prepare('UPDATE goals SET current_value = COALESCE(?, current_value), completed = COALESCE(?, completed) WHERE id = ? AND user_id = ?')
      .run(currentValue, completed, req.params.id, req.userId);
    res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Çalışma planı
router.get('/plans', auth, (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM study_plans WHERE user_id = ? ORDER BY start_date DESC').all(req.userId);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

router.post('/plans', auth, (req, res) => {
  try {
    const { title, startDate, endDate, tasks } = req.body;
    const planId = uuidv4();
    db.prepare('INSERT INTO study_plans (id, user_id, title, start_date, end_date) VALUES (?, ?, ?, ?, ?)')
      .run(planId, req.userId, title, startDate, endDate);

    if (tasks && tasks.length > 0) {
      const insertTask = db.prepare('INSERT INTO study_plan_tasks (id, plan_id, subject_id, topic_id, title, scheduled_date, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const insertAll = db.transaction((tasks) => {
        tasks.forEach((task, i) => {
          insertTask.run(uuidv4(), planId, task.subjectId, task.topicId, task.title, task.scheduledDate, task.durationMinutes || 60, i);
        });
      });
      insertAll(tasks);
    }

    res.status(201).json({ id: planId });
  } catch (err) {
    res.status(500).json({ error: 'Plan oluşturulurken hata oluştu' });
  }
});

router.get('/plans/:planId/tasks', auth, (req, res) => {
  try {
    const tasks = db.prepare(`SELECT spt.*, s.name as subject_name, t.name as topic_name
      FROM study_plan_tasks spt LEFT JOIN subjects s ON spt.subject_id = s.id LEFT JOIN topics t ON spt.topic_id = t.id
      WHERE spt.plan_id = ? ORDER BY spt.scheduled_date, spt.order_index`).all(req.params.planId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

router.put('/plans/tasks/:taskId', auth, (req, res) => {
  try {
    const { completed } = req.body;
    db.prepare('UPDATE study_plan_tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, req.params.taskId);
    res.json({ message: 'Güncellendi' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Günlük check-in
router.post('/checkin', auth, (req, res) => {
  try {
    const { mood, energyLevel, motivationLevel, notes } = req.body;
    const id = uuidv4();
    db.prepare(`INSERT OR REPLACE INTO daily_checkins (id, user_id, mood, energy_level, motivation_level, notes) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, req.userId, mood, energyLevel, motivationLevel, notes);

    // Streak güncelle
    const user = db.prepare('SELECT last_study_date, streak_days FROM users WHERE id = ?').get(req.userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (user.last_study_date === yesterday) {
      db.prepare('UPDATE users SET streak_days = streak_days + 1, last_study_date = ? WHERE id = ?').run(today, req.userId);
    } else if (user.last_study_date !== today) {
      db.prepare('UPDATE users SET streak_days = 1, last_study_date = ? WHERE id = ?').run(today, req.userId);
    }

    // XP
    db.prepare('UPDATE users SET xp = xp + 5, total_xp = total_xp + 5 WHERE id = ?').run(req.userId);

    res.status(201).json({ message: 'Check-in kaydedildi' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
