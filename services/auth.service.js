const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { findByEmail, findById } = require('../repositories/user.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'supermarket-erp-demo-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

async function authenticate(email, password) {
  if (mongoose.connection.readyState !== 1) throw databaseUnavailableError();
  const user = await findByEmail(email);
  if (!user || user.emailVerified === false || !user.isActive || user.approvalStatus === 'pending' || user.approvalStatus === 'rejected') return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

function databaseUnavailableError() {
  const error = new Error('Database connection is unavailable.');
  error.status = 503;
  return error;
}

function signToken(user) {
  // include minimal claims
  const payload = { sub: user._id || user.id, id: user._id || user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function verifyToken(token) {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findById(decoded.id || decoded.sub);
    if (!user || user.emailVerified === false || !user.isActive || user.approvalStatus === 'pending' || user.approvalStatus === 'rejected') return null;
    return user;
  } catch (err) {
    return null;
  }
}

module.exports = { authenticate, signToken, verifyToken };
