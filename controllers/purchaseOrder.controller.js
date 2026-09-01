const poService = require('../services/purchaseOrder.service');

async function listPOs(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const items = await poService.listPurchaseOrders({}, { skip, limit });
    return res.json(items);
  } catch (err) {
    console.error('listPOs error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createPO(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.supplier || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ message: 'supplier and items are required.' });
    }
    payload.createdBy = req.user?.id;
    const created = await poService.createPurchaseOrder(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createPO error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getPO(req, res) {
  try {
    const p = await poService.getPurchaseOrder(req.params.id);
    if (!p) return res.status(404).json({ message: 'Purchase order not found.' });
    return res.json(p);
  } catch (err) {
    console.error('getPO error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function receivePO(req, res) {
  try {
    const receivedItems = req.body.items || [];
    const po = await poService.receivePurchaseOrder(req.params.id, receivedItems, req.user?.id);
    return res.json(po);
  } catch (err) {
    console.error('receivePO error', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
}

module.exports = { listPOs, createPO, getPO, receivePO };
