const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Manuel deneme sonucu ekle
router.post('/', auth, (req, res) => {
  try {
    const {
      publisher, trialName, examType, examDate,
      turkceCorrect = 0, turkceWrong = 0,
      sosyalCorrect = 0, sosyalWrong = 0,
      matematikCorrect = 0, matematikWrong = 0,
      fenCorrect = 0, fenWrong = 0,
      aytMatCorrect = 0, aytMatWrong = 0,
      aytFenCorrect = 0, aytFenWrong = 0,
      aytSosyalCorrect = 0, aytSosyalWrong = 0,
      aytEdebiyatCorrect = 0, aytEdebiyatWrong = 0,
      aytDilCorrect = 0, aytDilWrong = 0,
      notes
    } = req.body;

    const id = uuidv4();

    let totalNet = 0;
    if (examType === 'TYT') {
      totalNet = (turkceCorrect - turkceWrong * 0.25) +
        (sosyalCorrect - sosyalWrong * 0.25) +
        (matematikCorrect - matematikWrong * 0.25) +
        (fenCorrect - fenWrong * 0.25);
    } else {
      totalNet = (aytMatCorrect - aytMatWrong * 0.25) +
        (aytFenCorrect - aytFenWrong * 0.25) +
        (aytSosyalCorrect - aytSosyalWrong * 0.25) +
        (aytEdebiyatCorrect - aytEdebiyatWrong * 0.25) +
        (aytDilCorrect - aytDilWrong * 0.25);
    }

    db.prepare(`INSERT INTO trial_results (id, user_id, publisher, trial_name, exam_type, exam_date,
      turkce_correct, turkce_wrong, sosyal_correct, sosyal_wrong, matematik_correct, matematik_wrong,
      fen_correct, fen_wrong, ayt_mat_correct, ayt_mat_wrong, ayt_fen_correct, ayt_fen_wrong,
      ayt_sosyal_correct, ayt_sosyal_wrong, ayt_edebiyat_correct, ayt_edebiyat_wrong,
      ayt_dil_correct, ayt_dil_wrong, total_net, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.userId, publisher, trialName, examType, examDate,
        turkceCorrect, turkceWrong, sosyalCorrect, sosyalWrong,
        matematikCorrect, matematikWrong, fenCorrect, fenWrong,
        aytMatCorrect, aytMatWrong, aytFenCorrect, aytFenWrong,
        aytSosyalCorrect, aytSosyalWrong, aytEdebiyatCorrect, aytEdebiyatWrong,
        aytDilCorrect, aytDilWrong, totalNet, notes);

    // XP ver
    db.prepare('UPDATE users SET xp = xp + 30, total_xp = total_xp + 30 WHERE id = ?').run(req.userId);

    const result = db.prepare('SELECT * FROM trial_results WHERE id = ?').get(id);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Deneme sonucu kaydedilirken hata oluştu' });
  }
});

// Deneme sonuçları listesi
router.get('/', auth, (req, res) => {
  try {
    const results = db.prepare('SELECT * FROM trial_results WHERE user_id = ? ORDER BY exam_date DESC, created_at DESC').all(req.userId);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Net gelişim grafiği
router.get('/progress', auth, (req, res) => {
  try {
    const { examType = 'TYT' } = req.query;
    const results = db.prepare('SELECT total_net, exam_date, trial_name, publisher, created_at FROM trial_results WHERE user_id = ? AND exam_type = ? ORDER BY exam_date ASC, created_at ASC').all(req.userId, examType);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Sıralama tahmini
router.get('/estimate-rank', auth, (req, res) => {
  try {
    const { tytNet, aytNet } = req.query;
    // Basitleştirilmiş sıralama tahmini (gerçek YKS verileriyle kalibre edilebilir)
    const tyt = parseFloat(tytNet) || 0;
    const ayt = parseFloat(aytNet) || 0;
    const totalScore = tyt * 1.32 + ayt * 1.5; // Ağırlıklı ham puan tahmini

    let rank;
    if (totalScore >= 400) rank = Math.round(100 + (500 - totalScore) * 20);
    else if (totalScore >= 350) rank = Math.round(2000 + (400 - totalScore) * 100);
    else if (totalScore >= 300) rank = Math.round(7000 + (350 - totalScore) * 200);
    else if (totalScore >= 250) rank = Math.round(17000 + (300 - totalScore) * 500);
    else if (totalScore >= 200) rank = Math.round(42000 + (250 - totalScore) * 1000);
    else if (totalScore >= 150) rank = Math.round(92000 + (200 - totalScore) * 2000);
    else if (totalScore >= 100) rank = Math.round(192000 + (150 - totalScore) * 5000);
    else rank = Math.round(442000 + (100 - totalScore) * 10000);

    rank = Math.max(1, Math.min(rank, 3000000));

    res.json({ tytNet: tyt, aytNet: ayt, totalScore: totalScore.toFixed(1), estimatedRank: rank });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Deneme sonucu sil
router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('SELECT * FROM trial_results WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!result) return res.status(404).json({ error: 'Sonuç bulunamadı' });
    db.prepare('DELETE FROM trial_results WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
