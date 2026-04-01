import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, RotateCcw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Deck { id: string; title: string; description: string; card_count: number; owner_name: string; is_public: number; }
interface Card { id: string; front: string; back: string; }

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newDeck, setNewDeck] = useState({ title: '', description: '' });
  const [newCard, setNewCard] = useState({ front: '', back: '' });

  useEffect(() => {
    api.get<Deck[]>('/flashcards/decks').then(setDecks).catch(() => {});
  }, []);

  const loadCards = async (deck: Deck) => {
    setSelectedDeck(deck);
    try {
      const c = await api.get<Card[]>(`/flashcards/decks/${deck.id}/review`);
      setCards(c);
      setCurrentIndex(0);
      setFlipped(false);
    } catch {}
  };

  const createDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/flashcards/decks', { ...newDeck, isPublic: true });
      const updated = await api.get<Deck[]>('/flashcards/decks');
      setDecks(updated);
      setShowNewDeck(false);
      setNewDeck({ title: '', description: '' });
    } catch {}
  };

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck) return;
    try {
      await api.post(`/flashcards/decks/${selectedDeck.id}/cards`, newCard);
      setShowAddCard(false);
      setNewCard({ front: '', back: '' });
      loadCards(selectedDeck);
    } catch {}
  };

  const reviewCard = async (quality: number) => {
    if (!cards[currentIndex]) return;
    try {
      await api.post(`/flashcards/cards/${cards[currentIndex].id}/review`, { quality });
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        setCards([]);
        setSelectedDeck(null);
      }
    } catch {}
  };

  if (selectedDeck && cards.length > 0) {
    const card = cards[currentIndex];
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedDeck(null); setCards([]); }} className="text-dark-400 hover:text-white flex items-center gap-1"><ChevronLeft size={18} /> Geri</button>
          <span className="text-sm text-dark-400">{currentIndex + 1}/{cards.length}</span>
        </div>

        <div onClick={() => setFlipped(!flipped)} className="cursor-pointer">
          <div className={`bg-dark-800 rounded-2xl border border-dark-700 p-8 min-h-[250px] flex items-center justify-center text-center transition-all duration-300 ${flipped ? 'bg-primary-600/10 border-primary-500/30' : ''}`}>
            <div>
              <div className="text-xs text-dark-400 mb-4">{flipped ? 'Cevap' : 'Soru'}</div>
              <p className="text-xl font-medium">{flipped ? card.back : card.front}</p>
            </div>
          </div>
        </div>

        {!flipped ? (
          <button onClick={() => setFlipped(true)} className="w-full py-3 bg-primary-600 rounded-xl font-semibold flex items-center justify-center gap-2">
            <RotateCcw size={18} /> Ceviri Gor
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-dark-400 text-center">Ne kadar bildin?</p>
            <div className="flex gap-2">
              {[{ q: 1, label: 'Zor', cls: 'bg-red-600/20 text-red-400 border-red-500/30' },
                { q: 3, label: 'Orta', cls: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' },
                { q: 5, label: 'Kolay', cls: 'bg-green-600/20 text-green-400 border-green-500/30' }].map(({ q, label, cls }) => (
                <button key={q} onClick={() => reviewCard(q)} className={`flex-1 py-3 rounded-xl font-medium border ${cls}`}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcardlar</h1>
        <button onClick={() => setShowNewDeck(!showNewDeck)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-xl text-sm font-medium">
          <Plus size={16} /> Yeni Deste
        </button>
      </div>

      {showNewDeck && (
        <form onSubmit={createDeck} className="bg-dark-800 rounded-2xl p-4 border border-dark-700 space-y-3 animate-slide-up">
          <input placeholder="Deste Adı" value={newDeck.title} onChange={e => setNewDeck(p => ({ ...p, title: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <input placeholder="Acıklama (opsiyonel)" value={newDeck.description} onChange={e => setNewDeck(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <button type="submit" className="w-full py-3 bg-primary-600 rounded-xl font-semibold">Olustur</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {decks.map(deck => (
          <div key={deck.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-dark-500 transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{deck.title}</h3>
              <span className="text-xs text-dark-400">{deck.card_count} kart</span>
            </div>
            {deck.description && <p className="text-sm text-dark-400 mb-3">{deck.description}</p>}
            <div className="flex gap-2">
              <button onClick={() => loadCards(deck)} className="flex-1 py-2 bg-primary-600/20 text-primary-400 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                <BookOpen size={14} /> Calıs
              </button>
              <button onClick={() => { setSelectedDeck(deck); setShowAddCard(true); }} className="px-3 py-2 bg-dark-700 rounded-lg text-sm text-dark-300">
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddCard && selectedDeck && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form onSubmit={addCard} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 max-w-md w-full space-y-4">
            <h2 className="text-lg font-semibold">Kart Ekle - {selectedDeck.title}</h2>
            <textarea placeholder="On Yuz (Soru)" value={newCard.front} onChange={e => setNewCard(p => ({ ...p, front: e.target.value }))} required
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white h-24 resize-none" />
            <textarea placeholder="Arka Yuz (Cevap)" value={newCard.back} onChange={e => setNewCard(p => ({ ...p, back: e.target.value }))} required
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white h-24 resize-none" />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowAddCard(false); setSelectedDeck(null); }} className="flex-1 py-2 bg-dark-700 rounded-xl">Iptal</button>
              <button type="submit" className="flex-1 py-2 bg-primary-600 rounded-xl font-semibold">Ekle</button>
            </div>
          </form>
        </div>
      )}

      {decks.length === 0 && !showNewDeck && <p className="text-center text-dark-400 py-8">Henuz flashcard destesi olusturulmamıs</p>}
    </div>
  );
}
