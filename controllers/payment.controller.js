const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const Warehouse = require('../models/warehouse.model');

async function listPayments(req, res) {
  try {
    const { page = 1, limit = 100, status, type, method } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (method && method !== 'all') filter.method = method;

    const [items, total] = await Promise.all([
      Payment.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Payment.countDocuments(filter),
    ]);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listPayments error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createPayment(req, res) {
  try {
    const payload = req.body || {};
    const amount = Number(payload.amount ?? payload.total ?? 0);
    if (!payload.ref && !payload.invoiceReference) {
      return res.status(400).json({ message: 'Payment reference or invoice reference is required.' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    let warehouseId;
    let warehouseName = typeof payload.warehouse === 'string' ? payload.warehouse.trim() : '';
    let warehouse;
    if (payload.warehouseId && mongoose.Types.ObjectId.isValid(payload.warehouseId)) {
      warehouse = await Warehouse.findOne({ _id: payload.warehouseId, status: 'Active' }).select('_id name').lean();
    } else if (warehouseName) {
      warehouse = await Warehouse.findOne({
        $or: [{ name: warehouseName }, { code: warehouseName }],
        status: 'Active',
      }).select('_id name').lean();
    }
    if (!warehouse) {
      return res.status(400).json({ message: 'A valid warehouse is required.' });
    }
    warehouseId = warehouse._id;
    warehouseName = warehouse.name;

    const record = {
      ...payload,
      paymentId: payload.paymentId || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ref: payload.ref || payload.invoiceReference || payload.paymentId || `PAY-${Date.now()}`,
      amount,
      type: payload.type || 'Customer Payment',
      direction: payload.direction || 'incoming',
      status: payload.status || 'Completed',
      date: payload.date || new Date(),
      party: payload.party || payload.customer || payload.supplier || 'ERP User',
      warehouseId,
      warehouse: warehouseName,
    };
    delete record.createdBy;
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      record.createdBy = req.user.id;
    }

    const created = await Payment.create(record);
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
    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body || {}, { returnDocument: 'after' }).lean();
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
