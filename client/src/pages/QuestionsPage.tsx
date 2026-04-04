import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { BookOpen, Filter, Play, Clock, ChevronRight, CheckCircle, XCircle, RotateCcw, AlertTriangle, Shuffle } from 'lucide-react';

interface Subject { id: string; name: string; exam_type: string; icon: string; color: string; }
interface Topic { id: string; name: string; }
interface Question { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; option_e: string; correct_answer: string; solution_text: string; subject_name: string; topic_name: string; exam_year: number; difficulty: number; }
interface AvailableExam { exam_year: number; exam_type: string; exam_name: string; question_count: number; }

type Tab = 'practice' | 'exam' | 'wrong' | 'weak';

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
  const [error, setError] = useState('');
  const [weakTopics, setWeakTopics] = useState<{ id: string; name: string; subject_name: string; success_rate: number }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Subject[]>('/questions/subjects').then(setSubjects).catch(() => {});
    api.get<AvailableExam[]>('/exams/available').then(setAvailableExams).catch(() => {});
    api.get<any[]>('/stats/weak-topics').then(setWeakTopics).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get<Topic[]>(`/questions/subjects/${selectedSubject}/topics`).then(setTopics).catch(() => {});
    }
  }, [selectedSubject]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/questions?limit=20';
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedTopic) url += `&topicId=${selectedTopic}`;
      const res = await api.get<{ questions: Question[] }>(url);
      if (res.questions.length === 0) {
        setError('Bu kriterlere uygun soru bulunamadı.');
      }
      setQuestions(res.questions);
      setCurrentIndex(0);
      setAnswered(false);
      setResult(null);
      setSelectedAnswer('');
    } catch {
      setError('Sorular yüklenirken hata oluştu.');
    }
    setLoading(false);
  };

  const loadWrongQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<Question[]>('/questions/wrong?limit=20');
      if (res.length === 0) {
        setError('Henüz yanlış yapılan soru yok. Soru çözerek başlayın!');
      }
      setQuestions(res);
      setCurrentIndex(0);
      setAnswered(false);
      setResult(null);
      setSelectedAnswer('');
    } catch {
      setError('Yanlış sorular yüklenirken hata oluştu.');
    }
    setLoading(false);
  };

  const loadWeakTopicQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      // Get questions from weak topics
      if (weakTopics.length === 0) {
        setError('Zayıf konu analizi için önce yeterli soru çözmeniz gerekiyor.');
        setLoading(false);
        return;
      }
      const topicIds = weakTopics.slice(0, 5).map(t => t.id);
      const allQuestions: Question[] = [];
      for (const topicId of topicIds) {
        try {
          const res = await api.get<Question[]>(`/questions/by-topic/${topicId}?limit=5`);
          allQuestions.push(...res);
        } catch {}
      }
      if (allQuestions.length === 0) {
        setError('Zayıf konulara ait soru bulunamadı.');
      }
      // Shuffle
      allQuestions.sort(() => Math.random() - 0.5);
      setQuestions(allQuestions);
      setCurrentIndex(0);
      setAnswered(false);
      setResult(null);
      setSelectedAnswer('');
    } catch {
      setError('Sorular yüklenirken hata oluştu.');
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || answered) return;
    const question = questions[currentIndex];
    setError('');
    try {
      const res = await api.post<{ isCorrect: boolean; correctAnswer: string; solutionText: string; xpGained: number }>(`/questions/${question.id}/answer`, { selectedAnswer, timeSpent: 30 });
      setResult(res);
      setAnswered(true);
    } catch (err: any) {
      setError(err.message || 'Cevap kaydedilirken hata oluştu.');
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setResult(null);
      setError('');
    }
  };

  const startExam = async (examYear: number, examType: string) => {
    setError('');
    try {
      const res = await api.post<{ sessionId: string; questions: Question[]; timeLimit: number }>('/exams/start', { examType, examYear, timeLimit: examType === 'TYT' ? 165 : 180 });
      // Store exam data in sessionStorage so ExamPage can read it
      sessionStorage.setItem(`exam_${res.sessionId}`, JSON.stringify(res));
      navigate(`/exam/${res.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Sınav başlatılırken hata oluştu.');
    }
  };

  // Start weak topic practice exam (timed)
  const startWeakTopicExam = async () => {
    if (weakTopics.length === 0) {
      setError('Zayıf konu analizi için önce soru çözmeniz gerekiyor.');
      return;
    }
    setError('');
    try {
      // Start a custom exam with weak topic questions
      const res = await api.post<{ sessionId: string; questions: Question[]; timeLimit: number }>('/exams/start', {
        examType: 'TYT',
        timeLimit: 60,
        title: 'Zayıf Konu Denemesi',
        questionCount: 20
      });
      sessionStorage.setItem(`exam_${res.sessionId}`, JSON.stringify(res));
      navigate(`/exam/${res.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Deneme oluşturulurken hata oluştu.');
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Soru Bankası</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['practice', 'Konu Çalış'], ['exam', 'Sınav Çöz'], ['wrong', 'Yanlışlar'], ['weak', 'Zayıf Konular']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => {
            setTab(t); setQuestions([]); setError('');
            if (t === 'wrong') loadWrongQuestions();
            if (t === 'weak') loadWeakTopicQuestions();
          }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {tab === 'exam' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">YKS Sınav Arşivi (2018-2025)</h2>
          {/* Tüm yılları listele, veri olmayanları "yakında" göster */}
          {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(year => {
            const yearExams = availableExams.filter(e => e.exam_year === year);
            const isComingSoon = year === 2023;
            return (
              <div key={year} className="space-y-2">
                <h3 className="text-sm font-bold text-dark-300">{year} YKS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {isComingSoon ? (
                    <>
                      {(['TYT', 'AYT'] as const).map(type => (
                        <div key={type}
                          className="bg-dark-800 rounded-xl p-4 border border-dark-700 opacity-60 text-left flex items-center justify-between overflow-hidden cursor-not-allowed">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${type === 'TYT' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {type}
                              </span>
                              {type} {year}
                            </div>
                            <div className="text-sm text-yellow-400/70 mt-1">Yakında eklenecek</div>
                          </div>
                          <Clock size={20} className="text-dark-500 shrink-0 ml-2" />
                        </div>
                      ))}
                    </>
                  ) : yearExams.length > 0 ? (
                    yearExams.map((exam, i) => (
                      <button key={i} onClick={() => startExam(exam.exam_year, exam.exam_type)}
                        className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-primary-500/50 transition text-left flex items-center justify-between overflow-hidden">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${exam.exam_type === 'TYT' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                              {exam.exam_type}
                            </span>
                            {exam.exam_type} {exam.exam_year}
                          </div>
                          <div className="text-sm text-dark-400 mt-1">{exam.question_count} soru • {exam.exam_type === 'TYT' ? '165' : '180'} dk</div>
                        </div>
                        <Play size={20} className="text-primary-400 shrink-0 ml-2" />
                      </button>
                    ))
                  ) : (
                    <>
                      {(['TYT', 'AYT'] as const).map(type => (
                        <div key={type}
                          className="bg-dark-800 rounded-xl p-4 border border-dark-700 opacity-40 text-left flex items-center justify-between overflow-hidden cursor-not-allowed">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${type === 'TYT' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {type}
                              </span>
                              {type} {year}
                            </div>
                            <div className="text-sm text-dark-500 mt-1">Veri yükleniyor...</div>
                          </div>
                          <Clock size={20} className="text-dark-600 shrink-0 ml-2" />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'weak' && questions.length === 0 && !loading && !error && (
        <div className="space-y-4">
          <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shuffle size={16} /> Zayıf Konu Ağırlıklı Deneme</h3>
            <p className="text-xs text-dark-400 mb-3">En zayıf konularından sorularla özel bir deneme oluştur.</p>
            <button onClick={startWeakTopicExam} className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold text-sm">
              Zamanlı Deneme Başlat (60 dk)
            </button>
          </div>
          {weakTopics.length > 0 && (
            <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700 space-y-2">
              <h3 className="text-sm font-semibold">Zayıf Konuların</h3>
              {weakTopics.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
                  <div className="text-sm truncate">{t.name} <span className="text-xs text-dark-400">({t.subject_name})</span></div>
                  <span className={`text-xs font-bold ${t.success_rate < 40 ? 'text-red-400' : 'text-yellow-400'}`}>%{t.success_rate}</span>
                </div>
              ))}
            </div>
          )}
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
                <option value="">Tüm Dersler</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.exam_type})</option>)}
              </select>
              <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" disabled={!selectedSubject}>
                <option value="">Tüm Konular</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button onClick={loadQuestions} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold hover:from-primary-500 hover:to-purple-500 transition disabled:opacity-50">
              {loading ? 'Yükleniyor...' : 'Soruları Getir'}
            </button>
          </div>
        </>
      )}

      {/* Question Display */}
      {currentQ && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-dark-400 truncate">{currentQ.subject_name} {currentQ.topic_name && `> ${currentQ.topic_name}`}</span>
            <span className="text-xs text-dark-400 shrink-0 ml-2">{currentIndex + 1}/{questions.length}</span>
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
              className="w-full mt-4 py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold disabled:opacity-30 transition hover:from-primary-500 hover:to-purple-500">
              Cevapla
            </button>
          ) : result && (
            <div className="mt-4 space-y-3">
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${result.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {result.isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {result.isCorrect ? 'Doğru!' : 'Yanlış!'} +{result.xpGained} XP
              </div>
              {result.solutionText && (
                <div className="bg-dark-700/50 rounded-xl p-4 text-sm text-dark-300">
                  <strong className="text-white">Çözüm:</strong> {result.solutionText}
                </div>
              )}
              {currentIndex < questions.length - 1 ? (
                <button onClick={nextQuestion} className="w-full py-3 bg-dark-700 rounded-xl font-semibold hover:bg-dark-600 transition flex items-center justify-center gap-2">
                  Sonraki Soru <ChevronRight size={18} />
                </button>
              ) : (
                <div className="text-center text-sm text-dark-400 py-2">Tüm soruları tamamladınız!</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
