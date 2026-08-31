const Expense = require('../models/expense.model');

async function listExpenses(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const items = await Expense.find().skip(skip).limit(Number(limit)).lean();
    return res.json(items);
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
    const created = await Expense.create(payload);
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
