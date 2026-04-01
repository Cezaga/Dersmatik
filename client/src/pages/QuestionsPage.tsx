import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { BookOpen, Filter, Play, Clock, ChevronRight, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface Subject { id: string; name: string; exam_type: string; icon: string; color: string; }
interface Topic { id: string; name: string; }
interface Question { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; option_e: string; correct_answer: string; solution_text: string; subject_name: string; topic_name: string; exam_year: number; difficulty: number; }
interface AvailableExam { exam_year: number; exam_type: string; exam_name: string; question_count: number; }

type Tab = 'practice' | 'exam' | 'wrong';

export default function QuestionsPage() {
  const [tab, setTab] = useState<Tab>('practice');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string; solutionText: string; xpGained: number } | null>(null);
  const [availableExams, setAvailableExams] = useState<AvailableExam[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Subject[]>('/questions/subjects').then(setSubjects).catch(() => {});
    api.get<AvailableExam[]>('/exams/available').then(setAvailableExams).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get<Topic[]>(`/questions/subjects/${selectedSubject}/topics`).then(setTopics).catch(() => {});
    }
  }, [selectedSubject]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      let url = '/questions?limit=20';
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedTopic) url += `&topicId=${selectedTopic}`;
      const res = await api.get<{ questions: Question[] }>(url);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setAnswered(false);
      setResult(null);
      setSelectedAnswer('');
    } catch {}
    setLoading(false);
  };

  const loadWrongQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get<Question[]>('/questions/wrong?limit=20');
      setQuestions(res);
      setCurrentIndex(0);
      setAnswered(false);
      setResult(null);
      setSelectedAnswer('');
    } catch {}
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || answered) return;
    const question = questions[currentIndex];
    try {
      const res = await api.post<{ isCorrect: boolean; correctAnswer: string; solutionText: string; xpGained: number }>(`/questions/${question.id}/answer`, { selectedAnswer, timeSpent: 30 });
      setResult(res);
      setAnswered(true);
    } catch {}
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setResult(null);
    }
  };

  const startExam = async (examYear: number, examType: string) => {
    try {
      const res = await api.post<{ sessionId: string }>('/exams/start', { examType, examYear, timeLimit: examType === 'TYT' ? 165 : 180 });
      navigate(`/exam/${res.sessionId}`);
    } catch {}
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Soru Bankası</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['practice', 'Konu Calıs'], ['exam', 'Sınav Coz'], ['wrong', 'Yanlıslar']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setQuestions([]); if (t === 'wrong') loadWrongQuestions(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'exam' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">YKS Sınav Arsivi</h2>
          {availableExams.length === 0 && <p className="text-dark-400 text-sm">Henuz sınav verisi yok. Seed data yukleyin.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableExams.map((exam, i) => (
              <button key={i} onClick={() => startExam(exam.exam_year, exam.exam_type)}
                className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-primary-500/50 transition text-left flex items-center justify-between">
                <div>
                  <div className="font-semibold">{exam.exam_name}</div>
                  <div className="text-sm text-dark-400">{exam.question_count} soru</div>
                </div>
                <Play size={20} className="text-primary-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {(tab === 'practice') && (
        <>
          {/* Filters */}
          <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700 space-y-3">
            <div className="flex items-center gap-2 text-sm text-dark-300"><Filter size={16} /> Filtrele</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(''); }}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white">
                <option value="">Tum Dersler</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.exam_type})</option>)}
              </select>
              <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" disabled={!selectedSubject}>
                <option value="">Tum Konular</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button onClick={loadQuestions} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold hover:from-primary-500 hover:to-purple-500 transition disabled:opacity-50">
              {loading ? 'Yukleniyor...' : 'Soruları Getir'}
            </button>
          </div>
        </>
      )}

      {/* Question Display */}
      {currentQ && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-dark-400">{currentQ.subject_name} {currentQ.topic_name && `> ${currentQ.topic_name}`}</span>
            <span className="text-xs text-dark-400">{currentIndex + 1}/{questions.length}</span>
          </div>

          <p className="text-lg mb-6 leading-relaxed">{currentQ.question_text}</p>

          <div className="space-y-3">
            {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => {
              const text = currentQ[`option_${opt.toLowerCase()}` as keyof Question] as string;
              if (!text) return null;
              let cls = 'bg-dark-700 border-dark-600 hover:border-dark-400';
              if (answered && result) {
                if (opt === result.correctAnswer) cls = 'bg-green-500/10 border-green-500/50 text-green-400';
                else if (opt === selectedAnswer && !result.isCorrect) cls = 'bg-red-500/10 border-red-500/50 text-red-400';
              } else if (opt === selectedAnswer) {
                cls = 'bg-primary-600/20 border-primary-500/50 text-primary-300';
              }
              return (
                <button key={opt} onClick={() => !answered && setSelectedAnswer(opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${cls}`}>
                  <span className="font-semibold mr-3">{opt})</span>{text}
                </button>
              );
            })}
          </div>

          {!answered ? (
            <button onClick={submitAnswer} disabled={!selectedAnswer}
              className="w-full mt-4 py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold disabled:opacity-30 transition">
              Cevapla
            </button>
          ) : result && (
            <div className="mt-4 space-y-3">
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${result.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {result.isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {result.isCorrect ? 'Dogru!' : 'Yanlıs!'} +{result.xpGained} XP
              </div>
              {result.solutionText && (
                <div className="bg-dark-700/50 rounded-xl p-4 text-sm text-dark-300">
                  <strong className="text-white">Cozum:</strong> {result.solutionText}
                </div>
              )}
              <button onClick={nextQuestion} className="w-full py-3 bg-dark-700 rounded-xl font-semibold hover:bg-dark-600 transition flex items-center justify-center gap-2">
                Sonraki Soru <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
