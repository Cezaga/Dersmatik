import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Award, LogOut, Save, Zap } from 'lucide-react';

interface Badge { id: string; name: string; description: string; icon: string; category: string; earned: boolean; earnedAt: string | null; }

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ displayName: '', bio: '', targetRank: '', targetDepartment: '', dailyGoalMinutes: 120, dailyGoalQuestions: 50 });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.display_name,
        bio: (user as any).bio || '',
        targetRank: user.target_rank?.toString() || '',
        targetDepartment: user.target_department || '',
        dailyGoalMinutes: user.daily_goal_minutes,
        dailyGoalQuestions: user.daily_goal_questions,
      });
    }
    api.get<Badge[]>('/gamification/badges').then(setBadges).catch(() => {});
    api.post('/gamification/badges/check').catch(() => {});
  }, [user]);

  const saveProfile = async () => {
    try {
      await api.put('/users/profile', {
        displayName: form.displayName,
        bio: form.bio,
        targetRank: form.targetRank ? Number(form.targetRank) : null,
        targetDepartment: form.targetDepartment || null,
        dailyGoalMinutes: form.dailyGoalMinutes,
        dailyGoalQuestions: form.dailyGoalQuestions,
      });
      await refreshUser();
      setEditing(false);
      setMsg('Profil güncellendi!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Güncelleme sırasında hata oluştu.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const xpForNext = (user?.level || 1) * 100;
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {msg && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium text-center animate-slide-up">{msg}</div>
      )}

      {/* Profile Card */}
      <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
          {user?.display_name?.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold">{user?.display_name}</h2>
        <p className="text-dark-400 text-sm">@{user?.username}</p>

        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center"><div className="text-2xl font-bold text-primary-400">{user?.level}</div><div className="text-xs text-dark-400">Seviye</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-yellow-400">{user?.total_xp}</div><div className="text-xs text-dark-400">XP</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-orange-400">{user?.streak_days}</div><div className="text-xs text-dark-400">Seri</div></div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-dark-400 mb-1"><span>XP</span><span>{user?.xp}/{xpForNext}</span></div>
          <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" style={{ width: `${((user?.xp || 0) / xpForNext) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ayarlar</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-sm text-primary-400">Düzenle</button>
          ) : (
            <button onClick={saveProfile} className="flex items-center gap-1 text-sm text-green-400"><Save size={14} /> Kaydet</button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-dark-400">Görünen Ad</label>
            <input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} disabled={!editing}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white disabled:opacity-50 mt-1" />
          </div>
          <div>
            <label className="text-xs text-dark-400">Biyografi</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} disabled={!editing} placeholder="Kendini tanıt..."
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white disabled:opacity-50 mt-1 h-20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400">Hedef Sıralama</label>
              <input type="number" placeholder="örn: 10000" value={form.targetRank} onChange={e => setForm(p => ({ ...p, targetRank: e.target.value }))} disabled={!editing}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white disabled:opacity-50 mt-1" />
            </div>
            <div>
              <label className="text-xs text-dark-400">Hedef Bölüm</label>
              <input placeholder="örn: Tıp" value={form.targetDepartment} onChange={e => setForm(p => ({ ...p, targetDepartment: e.target.value }))} disabled={!editing}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white disabled:opacity-50 mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400">Günlük Hedef (dakika)</label>
              <input type="number" value={form.dailyGoalMinutes} onChange={e => setForm(p => ({ ...p, dailyGoalMinutes: Number(e.target.value) }))} disabled={!editing}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white disabled:opacity-50 mt-1" />
            </div>
            <div>
              <label className="text-xs text-dark-400">Günlük Hedef (soru)</label>
              <input type="number" value={form.dailyGoalQuestions} onChange={e => setForm(p => ({ ...p, dailyGoalQuestions: Number(e.target.value) }))} disabled={!editing}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white disabled:opacity-50 mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Award size={20} /> Rozetler ({earnedBadges.length}/{badges.length})</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {badges.map((b, i) => (
            <div key={`${b.id}-${i}`} className={`p-3 rounded-xl text-center transition overflow-hidden ${b.earned ? 'bg-primary-600/10 border border-primary-500/30' : 'bg-dark-700/50 opacity-40'}`}>
              <div className="text-2xl mb-1">{b.icon}</div>
              <div className="text-xs font-medium truncate">{b.name}</div>
              <div className="text-[10px] text-dark-400 mt-1 line-clamp-2">{b.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={logout} className="w-full py-3 bg-red-600/10 text-red-400 rounded-xl font-medium flex items-center justify-center gap-2 border border-red-500/20 hover:bg-red-600/20 transition">
        <LogOut size={18} /> Çıkış Yap
      </button>
    </div>
  );
}
