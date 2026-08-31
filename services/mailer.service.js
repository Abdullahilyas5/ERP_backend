const nodemailer = require('nodemailer');

let transporter = null;

function createTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('SMTP settings not fully configured. Mailer will throw if used.');
    return null;
  }
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const tr = createTransporter();
  if (!tr) {
    throw new Error('SMTP not configured');
  }
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  return tr.sendMail({ from, to, subject, html, text });
}

module.exports = { sendMail };
