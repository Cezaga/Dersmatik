function migrate(db) {
  const statements = [
    // Kullanıcılar
    `CREATE TABLE IF NOT EXISTS users (
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
    )`,
    `CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id)
    )`,
    `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT,
      color TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_topic_id TEXT,
      order_index INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      topic_id TEXT,
      exam_year INTEGER,
      exam_type TEXT,
      exam_name TEXT,
      question_number INTEGER,
      question_text TEXT NOT NULL,
      question_image TEXT,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      option_e TEXT,
      correct_answer TEXT NOT NULL,
      solution_text TEXT,
      solution_image TEXT,
      difficulty INTEGER DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS user_answers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER NOT NULL,
      time_spent INTEGER,
      exam_session_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      exam_year INTEGER,
      title TEXT,
      total_questions INTEGER,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      empty_count INTEGER DEFAULT 0,
      net_score REAL DEFAULT 0,
      time_limit INTEGER,
      time_spent INTEGER,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      status TEXT DEFAULT 'in_progress'
    )`,
    `CREATE TABLE IF NOT EXISTS trial_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      publisher TEXT,
      trial_name TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      exam_date TEXT,
      turkce_correct INTEGER DEFAULT 0, turkce_wrong INTEGER DEFAULT 0,
      sosyal_correct INTEGER DEFAULT 0, sosyal_wrong INTEGER DEFAULT 0,
      matematik_correct INTEGER DEFAULT 0, matematik_wrong INTEGER DEFAULT 0,
      fen_correct INTEGER DEFAULT 0, fen_wrong INTEGER DEFAULT 0,
      ayt_mat_correct INTEGER DEFAULT 0, ayt_mat_wrong INTEGER DEFAULT 0,
      ayt_fen_correct INTEGER DEFAULT 0, ayt_fen_wrong INTEGER DEFAULT 0,
      ayt_sosyal_correct INTEGER DEFAULT 0, ayt_sosyal_wrong INTEGER DEFAULT 0,
      ayt_edebiyat_correct INTEGER DEFAULT 0, ayt_edebiyat_wrong INTEGER DEFAULT 0,
      ayt_dil_correct INTEGER DEFAULT 0, ayt_dil_wrong INTEGER DEFAULT 0,
      total_net REAL,
      estimated_rank INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      is_public INTEGER DEFAULT 0,
      card_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      difficulty INTEGER DEFAULT 0,
      next_review TEXT DEFAULT (datetime('now')),
      review_count INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS study_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      max_members INTEGER DEFAULT 10,
      room_type TEXT DEFAULT 'silent',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS study_room_members (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT DEFAULT (datetime('now')),
      is_studying INTEGER DEFAULT 1,
      UNIQUE(room_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT,
      duration INTEGER NOT NULL,
      type TEXT DEFAULT 'work',
      completed INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS study_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT,
      topic_id TEXT,
      activity_type TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 0,
      questions_solved INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      mood TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      goal_type TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      current_value INTEGER DEFAULT 0,
      unit TEXT NOT NULL,
      subject_id TEXT,
      start_date TEXT,
      end_date TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL,
      xp_reward INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_id)
    )`,
    `CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS study_plan_tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      subject_id TEXT,
      topic_id TEXT,
      title TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      completed INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS formulas (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      latex TEXT,
      image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT,
      topic_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS error_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT,
      subject_id TEXT,
      topic_id TEXT,
      error_type TEXT,
      notes TEXT,
      reviewed INTEGER DEFAULT 0,
      review_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS xp_bets (
      id TEXT PRIMARY KEY,
      challenger_id TEXT NOT NULL,
      opponent_id TEXT NOT NULL,
      xp_amount INTEGER NOT NULL,
      bet_type TEXT NOT NULL,
      description TEXT,
      challenger_result REAL,
      opponent_result REAL,
      winner_id TEXT,
      status TEXT DEFAULT 'pending',
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS study_contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      group_id TEXT,
      title TEXT NOT NULL,
      target_hours REAL NOT NULL,
      target_period TEXT NOT NULL,
      current_hours REAL DEFAULT 0,
      is_fulfilled INTEGER DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS time_capsules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      open_date TEXT NOT NULL,
      is_opened INTEGER DEFAULT 0,
      from_friend_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS daily_checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mood TEXT NOT NULL,
      energy_level INTEGER,
      motivation_level INTEGER,
      notes TEXT,
      checkin_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, checkin_date)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS skill_tree_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      mastery_level INTEGER DEFAULT 0,
      questions_solved INTEGER DEFAULT 0,
      correct_rate REAL DEFAULT 0,
      unlocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, topic_id)
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_user_answers_user ON user_answers(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_year, exam_type)`,
    `CREATE INDEX IF NOT EXISTS idx_study_logs_user ON study_logs(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_trial_results_user ON trial_results(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`,
  ];

  for (const sql of statements) {
    try { db.exec(sql); } catch (e) { /* table may already exist */ }
  }
  console.log('Veritabani migration tamamlandi!');
}

module.exports = migrate;
