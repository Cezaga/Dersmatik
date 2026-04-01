import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  BookOpen,
  Target,
  TrendingUp,
  XCircle,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  question_number: number;
  subject_id?: string;
  topic_id?: string;
  subject_name?: string;
  topic_name?: string;
  exam_type?: string;
  correct_answer?: string;
}

interface ExamData {
  sessionId: string;
  questions: Question[];
  timeLimit: number;
}

interface Result {
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  xpGained: number;
  totalQuestions: number;
}

interface SubjectGroup {
  subjectName: string;
  subjectId: string;
  questions: Question[];
}

interface SubjectResult {
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  total: number;
}

interface WeakTopic {
  topicName: string;
  subjectName: string;
  questionId: string;
  questionNumber: number;
  status: 'wrong' | 'empty';
}

/* ------------------------------------------------------------------ */
/*  TYT / AYT subject ordering                                        */
/* ------------------------------------------------------------------ */

const TYT_SUBJECT_ORDER = [
  'Türkçe',
  'Sosyal Bilimler',
  'Temel Matematik',
  'Fen Bilimleri',
];

const AYT_SUBJECT_ORDER = [
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türk Dili ve Edebiyatı',
  'Tarih',
  'Coğrafya',
  'Felsefe',
];

function subjectSortIndex(name: string, examType: string | undefined): number {
  const order = examType === 'AYT' ? AYT_SUBJECT_ORDER : TYT_SUBJECT_ORDER;
  const idx = order.findIndex(
    (s) => name.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(name.toLowerCase()),
  );
  return idx >= 0 ? idx : 999;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupBySubject(questions: Question[], examType: string | undefined): SubjectGroup[] {
  const map = new Map<string, SubjectGroup>();
  for (const q of questions) {
    const key = q.subject_id || q.subject_name || 'Genel';
    const name = q.subject_name || 'Genel';
    if (!map.has(key)) {
      map.set(key, { subjectName: name, subjectId: key, questions: [] });
    }
    map.get(key)!.questions.push(q);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => subjectSortIndex(a.subjectName, examType) - subjectSortIndex(b.subjectName, examType));
  return groups;
}

/** Rough TYT/AYT score and rank estimation */
function estimateRank(
  totalNet: number,
  totalQuestions: number,
  obp: number,
  examType: string | undefined,
): { score: number; rank: number } {
  const base = examType === 'AYT' ? 160 : 120;
  const score = (totalNet / base) * 500 + obp * 0.12 + 100;

  const table: [number, number][] = [
    [500, 1_000],
    [400, 10_000],
    [350, 50_000],
    [300, 150_000],
    [250, 300_000],
    [200, 500_000],
    [150, 800_000],
    [100, 1_500_000],
    [0, 3_000_000],
  ];

  let rank = table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [sHigh, rHigh] = table[i];
    const [sLow, rLow] = table[i + 1];
    if (score >= sLow && score <= sHigh) {
      const t = (score - sLow) / (sHigh - sLow);
      rank = Math.round(rLow + (rHigh - rLow) * t);
      break;
    }
    if (score > sHigh) {
      rank = rHigh;
      break;
    }
  }
  return { score: Math.round(score * 10) / 10, rank };
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatRank(n: number): string {
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `~${Math.round(n / 1_000)}K`;
  return `~${n}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ExamPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  /* ---- Core state ---- */
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);

  /* ---- OBP (persisted to localStorage) ---- */
  const [obp, setObp] = useState<string>(() => localStorage.getItem('dersmatik_obp') || '');

  const startTime = useRef(Date.now());
  const finishCalledRef = useRef(false);

  /* ---- Derived data ---- */
  const examType = useMemo(() => exam?.questions[0]?.exam_type, [exam]);

  const subjectGroups = useMemo<SubjectGroup[]>(() => {
    if (!exam) return [];
    return groupBySubject(exam.questions, examType);
  }, [exam, examType]);

  const activeGroup = subjectGroups[activeSubjectIdx] ?? null;
  const activeQuestions = activeGroup?.questions ?? [];

  const currentQuestion = useMemo<Question | null>(() => {
    if (!exam) return null;
    return exam.questions[currentIndex] ?? null;
  }, [exam, currentIndex]);

  const answeredCount = useMemo(() => {
    if (!exam) return 0;
    const questionIds = new Set(exam.questions.map((q) => q.id));
    return Object.keys(answers).filter((id) => questionIds.has(id) && answers[id]).length;
  }, [answers, exam]);

  /* ================================================================ */
  /*  Effects                                                          */
  /* ================================================================ */

  /* ---- Load exam from sessionStorage ---- */
  useEffect(() => {
    if (!sessionId) return;
    const stored = sessionStorage.getItem(`exam_${sessionId}`);
    if (!stored) {
      setError('Sınav verisi bulunamadı. Lütfen sınav listesinden tekrar deneyin.');
      return;
    }
    try {
      const data: ExamData = JSON.parse(stored);
      if (!data.questions || data.questions.length === 0) {
        setError('Sınav verisinde soru bulunamadı.');
        return;
      }
      setExam(data);
      setTimeLeft(data.timeLimit * 60);
    } catch {
      setError('Sınav verisi okunamadı. Veri bozulmuş olabilir.');
    }
  }, [sessionId]);

  /* ---- Finish exam (submit answers to API) ---- */
  const finishExam = useCallback(async () => {
    if (!exam || finishCalledRef.current || !sessionId) return;
    finishCalledRef.current = true;
    setSubmitting(true);
    setError(null);

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    const answerList = exam.questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] || null,
      timeSpent: 0,
    }));

    try {
      const res = await api.post<Result>(`/exams/${sessionId}/finish`, {
        answers: answerList,
        timeSpent,
      });
      setResult(res);
      sessionStorage.removeItem(`exam_${sessionId}`);
    } catch (err: unknown) {
      let message = 'Sınav gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as { message: unknown }).message);
      }
      setError(message);
      finishCalledRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [exam, answers, sessionId]);

  /* ---- Countdown timer ---- */
  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result, finishExam]);

  /* ---- Keep activeSubjectIdx in sync when navigating questions ---- */
  useEffect(() => {
    if (!exam || subjectGroups.length === 0) return;
    const q = exam.questions[currentIndex];
    if (!q) return;
    const idx = subjectGroups.findIndex((g) => g.questions.some((gq) => gq.id === q.id));
    if (idx >= 0 && idx !== activeSubjectIdx) {
      setActiveSubjectIdx(idx);
    }
  }, [currentIndex, exam, subjectGroups, activeSubjectIdx]);

  /* ---- Persist OBP to localStorage ---- */
  useEffect(() => {
    if (obp.trim()) {
      localStorage.setItem('dersmatik_obp', obp.trim());
    }
  }, [obp]);

  /* ================================================================ */
  /*  Answer toggle                                                    */
  /* ================================================================ */

  const toggleAnswer = useCallback((questionId: string, option: string) => {
    setAnswers((prev) => {
      if (prev[questionId] === option) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: option };
    });
  }, []);

  /* ================================================================ */
  /*  Navigation helpers                                               */
  /* ================================================================ */

  const goToQuestion = useCallback(
    (globalIdx: number) => {
      if (!exam) return;
      const clamped = Math.max(0, Math.min(globalIdx, exam.questions.length - 1));
      setCurrentIndex(clamped);
    },
    [exam],
  );

  const goToSubject = useCallback(
    (idx: number) => {
      if (!exam) return;
      setActiveSubjectIdx(idx);
      const firstQ = subjectGroups[idx]?.questions[0];
      if (firstQ) {
        const globalIdx = exam.questions.findIndex((q) => q.id === firstQ.id);
        if (globalIdx >= 0) setCurrentIndex(globalIdx);
      }
    },
    [exam, subjectGroups],
  );

  /* ================================================================ */
  /*  Result computations                                              */
  /* ================================================================ */

  const subjectResults = useMemo<SubjectResult[]>(() => {
    if (!result || !exam) return [];
    return subjectGroups.map((g) => {
      let correct = 0;
      let wrong = 0;
      let empty = 0;
      for (const q of g.questions) {
        const selected = answers[q.id];
        if (!selected) {
          empty++;
        } else if (q.correct_answer && selected === q.correct_answer) {
          correct++;
        } else {
          wrong++;
        }
      }
      return {
        subjectName: g.subjectName,
        correct,
        wrong,
        empty,
        net: correct - wrong * 0.25,
        total: g.questions.length,
      };
    });
  }, [result, exam, subjectGroups, answers]);

  const weakTopics = useMemo<WeakTopic[]>(() => {
    if (!result || !exam) return [];
    const topics: WeakTopic[] = [];
    for (const q of exam.questions) {
      const selected = answers[q.id];
      if (!selected) {
        topics.push({
          topicName: q.topic_name || 'Bilinmeyen Konu',
          subjectName: q.subject_name || 'Genel',
          questionId: q.id,
          questionNumber: q.question_number,
          status: 'empty',
        });
      } else if (q.correct_answer && selected !== q.correct_answer) {
        topics.push({
          topicName: q.topic_name || 'Bilinmeyen Konu',
          subjectName: q.subject_name || 'Genel',
          questionId: q.id,
          questionNumber: q.question_number,
          status: 'wrong',
        });
      }
    }
    return topics;
  }, [result, exam, answers]);

  const ranking = useMemo(() => {
    if (!result) return null;
    const obpNum = parseFloat(obp) || 0;
    return estimateRank(result.net, result.totalQuestions, obpNum, examType);
  }, [result, obp, examType]);

  /* ================================================================ */
  /*  RENDER: Loading / Error (no exam data)                           */
  /* ================================================================ */

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
        {error ? (
          <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-6 max-w-md text-center space-y-3">
            <AlertTriangle size={32} className="text-red-400 mx-auto" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-dark-400 text-sm">Sinav yukleniyor...</p>
          </div>
        )}
        <button
          onClick={() => navigate('/questions')}
          className="px-6 py-2.5 bg-primary-600 rounded-xl hover:bg-primary-500 transition font-medium text-sm"
        >
          Geri Don
        </button>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: Result screen                                            */
  /* ================================================================ */

  if (result) {
    const obpNum = parseFloat(obp) || 0;
    const wrongTopics = weakTopics.filter((t) => t.status === 'wrong');
    const emptyTopics = weakTopics.filter((t) => t.status === 'empty');

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 mt-6 animate-slide-up pb-20">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center">Sinav Sonucu</h1>

        {/* Overall net */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-5">
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {result.net.toFixed(2)}
            </div>
            <div className="text-dark-400 mt-1">Toplam Net</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-500/10 rounded-xl">
              <div className="text-2xl font-bold text-green-400">{result.correct}</div>
              <div className="text-xs text-dark-400">Dogru</div>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-xl">
              <div className="text-2xl font-bold text-red-400">{result.wrong}</div>
              <div className="text-xs text-dark-400">Yanlis</div>
            </div>
            <div className="text-center p-3 bg-dark-700 rounded-xl">
              <div className="text-2xl font-bold text-dark-300">{result.empty}</div>
              <div className="text-xs text-dark-400">Bos</div>
            </div>
          </div>

          {result.xpGained > 0 && (
            <div className="text-center text-sm text-primary-400">
              +{result.xpGained} XP kazandin!
            </div>
          )}
        </div>

        {/* Per-subject breakdown */}
        {subjectResults.length > 0 && (
          <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-primary-400" />
              Ders Bazli Sonuclar
            </h2>
            <div className="space-y-3">
              {subjectResults.map((sr) => {
                const pct = sr.total > 0 ? Math.max(0, (sr.net / sr.total) * 100) : 0;
                return (
                  <div key={sr.subjectName} className="bg-dark-700/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{sr.subjectName}</span>
                      <span className="text-primary-400 font-bold text-sm">
                        {sr.net.toFixed(2)} net
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-dark-400">
                      <span className="text-green-400">{sr.correct}D</span>
                      <span className="text-red-400">{sr.wrong}Y</span>
                      <span>{sr.empty}B</span>
                      <span className="ml-auto">/ {sr.total} soru</span>
                    </div>
                    <div className="w-full bg-dark-600 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-primary-600 to-purple-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OBP + Rank estimation */}
        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-400" />
            Siralama Tahmini
          </h2>

          <div className="space-y-2">
            <label className="text-sm text-dark-400">OBP (Ortaogretim Basari Puani)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={obp}
              onChange={(e) => setObp(e.target.value)}
              placeholder="Orn: 85.50"
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition"
            />
          </div>

          {ranking && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                <div className="text-2xl font-bold text-primary-400">{ranking.score}</div>
                <div className="text-xs text-dark-400 mt-1">Tahmini Puan</div>
              </div>
              <div className="text-center p-4 bg-dark-700/50 rounded-xl">
                <div className="text-2xl font-bold text-purple-400">{formatRank(ranking.rank)}</div>
                <div className="text-xs text-dark-400 mt-1">Tahmini Siralama</div>
              </div>
            </div>
          )}

          {obpNum === 0 && (
            <p className="text-xs text-dark-500">
              OBP girilmedigi icin puan hesabinda 0 olarak alindi.
            </p>
          )}
        </div>

        {/* Weak topics */}
        {weakTopics.length > 0 && (
          <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Target size={18} className="text-red-400" />
              Zayif Konular
              <span className="text-xs text-dark-500 ml-auto">
                {wrongTopics.length} yanlis, {emptyTopics.length} bos
              </span>
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {weakTopics.map((wt) => (
                <div
                  key={wt.questionId}
                  className="flex items-center gap-3 bg-dark-700/50 rounded-xl px-4 py-2.5 text-sm"
                >
                  {wt.status === 'wrong' ? (
                    <XCircle size={16} className="text-red-400 shrink-0" />
                  ) : (
                    <MinusCircle size={16} className="text-dark-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{wt.topicName}</div>
                    <div className="text-xs text-dark-500">
                      {wt.subjectName} &middot; Soru {wt.questionNumber}
                      {wt.status === 'wrong' ? ' (Yanlis)' : ' (Bos)'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate('/questions')}
          className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Tamam
        </button>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: Exam UI                                                  */
  /* ================================================================ */

  const currentQ = currentQuestion;
  const unansweredCount = exam.questions.length - answeredCount;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24">
      {/* ---- Top bar: Timer + Progress + Finish ---- */}
      <div className="flex items-center justify-between bg-dark-800 rounded-xl p-3 border border-dark-700 sticky top-0 z-20">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className={timeLeft < 300 ? 'text-red-400' : 'text-primary-400'} />
          <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <span className="text-sm text-dark-400">
          {answeredCount}/{exam.questions.length} cevaplandi
        </span>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition flex items-center gap-1 disabled:opacity-50"
        >
          <Flag size={14} /> Bitir
        </button>
      </div>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="bg-red-600/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400/60 hover:text-red-400 transition"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* ---- Subject tabs ---- */}
      {subjectGroups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-dark-800 rounded-xl p-2 border border-dark-700 sticky top-[60px] z-10 scrollbar-none">
          {subjectGroups.map((group, idx) => {
            const answeredInGroup = group.questions.filter((q) => !!answers[q.id]).length;
            const isActive = idx === activeSubjectIdx;
            return (
              <button
                key={group.subjectId}
                onClick={() => goToSubject(idx)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                }`}
              >
                {group.subjectName}
                <span className="ml-1.5 opacity-70">
                  ({answeredInGroup}/{group.questions.length})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Question navigation grid (scoped to active subject) ---- */}
      <div className="flex gap-1.5 flex-wrap bg-dark-800 rounded-xl p-3 border border-dark-700">
        {activeQuestions.map((q) => {
          const globalIdx = exam.questions.findIndex((eq) => eq.id === q.id);
          const isCurrent = globalIdx === currentIndex;
          const isAnswered = !!answers[q.id];
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(globalIdx)}
              className={`w-9 h-9 rounded-lg text-xs font-medium transition ${
                isCurrent
                  ? 'bg-primary-600 text-white ring-2 ring-primary-400/50'
                  : isAnswered
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
              }`}
            >
              {q.question_number || globalIdx + 1}
            </button>
          );
        })}
      </div>

      {/* ---- Question card ---- */}
      {currentQ && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-dark-400">
              Soru {currentQ.question_number || currentIndex + 1}
            </span>
            {currentQ.subject_name && (
              <span className="text-xs bg-dark-700 text-dark-400 px-2 py-1 rounded-lg">
                {currentQ.subject_name}
                {currentQ.topic_name ? ` / ${currentQ.topic_name}` : ''}
              </span>
            )}
          </div>

          <p className="text-lg mb-6 leading-relaxed whitespace-pre-wrap">
            {currentQ.question_text}
          </p>

          <div className="space-y-3">
            {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
              const key = `option_${opt.toLowerCase()}` as keyof Question;
              const text = currentQ[key] as string | undefined;
              if (!text) return null;
              const selected = answers[currentQ.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => toggleAnswer(currentQ.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                    selected
                      ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                      : 'bg-dark-700 border-dark-600 hover:border-dark-400'
                  }`}
                >
                  <span className="font-semibold mr-3">{opt})</span>
                  {text}
                </button>
              );
            })}
          </div>

          {/* Selected indicator */}
          {answers[currentQ.id] && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-primary-400">
              <CheckCircle2 size={14} />
              {answers[currentQ.id]} sikki secildi
              <button
                onClick={() => toggleAnswer(currentQ.id, answers[currentQ.id])}
                className="ml-2 text-dark-500 hover:text-red-400 transition text-xs underline"
              >
                Temizle
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Prev / Next buttons ---- */}
      <div className="flex gap-3">
        <button
          onClick={() => goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex-1 py-3 bg-dark-800 rounded-xl font-medium border border-dark-700 disabled:opacity-30 flex items-center justify-center gap-1 hover:bg-dark-700 transition"
        >
          <ChevronLeft size={18} /> Onceki
        </button>
        <button
          onClick={() => goToQuestion(currentIndex + 1)}
          disabled={currentIndex === exam.questions.length - 1}
          className="flex-1 py-3 bg-dark-800 rounded-xl font-medium border border-dark-700 disabled:opacity-30 flex items-center justify-center gap-1 hover:bg-dark-700 transition"
        >
          Sonraki <ChevronRight size={18} />
        </button>
      </div>

      {/* ---- Confirm finish modal ---- */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 max-w-sm w-full space-y-4 animate-slide-up">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle size={20} />
              <span className="font-semibold">Sinavi Bitir</span>
            </div>
            <p className="text-dark-300 text-sm">
              {unansweredCount > 0 ? (
                <>
                  <span className="text-yellow-400 font-semibold">{unansweredCount} soru</span>{' '}
                  cevaplanmamis.
                </>
              ) : (
                'Tum sorular cevaplandi.'
              )}{' '}
              Sinavi bitirmek istediginize emin misiniz?
            </p>

            {/* Per-subject unanswered summary */}
            {unansweredCount > 0 && subjectGroups.length > 1 && (
              <div className="space-y-1 text-xs text-dark-400">
                {subjectGroups.map((g) => {
                  const unanswered = g.questions.filter((q) => !answers[q.id]).length;
                  if (unanswered === 0) return null;
                  return (
                    <div key={g.subjectId} className="flex justify-between">
                      <span>{g.subjectName}</span>
                      <span className="text-yellow-400/70">{unanswered} bos</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-dark-700 rounded-xl text-sm hover:bg-dark-600 transition"
              >
                Devam Et
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  finishExam();
                }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm font-semibold hover:bg-red-500 transition disabled:opacity-50"
              >
                {submitting ? 'Gonderiliyor...' : 'Bitir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
