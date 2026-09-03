const express = require('express');
const router = express.Router();
const { requireAuth, authorize } = require('../middleware/auth.middleware');
const Payment = require('../models/payment.model');
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

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

    const range = ['today', 'week', 'month', 'quarter'].includes(req.query.range) ? req.query.range : 'month';
    const end = new Date();
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    if (range === 'today') { /* start already set */ }
    if (range === 'week') start.setDate(start.getDate() - 6);
    if (range === 'month') start.setDate(1);
    if (range === 'quarter') {
      start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
    }
    const saleMatch = { createdAt: { $gte: start, $lte: end }, status: { $in: ['Paid', 'Completed'] } };

    // sales summary
    const salesAgg = await Sale.aggregate([
      { $match: saleMatch },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$total', 0] } }, count: { $sum: 1 } } },
    ]).catch(() => []);
    const salesSummary = { total: salesAgg[0] ? salesAgg[0].total : 0, transactions: salesAgg[0] ? salesAgg[0].count : 0, period: 'All time' };

    // inventory summary (low stock)
    const lowStockCount = await Product.countDocuments({ $expr: { $lt: ['$stock', '$reorderLevel'] } }).catch(() => 0);
    const inventorySummary = { itemsLow: lowStockCount };

    const [warehouseAgg, productAgg, categoryAgg, trendAgg] = await Promise.all([
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$warehouseId',
            revenue: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 0] }] } },
            cost: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$items.costPrice', { $ifNull: ['$product.costPrice', 0] }] },
                  { $ifNull: ['$items.quantity', 0] },
                ],
              },
            },
            transactionIds: { $addToSet: '$_id' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', sales: { $sum: '$items.quantity' }, value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { value: -1 } },
        { $limit: 10 },
      ]),
      Sale.aggregate([
        { $match: saleMatch },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ['$product.category', 'Uncategorized'] }, value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { value: -1 } },
      ]),
      Sale.aggregate([
        { $match: saleMatch },
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
      margin: item.revenue > 0 ? (((item.revenue - (item.cost || 0)) / item.revenue) * 100) : 0,
      expenses: item.cost || 0,
      transactions: item.transactionIds?.length || 0,
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

    const stockMovement = await InventoryTransaction.find()
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .catch(() => []);

    return res.json({
      salesSummary, inventorySummary, financeSummary, paymentMethods: methodsAgg,
      warehouseData,
      productPerformance: productAgg.map((item) => ({ name: item._id, sales: item.sales, value: item.value })),
      categoryPerformance: categoryAgg.map((item) => ({ name: item._id, value: item.value })),
      salesTrend: trendAgg.map((item) => ({ label: item._id, value: item.value })),
      stockMovement,
    });
  } catch (err) {
    console.error('reports error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
