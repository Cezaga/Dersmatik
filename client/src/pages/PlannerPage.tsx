import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, Target, CheckCircle, Circle, Smile, Zap, Battery, Trash2 } from 'lucide-react';

interface Goal { id: string; title: string; goal_type: string; target_value: number; current_value: number; unit: string; completed: number; subject_name: string; }

const MOODS = [
  { id: 'great', label: 'Harika', emoji: '😄', color: 'text-green-400' },
  { id: 'good', label: 'İyi', emoji: '🙂', color: 'text-blue-400' },
  { id: 'normal', label: 'Normal', emoji: '😐', color: 'text-yellow-400' },
  { id: 'low', label: 'Düşük', emoji: '😕', color: 'text-orange-400' },
  { id: 'bad', label: 'Kötü', emoji: '😞', color: 'text-red-400' },
];

export default function PlannerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetValue: 10, unit: 'questions', goalType: 'daily' });
  const [checkin, setCheckin] = useState({ mood: '', energyLevel: 3, motivationLevel: 3 });
  const [msg, setMsg] = useState('');
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);

  useEffect(() => {
    api.get<Goal[]>('/planner/goals').then(setGoals).catch(() => {});
  }, []);

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = newGoal.goalType === 'daily' ? today : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      await api.post('/planner/goals', { ...newGoal, startDate: today, endDate });
      const updated = await api.get<Goal[]>('/planner/goals');
      setGoals(updated);
      setShowNewGoal(false);
      setNewGoal({ title: '', targetValue: 10, unit: 'questions', goalType: 'daily' });
      setMsg('Hedef oluşturuldu!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Hedef oluşturulurken hata oluştu.');
      setTimeout(() => setMsg(''), 3000);
    }
    setGoalLoading(false);
  };

  const toggleGoal = async (goal: Goal) => {
    try {
      await api.put(`/planner/goals/${goal.id}`, { completed: goal.completed ? 0 : 1, currentValue: goal.completed ? 0 : goal.target_value });
      const updated = await api.get<Goal[]>('/planner/goals');
      setGoals(updated);
    } catch {}
  };

  const submitCheckin = async () => {
    if (!checkin.mood) {
      setMsg('Lütfen bir ruh hali seçin.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setCheckinLoading(true);
    try {
      await api.post('/planner/checkin', checkin);
      setShowCheckin(false);
      setCheckin({ mood: '', energyLevel: 3, motivationLevel: 3 });
      setMsg('Check-in kaydedildi! +5 XP');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Check-in kaydedilirken hata oluştu.');
      setTimeout(() => setMsg(''), 3000);
    }
    setCheckinLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Planlama</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCheckin(!showCheckin)} className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm">
            <Smile size={16} /> Check-in
          </button>
          <button onClick={() => setShowNewGoal(!showNewGoal)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-xl text-sm font-medium">
            <Plus size={16} /> Hedef
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium text-center animate-slide-up">{msg}</div>
      )}

      {/* Daily Check-in */}
      {showCheckin && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-slide-up space-y-4">
          <h2 className="text-lg font-semibold">Günlük Check-in</h2>
          <div>
            <p className="text-sm text-dark-300 mb-3">Bugün nasıl hissediyorsun?</p>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button key={m.id} onClick={() => setCheckin(p => ({ ...p, mood: m.id }))}
                  className={`flex-1 py-3 rounded-xl text-center transition ${checkin.mood === m.id ? 'bg-primary-600/20 border border-primary-500/30' : 'bg-dark-700 hover:bg-dark-600'}`}>
                  <div className="text-2xl">{m.emoji}</div>
                  <div className="text-xs mt-1 text-dark-400">{m.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-dark-300 flex items-center gap-1 mb-2"><Zap size={14} /> Enerji (1-5)</label>
              <input type="range" min={1} max={5} value={checkin.energyLevel} onChange={e => setCheckin(p => ({ ...p, energyLevel: Number(e.target.value) }))} className="w-full" />
              <div className="text-center text-sm text-primary-400">{checkin.energyLevel}/5</div>
            </div>
            <div>
              <label className="text-sm text-dark-300 flex items-center gap-1 mb-2"><Battery size={14} /> Motivasyon (1-5)</label>
              <input type="range" min={1} max={5} value={checkin.motivationLevel} onChange={e => setCheckin(p => ({ ...p, motivationLevel: Number(e.target.value) }))} className="w-full" />
              <div className="text-center text-sm text-primary-400">{checkin.motivationLevel}/5</div>
            </div>
          </div>
          <button onClick={submitCheckin} disabled={!checkin.mood || checkinLoading}
            className="w-full py-3 bg-primary-600 rounded-xl font-semibold disabled:opacity-30 hover:bg-primary-500 transition">
            {checkinLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* New Goal */}
      {showNewGoal && (
        <form onSubmit={createGoal} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-slide-up space-y-4">
          <h2 className="text-lg font-semibold">Yeni Hedef</h2>
          <input placeholder="Hedef adı (örn: 50 matematik sorusu çöz)" value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Hedef</label>
              <input type="number" min={1} value={newGoal.targetValue} onChange={e => setNewGoal(p => ({ ...p, targetValue: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white" />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Birim</label>
              <select value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                <option value="questions">Soru</option>
                <option value="minutes">Dakika</option>
                <option value="net">Net</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Tür</label>
              <select value={newGoal.goalType} onChange={e => setNewGoal(p => ({ ...p, goalType: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={goalLoading} className="w-full py-3 bg-primary-600 rounded-xl font-semibold disabled:opacity-50 hover:bg-primary-500 transition">
            {goalLoading ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </form>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Target size={20} /> Hedeflerim</h2>
        {goals.map(g => (
          <div key={g.id} className={`bg-dark-800 rounded-xl p-4 border transition ${g.completed ? 'border-green-500/30 opacity-60' : 'border-dark-700'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleGoal(g)} className="shrink-0">
                {g.completed ? <CheckCircle size={22} className="text-green-400" /> : <Circle size={22} className="text-dark-500" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${g.completed ? 'line-through text-dark-500' : ''}`}>{g.title}</div>
                <div className="text-xs text-dark-400 mt-1">{g.current_value}/{g.target_value} {g.unit === 'questions' ? 'soru' : g.unit === 'minutes' ? 'dk' : 'net'}</div>
                {!g.completed && (
                  <div className="w-full h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (g.current_value / g.target_value) * 100)}%` }} />
                  </div>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${g.goal_type === 'daily' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {g.goal_type === 'daily' ? 'Günlük' : 'Haftalık'}
              </span>
            </div>
          </div>
        ))}
        {goals.length === 0 && <p className="text-center text-dark-400 py-8">Henüz hedef belirlenmemiş</p>}
      </div>
    </div>
  );
}
