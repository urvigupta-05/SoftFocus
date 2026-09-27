const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// USER
// Stores account info: name, email, hashed password, verification status, and focus goals.
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
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
// ─────────────────────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      default: 25,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, dateKey: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// STREAK / HEATMAP
// ─────────────────────────────────────────────────────────────────────────────
const heatmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    data: {
      type: Map,
      of: Number,
      default: {},
    },
    currentStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = {
  User:    mongoose.model('User',    userSchema),
  Session: mongoose.model('Session', sessionSchema),
  Heatmap: mongoose.model('Heatmap', heatmapSchema),
};
