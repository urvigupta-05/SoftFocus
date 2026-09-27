import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getSessionsToday, getStreak, getWeeklyHours } from '../context/AppContext';
import lofiCatImg from '../assets/lofi_cat.jpg';
import journalStickerImg from '../assets/journal_sticker.jpg';
import studyRoomBg from '../assets/study_room.jpg';
import '../styles/profile.css';

const AESTHETIC_ICONS = [
  { symbol: '☁️', label: 'Soft Cloud' },
  { symbol: '🌸', label: 'Cherry Blossom' },
  { symbol: '☕', label: 'Coffee Cup' },
  { symbol: '🎧', label: 'Headphones' },
  { symbol: '🎀', label: 'Cute Ribbon' },
  { symbol: '✨', label: 'Sparkles' },
  { symbol: '🌿', label: 'Sage Leaf' },
  { symbol: '🧸', label: 'Teddy Bear' },
  { symbol: '🕯️', label: 'Warm Candle' },
  { symbol: '🌙', label: 'Night Moon' },
  { symbol: '🕒', label: 'Classic Clock' },
  { symbol: '🌷', label: 'Spring Tulip' },
  { symbol: '🦋', label: 'Butterfly' },
  { symbol: '🍵', label: 'Matcha Tea' },
];

const AESTHETIC_IMAGES = [
  { id: 'cat', src: lofiCatImg, label: 'Lofi Companion Cat' },
  { id: 'journal', src: journalStickerImg, label: 'Cozy Journal Desk' },
  { id: 'room', src: studyRoomBg, label: 'Sanctuary Room Wallpaper' },
];

export default function ProfilePage() {
  const { user, goals, saveGoals, updateProfile, logout, showToast } = useApp();

  const email = user?.email || '';
  const currentName = user?.name || (email ? email.split('@')[0] : 'Study Girl');

  // Brand Mark: 'icon' or 'image'
  const currentMarkType = user?.brandMarkType || 'icon';
  const currentMarkVal = user?.brandMarkVal || '☁️';

  // Local form state
  const [name, setName] = useState(currentName);
  const [activeTab, setActiveTab] = useState(currentMarkType); // 'icon' | 'image'
  const [selectedMarkVal, setSelectedMarkVal] = useState(currentMarkVal);

  // Goal form state
  const [daily, setDaily] = useState(goals.daily || 4);
  const [weekly, setWeekly] = useState(goals.weekly || 10);
  const [remind, setRemind] = useState(goals.remind || 'gentle');

  const sessionsToday = getSessionsToday(email).length;
  const streak = getStreak(email);
  const weeklyHours = getWeeklyHours(email);

  const initial = (name.trim() || email || 'U')[0].toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim() || 'Study Girl',
      brandMarkType: activeTab,
      brandMarkVal: selectedMarkVal,
    });
  };

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    await saveGoals({
      daily: Number(daily),
      weekly: Number(weekly),
      remind: remind,
    });
    showToast('Goals updated successfully! 🎯');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* ── 1. HERO PROFILE HEADER ── */}
        <div className="profile-hero-card">
          <div className="phc-avatar-wrap">
            <div className="phc-avatar">{initial}</div>
          </div>
          <div className="phc-info">
            <h1 className="phc-name">{name || 'Study Girl'}</h1>
            <span className="phc-email">{email}</span>
            <div className="phc-pill-row">
              <span className="phc-pill">🔥 {streak} Day Streak</span>
              <span className="phc-pill">⏱️ {weeklyHours} Hrs This Week</span>
              <span className="phc-pill">☕ {sessionsToday} Sessions Today</span>
            </div>
          </div>
        </div>

        {/* ── 2. TWO COLUMN SETTINGS GRID ── */}
        <div className="profile-grid">

          {/* LEFT COLUMN: User Name & Brand Mark Selector */}
          <div className="profile-card">
            <div className="pc-header">
              <h2>👤 Profile &amp; Navbar Appearance</h2>
              <p>Update your display name and choose what icon or image appears beside your navbar greeting.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              {/* Display Name Input */}
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name (e.g. Urvi)"
                  required
                />
                <span className="form-hint">The navbar will randomly display warm greetings with your name!</span>
              </div>

              {/* Navbar Header Live Preview */}
              <div className="form-group">
                <label className="form-label">Navbar Header Preview</label>
                <div className="nav-preview-box">
                  <div className="np-brand-preview">
                    {activeTab === 'image' && AESTHETIC_IMAGES.find(i => i.id === selectedMarkVal) ? (
                      <img
                        src={AESTHETIC_IMAGES.find(i => i.id === selectedMarkVal).src}
                        className="preview-brand-img"
                        alt="Preview Sticker"
                      />
                    ) : (
                      <span className="preview-brand-symbol">{selectedMarkVal}</span>
                    )}
                    <span>Hey, {name.trim() || 'Urvi'} ✨</span>
                  </div>
                </div>
              </div>

              {/* Mark Choice Tabs: Icons vs Images */}
              <div className="form-group">
                <label className="form-label">Select Brand Companion</label>
                <div className="mark-tabs-header">
                  <button
                    type="button"
                    className={`mark-tab-btn ${activeTab === 'icon' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('icon');
                      setSelectedMarkVal('☁️');
                    }}
                  >
                    ✨ Cute Icons
                  </button>
                  <button
                    type="button"
                    className={`mark-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('image');
                      setSelectedMarkVal('cat');
                    }}
                  >
                    🖼️ Aesthetic Images
                  </button>
                </div>

                {/* TAB 1: CUTE ICONS */}
                {activeTab === 'icon' && (
                  <div className="icon-picker-grid">
                    {AESTHETIC_ICONS.map(i => (
                      <button
                        type="button"
                        key={i.symbol}
                        className={`icon-chip ${selectedMarkVal === i.symbol ? 'active' : ''}`}
                        onClick={() => setSelectedMarkVal(i.symbol)}
                        title={i.label}
                      >
                        <span className="ic-symbol">{i.symbol}</span>
                        <span className="ic-label">{i.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* TAB 2: AESTHETIC IMAGES */}
                {activeTab === 'image' && (
                  <div className="image-picker-grid">
                    {AESTHETIC_IMAGES.map(img => (
                      <div
                        key={img.id}
                        className={`image-chip ${selectedMarkVal === img.id ? 'active' : ''}`}
                        onClick={() => setSelectedMarkVal(img.id)}
                      >
                        <img src={img.src} alt={img.label} className="img-chip-thumb" />
                        <span className="img-chip-label">{img.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="save-btn">
                Save Profile Settings ✨
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Study Goals */}
          <div className="profile-card">
            <div className="pc-header">
              <h2>🎯 Study Goals &amp; Preferences</h2>
              <p>Set your daily session targets and reminder preferences.</p>
            </div>

            <form onSubmit={handleSaveGoals} className="profile-form">
              {/* Daily Target */}
              <div className="form-group">
                <div className="fg-top">
                  <label className="form-label">Daily Focus Target</label>
                  <span className="form-val-badge">{daily} sessions ({daily * 25} mins)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={daily}
                  onChange={(e) => setDaily(e.target.value)}
                  className="form-range"
                />
                <span className="form-hint">Recommended: 4 sessions (100 mins focus) per day.</span>
              </div>

              {/* Weekly Target */}
              <div className="form-group">
                <div className="fg-top">
                  <label className="form-label">Weekly Focus Target</label>
                  <span className="form-val-badge">{weekly} sessions</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  value={weekly}
                  onChange={(e) => setWeekly(e.target.value)}
                  className="form-range"
                />
              </div>

              {/* Reminder Tone */}
              <div className="form-group">
                <label className="form-label">Reminder Tone</label>
                <div className="remind-options">
                  <button
                    type="button"
                    className={`remind-chip ${remind === 'gentle' ? 'active' : ''}`}
                    onClick={() => setRemind('gentle')}
                  >
                    🌸 Gentle
                  </button>
                  <button
                    type="button"
                    className={`remind-chip ${remind === 'strict' ? 'active' : ''}`}
                    onClick={() => setRemind('strict')}
                  >
                    ⚡ Strict
                  </button>
                  <button
                    type="button"
                    className={`remind-chip ${remind === 'silent' ? 'active' : ''}`}
                    onClick={() => setRemind('silent')}
                  >
                    🤫 Silent
                  </button>
                </div>
              </div>

              <button type="submit" className="save-btn secondary">
                Save Study Goals 🎯
              </button>
            </form>

            <div className="account-section">
              <h3>🔒 Account &amp; Session</h3>
              <div className="acc-info-row">
                <span className="acc-label">Signed in as</span>
                <span className="acc-val">{email}</span>
              </div>
              <button type="button" className="signout-btn" onClick={logout}>
                Sign Out of SoftFocus
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
