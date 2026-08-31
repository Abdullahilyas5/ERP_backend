const Payment = require('../models/payment.model');

async function listPayments(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const items = await Payment.find().skip(skip).limit(Number(limit)).lean();
    return res.json(items);
  } catch (err) {
    console.error('listPayments error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createPayment(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.ref || !payload.vendor || payload.amount == null) {
      return res.status(400).json({ message: 'ref, vendor and amount are required.' });
    }
    const created = await Payment.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createPayment error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Reference already exists.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getPayment(req, res) {
  try {
    const item = await Payment.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Payment not found.' });
    return res.json(item);
  } catch (err) {
    console.error('getPayment error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updatePayment(req, res) {
  try {
    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body || {}, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Payment not found.' });
    return res.json(updated);
  } catch (err) {
    console.error('updatePayment error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deletePayment(req, res) {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    return res.status(204).end();
  } catch (err) {
    console.error('deletePayment error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listPayments, createPayment, getPayment, updatePayment, deletePayment };
