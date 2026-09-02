const express = require('express');
const router = express.Router();
const { requireAuth, authorize } = require('../middleware/auth.middleware');
const Payment = require('../models/payment.model');
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');

const mongoose = require('mongoose');

// Aggregated reports endpoint (read-only)
router.get('/', requireAuth, authorize('reports'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        salesSummary: { total: 0, transactions: 0, period: 'All time' },
        inventorySummary: { itemsLow: 0 },
        financeSummary: { payable: 0, receivable: 0, byStatus: [] },
        paymentMethods: [],
      });
    }

    // sales summary
    const salesAgg = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]).catch(() => []);
    const salesSummary = { total: salesAgg[0] ? salesAgg[0].total : 0, transactions: salesAgg[0] ? salesAgg[0].count : 0, period: 'All time' };

    // inventory summary (low stock)
    const lowStockCount = await Product.countDocuments({ $expr: { $lt: ['$stock', '$reorderLevel'] } }).catch(() => 0);
    const inventorySummary = { itemsLow: lowStockCount };

    const [warehouseAgg, productAgg, categoryAgg, trendAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { status: { $in: ['Paid', 'Completed'] } } },
        { $group: { _id: '$warehouseId', revenue: { $sum: '$total' }, transactions: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { status: { $in: ['Paid', 'Completed'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', sales: { $sum: '$items.quantity' }, value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { value: -1 } },
        { $limit: 10 },
      ]),
      Sale.aggregate([
        { $match: { status: { $in: ['Paid', 'Completed'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { value: -1 } },
      ]),
      Sale.aggregate([
        { $match: { status: { $in: ['Paid', 'Completed'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
        { $limit: 31 },
      ]),
    ]);
    const warehouseNames = await Warehouse.find({ _id: { $in: warehouseAgg.map((item) => item._id).filter(Boolean) } }).select('name').lean();
    const warehouseNameById = new Map(warehouseNames.map((item) => [String(item._id), item.name]));
    const warehouseData = warehouseAgg.map((item) => ({
      name: warehouseNameById.get(String(item._id)) || 'Unassigned warehouse',
      warehouse: warehouseNameById.get(String(item._id)) || 'Unassigned warehouse',
      revenue: item.revenue || 0,
      margin: 0,
      expenses: 0,
    }));

    // finance summary from payments
    const paymentsAgg = await Payment.aggregate([
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]).catch(() => []);
    const financeSummary = { payable: 0, receivable: 0, byStatus: paymentsAgg };

    // payment methods breakdown
    const methodsAgg = await Payment.aggregate([
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]).catch(() => []);

    return res.json({
      salesSummary, inventorySummary, financeSummary, paymentMethods: methodsAgg,
      warehouseData,
      productPerformance: productAgg.map((item) => ({ name: item._id, sales: item.sales, value: item.value })),
      categoryPerformance: categoryAgg.map((item) => ({ name: item._id, value: item.value })),
      salesTrend: trendAgg.map((item) => ({ label: item._id, value: item.value })),
    });
  } catch (err) {
    console.error('reports error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
