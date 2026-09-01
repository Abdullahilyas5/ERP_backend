const PurchaseOrder = require('../models/purchaseOrder.model');
const Product = require('../models/product.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

async function createPurchaseOrder(data) {
  // compute subtotal/total
  let subtotal = 0;
  const items = (data.items || []).map(it => {
    const unit = Number(it.unitPrice || 0);
    const qty = Number(it.qtyOrdered || 0);
    subtotal += unit * qty;
    return { ...it, unitPrice: unit, qtyOrdered: qty, qtyReceived: 0 };
  });
  const total = subtotal; // taxes/fees can be added later
  const poNumber = data.poNumber || `PO-${Date.now()}`;

  const po = new PurchaseOrder({ ...data, poNumber, items, subtotal, total });
  return po.save();
}

async function listPurchaseOrders(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  return PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean();
}

async function getPurchaseOrder(id) {
  return PurchaseOrder.findById(id).lean();
}

async function receivePurchaseOrder(poId, receivedItems = [], userId) {
  // receivedItems: [{ sku or productId, qtyReceived }]
  const po = await PurchaseOrder.findById(poId);
  if (!po) throw new Error('Purchase order not found');

  // update qtyReceived and product stocks
  for (const r of receivedItems) {
    const match = po.items.find(it => (r.productId && it.productId && String(it.productId) === String(r.productId)) || (r.sku && it.sku && it.sku === r.sku));
    if (!match) continue;
    const qty = Number(r.qtyReceived || 0);
    match.qtyReceived = (match.qtyReceived || 0) + qty;

    // update product stock
    try {
      if (match.productId) {
        await Product.findByIdAndUpdate(match.productId, { $inc: { stock: qty } });
      } else if (match.sku) {
        await Product.findOneAndUpdate({ sku: match.sku }, { $inc: { stock: qty } });
      }

      // record inventory transaction
      const productId = match.productId || null;
      const inv = new InventoryTransaction({ productId, qty, type: 'receipt', ref: po._id, createdBy: userId });
      await inv.save();
    } catch (err) {
      console.warn('Failed updating product stock during PO receive', err.message);
    }
  }

  // recalc status
  let allReceived = true;
  let anyReceived = false;
  for (const it of po.items) {
    if ((it.qtyReceived || 0) < (it.qtyOrdered || 0)) allReceived = false;
    if ((it.qtyReceived || 0) > 0) anyReceived = true;
  }
  po.status = allReceived ? 'Received' : anyReceived ? 'Partially Received' : po.status;
  await po.save();
  return po.toObject();
}

module.exports = { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder, receivePurchaseOrder };
