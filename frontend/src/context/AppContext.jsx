/**
 * AppContext.jsx
 *
 * Hybrid approach:
 *  - If REACT_APP_API_URL is set, all auth/session calls hit the Express backend.
 *  - Falls back to localStorage-only mode for local dev without the server running.
 *
 * Notes are always stored in localStorage (client-side only).
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || ''; // e.g. 'http://localhost:5001'
const USE_API  = Boolean(API_BASE);

// ── API helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('pomo_jwt');
  const res   = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API request failed');
  return data;
}

// ── localStorage fallbacks (used when API is not configured) ─────────────────
function getUsers()     { try { return JSON.parse(localStorage.getItem('pomo_users') || '{}'); } catch { return {}; } }
function saveUsers(u)   { localStorage.setItem('pomo_users', JSON.stringify(u)); }
function getPSession()  { try { return JSON.parse(localStorage.getItem('pomo_session') || 'null'); } catch { return null; } }
function setPSession(u) { localStorage.setItem('pomo_session', JSON.stringify(u)); }
function clearPSession(){ localStorage.removeItem('pomo_session'); }

// ── Session / heatmap localStorage helpers (used locally OR as cache) ─────────
export function getSessionsToday(email) {
  if (!email) return [];
  try {
    const d = JSON.parse(localStorage.getItem('pomo_st_' + email) || 'null');
    const today = new Date().toDateString();
    return d && d.date === today ? d.sessions : [];
  } catch { return []; }
}

export function addSessionToday(email) {
  const today = new Date().toDateString();
  const sessions = getSessionsToday(email);
  sessions.push({ id: Date.now(), completedAt: new Date().toISOString() });
  localStorage.setItem('pomo_st_' + email, JSON.stringify({ date: today, sessions }));
  // Update local heatmap cache
  try {
    const hm  = JSON.parse(localStorage.getItem('pomo_hm_' + email) || '{}');
    const key = new Date().toISOString().split('T')[0];
    hm[key]   = (hm[key] || 0) + 1;
    localStorage.setItem('pomo_hm_' + email, JSON.stringify(hm));
  } catch {}
  return sessions;
}

export function getHeatmap(email) {
  if (!email) return {};
  try { return JSON.parse(localStorage.getItem('pomo_hm_' + email) || '{}'); }
  catch { return {}; }
}

export function getStreak(email) {
  const hm = getHeatmap(email);
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = new Date(d).toISOString().split('T')[0];
    if (hm[k] > 0) { n++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return n;
}

export function getWeeklyHours(email) {
  const hm = getHeatmap(email);
  let total = 0;
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const k = new Date(d).toISOString().split('T')[0];
    total += (hm[k] || 0) * 25;
    d.setDate(d.getDate() - 1);
  }
  return Math.round((total / 60) * 10) / 10;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  // Restore session from storage
  const [screen, setScreen] = useState(() => {
    if (USE_API) {
      const token = localStorage.getItem('pomo_jwt');
      const cached = getPSession();
      return (token && cached) ? 'app' : 'auth';
    }
    const session = getPSession();
    if (session) {
      const ud = getUsers()[session.email];
      return ud ? 'app' : 'auth';
    }
    return 'auth';
  });

  const [user, setUser] = useState(() => {
    const cached = getPSession();
    return cached || null;
  });

  const [goals, setGoalsState] = useState(() => {
    const cached = getPSession();
    if (cached?.goals) return cached.goals;
    if (!USE_API) {
      const ud = getUsers()[cached?.email];
      if (ud) return ud.goals || { daily: 4, weekly: 10, remind: 'gentle' };
    }
    return { daily: 4, weekly: 10, remind: 'gentle' };
  });

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast]             = useState({ show: false, message: '' });

  let toastTO = null;
  const showToast = useCallback((msg) => {
    setToast({ show: true, message: msg });
    clearTimeout(toastTO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    toastTO = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }, []);

  // ── AUTH ────────────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    if (USE_API) {
      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        localStorage.setItem('pomo_jwt', data.token);
        const u = { name: data.user.name, email: data.user.email, goals: data.user.goals };
        setPSession(u);
        setUser(u);
        setGoalsState(data.user.goals);
        // Sync heatmap from server into local cache
        syncHeatmapFromServer(data.user.email);
        setScreen(data.user.onboardingComplete ? 'app' : 'onboarding');
        return { ok: true };
      } catch (err) {
        return { ok: false, field: err.field || 'email', msg: err.error || 'Login failed.' };
      }
    }

    // localStorage fallback
    const users = getUsers();
    if (!users[email]) return { ok: false, field: 'email', msg: 'No account found. Please sign up.' };
    if (users[email].pass !== btoa(password)) return { ok: false, field: 'password', msg: 'Incorrect password.' };
    const ud = users[email];
    const u  = { name: ud.name, email };
    setUser(u);
    setGoalsState(ud.goals || { daily: 4, weekly: 10, remind: 'gentle' });
    setPSession(u);
    setScreen('app');
    return { ok: true };
  }, []);

  const signup = useCallback(async (name, email, password) => {
    if (USE_API) {
      try {
        const data = await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: { name, email, password },
        });
        localStorage.setItem('pomo_jwt', data.token);
        const u = { name: data.user.name, email: data.user.email, goals: data.user.goals };
        setPSession(u);
        setUser(u);
        setGoalsState(data.user.goals);
        setScreen('onboarding');
        return { ok: true };
      } catch (err) {
        return { ok: false, field: err.field || 'email', msg: err.error || 'Signup failed.' };
      }
    }

    // localStorage fallback
    const users = getUsers();
    if (users[email]) return { ok: false, field: 'email', msg: 'An account with this email already exists.' };
    users[email] = { name, pass: btoa(password), goals: { daily: 4, weekly: 10, remind: 'gentle' } };
    saveUsers(users);
    const u = { name, email };
    setUser(u);
    setGoalsState({ daily: 4, weekly: 10, remind: 'gentle' });
    setPSession(u);
    setScreen('onboarding');
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pomo_jwt');
    clearPSession();
    setUser(null);
    setScreen('auth');
    setCurrentPage('dashboard');
  }, []);

  // ── GOALS ───────────────────────────────────────────────────────────────────

  const saveGoals = useCallback(async (newGoals) => {
    setGoalsState(newGoals);
    // Update cached session
    const cached = getPSession();
    if (cached) setPSession({ ...cached, goals: newGoals });

    if (USE_API) {
      try { await apiFetch('/api/users/goals', { method: 'PUT', body: newGoals }); }
      catch (e) { console.warn('Goals sync failed:', e); }
      return;
    }

    // localStorage fallback
    if (user) {
      const users = getUsers();
      if (users[user.email]) { users[user.email].goals = newGoals; saveUsers(users); }
    }
  }, [user]);

  const completeOnboarding = useCallback(async (onboardGoals) => {
    if (USE_API) {
      try { await apiFetch('/api/users/onboarding', { method: 'PUT', body: onboardGoals }); }
      catch (e) { console.warn('Onboarding sync failed:', e); }
    }
    await saveGoals(onboardGoals);
    setScreen('app');
  }, [saveGoals]);

  // ── SESSION SYNC (API mode) ──────────────────────────────────────────────────

  /**
   * Pulls heatmap data from the server and writes it into localStorage cache.
   * Called after login so the dashboard/heatmap works immediately.
   */
  async function syncHeatmapFromServer(email) {
    if (!USE_API) return;
    try {
      const data = await apiFetch('/api/sessions/heatmap');
      localStorage.setItem('pomo_hm_' + email, JSON.stringify(data.data));
    } catch (e) {
      console.warn('Heatmap sync failed:', e);
    }
  }

  /**
   * Records a session — hits the API if available, always updates localStorage cache.
   * Called from useTimer when a focus session completes.
   */
  const recordSession = useCallback(async (email) => {
    // Update local cache first (immediate UI update)
    addSessionToday(email);

    if (USE_API) {
      try {
        const dateKey = new Date().toISOString().split('T')[0];
        await apiFetch('/api/sessions', { method: 'POST', body: { dateKey, durationMinutes: 25 } });
        // Re-sync heatmap so streak is fresh from server
        await syncHeatmapFromServer(email);
      } catch (e) {
        console.warn('Session API sync failed (local cache updated):', e);
      }
    }
  }, []);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      user, goals,
      currentPage, setCurrentPage,
      toast, showToast,
      login, signup, logout,
      saveGoals, completeOnboarding,
      recordSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function randomQuote()
{
  const quoteArr = 
  [ 
    '"There is no limit to what we, as women, can accomplish." — Michelle Obama',
    '"No one can make you feel inferior without your consent." — Eleanor Roosevelt',
    '"A girl should be two things: who and what she wants." — Coco Chanel',
    `"Do not wait for someone else to come and speak for you. It's you who can change the world." — Malala Yousafzai`,
    '"The most courageous act is still to think for yourself. Aloud." — Coco Chanel',
    '"Life shrinks or expands in proportion to one’s courage." — Anaïs Nin',
    '"Power is not given to you. You have to take it." — Beyoncé',
    '"Your life isn’t yours if you constantly care what others think." — Unknown',
    `"If you are always trying to be normal, you'll never know how amazing you can be." — Maya Angelou`,
    '"I was made exactly the way I was meant to be made in who I am." — Megan Rapinoe',
    '"Find out who you are and do it on purpose." — Dolly Parton',
    '"Girls should never be afraid to be smart." — Emma Watson',
    '"I never dreamed about success. I worked for it." — Estée Lauder',
    '"Don\'t ever underestimate the importance you can have because history has shown us that courage can be contagious." — Michelle Obama',
    '"You may encounter many defeats, but you must not be defeated." — Maya Angelou',
    '"You get in life what you have the courage to ask for." — Oprah Winfrey',
    '"The challenge is not to be perfect—it is to be whole." — Jane Fonda',
    '"There is nothing stronger than a broken woman who has rebuilt herself." — Hannah Gadsby',
    '"You are more powerful than you know; you are beautiful just as you are." — Melissa Etheridge',
    '"The difference between successful people and others is how long they spend time feeling sorry for themselves." — Barbara Corcoran'

  ];

  const randomNum = Math.floor(Math.random() * quoteArr.length);

  const randomQ = quoteArr[randomNum];

  return randomQ;

}
