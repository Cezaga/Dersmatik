import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Flame, BookOpen, Clock, Target, TrendingUp, Trophy, Calendar, Zap, ChevronRight, Star, Plus, X, Save } from 'lucide-react';

interface Stats {
  totalQuestions: number;
  correctAnswers: number;
  correctRate: number;
  totalStudyMinutes: number;
  streakDays: number;
  todayQuestions: number;
  todayStudyMinutes: number;
}

interface Countdown {
  daysLeft: number;
  hoursLeft: number;
}

const MOTIVATIONAL_QUOTES = [
  "Bugün attığın her adım, yarının başarısını inşa ediyor.",
  "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
  "Hedefine ulaşmanın tek yolu, ona doğru yürümeye başlamaktır.",
  "Disiplin, motivasyonun bittiği yerde devreye girer.",
  "Zorluklar seni güçlendirmek için vardır, durdurmak için değil.",
  "Bir saat çalışma, bir saat pişmanlıktan daha değerlidir.",
  "Hayallerinin büyüklüğü, çabanın büyüklüğünü belirler.",
  "Başarı bir gün değil, her gün yapılan işlerin sonucudur.",
  "Dünyanın en iyi yatırımı, kendine yaptığın yatırımdır.",
  "Her usta bir zamanlar çıraktı.",
  "Başlamak için mükemmel zamanı bekleme, başla ve mükemmelleştir.",
  "Bugün yapman gereken tek şey, dünden daha iyi olmak.",
  "Çalışmak yorar, ama pişmanlık daha çok yorar.",
  "Hedefin ne kadar uzak olursa olsun, yolculuk tek bir adımla başlar.",
  "Sınavda seni diğerlerinden ayıracak olan, bugün harcadığın emektir.",
  "Zor zamanlarda pes etmeyenler, kolay zamanlarda zafer kazanır.",
  "Her soru çözdüğünde, hayallerine bir adım daha yaklaşıyorsun.",
  "Konsantrasyonun en güçlü silahındır. Onu iyi kullan.",
  "Bugün canın istemese de çalış, yarın teşekkür edeceksin.",
  "Başarının sırrı: Tekrar, tekrar ve tekrar.",
  "Yavaş ilerlemek, yerinde saymaktan iyidir.",
  "Rakiplerin çalışırken sen dinlenme.",
  "Potansiyelini keşfetmenin tek yolu sınırlarını zorlamaktır.",
  "Her yanlış cevap, doğruya giden yolda bir derstir.",
  "Zamanını yönet, yoksa zaman seni yönetir.",
  "Motivasyon seni başlatır, alışkanlık seni devam ettirir.",
  "Bugün ektiğin tohumlar, yarın meyve verecek.",
  "Başarılı insanlar, başkalarının yapmak istemediğini yapar.",
  "Odaklan. Dikkat dağıtan her şey hedefinden uzaklaştırır.",
  "Küçük adımlar büyük mesafeleri kat eder.",
  "Pes etmek, denemekten daha acı verir.",
  "Çalışırken zorlanıyorsan, doğru yoldasın demektir.",
  "Sınavda çıkacak soru, bugün çözmediğin soru olabilir.",
  "Kendine inan. Sen düşündüğünden daha güçlüsün.",
  "Her gün %1 gelişim, yıl sonunda %365 fark yaratır.",
  "Başarısızlık yok, sadece öğrenme fırsatları var.",
  "Zafer, 'bir daha deneyeyim' diyenindir.",
  "Bugünün fedakarlığı, yarının özgürlüğüdür.",
  "Hedefsiz çalışmak, pusulasız yolculuk gibidir.",
  "Sen bu sınavı kazanmak için yaratıldın.",
  "Konfor alanından çık, büyüme orada başlar.",
  "Bir konuyu anlamak için 100 soru çöz, ustalaşmak için 1000.",
  "Sabır ve azim, her kapıyı açar.",
  "Başarı merdiveninde asansör yoktur.",
  "Bugün çalışmaya başla, gelecekte kendine teşekkür et.",
  "Yorulduğunda dur, ama asla pes etme.",
  "Sınav bir maraton, sprint değil. Temponu koru.",
  "Güçlü olan kazanmaz, kazanan güçlü olur.",
  "Zaman en adil kaynaktır: Herkese eşit verilir.",
  "Her gün bir konu, bir ayda otuz konu demektir.",
  "Korku seni durdurmasın. Korkarak da olsa ilerle.",
  "Doğru plan + disiplinli çalışma = Başarı.",
  "Dahi ile sıradan insan arasındaki fark, çalışmadır.",
  "Hayatta en büyük risk, hiç risk almamaktır.",
  "Çalışmak istemediğin anlarda çalışmak, seni zirveye taşır.",
  "Yapamam deme, henüz yapamıyorum de.",
  "Senin için zor olan, herkes için zordur. Fark yaratan sensin.",
  "Bugünün dersi, yarının kolay sorusu.",
  "Kazananlar farklı şeyler yapmaz, aynı şeyleri farklı yapar.",
  "Hedefine ulaşana kadar her gün bir tuğla koy.",
  "Sınavda başarı, sınav günü değil, hazırlık sürecinde kazanılır.",
  "Tekrar etmek ustalığın anasıdır.",
  "Karanlık geceyi geçiren, aydınlık sabahı görür.",
  "Çalışma masana her oturduğunda, geleceğini şekillendiriyorsun.",
  "Unutma: YKS sadece bir sınav, ama hazırlık bir yaşam becerisi.",
  "Zayıf konularını güçlü yanına çevir.",
  "Soru çözmekten korkma, yanlış yapmaktan da.",
  "En iyi motivasyon kaynağın: İlerleme kaydettiğini görmek.",
  "Bir gün değil, birinci gün olsun.",
  "Başkalarının fikirlerine değil, kendi hedeflerine odaklan.",
  "Her sınav bir fırsat, her yanlış bir ders.",
  "Azmin, zekanın önündedir.",
  "Çalışmak için sebep arama, çalışmamak için bahane.",
  "Sınava hazırlık bir yolculuktur. Yolun tadını çıkar.",
  "Strese değil, stratejiye odaklan.",
  "Bugün lazım olmayan bilgi, sınavda karşına çıkabilir.",
  "Planla, uygula, tekrar et. Başarının formülü bu.",
  "Hayallerin seni her sabah erkenden kaldırsın.",
  "Başarıya giden yolda yalnız değilsin. Arkadaşlarınla birlikte çalış.",
  "Son gülen iyi güler. Pes etme, sonuna kadar devam et."
];

function getDailyQuote(): string {
  const start = new Date('2025-01-01').getTime();
  const now = new Date().getTime();
  const dayIndex = Math.floor((now - start) / (1000 * 60 * 60 * 24)) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[dayIndex];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [showStudyLog, setShowStudyLog] = useState(false);
  const [studyLog, setStudyLog] = useState({ durationMinutes: 0, questionsSolved: 0, subjectId: '' });
  const [subjects, setSubjects] = useState<{ id: string; name: string; exam_type: string }[]>([]);
  const [logSaved, setLogSaved] = useState('');

  useEffect(() => {
    api.get<Stats>('/stats/overview').then(setStats).catch(() => {});
    api.get<Countdown>('/gamification/yks-countdown').then(setCountdown).catch(() => {});
    api.get<{ id: string; name: string; exam_type: string }[]>('/questions/subjects').then(setSubjects).catch(() => {});
  }, []);

  const xpForNext = (user?.level || 1) * 100;
  const xpProgress = ((user?.xp || 0) / xpForNext) * 100;

  const saveStudyLog = async () => {
    if (studyLog.durationMinutes <= 0 && studyLog.questionsSolved <= 0) return;
    try {
      const res = await api.post<{ xpGained: number }>('/gamification/study-log', studyLog);
      setLogSaved(`Kaydedildi! +${res.xpGained} XP`);
      setShowStudyLog(false);
      setStudyLog({ durationMinutes: 0, questionsSolved: 0, subjectId: '' });
      api.get<Stats>('/stats/overview').then(setStats).catch(() => {});
      setTimeout(() => setLogSaved(''), 3000);
    } catch {
      setLogSaved('Hata oluştu!');
      setTimeout(() => setLogSaved(''), 3000);
    }
  };

  const quickLinks = [
    { to: '/pomodoro', icon: Clock, label: 'Pomodoro', desc: 'Odaklan', color: 'from-red-500 to-orange-500' },
    { to: '/questions', icon: BookOpen, label: 'Soru Çöz', desc: 'YKS soruları', color: 'from-blue-500 to-cyan-500' },
    { to: '/trials', icon: Target, label: 'Deneme', desc: 'Sonuç gir', color: 'from-green-500 to-emerald-500' },
    { to: '/flashcards', icon: Star, label: 'Flashcard', desc: 'Kartlar', color: 'from-purple-500 to-pink-500' },
    { to: '/social', icon: Trophy, label: 'Sosyal', desc: 'Arkadaşlar', color: 'from-yellow-500 to-orange-500' },
    { to: '/planner', icon: Calendar, label: 'Planlama', desc: 'Hedefler', color: 'from-indigo-500 to-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-3">
          <h1 className="text-2xl font-bold truncate">Merhaba, {user?.display_name}!</h1>
          <p className="text-dark-400 text-sm mt-1 line-clamp-2 italic">"{getDailyQuote()}"</p>
        </div>
        <Link to="/profile" className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-lg font-bold shrink-0">
          {user?.display_name?.charAt(0).toUpperCase()}
        </Link>
      </div>

      {/* YKS Countdown + Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {countdown && countdown.daysLeft > 0 && (
          <div className="bg-gradient-to-br from-primary-600/20 to-purple-600/20 rounded-2xl p-5 border border-primary-500/30">
            <div className="flex items-center gap-2 text-primary-300 text-sm mb-2">
              <Calendar size={16} /> YKS'ye Kalan
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{countdown.daysLeft}</span>
              <span className="text-dark-300">gün</span>
            </div>
          </div>
        )}

        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              <span className="text-sm text-dark-300">Seviye {user?.level}</span>
            </div>
            <span className="text-xs text-dark-400">{user?.xp}/{xpForNext} XP</span>
          </div>
          <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={16} />
              <span className="text-sm font-semibold">{user?.streak_days || 0} gün seri</span>
            </div>
            <div className="text-xs text-dark-400">Toplam {user?.total_xp || 0} XP</div>
          </div>
        </div>
      </div>

      {/* Log Saved Toast */}
      {logSaved && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium text-center animate-slide-up">
          {logSaved}
        </div>
      )}

      {/* Today Stats + Manual Entry */}
      {stats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Bugün</h2>
            <button onClick={() => setShowStudyLog(!showStudyLog)} className="flex items-center gap-1 px-3 py-1.5 bg-primary-600/20 text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-600/30 transition">
              <Plus size={14} /> Çalışma Ekle
            </button>
          </div>

          {/* Manual Study Log Form */}
          {showStudyLog && (
            <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700 mb-4 animate-slide-up space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Manuel Çalışma Kaydı</h3>
                <button onClick={() => setShowStudyLog(false)}><X size={16} className="text-dark-400" /></button>
              </div>
              <select value={studyLog.subjectId} onChange={e => setStudyLog(p => ({ ...p, subjectId: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm">
                <option value="">Ders Seçin (opsiyonel)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.exam_type})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Süre (dakika)</label>
                  <input type="number" min={0} value={studyLog.durationMinutes || ''} placeholder="0"
                    onChange={e => setStudyLog(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Çözülen Soru</label>
                  <input type="number" min={0} value={studyLog.questionsSolved || ''} placeholder="0"
                    onChange={e => setStudyLog(p => ({ ...p, questionsSolved: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm" />
                </div>
              </div>
              <button onClick={saveStudyLog} className="w-full py-2.5 bg-primary-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                <Save size={14} /> Kaydet
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<BookOpen size={20} />} label="Bugün Soru" value={stats.todayQuestions} color="text-blue-400" />
            <StatCard icon={<Clock size={20} />} label="Bugün Süre" value={`${stats.todayStudyMinutes} dk`} color="text-green-400" />
            <StatCard icon={<Target size={20} />} label="Toplam Soru" value={stats.totalQuestions} color="text-purple-400" />
            <StatCard icon={<TrendingUp size={20} />} label="Başarı" value={`%${stats.correctRate}`} color="text-yellow-400" />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to} className="bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-dark-500 transition group overflow-hidden">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="font-medium text-sm truncate">{label}</div>
              <div className="text-xs text-dark-400 mt-1 flex items-center gap-1 truncate">{desc} <ChevronRight size={12} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 overflow-hidden">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-xl font-bold truncate">{value}</div>
      <div className="text-xs text-dark-400 mt-1 truncate">{label}</div>
    </div>
  );
}
