import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, BookOpen, BarChart3, Users, User, ClipboardList, NotebookPen, Calculator, Swords, TreePine, MessageCircle, Sparkles, Brain } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Ana Sayfa' },
  { to: '/pomodoro', icon: Clock, label: 'Pomodoro' },
  { to: '/questions', icon: BookOpen, label: 'Sorular' },
  { to: '/stats', icon: BarChart3, label: 'Analiz' },
  { to: '/social', icon: Users, label: 'Sosyal' },
];

const sideItems = [
  { to: '/ai-tutor', icon: Sparkles, label: 'AI Asistan' },
  { to: '/study-rooms', icon: MessageCircle, label: 'Çalışma Odaları' },
  { to: '/trials', icon: ClipboardList, label: 'Denemeler' },
  { to: '/flashcards', icon: NotebookPen, label: 'Flashcard' },
  { to: '/skill-tree', icon: TreePine, label: 'Çalışma Haritası' },
  { to: '/bets', icon: Swords, label: 'Bahis & Sözleşme' },
  { to: '/brain-games', icon: Brain, label: 'Beyin Jimnastiği' },
  { to: '/planner', icon: ClipboardList, label: 'Planlama' },
  { to: '/formulas', icon: Calculator, label: 'Formüller' },
  { to: '/notebook', icon: NotebookPen, label: 'Defterim' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export default function Layout() {
  const location = useLocation();
  const isExamPage = location.pathname.startsWith('/exam/');

  if (isExamPage) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-20 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-dark-800 border-r border-dark-700 flex-col z-50">
        <div className="p-6 border-b border-dark-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Dersmatik
          </h1>
          <p className="text-xs text-dark-400 mt-1">YKS Çalışma Arkadaşın</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[...navItems, ...sideItems].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-lg border-t border-dark-700 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  isActive ? 'text-primary-400' : 'text-dark-400'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
