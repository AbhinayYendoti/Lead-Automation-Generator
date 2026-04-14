const mongoose = require('mongoose');

/**
 * Lead Schema
 * Stores all lead details, assigned priority, and creation timestamp.
 * Immutable once created (no update operations required by PRD).
 */
const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: false,   // Optional: not captured when Test Mode is ON
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      required: false,   // Optional: not captured when Test Mode is ON
      trim: true,
      default: '',
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
      lowercase: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

// Index for faster queries by priority and creation time
leadSchema.index({ priority: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
