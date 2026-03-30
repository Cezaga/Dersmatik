const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Odaları listele
router.get('/', auth, (req, res) => {
  try {
    const rooms = db.prepare(`SELECT sr.*, u.display_name as owner_name,
      (SELECT COUNT(*) FROM study_room_members WHERE room_id = sr.id) as member_count
      FROM study_rooms sr JOIN users u ON sr.owner_id = u.id ORDER BY sr.created_at DESC`).all();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Oda oluştur
router.post('/', auth, (req, res) => {
  try {
    const { name, isPrivate, maxMembers, roomType } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO study_rooms (id, name, owner_id, is_private, max_members, room_type) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, req.userId, isPrivate ? 1 : 0, maxMembers || 10, roomType || 'silent');
    // Oluşturanı üye olarak ekle
    db.prepare('INSERT INTO study_room_members (id, room_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), id, req.userId);
    const room = db.prepare('SELECT * FROM study_rooms WHERE id = ?').get(id);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Oda oluşturulurken hata oluştu' });
  }
});

// Odaya katıl
router.post('/:roomId/join', auth, (req, res) => {
  try {
    const room = db.prepare('SELECT * FROM study_rooms WHERE id = ?').get(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Oda bulunamadı' });

    const memberCount = db.prepare('SELECT COUNT(*) as count FROM study_room_members WHERE room_id = ?').get(req.params.roomId);
    if (memberCount.count >= room.max_members) return res.status(400).json({ error: 'Oda dolu' });

    const existing = db.prepare('SELECT * FROM study_room_members WHERE room_id = ? AND user_id = ?').get(req.params.roomId, req.userId);
    if (existing) return res.status(400).json({ error: 'Zaten odadasınız' });

    db.prepare('INSERT INTO study_room_members (id, room_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.roomId, req.userId);
    res.json({ message: 'Odaya katıldınız' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Odadan ayrıl
router.post('/:roomId/leave', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM study_room_members WHERE room_id = ? AND user_id = ?').run(req.params.roomId, req.userId);
    res.json({ message: 'Odadan ayrıldınız' });
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

// Oda üyeleri
router.get('/:roomId/members', auth, (req, res) => {
  try {
    const members = db.prepare(`SELECT u.id, u.username, u.display_name, u.avatar, u.level, srm.is_studying, srm.joined_at
      FROM study_room_members srm JOIN users u ON srm.user_id = u.id WHERE srm.room_id = ?`).all(req.params.roomId);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Hata oluştu' });
  }
});

module.exports = router;
