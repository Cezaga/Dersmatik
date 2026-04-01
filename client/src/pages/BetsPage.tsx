import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Swords, Plus, Clock, Trophy, FileText, Handshake, Mail } from 'lucide-react';

interface Friend { id: string; display_name: string; level: number; }
interface Bet { id: string; challenger_id: string; opponent_id: string; xp_amount: number; bet_type: string; description: string; status: string; challenger_result: number | null; opponent_result: number | null; winner_id: string | null; created_at: string; }
interface Contract { id: string; title: string; target_hours: number; target_period: string; current_hours: number; is_fulfilled: number; start_date: string; end_date: string; }
interface TimeCapsule { id: string; message: string; open_date: string; is_opened: number; from_friend_id: string | null; created_at: string; }

type Tab = 'bets' | 'contracts' | 'capsules';

const BET_TYPES: Record<string, string> = { exam_score: 'Sınav Neti', questions_count: 'Soru Sayısı', study_time: 'Calısma Suresi' };

export default function BetsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('bets');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Bets
  const [bets, setBets] = useState<Bet[]>([]);
  const [newBet, setNewBet] = useState({ opponentId: '', xpAmount: 50, betType: 'exam_score', description: '' });

  // Contracts
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [newContract, setNewContract] = useState({ title: '', targetHours: 10, targetPeriod: 'weekly' });

  // Capsules
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [newCapsule, setNewCapsule] = useState({ message: '', openDate: '', friendId: '' });

  useEffect(() => {
    api.get<Friend[]>('/social/friends').then(setFriends).catch(() => {});
    loadData();
  }, []);

  const loadData = () => {
    api.get<Bet[]>('/social/bets').catch(() => []).then(b => setBets(Array.isArray(b) ? b : []));
    api.get<Contract[]>('/social/contracts').catch(() => []).then(c => setContracts(Array.isArray(c) ? c : []));
    api.get<TimeCapsule[]>('/social/time-capsules').catch(() => []).then(c => setCapsules(Array.isArray(c) ? c : []));
  };

  const createBet = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    await api.post('/social/bets', { ...newBet, expiresAt });
    setShowForm(false);
    loadData();
  };

  const createContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date().toISOString().split('T')[0];
    const days = newContract.targetPeriod === 'daily' ? 1 : 7;
    const endDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    await api.post('/social/contracts', { ...newContract, startDate, endDate });
    setShowForm(false);
    loadData();
  };

  const createCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/social/time-capsules', newCapsule);
    setShowForm(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bahis & Sozlesmeler</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-xl text-sm font-medium">
          <Plus size={16} /> Yeni
        </button>
      </div>

      <div className="flex gap-2">
        {([['bets', 'XP Bahis', Swords], ['contracts', 'Sozlesme', Handshake], ['capsules', 'Zaman Kapsulu', Mail]] as [Tab, string, any][]).map(([t, label, Icon]) => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-primary-600' : 'bg-dark-800 text-dark-300'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* XP Bahis Form */}
      {showForm && tab === 'bets' && (
        <form onSubmit={createBet} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Swords size={20} /> Yeni XP Bahsi</h2>
          <select value={newBet.opponentId} onChange={e => setNewBet(p => ({ ...p, opponentId: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white">
            <option value="">Rakip Sec</option>
            {friends.map(f => <option key={f.id} value={f.id}>{f.display_name} (Lv.{f.level})</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Bahis Miktarı (XP)</label>
              <input type="number" min={10} max={1000} value={newBet.xpAmount} onChange={e => setNewBet(p => ({ ...p, xpAmount: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white" />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Bahis Turu</label>
              <select value={newBet.betType} onChange={e => setNewBet(p => ({ ...p, betType: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                {Object.entries(BET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <input placeholder="Acıklama (orn: Bu hafta senden yuksek net yaparım)" value={newBet.description}
            onChange={e => setNewBet(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-semibold">Bahis Olustur</button>
        </form>
      )}

      {/* Sözleşme Form */}
      {showForm && tab === 'contracts' && (
        <form onSubmit={createContract} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Handshake size={20} /> Yeni Calısma Sozlesmesi</h2>
          <input placeholder="Sozlesme adı (orn: Bu hafta 20 saat calısacagım)" value={newContract.title}
            onChange={e => setNewContract(p => ({ ...p, title: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Hedef Saat</label>
              <input type="number" min={1} value={newContract.targetHours} onChange={e => setNewContract(p => ({ ...p, targetHours: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white" />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Periyot</label>
              <select value={newContract.targetPeriod} onChange={e => setNewContract(p => ({ ...p, targetPeriod: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                <option value="daily">Gunluk</option>
                <option value="weekly">Haftalık</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold">Sozlesme Olustur</button>
        </form>
      )}

      {/* Zaman Kapsülü Form */}
      {showForm && tab === 'capsules' && (
        <form onSubmit={createCapsule} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Mail size={20} /> Yeni Zaman Kapsulu</h2>
          <textarea placeholder="Gelecekteki kendine veya arkadaşına mesaj yaz..." value={newCapsule.message}
            onChange={e => setNewCapsule(p => ({ ...p, message: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white h-28 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Acılma Tarihi</label>
              <input type="date" value={newCapsule.openDate} onChange={e => setNewCapsule(p => ({ ...p, openDate: e.target.value }))} required
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white" />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Kime? (opsiyonel)</label>
              <select value={newCapsule.friendId} onChange={e => setNewCapsule(p => ({ ...p, friendId: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                <option value="">Kendime</option>
                {friends.map(f => <option key={f.id} value={f.id}>{f.display_name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold">Kapsul Olustur</button>
        </form>
      )}

      {/* Bets List */}
      {tab === 'bets' && (
        <div className="space-y-3">
          {bets.map(b => (
            <div key={b.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : b.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                  {b.status === 'pending' ? 'Bekliyor' : b.status === 'active' ? 'Aktif' : 'Bitti'}
                </span>
                <span className="text-sm font-bold text-orange-400">{b.xp_amount} XP</span>
              </div>
              <p className="text-sm">{b.description || BET_TYPES[b.bet_type]}</p>
              {b.winner_id && <p className="text-xs text-green-400 mt-1">{b.winner_id === user?.id ? 'Kazandın!' : 'Kaybettin'}</p>}
            </div>
          ))}
          {bets.length === 0 && <p className="text-center text-dark-400 py-8">Henuz bahis yok. Arkadasınla XP bahsi olustur!</p>}
        </div>
      )}

      {/* Contracts List */}
      {tab === 'contracts' && (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className={`bg-dark-800 rounded-xl p-4 border ${c.is_fulfilled ? 'border-green-500/30' : 'border-dark-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{c.title}</h3>
                {c.is_fulfilled ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Tamamlandı</span>
                  : <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Devam</span>}
              </div>
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (c.current_hours / c.target_hours) * 100)}%` }} />
              </div>
              <div className="text-xs text-dark-400">{c.current_hours}/{c.target_hours} saat - {c.target_period === 'daily' ? 'Gunluk' : 'Haftalık'}</div>
            </div>
          ))}
          {contracts.length === 0 && <p className="text-center text-dark-400 py-8">Henuz sozlesme yok</p>}
        </div>
      )}

      {/* Capsules List */}
      {tab === 'capsules' && (
        <div className="space-y-3">
          {capsules.map(c => {
            const canOpen = new Date(c.open_date) <= new Date();
            return (
              <div key={c.id} className={`bg-dark-800 rounded-xl p-4 border ${c.is_opened ? 'border-primary-500/30' : 'border-dark-700'}`}>
                {c.is_opened || canOpen ? (
                  <div>
                    <div className="text-xs text-primary-400 mb-2">Acılma: {c.open_date}</div>
                    <p className="text-sm italic">"{c.message}"</p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <Clock size={24} className="text-dark-500 mx-auto mb-2" />
                    <p className="text-sm text-dark-400">Bu kapsul {c.open_date} tarihinde acılacak</p>
                  </div>
                )}
              </div>
            );
          })}
          {capsules.length === 0 && <p className="text-center text-dark-400 py-8">Henuz zaman kapsulu yok. Gelecege mesaj bırak!</p>}
        </div>
      )}
    </div>
  );
}
