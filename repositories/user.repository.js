const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { ROLE_PERMISSIONS } = require('../config/roles');

async function createUser({ name, email, password, role, permissions = [] }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email: String(email).toLowerCase(), passwordHash, role, permissions: permissions.length ? permissions : ROLE_PERMISSIONS[role] || [] });
  return user.save();
}

async function findByEmail(email) {
  return User.findOne({ email: String(email).toLowerCase() }).lean();
}

async function findById(id) {
  return User.findById(id).lean();
}

async function listUsers() {
  return User.find().lean();
}

async function updateUser(id, patch) {
  if (patch.password) {
    patch.passwordHash = await bcrypt.hash(patch.password, 10);
    delete patch.password;
  }
  return User.findByIdAndUpdate(id, patch, { new: true }).lean();
}

async function deleteUser(id) {
  return User.findByIdAndDelete(id);
}

async function seedDefaultUsers(defaultUsers) {
  const count = await User.countDocuments();
  if (count === 0) {
    const docs = defaultUsers.map((u) => ({
      name: u.name,
      email: String(u.email).toLowerCase(),
      passwordHash: bcrypt.hashSync(u.password, 10),
      role: u.role,
      permissions: ROLE_PERMISSIONS[u.role] || [],
      isActive: true,
    }));
    await User.insertMany(docs);
    return true;
  }
  return false;
}

async function setPasswordResetToken(email, tokenHash, expiresAt) {
  return User.findOneAndUpdate({ email: String(email).toLowerCase() }, { passwordResetTokenHash: tokenHash, passwordResetExpires: expiresAt }, { new: true }).lean();
}

async function findByResetTokenHash(tokenHash) {
  return User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } }).lean();
}

async function updatePasswordById(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  return User.findByIdAndUpdate(id, { passwordHash, passwordResetTokenHash: null, passwordResetExpires: null }, { new: true }).lean();
}

module.exports = { createUser, findByEmail, findById, listUsers, updateUser, deleteUser, seedDefaultUsers, setPasswordResetToken, findByResetTokenHash, updatePasswordById };

