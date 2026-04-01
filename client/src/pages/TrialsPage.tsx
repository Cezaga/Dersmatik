import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, TrendingUp, Calculator, Trash2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TrialResult {
  id: string; publisher: string; trial_name: string; exam_type: string; exam_date: string;
  turkce_correct: number; turkce_wrong: number; sosyal_correct: number; sosyal_wrong: number;
  matematik_correct: number; matematik_wrong: number; fen_correct: number; fen_wrong: number;
  total_net: number; created_at: string;
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [progress, setProgress] = useState<{ total_net: number; trial_name: string; exam_date: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showRankCalc, setShowRankCalc] = useState(false);
  const [rankResult, setRankResult] = useState<{ estimatedRank: number; totalScore: string } | null>(null);
  const [rankInput, setRankInput] = useState({ tytNet: '', aytNet: '' });
  const [examType, setExamType] = useState('TYT');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ publisher: '', trialName: '', examDate: '', turkceCorrect: 0, turkceWrong: 0, sosyalCorrect: 0, sosyalWrong: 0, matematikCorrect: 0, matematikWrong: 0, fenCorrect: 0, fenWrong: 0, notes: '' });

  const loadData = () => {
    api.get<TrialResult[]>('/trials').then(setTrials).catch(() => {});
    api.get<any[]>('/trials/progress?examType=TYT').then(setProgress).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/trials', { ...form, examType });
      setShowForm(false);
      setMsg('Deneme sonucu kaydedildi! +30 XP');
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch {
      setMsg('Hata oluştu!');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const deleteTrial = async (id: string) => {
    try {
      await api.delete(`/trials/${id}`);
      setDeleteConfirm(null);
      setMsg('Deneme sonucu silindi.');
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch {
      setMsg('Silinirken hata oluştu.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const update = (field: string, value: string | number) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Deneme Sonuçları</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowRankCalc(!showRankCalc)} className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm font-medium">
            <Calculator size={16} /> Sıralama
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-2 bg-primary-600 rounded-xl text-sm font-medium hover:bg-primary-500 transition">
            <Plus size={16} /> Sonuç Ekle
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm font-medium text-center animate-slide-up">{msg}</div>
      )}

      {/* Rank Calculator */}
      {showRankCalc && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Calculator size={20} /> Sıralama Tahmini</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">TYT Net</label>
              <input type="number" step="0.25" min={0} max={120} placeholder="örn: 85.5" value={rankInput.tytNet}
                onChange={e => setRankInput(p => ({ ...p, tytNet: e.target.value }))}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">AYT Net</label>
              <input type="number" step="0.25" min={0} max={160} placeholder="örn: 55.75" value={rankInput.aytNet}
                onChange={e => setRankInput(p => ({ ...p, aytNet: e.target.value }))}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
            </div>
          </div>
          <button onClick={async () => {
            try {
              const res = await api.get<{ estimatedRank: number; totalScore: string }>(`/trials/estimate-rank?tytNet=${rankInput.tytNet || 0}&aytNet=${rankInput.aytNet || 0}`);
              setRankResult(res);
            } catch {}
          }} className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold">Hesapla</button>
          {rankResult && (
            <div className="text-center p-4 bg-primary-600/10 border border-primary-500/30 rounded-xl">
              <div className="text-3xl font-bold text-primary-400">{rankResult.estimatedRank.toLocaleString('tr-TR')}</div>
              <div className="text-sm text-dark-400 mt-1">Tahmini Sıralama</div>
              <div className="text-xs text-dark-500 mt-2">Ağırlıklı puan: {rankResult.totalScore}</div>
            </div>
          )}
        </div>
      )}

      {/* Progress Chart */}
      {progress.length > 1 && (
        <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
          <div className="flex items-center gap-2 text-sm text-dark-300 mb-4"><TrendingUp size={16} /> Net Gelişim Grafiği</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="trial_name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
              <Line type="monotone" dataKey="total_net" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h2 className="text-lg font-semibold">Deneme Sonucu Ekle</h2>
          <div className="flex gap-2">
            {['TYT', 'AYT'].map(t => (
              <button key={t} type="button" onClick={() => setExamType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${examType === t ? 'bg-primary-600' : 'bg-dark-700 text-dark-300'}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="Yayınevi" value={form.publisher} onChange={e => update('publisher', e.target.value)}
              className="px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
            <input placeholder="Deneme Adı" value={form.trialName} onChange={e => update('trialName', e.target.value)} required
              className="px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
            <input type="date" value={form.examDate} onChange={e => update('examDate', e.target.value)}
              className="px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          </div>

          {examType === 'TYT' && (
            <div className="space-y-3">
              {[['Türkçe', 'turkce', 40], ['Sosyal', 'sosyal', 20], ['Matematik', 'matematik', 40], ['Fen', 'fen', 20]].map(([label, key, max]) => (
                <div key={key as string} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-dark-300 shrink-0">{label as string}</span>
                  <input type="number" min={0} max={max as number} placeholder="D" value={(form as any)[`${key}Correct`] || ''}
                    onChange={e => update(`${key}Correct`, Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-center" />
                  <input type="number" min={0} max={max as number} placeholder="Y" value={(form as any)[`${key}Wrong`] || ''}
                    onChange={e => update(`${key}Wrong`, Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-center" />
                  <span className="text-xs text-dark-500">D / Y</span>
                </div>
              ))}
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold">Kaydet</button>
        </form>
      )}

      {/* Results List */}
      <div className="space-y-3">
        {trials.map(t => (
          <div key={t.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{t.trial_name}</div>
              <div className="text-xs text-dark-400 truncate">{t.publisher} - {t.exam_type} - {t.exam_date || t.created_at?.split('T')[0]}</div>
            </div>
            <div className="text-right shrink-0 flex items-center gap-3">
              <div>
                <div className="text-xl font-bold text-primary-400">{t.total_net?.toFixed(1)}</div>
                <div className="text-xs text-dark-400">net</div>
              </div>
              {deleteConfirm === t.id ? (
                <div className="flex gap-1">
                  <button onClick={() => deleteTrial(t.id)} className="px-2 py-1 bg-red-600 rounded text-xs text-white">Sil</button>
                  <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-dark-600 rounded text-xs"><X size={12} /></button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(t.id)} className="p-2 hover:bg-dark-700 rounded-lg transition" title="Sil">
                  <Trash2 size={16} className="text-dark-400 hover:text-red-400" />
                </button>
              )}
            </div>
          </div>
        ))}
        {trials.length === 0 && <p className="text-center text-dark-400 py-8">Henüz deneme sonucu eklenmemiş</p>}
      </div>
    </div>
  );
}
