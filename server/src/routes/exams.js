const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Sınav listesi (yıllara göre, TYT/AYT ayrı)
router.get('/available', auth, (req, res) => {
  try {
    const exams = db.prepare(`SELECT DISTINCT exam_year, exam_type,
      exam_type || ' ' || exam_year as exam_name,
      COUNT(*) as question_count
      FROM questions WHERE exam_year IS NOT NULL
      GROUP BY exam_year, exam_type
      ORDER BY exam_year DESC, exam_type ASC`).all();
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
      // Gerçek YKS sınavı - soruları subject ve question_number sırasına göre getir
      questions = db.prepare(`SELECT q.id, q.subject_id, s.name as subject_name, s.category, q.topic_id, t.name as topic_name,
        q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
        q.correct_answer, q.solution_text, q.question_number, q.difficulty, q.exam_year, q.exam_type
        FROM questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        LEFT JOIN topics t ON q.topic_id = t.id
        WHERE q.exam_year = ? AND q.exam_type = ?
        ORDER BY s.id, q.question_number`).all(examYear, examType);
    } else {
      // Özel deneme
      const { subjectId, topicId, questionCount = 40 } = req.body;
      let query = `SELECT q.id, q.subject_id, s.name as subject_name, s.category, q.topic_id, t.name as topic_name,
        q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
        q.correct_answer, q.solution_text, q.question_number, q.difficulty, q.exam_year, q.exam_type
        FROM questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        LEFT JOIN topics t ON q.topic_id = t.id
        WHERE q.exam_type = ?`;
      const params = [examType];
      if (subjectId) { query += ' AND q.subject_id = ?'; params.push(subjectId); }
      if (topicId) { query += ' AND q.topic_id = ?'; params.push(topicId); }
      query += ' ORDER BY RANDOM() LIMIT ?';
      params.push(questionCount);
      questions = db.prepare(query).all(...params);
    }

    const actualTimeLimit = timeLimit || (examType === 'TYT' ? 165 : 180);

    db.prepare(`INSERT INTO exam_sessions (id, user_id, exam_type, exam_year, title, total_questions, time_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, req.userId, examType, examYear, title || `${examType} ${examYear || 'Deneme'}`, questions.length, actualTimeLimit);

    res.json({ sessionId: id, questions, timeLimit: actualTimeLimit, examType, examYear });
  } catch (err) {
    console.error('Exam start error:', err);
    res.status(500).json({ error: 'Sınav başlatılırken hata oluştu' });
  }
});

// Sınav oturumu bitir - gelişmiş sonuç bilgileri
router.post('/:sessionId/finish', auth, (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Cevap verisi eksik' });
    }

    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?').get(req.params.sessionId, req.userId);
    if (!session) return res.status(404).json({ error: 'Sınav oturumu bulunamadı' });

    // Zaten tamamlanmışsa tekrar göndermeyi engelle
    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Bu sınav zaten tamamlanmış' });
    }

    let correct = 0, wrong = 0, empty = 0;
    const subjectBreakdown = {}; // { subjectName: { correct, wrong, empty, total } }
    const wrongTopics = []; // [{ topicName, subjectName, questionText }]
    const emptyTopics = [];
    const insertAnswer = db.prepare(`INSERT INTO user_answers (id, user_id, question_id, selected_answer, is_correct, time_spent, exam_session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const processAnswers = db.transaction(() => {
      for (const ans of answers) {
        const question = db.prepare(`SELECT q.correct_answer, q.question_text, q.subject_id,
          s.name as subject_name, t.name as topic_name
          FROM questions q
          LEFT JOIN subjects s ON q.subject_id = s.id
          LEFT JOIN topics t ON q.topic_id = t.id
          WHERE q.id = ?`).get(ans.questionId);
        if (!question) continue;

        const subj = question.subject_name || 'Diğer';
        if (!subjectBreakdown[subj]) subjectBreakdown[subj] = { correct: 0, wrong: 0, empty: 0, total: 0 };
        subjectBreakdown[subj].total++;

        if (!ans.selectedAnswer) {
          empty++;
          subjectBreakdown[subj].empty++;
          emptyTopics.push({ topicName: question.topic_name, subjectName: subj, questionText: question.question_text });
          insertAnswer.run(uuidv4(), req.userId, ans.questionId, null, 0, ans.timeSpent || 0, req.params.sessionId);
        } else if (ans.selectedAnswer === question.correct_answer) {
          correct++;
          subjectBreakdown[subj].correct++;
          insertAnswer.run(uuidv4(), req.userId, ans.questionId, ans.selectedAnswer, 1, ans.timeSpent || 0, req.params.sessionId);
        } else {
          wrong++;
          subjectBreakdown[subj].wrong++;
          wrongTopics.push({ topicName: question.topic_name, subjectName: subj, questionText: question.question_text });
          insertAnswer.run(uuidv4(), req.userId, ans.questionId, ans.selectedAnswer, 0, ans.timeSpent || 0, req.params.sessionId);
        }
      }
    });

    processAnswers();

    const net = correct - (wrong * 0.25);

    // Ders bazlı net hesapla
    const subjectNets = {};
    for (const [subj, data] of Object.entries(subjectBreakdown)) {
      subjectNets[subj] = {
        ...data,
        net: parseFloat((data.correct - data.wrong * 0.25).toFixed(2))
      };
    }

    db.prepare(`UPDATE exam_sessions SET correct_count = ?, wrong_count = ?, empty_count = ?, net_score = ?, time_spent = ?, completed_at = datetime('now'), status = 'completed' WHERE id = ?`)
      .run(correct, wrong, empty, net, timeSpent || 0, req.params.sessionId);

    // XP ver
    const xpGain = Math.max(0, Math.round(net * 5) + 50);
    if (xpGain > 0) {
      db.prepare('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?').run(xpGain, xpGain, req.userId);
    }

    // Study log
    db.prepare(`INSERT INTO study_logs (id, user_id, activity_type, duration_minutes, questions_solved, xp_earned) VALUES (?, ?, 'exam', ?, ?, ?)`)
      .run(uuidv4(), req.userId, Math.round((timeSpent || 0) / 60), answers.length, xpGain);

    res.json({
      correct, wrong, empty, net: parseFloat(net.toFixed(2)),
      xpGained: xpGain,
      totalQuestions: answers.length,
      subjectNets,
      wrongTopics,
      emptyTopics,
      examType: session.exam_type,
      examYear: session.exam_year
    });
  } catch (err) {
    console.error('Exam finish error:', err);
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
