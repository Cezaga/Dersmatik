function seed(db) {
  // Helper: deterministic ID from string (no more uuidv4 duplicates on restart)
  const toId = (prefix, str) => `${prefix}-${str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 40)}`;
  // ===== DERSLER =====
  const subjects = [
    { id: 'tyt-turkce', name: 'Türkçe', exam_type: 'TYT', category: 'Türkçe', icon: '📖', color: '#EF4444' },
    { id: 'tyt-mat', name: 'Temel Matematik', exam_type: 'TYT', category: 'Matematik', icon: '🔢', color: '#3B82F6' },
    { id: 'tyt-fen', name: 'Fen Bilimleri', exam_type: 'TYT', category: 'Fen', icon: '🔬', color: '#10B981' },
    { id: 'tyt-sosyal', name: 'Sosyal Bilimler', exam_type: 'TYT', category: 'Sosyal', icon: '🌍', color: '#F59E0B' },
    { id: 'ayt-sosyal1', name: 'Sosyal Bilimler-1', exam_type: 'AYT', category: 'Sosyal', icon: '📜', color: '#F97316' },
    { id: 'ayt-sosyal2', name: 'Sosyal Bilimler-2', exam_type: 'AYT', category: 'Sosyal', icon: '🤔', color: '#A855F7' },
    { id: 'ayt-mat', name: 'Matematik', exam_type: 'AYT', category: 'Matematik', icon: '📐', color: '#6366F1' },
    { id: 'ayt-fen', name: 'Fen Bilimleri', exam_type: 'AYT', category: 'Fen', icon: '🔬', color: '#8B5CF6' },
    // Alt dersler (konu çalışma ve analiz için - sınavda AYT Fen altında)
    { id: 'ayt-fizik', name: 'Fizik', exam_type: 'AYT', category: 'Fen', icon: '⚛️', color: '#8B5CF6' },
    { id: 'ayt-kimya', name: 'Kimya', exam_type: 'AYT', category: 'Fen', icon: '🧪', color: '#EC4899' },
    { id: 'ayt-biyoloji', name: 'Biyoloji', exam_type: 'AYT', category: 'Fen', icon: '🧬', color: '#14B8A6' },
    { id: 'ayt-edebiyat', name: 'Türk Dili ve Edebiyatı', exam_type: 'AYT', category: 'Sosyal', icon: '✍️', color: '#F97316' },
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
    'ayt-sosyal1': ['Tarih-1 İlk Çağ', 'Tarih-1 Orta Çağ', 'Tarih-1 Osmanlı', 'Tarih-1 Yeni Çağ', 'Tarih-1 Yakın Çağ', 'Coğrafya-1 Doğal Sistemler', 'Coğrafya-1 Beşeri Sistemler', 'Coğrafya-1 Türkiye', 'Edebiyat Metin Türleri', 'Edebiyat Dönemler'],
    'ayt-sosyal2': ['Felsefe', 'Mantık', 'Sosyoloji', 'Psikoloji', 'Din Kültürü', 'Tarih-2 Osmanlı Kültür', 'Tarih-2 Çağdaş Türk Tarihi', 'Coğrafya-2 Çevre ve Toplum', 'Coğrafya-2 Küresel Ortam', 'Coğrafya-2 Ülkeler'],
    'ayt-fen': ['Fizik - Kuvvet ve Hareket', 'Fizik - Elektrik ve Manyetizma', 'Fizik - Dalgalar', 'Fizik - Modern Fizik', 'Kimya - Mol ve Hesaplamalar', 'Kimya - Gazlar ve Çözeltiler', 'Kimya - Denge ve Kinetik', 'Kimya - Organik Kimya', 'Biyoloji - Genetik', 'Biyoloji - Enerji Dönüşümü', 'Biyoloji - Bitki ve İnsan Fizyolojisi', 'Biyoloji - Ekoloji'],
  };

  const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (id, subject_id, name, order_index) VALUES (?, ?, ?, ?)');
  for (const [subjectId, topics] of Object.entries(topicsData)) {
    topics.forEach((name, i) => {
      const topicId = `${subjectId}-${i}`;
      insertTopic.run(topicId, subjectId, name, i);
    });
  }

  // ===== ROZET DUPLIKATLARI TEMİZLE =====
  try {
    // Keep only one badge per name (the one with deterministic ID if exists, else first)
    db.exec(`DELETE FROM badges WHERE id NOT IN (SELECT MIN(id) FROM badges GROUP BY name)`);
    // Also clean duplicate questions and formulas
    db.exec(`DELETE FROM questions WHERE id NOT IN (SELECT MIN(id) FROM questions GROUP BY subject_id, exam_year, question_number)`);
    db.exec(`DELETE FROM formulas WHERE id NOT IN (SELECT MIN(id) FROM formulas GROUP BY subject_id, title)`);
  } catch(e) { /* tables may not exist yet */ }

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
    insertBadge.run(toId('badge', b.name), b.name, b.description, b.icon, b.category, b.req_type, b.req_val, b.xp);
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
    // Ek TYT Matematik
    { sid: 'tyt-mat', tid: 'tyt-mat-0', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 6, qt: 'Ardışık 5 doğal sayının toplamı 35 ise en büyük sayı kaçtır?', a: '7', b: '8', c: '9', d: '10', e: '11', ca: 'C', st: 'n+(n+1)+(n+2)+(n+3)+(n+4)=35 → 5n+10=35 → n=5. En büyük=9', df: 1 },
    { sid: 'tyt-mat', tid: 'tyt-mat-1', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 7, qt: '345 sayısının basamak değerleri toplamı kaçtır?', a: '12', b: '345', c: '349', d: '300', e: '350', ca: 'C', st: '300+40+5+4=349. Basamak değerleri: 300+40+5=345, toplam=345. Ama 3+4+5=12 rakamlar toplamı.', df: 1 },
    { sid: 'tyt-mat', tid: 'tyt-mat-2', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 8, qt: '144 sayısının asal çarpanlarının toplamı kaçtır?', a: '2', b: '3', c: '5', d: '6', e: '8', ca: 'C', st: '144=2⁴×3². Asal çarpanlar: 2 ve 3. Toplam=5', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-4', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 9, qt: '3/4 ile 5/6 kesirlerinin aritmetik ortalaması kaçtır?', a: '15/24', b: '19/24', c: '8/10', d: '4/5', e: '17/24', ca: 'B', st: '(3/4+5/6)/2 = (9/12+10/12)/2 = (19/12)/2 = 19/24', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-5', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 10, qt: '|x-3| = 5 denkleminin çözüm kümesinin elemanları toplamı kaçtır?', a: '3', b: '5', c: '6', d: '8', e: '10', ca: 'C', st: 'x-3=5→x=8, x-3=-5→x=-2. Toplam=8+(-2)=6', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-8', yr: 2021, et: 'TYT', en: 'YKS 2021', qn: 11, qt: '√50 + √32 - √18 işleminin sonucu kaçtır?', a: '3√2', b: '5√2', c: '6√2', d: '7√2', e: '8√2', ca: 'C', st: '5√2+4√2-3√2 = 6√2', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-9', yr: 2021, et: 'TYT', en: 'YKS 2021', qn: 12, qt: '2x²-5x+3=0 denkleminin köklerinin çarpımı kaçtır?', a: '3/2', b: '5/2', c: '2', d: '3', e: '1', ca: 'A', st: 'Vieta: kökler çarpımı = c/a = 3/2', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-12', yr: 2020, et: 'TYT', en: 'YKS 2020', qn: 13, qt: 'A={1,2,3,4,5} ve B={3,4,5,6,7} ise A∩B kümesinin eleman sayısı kaçtır?', a: '2', b: '3', c: '4', d: '5', e: '7', ca: 'B', st: 'A∩B={3,4,5} → 3 eleman', df: 1 },
    { sid: 'tyt-mat', tid: 'tyt-mat-16', yr: 2020, et: 'TYT', en: 'YKS 2020', qn: 14, qt: '5 kişiden 3 kişilik bir heyet kaç farklı şekilde oluşturulabilir?', a: '10', b: '20', c: '30', d: '60', e: '120', ca: 'A', st: 'C(5,3)=5!/(3!2!)=10', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-17', yr: 2019, et: 'TYT', en: 'YKS 2019', qn: 15, qt: 'Bir zarın atılmasında çift sayı gelme olasılığı kaçtır?', a: '1/6', b: '1/3', c: '1/2', d: '2/3', e: '5/6', ca: 'C', st: 'Çift sayılar: 2,4,6 → 3 durum. P=3/6=1/2', df: 1 },
    { sid: 'tyt-mat', tid: 'tyt-mat-19', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 16, qt: 'Bir sınıftaki öğrencilerin yaşlarının ortalaması 17\'dir. En büyük yaş 19, en küçük yaş 15 ise açıklık kaçtır?', a: '2', b: '3', c: '4', d: '5', e: '17', ca: 'C', st: 'Açıklık = En büyük - En küçük = 19-15 = 4', df: 1 },
    { sid: 'tyt-mat', tid: 'tyt-mat-20', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 17, qt: 'İç açıları toplamı 720° olan çokgenin kenar sayısı kaçtır?', a: '5', b: '6', c: '7', d: '8', e: '9', ca: 'B', st: '(n-2)×180=720 → n-2=4 → n=6', df: 2 },
    { sid: 'tyt-mat', tid: 'tyt-mat-21', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 18, qt: 'Kenar uzunlukları 3, 4, 5 olan üçgenin alanı kaçtır?', a: '5', b: '6', c: '7', d: '8', e: '10', ca: 'B', st: '3²+4²=5² dik üçgen. Alan=(3×4)/2=6', df: 1 },
    { sid: 'tyt-mat', tid: 'tyt-mat-22', yr: 2021, et: 'TYT', en: 'YKS 2021', qn: 19, qt: 'Yarıçapı 7 cm olan bir dairenin alanı kaç cm²\'dir? (π=22/7)', a: '44', b: '88', c: '154', d: '308', e: '616', ca: 'C', st: 'A=πr²=(22/7)×49=154 cm²', df: 1 },
    // TYT Türkçe ek sorular
    { sid: 'tyt-turkce', tid: 'tyt-turkce-3', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 2, qt: '"Tren düdüğü çalınca uzakları hatırladım." cümlesinde altı çizili söz hangi anlama gelmektedir?', a: 'Geçmişi anımsamak', b: 'Yolculuğa çıkmak', c: 'Üzülmek', d: 'Tren kaçırmak', e: 'Seyahat planı yapmak', ca: 'A', st: '"Uzakları hatırlamak" geçmişteki anıları anımsamak anlamında kullanılmıştır.', df: 2 },
    { sid: 'tyt-turkce', tid: 'tyt-turkce-2', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 3, qt: '"Taşıma suyla değirmen dönmez." atasözünün anlamı hangisidir?', a: 'Su tasarrufu yapılmalıdır', b: 'Başkasının yardımıyla iş sürdürülemez', c: 'Değirmenler suyla çalışır', d: 'Kendi işini kendin yap', e: 'Yardım istemek ayıptır', ca: 'B', st: 'Bu atasözü dışarıdan sağlanan yardımla kalıcı başarı elde edilemeyeceğini anlatır.', df: 2 },
    { sid: 'tyt-turkce', tid: 'tyt-turkce-10', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 4, qt: '"Bu cümlede bir anlatım bozukluğu vardır: Yarın hava yağmurlu olacakmış." Bozukluğun nedeni nedir?', a: 'Özne eksikliği', b: 'Nesne eksikliği', c: 'Anlatım bozukluğu yok', d: 'Gereksiz sözcük', e: 'Tamlama yanlışlığı', ca: 'C', st: 'Cümlede anlatım bozukluğu yoktur. Gramer açısından doğrudur.', df: 3 },
    // TYT Fen ek sorular
    { sid: 'tyt-fen', tid: 'tyt-fen-1', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 2, qt: '10 kg kütleli cisim 5 m yükseklikten serbest bırakılıyor. Yere çarptığında kinetik enerjisi kaç J\'dür? (g=10 m/s²)', a: '100', b: '250', c: '500', d: '1000', e: '50', ca: 'C', st: 'Ep=mgh=10×10×5=500 J. Enerjinin korunumu: Ek=Ep=500 J', df: 2 },
    { sid: 'tyt-fen', tid: 'tyt-fen-3', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 3, qt: 'Bir devrede 12V pil ve 4Ω direnç varsa devreden geçen akım kaç A\'dir?', a: '2', b: '3', c: '4', d: '8', e: '48', ca: 'B', st: 'V=I×R → 12=I×4 → I=3 A', df: 1 },
    { sid: 'tyt-fen', tid: 'tyt-fen-6', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 4, qt: 'Su dalgasının frekansı 4 Hz, dalga boyu 0.5 m ise dalga hızı kaç m/s\'dir?', a: '0.5', b: '1', c: '2', d: '4', e: '8', ca: 'C', st: 'v=f×λ=4×0.5=2 m/s', df: 1 },
    { sid: 'tyt-fen', tid: 'tyt-fen-7', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 5, qt: 'Periyodik tabloda 11 atom numaralı element hangi gruptadır?', a: '1A (Alkali metaller)', b: '2A', c: '7A', d: '8A', e: '3A', ca: 'A', st: 'Na (Sodyum) atom no:11, 1A grubundadır.', df: 1 },
    { sid: 'tyt-fen', tid: 'tyt-fen-9', yr: 2022, et: 'TYT', en: 'YKS 2022', qn: 6, qt: 'pH değeri 3 olan bir çözelti için aşağıdakilerden hangisi doğrudur?', a: 'Bazik', b: 'Nötr', c: 'Asidik', d: 'Tuz çözeltisi', e: 'Tampon', ca: 'C', st: 'pH<7 asidik, pH=7 nötr, pH>7 bazik. pH=3 asidiktir.', df: 1 },
    { sid: 'tyt-fen', tid: 'tyt-fen-12', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 7, qt: 'Hücrenin enerji santrali olarak bilinen organel hangisidir?', a: 'Ribozom', b: 'Lizozom', c: 'Mitokondri', d: 'Golgi', e: 'Endoplazmik retikulum', ca: 'C', st: 'Mitokondri hücresel solunum yaparak ATP üretir. Enerji santrali olarak bilinir.', df: 1 },
    // TYT Sosyal ek sorular
    { sid: 'tyt-sosyal', tid: 'tyt-sosyal-4', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 1, qt: 'Kurtuluş Savaşı\'nda Doğu Cephesi\'ni kapatan antlaşma hangisidir?', a: 'Moskova', b: 'Gümrü', c: 'Kars', d: 'Ankara', e: 'Mudanya', ca: 'B', st: 'Gümrü Antlaşması (3 Aralık 1920) ile Doğu Cephesi kapanmıştır.', df: 2 },
    { sid: 'tyt-sosyal', tid: 'tyt-sosyal-5', yr: 2023, et: 'TYT', en: 'YKS 2023', qn: 2, qt: 'Türkiye\'de çok partili hayata geçiş hangi yılda gerçekleşmiştir?', a: '1923', b: '1938', c: '1946', d: '1950', e: '1960', ca: 'C', st: '1946\'da çok partili sisteme geçilmiş, CHP karşısında DP kurulmuştur.', df: 2 },
    { sid: 'tyt-sosyal', tid: 'tyt-sosyal-7', yr: 2024, et: 'TYT', en: 'YKS 2024', qn: 3, qt: 'Ekvator\'dan kutuplara doğru gidildikçe aşağıdakilerden hangisi azalır?', a: 'Sıcaklık', b: 'Yerçekimi', c: 'Basınç', d: 'Rüzgar', e: 'Yağış', ca: 'A', st: 'Ekvatordan kutuplara gidildikçe güneş ışınlarının geliş açısı küçülür, sıcaklık azalır.', df: 1 },
    // AYT Matematik ek sorular
    { sid: 'ayt-mat', tid: 'ayt-mat-0', yr: 2023, et: 'AYT', en: 'YKS 2023', qn: 4, qt: 'f(x) = 2x-1, g(x) = x²+1 ise (fog)(2) kaçtır?', a: '7', b: '9', c: '10', d: '11', e: '13', ca: 'B', st: 'g(2)=4+1=5, f(g(2))=f(5)=2(5)-1=9', df: 2 },
    { sid: 'ayt-mat', tid: 'ayt-mat-1', yr: 2022, et: 'AYT', en: 'YKS 2022', qn: 5, qt: 'P(x) = x³-6x²+11x-6 polinomunun kökleri toplamı kaçtır?', a: '3', b: '6', c: '11', d: '-6', e: '1', ca: 'B', st: 'Vieta: köklerin toplamı = -(-6)/1 = 6', df: 2 },
    { sid: 'ayt-mat', tid: 'ayt-mat-4', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 6, qt: 'sin30° + cos60° + tan45° ifadesinin değeri kaçtır?', a: '1', b: '1.5', c: '2', d: '2.5', e: '3', ca: 'C', st: 'sin30°=1/2, cos60°=1/2, tan45°=1. Toplam=1/2+1/2+1=2', df: 1 },
    { sid: 'ayt-mat', tid: 'ayt-mat-5', yr: 2023, et: 'AYT', en: 'YKS 2023', qn: 7, qt: 'log₂8 + log₃27 kaçtır?', a: '4', b: '5', c: '6', d: '7', e: '8', ca: 'C', st: 'log₂8=log₂(2³)=3, log₃27=log₃(3³)=3. Toplam=6', df: 1 },
    { sid: 'ayt-mat', tid: 'ayt-mat-6', yr: 2022, et: 'AYT', en: 'YKS 2022', qn: 8, qt: 'aₙ = 3n-1 ile tanımlanan dizinin ilk 10 teriminin toplamı kaçtır?', a: '155', b: '160', c: '165', d: '170', e: '175', ca: 'A', st: 'a₁=2, a₁₀=29. S=10(2+29)/2=155', df: 2 },
    { sid: 'ayt-mat', tid: 'ayt-mat-10', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 9, qt: 'z = 3+4i karmaşık sayısının modülü kaçtır?', a: '3', b: '4', c: '5', d: '7', e: '25', ca: 'C', st: '|z|=√(3²+4²)=√(9+16)=√25=5', df: 1 },
    // AYT Fizik
    { sid: 'ayt-fizik', tid: 'ayt-fizik-0', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 1, qt: '3i+4j vektörünün büyüklüğü kaçtır?', a: '3', b: '4', c: '5', d: '7', e: '25', ca: 'C', st: '|v|=√(3²+4²)=√25=5', df: 1 },
    { sid: 'ayt-fizik', tid: 'ayt-fizik-6', yr: 2023, et: 'AYT', en: 'YKS 2023', qn: 2, qt: 'İki nokta yük arasındaki uzaklık 2 katına çıkarılırsa elektrik kuvveti nasıl değişir?', a: '2 katına çıkar', b: 'Yarıya düşer', c: '4 katına çıkar', d: '1/4\'üne düşer', e: 'Değişmez', ca: 'D', st: 'F=kq₁q₂/r². r→2r: F\'=kq₁q₂/(2r)²=F/4', df: 2 },
    // AYT Kimya
    { sid: 'ayt-kimya', tid: 'ayt-kimya-0', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 1, qt: '36 gram su kaç moldür? (H=1, O=16)', a: '1', b: '2', c: '3', d: '4', e: '0.5', ca: 'B', st: 'M(H₂O)=2(1)+16=18 g/mol. n=m/M=36/18=2 mol', df: 1 },
    { sid: 'ayt-kimya', tid: 'ayt-kimya-2', yr: 2023, et: 'AYT', en: 'YKS 2023', qn: 2, qt: 'İdeal gaz denklemine göre 1 mol gazın 0°C ve 1 atm\'de hacmi yaklaşık kaç litredir?', a: '11.2', b: '22.4', c: '33.6', d: '44.8', e: '100', ca: 'B', st: 'STP\'de 1 mol ideal gaz 22.4 L hacim kaplar (PV=nRT)', df: 1 },
    // AYT Biyoloji
    { sid: 'ayt-biyoloji', tid: 'ayt-biyoloji-0', yr: 2024, et: 'AYT', en: 'YKS 2024', qn: 1, qt: 'DNA\'nın kendini eşlemesine ne ad verilir?', a: 'Translasyon', b: 'Transkripsiyon', c: 'Replikasyon', d: 'Mutasyon', e: 'Rekombinasyon', ca: 'C', st: 'DNA\'nın kendini eşlemesi replikasyon (DNA eşlenmesi) olarak adlandırılır.', df: 1 },
    { sid: 'ayt-biyoloji', tid: 'ayt-biyoloji-1', yr: 2023, et: 'AYT', en: 'YKS 2023', qn: 2, qt: 'Mitoz bölünme sonucunda kaç hücre oluşur?', a: '1', b: '2', c: '3', d: '4', e: '8', ca: 'B', st: 'Mitoz bölünmede 1 hücreden genetik olarak özdeş 2 hücre oluşur.', df: 1 },
  ];

  const insertQ = db.prepare('INSERT OR IGNORE INTO questions (id, subject_id, topic_id, exam_year, exam_type, exam_name, question_number, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, solution_text, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const q of sampleQuestions) {
    insertQ.run(toId('q', `${q.sid}-${q.yr}-${q.qn}`), q.sid, q.tid, q.yr, q.et, q.en, q.qn, q.qt, q.a, q.b, q.c, q.d, q.e, q.ca, q.st, q.df);
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
    insertF.run(toId('formula', `${f.sid}-${f.t}`), f.sid, f.t, f.c);
  }

  // ===== HAZIR FLASHCARD DESTELERI =====
  const systemUserId = 'system-user';
  try {
    db.exec(`INSERT OR IGNORE INTO users (id, username, email, password, display_name, xp, level, streak_days) VALUES ('${systemUserId}', 'Dersmatik', 'system@dersmatik.com', 'nologin', 'Dersmatik', 0, 1, 0)`);
  } catch(e) { /* user may already exist */ }

  const flashcardDecks = [
    {
      id: 'deck-tyt-mat', name: 'TYT Matematik Temel', description: 'Temel matematik kavramları', subjectId: 'tyt-mat',
      cards: [
        { front: 'EBOB nedir?', back: 'En Büyük Ortak Bölen. İki veya daha fazla sayıyı bölen en büyük sayıdır.' },
        { front: 'EKOK nedir?', back: 'En Küçük Ortak Kat. İki veya daha fazla sayının ortak katlarının en küçüğüdür.' },
        { front: 'EBOB × EKOK = ?', back: 'EBOB(a,b) × EKOK(a,b) = a × b' },
        { front: 'Mutlak değer ne demek?', back: '|x| = x (x≥0), |x| = -x (x<0). Sayının sıfıra olan uzaklığıdır.' },
        { front: 'n! (faktöriyel) nedir?', back: 'n! = n × (n-1) × (n-2) × ... × 2 × 1. Örnek: 5! = 120' },
        { front: 'C(n,r) kombinasyon formülü?', back: 'C(n,r) = n! / (r! × (n-r)!)' },
        { front: 'Olasılık formülü?', back: 'P(A) = İstenen durum sayısı / Toplam durum sayısı' },
        { front: 'Aritmetik ortalama?', back: 'Toplam / Eleman sayısı' },
      ]
    },
    {
      id: 'deck-tyt-turkce', name: 'TYT Türkçe Temel', description: 'Sözcük türleri ve anlam', subjectId: 'tyt-turkce',
      cards: [
        { front: 'Teşbih (Benzetme) nedir?', back: 'Aralarında benzerlik ilişkisi olan iki kavramdan zayıf olanın güçlü olana benzetilmesidir. "Gibi, kadar" edatlarıyla yapılır.' },
        { front: 'Mecaz anlam nedir?', back: 'Sözcüğün gerçek anlamından uzaklaşarak kazandığı yeni anlamdır. "Kalbi kırılmak" gibi.' },
        { front: 'İsim (Ad) nedir?', back: 'Varlıkları, kavramları karşılayan sözcüklerdir. Özel ve cins isim olarak ikiye ayrılır.' },
        { front: 'Sıfat nedir?', back: 'İsimlerin önüne gelerek onları niteleyen veya belirten sözcüklerdir.' },
        { front: 'Zarf nedir?', back: 'Fiillerin, sıfatların veya başka zarfların anlamını belirleyen sözcüklerdir.' },
        { front: 'Anlatım bozukluğu türleri?', back: '1. Gereksiz sözcük kullanımı\n2. Anlam belirsizliği\n3. Çelişki\n4. Mantık hatası\n5. Tamlama yanlışlığı' },
      ]
    },
    {
      id: 'deck-tyt-fen', name: 'TYT Fen Bilimleri', description: 'Fizik, kimya, biyoloji temel', subjectId: 'tyt-fen',
      cards: [
        { front: 'Newton\'un 2. Yasası?', back: 'F = m × a (Kuvvet = Kütle × İvme)' },
        { front: 'Kinetik enerji formülü?', back: 'Ek = ½mv²' },
        { front: 'Potansiyel enerji formülü?', back: 'Ep = mgh' },
        { front: 'Ohm Yasası?', back: 'V = I × R (Gerilim = Akım × Direnç)' },
        { front: 'pH < 7 ne demek?', back: 'Çözelti asidiktir.' },
        { front: 'Hücrenin enerji santrali?', back: 'Mitokondri - Hücresel solunum yaparak ATP üretir.' },
        { front: 'DNA\'nın yapı taşı?', back: 'Nükleotit (fosfat + şeker + baz)' },
        { front: 'Atom numarası ne gösterir?', back: 'Çekirdekteki proton sayısını gösterir. Elementin kimliğidir.' },
      ]
    },
    {
      id: 'deck-ayt-mat', name: 'AYT Matematik', description: 'Türev, integral, limit', subjectId: 'ayt-mat',
      cards: [
        { front: 'Türev tanımı?', back: 'f\'(x) = lim(h→0) [f(x+h) - f(x)] / h' },
        { front: 'xⁿ\'nin türevi?', back: 'f(x) = xⁿ → f\'(x) = n·xⁿ⁻¹' },
        { front: '∫xⁿ dx = ?', back: 'xⁿ⁺¹/(n+1) + C (n ≠ -1)' },
        { front: 'sin²x + cos²x = ?', back: '1 (Temel trigonometrik özdeşlik)' },
        { front: 'log_a(b×c) = ?', back: 'log_a(b) + log_a(c)' },
        { front: 'Karmaşık sayı modülü?', back: '|z| = √(a² + b²) (z = a + bi için)' },
        { front: 'Limit kuralı: 0/0 durumu?', back: 'L\'Hôpital kuralı uygulanır: lim f/g = lim f\'/g\'' },
      ]
    },
    {
      id: 'deck-tyt-tarih', name: 'TYT Tarih', description: 'Osmanlı ve Cumhuriyet tarihi', subjectId: 'tyt-sosyal',
      cards: [
        { front: 'Osmanlı\'nın kuruluş yılı?', back: '1299 - Osman Bey tarafından kuruldu.' },
        { front: 'İstanbul\'un fethi?', back: '1453 - Fatih Sultan Mehmet. Orta Çağ sona erdi.' },
        { front: 'Tanzimat Fermanı?', back: '1839 - Padişah Abdülmecit. Hukuk üstünlüğü, can-mal güvenliği.' },
        { front: 'Cumhuriyetin ilanı?', back: '29 Ekim 1923 - Mustafa Kemal Atatürk ilk cumhurbaşkanı.' },
        { front: 'Kurtuluş Savaşı başlangıcı?', back: '19 Mayıs 1919 - Atatürk\'ün Samsun\'a çıkışı.' },
        { front: 'Gümrü Antlaşması?', back: '3 Aralık 1920 - Doğu Cephesi kapandı. Ermenistan ile imzalandı.' },
      ]
    },
  ];

  const insertDeck = db.prepare('INSERT OR IGNORE INTO flashcard_decks (id, user_id, title, description, subject_id, is_public) VALUES (?, ?, ?, ?, ?, 1)');
  const insertCard = db.prepare('INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, difficulty, next_review, interval_days, ease_factor) VALUES (?, ?, ?, ?, 0, datetime(\'now\'), 1, 2.5)');

  for (const deck of flashcardDecks) {
    insertDeck.run(deck.id, systemUserId, deck.name, deck.description, deck.subjectId);
    deck.cards.forEach((card, i) => {
      insertCard.run(`${deck.id}-card-${i}`, deck.id, card.front, card.back);
    });
  }

  // ===== EK FORMÜLLER =====
  const extraFormulas = [
    { sid: 'tyt-fen', t: 'Ohm Yasası', c: 'V = I × R (Gerilim = Akım × Direnç)' },
    { sid: 'tyt-fen', t: 'Dalga Hızı', c: 'v = f × λ (hız = frekans × dalga boyu)' },
    { sid: 'tyt-fen', t: 'Yoğunluk', c: 'd = m / V (yoğunluk = kütle / hacim)' },
    { sid: 'tyt-fen', t: 'Isı Formülü', c: 'Q = m × c × ΔT (ısı = kütle × özısı × sıcaklık farkı)' },
    { sid: 'ayt-fizik', t: 'Elektrik Alan', c: 'E = k × |q| / r²' },
    { sid: 'ayt-fizik', t: 'Manyetik Kuvvet', c: 'F = q × v × B × sinθ' },
    { sid: 'ayt-fizik', t: 'Basit Harmonik Hareket', c: 'T = 2π√(m/k) (yay), T = 2π√(L/g) (sarkaç)' },
    { sid: 'ayt-kimya', t: 'İdeal Gaz Denklemi', c: 'PV = nRT (R = 0.082 L.atm/mol.K)' },
    { sid: 'ayt-kimya', t: 'Denge Sabiti', c: 'Kc = [Ürünler] / [Girenler] (denge derişimleri)' },
    { sid: 'ayt-kimya', t: 'pH Hesabı', c: 'pH = -log[H⁺], pOH = -log[OH⁻], pH + pOH = 14' },
    { sid: 'tyt-mat', t: 'İkinci Derece Denklem', c: 'ax²+bx+c=0 → x = (-b ± √(b²-4ac)) / 2a' },
    { sid: 'tyt-mat', t: 'Üçgen Eşitsizliği', c: '|a-b| < c < a+b (kenar uzunlukları)' },
    { sid: 'tyt-mat', t: 'Dikdörtgen Alan/Çevre', c: 'Alan = a × b, Çevre = 2(a+b)' },
    { sid: 'ayt-mat', t: 'Limit Kuralı', c: 'lim(x→a) f(x)/g(x) = f\'(a)/g\'(a) (L\'Hôpital, 0/0 veya ∞/∞ durumunda)' },
    { sid: 'ayt-mat', t: 'Çarpanlara Ayırma', c: 'a²-b² = (a-b)(a+b)\na³+b³ = (a+b)(a²-ab+b²)' },
  ];

  for (const f of extraFormulas) {
    insertF.run(toId('formula', `${f.sid}-${f.t}`), f.sid, f.t, f.c);
  }

  console.log(`Seed data yuklendi! ${subjects.length} ders, ${Object.values(topicsData).flat().length} konu, ${badges.length} rozet, ${sampleQuestions.length} soru, ${formulas.length + extraFormulas.length} formul, ${flashcardDecks.length} hazir deste`);

  // YKS arşiv sınavlarını yükle
  const seedExamQuestions = require('./parseExams');
  const examCount = seedExamQuestions(db);
  if (examCount > 0) {
    console.log(`YKS arsiv sinav verileri yuklendi! ${examCount} soru eklendi`);
  }
}

module.exports = seed;
