import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';

interface Question { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; option_e: string; question_number: number; }
interface ExamData { sessionId: string; questions: Question[]; timeLimit: number; }
interface Result { correct: number; wrong: number; empty: number; net: number; xpGained: number; totalQuestions: number; }

export default function ExamPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Load exam data from session storage or re-fetch
    const stored = sessionStorage.getItem(`exam_${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored);
      setExam(data);
      setTimeLeft(data.timeLimit * 60);
    }
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const timer = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { finishExam(); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => {
      if (prev[questionId] === answer) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: answer };
    });
  };

  const finishExam = async () => {
    if (!exam) return;
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    const answerList = exam.questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] || null,
      timeSpent: 0
    }));

    try {
      const res = await api.post<Result>(`/exams/${sessionId}/finish`, { answers: answerList, timeSpent });
      setResult(res);
    } catch {}
  };

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-dark-400">Sınav verisi bulunamadı</p>
        <button onClick={() => navigate('/questions')} className="px-4 py-2 bg-primary-600 rounded-xl">Geri Don</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-6 mt-12 animate-slide-up">
        <h1 className="text-2xl font-bold text-center">Sınav Sonucu</h1>
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary-400">{result.net.toFixed(1)}</div>
            <div className="text-dark-400 mt-1">Net</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-500/10 rounded-xl"><div className="text-2xl font-bold text-green-400">{result.correct}</div><div className="text-xs text-dark-400">Dogru</div></div>
            <div className="text-center p-3 bg-red-500/10 rounded-xl"><div className="text-2xl font-bold text-red-400">{result.wrong}</div><div className="text-xs text-dark-400">Yanlıs</div></div>
            <div className="text-center p-3 bg-dark-700 rounded-xl"><div className="text-2xl font-bold text-dark-300">{result.empty}</div><div className="text-xs text-dark-400">Bos</div></div>
          </div>
          <div className="text-center text-sm text-primary-400">+{result.xpGained} XP kazandın!</div>
          <button onClick={() => navigate('/questions')} className="w-full py-3 bg-primary-600 rounded-xl font-semibold hover:bg-primary-500 transition">Tamam</button>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-dark-800 rounded-xl p-3 border border-dark-700 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className={timeLeft < 300 ? 'text-red-400' : 'text-primary-400'} />
          <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : ''}`}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
        </div>
        <span className="text-sm text-dark-400">{answeredCount}/{exam.questions.length} cevaplanmıs</span>
        <button onClick={() => setShowConfirm(true)} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition flex items-center gap-1">
          <Flag size={14} /> Bitir
        </button>
      </div>

      {/* Question nav */}
      <div className="flex gap-1.5 flex-wrap bg-dark-800 rounded-xl p-3 border border-dark-700">
        {exam.questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrentIndex(i)}
            className={`w-9 h-9 rounded-lg text-xs font-medium transition ${
              i === currentIndex ? 'bg-primary-600 text-white' :
              answers[q.id] ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' :
              'bg-dark-700 text-dark-400 hover:bg-dark-600'
            }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700">
        <div className="text-sm text-dark-400 mb-4">Soru {currentIndex + 1}</div>
        <p className="text-lg mb-6 leading-relaxed">{currentQ.question_text}</p>
        <div className="space-y-3">
          {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => {
            const text = currentQ[`option_${opt.toLowerCase()}` as keyof Question] as string;
            if (!text) return null;
            const selected = answers[currentQ.id] === opt;
            return (
              <button key={opt} onClick={() => setAnswer(currentQ.id, opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected ? 'bg-primary-600/20 border-primary-500/50 text-primary-300' : 'bg-dark-700 border-dark-600 hover:border-dark-400'}`}>
                <span className="font-semibold mr-3">{opt})</span>{text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
          className="flex-1 py-3 bg-dark-800 rounded-xl font-medium border border-dark-700 disabled:opacity-30 flex items-center justify-center gap-1">
          <ChevronLeft size={18} /> Onceki
        </button>
        <button onClick={() => setCurrentIndex(Math.min(exam.questions.length - 1, currentIndex + 1))} disabled={currentIndex === exam.questions.length - 1}
          className="flex-1 py-3 bg-dark-800 rounded-xl font-medium border border-dark-700 disabled:opacity-30 flex items-center justify-center gap-1">
          Sonraki <ChevronRight size={18} />
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-yellow-400"><AlertTriangle size={20} /> <span className="font-semibold">Sınavı Bitir</span></div>
            <p className="text-dark-300 text-sm">{exam.questions.length - answeredCount} soru cevaplanmamıs. Sınavı bitirmek istediginize emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-dark-700 rounded-xl text-sm">Devam Et</button>
              <button onClick={() => { setShowConfirm(false); finishExam(); }} className="flex-1 py-2 bg-red-600 rounded-xl text-sm font-semibold">Bitir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
