import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BarChart3, TrendingDown, Clock, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

interface SubjectStat { id: string; name: string; exam_type: string; color: string; total_questions: number; correct: number; wrong: number; }
interface WeakTopic { id: string; name: string; subject_name: string; total: number; correct: number; success_rate: number; }
interface DailyData { date: string; study_minutes: number; questions: number; xp: number; }
interface HourData { hour: number; questions_solved: number; correct: number; }

export default function StatsPage() {
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [hours, setHours] = useState<HourData[]>([]);

  useEffect(() => {
    api.get<SubjectStat[]>('/stats/by-subject').then(setSubjectStats).catch(() => {});
    api.get<WeakTopic[]>('/stats/weak-topics').then(setWeakTopics).catch(() => {});
    api.get<DailyData[]>('/stats/daily?days=30').then(setDaily).catch(() => {});
    api.get<HourData[]>('/stats/productive-hours').then(setHours).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analiz & Istatistikler</h1>

      {/* Daily Chart */}
      {daily.length > 0 && (
        <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
          <div className="flex items-center gap-2 text-sm text-dark-300 mb-4"><BarChart3 size={16} /> Son 30 Gun - Gunluk Calısma</div>
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
                    <span>{s.name}</span>
                    <span className="text-dark-400">{s.correct}/{s.total_questions} (%{rate.toFixed(0)})</span>
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
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-dark-400">{t.subject_name} - {t.correct}/{t.total} dogru</div>
                </div>
                <span className={`text-sm font-bold ${t.success_rate < 40 ? 'text-red-400' : t.success_rate < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
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
        <p className="text-center text-dark-400 py-12">Henuz yeterli veri yok. Soru cozerek istatistiklerini olustur!</p>
      )}
    </div>
  );
}
