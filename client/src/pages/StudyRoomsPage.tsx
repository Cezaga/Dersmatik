import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { io, Socket } from 'socket.io-client';
import { Plus, Users, MessageCircle, Send, LogOut, Wifi, WifiOff, BookOpen, Coffee } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Room { id: string; name: string; owner_name: string; room_type: string; max_members: number; member_count: number; is_private: number; }
interface Member { id: string; display_name: string; avatar: string; level: number; is_studying: number; }
interface ChatMessage { user: { id: string; display_name: string; avatar: string }; message: string; timestamp: string; }

let socket: Socket | null = null;

export default function StudyRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', roomType: 'silent', maxMembers: 10 });
  const [isStudying, setIsStudying] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api.get<Room[]>('/study-rooms').then(setRooms).catch(() => {});
  }, []);

  const connectSocket = () => {
    if (socket) return;
    const token = localStorage.getItem('dersmatik_token');
    socket = io(window.location.origin, { auth: { token } });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('room:user-joined', ({ user: u }: { user: Member }) => {
      setMembers(prev => {
        if (prev.find(m => m.id === u.id)) return prev;
        return [...prev, { ...u, is_studying: 1 }];
      });
    });
    socket.on('room:user-left', ({ userId }: { userId: string }) => {
      setMembers(prev => prev.filter(m => m.id !== userId));
    });
    socket.on('room:study-status', ({ userId, isStudying: s }: { userId: string; isStudying: boolean }) => {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_studying: s ? 1 : 0 } : m));
    });
  };

  const joinRoom = async (room: Room) => {
    try {
      await api.post(`/study-rooms/${room.id}/join`).catch(() => {}); // may already be member
      setActiveRoom(room);
      const m = await api.get<Member[]>(`/study-rooms/${room.id}/members`);
      setMembers(m);
      setMessages([]);
      connectSocket();
      socket?.emit('room:join', room.id);
    } catch {}
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;
    socket?.emit('room:leave', activeRoom.id);
    await api.post(`/study-rooms/${activeRoom.id}/leave`).catch(() => {});
    setActiveRoom(null);
    setMembers([]);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeRoom) return;
    socket?.emit('room:message', { roomId: activeRoom.id, message: newMessage });
    setNewMessage('');
  };

  const toggleStudying = () => {
    const newState = !isStudying;
    setIsStudying(newState);
    if (activeRoom) {
      socket?.emit('study:status', { roomId: activeRoom.id, isStudying: newState });
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const room = await api.post<Room>('/study-rooms', newRoom);
      setRooms(prev => [room, ...prev]);
      setShowCreate(false);
      setNewRoom({ name: '', roomType: 'silent', maxMembers: 10 });
      joinRoom(room);
    } catch {}
  };

  // Active room view
  if (activeRoom) {
    return (
      <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              {activeRoom.name}
              {connected ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} className="text-red-400" />}
            </h2>
            <span className="text-xs text-dark-400">{members.length} kisi odada</span>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleStudying}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${isStudying ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {isStudying ? <><BookOpen size={14} /> Calısıyorum</> : <><Coffee size={14} /> Moladayım</>}
            </button>
            <button onClick={leaveRoom} className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs flex items-center gap-1">
              <LogOut size={14} /> Cık
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-3 min-h-0">
          {/* Members sidebar */}
          <div className="w-48 bg-dark-800 rounded-xl border border-dark-700 p-3 hidden md:block overflow-y-auto">
            <h3 className="text-xs text-dark-400 mb-3 font-medium">Uyeler ({members.length})</h3>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                      {m.display_name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800 ${m.is_studying ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium truncate max-w-[100px]">{m.display_name}</div>
                    <div className="text-[10px] text-dark-500">Lv.{m.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-dark-500 text-sm py-8">
                  Henuz mesaj yok. Arkadaşlarınla sohbet et!
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.user.id === user?.id ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.user.display_name.charAt(0)}
                  </div>
                  <div className={`max-w-[70%] ${msg.user.id === user?.id ? 'text-right' : ''}`}>
                    <div className="text-[10px] text-dark-500 mb-0.5">{msg.user.display_name}</div>
                    <div className={`inline-block px-3 py-2 rounded-xl text-sm ${msg.user.id === user?.id ? 'bg-primary-600/30 text-primary-200' : 'bg-dark-700 text-dark-200'}`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-dark-700">
              <div className="flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Mesaj yaz..." className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white text-sm" />
                <button onClick={sendMessage} className="px-4 py-2 bg-primary-600 rounded-xl hover:bg-primary-500 transition"><Send size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calısma Odaları</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-xl text-sm font-medium">
          <Plus size={16} /> Oda Olustur
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createRoom} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h2 className="text-lg font-semibold">Yeni Calısma Odası</h2>
          <input placeholder="Oda adı (orn: Matematik Calısma)" value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} required
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Oda Tipi</label>
              <select value={newRoom.roomType} onChange={e => setNewRoom(p => ({ ...p, roomType: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                <option value="silent">Sessiz Calısma</option>
                <option value="voice">Sohbetli</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">Max Kisi</label>
              <input type="number" min={2} max={20} value={newRoom.maxMembers} onChange={e => setNewRoom(p => ({ ...p, maxMembers: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white" />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-primary-600 rounded-xl font-semibold">Olustur</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rooms.map(room => (
          <div key={room.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-dark-500 transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                {room.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${room.room_type === 'silent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                  {room.room_type === 'silent' ? 'Sessiz' : 'Sohbetli'}
                </span>
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-dark-400">
                <Users size={12} className="inline mr-1" />{room.member_count}/{room.max_members} kisi
                <span className="ml-2">Kuran: {room.owner_name}</span>
              </div>
              <button onClick={() => joinRoom(room)}
                className="px-4 py-2 bg-primary-600/20 text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-600/30 transition">
                Katıl
              </button>
            </div>
          </div>
        ))}
      </div>
      {rooms.length === 0 && <p className="text-center text-dark-400 py-8">Henuz calısma odası olusturulmamıs. Ilk sen olustur!</p>}
    </div>
  );
}
