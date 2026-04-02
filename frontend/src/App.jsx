import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';

import AuthPage       from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage  from './pages/DashboardPage';
import TimerPage      from './pages/TimerPage';
import NotesPage      from './pages/NotesPage';

import TopNav      from './components/TopNav';
import GoalsModal  from './components/GoalsModal';
import Toast       from './components/Toast';

import './styles/layout.css';
import './styles/onboarding.css';

// ── Inner app: only rendered when screen === 'app' ───────────────────────────
function MainApp() {
  const { currentPage, setCurrentPage, toast } = useApp();
  const [goalsOpen, setGoalsOpen] = useState(false);

  return (
    <div className="app-screen">
      <TopNav onOpenGoals={() => setGoalsOpen(true)} />

      <div className="app-content">
        {/* Dashboard */}
        <div className={`app-page ${currentPage === 'dashboard' ? 'active' : ''}`}>
          <DashboardPage
            onOpenGoals={() => setGoalsOpen(true)}
            onGoToTimer={() => setCurrentPage('timer')}
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
      </div>

      <GoalsModal open={goalsOpen} onClose={() => setGoalsOpen(false)} />
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
