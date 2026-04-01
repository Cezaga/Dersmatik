import { useState, useEffect, useRef } from 'react';
import { Brain, RefreshCw, Trophy, Clock, Zap } from 'lucide-react';

type GameType = 'memory' | 'math' | 'reaction' | 'sequence';

const EMOJIS = ['🔢', '📐', '🧪', '⚛️', '📖', '🌍', '🔬', '🧬', '✍️', '🏛️', '🤔', '🎯'];

export default function BrainGamesPage() {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  const games = [
    { id: 'memory' as GameType, name: 'Hafıza Kartları', desc: 'Kartları eşleştir', icon: '🧠', color: 'from-purple-500 to-pink-500' },
    { id: 'math' as GameType, name: 'Hızlı Matematik', desc: 'İşlemleri hızla çöz', icon: '🔢', color: 'from-blue-500 to-cyan-500' },
    { id: 'reaction' as GameType, name: 'Reaksiyon Testi', desc: 'Tepki sürenizi ölç', icon: '⚡', color: 'from-yellow-500 to-orange-500' },
    { id: 'sequence' as GameType, name: 'Sayı Dizisi', desc: 'Sonraki sayıyı bul', icon: '🔗', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Brain size={24} className="text-primary-400" /> Beyin Jimnastiği</h1>

      {!selectedGame ? (
        <div className="grid grid-cols-2 gap-4">
          {games.map(g => (
            <button key={g.id} onClick={() => setSelectedGame(g.id)}
              className="bg-dark-800 rounded-2xl p-6 border border-dark-700 hover:border-dark-500 transition text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-center text-3xl mx-auto mb-3`}>
                {g.icon}
              </div>
              <div className="font-semibold">{g.name}</div>
              <div className="text-xs text-dark-400 mt-1">{g.desc}</div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedGame(null)} className="text-sm text-dark-400 hover:text-white mb-4 block">← Geri</button>
          {selectedGame === 'memory' && <MemoryGame />}
          {selectedGame === 'math' && <MathGame />}
          {selectedGame === 'reaction' && <ReactionGame />}
          {selectedGame === 'sequence' && <SequenceGame />}
        </div>
      )}
    </div>
  );
}

function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const startGame = () => {
    const selected = EMOJIS.slice(0, 6);
    const pairs = [...selected, ...selected].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    pairs.sort(() => Math.random() - 0.5);
    setCards(pairs);
    setFlippedIds([]);
    setMoves(0);
    setMatched(0);
    setGameOver(false);
  };

  useEffect(() => { startGame(); }, []);

  const flipCard = (id: number) => {
    if (flippedIds.length >= 2 || cards[id].matched || cards[id].flipped) return;
    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          const nc = [...cards];
          nc[a].matched = true;
          nc[b].matched = true;
          setCards(nc);
          setFlippedIds([]);
          const newMatched = matched + 1;
          setMatched(newMatched);
          if (newMatched === 6) setGameOver(true);
        }, 300);
      } else {
        setTimeout(() => {
          const nc = [...cards];
          nc[a].flipped = false;
          nc[b].flipped = false;
          setCards(nc);
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">🧠 Hafıza Kartları</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-dark-400">Hamle: {moves}</span>
          <button onClick={startGame} className="p-2 bg-dark-700 rounded-lg"><RefreshCw size={16} /></button>
        </div>
      </div>
      {gameOver && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-center animate-slide-up">
          <Trophy size={24} className="mx-auto mb-2" /> Tebrikler! {moves} hamlede tamamladınız!
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => (
          <button key={card.id} onClick={() => flipCard(card.id)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 ${
              card.flipped || card.matched ? 'bg-primary-600/20 border border-primary-500/30' : 'bg-dark-700 border border-dark-600 hover:bg-dark-600'
            } ${card.matched ? 'opacity-50' : ''}`}>
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}

function MathGame() {
  const [question, setQuestion] = useState({ text: '', answer: 0 });
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState('');

  const generateQuestion = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;
    if (op === '+') { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 50) + 10; answer = a + b; }
    else if (op === '-') { a = Math.floor(Math.random() * 50) + 30; b = Math.floor(Math.random() * 30) + 1; answer = a - b; }
    else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }
    setQuestion({ text: `${a} ${op} ${b} = ?`, answer });
    setInput('');
  };

  const start = () => { setIsPlaying(true); setScore(0); setTimeLeft(60); generateQuestion(); };

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) { if (timeLeft <= 0) setIsPlaying(false); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [isPlaying, timeLeft]);

  const checkAnswer = () => {
    if (parseInt(input) === question.answer) {
      setScore(s => s + 1);
      setFeedback('✅ Doğru!');
    } else {
      setFeedback(`❌ Yanlış! Cevap: ${question.answer}`);
    }
    setTimeout(() => { setFeedback(''); generateQuestion(); }, 800);
  };

  if (!isPlaying) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-lg font-semibold">🔢 Hızlı Matematik</h2>
        {score > 0 && <div className="text-2xl font-bold text-primary-400">Skor: {score}</div>}
        <button onClick={start} className="px-8 py-3 bg-primary-600 rounded-xl font-semibold">{score > 0 ? 'Tekrar Oyna' : 'Başla'}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-400 flex items-center gap-1"><Clock size={14} /> {timeLeft}s</span>
        <span className="text-sm font-bold text-primary-400">Skor: {score}</span>
      </div>
      <div className="text-4xl font-bold py-8">{question.text}</div>
      {feedback && <div className="text-lg font-semibold animate-slide-up">{feedback}</div>}
      <div className="flex gap-2 justify-center">
        <input type="number" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAnswer()}
          className="w-32 px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white text-center text-xl" autoFocus />
        <button onClick={checkAnswer} className="px-6 py-3 bg-primary-600 rounded-xl font-semibold">→</button>
      </div>
    </div>
  );
}

function ReactionGame() {
  const [state, setState] = useState<'waiting' | 'ready' | 'go' | 'result'>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState(Infinity);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setState('ready');
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => { setState('go'); setStartTime(Date.now()); }, delay);
  };

  const clicked = () => {
    if (state === 'ready') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setState('waiting');
      return;
    }
    if (state === 'go') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      if (time < bestTime) setBestTime(time);
      setState('result');
    }
  };

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-semibold">⚡ Reaksiyon Testi</h2>
      <button onClick={state === 'waiting' || state === 'result' ? start : clicked}
        className={`w-full py-20 rounded-2xl text-xl font-bold transition-all ${
          state === 'ready' ? 'bg-red-600/30 border-2 border-red-500/50 text-red-400' :
          state === 'go' ? 'bg-green-600/30 border-2 border-green-500/50 text-green-400 animate-pulse' :
          'bg-dark-800 border-2 border-dark-700'
        }`}>
        {state === 'waiting' && 'Başlamak için tıklayın'}
        {state === 'ready' && 'Bekleyin... (Yeşil olunca tıklayın)'}
        {state === 'go' && 'ŞİMDİ TIKLA!'}
        {state === 'result' && `${reactionTime} ms! Tekrar oynamak için tıklayın`}
      </button>
      {bestTime < Infinity && <p className="text-sm text-dark-400">En iyi: {bestTime} ms</p>}
    </div>
  );
}

function SequenceGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const generate = () => {
    const patterns = [
      () => { const start = Math.floor(Math.random() * 10) + 1; const step = Math.floor(Math.random() * 5) + 2; return { seq: [start, start + step, start + 2 * step, start + 3 * step], next: start + 4 * step }; },
      () => { const start = Math.floor(Math.random() * 3) + 2; return { seq: [start, start * 2, start * 4, start * 8], next: start * 16 }; },
      () => { const start = Math.floor(Math.random() * 5) + 1; return { seq: [start * 1, start * 4, start * 9, start * 16], next: start * 25 }; },
      () => { const a = Math.floor(Math.random() * 5) + 1; const b = Math.floor(Math.random() * 5) + 1; return { seq: [a, b, a + b, a + 2 * b], next: 2 * a + 3 * b }; },
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]();
    setSequence(pattern.seq);
    setCorrectAnswer(pattern.next);
    setAnswer('');
    setFeedback('');
  };

  useEffect(() => { generate(); }, []);

  const check = () => {
    if (parseInt(answer) === correctAnswer) {
      setScore(s => s + 1);
      setFeedback('✅ Doğru!');
    } else {
      setFeedback(`❌ Yanlış! Cevap: ${correctAnswer}`);
    }
    setTimeout(() => generate(), 1500);
  };

  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">🔗 Sayı Dizisi</h2>
        <span className="text-sm font-bold text-primary-400">Skor: {score}</span>
      </div>
      <div className="flex gap-3 justify-center items-center py-8">
        {sequence.map((n, i) => (
          <div key={i} className="w-16 h-16 bg-dark-700 rounded-xl flex items-center justify-center text-xl font-bold">{n}</div>
        ))}
        <div className="w-16 h-16 bg-primary-600/20 border-2 border-dashed border-primary-500/50 rounded-xl flex items-center justify-center text-xl font-bold text-primary-400">?</div>
      </div>
      {feedback && <div className="text-lg font-semibold animate-slide-up">{feedback}</div>}
      <div className="flex gap-2 justify-center">
        <input type="number" value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
          className="w-32 px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white text-center text-xl" placeholder="?" />
        <button onClick={check} className="px-6 py-3 bg-primary-600 rounded-xl font-semibold">Kontrol</button>
      </div>
    </div>
  );
}
