import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BarChart3, TrendingDown, Clock, Brain, FileText, Smile, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

interface SubjectStat { id: string; name: string; exam_type: string; color: string; total_questions: number; correct: number; wrong: number; }
interface WeakTopic { id: string; name: string; subject_name: string; total: number; correct: number; success_rate: number; }
interface DailyData { date: string; study_minutes: number; questions: number; xp: number; }
interface HourData { hour: number; questions_solved: number; correct: number; }
interface MoodData { mood: string; energy_level: number; motivation_level: number; checkin_date: string; study_minutes: number; questions_solved: number; }
interface WeeklyReport { studyMinutes: number; totalQuestions: number; correctQuestions: number; accuracy: number; pomodoros: number; xpGained: number; prevWeekMinutes: number; changePercent: number; dailyBreakdown: { date: string; minutes: number; questions: number }[]; streak: number; level: number; }
interface ErrorEntry { id: string; question_text: string; correct_answer: string; subject_name: string; topic_name: string; notes: string; created_at: string; }

type Tab = 'overview' | 'mood' | 'weekly' | 'errors';

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [hours, setHours] = useState<HourData[]>([]);
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  useEffect(() => {
    api.get<SubjectStat[]>('/stats/by-subject').then(setSubjectStats).catch(() => {});
    api.get<WeakTopic[]>('/stats/weak-topics').then(setWeakTopics).catch(() => {});
    api.get<DailyData[]>('/stats/daily?days=30').then(setDaily).catch(() => {});
    api.get<HourData[]>('/stats/productive-hours').then(setHours).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'mood') api.get<MoodData[]>('/stats/mood-performance').then(setMoodData).catch(() => {});
    if (tab === 'weekly') api.get<WeeklyReport>('/gamification/weekly-report').then(setWeeklyReport).catch(() => {});
    if (tab === 'errors') api.get<ErrorEntry[]>('/stats/errors').then(setErrors).catch(() => {});
  }, [tab]);

  const moodEmojis: Record<string, string> = { great: '😄', good: '🙂', normal: '😐', low: '😕', bad: '😞' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analiz & İstatistikler</h1>

      <div className="flex gap-2 flex-wrap">
        {([['overview', 'Genel', BarChart3], ['mood', 'Mood', Smile], ['weekly', 'Haftalık', FileText], ['errors', 'Hata Defteri', AlertCircle]] as [Tab, string, any][]).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Daily Chart */}
          {daily.length > 0 && (
            <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 text-sm text-dark-300 mb-4"><BarChart3 size={16} /> Son 30 Gün - Günlük Çalışma</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                  <Bar dataKey="questions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Soru" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Stats */}
          {subjectStats.filter(s => s.total_questions > 0).length > 0 && (
            <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
              <h2 className="text-sm text-dark-300 mb-4">Ders Bazlı Performans</h2>
              <div className="space-y-3">
                {subjectStats.filter(s => s.total_questions > 0).map(s => {
                  const rate = s.total_questions > 0 ? (s.correct / s.total_questions * 100) : 0;
                  return (
                    <div key={s.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{s.name}</span>
                        <span className="text-dark-400 shrink-0 ml-2">{s.correct}/{s.total_questions} (%{rate.toFixed(0)})</span>
                      </div>
                      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: s.color || '#6366f1' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 text-sm text-dark-300 mb-4"><TrendingDown size={16} /> Zayıf Konular</div>
              <div className="space-y-2">
                {weakTopics.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.name}</div>
                      <div className="text-xs text-dark-400">{t.subject_name} - {t.correct}/{t.total} doğru</div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ml-2 ${t.success_rate < 40 ? 'text-red-400' : t.success_rate < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                      %{t.success_rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productive Hours */}
          {hours.length > 0 && (
            <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 text-sm text-dark-300 mb-4"><Clock size={16} /> Verimli Saatlerin</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={hours}>
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={h => `${h}:00`} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                  <Bar dataKey="questions_solved" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Soru" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {daily.length === 0 && subjectStats.filter(s => s.total_questions > 0).length === 0 && (
            <p className="text-center text-dark-400 py-12">Henüz yeterli veri yok. Soru çözerek istatistiklerini oluştur!</p>
          )}
        </>
      )}

      {/* Mood & Performance */}
      {tab === 'mood' && (
        <div className="space-y-4">
          {moodData.length > 0 ? (
            <>
              <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                <h3 className="text-sm text-dark-300 mb-4">Ruh Hali & Çalışma Korelasyonu</h3>
                <div className="space-y-2">
                  {moodData.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl">
                      <span className="text-2xl shrink-0">{moodEmojis[d.mood] || '😐'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-dark-400">{d.checkin_date}</div>
                        <div className="flex gap-4 text-sm mt-1">
                          <span>⚡ {d.energy_level}/5</span>
                          <span>🔥 {d.motivation_level}/5</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">{d.study_minutes} dk</div>
                        <div className="text-xs text-dark-400">{d.questions_solved} soru</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                <h3 className="text-sm text-dark-300 mb-4">Enerji ve Çalışma Süresi</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="checkin_date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                    <Line type="monotone" dataKey="energy_level" stroke="#f59e0b" strokeWidth={2} name="Enerji" />
                    <Line type="monotone" dataKey="motivation_level" stroke="#6366f1" strokeWidth={2} name="Motivasyon" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="text-center text-dark-400 py-12">Henüz check-in verisi yok. Planlama sayfasından günlük check-in yapın!</p>
          )}
        </div>
      )}

      {/* Weekly Report */}
      {tab === 'weekly' && (
        <div className="space-y-4">
          {weeklyReport ? (
            <>
              <div className="bg-gradient-to-br from-primary-600/20 to-purple-600/20 rounded-2xl p-6 border border-primary-500/30">
                <h3 className="text-lg font-semibold mb-4">Bu Hafta Özet</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-dark-800/50 rounded-xl"><div className="text-2xl font-bold text-primary-400">{Math.round(weeklyReport.studyMinutes / 60)}s {weeklyReport.studyMinutes % 60}dk</div><div className="text-xs text-dark-400">Çalışma</div></div>
                  <div className="text-center p-3 bg-dark-800/50 rounded-xl"><div className="text-2xl font-bold text-blue-400">{weeklyReport.totalQuestions}</div><div className="text-xs text-dark-400">Soru</div></div>
                  <div className="text-center p-3 bg-dark-800/50 rounded-xl"><div className="text-2xl font-bold text-green-400">%{weeklyReport.accuracy}</div><div className="text-xs text-dark-400">Doğruluk</div></div>
                  <div className="text-center p-3 bg-dark-800/50 rounded-xl"><div className="text-2xl font-bold text-yellow-400">{weeklyReport.xpGained}</div><div className="text-xs text-dark-400">XP</div></div>
                </div>
                {weeklyReport.changePercent !== 0 && (
                  <div className={`mt-4 flex items-center gap-2 text-sm ${weeklyReport.changePercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp size={16} />
                    Geçen haftaya göre {weeklyReport.changePercent > 0 ? '+' : ''}{weeklyReport.changePercent}% {weeklyReport.changePercent > 0 ? 'artış' : 'azalış'}
                  </div>
                )}
              </div>

              {weeklyReport.dailyBreakdown.length > 0 && (
                <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                  <h3 className="text-sm text-dark-300 mb-4">Günlük Dağılım</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyReport.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => { const day = new Date(d).toLocaleDateString('tr-TR', { weekday: 'short' }); return day; }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
                      <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} name="Dakika" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-dark-700/50 rounded-xl"><div className="text-xs text-dark-400">Pomodoro</div><div className="text-lg font-bold">{weeklyReport.pomodoros}</div></div>
                  <div className="p-3 bg-dark-700/50 rounded-xl"><div className="text-xs text-dark-400">Seri</div><div className="text-lg font-bold text-orange-400">{weeklyReport.streak} gün</div></div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-dark-400 py-12">Haftalık rapor yükleniyor...</p>
          )}
        </div>
      )}

      {/* Error Journal */}
      {tab === 'errors' && (
        <div className="space-y-3">
          <h3 className="text-sm text-dark-400">Hata Defteri - Yanlış Yapılan Sorular</h3>
          {errors.length > 0 ? errors.map(e => (
            <div key={e.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary-400">{e.subject_name} {e.topic_name && `> ${e.topic_name}`}</span>
                <span className="text-xs text-dark-400">{e.created_at?.split('T')[0]}</span>
              </div>
              {e.question_text && <p className="text-sm mb-2">{e.question_text}</p>}
              <div className="text-xs text-green-400">Doğru cevap: {e.correct_answer}</div>
              {e.notes && <p className="text-xs text-dark-400 mt-1 italic">{e.notes}</p>}
            </div>
          )) : (
            <p className="text-center text-dark-400 py-12">Henüz hata kaydı yok. Yanlış yaptığınız sorular otomatik olarak burada görünecek.</p>
          )}
        </div>
      )}
    </div>
  );
}
