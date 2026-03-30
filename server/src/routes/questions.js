const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Soruları listele (filtreli)
router.get('/', auth, (req, res) => {
  try {
    const { subjectId, topicId, examYear, examType, difficulty, limit = 20, offset = 0 } = req.query;
    let query = 'SELECT q.*, s.name as subject_name, t.name as topic_name FROM questions q LEFT JOIN subjects s ON q.subject_id = s.id LEFT JOIN topics t ON q.topic_id = t.id WHERE 1=1';
    const params = [];

    if (subjectId) { query += ' AND q.subject_id = ?'; params.push(subjectId); }
    if (topicId) { query += ' AND q.topic_id = ?'; params.push(topicId); }
    if (examYear) { query += ' AND q.exam_year = ?'; params.push(examYear); }
    if (examType) { query += ' AND q.exam_type = ?'; params.push(examType); }
    if (difficulty) { query += ' AND q.difficulty = ?'; params.push(difficulty); }

    query += ' ORDER BY q.exam_year DESC, q.question_number ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const questions = db.prepare(query).all(...params);
    const total = db.prepare(query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY.*$/, '')).get(...params.slice(0, -2));

    res.json({ questions, total: total.count });
  } catch (err) {
    res.status(500).json({ error: 'Sorular yüklenirken hata oluştu' });
  }
});

// Konu bazlı soru getir
router.get('/by-topic/:topicId', auth, (req, res) => {
  try {
    const { limit = 10, excludeAnswered } = req.query;
    let query = `SELECT q.*, s.name as subject_name, t.name as topic_name FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id LEFT JOIN topics t ON q.topic_id = t.id
      WHERE q.topic_id = ?`;
    const params = [req.params.topicId];

    if (excludeAnswered === 'true') {
      query += ` AND q.id NOT IN (SELECT question_id FROM user_answers WHERE user_id = ? AND is_correct = 1)`;
      params.push(req.userId);
    }

    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(Number(limit));

    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Sorular yüklenirken hata oluştu' });
  }
});

// Yanlış yapılan soruları getir
router.get('/wrong', auth, (req, res) => {
  try {
    const { subjectId, topicId, limit = 20 } = req.query;
    let query = `SELECT DISTINCT q.*, s.name as subject_name, t.name as topic_name,
      ua.selected_answer as last_answer, ua.created_at as answered_at
      FROM user_answers ua JOIN questions q ON ua.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id LEFT JOIN topics t ON q.topic_id = t.id
      WHERE ua.user_id = ? AND ua.is_correct = 0`;
    const params = [req.userId];

    if (subjectId) { query += ' AND q.subject_id = ?'; params.push(subjectId); }
    if (topicId) { query += ' AND q.topic_id = ?'; params.push(topicId); }

    query += ' ORDER BY ua.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Soru cevapla
router.post('/:id/answer', auth, (req, res) => {
  try {
    const { selectedAnswer, timeSpent, examSessionId } = req.body;
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
    if (!question) return res.status(404).json({ error: 'Soru bulunamadı' });

    const isCorrect = selectedAnswer === question.correct_answer ? 1 : 0;
    const id = uuidv4();

    db.prepare(`INSERT INTO user_answers (id, user_id, question_id, selected_answer, is_correct, time_spent, exam_session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.userId, req.params.id, selectedAnswer, isCorrect, timeSpent, examSessionId);

    // XP ver
    const xpGain = isCorrect ? 10 : 2;
    db.prepare('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?').run(xpGain, xpGain, req.userId);

    // Level kontrolü
    const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(req.userId);
    const xpForNextLevel = user.level * 100;
    if (user.xp >= xpForNextLevel) {
      db.prepare('UPDATE users SET level = level + 1, xp = xp - ? WHERE id = ?').run(xpForNextLevel, req.userId);
    }

    res.json({
      isCorrect: !!isCorrect,
      correctAnswer: question.correct_answer,
      solutionText: question.solution_text,
      xpGained: xpGain
    });
  } catch (err) {
    res.status(500).json({ error: 'Cevap kaydedilirken hata oluştu' });
  }
});

// Dersleri listele
router.get('/subjects', auth, (req, res) => {
  try {
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY exam_type, category, name').all();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Dersler yüklenirken hata oluştu' });
  }
});

// Konuları listele
router.get('/subjects/:subjectId/topics', auth, (req, res) => {
  try {
    const topics = db.prepare('SELECT * FROM topics WHERE subject_id = ? ORDER BY order_index').all(req.params.subjectId);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Konular yüklenirken hata oluştu' });
  }
});

module.exports = router;
