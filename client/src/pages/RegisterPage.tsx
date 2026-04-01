import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.displayName);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">Dersmatik</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800 rounded-2xl p-8 border border-dark-700 space-y-4">
          <h2 className="text-xl font-semibold text-center">Kayıt Ol</h2>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="block text-sm text-dark-300 mb-2">Görünen Ad</label>
            <input type="text" value={form.displayName} onChange={e => update('displayName', e.target.value)} required
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition" placeholder="Ali Yılmaz" />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Kullanıcı Adı</label>
            <input type="text" value={form.username} onChange={e => update('username', e.target.value)} required
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition" placeholder="aliyilmaz" />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition" placeholder="ali@email.com" />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Şifre</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition pr-12" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl font-semibold hover:from-primary-500 hover:to-purple-500 transition disabled:opacity-50">
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>

          <p className="text-center text-dark-400 text-sm">
            Zaten hesabın var mı? <Link to="/login" className="text-primary-400 hover:text-primary-300">Giris Yap</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
