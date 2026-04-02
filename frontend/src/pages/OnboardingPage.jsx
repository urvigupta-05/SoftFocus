import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Stepper from '../components/Stepper';
import '../styles/onboarding.css';

const REMIND_OPTIONS = [
  { id: 'gentle', icon: '🔔', label: 'Gentle',     desc: 'Soft chime, auto-start break'    },
  { id: 'prompt', icon: '⏸️', label: 'Ask me',     desc: 'Pause and wait for your input'   },
  { id: 'silent', icon: '🔇', label: 'Silent',      desc: 'No sound, just visual change'    },
  { id: 'long',   icon: '☕', label: 'Long break',  desc: '10 min break after each session' },
];

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const { user, completeOnboarding } = useApp();

  const [step,   setStep]   = useState(0);
  const [daily,  setDaily]  = useState(4);
  const [weekly, setWeekly] = useState(10);
  const [remind, setRemind] = useState('gentle');

  const next = () => {
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    // Final step → complete
    completeOnboarding({ daily, weekly, remind });
  };

  const back = () => { if (step > 0) setStep(s => s - 1); };

  return (
    <div className="onboard-screen">
      <div className="onboard-wrap">
        {/* Progress dots */}
        <div className="onboard-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`op-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* ── Step 0: Daily target ── */}
        {step === 0 && (
          <div className="onboard-step">
            <div className="onboard-eyebrow">Step 1 of 3</div>
            <div className="onboard-heading">
              How many sessions<br />do you want <em>daily?</em>
            </div>
            <div className="onboard-sub">
              Each session is 25 minutes of focused work. Most people aim for 4–6 per day.
            </div>
            <Stepper
              label="Daily session target"
              sub="Completed sessions shown on your dashboard"
              value={daily}
              onChange={setDaily}
              min={1}
              max={12}
            />
          </div>
        )}

        {/* ── Step 1: Weekly goal ── */}
        {step === 1 && (
          <div className="onboard-step">
            <div className="onboard-eyebrow">Step 2 of 3</div>
            <div className="onboard-heading">
              Set your <em>weekly</em><br />focus goal.
            </div>
            <div className="onboard-sub">
              A weekly target keeps you accountable across the whole week, not just one day.
            </div>
            <Stepper
              label="Weekly focus hours"
              sub="Tracked across all 7 days"
              value={weekly}
              onChange={setWeekly}
              min={1}
              max={40}
            />
          </div>
        )}

        {/* ── Step 2: Break reminder ── */}
        {step === 2 && (
          <div className="onboard-step">
            <div className="onboard-eyebrow">Step 3 of 3</div>
            <div className="onboard-heading">
              How should we<br />remind you to <em>rest?</em>
            </div>
            <div className="onboard-sub">
              After each 25-minute session, choose how your break is announced.
            </div>
            <div className="option-grid cols2">
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
          </div>
        )}

        {/* Navigation */}
        <div className="onboard-nav">
          <button
            className="btn-ghost"
            onClick={back}
            style={{ visibility: step > 0 ? 'visible' : 'hidden' }}
          >
            ← Back
          </button>
          <button className="btn-next" onClick={next}>
            {step === TOTAL_STEPS - 1 ? 'Start focusing →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
