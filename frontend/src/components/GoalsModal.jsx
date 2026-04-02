import React, { useState, useEffect } from 'react';
import Stepper from './Stepper';
import { useApp } from '../context/AppContext';

const REMIND_OPTIONS = [
  { id: 'gentle', icon: '🔔', label: 'Gentle',    desc: 'Soft chime, auto-start break' },
  { id: 'prompt', icon: '⏸️', label: 'Ask me',    desc: 'Pause and wait for your input' },
  { id: 'silent', icon: '🔇', label: 'Silent',     desc: 'No sound, just visual change'  },
  { id: 'long',   icon: '☕', label: 'Long break', desc: '10 min break after each session' },
];

export default function GoalsModal({ open, onClose }) {
  const { goals, saveGoals, showToast } = useApp();

  const [daily,    setDaily]    = useState(goals.daily);
  const [weekly,   setWeekly]   = useState(goals.weekly);
  const [remind,   setRemind]   = useState(goals.remind);

  // Sync when modal opens
  useEffect(() => {
    if (open) {
      setDaily(goals.daily);
      setWeekly(goals.weekly);
      setRemind(goals.remind);
    }
  }, [open, goals]);

  const handleSave = () => {
    saveGoals({ daily, weekly, remind });
    onClose();
    showToast('✓ Goals saved!');
  };

  return (
    <div className={`modal-backdrop ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Edit your goals</div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <Stepper
          label="Daily session target"
          sub="Sessions per day"
          value={daily}
          onChange={setDaily}
          min={1}
          max={12}
        />

        <Stepper
          label="Weekly focus hours"
          sub="Hours per week"
          value={weekly}
          onChange={setWeekly}
          min={1}
          max={40}
        />

        <div className="modal-remind-title">Break reminder style</div>
        <div className="modal-remind-grid">
          {REMIND_OPTIONS.map(opt => (
            <div
              key={opt.id}
              className={`option-card ${remind === opt.id ? 'selected' : ''}`}
              onClick={() => setRemind(opt.id)}
            >
              <div className="option-card-icon">{opt.icon}</div>
              <div className="option-card-label">{opt.label}</div>
              <div className="option-card-desc">{opt.desc}</div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save goals</button>
        </div>
      </div>
    </div>
  );
}
