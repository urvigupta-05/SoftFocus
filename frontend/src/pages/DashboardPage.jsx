import React, { useMemo, useState , useEffect} from 'react';
import { useApp } from '../context/AppContext';
import {
  getSessionsToday,
  getStreak,
  getWeeklyHours,
  randomQuote,
} from '../context/AppContext';
import Heatmap from '../components/Heatmap';
import '../styles/dashboard.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage({ onOpenGoals, onGoToTimer }) {
  const { user, goals } = useApp();
  const email = user?.email;

  const sessions     = useMemo(() => getSessionsToday(email), [email]);
  const sessionCount = sessions.length;
  const streak       = useMemo(() => getStreak(email), [email, sessionCount]);
  const weeklyHours  = useMemo(() => getWeeklyHours(email), [email, sessionCount]);

  const goalPct  = Math.min(100, Math.round((sessionCount / goals.daily) * 100));
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const [curQuote, setCurQuote] = useState(() => randomQuote());

  function updateQ()
  {
    const newQ = randomQuote();

    setCurQuote(newQ);

    localStorage.setItem("dashQ",newQ);
    localStorage.setItem("dashQtime", Date.now().toString());
  }

  useEffect(() => {

    const oneHr = 60 * 60 * 1000;

    const savedQ = localStorage.getItem("dashQ");
    const savedQtime = localStorage.getItem("dashQtime");

    const curTime = Date.now();

    if( savedQ && savedQtime && (curTime-Number(savedQtime))<oneHr )
    {
      setCurQuote(savedQ);
    }
    else 
    {
      updateQ();
    }

    const interval = setInterval(() => {

      const lastTime = Number(
        localStorage.getItem("dashQtime")
      );

      if (Date.now() - lastTime >= oneHr) {
        updateQ();
      }

    }, 1000);

    return () => {
        clearInterval(interval);
    };

    },[]);

  return (
    <div className="dash-page">

      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-welcome">
          {getGreeting()},<br /><em>let's focus.</em>
        </div>
        <div className="dash-meta">
          <div className="dash-date">{todayStr}</div>
          <div className="dash-streak-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--amber)" stroke="none">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            {streak} day{streak !== 1 ? 's' : ''} streak
          </div>
        </div>
      </div>

      {/* Goal progress bar */}
    <div className='fline'>

      <div className="goal-bar-wrap">
        <div className="goal-bar-label">
          Today's goal — {goals.daily} sessions
        </div>
        <div className="goal-bar-track">
          <div className="goal-bar-fill" style={{ width: `${goalPct}%` }} />
        </div>
        <div className="goal-bar-count">{sessionCount} / {goals.daily}</div>
        <button className="goal-edit-btn" onClick={onOpenGoals}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit goals
        </button>
      </div>

      <div className="quotebox">
        <div className="quote">
          {curQuote}
        </div>
      </div>

    </div>
      {/* Stat cards */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-label">
            <div className="card-label-dot" />
            Sessions today
          </div>
          <div className="card-value">{sessionCount}</div>
          <div className="card-sub">{sessionCount * 25} minutes focused</div>
        </div>

        <div className="card sage">
          <div className="card-label">
            <div className="card-label-dot" style={{ background: 'var(--sage)' }} />
            Current streak
          </div>
          <div className="card-value">{streak}</div>
          <div className="card-sub">{streak === 1 ? 'day' : 'days'} in a row</div>
        </div>

        <div className="card lavender">
          <div className="card-label">
            <div className="card-label-dot" style={{ background: 'var(--lavender)' }} />
            Weekly hours
          </div>
          <div className="card-value">{weeklyHours}</div>
          <div className="card-sub">of {goals.weekly}h goal</div>
        </div>
      </div>

      {/* Heatmap + right column */}
      <div className="dash-grid-wide">
        <Heatmap email={email} weeks={18} />

        <div className="dash-right-col">
          {/* Sessions list */}
          <div className="sessions-card">
            <div className="card-label" style={{ marginBottom: 10 }}>
              <div className="card-label-dot" />
              Today's sessions
            </div>
            {sessionCount === 0 ? (
              <div className="sessions-empty">No sessions yet — start the timer!</div>
            ) : (
              sessions.map((s, i) => {
                const time = new Date(s.completedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div key={s.id} className="session-row">
                    <span className="session-num">{i + 1}</span>
                    <span>Session {i + 1}</span>
                    <span className="session-time">{time}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick actions */}
          <div className="actions-card">
            <div className="actions-title">Quick actions</div>
            <div className="action-btn-col">
              <button className="action-btn" onClick={onGoToTimer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                </svg>
                Start a focus session
              </button>
              <button className="action-btn" onClick={onOpenGoals}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Edit today's goals
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
