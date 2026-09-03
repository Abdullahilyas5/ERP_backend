const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

async function createUser({ name, email, password, role, permissions = [], emailVerified = true }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email: String(email).trim().toLowerCase(),
    passwordHash,
    role,
    permissions: [],
    permissionsConfigured: false,
    isActive: false,
    approvalStatus: 'pending',
    emailVerified,
  });
  return user.save();
}

async function setEmailVerificationOtp(email, otpHash, expiresAt) {
  return User.findOneAndUpdate(
    { email: String(email).trim().toLowerCase() },
    { emailVerificationOtpHash: otpHash, emailVerificationOtpExpires: expiresAt },
    { returnDocument: 'after' },
  ).lean();
}

async function findByEmailVerificationOtp(email, otpHash) {
  return User.findOne({
    email: String(email).trim().toLowerCase(),
    emailVerificationOtpHash: otpHash,
    emailVerificationOtpExpires: { $gt: new Date() },
    emailVerified: false,
  }).lean();
}

async function markEmailVerified(id) {
  return User.findByIdAndUpdate(
    id,
    { emailVerified: true, emailVerificationOtpHash: null, emailVerificationOtpExpires: null },
    { returnDocument: 'after' },
  ).lean();
}

async function findByEmail(email) {
  return User.findOne({ email: String(email).trim().toLowerCase() }).lean();
}

async function findById(id) {
  return User.findById(id).lean();
}

async function listUsers({ skip = 0, limit = 10 } = {}) {
  const normalizedLimit = Math.max(1, Number(limit) || 10);
  const normalizedSkip = Math.max(0, Number(skip) || 0);
  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(normalizedSkip).limit(normalizedLimit).lean(),
    User.countDocuments(),
  ]);
  return { items, total, page: Math.floor(normalizedSkip / normalizedLimit) + 1, limit: normalizedLimit, totalPages: Math.max(1, Math.ceil(total / normalizedLimit)) };
}

async function updateUser(id, patch) {
  const changes = { ...patch };
  if (changes.password) {
    changes.passwordHash = await bcrypt.hash(changes.password, 10);
    delete changes.password;
  }

  return User.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true }).lean();
}

async function approveUser(id, approvedBy) {
  return User.findByIdAndUpdate(
    id,
    { isActive: true, approvalStatus: 'approved', approvedBy, approvedAt: new Date() },
    { returnDocument: 'after', runValidators: true },
  ).lean();
}

async function setUserActive(id, isActive, approvedBy) {
  return User.findByIdAndUpdate(
    id,
    {
      isActive: Boolean(isActive),
      approvalStatus: isActive ? 'approved' : 'rejected',
      ...(isActive ? { approvedBy, approvedAt: new Date() } : {}),
    },
    { returnDocument: 'after', runValidators: true },
  ).lean();
}

async function deleteUser(id) {
  return User.findByIdAndDelete(id);
}

async function setPasswordResetToken(email, tokenHash, expiresAt) {
  return User.findOneAndUpdate(
    { email: String(email).trim().toLowerCase() },
    { passwordResetTokenHash: tokenHash, passwordResetExpires: expiresAt },
    { returnDocument: 'after' },
  ).lean();
}

async function findByResetTokenHash(tokenHash) {
  return User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } }).lean();
}

async function updatePasswordById(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  return User.findByIdAndUpdate(
    id,
    { passwordHash, passwordResetTokenHash: null, passwordResetExpires: null },
    { returnDocument: 'after' },
  ).lean();
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers,
  updateUser,
  approveUser,
  setUserActive,
  deleteUser,
  setPasswordResetToken,
  findByResetTokenHash,
  updatePasswordById,
  setEmailVerificationOtp,
  findByEmailVerificationOtp,
  markEmailVerified,
};
