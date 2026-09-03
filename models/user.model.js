const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  permissionsConfigured: { type: Boolean, default: false },
  passwordResetTokenHash: { type: String },
  passwordResetExpires: { type: Date },
  emailVerified: { type: Boolean, default: true },
  emailVerificationOtpHash: { type: String },
  emailVerificationOtpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
