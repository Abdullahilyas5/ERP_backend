const { authenticate, signToken } = require('../services/auth.service');

const userService = require('../services/user.service');
const userRepo = require('../repositories/user.repository');

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await authenticate(email, password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = signToken(user);
    return res.json({ token, user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions || [] } });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password are required.' });
    // If role provided, only allow if requester has admin rights is handled elsewhere; for public signup, default to cashier
    const assignedRole = role || 'cashier';
    const created = await userRepo.createUser({ name, email, password, role: assignedRole });
    return res.status(201).json({ id: created._id, name: created.name, email: created.email, role: created.role, permissions: created.permissions });
  } catch (err) {
    console.error('Signup error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await userRepo.findByEmail(email);
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await userRepo.setPasswordResetToken(email, tokenHash, expires);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // send email
    const mailer = require('../services/mailer.service');
    try {
      await mailer.sendMail({ to: email, subject: 'Password reset', html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in one hour.</p>`, text: `Reset: ${resetLink}` });
    } catch (mailErr) {
      console.error('Failed to send reset email', mailErr);
      // continue - token is stored
    }

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return res.status(400).json({ message: 'email, token and newPassword are required.' });
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepo.findByResetTokenHash(tokenHash);
    if (!user || String(user.email).toLowerCase() !== String(email).toLowerCase()) return res.status(400).json({ message: 'Invalid or expired token.' });

    await userRepo.updatePasswordById(user._id, newPassword);
    return res.json({ message: 'Password has been reset.' });
  } catch (err) {
    console.error('resetPassword error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { login, me, signup, forgotPassword, resetPassword };

function me(req, res) {
  return res.json({ user: req.user });
}


