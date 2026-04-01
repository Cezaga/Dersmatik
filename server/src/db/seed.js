const { v4: uuidv4 } = require('uuid');

function seed(db) {
  // ===== DERSLER =====
  const subjects = [
    { id: 'tyt-turkce', name: 'Türkçe', exam_type: 'TYT', category: 'Türkçe', icon: '📖', color: '#EF4444' },
    { id: 'tyt-mat', name: 'Temel Matematik', exam_type: 'TYT', category: 'Matematik', icon: '🔢', color: '#3B82F6' },
    { id: 'tyt-fen', name: 'Fen Bilimleri', exam_type: 'TYT', category: 'Fen', icon: '🔬', color: '#10B981' },
    { id: 'tyt-sosyal', name: 'Sosyal Bilimler', exam_type: 'TYT', category: 'Sosyal', icon: '🌍', color: '#F59E0B' },
    { id: 'ayt-mat', name: 'Matematik', exam_type: 'AYT', category: 'Matematik', icon: '📐', color: '#6366F1' },
    { id: 'ayt-fizik', name: 'Fizik', exam_type: 'AYT', category: 'Fen', icon: '⚛️', color: '#8B5CF6' },
    { id: 'ayt-kimya', name: 'Kimya', exam_type: 'AYT', category: 'Fen', icon: '🧪', color: '#EC4899' },
    { id: 'ayt-biyoloji', name: 'Biyoloji', exam_type: 'AYT', category: 'Fen', icon: '🧬', color: '#14B8A6' },
    { id: 'ayt-edebiyat', name: 'Türk Dili ve Edebiyatı', exam_type: 'AYT', category: 'Türkçe', icon: '✍️', color: '#F97316' },
    { id: 'ayt-tarih', name: 'Tarih', exam_type: 'AYT', category: 'Sosyal', icon: '🏛️', color: '#78716C' },
    { id: 'ayt-cografya', name: 'Coğrafya', exam_type: 'AYT', category: 'Sosyal', icon: '🗺️', color: '#22C55E' },
    { id: 'ayt-felsefe', name: 'Felsefe', exam_type: 'AYT', category: 'Sosyal', icon: '🤔', color: '#A855F7' },
  ];

  const insertSubject = db.prepare('INSERT OR IGNORE INTO subjects (id, name, exam_type, category, icon, color) VALUES (?, ?, ?, ?, ?, ?)');
  for (const s of subjects) {
    insertSubject.run(s.id, s.name, s.exam_type, s.category, s.icon, s.color);
  }

  // ===== KONULAR =====
  const topicsData = {
    'tyt-turkce': ['Sözcükte Anlam', 'Cümlede Anlam', 'Deyimler ve Atasözleri', 'Paragraf', 'Ses Bilgisi', 'Yazım Kuralları', 'Noktalama İşaretleri', 'Sözcük Türleri', 'Cümle Türleri', 'Cümle Ögeleri', 'Anlatım Bozuklukları', 'Fiilde Çatı'],
    'tyt-mat': ['Temel Kavramlar', 'Sayı Basamakları', 'Bölme ve Bölünebilme', 'EBOB-EKOK', 'Rasyonel Sayılar', 'Basit Eşitsizlikler', 'Mutlak Değer', 'Üslü Sayılar', 'Köklü Sayılar', 'Çarpanlara Ayırma', 'Oran ve Orantı', 'Problemler', 'Kümeler', 'Fonksiyonlar', 'Polinomlar', 'İkinci Dereceden Denklemler', 'Permütasyon ve Kombinasyon', 'Olasılık', 'Veri Analizi', 'Üçgenler', 'Dörtgenler', 'Çember ve Daire', 'Katı Cisimler'],
    'tyt-fen': ['Fizik - Kuvvet ve Hareket', 'Fizik - Enerji', 'Fizik - Isı ve Sıcaklık', 'Fizik - Elektrik', 'Fizik - Optik', 'Fizik - Dalga', 'Kimya - Atom ve Periyodik Tablo', 'Kimya - Kimyasal Bağlar', 'Kimya - Madde ve Özellikleri', 'Kimya - Karışımlar', 'Kimya - Asit ve Bazlar', 'Kimya - Kimyasal Tepkimeler', 'Biyoloji - Hücre', 'Biyoloji - Canlıların Sınıflandırılması', 'Biyoloji - Kalıtım', 'Biyoloji - Ekosistem', 'Biyoloji - Bitkiler', 'Biyoloji - İnsan Fizyolojisi'],
    'tyt-sosyal': ['Tarih - İlk Çağ', 'Tarih - İslam Tarihi', 'Tarih - Osmanlı Kuruluş', 'Tarih - Osmanlı Yükselme', 'Tarih - Kurtuluş Savaşı', 'Tarih - Atatürk İnkılapları', 'Coğrafya - Dünya ve Haritalar', 'Coğrafya - İklim', 'Coğrafya - Nüfus', 'Coğrafya - Türkiye Coğrafyası', 'Felsefe - Felsefeye Giriş', 'Felsefe - Bilgi Felsefesi', 'Din Kültürü - İslam ve İbadet', 'Din Kültürü - Hz. Muhammed'],
    'ayt-mat': ['Fonksiyonlar', 'Polinomlar', 'İkinci Dereceden Denklemler', 'Eşitsizlikler', 'Trigonometri', 'Logaritma', 'Diziler', 'Limit', 'Türev', 'İntegral', 'Karmaşık Sayılar', 'Matrisler ve Determinant', 'Konikler', 'Analitik Geometri', 'Özel Tanımlı Fonksiyonlar', 'Parabol'],
    'ayt-fizik': ['Vektörler', 'Kuvvet ve Denge', 'Tork', 'Düzgün Çembersel Hareket', 'Basit Harmonik Hareket', 'Dalga Mekaniği', 'Elektrik Alan', 'Manyetik Alan', 'Elektromanyetik İndüksiyon', 'Alternatif Akım', 'Modern Fizik', 'Atom Fiziği'],
    'ayt-kimya': ['Mol Kavramı', 'Kimyasal Tepkimelerde Hesaplamalar', 'Gazlar', 'Çözeltiler', 'Kimyasal Tepkimelerde Denge', 'Asit-Baz Dengesi', 'Çözünürlük Dengesi', 'Kimyasal Kinetik', 'Elektrokimya', 'Organik Kimya', 'Karbon Kimyası', 'Enerji Kimyası'],
    'ayt-biyoloji': ['Nükleik Asitler ve Protein Sentezi', 'Hücre Bölünmeleri', 'Kalıtım Genetik', 'Bitki Biyolojisi', 'Komünite ve Popülasyon Ekolojisi', 'Canlılarda Enerji Dönüşümü', 'İnsan Fizyolojisi - Sindirim', 'İnsan Fizyolojisi - Dolaşım', 'İnsan Fizyolojisi - Solunum', 'İnsan Fizyolojisi - Sinir Sistemi', 'İnsan Fizyolojisi - Endokrin', 'İnsan Fizyolojisi - Boşaltım'],
    'ayt-edebiyat': ['Şiir Bilgisi', 'Edebi Sanatlar', 'İslamiyet Öncesi Türk Edebiyatı', 'Divan Edebiyatı', 'Halk Edebiyatı', 'Tanzimat Edebiyatı', 'Servet-i Fünun', 'Milli Edebiyat', 'Cumhuriyet Dönemi', 'Roman Türü', 'Hikaye Türü', 'Tiyatro Türü'],
    'ayt-tarih': ['İlk Çağ Uygarlıkları', 'İslam Medeniyeti', 'Türk-İslam Devletleri', 'Osmanlı Kuruluş ve Yükselme', 'Osmanlı Duraklama ve Gerileme', 'Osmanlı Son Dönem ve Islahatlar', 'I. Dünya Savaşı', 'Kurtuluş Savaşı', 'Atatürk Dönemi', 'II. Dünya Savaşı Sonrası', 'Soğuk Savaş', 'Yakın Tarih'],
    'ayt-cografya': ['Doğal Sistemler', 'Beşeri Sistemler', 'Küresel Ortam', 'Çevre ve Toplum', 'Türkiye Fiziki Coğrafyası', 'Türkiye Beşeri Coğrafyası', 'Bölgeler', 'Ülkeler Coğrafyası'],
    'ayt-felsefe': ['Bilgi Felsefesi', 'Varlık Felsefesi', 'Ahlak Felsefesi', 'Sanat Felsefesi', 'Din Felsefesi', 'Siyaset Felsefesi', 'Mantık', 'Bilim Felsefesi', 'Sosyoloji', 'Psikoloji'],
  };

  const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (id, subject_id, name, order_index) VALUES (?, ?, ?, ?)');
  for (const [subjectId, topics] of Object.entries(topicsData)) {
    topics.forEach((name, i) => {
      const topicId = `${subjectId}-${i}`;
      insertTopic.run(topicId, subjectId, name, i);
    });
  }

  // ===== ROZETLER =====
  const badges = [
    { name: 'İlk Adım', description: '3 gün üst üste çalış', icon: '🔥', category: 'streak', req_type: 'streak_days', req_val: 3, xp: 50 },
    { name: 'Kararlı', description: '7 gün üst üste çalış', icon: '💪', category: 'streak', req_type: 'streak_days', req_val: 7, xp: 100 },
    { name: 'Disiplinli', description: '14 gün üst üste çalış', icon: '🏋️', category: 'streak', req_type: 'streak_days', req_val: 14, xp: 200 },
    { name: 'Demir İrade', description: '30 gün üst üste çalış', icon: '⚡', category: 'streak', req_type: 'streak_days', req_val: 30, xp: 500 },
    { name: 'Efsane', description: '100 gün üst üste çalış', icon: '👑', category: 'streak', req_type: 'streak_days', req_val: 100, xp: 2000 },
    { name: 'Meraklı', description: '50 soru çöz', icon: '❓', category: 'questions', req_type: 'total_questions', req_val: 50, xp: 50 },
    { name: 'Çalışkan', description: '250 soru çöz', icon: '📝', category: 'questions', req_type: 'total_questions', req_val: 250, xp: 150 },
    { name: 'Soru Canavarı', description: '1000 soru çöz', icon: '🦁', category: 'questions', req_type: 'total_questions', req_val: 1000, xp: 500 },
    { name: 'Soru Makinesi', description: '5000 soru çöz', icon: '🤖', category: 'questions', req_type: 'total_questions', req_val: 5000, xp: 1500 },
    { name: 'Başlangıç', description: 'Toplam 60 dakika çalış', icon: '⏰', category: 'study', req_type: 'total_study_minutes', req_val: 60, xp: 30 },
    { name: 'Odaklı', description: 'Toplam 10 saat çalış', icon: '🎯', category: 'study', req_type: 'total_study_minutes', req_val: 600, xp: 200 },
    { name: 'Maratoncu', description: 'Toplam 50 saat çalış', icon: '🏃', category: 'study', req_type: 'total_study_minutes', req_val: 3000, xp: 750 },
    { name: 'Pomodoro Aşığı', description: '10 pomodoro tamamla', icon: '🍅', category: 'study', req_type: 'total_pomodoros', req_val: 10, xp: 50 },
    { name: 'Pomodoro Ustası', description: '100 pomodoro tamamla', icon: '🍅', category: 'study', req_type: 'total_pomodoros', req_val: 100, xp: 500 },
    { name: 'Çırak', description: 'Seviye 5\'e ulaş', icon: '🌱', category: 'level', req_type: 'level', req_val: 5, xp: 100 },
    { name: 'Kalfa', description: 'Seviye 10\'a ulaş', icon: '🌿', category: 'level', req_type: 'level', req_val: 10, xp: 300 },
    { name: 'Usta', description: 'Seviye 25\'e ulaş', icon: '🌳', category: 'level', req_type: 'level', req_val: 25, xp: 1000 },
    { name: 'Büyük Usta', description: 'Seviye 50\'ye ulaş', icon: '🏔️', category: 'level', req_type: 'level', req_val: 50, xp: 5000 },
  ];

  const insertBadge = db.prepare('INSERT OR IGNORE INTO badges (id, name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const b of badges) {
    insertBadge.run(uuidv4(), b.name, b.description, b.icon, b.category, b.req_type, b.req_val, b.xp);
  }

  // ===== ÖRNEK SORULAR =====
  const sampleQuestions = [
    { sid: 'tyt-mat', tid: 'tyt-mat-3', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 1, qt: 'İki ardışık tek doğal sayının toplamı 36 ise büyük olan sayı kaçtır?', a: '15', b: '17', c: '19', d: '21', e: '23', ca: 'C', st: 'Ardışık tek sayılar: 2n+1 ve 2n+3. Toplamları: 4n+4=36, n=8. Sayılar: 17 ve 19.', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-3', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 2, qt: '12 ve 18 sayılarının EBOB\'u ile EKOK\'unun toplamı kaçtır?', a: '36', b: '42', c: '30', d: '48', e: '24', ca: 'B', st: 'EBOB(12,18)=6, EKOK(12,18)=36. Toplam=42', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-10', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 3, qt: 'Bir sınıftaki kız ve erkek öğrenci sayısının oranı 3/5\'tir. Sınıfta 40 öğrenci olduğuna göre kaç kız öğrenci vardır?', a: '12', b: '15', c: '18', d: '20', e: '24', ca: 'B', st: 'Kız/Erkek=3/5, toplam 8 pay. 40/8=5. Kız=3×5=15', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-11', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 4, qt: 'Ali\'nin yaşı Veli\'nin yaşının 3 katından 2 eksiktir. Yaşları toplamı 42 ise Ali kaç yaşındadır?', a: '29', b: '31', c: '30', d: '32', e: '28', ca: 'B', st: 'Ali=3V-2, Ali+V=42 → 4V=44 → V=11 → Ali=31', df: 3 },
    { sid: 'tyt-mat', tid: 'tyt-mat-7', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 5, qt: '2^10 + 2^10 işleminin sonucu kaçtır?', a: '2^20', b: '4^10', c: '2^11', d: '2^10', e: '2^12', ca: 'C', st: '2^10+2^10 = 2×2^10 = 2^11', df: 2 },
    { sid: 'tyt-turkce', tid: 'tyt-turkce-0', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 1, qt: '"Kalbim bir çiçek gibi açıldı." cümlesinde hangi söz sanatı vardır?', a: 'Benzetme (Teşbih)', b: 'Kişileştirme', c: 'Abartma', d: 'Mecaz', e: 'Ad aktarması', ca: 'A', st: '"Gibi" edatıyla kalbim çiçeğe benzetilmiş. Bu teşbihtir.', df: 2 },
    { sid: 'tyt-fen', tid: 'tyt-fen-0', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 1, qt: '5 kg kütleli bir cisme 20 N kuvvet uygulanırsa cismin ivmesi kaç m/s² olur?', a: '2', b: '4', c: '5', d: '10', e: '25', ca: 'B', st: 'F=m.a → 20=5.a → a=4 m/s²', df: 1 },
    { sid: 'ayt-mat', tid: 'ayt-mat-7', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 1, qt: 'lim(x→2) (x²-4)/(x-2) limitinin değeri kaçtır?', a: '0', b: '2', c: '4', d: 'Tanımsız', e: '8', ca: 'C', st: '(x²-4)/(x-2) = (x-2)(x+2)/(x-2) = x+2. x→2 için 4', df: 2 },
    { sid: 'ayt-mat', tid: 'ayt-mat-8', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 2, qt: 'f(x) = 3x² + 2x - 1 fonksiyonunun x=1 noktasındaki türevi kaçtır?', a: '4', b: '6', c: '8', d: '10', e: '12', ca: 'C', st: 'f\'(x) = 6x+2. f\'(1) = 8', df: 2 },
    { sid: 'ayt-mat', tid: 'ayt-mat-9', yr: 2023, et: 'AYT', en: 'YKS 2023', qn: 3, qt: '∫(0→2) 3x² dx belirli integralinin değeri kaçtır?', a: '4', b: '6', c: '8', d: '10', e: '12', ca: 'C', st: '∫3x² dx = x³. [x³]₀² = 8-0 = 8', df: 3 },
  ];

  const insertQ = db.prepare('INSERT OR IGNORE INTO questions (id, subject_id, topic_id, exam_year, exam_type, exam_name, question_number, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, solution_text, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const q of sampleQuestions) {
    insertQ.run(uuidv4(), q.sid, q.tid, q.yr, q.et, q.en, q.qn, q.qt, q.a, q.b, q.c, q.d, q.e, q.ca, q.st, q.df);
  }

  // ===== FORMÜLLER =====
  const formulas = [
    { sid: 'tyt-mat', t: 'EBOB-EKOK İlişkisi', c: 'EBOB(a,b) × EKOK(a,b) = a × b' },
    { sid: 'tyt-mat', t: 'Hız Formülü', c: 'Hız = Yol / Zaman' },
    { sid: 'tyt-mat', t: 'Üçgen Alan', c: 'Alan = (taban × yükseklik) / 2' },
    { sid: 'tyt-mat', t: 'Pisagor Teoremi', c: 'a² + b² = c² (dik üçgende)' },
    { sid: 'tyt-mat', t: 'Çemberin Çevresi', c: 'Çevre = 2πr' },
    { sid: 'tyt-mat', t: 'Dairenin Alanı', c: 'Alan = πr²' },
    { sid: 'ayt-mat', t: 'Türev Kuralları', c: 'f(x)=xⁿ → f\'(x)=n.xⁿ⁻¹\nf(x)=eˣ → f\'(x)=eˣ\nf(x)=ln(x) → f\'(x)=1/x' },
    { sid: 'ayt-mat', t: 'İntegral Kuralları', c: '∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n∫eˣ dx = eˣ + C\n∫1/x dx = ln|x| + C' },
    { sid: 'ayt-mat', t: 'Trigonometri Özdeşlikleri', c: 'sin²x + cos²x = 1\n1 + tan²x = sec²x\nsin2x = 2sinx.cosx' },
    { sid: 'tyt-fen', t: 'Newton\'un 2. Yasası', c: 'F = m × a (Kuvvet = Kütle × İvme)' },
    { sid: 'tyt-fen', t: 'Enerji Formülleri', c: 'Ek = ½mv² (Kinetik)\nEp = mgh (Potansiyel)' },
    { sid: 'ayt-fizik', t: 'Coulomb Yasası', c: 'F = k × |q₁×q₂| / r²' },
    { sid: 'ayt-kimya', t: 'Mol Hesabı', c: 'n = m/M (mol = kütle/mol kütlesi)\n1 mol = 6.02 × 10²³ tanecik' },
  ];

  const insertF = db.prepare('INSERT OR IGNORE INTO formulas (id, subject_id, title, content) VALUES (?, ?, ?, ?)');
  for (const f of formulas) {
    insertF.run(uuidv4(), f.sid, f.t, f.c);
  }

  console.log(`Seed data yuklendi! ${subjects.length} ders, ${Object.values(topicsData).flat().length} konu, ${badges.length} rozet, ${sampleQuestions.length} soru, ${formulas.length} formul`);
}

module.exports = seed;
