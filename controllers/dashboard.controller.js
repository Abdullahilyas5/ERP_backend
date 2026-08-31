const Product = require('../models/product.model');
const Sale = require('../models/sale.model');
const Customer = require('../models/customer.model');

async function getDashboard(req, res) {
  try {
    const grossSalesAgg = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const grossSales = grossSalesAgg[0] ? `$${grossSalesAgg[0].total.toFixed(2)}` : '$0.00';

    const products = await Product.find().lean();
    const inventoryValue = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);

    const activeCustomers = await Customer.countDocuments();
    const transactions = await Sale.countDocuments();

    return res.json({ grossSales, inventoryValue: `$${inventoryValue.toFixed(2)}`, activeCustomers, transactions });
  } catch (err) {
    console.error('dashboard error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getDashboard };
