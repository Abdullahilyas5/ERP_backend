const Product = require('../models/product.model');
const StockTransfer = require('../models/stockTransfer.model');

async function getInventoryOverview(req, res) {
  try {
    // low stock alerts
    const lowStock = await Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } }).lean();
    // recent moves: stock transfers
    const transfers = await StockTransfer.find().sort({ createdAt: -1 }).limit(20).lean();
    return res.json({ alerts: lowStock, transfers });
  } catch (err) {
    console.error('inventory error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getInventoryOverview };
