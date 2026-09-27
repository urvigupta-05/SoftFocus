import React, { useState } from 'react';
import '../styles/dashboard.css';

export default function HydrationModal({ open, onClose, water, target = 8, onUpdateWater, onUpdateTarget }) {
  const [animateDrop, setAnimateDrop] = useState(false);

  if (!open) return null;

  const handleAddGlass = () => {
    setAnimateDrop(true);
    onUpdateWater(Math.min(16, water + 1));
    setTimeout(() => setAnimateDrop(false), 300);
  };

  const handleRemoveGlass = () => {
    onUpdateWater(Math.max(0, water - 1));
  };

  const pct = Math.min(100, Math.round((water / target) * 100));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cozy-modal hydration-modal" onClick={e => e.stopPropagation()}>
        <div className="cm-header">
          <div className="cm-title-group">
            <span className="cm-icon">💧</span>
            <h3>Hydration Target &amp; Tracker</h3>
          </div>
          <button className="cm-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cm-body">
          {/* Progress Ring / Bar */}
          <div className="hydration-display-card">
            <div className={`water-drop-icon ${animateDrop ? 'pop-anim' : ''}`}>
              💧
            </div>
            <div className="hd-count">{water} <span className="hd-sub">/ {target} glasses</span></div>
            <div className="hd-pct">{pct}% of daily target completed</div>

            <div className="hd-progress-track">
              <div className="hd-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Quick Log Buttons */}
          <div className="hydration-log-actions">
            <button className="h-action-btn dec" onClick={handleRemoveGlass}>
              - Remove Glass
            </button>
            <button className="h-action-btn inc" onClick={handleAddGlass}>
              + Add Glass 💧
            </button>
          </div>

          {/* Target Adjustment */}
          <div className="target-select-group">
            <label>Daily Glass Target:</label>
            <div className="target-pills">
              {[6, 8, 10, 12].map(t => (
                <button
                  key={t}
                  className={`target-pill ${target === t ? 'active' : ''}`}
                  onClick={() => onUpdateTarget(t)}
                >
                  {t} glasses
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cm-footer">
          <button className="cm-done-btn" onClick={onClose}>Done ✨</button>
        </div>
      </div>
    </div>
  );
}
