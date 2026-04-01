import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, Trophy, UserPlus, Swords, Check, X, Eye, Calendar, BookOpen, Clock, Flame, Share2, FileText } from 'lucide-react';

interface Friend { id: string; username: string; display_name: string; avatar: string; level: number; xp: number; streak_days: number; status: string; friendship_id: string; }
interface LeaderboardUser { id: string; username: string; display_name: string; level: number; total_xp?: number; question_count?: number; study_minutes?: number; streak_days?: number; }
interface SearchUser { id: string; username: string; display_name: string; avatar: string; level: number; }
interface PendingReq { friendship_id: string; id: string; username: string; display_name: string; level: number; }
interface UserProfile { id: string; username: string; display_name: string; bio: string; level: number; xp: number; total_xp: number; streak_days: number; stats: { total_questions: number; correct_answers: number; total_study_minutes: number; today_study_minutes: number }; recentTrials: { trial_name: string; exam_type: string; total_net: number; exam_date: string }[]; badges: { name: string; icon: string; description: string }[]; }
interface SharedNote { id: string; title: string; content: string; author_name: string; subject_name: string; created_at: string; }

type Tab = 'friends' | 'leaderboard' | 'search' | 'notes';

export default function SocialPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingReq[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [lbType, setLbType] = useState('xp');
  const [lbPeriod, setLbPeriod] = useState('total');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);

  useEffect(() => {
    api.get<Friend[]>('/social/friends').then(setFriends).catch(() => {});
    api.get<PendingReq[]>('/social/friends/pending').then(setPending).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'leaderboard') {
      api.get<LeaderboardUser[]>(`/social/leaderboard?type=${lbType}&period=${lbPeriod}`).then(setLeaderboard).catch(() => {});
    }
    if (tab === 'notes') {
      api.get<SharedNote[]>('/social/notes').then(setSharedNotes).catch(() => {});
    }
  }, [tab, lbType, lbPeriod]);

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

  const viewProfile = async (userId: string) => {
    try {
      const profile = await api.get<UserProfile>(`/users/${userId}`);
      setSelectedProfile(profile);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sosyal</h1>

      <div className="flex gap-2 flex-wrap">
        {([['friends', 'Arkadaşlar', Users], ['leaderboard', 'Sıralama', Trophy], ['notes', 'Notlar', FileText], ['search', 'Ara', Search]] as [Tab, string, any][]).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProfile(null)}>
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 max-w-md w-full max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                  {selectedProfile.display_name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedProfile.display_name}</h2>
                  <p className="text-xs text-dark-400">@{selectedProfile.username} • Lv.{selectedProfile.level}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProfile(null)}><X size={18} className="text-dark-400" /></button>
            </div>

            {selectedProfile.bio && <p className="text-sm text-dark-300 italic">"{selectedProfile.bio}"</p>}

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-dark-700 rounded-xl"><div className="text-lg font-bold text-primary-400">{selectedProfile.total_xp}</div><div className="text-[10px] text-dark-400">XP</div></div>
              <div className="text-center p-3 bg-dark-700 rounded-xl"><div className="text-lg font-bold text-orange-400">{selectedProfile.streak_days}</div><div className="text-[10px] text-dark-400">Seri</div></div>
              <div className="text-center p-3 bg-dark-700 rounded-xl"><div className="text-lg font-bold text-green-400">{selectedProfile.stats?.today_study_minutes || 0} dk</div><div className="text-[10px] text-dark-400">Bugün</div></div>
            </div>

            <div className="bg-dark-700/50 rounded-xl p-3 space-y-1">
              <div className="text-xs text-dark-400 mb-2">İstatistikler</div>
              <div className="flex justify-between text-sm"><span>Toplam Soru</span><span className="font-semibold">{selectedProfile.stats?.total_questions || 0}</span></div>
              <div className="flex justify-between text-sm"><span>Doğru Cevap</span><span className="font-semibold text-green-400">{selectedProfile.stats?.correct_answers || 0}</span></div>
              <div className="flex justify-between text-sm"><span>Çalışma Süresi</span><span className="font-semibold">{Math.round((selectedProfile.stats?.total_study_minutes || 0) / 60)} saat</span></div>
            </div>

            {selectedProfile.badges && selectedProfile.badges.length > 0 && (
              <div>
                <div className="text-xs text-dark-400 mb-2">Rozetler</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedProfile.badges.map((b, i) => (
                    <div key={i} className="bg-dark-700/50 px-2 py-1 rounded-lg text-xs flex items-center gap-1" title={b.description}>
                      {b.icon} {b.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProfile.recentTrials && selectedProfile.recentTrials.length > 0 && (
              <div>
                <div className="text-xs text-dark-400 mb-2">Son Denemeler</div>
                <div className="space-y-2">
                  {selectedProfile.recentTrials.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
                      <div className="text-sm truncate">{t.trial_name} <span className="text-xs text-dark-400">({t.exam_type})</span></div>
                      <span className="text-sm font-bold text-primary-400 shrink-0 ml-2">{t.total_net?.toFixed(1)} net</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pending.length > 0 && tab === 'friends' && (
        <div className="space-y-2">
          <h3 className="text-sm text-dark-400">Bekleyen İstekler ({pending.length})</h3>
          {pending.map(p => (
            <div key={p.friendship_id} className="bg-dark-800 rounded-xl p-3 border border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">{p.display_name.charAt(0)}</div>
                <div className="min-w-0"><div className="font-medium text-sm truncate">{p.display_name}</div><div className="text-xs text-dark-400">@{p.username}</div></div>
              </div>
              <button onClick={() => acceptRequest(p.friendship_id)} className="px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm flex items-center gap-1 shrink-0"><Check size={14} /> Kabul</button>
            </div>
          ))}
        </div>
      )}

      {/* Friends */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.map(f => (
            <div key={f.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold shrink-0">{f.display_name.charAt(0)}</div>
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2 truncate">
                    {f.display_name}
                    {f.status === 'rival' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full shrink-0">Rakip</span>}
                  </div>
                  <div className="text-xs text-dark-400">Lv.{f.level} • {f.streak_days} gün seri • {f.xp} XP</div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => viewProfile(f.id)} className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600" title="Profili gör"><Eye size={16} className="text-primary-400" /></button>
                {f.status !== 'rival' && (
                  <button onClick={() => setRival(f.id)} className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600" title="Rakip yap"><Swords size={16} className="text-red-400" /></button>
                )}
              </div>
            </div>
          ))}
          {friends.length === 0 && <p className="text-center text-dark-400 py-8">Henüz arkadaşınız yok. Arama sekmesinden ekleyin!</p>}
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
              {[['total', 'Toplam'], ['weekly', 'Haftalık']].map(([period, label]) => (
                <button key={period} onClick={() => setLbPeriod(period)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${lbPeriod === period ? 'bg-primary-600 text-white' : 'text-dark-300'}`}>{label}</button>
              ))}
            </div>
            <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
              {[['xp', 'XP'], ['questions', 'Soru'], ['study_time', 'Süre']].map(([type, label]) => (
                <button key={type} onClick={() => setLbType(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${lbType === type ? 'bg-primary-600 text-white' : 'text-dark-300'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {leaderboard.map((u, i) => (
              <div key={u.id} onClick={() => viewProfile(u.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-dark-500 transition ${u.id === user?.id ? 'bg-primary-600/10 border-primary-500/30' : 'bg-dark-800 border-dark-700'}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-dark-700'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{u.display_name}</span>
                  <span className="text-xs text-dark-400">Lv.{u.level}</span>
                </div>
                <span className="text-sm font-bold text-primary-400 shrink-0">
                  {lbType === 'xp' && `${u.total_xp} XP`}
                  {lbType === 'questions' && `${u.question_count} soru`}
                  {lbType === 'study_time' && `${u.study_minutes} dk`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Notes */}
      {tab === 'notes' && (
        <div className="space-y-3">
          <h3 className="text-sm text-dark-400">Paylaşılan Notlar</h3>
          {sharedNotes.map(n => (
            <div key={n.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm truncate">{n.title}</h4>
                {n.subject_name && <span className="text-xs text-primary-400 shrink-0 ml-2">{n.subject_name}</span>}
              </div>
              <p className="text-sm text-dark-300 line-clamp-3">{n.content}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-dark-400">
                <span>{n.author_name}</span>
                <span>{n.created_at?.split('T')[0]}</span>
              </div>
            </div>
          ))}
          {sharedNotes.length === 0 && <p className="text-center text-dark-400 py-8">Henüz paylaşılan not yok. Defterimden notlarınızı herkese açık yapın!</p>}
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">{u.display_name.charAt(0)}</div>
                  <div className="min-w-0"><div className="font-medium text-sm truncate">{u.display_name}</div><div className="text-xs text-dark-400">@{u.username} - Lv.{u.level}</div></div>
                </div>
                <button onClick={() => sendRequest(u.id)} className="px-3 py-2 bg-primary-600/20 text-primary-400 rounded-lg text-sm flex items-center gap-1 shrink-0"><UserPlus size={14} /> Ekle</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
