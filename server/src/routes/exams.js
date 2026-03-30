const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Sınav listesi (yıllara göre)
router.get('/available', auth, (req, res) => {
  try {
    const exams = db.prepare(`SELECT DISTINCT exam_year, exam_type, exam_name, COUNT(*) as question_count
      FROM questions WHERE exam_year IS NOT NULL GROUP BY exam_year, exam_type, exam_name
      ORDER BY exam_year DESC`).all();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: 'Sınavlar yüklenirken hata oluştu' });
  }
});

// Sınav oturumu başlat
router.post('/start', auth, (req, res) => {
  try {
    const { examType, examYear, title, timeLimit } = req.body;
    const id = uuidv4();

    let questions;
    if (examYear) {
      questions = db.prepare('SELECT id FROM questions WHERE exam_year = ? AND exam_type = ? ORDER BY question_number').all(examYear, examType);
    } else {
      // Özel deneme - rastgele sorulardan
      const { subjectId, topicId, questionCount = 40 } = req.body;
      let query = 'SELECT id FROM questions WHERE exam_type = ?';
      const params = [examType];
      if (subjectId) { query += ' AND subject_id = ?'; params.push(subjectId); }
      if (topicId) { query += ' AND topic_id = ?'; params.push(topicId); }
      query += ' ORDER BY RANDOM() LIMIT ?';
      params.push(questionCount);
      questions = db.prepare(query).all(...params);
    }

    db.prepare(`INSERT INTO exam_sessions (id, user_id, exam_type, exam_year, title, total_questions, time_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, req.userId, examType, examYear, title || `${examType} ${examYear || 'Deneme'}`, questions.length, timeLimit);

    const fullQuestions = questions.map(q => db.prepare('SELECT * FROM questions WHERE id = ?').get(q.id));

    res.json({ sessionId: id, questions: fullQuestions, timeLimit });
  } catch (err) {
    res.status(500).json({ error: 'Sınav başlatılırken hata oluştu' });
  }
});

// Sınav oturumu bitir
router.post('/:sessionId/finish', auth, (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?').get(req.params.sessionId, req.userId);
    if (!session) return res.status(404).json({ error: 'Sınav oturumu bulunamadı' });

    let correct = 0, wrong = 0, empty = 0;
    const insertAnswer = db.prepare(`INSERT INTO user_answers (id, user_id, question_id, selected_answer, is_correct, time_spent, exam_session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const processAnswers = db.transaction(() => {
      for (const ans of answers) {
        const question = db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(ans.questionId);
        if (!question) continue;

        if (!ans.selectedAnswer) {
          empty++;
          insertAnswer.run(uuidv4(), req.userId, ans.questionId, null, 0, ans.timeSpent, req.params.sessionId);
        } else if (ans.selectedAnswer === question.correct_answer) {
          correct++;
          insertAnswer.run(uuidv4(), req.userId, ans.questionId, ans.selectedAnswer, 1, ans.timeSpent, req.params.sessionId);
        } else {
          wrong++;
          insertAnswer.run(uuidv4(), req.userId, ans.questionId, ans.selectedAnswer, 0, ans.timeSpent, req.params.sessionId);
        }
      }
    });

    processAnswers();

    const net = correct - (wrong * 0.25);
    db.prepare(`UPDATE exam_sessions SET correct_count = ?, wrong_count = ?, empty_count = ?, net_score = ?, time_spent = ?, completed_at = datetime('now'), status = 'completed' WHERE id = ?`)
      .run(correct, wrong, empty, net, timeSpent, req.params.sessionId);

    // XP ver
    const xpGain = Math.round(net * 5) + 50;
    if (xpGain > 0) {
      db.prepare('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?').run(xpGain, xpGain, req.userId);
    }

    // Study log
    db.prepare(`INSERT INTO study_logs (id, user_id, activity_type, duration_minutes, questions_solved, xp_earned) VALUES (?, ?, 'exam', ?, ?, ?)`)
      .run(uuidv4(), req.userId, Math.round(timeSpent / 60), answers.length, xpGain);

    res.json({ correct, wrong, empty, net, xpGained: xpGain, totalQuestions: answers.length });
  } catch (err) {
    res.status(500).json({ error: 'Sınav bitirilirken hata oluştu' });
  }
});

// Geçmiş sınavlar
router.get('/history', auth, (req, res) => {
  try {
    const sessions = db.prepare(`SELECT * FROM exam_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 50`).all(req.userId);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
