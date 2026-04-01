import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, TrendingUp, ClipboardList } from 'lucide-react';
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
  const [examType, setExamType] = useState('TYT');
  const [form, setForm] = useState({ publisher: '', trialName: '', examDate: '', turkceCorrect: 0, turkceWrong: 0, sosyalCorrect: 0, sosyalWrong: 0, matematikCorrect: 0, matematikWrong: 0, fenCorrect: 0, fenWrong: 0, notes: '' });

  useEffect(() => {
    api.get<TrialResult[]>('/trials').then(setTrials).catch(() => {});
    api.get<any[]>('/trials/progress?examType=TYT').then(setProgress).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/trials', { ...form, examType });
      setShowForm(false);
      const updated = await api.get<TrialResult[]>('/trials');
      setTrials(updated);
      const prog = await api.get<any[]>(`/trials/progress?examType=${examType}`);
      setProgress(prog);
    } catch {}
  };

  const update = (field: string, value: string | number) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deneme Sonucları</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-xl text-sm font-medium hover:bg-primary-500 transition">
          <Plus size={16} /> Sonuc Ekle
        </button>
      </div>

      {/* Progress Chart */}
      {progress.length > 1 && (
        <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
          <div className="flex items-center gap-2 text-sm text-dark-300 mb-4"><TrendingUp size={16} /> Net Gelisim Grafigi</div>
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
              {[['Turkce', 'turkce', 40], ['Sosyal', 'sosyal', 20], ['Matematik', 'matematik', 40], ['Fen', 'fen', 20]].map(([label, key, max]) => (
                <div key={key as string} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-dark-300">{label as string}</span>
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
          <div key={t.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.trial_name}</div>
              <div className="text-xs text-dark-400">{t.publisher} - {t.exam_type} - {t.exam_date || t.created_at?.split('T')[0]}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary-400">{t.total_net?.toFixed(1)}</div>
              <div className="text-xs text-dark-400">net</div>
            </div>
          </div>
        ))}
        {trials.length === 0 && <p className="text-center text-dark-400 py-8">Henuz deneme sonucu eklenmemis</p>}
      </div>
    </div>
  );
}
