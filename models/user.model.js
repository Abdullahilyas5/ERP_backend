const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  passwordResetTokenHash: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
