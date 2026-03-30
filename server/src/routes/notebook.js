const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Formüller
router.get('/formulas', auth, (req, res) => {
  try {
    const { subjectId, topicId, search } = req.query;
    let query = `SELECT f.*, s.name as subject_name, t.name as topic_name FROM formulas f
      JOIN subjects s ON f.subject_id = s.id LEFT JOIN topics t ON f.topic_id = t.id WHERE 1=1`;
    const params = [];

    if (subjectId) { query += ' AND f.subject_id = ?'; params.push(subjectId); }
    if (topicId) { query += ' AND f.topic_id = ?'; params.push(topicId); }
    if (search) { query += ' AND (f.title LIKE ? OR f.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY s.name, f.title';
    const formulas = db.prepare(query).all(...params);
    res.json(formulas);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Not oluştur
router.post('/notes', auth, (req, res) => {
  try {
    const { title, content, subjectId, topicId, isPublic } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO notes (id, user_id, subject_id, topic_id, title, content, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, subjectId, topicId, title, content, isPublic ? 1 : 0);

    db.prepare('UPDATE users SET xp = xp + 10, total_xp = total_xp + 10 WHERE id = ?').run(req.userId);
    res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Notlarım
router.get('/notes', auth, (req, res) => {
  try {
    const notes = db.prepare(`SELECT n.*, s.name as subject_name, t.name as topic_name FROM notes n
      LEFT JOIN subjects s ON n.subject_id = s.id LEFT JOIN topics t ON n.topic_id = t.id
      WHERE n.user_id = ? ORDER BY n.created_at DESC`).all(req.userId);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Hata defteri kayıt
router.post('/errors', auth, (req, res) => {
  try {
    const { questionId, subjectId, topicId, errorType, notes } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO error_log (id, user_id, question_id, subject_id, topic_id, error_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, questionId, subjectId, topicId, errorType, notes);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
