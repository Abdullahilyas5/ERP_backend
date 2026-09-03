const { authenticate, signToken } = require('../services/auth.service');
const { ROLE_PERMISSIONS } = require('../config/roles');

const userService = require('../services/user.service');
const userRepo = require('../repositories/user.repository');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const crypto = require('crypto');
const mailer = require('../services/mailer.service');
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8
    ? null
    : 'Password must be at least 8 characters long.';
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required.' });
    const user = await authenticate(normalizedEmail, password);
    if (!user) {
      const candidate = await userRepo.findByEmail(normalizedEmail);
      if (candidate && candidate.emailVerified === false) {
        return res.status(403).json({ message: 'Please verify your email before logging in.' });
      }
      if (candidate && candidate.approvalStatus === 'pending') {
        return res.status(403).json({ message: 'Your account is awaiting owner approval before you can access the ERP.' });
      }
      if (candidate && (!candidate.isActive || candidate.approvalStatus === 'rejected')) {
        return res.status(403).json({ message: 'Your ERP account is inactive. Contact the owner.' });
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    user.permissions = user.permissionsConfigured ? (user.permissions || []) : ROLE_PERMISSIONS[user.role] || [];
    const token = signToken(user);
    return res.json({ token, user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions || [] } });
  } catch (err) {
    console.error('Login error', err);
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
  }
}

async function signup(req, res) {
  try {
    const { name, email, password } = req.body || {};
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = normalizeEmail(email);
    if (normalizedName.length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    if (!EMAIL_PATTERN.test(normalizedEmail)) return res.status(400).json({ message: 'Please enter a valid email address.' });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    // Public registration must never allow callers to grant themselves elevated roles.
    const created = await userRepo.createUser({ name: normalizedName, email: normalizedEmail, password, role: 'cashier', emailVerified: false });
    try {
      await sendVerificationEmail(normalizedEmail);
    } catch (mailErr) {
      console.error('Failed to send verification email', mailErr);
      return res.status(503).json({ message: 'Account created, but the verification email could not be sent. Please try resending it.' });
    }
    return res.status(201).json({ id: created._id, name: created.name, email: created.email, role: created.role, approvalStatus: created.approvalStatus, message: 'Account created. Check your email for the verification code.' });
  } catch (err) {
    console.error('Signup error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

function smtpConfigured() {
    return process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD);
  }

async function sendVerificationEmail(email) {
    if (!smtpConfigured()) throw new Error('SMTP not configured');
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    await userRepo.setEmailVerificationOtp(email, otpHash, new Date(Date.now() + OTP_EXPIRY_MS));
    await mailer.sendMail({
      to: email,
      subject: 'Verify your ERP email',
      text: `Your ERP verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your ERP verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    });
  }

async function verifyEmail(req, res) {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    if (!EMAIL_PATTERN.test(email) || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: 'A valid email and 6-digit verification code are required.' });
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await userRepo.findByEmailVerificationOtp(email, otpHash);
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification code.' });
    await userRepo.markEmailVerified(user._id || user.id);
    return res.json({ message: 'Email verified. Your account must be approved by the owner before you can log in.' });
  }

async function resendVerification(req, res) {
    const email = normalizeEmail(req.body?.email);
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
    const user = await userRepo.findByEmail(email);
    if (!user || user.emailVerified === true) return res.json({ message: 'If the account requires verification, a new code has been sent.' });
    try {
      await sendVerificationEmail(email);
    } catch (err) {
      console.error('Failed to resend verification email', err);
      return res.status(503).json({ message: 'Unable to send the verification email. Check the server email configuration.' });
    }
    return res.json({ message: 'If the account requires verification, a new code has been sent.' });
}

async function forgotPassword(req, res) {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (!EMAIL_PATTERN.test(normalizedEmail)) return res.status(400).json({ message: 'Please enter a valid email address.' });
    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await userRepo.setPasswordResetToken(normalizedEmail, tokenHash, expires);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    // send email
    const mailer = require('../services/mailer.service');
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !(process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
      return res.status(503).json({ message: 'Password reset email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM on the server.' });
    }
    try {
      await mailer.sendMail({ to: normalizedEmail, subject: 'Password reset', html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in one hour.</p>`, text: `Reset: ${resetLink}` });
    } catch (mailErr) {
      console.error('Failed to send reset email', mailErr);
      return res.status(503).json({ message: 'Unable to send the reset email. Check the server email configuration.' });
    }
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }

}

async function updateProfile(req, res) {
  try {
    const { name, email, currentPassword, newPassword } = req.body || {};
    if (!name || String(name).trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    const user = await userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (email && normalizeEmail(email) !== normalizeEmail(user.email)) {
      return res.status(403).json({ message: 'Email addresses cannot be changed from profile settings.' });
    }
    const patch = { name: String(name).trim() };
    if (newPassword) {
      const bcrypt = require('bcryptjs');
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ message: 'Current password is incorrect.' });
      const passwordError = validatePassword(newPassword);
      if (passwordError) return res.status(400).json({ message: passwordError });
      patch.password = newPassword;
    }
    const updated = await userService.updateUser(req.user.id, patch);
    return res.json({ user: { id: updated._id, name: updated.name, email: updated.email, role: updated.role, permissions: req.user.permissions } });
  } catch (err) {
    console.error('updateProfile error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (!normalizedEmail || typeof token !== 'string' || !token || typeof newPassword !== 'string') return res.status(400).json({ message: 'Email, reset token and new password are required.' });
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepo.findByResetTokenHash(tokenHash);
    if (!user || String(user.email).toLowerCase() !== normalizedEmail) return res.status(400).json({ message: 'Invalid or expired reset link.' });

    const updatedUser = await userRepo.updatePasswordById(user._id || user.id, newPassword);
    if (!updatedUser) return res.status(400).json({ message: 'Invalid or expired reset link.' });
    return res.json({ message: 'Password has been reset.' });
  } catch (err) {
    console.error('resetPassword error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { login, me, signup, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile };

function me(req, res) {
  // Keep the account endpoint limited to non-sensitive profile data.
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions,
    },
  });
}
