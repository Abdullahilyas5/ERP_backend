const Sale = require('../models/sale.model');
const Expense = require('../models/expense.model');
const Payment = require('../models/payment.model');
const Warehouse = require('../models/warehouse.model');

async function getFinancialReports(req, res) {
  try {
    const range = ['today', 'week', 'month', 'quarter', 'year'].includes(req.query.range) ? req.query.range : 'month';
    const now = new Date();
    const start = new Date(now);
    if (range === 'today') start.setHours(0, 0, 0, 0);
    if (range === 'week') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    }
    if (range === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    if (range === 'quarter') {
      start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
      start.setHours(0, 0, 0, 0);
    }
    if (range === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }
    const [sales, expenses, payments, warehouses] = await Promise.all([
      Sale.find().select('total createdAt warehouse warehouseId').lean(),
      Expense.find().select('amount warehouse warehouseId date').lean(),
      Payment.find().select('amount direction date createdAt warehouse warehouseId').lean(),
      Warehouse.find().select('name').lean(),
    ]);
    const inRange = (value, fallback) => {
      const date = new Date(value || fallback || now);
      return !Number.isNaN(date.getTime()) && date >= start && date <= now;
    };
    const requestedWarehouse = String(req.query.warehouse || '').trim();
    const belongsToWarehouse = (record) => !requestedWarehouse
      || String(record.warehouseId || '') === requestedWarehouse
      || String(record.warehouse || '').trim() === requestedWarehouse;
    const filteredSales = sales.filter((sale) => inRange(sale.createdAt) && belongsToWarehouse(sale));
    const filteredExpenses = expenses.filter((expense) => inRange(expense.date, expense.createdAt) && belongsToWarehouse(expense));
    const filteredPayments = payments.filter((payment) => inRange(payment.date, payment.createdAt) && belongsToWarehouse(payment));

    const revenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const incoming = filteredPayments.filter((payment) => payment.direction === 'incoming').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const outgoing = filteredPayments.filter((payment) => payment.direction === 'outgoing').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const flowByPeriod = filteredPayments.reduce((groups, payment) => {
      const date = new Date(payment.date || payment.createdAt);
      if (Number.isNaN(date.getTime())) return groups;
      const key = range === 'today' || range === 'week'
        ? date.toISOString().slice(0, 10)
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const group = groups.get(key) || { key, incoming: 0, outgoing: 0 };
      group[payment.direction] += Number(payment.amount || 0);
      groups.set(key, group);
      return groups;
    }, new Map());
    const cashFlow = [...flowByPeriod.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((item) => ({
        month: range === 'today' || range === 'week' ? item.key : item.key.slice(0, 7),
        incoming: item.incoming,
        outgoing: item.outgoing,
        net: item.incoming - item.outgoing,
      }));

    const warehouseMetrics = warehouses.map((warehouse) => {
      const salesTotal = filteredSales.filter((sale) => String(sale.warehouseId || '') === String(warehouse._id) || sale.warehouse === warehouse.name)
        .reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const expensesTotal = filteredExpenses.filter((expense) => String(expense.warehouseId || '') === String(warehouse._id) || expense.warehouse === warehouse.name)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return { name: warehouse.name, warehouse: warehouse.name, revenue: salesTotal, expenses: expensesTotal, profit: salesTotal - expensesTotal };
    });

    return res.json({
      pAndLRows: [
        { label: 'Gross Revenue', value: revenue, type: 'income' },
        { label: 'Operating Expenses', value: expenseTotal, type: 'expense' },
        { label: 'Net Operating Income', value: revenue - expenseTotal, type: 'income' },
      ],
      cashFlow: cashFlow.length > 0 ? cashFlow : [{ month: 'Current period', incoming, outgoing, net: incoming - outgoing }],
      warehouseMetrics,
      summary: { revenue, expenses: expenseTotal, incoming, outgoing, netCash: incoming - outgoing, range },
    });
  } catch (error) {
    console.error('financial reports error', error);
    return res.status(500).json({ message: 'Unable to load financial reports.' });
  }
}

module.exports = { getFinancialReports };
