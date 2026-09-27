import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTimer, formatTime, RING_CIRC } from '../hooks/useTimer';
import { useRain } from '../hooks/useRain';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { getSessionsToday } from '../context/AppContext';
import lofiCatImg from '../assets/lofi_cat.jpg';
import rainyRoomImg from '../assets/rainy_room.jpg';
import cozyRoomImg from '../assets/cozy_room.jpg';
import libraryRoomImg from '../assets/library_room.jpg';
import sunsetRoomImg from '../assets/sunset_room.jpg';
import cafeRoomImg from '../assets/cafe_room.jpg';
import natureRoomImg from '../assets/nature_room.jpg';
import '../styles/timer.css';

// ── Study Room Environments Definition ───────────────────────────────────────
const SCENES = [
  {
    id: 'rainy-room',
    label: 'Rainy Room',
    icon: '🌧️',
    img: rainyRoomImg,
    defaultSound: 'rain',
    desc: 'Rainy window, warm indoor lighting',
    bg: 'linear-gradient(155deg, #fdf6ee 0%, #f7e8db 50%, #eee0d0 100%)',
    ring: '#d98886',
  },
  {
    id: 'cozy-room',
    label: 'Cozy Room',
    icon: '🛋️',
    img: cozyRoomImg,
    defaultSound: 'fireplace',
    desc: 'Warm lamps, blankets, plants',
    bg: 'linear-gradient(155deg, #fdf0f0 0%, #f5dede 50%, #eecece 100%)',
    ring: '#ba6666',
  },
  {
    id: 'library',
    label: 'Library',
    icon: '📚',
    img: libraryRoomImg,
    defaultSound: 'white_noise',
    desc: 'Bookshelves & quiet academic atmosphere',
    bg: 'linear-gradient(155deg, #f4f0f8 0%, #e8ddf5 50%, #ddd0ee 100%)',
    ring: '#8674a6',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    icon: '🌅',
    img: sunsetRoomImg,
    defaultSound: 'waves',
    desc: 'Warm evening lighting',
    bg: 'linear-gradient(155deg, #f7f1e5 0%, #ebe0cd 50%, #ded0b8 100%)',
    ring: '#c47c2b',
  },
  {
    id: 'cafe',
    label: 'Café',
    icon: '☕',
    img: cafeRoomImg,
    defaultSound: 'cafe',
    desc: 'Café study table environment',
    bg: 'linear-gradient(155deg, #fbf8f3 0%, #f4efe6 50%, #eae3d5 100%)',
    ring: '#c47c2b',
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌲',
    img: natureRoomImg,
    defaultSound: 'forest',
    desc: 'Bright natural porch environment',
    bg: 'linear-gradient(155deg, #f0f5f2 0%, #ddeee5 50%, #cce4d8 100%)',
    ring: '#739686',
  },
];

// ── Clean Ambient Sounds List ────────────────────────────────────────────────
const SOUNDS = [
  { id: 'rain',         icon: '🌧️', label: 'Rain'          },
  { id: 'cafe',         icon: '☕', label: 'Café'          },
  { id: 'forest',       icon: '🌿', label: 'Forest'        },
  { id: 'waves',        icon: '🌊', label: 'Waves'         },
  { id: 'fireplace',    icon: '🔥', label: 'Fireplace'     },
  { id: 'white_noise',  icon: '◌', label: 'White Noise'   },
  { id: 'piano',        icon: '🎵', label: 'Lofi Piano'    },
  { id: 'night_crickets',icon: '🌌', label: 'Night Crickets'},
];

export default function TimerPage() {
  const { user, goals, showToast, recordSession } = useApp();
  const email = user?.email;

  // ── Persistence Key ──
  const STORAGE_KEY = `pomo_study_room_config_${email || 'guest'}`;

  // Load Saved Preferences
  const [activeSceneId, setActiveSceneId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).roomId || 'rainy-room';
    } catch {}
    return 'rainy-room';
  });

  const [activeSound, setActiveSound] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).soundId || 'rain';
    } catch {}
    return 'rain';
  });

  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).volume ?? 0.45;
    } catch {}
    return 0.45;
  });

  const [autoChangeBg, setAutoChangeBg] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).autoChangeBg ?? true;
    } catch {}
    return true;
  });

  // UI Modals & Fullscreen State
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState(false);
  const [isFullscreenRoom, setIsFullscreenRoom] = useState(false);

  // Custom Duration State
  const [customPomo, setCustomPomo] = useState(25);
  const [customPomoInput, setCustomPomoInput] = useState('25');

  // Quick Tasks State
  const [quickTasks, setQuickTasks] = useState([
    { id: 1, text: 'Finish project proposal', done: false },
    { id: 2, text: 'Review design feedback',  done: true  },
    { id: 3, text: 'Read chapter 3',          done: false },
    { id: 4, text: 'Plan weekend',           done: false },
  ]);
  const [selectedTaskId, setSelectedTaskId] = useState(1);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // Save Preferences to LocalStorage
  useEffect(() => {
    try {
      const config = {
        roomId: activeSceneId,
        soundId: activeSound,
        volume: volume,
        autoChangeBg: autoChangeBg,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed saving study room config:', e);
    }
  }, [activeSceneId, activeSound, volume, autoChangeBg, STORAGE_KEY]);

  // Rain Canvas & Active Scene Reference
  const rainCanvasRef = useRef(null);
  const activeScene = SCENES.find(s => s.id === activeSceneId) || SCENES[0];

  // Rain Animation Hook
  useRain(rainCanvasRef, activeSceneId === 'rainy-room');

  // Ambient Sound Hook
  const sound = useAmbientSound();

  const toggleSound = useCallback((id) => {
    if (activeSound === id) {
      sound.stopAll();
      setActiveSound(null);
      return;
    }
    const ok = sound.play(id, volume);
    if (ok) setActiveSound(id);
    else showToast('Audio ambient playback enabled! 🎧');
  }, [activeSound, sound, volume, showToast]);

  const handleVolumeChange = useCallback((v) => {
    setVolumeState(v);
    sound.setVolume(v);
  }, [sound]);

  // Handle Room Selection: Immediately updates room image and default sound
  const handleSelectRoom = (roomId) => {
    setActiveSceneId(roomId);
    const targetRoom = SCENES.find(s => s.id === roomId);
    if (targetRoom && targetRoom.defaultSound) {
      setActiveSound(targetRoom.defaultSound);
      sound.play(targetRoom.defaultSound, volume);
    }
    showToast(`Environment set to ${targetRoom?.label} ✨`);
  };

  // Timer Session Completion Handler
  const onSessionComplete = useCallback(() => {
    showToast('🎉 Session complete! Logged to your focus streak.');
  }, [showToast]);

  // Timer Hook with recordSession pass-through
  const timer = useTimer({ userEmail: email, goals, onSessionComplete, recordSession });
  const { setPreset, seconds, isRunning, phase, ringOffset, start, pause, reset, skip } = timer;
  const timeStr = formatTime(seconds);
  const sessionCount = getSessionsToday(email).length;
  const dailyGoal = goals?.daily || 4;

  // Mode Selection Handler
  const handleSelectMode = (mode, e) => {
    if (e) e.stopPropagation();
    setTimerMode(mode);
    if (mode === 'pomodoro') {
      setPreset(`${customPomo}-5`);
    } else if (mode === 'short') {
      setPreset('5-5');
    } else if (mode === 'long') {
      setPreset('15-5');
    } else if (mode === 'custom') {
      setShowSettingsModal(true);
    }
  };

  const handleApplyCustomPomo = (mins) => {
    const validMins = Math.max(1, Math.min(180, Number(mins) || 25));
    setCustomPomo(validMins);
    setPreset(`${validMins}-5`);
    setTimerMode('custom');
    showToast(`Timer set to ${validMins} minutes custom focus! ⏱️`);
  };

  // Quick Tasks Handlers
  const toggleQuickTask = (id, e) => {
    e.stopPropagation();
    setQuickTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleSelectTask = (id) => {
    setSelectedTaskId(id);
  };

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = { id: Date.now(), text: newTaskText.trim(), done: false };
    setQuickTasks(prev => [...prev, newTask]);
    setSelectedTaskId(newTask.id);
    setNewTaskText('');
    setAddingTask(false);
  };

  const selectedTask = quickTasks.find(t => t.id === selectedTaskId);
  const activeSoundObj = SOUNDS.find(s => s.id === activeSound);

  return (
    <div className={`timer-page ${isFullscreenRoom ? 'zen-mode' : ''}`}>
      {/* Visual Background Atmosphere Sync */}
      <div
        className="timer-bg"
        style={{
          background: activeScene.bg,
          backgroundImage: `linear-gradient(rgba(253, 251, 247, 0.72), rgba(253, 251, 247, 0.85)), url(${activeScene.img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Rain canvas */}
      <canvas ref={rainCanvasRef} className="timer-rain-canvas" />

      {/* Dynamic ring stroke */}
      <style>{`.ring-fill { stroke: ${activeScene.ring}; }`}</style>

      {/* Main Workspace Layout (3 Generous Columns) */}
      <div className="timer-workspace-container">
        
        {/* ══════════════════════════════════════════
           LEFT COLUMN: FOCUS BUDDY, QUICK TASKS & SOUND
           ══════════════════════════════════════════ */}
        <div className="timer-col left-col">
          {/* Compact Focus Buddy */}
          <div className="cozy-card compact-buddy-card">
            <img src={lofiCatImg} alt="Focus Buddy Mascot" className="buddy-avatar-sm" />
            <div className="buddy-text-wrap">
              <span className="buddy-badge">Focus Buddy ✨</span>
              <span className="buddy-quote">"You've got this! Stay cozy and take a deep breath."</span>
            </div>
          </div>

          {/* Quick Tasks (Connected directly to timer) */}
          <div className="cozy-card quick-tasks-card">
            <div className="card-header-row">
              <h3 className="card-section-title">Quick Tasks</h3>
              <button
                className="add-task-icon-btn"
                onClick={() => setAddingTask(prev => !prev)}
                title="Add task"
              >
                +
              </button>
            </div>

            {addingTask && (
              <form onSubmit={handleAddTaskSubmit} className="inline-add-task-form">
                <input
                  type="text"
                  className="inline-task-input"
                  placeholder="Task name..."
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="inline-task-submit">Add</button>
              </form>
            )}

            <div className="quick-tasks-list">
              {quickTasks.map(t => {
                const isSelected = selectedTaskId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`qt-item ${t.done ? 'checked' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTask(t.id)}
                  >
                    <div
                      className={`qt-checkbox ${t.done ? 'checked' : ''}`}
                      onClick={(e) => toggleQuickTask(t.id, e)}
                    >
                      {t.done ? '✓' : ''}
                    </div>
                    <span className="qt-text">{t.text}</span>
                    {isSelected && <span className="qt-active-tag">Focusing</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clean Ambient Sound Controls */}
          <div className="cozy-card ambient-sound-card">
            <h3 className="card-section-title">Ambient Sound</h3>
            <div className="sound-tiles-grid">
              {SOUNDS.map(s => (
                <button
                  key={s.id}
                  className={`sound-tile ${activeSound === s.id ? 'active' : ''}`}
                  onClick={() => toggleSound(s.id)}
                >
                  <span className="st-icon">{s.icon}</span>
                  <span className="st-label">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="sound-vol-control">
              <button
                className="sound-play-toggle-btn"
                onClick={() => activeSound ? toggleSound(activeSound) : toggleSound('rain')}
                title={activeSound ? 'Pause sound' : 'Play sound'}
              >
                {activeSound ? '⏸' : '▶'}
              </button>
              <span className="vol-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
           CENTER COLUMN: MAIN TIMER & CONTROLS
           ══════════════════════════════════════════ */}
        <div className="timer-col center-col">
          {/* Mode Switcher Navigation Tabs */}
          <div className="timer-mode-bar">
            <div className="mode-pills-group">
              <button
                className={`mode-pill ${timerMode === 'pomodoro' ? 'active' : ''}`}
                onClick={(e) => handleSelectMode('pomodoro', e)}
              >
                Pomodoro
              </button>
              <button
                className={`mode-pill ${timerMode === 'short' ? 'active' : ''}`}
                onClick={(e) => handleSelectMode('short', e)}
              >
                Short Break
              </button>
              <button
                className={`mode-pill ${timerMode === 'long' ? 'active' : ''}`}
                onClick={(e) => handleSelectMode('long', e)}
              >
                Long Break
              </button>
              <button
                className={`mode-pill ${timerMode === 'custom' ? 'active' : ''}`}
                onClick={(e) => handleSelectMode('custom', e)}
              >
                Custom {timerMode === 'custom' ? `(${customPomo}m)` : ''}
              </button>
            </div>

            <div className="mode-right-actions">
              <button
                className="icon-action-btn"
                title="Timer Settings"
                onClick={(e) => { e.stopPropagation(); setShowSettingsModal(true); }}
              >
                ⚙️
              </button>
              <button
                className={`icon-action-btn ${isFullscreenRoom ? 'active' : ''}`}
                title="Fullscreen Study Environment"
                onClick={(e) => { e.stopPropagation(); setIsFullscreenRoom(true); }}
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Large Functional Circular Timer Stage */}
          <div className="timer-circle-stage">
            <div className="ring-container">
              <svg className="ring-svg" viewBox="0 0 320 320">
                <circle className="ring-track" cx="160" cy="160" r="146" />
                <circle
                  className="ring-fill"
                  cx="160"
                  cy="160"
                  r="146"
                  style={{
                    strokeDasharray: RING_CIRC,
                    strokeDashoffset: ringOffset,
                  }}
                />
              </svg>

              <div className="timer-display-inner">
                <div className="timer-clock-digits">{timeStr}</div>

                {/* Connected Task / Focus Display */}
                <div className="timer-focus-task-display">
                  {phase === 'break' ? (
                    <span className="active-focus-task-name">☕ Short Break</span>
                  ) : selectedTask ? (
                    <span className="active-focus-task-name" title="Current focused task">
                      Focusing on: <strong>{selectedTask.text}</strong>
                    </span>
                  ) : (
                    <span className="active-focus-task-name">Focus Session</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="timer-controls-bar">
            <button className="ctrl-btn reset-btn" onClick={reset} title="Reset Timer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>

            <button
              className="ctrl-btn main-start-btn"
              onClick={isRunning ? pause : start}
            >
              {isRunning ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  <span>Start</span>
                </>
              )}
            </button>

            <button className="ctrl-btn skip-btn" onClick={skip} title="Skip Phase">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/>
              </svg>
            </button>
          </div>

          {/* Session Progress Indicator */}
          <div className="timer-session-dots-bar">
            <div className="dots-row">
              {Array.from({ length: Math.max(4, dailyGoal) }).map((_, i) => (
                <div
                  key={i}
                  className={`dot-item ${i < sessionCount ? 'completed' : ''} ${i === sessionCount && isRunning ? 'active-pulse' : ''}`}
                />
              ))}
            </div>
            <span className="dots-label">{sessionCount} / {dailyGoal} sessions today</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
           RIGHT COLUMN: COMPACT STUDY ROOM PANEL
           ══════════════════════════════════════════ */}
        <div className="timer-col right-col">
          <div className="cozy-card study-room-card">
            <div className="card-header-row">
              <div className="sr-title-wrap">
                <h3 className="card-section-title">Study Room</h3>
                <span className="sr-current-subtitle">Current: {activeScene.icon} {activeScene.label}</span>
              </div>
              <div className="sr-header-btns">
                <button
                  className="sr-icon-btn"
                  onClick={(e) => { e.stopPropagation(); setIsFullscreenRoom(true); }}
                  title="Fullscreen Room"
                >
                  ⛶
                </button>
                <button
                  className="sr-icon-btn"
                  onClick={(e) => { e.stopPropagation(); setShowRoomSettingsModal(true); }}
                  title="Study Room Options"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Large Room Image Preview */}
            <div className="study-room-preview-container">
              <img src={activeScene.img} alt={activeScene.label} className="sr-preview-img" />
              <button
                className="sr-expand-icon-btn"
                onClick={(e) => { e.stopPropagation(); setIsFullscreenRoom(true); }}
                title="Fullscreen Room View"
              >
                ⛶ Fullscreen
              </button>
            </div>

            {/* Small Selectable Environments Grid */}
            <div className="scene-thumbnails-grid">
              {SCENES.map(s => (
                <div
                  key={s.id}
                  className={`scene-thumb-card ${activeSceneId === s.id ? 'active' : ''}`}
                  onClick={() => handleSelectRoom(s.id)}
                >
                  <img src={s.img} alt={s.label} className="st-thumb-img" />
                  <span className="st-thumb-label">{s.icon} {s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
         FULLSCREEN ENVIRONMENT MODE OVERLAY
         ══════════════════════════════════════════ */}
      {isFullscreenRoom && (
        <div className="fullscreen-room-overlay">
          <img src={activeScene.img} alt={activeScene.label} className="fs-bg-img" />
          <div className="fs-overlay-tint" />

          <div className="fs-content-container">
            <div className="fs-header-bar">
              <span className="fs-room-title">{activeScene.icon} {activeScene.label} Study Room</span>
              <button className="fs-exit-btn" onClick={() => setIsFullscreenRoom(false)}>
                ✕ Exit Fullscreen
              </button>
            </div>

            <div className="fs-center-clock">
              <div className="fs-time-digits">{timeStr}</div>
              <div className="fs-task-name">
                {selectedTask ? selectedTask.text : 'Focus Session'}
              </div>

              <button
                className="ctrl-btn main-start-btn fs-play-btn"
                onClick={isRunning ? pause : start}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
            </div>

            <div className="fs-sound-bar">
              <span className="fs-sound-name">
                {activeSoundObj ? activeSoundObj.icon : '🌧️'} {activeSoundObj ? activeSoundObj.label : 'Rain'}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-slider fs-vol-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Study Room Settings Modal */}
      {showRoomSettingsModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowRoomSettingsModal(false); }}>
          <div className="cozy-modal room-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-header">
              <div className="cm-title-group">
                <span className="cm-icon">⛩️</span>
                <h3>Study Room Settings</h3>
              </div>
              <button className="cm-close-btn" onClick={() => setShowRoomSettingsModal(false)}>✕</button>
            </div>
            <div className="cm-body">
              <div className="target-select-group">
                <label>Environment:</label>
                <div className="room-options-list">
                  {SCENES.map(s => (
                    <div
                      key={s.id}
                      className={`room-radio-item ${activeSceneId === s.id ? 'active' : ''}`}
                      onClick={() => handleSelectRoom(s.id)}
                    >
                      <span className="rr-radio">{activeSceneId === s.id ? '●' : '○'}</span>
                      <span className="rr-label">{s.icon} {s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="target-select-group">
                <label>Ambient Sound:</label>
                <div className="sound-options-row">
                  {SOUNDS.map(s => (
                    <button
                      key={s.id}
                      className={`target-pill ${activeSound === s.id ? 'active' : ''}`}
                      onClick={() => toggleSound(s.id)}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-toggle-row">
                <label>Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider"
                />
              </div>

              <div className="setting-toggle-row">
                <label>☑ Change background with timer</label>
                <input
                  type="checkbox"
                  checked={autoChangeBg}
                  onChange={e => setAutoChangeBg(e.target.checked)}
                  className="setting-checkbox"
                />
              </div>

              <div className="setting-toggle-row">
                <label>☐ Fullscreen room view</label>
                <button
                  type="button"
                  className="sr-inline-btn"
                  onClick={() => {
                    setShowRoomSettingsModal(false);
                    setIsFullscreenRoom(true);
                  }}
                >
                  Enter Fullscreen ⛶
                </button>
              </div>
            </div>
            <div className="cm-footer">
              <button className="cm-done-btn" onClick={() => setShowRoomSettingsModal(false)}>Done ✨</button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Interval Settings Modal */}
      {showSettingsModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}>
          <div className="cozy-modal timer-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-header">
              <div className="cm-title-group">
                <span className="cm-icon">⚙️</span>
                <h3>Timer Settings &amp; Duration</h3>
              </div>
              <button className="cm-close-btn" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="cm-body">
              <div className="target-select-group">
                <label>Select Focus Duration (mins):</label>
                <div className="target-pills">
                  {[15, 25, 45, 50, 60, 90].map(m => (
                    <button
                      key={m}
                      className={`target-pill ${customPomo === m ? 'active' : ''}`}
                      onClick={() => {
                        handleApplyCustomPomo(m);
                        setCustomPomoInput(String(m));
                      }}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Minutes Input */}
              <div className="target-select-group" style={{ marginTop: 12 }}>
                <label>Custom Focus Minutes (1-180):</label>
                <div className="custom-input-row" style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    className="ef-input"
                    value={customPomoInput}
                    onChange={e => setCustomPomoInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="ef-submit-btn"
                    onClick={() => handleApplyCustomPomo(customPomoInput)}
                  >
                    Apply Duration
                  </button>
                </div>
              </div>
            </div>

            <div className="cm-footer">
              <button className="cm-done-btn" onClick={() => setShowSettingsModal(false)}>Save &amp; Close ✨</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
