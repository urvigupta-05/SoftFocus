import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

import AuthPage       from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage  from './pages/DashboardPage';
import TimerPage      from './pages/TimerPage';
import NotesPage      from './pages/NotesPage';
import ProfilePage    from './pages/ProfilePage';

import TopNav      from './components/TopNav';
import Toast       from './components/Toast';

import './styles/layout.css';
import './styles/onboarding.css';
import './styles/profile.css';

// ── Inner app: only rendered when screen === 'app' ───────────────────────────
function MainApp() {
  const { currentPage, setCurrentPage, toast } = useApp();

  return (
    <div className="app-screen">
      <TopNav />

      <div className="app-content">
        {/* Dashboard */}
        <div className={`app-page ${currentPage === 'dashboard' ? 'active' : ''}`}>
          <DashboardPage
            onOpenGoals={() => setCurrentPage('profile')}
            onGoToTimer={() => setCurrentPage('timer')}
            onGoToNotes={() => setCurrentPage('notes')}
          />
        </div>

        {/* Timer — no scroll override */}
        <div className={`app-page timer-no-scroll ${currentPage === 'timer' ? 'active' : ''}`}>
          <TimerPage />
        </div>

        {/* Notes */}
        <div className={`app-page ${currentPage === 'notes' ? 'active' : ''}`}>
          <NotesPage onGoToTimer={() => setCurrentPage('timer')} />
        </div>

        {/* Profile */}
        <div className={`app-page ${currentPage === 'profile' ? 'active' : ''}`}>
          <ProfilePage />
        </div>
      </div>

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}

// ── Router: switches between auth / onboarding / app ────────────────────────
function Router() {
  const { screen } = useApp();

  if (screen === 'auth')        return <AuthPage />;
  if (screen === 'onboarding')  return <OnboardingPage />;
  return <MainApp />;
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
