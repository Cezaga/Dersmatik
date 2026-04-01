import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX } from 'lucide-react';

const PRESETS = [
  { label: '25/5', work: 25, break: 5 },
  { label: '50/10', work: 50, break: 10 },
  { label: '90/20', work: 90, break: 20 },
];

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'Sessiz', emoji: '🔇' },
  { id: 'rain', label: 'Yagmur', emoji: '🌧️' },
  { id: 'forest', label: 'Orman', emoji: '🌲' },
  { id: 'cafe', label: 'Kafe', emoji: '☕' },
  { id: 'fire', label: 'Şomine', emoji: '🔥' },
];

export default function PomodoroPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(preset.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sound, setSound] = useState('none');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = isWork ? preset.work * 60 : preset.break * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsWork(true);
    setTimeLeft(preset.work * 60);
    setSessionId(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [preset]);

  useEffect(() => {
    resetTimer();
  }, [preset, resetTimer]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }

    if (timeLeft === 0) {
      if (isWork && sessionId) {
        api.post(`/gamification/pomodoro/${sessionId}/complete`).catch(() => {});
        setCompletedPomodoros(p => p + 1);
      }
      // Switch mode
      const nextIsWork = !isWork;
      setIsWork(nextIsWork);
      setTimeLeft(nextIsWork ? preset.work * 60 : preset.break * 60);
      setIsRunning(false);
      setSessionId(null);

      // Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(nextIsWork ? 'Mola bitti! Calısmaya devam!' : 'Tebrikler! Mola zamanı!');
      }
    }
  }, [isRunning, timeLeft]);

  const toggleTimer = async () => {
    if (!isRunning && isWork && !sessionId) {
      try {
        const res = await api.post<{ id: string }>('/gamification/pomodoro/start', { duration: preset.work });
        setSessionId(res.id);
      } catch {}
    }
    setIsRunning(!isRunning);
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Pomodoro Zamanlayıcı</h1>

      {/* Presets */}
      <div className="flex gap-2 justify-center">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { if (!isRunning) setPreset(p); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${preset.label === p.label ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="flex justify-center">
        <div className="relative w-72 h-72">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle cx="50" cy="50" r="45" fill="none"
              stroke={isWork ? '#6366f1' : '#10b981'} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-dark-400 mb-2">
              {isWork ? <Brain size={16} /> : <Coffee size={16} />}
              {isWork ? 'Calısma' : 'Mola'}
            </div>
            <div className="text-5xl font-bold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button onClick={resetTimer} className="w-14 h-14 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center hover:bg-dark-700 transition">
          <RotateCcw size={22} />
        </button>
        <button onClick={toggleTimer}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition ${isRunning ? 'bg-red-600 hover:bg-red-500' : 'bg-gradient-to-br from-primary-500 to-purple-600 hover:from-primary-400 hover:to-purple-500'}`}>
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        <div className="w-14 h-14 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center">
          <span className="text-sm font-bold text-primary-400">{completedPomodoros}</span>
        </div>
      </div>

      {/* Ambient Sounds */}
      <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
        <div className="flex items-center gap-2 text-sm text-dark-300 mb-3">
          {sound === 'none' ? <VolumeX size={16} /> : <Volume2 size={16} />}
          Ortam Sesleri
        </div>
        <div className="flex gap-2 flex-wrap">
          {AMBIENT_SOUNDS.map(s => (
            <button key={s.id} onClick={() => setSound(s.id)}
              className={`px-3 py-2 rounded-xl text-sm transition ${sound === s.id ? 'bg-primary-600/20 border border-primary-500/30 text-primary-300' : 'bg-dark-700 text-dark-400 hover:text-white'}`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700 text-center">
        <p className="text-dark-400 text-sm">Bu oturumda <span className="text-primary-400 font-bold">{completedPomodoros}</span> pomodoro tamamladın</p>
      </div>
    </div>
  );
}
