import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PomodoroPage from './pages/PomodoroPage';
import QuestionsPage from './pages/QuestionsPage';
import ExamPage from './pages/ExamPage';
import TrialsPage from './pages/TrialsPage';
import FlashcardsPage from './pages/FlashcardsPage';
import SocialPage from './pages/SocialPage';
import StatsPage from './pages/StatsPage';
import PlannerPage from './pages/PlannerPage';
import ProfilePage from './pages/ProfilePage';
import FormulaPage from './pages/FormulaPage';
import NotebookPage from './pages/NotebookPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="exam/:sessionId" element={<ExamPage />} />
        <Route path="trials" element={<TrialsPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="formulas" element={<FormulaPage />} />
        <Route path="notebook" element={<NotebookPage />} />
      </Route>
    </Routes>
  );
}
