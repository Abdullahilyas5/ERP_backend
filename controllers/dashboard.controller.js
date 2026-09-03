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

function parseDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()) || dateKey(date) !== value) return null;
  return startOfDay(date);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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

async function salesInsights(start, end, timezone = 'UTC') {
  const [trend, heatmap] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, status: { $in: PAID_SALE_STATUSES } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } }, value: { $sum: { $ifNull: ['$total', 0] } }, transactions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, status: { $in: PAID_SALE_STATUSES } } },
      { $group: { _id: { day: { $dayOfWeek: { date: '$createdAt', timezone } }, hour: { $hour: { date: '$createdAt', timezone } } }, value: { $sum: { $ifNull: ['$total', 0] } }, transactions: { $sum: 1 } } },
    ]),
  ]);
  const byDate = new Map(trend.map((item) => [item._id, item]));
  const filledTrend = [];
  for (let date = new Date(start); date < end; date = addDays(date, 1)) {
    const item = byDate.get(dateKey(date));
    filledTrend.push({ label: dateKey(date), value: money(item?.value), transactions: item?.transactions || 0 });
  }
  return {
    trend: filledTrend,
    heatmap: heatmap.map((item) => ({ day: item._id.day - 1, hour: item._id.hour, value: money(item.value), transactions: item.transactions })),
  };
}

async function getDashboard(req, res) {
  try {
    const today = startOfDay(new Date());
    const requestedStart = req.query.startDate ? parseDate(req.query.startDate) : today;
    const requestedEnd = req.query.endDate ? parseDate(req.query.endDate) : requestedStart;
    if (!requestedStart || !requestedEnd) {
      return res.status(400).json({ message: 'Dates must use YYYY-MM-DD format.' });
    }
    const selectedStart = requestedStart;
    const selectedEnd = addDays(requestedEnd, 1);
    if (selectedEnd <= selectedStart || (selectedEnd - selectedStart) > 366 * 86400000) {
      return res.status(400).json({ message: 'Select a valid date range of up to one year.' });
    }
    const periodDays = Math.round((selectedEnd - selectedStart) / 86400000);
    const previousStart = addDays(selectedStart, -periodDays);
    const previousEnd = selectedStart;
    const tomorrow = addDays(today, 1);
    const yesterday = addDays(today, -1);

    const timezone = typeof req.query.timezone === 'string' && /^[A-Za-z_]+(?:\/[A-Za-z_+-]+)+$/.test(req.query.timezone)
      ? req.query.timezone
      : 'UTC';
    const [periodSales, previousSales, insights, todaySales, yesterdaySales, activeCustomers, activeYesterday, newCustomersToday, newCustomersYesterday, products, inventoryChanges] = await Promise.all([
      dailySales(selectedStart, selectedEnd),
      dailySales(previousStart, previousEnd),
      salesInsights(selectedStart, selectedEnd, timezone),
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

    const salesToday = money(periodSales.total);
    const salesYesterday = money(previousSales.total);
    const inventoryToday = money(inventoryValue);
    const inventoryYesterday = money(inventoryValueYesterday);
    return res.json({
      grossSales: `$${salesToday.toFixed(2)}`,
      inventoryValue: `$${inventoryToday.toFixed(2)}`,
      activeCustomers,
      newCustomersToday,
      transactions: periodSales.count,
      metricDate: `${dateKey(selectedStart)} to ${dateKey(addDays(selectedEnd, -1))}`,
      grossSalesToday: salesToday,
      grossSalesYesterday: salesYesterday,
      inventoryValueToday: inventoryToday,
      inventoryValueYesterday: inventoryYesterday,
      activeCustomersYesterday: activeYesterday,
      newCustomersYesterday,
      transactionsToday: periodSales.count,
      transactionsYesterday: previousSales.count,
      salesTrend: insights.trend,
      salesHeatmap: insights.heatmap,
      range: { startDate: dateKey(selectedStart), endDate: dateKey(addDays(selectedEnd, -1)), days: periodDays },
      comparisons: {
        grossSales: comparison(salesToday, salesYesterday),
        inventoryValue: comparison(inventoryToday, inventoryYesterday),
        activeCustomers: comparison(activeCustomers, activeYesterday),
        transactions: comparison(periodSales.count, previousSales.count),
        newCustomers: comparison(newCustomersToday, newCustomersYesterday),
      },
    });
  } catch (err) {
    console.error('dashboard error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getDashboard };
