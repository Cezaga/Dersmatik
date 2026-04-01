import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, Calculator } from 'lucide-react';

interface Formula { id: string; title: string; content: string; subject_name: string; topic_name: string; }
interface Subject { id: string; name: string; exam_type: string; icon: string; }

export default function FormulaPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Subject[]>('/questions/subjects').then(setSubjects).catch(() => {});
    loadFormulas();
  }, []);

  const loadFormulas = async (subjectId?: string, searchText?: string) => {
    let url = '/notebook/formulas?';
    if (subjectId) url += `subjectId=${subjectId}&`;
    if (searchText) url += `search=${searchText}&`;
    const res = await api.get<Formula[]>(url);
    setFormulas(res);
  };

  useEffect(() => {
    loadFormulas(selectedSubject, search);
  }, [selectedSubject, search]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator size={24} /> Formul Defteri</h1>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input placeholder="Formul ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white" />
        </div>
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white">
          <option value="">Tum Dersler</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {formulas.map(f => (
          <div key={f.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <div className="text-xs text-primary-400 mb-1">{f.subject_name}</div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <pre className="text-sm text-dark-300 whitespace-pre-wrap font-mono bg-dark-700/50 p-3 rounded-lg">{f.content}</pre>
          </div>
        ))}
      </div>

      {formulas.length === 0 && <p className="text-center text-dark-400 py-8">Formul bulunamadı</p>}
    </div>
  );
}
