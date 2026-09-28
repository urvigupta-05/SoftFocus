import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useRain } from '../hooks/useRain';
import rainyRoomImg from '../assets/rainy_room.jpg';
import '../styles/auth.css';

export default function AuthPage() {
  const { login, signup, verifyCode, resendCode } = useApp();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup State
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupConfirmPass, setSignupConfirmPass] = useState('');
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyCodeVal, setVerifyCodeVal] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const [devCodeMsg, setDevCodeMsg] = useState('');

  // Status & Errors
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Rain Canvas Ref
  const canvasRef = useRef(null);
  useRain(canvasRef, true);

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!loginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!loginPass) {
      errs.password = 'Please enter your password.';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const res = await login(loginEmail, loginPass);
    setLoading(false);
    if (!res.ok) {
      if (res.isUnverified) {
        setSignupEmail(loginEmail);
        setVerifyStep(true);
        setErrors({ code: 'Your account is not verified yet. Please enter your verification code.' });
      } else if (res.field === 'email') {
        setErrors({ email: res.msg });
      } else {
        setErrors({ password: res.msg });
      }
    }
  };

  // Handle Quick Demo / Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    await login('urvi2005gupta@example.com', 'password123');
    setLoading(false);
  };

  // Handle Signup Submission
  const handleSignupSubmit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!signupEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!signupPass || signupPass.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (signupPass !== signupConfirmPass) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const res = await signup(signupEmail, signupPass);
    setLoading(false);
    if (!res.ok) {
      setErrors({ email: res.msg });
    } else {
      if (res.devCode) setDevCodeMsg(res.devCode);
      setVerifyStep(true);
    }
  };

  // Handle Verify Submission
  const handleVerifySubmit = async (e) => {
    e?.preventDefault();
    if (!verifyCodeVal || verifyCodeVal.trim().length !== 6) {
      setErrors({ code: 'Please enter the 6-digit verification code.' });
      return;
    }
    setErrors({});
    setLoading(true);

    const res = await verifyCode(signupEmail, verifyCodeVal.trim());
    setLoading(false);
    if (!res.ok) {
      setErrors({ code: res.msg });
    }
  };

  // Handle Resend Verification Code
  const handleResendOTP = async () => {
    setResendStatus('Sending code...');
    const res = await resendCode(signupEmail);
    if (res.ok) {
      setResendStatus('A new code was sent to your email!');
    } else {
      setResendStatus(res.msg || 'Failed to resend code.');
    }
    setTimeout(() => setResendStatus(''), 4000);
  };

  return (
    <div className="auth-split-screen">
      {/* ══════════════════════════════════════════
         LEFT FORM CONTAINER
         ══════════════════════════════════════════ */}
      <div className="auth-left-panel">
        <div className="auth-form-content">
          {/* Brand Logo */}
          <div className="auth-brand-logo">SoftFocus</div>

          {/* Verification Step Header & Form */}
          {verifyStep ? (
            <div className="auth-form-box">
              <h1 className="auth-hero-title">
                Check <span className="auth-hero-accent">inbox.</span>
              </h1>
              <p className="auth-hero-sub">
                We sent a 6-digit verification code to <strong>{signupEmail}</strong>
              </p>

              <form onSubmit={handleVerifySubmit} className="auth-form">
                <div className="auth-field-group">
                  <label htmlFor="verify-code">Verification Code</label>
                  <input
                    id="verify-code"
                    type="text"
                    className={`auth-input ${errors.code ? 'has-error' : ''}`}
                    placeholder="123456"
                    value={verifyCodeVal}
                    onChange={e => setVerifyCodeVal(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                  {errors.code && <span className="auth-error-msg">{errors.code}</span>}
                  {devCodeMsg && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f7efe2', border: '1px solid #e0d8cb', borderRadius: '6px', fontSize: '13px', color: '#c47c2b' }}>
                      🔑 <strong>Verification Code:</strong> {devCodeMsg}
                    </div>
                  )}
                  {resendStatus && <span className="auth-info-msg" style={{ color: '#c47c2b', fontSize: '13px', marginTop: '4px', display: 'block' }}>{resendStatus}</span>}
                </div>

                <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>

              <div className="auth-footer-note" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button type="button" className="auth-inline-link" onClick={handleResendOTP}>
                  Resend code
                </button>
                <button type="button" className="auth-inline-link" onClick={() => { setVerifyStep(false); setVerifyCodeVal(''); }}>
                  Change email
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-form-box">
              {/* Main Heading */}
              {tab === 'login' ? (
                <>
                  <h1 className="auth-hero-title">
                    Welcome <span className="auth-hero-accent">back.</span>
                  </h1>
                  <p className="auth-hero-sub">
                    Your focus streaks and sessions are waiting for you.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="auth-hero-title">
                    Create <span className="auth-hero-accent">account.</span>
                  </h1>
                  <p className="auth-hero-sub">
                    Your personal focus space for clear thoughts and daily debriefs.
                  </p>
                </>
              )}

              {/* Segmented Tab Switcher */}
              <div className="auth-pill-tabs">
                <button
                  type="button"
                  className={`apt-btn ${tab === 'login' ? 'active' : ''}`}
                  onClick={() => { setTab('login'); setErrors({}); }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`apt-btn ${tab === 'signup' ? 'active' : ''}`}
                  onClick={() => { setTab('signup'); setErrors({}); }}
                >
                  Create account
                </button>
              </div>

              {/* Sign In Form */}
              {tab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="auth-form">
                  <div className="auth-field-group">
                    <label htmlFor="login-email">Email address</label>
                    <input
                      id="login-email"
                      type="email"
                      className={`auth-input ${errors.email ? 'has-error' : ''}`}
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                    {errors.email && <span className="auth-error-msg">{errors.email}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="login-pass">Password</label>
                    <div className="auth-pass-wrapper">
                      <input
                        id="login-pass"
                        type={showPass ? 'text' : 'password'}
                        className={`auth-input ${errors.password ? 'has-error' : ''}`}
                        placeholder="••••••••"
                        value={loginPass}
                        onChange={e => setLoginPass(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPass(p => !p)}
                        title={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                    {errors.password && <span className="auth-error-msg">{errors.password}</span>}
                  </div>

                  <div className="auth-options-row">
                    <label className="remember-checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="remember-checkbox"
                      />
                      <span>Remember me</span>
                    </label>
                    <button type="button" className="auth-forgot-link">
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`}>
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>

                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <button
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="g-svg-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="auth-footer-note">
                    New here?{' '}
                    <button type="button" className="auth-inline-link" onClick={() => { setTab('signup'); setErrors({}); }}>
                      Create a free account
                    </button>
                  </div>
                </form>
              ) : (
                /* Create Account Form */
                <form onSubmit={handleSignupSubmit} className="auth-form">
                  <div className="auth-field-group">
                    <label htmlFor="signup-email">Email address</label>
                    <input
                      id="signup-email"
                      type="email"
                      className={`auth-input ${errors.email ? 'has-error' : ''}`}
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                    />
                    {errors.email && <span className="auth-error-msg">{errors.email}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="signup-pass">Set Password</label>
                    <div className="auth-pass-wrapper">
                      <input
                        id="signup-pass"
                        type={showPass ? 'text' : 'password'}
                        className={`auth-input ${errors.password ? 'has-error' : ''}`}
                        placeholder="Min. 6 characters"
                        value={signupPass}
                        onChange={e => setSignupPass(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPass(p => !p)}
                        title={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                    {errors.password && <span className="auth-error-msg">{errors.password}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="signup-confirm-pass">Confirm Password</label>
                    <div className="auth-pass-wrapper">
                      <input
                        id="signup-confirm-pass"
                        type={showPass ? 'text' : 'password'}
                        className={`auth-input ${errors.confirmPassword ? 'has-error' : ''}`}
                        placeholder="Re-enter password"
                        value={signupConfirmPass}
                        onChange={e => setSignupConfirmPass(e.target.value)}
                      />
                    </div>
                    {errors.confirmPassword && <span className="auth-error-msg">{errors.confirmPassword}</span>}
                  </div>

                  <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <button
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="g-svg-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="auth-footer-note">
                    Already have an account?{' '}
                    <button type="button" className="auth-inline-link" onClick={() => { setTab('login'); setErrors({}); }}>
                      Sign in →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
         RIGHT AESTHETIC IMAGE & QUOTE PANEL
         ══════════════════════════════════════════ */}
      <div className="auth-right-panel">
        <img src={rainyRoomImg} alt="Aesthetic rainy study desk" className="auth-bg-img" />
        <canvas ref={canvasRef} className="auth-rain-canvas" />
        <div className="auth-right-overlay" />

        <div className="auth-quote-container">
          <p className="auth-quote-text">
            "The secret of getting ahead is getting started."
          </p>
          <span className="auth-quote-author">— MARK TWAIN</span>
        </div>
      </div>
    </div>
  );
}
