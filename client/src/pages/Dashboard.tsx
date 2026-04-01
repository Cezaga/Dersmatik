import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Flame, BookOpen, Clock, Target, TrendingUp, Trophy, Calendar, Zap, ChevronRight, Star } from 'lucide-react';

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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    api.get<Stats>('/stats/overview').then(setStats).catch(() => {});
    api.get<Countdown>('/gamification/yks-countdown').then(setCountdown).catch(() => {});
  }, []);

  const xpForNext = (user?.level || 1) * 100;
  const xpProgress = ((user?.xp || 0) / xpForNext) * 100;

  const quickLinks = [
    { to: '/pomodoro', icon: Clock, label: 'Pomodoro', desc: 'Odaklan', color: 'from-red-500 to-orange-500' },
    { to: '/questions', icon: BookOpen, label: 'Soru Coz', desc: 'YKS soruları', color: 'from-blue-500 to-cyan-500' },
    { to: '/trials', icon: Target, label: 'Deneme', desc: 'Sonuc gir', color: 'from-green-500 to-emerald-500' },
    { to: '/flashcards', icon: Star, label: 'Flashcard', desc: 'Kartlar', color: 'from-purple-500 to-pink-500' },
    { to: '/social', icon: Trophy, label: 'Sosyal', desc: 'Arkadaşlar', color: 'from-yellow-500 to-orange-500' },
    { to: '/planner', icon: Calendar, label: 'Planlama', desc: 'Hedefler', color: 'from-indigo-500 to-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Merhaba, {user?.display_name}!</h1>
          <p className="text-dark-400 text-sm mt-1">Bugun harika bir gun calısmak icin.</p>
        </div>
        <Link to="/profile" className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-lg font-bold">
          {user?.display_name?.charAt(0).toUpperCase()}
        </Link>
      </div>

      {/* YKS Countdown + Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {countdown && countdown.daysLeft > 0 && (
          <div className="bg-gradient-to-br from-primary-600/20 to-purple-600/20 rounded-2xl p-5 border border-primary-500/30 animate-pulse-glow">
            <div className="flex items-center gap-2 text-primary-300 text-sm mb-2">
              <Calendar size={16} /> YKS'ye Kalan
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{countdown.daysLeft}</span>
              <span className="text-dark-300">gun</span>
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
              <span className="text-sm font-semibold">{user?.streak_days || 0} gun seri</span>
            </div>
            <div className="text-xs text-dark-400">Toplam {user?.total_xp || 0} XP</div>
          </div>
        </div>
      </div>

      {/* Today Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<BookOpen size={20} />} label="Bugun Soru" value={stats.todayQuestions} color="text-blue-400" />
          <StatCard icon={<Clock size={20} />} label="Bugun Sure" value={`${stats.todayStudyMinutes} dk`} color="text-green-400" />
          <StatCard icon={<Target size={20} />} label="Toplam Soru" value={stats.totalQuestions} color="text-purple-400" />
          <StatCard icon={<TrendingUp size={20} />} label="Basarı" value={`%${stats.correctRate}`} color="text-yellow-400" />
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Hızlı Erisim</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to} className="bg-dark-800 rounded-2xl p-4 border border-dark-700 hover:border-dark-500 transition group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-dark-400 mt-1 flex items-center gap-1">{desc} <ChevronRight size={12} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-dark-400 mt-1">{label}</div>
    </div>
  );
}
