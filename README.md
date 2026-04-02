# SoftFocus — Focus, beautifully.

A full-featured desktop Pomodoro web app built with React.

## Project Structure

```
src/
├── context/
│   └── AppContext.jsx        # Global state, auth logic, localStorage helpers
├── hooks/
│   ├── useTimer.js           # Timer logic (25min focus, break, ring progress)
│   ├── useRain.js            # Canvas rain animation (Night Rain theme)
│   └── useAmbientSound.js    # Web Audio API ambient sounds
├── components/
│   ├── TopNav.jsx            # Top navigation bar + user dropdown
│   ├── GoalsModal.jsx        # Edit goals modal (daily sessions, weekly hrs, break style)
│   ├── Heatmap.jsx           # 18-week focus streak heatmap
│   ├── Stepper.jsx           # Reusable +/- number stepper input
│   └── Toast.jsx             # Bottom toast notification
├── pages/
│   ├── AuthPage.jsx          # Split-screen login / signup
│   ├── OnboardingPage.jsx    # 3-step goal setup for new users
│   ├── DashboardPage.jsx     # Overview: stats, heatmap, sessions, quick actions
│   ├── TimerPage.jsx         # Full 3-panel timer with themes & sidebar
│   └── NotesPage.jsx         # Placeholder (next build)
├── styles/
│   ├── global.css            # Design tokens (:root variables), base resets
│   ├── auth.css              # Auth split-screen styles
│   ├── onboarding.css        # Onboarding step styles
│   ├── dashboard.css         # Dashboard grid, cards, heatmap, sessions
│   ├── timer.css             # Timer 3-panel layout, ring, controls, themes
│   └── layout.css            # Top nav, app shell, modal, toast
├── App.jsx                   # Root: AppProvider + screen router
└── index.js                  # React DOM entry point
```

## Features

### Auth
- Split-screen: form left, atmospheric rain panel right
- Sign up (new user → onboarding) or sign in (existing user → dashboard)
- Basic validation with inline error states
- Sessions persist via localStorage (swap with JWT + MongoDB for production)

### Onboarding (new users only)
- Step 1: Daily session target (1–12)
- Step 2: Weekly focus hours goal (1–40)
- Step 3: Break reminder style (Gentle / Ask me / Silent / Long break)

### Dashboard
- Greeting by time of day
- Goal progress bar with live fill
- 3 stat cards: sessions today, streak, weekly hours
- 18-week focus heatmap (GitHub-style, per-user)
- Today's session log with timestamps
- Quick action buttons
- Edit Goals button → opens modal

### Timer
- 3-panel desktop layout: left sidebar / center ring / right theme panel
- 25-minute focus → auto-transition to break
- Animated circular ring progress
- Session dots (fills per completed session, pulses when running)
- Linked task badge (pin a task to the active session)
- Floating play / pause / reset / skip controls
- **6 themes**: Parchment, Sage, Blush, Lavender, Night Rain (live rain canvas), Golden Hour
- **Ambient sounds**: Rain, Café, Forest, Waves (Web Audio API noise synthesis + volume)
- All sessions saved to localStorage per user and reflected in heatmap

### Goals Modal
- Editable from dashboard bar, edit button, or user dropdown
- Changes save instantly to the user's profile in localStorage

## Getting Started

```bash
npm install
npm start
```

App runs at http://localhost:3000

## Connecting a Real Backend

The app is designed so that replacing localStorage with real API calls is minimal work:

1. **Auth**: Replace `login()` / `signup()` in `AppContext.jsx` with `fetch('/api/auth/...')` calls
2. **Sessions**: Replace `addSessionToday()` / `getSessionsToday()` with API calls
3. **Heatmap**: Replace `getHeatmap()` with `GET /api/heatmap/:userId`
4. **Goals**: Replace `saveUserData()` with `PATCH /api/users/:id/goals`

The Express + MongoDB backend can slot in without touching any page or component files.

## Tech Stack

- React 18 (no Redux — Context API only)
- Plain CSS (no CSS-in-JS, no Tailwind — full design token system via `:root`)
- Web Audio API (ambient sounds)
- Canvas API (rain animation)
- localStorage (mock backend, ready for MongoDB swap)
