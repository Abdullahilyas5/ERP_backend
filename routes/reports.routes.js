const express = require('express');
const router = express.Router();
const { requireAuth, authorize } = require('../middleware/auth.middleware');
const Payment = require('../models/payment.model');
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');

// Aggregated reports endpoint (read-only)
router.get('/', requireAuth, authorize('reports'), async (req, res) => {
  try {
    // sales summary
    const salesAgg = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const salesSummary = { total: salesAgg[0] ? salesAgg[0].total : 0, transactions: salesAgg[0] ? salesAgg[0].count : 0, period: 'All time' };

    // inventory summary (low stock)
    const lowStockCount = await Product.countDocuments({ $expr: { $lt: ['$stock', '$reorderLevel'] } }).catch(() => 0);
    const inventorySummary = { itemsLow: lowStockCount };

    // finance summary from payments
    const paymentsAgg = await Payment.aggregate([
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const financeSummary = { payable: 0, receivable: 0, byStatus: paymentsAgg };

    // payment methods breakdown
    const methodsAgg = await Payment.aggregate([
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    return res.json({ salesSummary, inventorySummary, financeSummary, paymentMethods: methodsAgg });
  } catch (err) {
    console.error('reports error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
