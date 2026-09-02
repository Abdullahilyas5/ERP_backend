const Product = require('../models/product.model');
const Sale = require('../models/sale.model');
const Customer = require('../models/customer.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

const PAID_SALE_STATUSES = ['Paid', 'Completed'];

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function comparison(today, yesterday, hasPreviousData = true) {
  const current = Number(today || 0);
  const previous = yesterday == null ? null : Number(yesterday || 0);
  if (previous == null || !hasPreviousData) {
    return { today: current, yesterday: null, change: null, changePercent: null, hasPreviousData: false };
  }

  const change = money(current - previous);
  return {
    today: current,
    yesterday: previous,
    change,
    changePercent: previous === 0 ? null : money((change / Math.abs(previous)) * 100),
    hasPreviousData: true,
  };
}

async function dailySales(start, end) {
  const result = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lt: end },
        status: { $in: PAID_SALE_STATUSES },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$total', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { total: 0, count: 0 };
}

async function getDashboard(req, res) {
  try {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todaySales, yesterdaySales, activeCustomers, activeYesterday, newCustomersToday, newCustomersYesterday, products, inventoryChanges] = await Promise.all([
      dailySales(today, tomorrow),
      dailySales(yesterday, today),
      Customer.countDocuments({ status: 'Active' }),
      Customer.countDocuments({ status: 'Active', createdAt: { $lt: today } }),
      Customer.countDocuments({ status: 'Active', createdAt: { $gte: today, $lt: tomorrow } }),
      Customer.countDocuments({ status: 'Active', createdAt: { $gte: yesterday, $lt: today } }),
      Product.find().select('price stock').lean(),
      InventoryTransaction.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: '$productId', qty: { $sum: { $ifNull: ['$qty', 0] } } } },
      ]),
    ]);

    const changesByProduct = new Map(inventoryChanges.map((item) => [String(item._id), Number(item.qty || 0)]));
    const inventoryValue = products.reduce((sum, product) => sum + (Number(product.price || 0) * Number(product.stock || 0)), 0);
    // Reverse today's recorded movements to provide the end-of-yesterday snapshot.
    const inventoryValueYesterday = products.reduce((sum, product) => {
      const yesterdayStock = Number(product.stock || 0) - (changesByProduct.get(String(product._id)) || 0);
      return sum + (Number(product.price || 0) * yesterdayStock);
    }, 0);

    const salesToday = money(todaySales.total);
    const salesYesterday = money(yesterdaySales.total);
    const inventoryToday = money(inventoryValue);
    const inventoryYesterday = money(inventoryValueYesterday);
    return res.json({
      grossSales: `$${salesToday.toFixed(2)}`,
      inventoryValue: `$${inventoryToday.toFixed(2)}`,
      activeCustomers,
      newCustomersToday,
      transactions: todaySales.count,
      metricDate: dateKey(today),
      grossSalesToday: salesToday,
      grossSalesYesterday: salesYesterday,
      inventoryValueToday: inventoryToday,
      inventoryValueYesterday: inventoryYesterday,
      activeCustomersYesterday: activeYesterday,
      newCustomersYesterday,
      transactionsToday: todaySales.count,
      transactionsYesterday: yesterdaySales.count,
      comparisons: {
        grossSales: comparison(salesToday, salesYesterday),
        inventoryValue: comparison(inventoryToday, inventoryYesterday),
        activeCustomers: comparison(activeCustomers, activeYesterday),
        transactions: comparison(todaySales.count, yesterdaySales.count),
        newCustomers: comparison(newCustomersToday, newCustomersYesterday),
      },
    });
  } catch (err) {
    console.error('dashboard error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getDashboard };
