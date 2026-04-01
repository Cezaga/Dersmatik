import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Lock, Unlock, Star, ChevronDown, ChevronRight } from 'lucide-react';

interface Subject { id: string; name: string; exam_type: string; icon: string; color: string; }
interface SkillNode { id: string; name: string; subject_name: string; color: string; mastery_level: number; questions_solved: number; correct_rate: number; unlocked: number; parent_topic_id: string | null; }

export default function SkillTreePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<Subject[]>('/questions/subjects').then(s => {
      setSubjects(s);
      if (s.length > 0) setSelectedSubject(s[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get<SkillNode[]>(`/gamification/skill-tree?subjectId=${selectedSubject}`).then(setNodes).catch(() => {});
    }
  }, [selectedSubject]);

  const loadAll = async () => {
    const allNodes = await api.get<SkillNode[]>('/gamification/skill-tree');
    setNodes(allNodes);
    setSelectedSubject('all');
  };

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'from-green-500 to-emerald-400';
    if (level >= 60) return 'from-blue-500 to-cyan-400';
    if (level >= 40) return 'from-yellow-500 to-orange-400';
    if (level >= 20) return 'from-orange-500 to-red-400';
    return 'from-dark-600 to-dark-500';
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 80) return 'Uzman';
    if (level >= 60) return 'Iyi';
    if (level >= 40) return 'Orta';
    if (level >= 20) return 'Baslangıc';
    return 'Kilitli';
  };

  const totalMastery = nodes.length > 0
    ? Math.round(nodes.reduce((sum, n) => sum + n.mastery_level, 0) / nodes.length)
    : 0;

  const groupedBySubject = nodes.reduce<Record<string, SkillNode[]>>((acc, node) => {
    const key = node.subject_name || 'Diger';
    if (!acc[key]) acc[key] = [];
    acc[key].push(node);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calısma Haritası</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">Genel Hakimiyet:</span>
          <span className="text-lg font-bold text-primary-400">%{totalMastery}</span>
        </div>
      </div>

      {/* Subject Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={loadAll}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedSubject === 'all' ? 'bg-primary-600' : 'bg-dark-800 text-dark-300'}`}>
          Tumu
        </button>
        {subjects.map(s => (
          <button key={s.id} onClick={() => setSelectedSubject(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedSubject === s.id ? 'bg-primary-600' : 'bg-dark-800 text-dark-300'}`}>
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* Skill Tree */}
      {selectedSubject === 'all' ? (
        // Grouped view
        <div className="space-y-4">
          {Object.entries(groupedBySubject).map(([subjectName, subjectNodes]) => {
            const subjectMastery = Math.round(subjectNodes.reduce((s, n) => s + n.mastery_level, 0) / subjectNodes.length);
            const isExpanded = expandedSubjects.has(subjectName);
            return (
              <div key={subjectName} className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                <button onClick={() => toggleSubject(subjectName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-dark-750 transition">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span className="font-semibold">{subjectName}</span>
                    <span className="text-xs text-dark-400">{subjectNodes.length} konu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${getMasteryColor(subjectMastery)}`} style={{ width: `${subjectMastery}%` }} />
                    </div>
                    <span className="text-sm font-medium text-dark-300">%{subjectMastery}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subjectNodes.map(node => <SkillNodeCard key={node.id} node={node} getMasteryColor={getMasteryColor} getMasteryLabel={getMasteryLabel} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Single subject view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {nodes.map((node, i) => (
            <SkillNodeCard key={node.id} node={node} getMasteryColor={getMasteryColor} getMasteryLabel={getMasteryLabel} index={i} />
          ))}
        </div>
      )}

      {nodes.length === 0 && <p className="text-center text-dark-400 py-8">Henuz veri yok. Soru cozerek calısma haritanı doldur!</p>}

      {/* Legend */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h3 className="text-sm text-dark-400 mb-3">Hakimiyet Seviyeleri</h3>
        <div className="flex gap-4 flex-wrap">
          {[{ label: 'Kilitli', color: 'bg-dark-600', range: '0%' },
            { label: 'Baslangıc', color: 'bg-orange-500', range: '1-39%' },
            { label: 'Orta', color: 'bg-yellow-500', range: '40-59%' },
            { label: 'Iyi', color: 'bg-blue-500', range: '60-79%' },
            { label: 'Uzman', color: 'bg-green-500', range: '80-100%' }].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-dark-300">
              <div className={`w-3 h-3 rounded-full ${l.color}`} />
              {l.label} ({l.range})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillNodeCard({ node, getMasteryColor, getMasteryLabel, index }: { node: SkillNode; getMasteryColor: (l: number) => string; getMasteryLabel: (l: number) => string; index?: number }) {
  const isLocked = node.mastery_level === 0 && node.questions_solved === 0;
  return (
    <div className={`relative bg-dark-700/50 rounded-xl p-4 border transition ${isLocked ? 'border-dark-700 opacity-50' : 'border-dark-600 hover:border-dark-500'}`}
      style={{ animationDelay: index !== undefined ? `${index * 50}ms` : '0ms' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLocked ? <Lock size={14} className="text-dark-500" /> : <Unlock size={14} className="text-primary-400" />}
          <span className="text-sm font-medium">{node.name}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          node.mastery_level >= 80 ? 'bg-green-500/20 text-green-400' :
          node.mastery_level >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-dark-600 text-dark-400'
        }`}>
          {getMasteryLabel(node.mastery_level)}
        </span>
      </div>
      <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${getMasteryColor(node.mastery_level)} transition-all duration-500`}
          style={{ width: `${node.mastery_level}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-dark-400">
        <span>{node.questions_solved} soru cozuldu</span>
        <span>%{node.correct_rate.toFixed(0)} dogru</span>
      </div>
    </div>
  );
}
