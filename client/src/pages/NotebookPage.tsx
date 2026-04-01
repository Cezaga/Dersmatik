import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, NotebookPen, BookOpen, AlertTriangle } from 'lucide-react';

interface Note { id: string; title: string; content: string; subject_name: string; topic_name: string; is_public: number; created_at: string; }
interface ErrorEntry { id: string; question_text: string; correct_answer: string; subject_name: string; topic_name: string; error_type: string; notes: string; created_at: string; }

type Tab = 'notes' | 'errors';

const ERROR_TYPES: Record<string, string> = {
  carelessness: 'Dikkatsizlik',
  knowledge_gap: 'Bilgi Eksigi',
  misunderstanding: 'Yanlıs Anlama',
  time_pressure: 'Zaman Baskısı',
};

export default function NotebookPage() {
  const [tab, setTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', isPublic: false });

  useEffect(() => {
    api.get<Note[]>('/notebook/notes').then(setNotes).catch(() => {});
    api.get<ErrorEntry[]>('/stats/errors').then(setErrors).catch(() => {});
  }, []);

  const [msg, setMsg] = useState('');

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notebook/notes', newNote);
      const updated = await api.get<Note[]>('/notebook/notes');
      setNotes(updated);
      setShowNewNote(false);
      setNewNote({ title: '', content: '', isPublic: false });
      setMsg('Not kaydedildi! +10 XP');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Not kaydedilirken hata oluştu.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Defterim</h1>
        <button onClick={() => setShowNewNote(!showNewNote)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-xl text-sm font-medium">
          <Plus size={16} /> Not Ekle
        </button>
      </div>

      <div className="flex gap-2">
        {([['notes', 'Notlarım', NotebookPen], ['errors', 'Hata Defteri', AlertTriangle]] as [Tab, string, any][]).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? 'bg-primary-600' : 'bg-dark-800 text-dark-300'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {showNewNote && (
        <form onSubmit={createNote} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-3 animate-slide-up">
          <input placeholder="Baslik" value={newNote.title} onChange={e => setNewNote(p => ({ ...p, title: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <textarea placeholder="Not icerigi..." value={newNote.content} onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white h-32 resize-none" />
          <label className="flex items-center gap-2 text-sm text-dark-300">
            <input type="checkbox" checked={newNote.isPublic} onChange={e => setNewNote(p => ({ ...p, isPublic: e.target.checked }))} className="rounded" />
            Arkadaslarınla paylas
          </label>
          <button type="submit" className="w-full py-3 bg-primary-600 rounded-xl font-semibold">Kaydet</button>
        </form>
      )}

      {tab === 'notes' && (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{n.title}</h3>
                <span className="text-xs text-dark-400">{n.created_at?.split('T')[0]}</span>
              </div>
              {n.subject_name && <span className="text-xs text-primary-400">{n.subject_name}</span>}
              <p className="text-sm text-dark-300 mt-2 whitespace-pre-wrap">{n.content}</p>
              {n.is_public === 1 && <span className="text-xs text-green-400 mt-2 inline-block">Herkese acık</span>}
            </div>
          ))}
          {notes.length === 0 && <p className="text-center text-dark-400 py-8">Henuz not eklenmemis</p>}
        </div>
      )}

      {tab === 'errors' && (
        <div className="space-y-3">
          {errors.map(e => (
            <div key={e.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${e.error_type === 'carelessness' ? 'bg-yellow-500/20 text-yellow-400' : e.error_type === 'knowledge_gap' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {ERROR_TYPES[e.error_type] || e.error_type}
                </span>
                <span className="text-xs text-dark-400">{e.subject_name}</span>
              </div>
              {e.question_text && <p className="text-sm mb-2">{e.question_text}</p>}
              {e.notes && <p className="text-sm text-dark-400">{e.notes}</p>}
            </div>
          ))}
          {errors.length === 0 && <p className="text-center text-dark-400 py-8">Hata defteri bos</p>}
        </div>
      )}
    </div>
  );
}
