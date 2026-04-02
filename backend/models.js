const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// USER
// Stores account info: name, email, hashed password, and focus goals.
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    // bcrypt hash — never store plain text
    passwordHash: {
      type: String,
      required: true,
    },
    goals: {
      daily:  { type: Number, default: 4,       min: 1, max: 12 },
      weekly: { type: Number, default: 10,      min: 1, max: 40 },
      remind: { type: String, default: 'gentle', enum: ['gentle', 'prompt', 'silent', 'long'] },
    },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSION
// One document per completed focus session.
// dateKey: 'YYYY-MM-DD' string for efficient daily grouping.
// ─────────────────────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // ISO date string of the day this session belongs to: '2025-06-15'
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    // optional: session duration in minutes (default 25)
    durationMinutes: {
      type: Number,
      default: 25,
    },
  },
  { timestamps: true }
);

// Compound index for fast per-user per-day lookups
sessionSchema.index({ user: 1, dateKey: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// STREAK / HEATMAP
// One document per user stores a map of date → session count.
// Kept as a single document so heatmap reads are O(1).
// ─────────────────────────────────────────────────────────────────────────────
const heatmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one heatmap doc per user
    },
    // { '2025-06-15': 3, '2025-06-16': 1, ... }
    data: {
      type: Map,
      of: Number,
      default: {},
    },
    // Cached streak count — updated on every session add
    currentStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = {
  User:    mongoose.model('User',    userSchema),
  Session: mongoose.model('Session', sessionSchema),
  Heatmap: mongoose.model('Heatmap', heatmapSchema),
};
