const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Desteleri listele
router.get('/decks', auth, (req, res) => {
  try {
    const decks = db.prepare(`SELECT fd.*, u.display_name as owner_name,
      (SELECT COUNT(*) FROM flashcards WHERE deck_id = fd.id) as card_count
      FROM flashcard_decks fd JOIN users u ON fd.user_id = u.id
      WHERE fd.user_id = ? OR fd.is_public = 1 ORDER BY fd.created_at DESC`).all(req.userId);
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Deste oluştur
router.post('/decks', auth, (req, res) => {
  try {
    const { title, description, subjectId, isPublic } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO flashcard_decks (id, user_id, subject_id, title, description, is_public) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, subjectId, title, description, isPublic ? 1 : 0);
    const deck = db.prepare('SELECT * FROM flashcard_decks WHERE id = ?').get(id);
    res.status(201).json(deck);
  } catch (err) {
    res.status(500).json({ error: 'Deste oluşturulurken hata oluştu' });
  }
});

// Kart ekle
router.post('/decks/:deckId/cards', auth, (req, res) => {
  try {
    const { front, back } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO flashcards (id, deck_id, front, back) VALUES (?, ?, ?, ?)').run(id, req.params.deckId, front, back);
    db.prepare('UPDATE flashcard_decks SET card_count = card_count + 1 WHERE id = ?').run(req.params.deckId);
    const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(id);
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: 'Kart eklenirken hata oluştu' });
  }
});

// Tekrar edilecek kartları getir (spaced repetition)
router.get('/decks/:deckId/review', auth, (req, res) => {
  try {
    const cards = db.prepare(`SELECT * FROM flashcards WHERE deck_id = ? AND next_review <= datetime('now') ORDER BY next_review ASC LIMIT 20`).all(req.params.deckId);
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Kartı tekrar et (spaced repetition güncelle)
router.post('/cards/:cardId/review', auth, (req, res) => {
  try {
    const { quality } = req.body; // 0-5 arası (0=tamamen unutmuş, 5=çok kolay)
    const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Kart bulunamadı' });

    let { ease_factor, interval_days, review_count } = card;
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (quality < 3) {
      interval_days = 1;
    } else if (review_count === 0) {
      interval_days = 1;
    } else if (review_count === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }

    db.prepare(`UPDATE flashcards SET ease_factor = ?, interval_days = ?, review_count = review_count + 1,
      next_review = datetime('now', '+' || ? || ' days'), difficulty = ? WHERE id = ?`)
      .run(ease_factor, interval_days, interval_days, 5 - quality, req.params.cardId);

    // XP
    db.prepare('UPDATE users SET xp = xp + 3, total_xp = total_xp + 3 WHERE id = ?').run(req.userId);

    res.json({ nextReviewDays: interval_days, easeFactor: ease_factor });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
