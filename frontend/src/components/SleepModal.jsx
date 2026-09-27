import React, { useState } from 'react';
import '../styles/dashboard.css';

export default function SleepModal({ open, onClose, sleepHrs = 7.5, quality = 'Good ✨', onUpdateSleep }) {
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [hrs, setHrs] = useState(sleepHrs);
  const [sleepQuality, setSleepQuality] = useState(quality);

  if (!open) return null;

  const handleSave = () => {
    onUpdateSleep({ hrs: Number(hrs), quality: sleepQuality });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cozy-modal sleep-modal" onClick={e => e.stopPropagation()}>
        <div className="cm-header">
          <div className="cm-title-group">
            <span className="cm-icon">😴</span>
            <h3>Sleep Log &amp; Rest Quality</h3>
          </div>
          <button className="cm-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cm-body">
          {/* Main Sleep Duration Display */}
          <div className="sleep-display-card">
            <div className="sd-icon">🌙</div>
            <div className="sd-val">{hrs} <span className="sd-unit">hours rest</span></div>
            <div className="sd-badge">{sleepQuality}</div>
          </div>

          {/* Bedtime & Wake Time Inputs */}
          <div className="sleep-inputs-row">
            <div className="sleep-input-group">
              <label>Bedtime 🛏️</label>
              <input
                type="time"
                value={bedtime}
                onChange={e => setBedtime(e.target.value)}
                className="sleep-time-input"
              />
            </div>
            <div className="sleep-input-group">
              <label>Wake Time ⏰</label>
              <input
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="sleep-time-input"
              />
            </div>
          </div>

          {/* Hours slider */}
          <div className="target-select-group">
            <div className="ts-top">
              <label>Logged Hours Rest:</label>
              <span className="ts-val">{hrs} hrs</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              step="0.5"
              value={hrs}
              onChange={e => setHrs(parseFloat(e.target.value))}
              className="form-range"
            />
          </div>

          {/* Sleep Quality Rating */}
          <div className="target-select-group">
            <label>Rest Quality Rating:</label>
            <div className="quality-pills">
              {[
                { label: 'Deep Rest 😴', val: 'Deep Rest 😴' },
                { label: 'Good ✨', val: 'Good ✨' },
                { label: 'Restless ☁️', val: 'Restless ☁️' },
              ].map(q => (
                <button
                  key={q.val}
                  className={`target-pill ${sleepQuality === q.val ? 'active' : ''}`}
                  onClick={() => setSleepQuality(q.val)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cm-footer">
          <button className="cm-done-btn" onClick={handleSave}>Save Sleep Log ✨</button>
        </div>
      </div>
    </div>
  );
}
