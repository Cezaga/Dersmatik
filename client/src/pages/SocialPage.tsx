import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, Trophy, UserPlus, Swords, MessageCircle, Check, Clock } from 'lucide-react';

interface Friend { id: string; username: string; display_name: string; avatar: string; level: number; xp: number; streak_days: number; status: string; friendship_id: string; }
interface LeaderboardUser { id: string; username: string; display_name: string; level: number; total_xp?: number; question_count?: number; study_minutes?: number; }
interface SearchUser { id: string; username: string; display_name: string; avatar: string; level: number; }
interface PendingReq { friendship_id: string; id: string; username: string; display_name: string; level: number; }

type Tab = 'friends' | 'leaderboard' | 'search';

export default function SocialPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingReq[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [lbType, setLbType] = useState('xp');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  useEffect(() => {
    api.get<Friend[]>('/social/friends').then(setFriends).catch(() => {});
    api.get<PendingReq[]>('/social/friends/pending').then(setPending).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'leaderboard') {
      api.get<LeaderboardUser[]>(`/social/leaderboard?type=${lbType}`).then(setLeaderboard).catch(() => {});
    }
  }, [tab, lbType]);

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;
    const res = await api.get<SearchUser[]>(`/users/search?q=${searchQuery}`);
    setSearchResults(res);
  };

  const sendRequest = async (friendId: string) => {
    await api.post('/social/friends/request', { friendId });
    setSearchResults(prev => prev.filter(u => u.id !== friendId));
  };

  const acceptRequest = async (friendshipId: string) => {
    await api.post('/social/friends/accept', { friendshipId });
    setPending(prev => prev.filter(p => p.friendship_id !== friendshipId));
    const updated = await api.get<Friend[]>('/social/friends');
    setFriends(updated);
  };

  const setRival = async (friendId: string) => {
    await api.post('/social/friends/rival', { friendId });
    const updated = await api.get<Friend[]>('/social/friends');
    setFriends(updated);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sosyal</h1>

      <div className="flex gap-2">
        {([['friends', 'Arkadaslar', Users], ['leaderboard', 'Sıralama', Trophy], ['search', 'Ara', Search]] as [Tab, string, any][]).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && tab === 'friends' && (
        <div className="space-y-2">
          <h3 className="text-sm text-dark-400">Bekleyen Istekler ({pending.length})</h3>
          {pending.map(p => (
            <div key={p.friendship_id} className="bg-dark-800 rounded-xl p-3 border border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold">{p.display_name.charAt(0)}</div>
                <div><div className="font-medium text-sm">{p.display_name}</div><div className="text-xs text-dark-400">@{p.username}</div></div>
              </div>
              <button onClick={() => acceptRequest(p.friendship_id)} className="px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm flex items-center gap-1"><Check size={14} /> Kabul</button>
            </div>
          ))}
        </div>
      )}

      {/* Friends */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.map(f => (
            <div key={f.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold">{f.display_name.charAt(0)}</div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {f.display_name}
                    {f.status === 'rival' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Rakip</span>}
                  </div>
                  <div className="text-xs text-dark-400">Lv.{f.level} - {f.streak_days} gun seri</div>
                </div>
              </div>
              <div className="flex gap-2">
                {f.status !== 'rival' && (
                  <button onClick={() => setRival(f.id)} className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600" title="Rakip yap"><Swords size={16} className="text-red-400" /></button>
                )}
              </div>
            </div>
          ))}
          {friends.length === 0 && <p className="text-center text-dark-400 py-8">Henuz arkadasınız yok. Arama sekmesinden ekleyin!</p>}
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[['xp', 'XP'], ['questions', 'Soru'], ['study_time', 'Sure']].map(([type, label]) => (
              <button key={type} onClick={() => setLbType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${lbType === type ? 'bg-primary-600' : 'bg-dark-700 text-dark-300'}`}>{label}</button>
            ))}
          </div>
          <div className="space-y-2">
            {leaderboard.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border ${u.id === user?.id ? 'bg-primary-600/10 border-primary-500/30' : 'bg-dark-800 border-dark-700'}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-dark-700'}`}>{i + 1}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{u.display_name}</span>
                  <span className="text-xs text-dark-400 ml-2">Lv.{u.level}</span>
                </div>
                <span className="text-sm font-bold text-primary-400">
                  {lbType === 'xp' && `${u.total_xp} XP`}
                  {lbType === 'questions' && `${u.question_count} soru`}
                  {lbType === 'study_time' && `${u.study_minutes} dk`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input placeholder="Kullanıcı adı veya isim ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
            <button onClick={searchUsers} className="px-4 py-3 bg-primary-600 rounded-xl"><Search size={18} /></button>
          </div>
          <div className="space-y-2">
            {searchResults.map(u => (
              <div key={u.id} className="bg-dark-800 rounded-xl p-3 border border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold">{u.display_name.charAt(0)}</div>
                  <div><div className="font-medium text-sm">{u.display_name}</div><div className="text-xs text-dark-400">@{u.username} - Lv.{u.level}</div></div>
                </div>
                <button onClick={() => sendRequest(u.id)} className="px-3 py-2 bg-primary-600/20 text-primary-400 rounded-lg text-sm flex items-center gap-1"><UserPlus size={14} /> Ekle</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
