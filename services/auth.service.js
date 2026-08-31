const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findByEmail, findById } = require('../repositories/user.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'supermarket-erp-demo-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

async function authenticate(email, password) {
  const user = await findByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

function signToken(user) {
  // include minimal claims
  const payload = { sub: user._id || user.id, id: user._id || user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findById(decoded.id || decoded.sub);
    return user || null;
  } catch (err) {
    return null;
  }
}

module.exports = { authenticate, signToken, verifyToken };
