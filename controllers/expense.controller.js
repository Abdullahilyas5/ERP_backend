const Expense = require('../models/expense.model');
const Warehouse = require('../models/warehouse.model');

async function listExpenses(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Expense.find().sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Expense.countDocuments(),
    ]);
    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listExpenses error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createExpense(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.ref || !payload.category || payload.amount == null) {
      return res.status(400).json({ message: 'ref, category and amount are required.' });
    }
    if (!payload.warehouseId) {
      return res.status(400).json({ message: 'warehouseId is required.' });
    }
    const warehouse = await Warehouse.findOne({ _id: payload.warehouseId, status: 'Active' }).lean().catch(() => null);
    if (!warehouse) {
      return res.status(400).json({ message: 'The selected warehouse is not available.' });
    }
    const created = await Expense.create({
      ...payload,
      warehouseId: warehouse._id,
      warehouse: warehouse.name,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error('createExpense error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Reference already exists.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getExpense(req, res) {
  try {
    const item = await Expense.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Expense not found.' });
    return res.json(item);
  } catch (err) {
    console.error('getExpense error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateExpense(req, res) {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body || {}, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Expense not found.' });
    return res.json(updated);
  } catch (err) {
    console.error('updateExpense error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deleteExpense(req, res) {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    return res.status(204).end();
  } catch (err) {
    console.error('deleteExpense error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listExpenses, createExpense, getExpense, updateExpense, deleteExpense };
