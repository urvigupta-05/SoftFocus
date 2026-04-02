import React from 'react';

export default function Stepper({ label, sub, value, onChange, min = 1, max = 40 }) {
  return (
    <div className="stepper-row">
      <div className="stepper-info">
        <div className="stepper-label">{label}</div>
        {sub && <div className="stepper-sub">{sub}</div>}
      </div>
      <div className="stepper-ctrl">
        <button className="step-btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <div className="step-val">{value}</div>
        <button className="step-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}
