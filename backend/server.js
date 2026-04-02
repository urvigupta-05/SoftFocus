/**
 * pomo-backend — server.js
 * Express + MongoDB (Mongoose) backend for the Pomodoro focus app.
 *
 * Routes
 * ──────
 * POST   /api/auth/signup          Create account
 * POST   /api/auth/login           Login → JWT
 * GET    /api/auth/me              Get current user (protected)
 * PUT    /api/users/goals          Update goals (protected)
 * PUT    /api/users/onboarding     Mark onboarding complete (protected)
 *
 * POST   /api/sessions             Record a completed focus session (protected)
 * GET    /api/sessions/today       Sessions for today (protected)
 * GET    /api/sessions/heatmap     Full heatmap data (protected)
 * GET    /api/sessions/streak      Current streak count (protected)
 * GET    /api/sessions/weekly      Weekly hours (protected)
 */

require('dotenv').config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');

const { User, Session, Heatmap } = require('./models');
const auth       = require('./authMiddleware');
const { calcStreak } = require('./streakUtils');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

// ── DB connect ────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — sign JWT
// ─────────────────────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — today's date key 'YYYY-MM-DD' in server local time
// ─────────────────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — get or create heatmap doc for a user
// ─────────────────────────────────────────────────────────────────────────────
async function getOrCreateHeatmap(userId) {
  let hm = await Heatmap.findOne({ user: userId });
  if (!hm) {
    hm = await Heatmap.create({ user: userId, data: new Map(), currentStreak: 0 });
  }
  return hm;
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !name.trim())                         return res.status(400).json({ field: 'name',     error: 'Name is required.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ field: 'email',    error: 'Valid email is required.' });
    if (!password || password.length < 6)              return res.status(400).json({ field: 'password', error: 'Password must be at least 6 characters.' });

    // Check for existing account
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ field: 'email', error: 'An account with this email already exists.' });

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        goals: user.goals,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ field: 'email', error: 'No account found with this email.' });

    // Verify password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ field: 'password', error: 'Incorrect password.' });

    const token = signToken(user);

    res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        goals: user.goals,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me  (protected)
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// USER ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// PUT /api/users/goals  (protected)
app.put('/api/users/goals', auth, async (req, res) => {
  try {
    const { daily, weekly, remind } = req.body;

    const update = {};
    if (daily  !== undefined) update['goals.daily']  = Math.max(1, Math.min(12, Number(daily)));
    if (weekly !== undefined) update['goals.weekly'] = Math.max(1, Math.min(40, Number(weekly)));
    if (remind !== undefined) update['goals.remind'] = remind;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true, select: '-passwordHash' }
    );

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ goals: user.goals });
  } catch (err) {
    console.error('Goals update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/users/onboarding  (protected)
app.put('/api/users/onboarding', auth, async (req, res) => {
  try {
    const { daily, weekly, remind } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          onboardingComplete: true,
          'goals.daily':  Math.max(1, Math.min(12, Number(daily  || 4))),
          'goals.weekly': Math.max(1, Math.min(40, Number(weekly || 10))),
          'goals.remind': remind || 'gentle',
        },
      },
      { new: true, select: '-passwordHash' }
    );

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ goals: user.goals, onboardingComplete: user.onboardingComplete });
  } catch (err) {
    console.error('Onboarding update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SESSION ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/sessions  (protected)
// Records a completed focus session.
// Body: { dateKey?: 'YYYY-MM-DD', durationMinutes?: number }
app.post('/api/sessions', auth, async (req, res) => {
  try {
    const dateKey         = req.body.dateKey         || todayKey();
    const durationMinutes = req.body.durationMinutes || 25;

    // Create session record
    const session = await Session.create({
      user: req.userId,
      dateKey,
      durationMinutes,
      completedAt: new Date(),
    });

    // Update heatmap (upsert)
    const hm = await getOrCreateHeatmap(req.userId);
    const prev = hm.data.get(dateKey) || 0;
    hm.data.set(dateKey, prev + 1);

    // Recalculate streak
    hm.currentStreak = calcStreak(hm.data);
    hm.markModified('data'); // required for Mongoose Map
    await hm.save();

    res.status(201).json({
      session: {
        id:          session._id,
        dateKey:     session.dateKey,
        completedAt: session.completedAt,
        durationMinutes: session.durationMinutes,
      },
      streak: hm.currentStreak,
    });
  } catch (err) {
    console.error('Session create error:', err);
    res.status(500).json({ error: 'Server error recording session.' });
  }
});

// GET /api/sessions/today  (protected)
// Returns all sessions for today's dateKey.
app.get('/api/sessions/today', auth, async (req, res) => {
  try {
    const key = req.query.dateKey || todayKey();
    const sessions = await Session.find({ user: req.userId, dateKey: key })
      .sort({ completedAt: 1 })
      .select('completedAt durationMinutes dateKey');

    res.json({ dateKey: key, sessions });
  } catch (err) {
    console.error('Sessions today error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/sessions/heatmap  (protected)
// Returns the full heatmap data object { 'YYYY-MM-DD': count, ... }
app.get('/api/sessions/heatmap', auth, async (req, res) => {
  try {
    const hm = await getOrCreateHeatmap(req.userId);
    // Convert Mongoose Map to plain object for JSON serialization
    const data = Object.fromEntries(hm.data);
    res.json({ data, streak: hm.currentStreak });
  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/sessions/streak  (protected)
// Returns the current streak (recalculated from heatmap for accuracy).
app.get('/api/sessions/streak', auth, async (req, res) => {
  try {
    const hm = await getOrCreateHeatmap(req.userId);
    const streak = calcStreak(hm.data);
    // Update cached value if stale
    if (hm.currentStreak !== streak) {
      hm.currentStreak = streak;
      await hm.save();
    }
    res.json({ streak });
  } catch (err) {
    console.error('Streak error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/sessions/weekly  (protected)
// Returns total focus hours in the last 7 days.
app.get('/api/sessions/weekly', auth, async (req, res) => {
  try {
    const hm = await getOrCreateHeatmap(req.userId);
    let totalMinutes = 0;

    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const key   = d.toISOString().split('T')[0];
      const count = hm.data.get(key) || 0;
      totalMinutes += count * 25;
      d.setDate(d.getDate() - 1);
    }

    const hours = Math.round((totalMinutes / 60) * 10) / 10;
    res.json({ hours, totalMinutes });
  } catch (err) {
    console.error('Weekly hours error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 pomo-backend running on http://localhost:${PORT}`);
});
