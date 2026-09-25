import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTimer, formatTime, RING_CIRC } from '../hooks/useTimer';
import { useRain } from '../hooks/useRain';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { getSessionsToday } from '../context/AppContext';
import '../styles/timer.css';

// ── Theme definitions ────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'default',
    label: 'Parchment',
    desc: 'Warm, soft default',
    bg: 'linear-gradient(155deg,#f7f4f0 0%,#ede8e0 50%,#e4ddd4 100%)',
    ring: 'var(--amber)',
    dark: false,
    preview: 'linear-gradient(135deg,#f7f4f0,#ede8e0)',
  },
  {
    id: 'sage',
    label: 'Sage',
    desc: 'Natural, grounded quiet',
    bg: 'linear-gradient(155deg,#f0f5f2 0%,#ddeee5 50%,#cce4d8 100%)',
    ring: 'var(--sage)',
    dark: false,
    preview: 'linear-gradient(135deg,#f0f5f2,#cce4d8)',
  },
  {
    id: 'blush',
    label: 'Blush',
    desc: 'Soft rosy calm',
    bg: 'linear-gradient(155deg,#fdf0f0 0%,#f5dede 50%,#eecece 100%)',
    ring: 'var(--rose)',
    dark: false,
    preview: 'linear-gradient(135deg,#fdf0f0,#eecece)',
  },
  {
    id: 'lavender',
    label: 'Lavender',
    desc: 'Dreamy, gentle focus',
    bg: 'linear-gradient(155deg,#f4f0f8 0%,#e8ddf5 50%,#ddd0ee 100%)',
    ring: 'var(--lavender)',
    dark: false,
    preview: 'linear-gradient(135deg,#f4f0f8,#ddd0ee)',
  },
  {
    id: 'night-rain',
    label: 'Night Rain ✦',
    desc: 'Deep night with live rain',
    bg: 'linear-gradient(155deg,#1a1e2e 0%,#16203a 50%,#111828 100%)',
    ring: 'rgba(170,155,220,.8)',
    dark: true,
    preview: 'linear-gradient(135deg,#1a1e2e,#111828)',
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    desc: 'Warm amber evening light',
    bg: 'linear-gradient(155deg,#fdf5e4 0%,#f5e4c4 50%,#ecd4a0 100%)',
    ring: '#c0780a',
    dark: false,
    preview: 'linear-gradient(135deg,#fdf5e4,#ecd4a0)',
  },
];

const SOUNDS = [
  { id: 'rain',   icon: '🌧️', label: 'Rain'   },
  { id: 'cafe',   icon: '☕', label: 'Café'   },
  { id: 'forest', icon: '🌿', label: 'Forest' },
  { id: 'waves',  icon: '🌊', label: 'Waves'  },
];

const LINKED_TASKS = [
  { id: 0, label: 'Finish project proposal', color: 'var(--amber)'    },
  { id: 1, label: 'Review design feedback',  color: 'var(--sage)'     },
  { id: 2, label: 'Read chapter 3',          color: 'var(--lavender)' },
];

// ── Subcomponents ────────────────────────────────────────────────────────────
function TimerSidebar({ isNight, activeSound, onToggleSound, volume, onVolume, linkedTaskIdx, onLinkTask, sessionCount, dailyGoal }) {
  return (
    <div className={`timer-sidebar ${isNight ? 'night' : ''}`}>

      {/* Linked tasks */}
      <div className="tsb-section">
        <div className="tsb-title">Link a task</div>
        {LINKED_TASKS.map(t => (
          <div
            key={t.id}
            className={`linked-task-item ${linkedTaskIdx === t.id ? 'selected' : ''}`}
            onClick={() => onLinkTask(t.id)}
          >
            <div className="lt-dot" style={{ background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Ambient sound */}
      <div className="tsb-section">
        <div className="tsb-title">Ambient sound</div>
        <div className="sound-grid">
          {SOUNDS.map(s => (
            <button
              key={s.id}
              className={`snd-btn ${activeSound === s.id ? 'active' : ''}`}
              onClick={() => onToggleSound(s.id)}
            >
              <span className="snd-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
        {activeSound && (
          <div className="vol-wrap">
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={volume}
              onChange={e => onVolume(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Progress (push to bottom) */}
      <div className="tsb-spacer" />
      <div className="tsb-section">
        <div className="tsb-title">Today's progress</div>
        <div className="sidebar-progress-text">
          {sessionCount > 0
            ? `${sessionCount} session${sessionCount > 1 ? 's' : ''} · ${sessionCount * 25} min`
            : 'No sessions yet.'}
        </div>
      </div>
    </div>
  );
}

function TimerCenter({ timer, isNight, sessionCount, dailyGoal, linkedTask, onClearLink }) {
  const { seconds, isRunning, phase, ringOffset, start, pause, reset, skip } = timer;
  const timeStr = formatTime(seconds);

  const hintMap = {
    focus_idle:    'Press play to begin your session.',
    focus_running: "Stay focused. You're doing great.",
    break_idle:    'Take a breath. A short break awaits.',
    break_running: 'Step away for a moment.',
  };
  const hint = hintMap[`${phase}_${isRunning ? 'running' : 'idle'}`];

  // Dots — show up to 4 but respect dailyGoal
  const dotsCount = Math.max(4, dailyGoal);
  
  return (
    <div className="timer-center-wrap">
      <div className="timer-center">
        <div className={`phase-pill ${isNight ? 'night' : ''}`}>
          {phase === 'focus' ? '⏱ Focus session' : '☕ Short break'}
        </div>

        {/* Ring */}
        <div className="ring-container">
          <svg className="ring-svg" viewBox="0 0 300 300" width="300" height="300">
            <circle className={`ring-track ${isNight ? 'night' : ''}`} cx="150" cy="150" r="140" />
            <circle
              className="ring-fill"
              cx="150" cy="150" r="140"
              style={{
                strokeDasharray: RING_CIRC,
                strokeDashoffset: ringOffset,
                stroke: THEMES.find(t => t.id) ? undefined : 'var(--amber)',
              }}
            />
          </svg>
          <div className="timer-inner">
            <div className={`t-time ${isNight ? 'night' : ''}`}>{timeStr}</div>
            <div className={`t-phase-label ${isNight ? 'night' : ''}`}>
              {phase === 'focus' ? 'remaining' : 'break'}
            </div>
          </div>
        </div>

        {/* Session dots */}
        <div className="sdots">
          {Array.from({ length: Math.min(dailyGoal, 8) }).map((_, i) => {
            let cls = '';
            if (i < sessionCount) cls = 'done';
            else if (i === sessionCount && isRunning && phase === 'focus') cls = 'running';
            return <div key={i} className={`sdot ${cls} ${isNight ? 'night' : ''}`} />;
          })}
          <span className={`sdots-label ${isNight ? 'night' : ''}`}>
            {sessionCount} / {dailyGoal} today
          </span>
        </div>

        {/* Linked task badge */}
        {linkedTask && (
          <div className={`linked-badge ${isNight ? 'night' : ''}`} onClick={onClearLink}>
            <div className="lb-dot" style={{ background: linkedTask.color }} />
            {linkedTask.label}
            <span className="lb-remove">✕</span>
          </div>
        )}

        {/* Controls */}
        <div className={`t-controls ${isNight ? 'night' : ''}`}>
          <button className={`t-ctrl ghost ${isNight ? 'night' : ''}`} onClick={reset} title="Reset">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>

          <button className={`t-ctrl main ${isNight ? 'night' : ''}`} onClick={isRunning ? pause : start}>
            {isRunning ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>

          <button className={`t-ctrl ghost ${isNight ? 'night' : ''}`} onClick={skip} title="Skip">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
        </div>

        <div className={`t-hint ${isNight ? 'night' : ''}`}>{hint}</div>
      </div>
    </div>
  );
}

function TimerRightPanel({ isNight, currentTheme, onSetTheme }) {
  return (
    <div className={`timer-right ${isNight ? 'night' : ''}`}>
      <div className="tsb-title" style={{ marginBottom: 8 }}>Background theme</div>
      {THEMES.map(t => (
        <div
          key={t.id}
          className={`theme-name-row ${currentTheme === t.id ? 'active' : ''} ${isNight ? 'night' : ''}`}
          onClick={() => onSetTheme(t.id)}
        >
          <div className="tnr-top">
            <div className="tnr-preview" style={{ background: t.preview }} />
            <div className={`tnr-label ${isNight ? 'night' : ''}`}>{t.label}</div>
          </div>
          <div className={`tnr-desc ${isNight ? 'night' : ''}`}>{t.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TimerPage() {
  const { user, goals, showToast } = useApp();
  const email = user?.email;

  const [themeId,       setThemeId]       = useState('default');
  const [activeSound,   setActiveSound]   = useState(null);
  const [volume,        setVolumeState]   = useState(0.5);
  const [linkedTaskIdx, setLinkedTaskIdx] = useState(null);

  const rainCanvasRef = useRef(null);
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const isNight = theme.dark;

  // Rain
  useRain(rainCanvasRef, themeId === 'night-rain');

  // Sound
  const sound = useAmbientSound();

  const toggleSound = useCallback((id) => {
    if (activeSound === id) {
      sound.stopAll();
      setActiveSound(null);
      return;
    }
    const ok = sound.play(id, volume);
    if (ok) setActiveSound(id);
    else showToast('Audio not available in this browser.');
  }, [activeSound, sound, volume, showToast]);

  const handleVolume = useCallback((v) => {
    setVolumeState(v);
    sound.setVolume(v);
  }, [sound]);

  // Timer
  const onSessionComplete = useCallback(() => {
    showToast('🎉 Session complete! Take a break.');
  }, [showToast]);

  const timer = useTimer({ userEmail: email, goals, onSessionComplete });

  const sessionCount = getSessionsToday(email).length;

  const linkedTask = linkedTaskIdx !== null
    ? LINKED_TASKS.find(t => t.id === linkedTaskIdx)
    : null;

  const handleLinkTask = (id) => {
    setLinkedTaskIdx(prev => prev === id ? null : id);
  };

  return (
    <div className="timer-page">
      <div className="timer-shell">
        {/* Background */}
        <div className="timer-bg" style={{ background: theme.bg }} />

        {/* Rain canvas */}
        <canvas
          ref={rainCanvasRef}
          className="timer-rain-canvas"
          style={{ display: themeId === 'night-rain' ? 'block' : 'none' }}
        />

        {/* Ring stroke color via CSS variable override */}
        <style>{`.ring-fill { stroke: ${theme.ring}; }`}</style>

        <TimerSidebar
          isNight={isNight}
          activeSound={activeSound}
          onToggleSound={toggleSound}
          volume={volume}
          onVolume={handleVolume}
          linkedTaskIdx={linkedTaskIdx}
          onLinkTask={handleLinkTask}
          sessionCount={sessionCount}
          dailyGoal={goals.daily}
        />

        <TimerCenter
          timer={timer}
          isNight={isNight}
          sessionCount={sessionCount}
          dailyGoal={goals.daily}
          linkedTask={linkedTask}
          onClearLink={() => setLinkedTaskIdx(null)}
        />

        <TimerRightPanel
          isNight={isNight}
          currentTheme={themeId}
          onSetTheme={setThemeId}
        />
      </div>
    </div>
  );
}
