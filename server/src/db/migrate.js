const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = process.env.DB_PATH || './data/dersmatik.db';
const dbDir = path.dirname(path.resolve(__dirname, '../../', dbPath));
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.resolve(__dirname, '../../', dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrate = () => {
  db.exec(`
    -- Kullanıcılar
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT DEFAULT 'default',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      total_xp INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      last_study_date TEXT,
      target_rank INTEGER,
      target_department TEXT,
      daily_goal_minutes INTEGER DEFAULT 120,
      daily_goal_questions INTEGER DEFAULT 50,
      mood TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Arkadaşlık
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      friend_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending', -- pending, accepted, rival
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id)
    );

    -- Dersler
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      exam_type TEXT NOT NULL, -- TYT, AYT
      category TEXT NOT NULL, -- Matematik, Fen, Sosyal, Türkçe, Dil
      icon TEXT,
      color TEXT
    );

    -- Konular
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL,
      parent_topic_id TEXT REFERENCES topics(id),
      order_index INTEGER DEFAULT 0
    );

    -- Sorular
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      exam_year INTEGER,
      exam_type TEXT, -- TYT, AYT
      exam_name TEXT, -- YKS 2024, YKS 2023 vs.
      question_number INTEGER,
      question_text TEXT NOT NULL,
      question_image TEXT,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      option_e TEXT,
      correct_answer TEXT NOT NULL, -- A, B, C, D, E
      solution_text TEXT,
      solution_image TEXT,
      difficulty INTEGER DEFAULT 3, -- 1-5
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Kullanıcı soru cevapları
    CREATE TABLE IF NOT EXISTS user_answers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      question_id TEXT NOT NULL REFERENCES questions(id),
      selected_answer TEXT, -- A, B, C, D, E veya NULL (boş)
      is_correct INTEGER NOT NULL,
      time_spent INTEGER, -- saniye
      exam_session_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Sınav oturumları (zamanlayıcılı sınav)
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      exam_type TEXT NOT NULL, -- TYT, AYT, custom
      exam_year INTEGER,
      title TEXT,
      total_questions INTEGER,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      empty_count INTEGER DEFAULT 0,
      net_score REAL DEFAULT 0,
      time_limit INTEGER, -- dakika
      time_spent INTEGER, -- saniye
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      status TEXT DEFAULT 'in_progress' -- in_progress, completed, abandoned
    );

    -- Manuel deneme sonuçları (okulda çözülen)
    CREATE TABLE IF NOT EXISTS trial_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      publisher TEXT, -- Yayınevi
      trial_name TEXT NOT NULL,
      exam_type TEXT NOT NULL, -- TYT, AYT
      exam_date TEXT,
      -- TYT alanları
      turkce_correct INTEGER DEFAULT 0,
      turkce_wrong INTEGER DEFAULT 0,
      sosyal_correct INTEGER DEFAULT 0,
      sosyal_wrong INTEGER DEFAULT 0,
      matematik_correct INTEGER DEFAULT 0,
      matematik_wrong INTEGER DEFAULT 0,
      fen_correct INTEGER DEFAULT 0,
      fen_wrong INTEGER DEFAULT 0,
      -- AYT alanları
      ayt_mat_correct INTEGER DEFAULT 0,
      ayt_mat_wrong INTEGER DEFAULT 0,
      ayt_fen_correct INTEGER DEFAULT 0,
      ayt_fen_wrong INTEGER DEFAULT 0,
      ayt_sosyal_correct INTEGER DEFAULT 0,
      ayt_sosyal_wrong INTEGER DEFAULT 0,
      ayt_edebiyat_correct INTEGER DEFAULT 0,
      ayt_edebiyat_wrong INTEGER DEFAULT 0,
      ayt_dil_correct INTEGER DEFAULT 0,
      ayt_dil_wrong INTEGER DEFAULT 0,
      total_net REAL,
      estimated_rank INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Flashcard desteleri
    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject_id TEXT REFERENCES subjects(id),
      title TEXT NOT NULL,
      description TEXT,
      is_public INTEGER DEFAULT 0,
      card_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Flashcardlar
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      difficulty INTEGER DEFAULT 0,
      next_review TEXT DEFAULT (datetime('now')),
      review_count INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Çalışma odaları
    CREATE TABLE IF NOT EXISTS study_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id),
      is_private INTEGER DEFAULT 0,
      max_members INTEGER DEFAULT 10,
      room_type TEXT DEFAULT 'silent', -- silent, voice
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Çalışma odası üyeleri
    CREATE TABLE IF NOT EXISTS study_room_members (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      joined_at TEXT DEFAULT (datetime('now')),
      is_studying INTEGER DEFAULT 1,
      UNIQUE(room_id, user_id)
    );

    -- Pomodoro oturumları
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject_id TEXT REFERENCES subjects(id),
      duration INTEGER NOT NULL, -- dakika
      type TEXT DEFAULT 'work', -- work, break
      completed INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- Çalışma logları (günlük takip)
    CREATE TABLE IF NOT EXISTS study_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject_id TEXT REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      activity_type TEXT NOT NULL, -- pomodoro, exam, question, flashcard
      duration_minutes INTEGER DEFAULT 0,
      questions_solved INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      mood TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Hedefler
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      goal_type TEXT NOT NULL, -- daily, weekly, custom
      target_value INTEGER NOT NULL,
      current_value INTEGER DEFAULT 0,
      unit TEXT NOT NULL, -- minutes, questions, net
      subject_id TEXT REFERENCES subjects(id),
      start_date TEXT,
      end_date TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Rozetler tanımları
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL, -- streak, questions, social, exam, study
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL,
      xp_reward INTEGER DEFAULT 0
    );

    -- Kullanıcı rozetleri
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      badge_id TEXT NOT NULL REFERENCES badges(id),
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_id)
    );

    -- Çalışma planı
    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Çalışma planı görevleri
    CREATE TABLE IF NOT EXISTS study_plan_tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
      subject_id TEXT REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      title TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      completed INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0
    );

    -- Formül defteri
    CREATE TABLE IF NOT EXISTS formulas (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      latex TEXT,
      image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Notlar (paylaşılabilir)
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject_id TEXT REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Hata defteri
    CREATE TABLE IF NOT EXISTS error_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      question_id TEXT REFERENCES questions(id),
      subject_id TEXT REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      error_type TEXT, -- carelessness, knowledge_gap, misunderstanding, time_pressure
      notes TEXT,
      reviewed INTEGER DEFAULT 0,
      review_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- XP Bahisleri
    CREATE TABLE IF NOT EXISTS xp_bets (
      id TEXT PRIMARY KEY,
      challenger_id TEXT NOT NULL REFERENCES users(id),
      opponent_id TEXT NOT NULL REFERENCES users(id),
      xp_amount INTEGER NOT NULL,
      bet_type TEXT NOT NULL, -- exam_score, questions_count, study_time
      description TEXT,
      challenger_result REAL,
      opponent_result REAL,
      winner_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'pending', -- pending, active, completed
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Çalışma sözleşmeleri
    CREATE TABLE IF NOT EXISTS study_contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      group_id TEXT,
      title TEXT NOT NULL,
      target_hours REAL NOT NULL,
      target_period TEXT NOT NULL, -- daily, weekly
      current_hours REAL DEFAULT 0,
      is_fulfilled INTEGER DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Zaman kapsülleri
    CREATE TABLE IF NOT EXISTS time_capsules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      open_date TEXT NOT NULL,
      is_opened INTEGER DEFAULT 0,
      from_friend_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Günlük check-in
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      mood TEXT NOT NULL, -- great, good, normal, low, bad
      energy_level INTEGER, -- 1-5
      motivation_level INTEGER, -- 1-5
      notes TEXT,
      checkin_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, checkin_date)
    );

    -- Bildirimler
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT, -- JSON
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Skill tree ilerleme
    CREATE TABLE IF NOT EXISTS skill_tree_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      topic_id TEXT NOT NULL REFERENCES topics(id),
      mastery_level INTEGER DEFAULT 0, -- 0-100
      questions_solved INTEGER DEFAULT 0,
      correct_rate REAL DEFAULT 0,
      unlocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, topic_id)
    );

    -- Grup sohbet mesajları
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexler
    CREATE INDEX IF NOT EXISTS idx_user_answers_user ON user_answers(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
    CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_year, exam_type);
    CREATE INDEX IF NOT EXISTS idx_study_logs_user ON study_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_trial_results_user ON trial_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
    CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  console.log('Veritabanı migration tamamlandı!');
};

migrate();
db.close();
