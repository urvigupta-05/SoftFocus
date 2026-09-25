import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useRain } from '../hooks/useRain';
import '../styles/auth.css';

function FormInput({ id, label, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`form-input ${error ? 'error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
      />
      {error && <div className="form-error show">{error}</div>}
    </div>
  );
}

function LoginForm({ onSwitch }) {
  const { login } = useApp();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email.';
    if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (!result.ok) {
        if (result.field === 'email') setErrors({ email: result.msg });
        else setErrors({ password: result.msg });
      }
    }, 800);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <>
      <div className="auth-heading">Welcome<br /><em>back.</em></div>
      <div className="auth-sub">Your focus streaks and sessions are waiting for you.</div>

      <div className="auth-tabs">
        <button className="auth-tab active">Sign in</button>
        <button className="auth-tab" onClick={onSwitch}>Create account</button>
      </div>

      <FormInput id="login-email" label="Email address" type="email" placeholder="you@example.com"
        value={email} onChange={setEmail} error={errors.email} />
      <FormInput id="login-pass" label="Password" type="password" placeholder="••••••••"
        value={password} onChange={setPassword} error={errors.password} />

      <button className={`btn-auth ${loading ? 'loading' : ''}`} onClick={handleSubmit} onKeyDown={handleKey}>
        <span className="btn-label">
          Sign in&nbsp;
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
          </svg>
        </span>
        <div className="btn-spinner" />
      </button>

      <div className="auth-switch">
        New here?&nbsp;
        <button onClick={onSwitch}>Create a free account →</button>
      </div>
    </>
  );
}

function SignupForm({ onSwitch }) {
  const { signup } = useApp();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email.';
    if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      const result = signup(name.trim(), email, password);
      setLoading(false);
      if (!result.ok) {
        if (result.field === 'email') setErrors({ email: result.msg });
      }
    }, 800);
  };

  return (
    <>
      <div className="auth-heading">Start<br /><em>focusing.</em></div>
      <div className="auth-sub">Create your account and build a focus habit that sticks.</div>

      <div className="auth-tabs">
        <button className="auth-tab" onClick={onSwitch}>Sign in</button>
        <button className="auth-tab active">Create account</button>
      </div>

      <FormInput id="signup-name" label="Your name" placeholder="Alex"
        value={name} onChange={setName} error={errors.name} />
      <FormInput id="signup-email" label="Email address" type="email" placeholder="you@example.com"
        value={email} onChange={setEmail} error={errors.email} />
      <FormInput id="signup-pass" label="Password" type="password" placeholder="Min. 6 characters"
        value={password} onChange={setPassword} error={errors.password} />

      <button className={`btn-auth ${loading ? 'loading' : ''}`} onClick={handleSubmit}>
        <span className="btn-label">Create account</span>
        <div className="btn-spinner" />
      </button>

      <div className="auth-switch">
        Already have an account?&nbsp;
        <button onClick={onSwitch}>Sign in →</button>
      </div>
    </>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const canvasRef = useRef(null);
  useRain(canvasRef, true);

  return (
    <div className="auth-screen">
      {/* Left: form */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div className="auth-brand-name">SoftFocus</div>
        </div>

        {tab === 'login'
          ? <LoginForm  onSwitch={() => setTab('signup')} />
          : <SignupForm onSwitch={() => setTab('login')}  />
        }
      </div>

      {/* Right: decorative */}
      <div className="auth-right">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <canvas ref={canvasRef} className="auth-rain-canvas" />

        <div className="auth-right-inner">
          <div className="auth-quote">
            <blockquote>"The secret of getting ahead is getting started."</blockquote>
            <cite>— Mark Twain</cite>
          </div>
        </div>
      </div>
    </div>
  );
}
