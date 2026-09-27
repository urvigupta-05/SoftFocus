import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getSessionsToday,
  getStreak,
  getWeeklyHours,
} from '../context/AppContext';
import CalendarMonth from '../components/Heatmap';
import HydrationModal from '../components/HydrationModal';
import SleepModal from '../components/SleepModal';
import studyRoomBg from '../assets/study_room.jpg';
import '../styles/dashboard.css';

const AFFIRMATIONS = [
  "Become the girl you keep imagining.",
  "Small steps today, big shifts tomorrow.",
  "Focus on your growth, stay soft and disciplined.",
  "Clear mind, calm energy, unstoppable progress.",
  "Create a life that feels good on the inside.",
];

const INITIAL_ROUTINE_ITEMS = [
  {
    id: 'workout',
    title: 'Morning Workout / Yoga',
    duration: '20–30 mins',
    icon: '🧘‍♀️',
    bg: '#f4eefb',
    category: 'Wellness',
    repeat: 'weekdays',
  },
  {
    id: 'skincare',
    title: 'Skincare Routine',
    duration: 'Morning & Night',
    icon: '✨',
    bg: '#fdf6ec',
    category: 'Self Care',
    repeat: 'everyday',
  },
  {
    id: 'reading',
    title: 'Reading & Mindset',
    duration: '15 mins',
    icon: '📖',
    bg: '#eef3fb',
    category: 'Mindset',
    repeat: 'everyday',
  },
  {
    id: 'matcha',
    title: 'Matcha & Stretch',
    duration: '5–10 mins',
    icon: '🍵',
    bg: '#edf5f1',
    category: 'Wellness',
    repeat: 'everyday',
  },
  {
    id: 'haircare',
    title: 'Self Care & Hair Mask',
    duration: '30 mins',
    icon: '🌸',
    bg: '#fcf0f0',
    category: 'Self Care',
    repeat: 'sunday',
  },
];

// Helper: Schedule filter
function isHabitScheduledForDate(habit, dateObj = new Date()) {
  const day = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const repeat = habit.repeat || 'everyday';
  if (repeat === 'everyday') return true;
  if (repeat === 'weekdays') return day >= 1 && day <= 5;
  if (repeat === 'weekends') return day === 0 || day === 6;
  if (repeat === 'mwf') return day === 1 || day === 3 || day === 5;
  if (repeat === 'sunday') return day === 0;
  return true;
}

// Helper: Streak calculation (Does NOT punish non-scheduled days!)
function calculateHabitStreak(habit, email) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const isScheduled = isHabitScheduledForDate(habit, d);
    const dateKey = d.toISOString().split('T')[0];
    const dayComp = JSON.parse(localStorage.getItem(`pomo_routine_comp_${email}_${dateKey}`) || '{}');

    if (isScheduled) {
      if (dayComp[habit.id]) {
        streak++;
      } else {
        if (i > 0) break; // Missed a past scheduled day
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function DashboardPage({ onOpenGoals, onGoToTimer, onGoToNotes }) {
  const { user, goals, showToast } = useApp();
  const email = user?.email || 'guest';

  const todayKey = new Date().toISOString().split('T')[0];
  const sessions = useMemo(() => getSessionsToday(email), [email]);
  const sessionCount = sessions.length;
  const streak = useMemo(() => getStreak(email), [email]);
  const weeklyHours = useMemo(() => getWeeklyHours(email), [email]);

  const dailyGoal = goals?.daily || 4;
  const goalPct = Math.min(100, Math.round((sessionCount / dailyGoal) * 100));
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // 1. Routine Items (Persisted order & custom items)
  const itemsKey = `pomo_routine_items_${email}`;
  const [routineItems, setRoutineItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(itemsKey)) || INITIAL_ROUTINE_ITEMS;
    } catch {
      return INITIAL_ROUTINE_ITEMS;
    }
  });

  // 2. Date-Specific Completion State (Resets daily automatically!)
  const compKey = `pomo_routine_comp_${email}_${todayKey}`;
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(compKey)) || {};
    } catch {
      return {};
    }
  });

  // 3. Hydration & Sleep tracking
  const trackerKey = `pomo_trackers_${email}_${todayKey}`;
  const [trackers, setTrackers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(trackerKey)) || {
        water: 3,
        waterTarget: 8,
        sleep: 7.5,
        sleepQuality: 'Good ✨',
      };
    } catch {
      return { water: 3, waterTarget: 8, sleep: 7.5, sleepQuality: 'Good ✨' };
    }
  });

  // Today's One-Off Focus Tasks
  const todayTasksKey = `pomo_today_tasks_${email}_${todayKey}`;
  const [todayTasks, setTodayTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(todayTasksKey)) || [
        { id: 't1', text: 'Review project proposal', done: false },
        { id: 't2', text: 'Clean sanctuary desk', done: true },
      ];
    } catch {
      return [{ id: 't1', text: 'Review project proposal', done: false }];
    }
  });
  const [newTodayTaskText, setNewTodayTaskText] = useState('');

  // Brain Dump state (Empty by default)
  const brainDumpKey = `pomo_braindump_${email}`;
  const [brainDump, setBrainDump] = useState(() => localStorage.getItem(brainDumpKey) || '');

  // Modals state
  const [hydrationModalOpen, setHydrationModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);

  // Expandable Add Form state
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🧘');
  const [formDuration, setFormDuration] = useState('10 min');
  const [formCategory, setFormCategory] = useState('Wellness');
  const [formRepeat, setFormRepeat] = useState('everyday');

  // Dragging state
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Affirmation cycle
  const [affIdx, setAffIdx] = useState(0);

  // Persist state
  useEffect(() => { localStorage.setItem(itemsKey, JSON.stringify(routineItems)); }, [routineItems, itemsKey]);
  useEffect(() => { localStorage.setItem(compKey, JSON.stringify(completedMap)); }, [completedMap, compKey]);
  useEffect(() => { localStorage.setItem(trackerKey, JSON.stringify(trackers)); }, [trackers, trackerKey]);
  useEffect(() => { localStorage.setItem(todayTasksKey, JSON.stringify(todayTasks)); }, [todayTasks, todayTasksKey]);
  useEffect(() => { localStorage.setItem(brainDumpKey, brainDump); }, [brainDump, brainDumpKey]);

  // Filter applicable routine items for today
  const applicableItems = useMemo(() => {
    return routineItems.filter(item => isHabitScheduledForDate(item, new Date()));
  }, [routineItems]);

  const completedCount = applicableItems.filter(item => Boolean(completedMap[item.id])).length;
  const totalHabits = applicableItems.length;
  const routinePct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Toggle routine item completion (Date-specific + checkmark animation)
  const toggleRoutineItem = (id) => {
    setCompletedMap(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id] && routinePct === 100) {
        showToast('🎉 All daily routines completed! Pure excellence!');
      }
      return next;
    });
  };

  // Add Custom Routine Item
  const handleAddRoutineSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newHabit = {
      id: `habit_${Date.now()}`,
      title: formName.trim(),
      icon: formIcon,
      duration: formDuration.trim() || '10 mins',
      category: formCategory,
      repeat: formRepeat,
      bg: '#fdf6ec',
    };

    setRoutineItems(prev => [...prev, newHabit]);
    setFormName('');
    setAddFormOpen(false);
    showToast('New routine item added! ✨');
  };

  // Delete Routine Item
  const handleDeleteHabit = (id) => {
    setRoutineItems(prev => prev.filter(item => item.id !== id));
    showToast('Routine item deleted.');
  };

  // Reorder Routine Items (Drag & Drop or Up/Down)
  const handleMoveHabit = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= routineItems.length) return;
    const copy = [...routineItems];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setRoutineItems(copy);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    handleMoveHabit(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Today's Task Actions
  const toggleTodayTask = (id) => {
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTodayTask = (e) => {
    e.preventDefault();
    if (!newTodayTaskText.trim()) return;
    setTodayTasks(prev => [...prev, { id: `t_${Date.now()}`, text: newTodayTaskText.trim(), done: false }]);
    setNewTodayTaskText('');
  };

  const deleteTodayTask = (id) => {
    setTodayTasks(prev => prev.filter(t => t.id !== id));
  };

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dash-page-cozy">
      
      {/* ── 1. HERO SANCTUARY BANNER ── */}
      <div className="room-hero-card" style={{ backgroundImage: `linear-gradient(180deg, rgba(43, 37, 29, 0.3) 0%, rgba(43, 37, 29, 0.78) 100%), url(${studyRoomBg})` }}>
        <div className="room-hero-content">
          <div
            className="room-hero-affirmation-badge"
            title="Click to change affirmation"
            onClick={() => setAffIdx((i) => (i + 1) % AFFIRMATIONS.length)}
          >
            ✨ "{AFFIRMATIONS[affIdx]}"
          </div>
          <h1 className="room-hero-headline">Soft Girl Study Sanctuary</h1>
          <p className="room-hero-sub">Cozy bedroom workspace • Rainy focus • Daily wellness & debrief</p>
          <button className="hero-cta-btn" onClick={onGoToTimer}>
            Start Focus Block ⏱️
          </button>
        </div>

        {/* Room Digital Clock Display */}
        <div className="digital-wall-clock">
          <div className="clock-label">SANCTUARY TIME</div>
          <div className="clock-time">{timeString}</div>
          <div className="clock-sub">{todayStr}</div>
        </div>
      </div>

      {/* ── 2. KEY METRICS BAR ── */}
      <div className="metrics-bar-grid">
        <div className="metric-card goal-metric">
          <div className="mc-top">
            <span className="mc-label">Daily Study Goal</span>
            <button className="mc-edit-btn" onClick={onOpenGoals}>Edit ✍️</button>
          </div>
          <div className="mc-main">
            <span className="mc-val">{sessionCount} / {dailyGoal}</span>
            <span className="mc-sub">sessions</span>
          </div>
          <div className="mc-track">
            <div className="mc-fill" style={{ width: `${goalPct}%` }} />
          </div>
        </div>

        <div className="metric-card">
          <div className="mc-label">Focus Streak</div>
          <div className="mc-main">
            <span className="mc-val">{streak}</span>
            <span className="mc-unit">days 🔥</span>
          </div>
          <div className="mc-sub">Consistent study habit</div>
        </div>

        <div className="metric-card">
          <div className="mc-label">Weekly Hours</div>
          <div className="mc-main">
            <span className="mc-val">{weeklyHours}</span>
            <span className="mc-unit">hrs ⏱️</span>
          </div>
          <div className="mc-sub">Total focus this week</div>
        </div>

        <div className="metric-card">
          <div className="mc-label">Focused Today</div>
          <div className="mc-main">
            <span className="mc-val">{sessionCount * 25}</span>
            <span className="mc-unit">mins ☕</span>
          </div>
          <div className="mc-sub">{sessionCount > 0 ? `${sessionCount} blocks completed` : 'No blocks yet today'}</div>
        </div>
      </div>

      {/* ── 3. TWO-COLUMN DASHBOARD GRID ── */}
      <div className="dash-2col-grid">

        {/* LEFT COLUMN: Calendar & Today's Focus Tasks (~60%) */}
        <div className="dash-col main-col">
          
          {/* Current Month Calendar */}
          <div className="cozy-card">
            <div className="cozy-card-title">
              <span>📅 Monthly Study Calendar</span>
              <span className="card-badge-sub">Session Intensity</span>
            </div>
            <CalendarMonth email={email} />
          </div>

          {/* Today's Focused Tasks Block */}
          <div className="cozy-card today-tasks-card">
            <div className="tf-header-row">
              <div className="tf-title-group">
                <div className="tf-main-title">
                  <span className="tf-header-icon">📌</span>
                  <span className="tf-headline">Today's Focused Tasks</span>
                </div>
                <div className="tf-sub-headline">Action items and priority tasks for today ♥</div>
              </div>
              <div className="tf-done-badge">
                {todayTasks.filter(t => t.done).length}/{todayTasks.length} done ({todayTasks.length > 0 ? Math.round((todayTasks.filter(t => t.done).length / todayTasks.length) * 100) : 0}%)
              </div>
            </div>

            {/* Task completion progress bar */}
            {todayTasks.length > 0 && (
              <div className="tf-progress-track">
                <div
                  className="tf-progress-fill"
                  style={{
                    width: `${Math.round((todayTasks.filter(t => t.done).length / todayTasks.length) * 100)}%`
                  }}
                />
              </div>
            )}

            <div className="today-tasks-list">
              {todayTasks.length === 0 ? (
                <div className="empty-tf-state">
                  <span>✨ No tasks logged for today yet. Add one below!</span>
                </div>
              ) : (
                todayTasks.map(t => (
                  <div key={t.id} className={`today-task-row ${t.done ? 'checked' : ''}`}>
                    <div
                      className={`tt-checkbox ${t.done ? 'checked' : ''}`}
                      onClick={() => toggleTodayTask(t.id)}
                    >
                      {t.done ? '✓' : ''}
                    </div>
                    <span className="tt-text" onClick={() => toggleTodayTask(t.id)}>{t.text}</span>
                    
                    <div className="tt-actions">
                      <button className="tt-start-btn" onClick={onGoToTimer} title="Start focus session for this task">
                        <span className="play-icon">▶</span> Start
                      </button>
                      <button className="tt-del-btn" onClick={() => deleteTodayTask(t.id)} title="Delete task">
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Task Input */}
            <form onSubmit={addTodayTask} className="add-today-task-form">
              <input
                type="text"
                className="add-tt-input"
                placeholder="+ Add task specifically for today..."
                value={newTodayTaskText}
                onChange={e => setNewTodayTaskText(e.target.value)}
              />
              <button type="submit" className="add-tt-btn">Add Task ✨</button>
            </form>
          </div>

          {/* Completed Sessions Log */}
          <div className="cozy-card">
            <div className="cozy-card-title">
              <span>☕ Completed Sessions Log</span>
            </div>
            {sessionCount === 0 ? (
              <div className="empty-log-state">
                <span className="empty-icon">☕</span>
                <span>No study blocks logged yet today. Ready to begin?</span>
                <button className="start-inline-btn" onClick={onGoToTimer}>Start 25m Block</button>
              </div>
            ) : (
              <div className="session-log-list">
                {sessions.map((s, i) => {
                  const time = new Date(s.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={s.id} className="log-row-item">
                      <div className="log-index-badge">#{i + 1}</div>
                      <div className="log-info">
                        <span className="log-title">25m Focus Session</span>
                        <span className="log-timestamp">Completed at {time}</span>
                      </div>
                      <div className="log-tag">Completed ✨</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Daily Routine Builder & Brain Dump (~40%) */}
        <div className="dash-col side-col">
          
          {/* ── 1. DAILY ROUTINE BUILDER CARD ── */}
          <div className="cozy-card routine-builder-card">
            <div className="rb-header-row">
              <div className="rb-title-group">
                <div className="rb-main-title">
                  <span className="rb-header-icon">🌸</span>
                  <span className="rb-headline">Daily Routine Builder</span>
                </div>
                <div className="rb-sub-headline">Build your perfect day, one habit at a time ♥</div>
              </div>
              <div className="rb-done-badge">
                {completedCount}/{totalHabits} done ({routinePct}%)
              </div>
            </div>

            {/* Differentiated Top Target Cards (Hydration & Sleep popups!) */}
            <div className="rb-targets-row">
              <div className="target-mini-card hydration" onClick={() => setHydrationModalOpen(true)} title="Open Hydration Tracker">
                <div className="target-icon-wrap water-bg">💧</div>
                <div className="target-info">
                  <span className="target-title">Hydration Target</span>
                  <span className="target-sub">{trackers.water} / {trackers.waterTarget} glasses</span>
                </div>
                <div className="target-arrow">›</div>
              </div>

              <div className="target-mini-card sleep" onClick={() => setSleepModalOpen(true)} title="Open Sleep Log">
                <div className="target-icon-wrap sleep-bg">😴</div>
                <div className="target-info">
                  <span className="target-title">Sleep Log</span>
                  <span className="target-sub">{trackers.sleep} hrs rest</span>
                </div>
                <div className="target-arrow">›</div>
              </div>
            </div>

            {/* Applicable Scheduled Habit Items List (With Drag/Reorder, Streaks, Checkbox Animations) */}
            <div className="rb-habits-list">
              {applicableItems.map((item, idx) => {
                const isChecked = Boolean(completedMap[item.id]);
                const habitStreak = calculateHabitStreak(item, email);

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`rb-habit-row ${isChecked ? 'checked' : ''} ${draggedIndex === idx ? 'is-dragging' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div className="rb-drag-handle" title="Drag to reorder">⋮⋮</div>

                    {/* Animated Checkbox */}
                    <div
                      className={`rb-checkbox ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleRoutineItem(item.id)}
                    >
                      {isChecked ? '✓' : ''}
                    </div>

                    {/* Icon Badge */}
                    <div className="rb-habit-icon-wrap" style={{ background: item.bg || '#fdf6ec' }}>
                      {item.icon || '✨'}
                    </div>

                    {/* Title, Details & Streak */}
                    <div className="rb-habit-text-wrap" onClick={() => toggleRoutineItem(item.id)}>
                      <div className="rb-title-line">
                        <span className="rb-habit-title">{item.title}</span>
                        {habitStreak > 0 && (
                          <span className="rb-streak-tag" title={`${habitStreak} consecutive scheduled days`}>
                            🔥 {habitStreak}d
                          </span>
                        )}
                      </div>
                      <div className="rb-meta-line">
                        <span className="rb-habit-duration">{item.duration}</span>
                        {item.category && <span className="rb-category-tag">{item.category}</span>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="rb-habit-actions">
                      <button
                        className="rb-del-btn"
                        title="Delete routine habit"
                        onClick={() => handleDeleteHabit(item.id)}
                      >
                        ✕
                      </button>
                      <button className="rb-start-btn" onClick={onGoToTimer} title="Start timer session">
                        <span className="play-icon">▶</span> Start
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expandable Add Custom Routine Form */}
            {!addFormOpen ? (
              <button className="rb-add-expand-btn" onClick={() => setAddFormOpen(true)}>
                <span className="rb-add-plus-icon">+</span> Add custom routine item...
              </button>
            ) : (
              <form onSubmit={handleAddRoutineSubmit} className="rb-expandable-form">
                <div className="ef-title">✨ Add Routine Item</div>
                
                <div className="ef-field">
                  <label>Name</label>
                  <input
                    type="text"
                    className="ef-input"
                    placeholder="e.g., 10 min meditation"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="ef-row-2">
                  <div className="ef-field">
                    <label>Icon</label>
                    <input
                      type="text"
                      className="ef-input"
                      placeholder="🧘"
                      value={formIcon}
                      onChange={e => setFormIcon(e.target.value)}
                    />
                  </div>

                  <div className="ef-field">
                    <label>Duration / Details</label>
                    <input
                      type="text"
                      className="ef-input"
                      placeholder="10 mins"
                      value={formDuration}
                      onChange={e => setFormDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ef-row-2">
                  <div className="ef-field">
                    <label>Category</label>
                    <select
                      className="ef-select"
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                    >
                      <option value="Wellness">Wellness</option>
                      <option value="Mindset">Mindset</option>
                      <option value="Self Care">Self Care</option>
                      <option value="Productivity">Productivity</option>
                    </select>
                  </div>

                  <div className="ef-field">
                    <label>Repeat Schedule</label>
                    <select
                      className="ef-select"
                      value={formRepeat}
                      onChange={e => setFormRepeat(e.target.value)}
                    >
                      <option value="everyday">Every day</option>
                      <option value="weekdays">Weekdays (Mon-Fri)</option>
                      <option value="weekends">Weekends (Sat-Sun)</option>
                      <option value="mwf">Mon, Wed, Fri</option>
                      <option value="sunday">Sunday only</option>
                    </select>
                  </div>
                </div>

                <div className="ef-btn-row">
                  <button type="button" className="ef-cancel-btn" onClick={() => setAddFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ef-submit-btn">
                    Add Routine ✨
                  </button>
                </div>
              </form>
            )}

            {/* Save Routine Footer */}
            <div className="rb-footer-row">
              <button
                type="button"
                className="rb-save-btn"
                onClick={() => showToast('Routine saved to your sanctuary workspace! ✨')}
              >
                💾 Save Routine
              </button>
            </div>
          </div>

          {/* ── 2. QUICK BRAIN DUMP CARD ── */}
          <div className="cozy-card brain-dump-card">
            <div className="bd-header-row">
              <div className="bd-title-group">
                <div className="bd-main-title">
                  <span className="bd-header-icon">🧠</span>
                  <span className="bd-headline">Quick Brain Dump</span>
                </div>
                <div className="bd-sub-headline">Get it out of your head ♥</div>
              </div>
              <div className="bd-saved-badge">✓ Auto-saved</div>
            </div>

            {/* Textarea */}
            <div className="bd-textarea-container">
              <textarea
                className="bd-textarea"
                placeholder="• Drink matcha & stretch&#10;• Finish 4 Pomodoro focus blocks&#10;• Read 15 pages chapter 4&#10;• Night skincare & early sleep ✨"
                value={brainDump}
                onChange={(e) => setBrainDump(e.target.value)}
                rows={5}
              />
            </div>

            {/* Bottom Action Footer */}
            <div className="bd-footer-bar">
              <div className="bd-left-actions">
                <button
                  type="button"
                  className="bd-action-btn"
                  onClick={() => setBrainDump('')}
                  title="Clear brain dump text"
                >
                  <span className="btn-icon">:=</span> Clear
                </button>
                <span className="bd-action-sep">|</span>
                <button
                  type="button"
                  className="bd-action-btn"
                  onClick={() =>
                    setBrainDump(
                      "• Drink matcha & stretch\n• Finish 4 Pomodoro focus blocks\n• Read 15 pages chapter 4\n• Night skincare & early sleep ✨"
                    )
                  }
                  title="Insert sample prompts"
                >
                  <span className="btn-icon">🔄</span> Randomize
                </button>
              </div>

              <button
                type="button"
                className="bd-add-routine-btn"
                onClick={() => {
                  if (!brainDump.trim()) return;
                  const lines = brainDump
                    .split('\n')
                    .map((l) => l.replace(/^[•\-*\s]+/, '').trim())
                    .filter(Boolean);

                  if (lines.length === 0) return;

                  lines.forEach((line) => {
                    const customId = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                    setRoutineItems(prev => [
                      ...prev,
                      {
                        id: customId,
                        title: line,
                        icon: '✨',
                        duration: '10 mins',
                        category: 'Mindset',
                        repeat: 'everyday',
                        bg: '#fdf6ec',
                      },
                    ]);
                  });

                  showToast(`Added ${lines.length} items to Daily Routine! ✨`);
                }}
              >
                + Add to Routine
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Pop-up Modals for Hydration & Sleep */}
      <HydrationModal
        open={hydrationModalOpen}
        onClose={() => setHydrationModalOpen(false)}
        water={trackers.water}
        target={trackers.waterTarget}
        onUpdateWater={(w) => setTrackers(t => ({ ...t, water: w }))}
        onUpdateTarget={(tgt) => setTrackers(t => ({ ...t, waterTarget: tgt }))}
      />

      <SleepModal
        open={sleepModalOpen}
        onClose={() => setSleepModalOpen(false)}
        sleepHrs={trackers.sleep}
        quality={trackers.sleepQuality}
        onUpdateSleep={({ hrs, quality }) => setTrackers(t => ({ ...t, sleep: hrs, sleepQuality: quality }))}
      />

    </div>
  );
}
