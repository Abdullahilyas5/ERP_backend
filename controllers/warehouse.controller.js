const Warehouse = require('../models/warehouse.model');

async function listWarehouses(req, res) {
  try {
    const { page = 1, limit = 100, status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Warehouse.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Warehouse.countDocuments(filter),
    ]);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listWarehouses error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createWarehouse(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.name || !payload.code || !payload.location) {
      return res.status(400).json({ message: 'name, code and location are required.' });
    }

    const created = await Warehouse.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createWarehouse error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Warehouse code already exists.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getWarehouse(req, res) {
  try {
    const item = await Warehouse.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Warehouse not found.' });
    return res.json(item);
  } catch (err) {
    console.error('getWarehouse error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const item = await Warehouse.findByIdAndUpdate(req.params.id, req.body || {}, { returnDocument: 'after' }).lean();
    if (!item) return res.status(404).json({ message: 'Warehouse not found.' });
    return res.json(item);
  } catch (err) {
    console.error('updateWarehouse error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    return res.status(204).end();
  } catch (err) {
    console.error('deleteWarehouse error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listWarehouses, createWarehouse, getWarehouse, updateWarehouse, deleteWarehouse };
