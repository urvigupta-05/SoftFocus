import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import lofiCatImg from '../assets/lofi_cat.jpg';
import journalStickerImg from '../assets/journal_sticker.jpg';
import studyRoomBg from '../assets/study_room.jpg';

const GREETINGS_LIST = [
  'Hey, {name} ✨',
  'Welcome back, {name} 🌸',
  'Good day, {name} ☕',
  'Focus mode, {name} ⏱️',
  'Creating magic, {name} 🧸',
  'Soft & disciplined, {name} 🌿',
  'Sanctuary time, {name} 🕯️',
];

const BRAND_IMAGES = {
  cat: lofiCatImg,
  journal: journalStickerImg,
  room: studyRoomBg,
};

export default function TopNav() {
  const { user, currentPage, setCurrentPage, logout } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Pick a random greeting style once when topnav mounts
  const randomGreetingTemplate = useMemo(() => {
    const idx = Math.floor(Math.random() * GREETINGS_LIST.length);
    return GREETINGS_LIST[idx];
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      id: 'timer',
      label: 'Timer',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
        </svg>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  // User display name & fallback initial
  const displayName = (user?.name && user.name.trim())
    ? user.name.trim()
    : (user?.email ? user.email.split('@')[0] : 'Friend');

  const initial = displayName[0].toUpperCase();
  const greetingText = randomGreetingTemplate.replace('{name}', displayName);

  // Brand Mark: Icon vs Image (NO container box around it!)
  const markType = user?.brandMarkType || 'icon';
  const markVal  = user?.brandMarkVal || '☁️';

  return (
    <nav className="topnav">
      {/* Brand & Personal Greeting (NO bounding box!) */}
      <div className="topnav-brand" onClick={() => setCurrentPage('profile')} style={{ cursor: 'pointer' }}>
        <span className="topnav-brand-mark">
          {markType === 'image' && BRAND_IMAGES[markVal] ? (
            <img src={BRAND_IMAGES[markVal]} className="topnav-brand-img" alt="Cute Sticker" />
          ) : (
            <span className="topnav-brand-symbol">{markVal}</span>
          )}
        </span>
        <span className="topnav-name custom-greeting">{greetingText}</span>
      </div>

      {/* Page Navigation */}
      <div className="topnav-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`tnav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Right User Avatar Dropdown */}
      <div className="topnav-right" ref={dropdownRef}>
        <div className="user-pill" onClick={() => setDropdownOpen(o => !o)}>
          <div className="user-avatar">{initial}</div>
          <span className="user-name">{displayName}</span>
          <svg className="chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>

        <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
          <div className="ud-item" onClick={() => { setDropdownOpen(false); setCurrentPage('profile'); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profile &amp; Settings
          </div>
          <div className="ud-sep" />
          <div className="ud-item danger" onClick={() => { setDropdownOpen(false); logout(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </div>
        </div>
      </div>
    </nav>
  );
}
