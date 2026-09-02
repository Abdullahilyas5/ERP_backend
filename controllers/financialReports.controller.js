const Sale = require('../models/sale.model');
const Expense = require('../models/expense.model');
const Payment = require('../models/payment.model');
const Warehouse = require('../models/warehouse.model');

async function getFinancialReports(req, res) {
  try {
    const [sales, expenses, payments, warehouses] = await Promise.all([
      Sale.find().select('total createdAt warehouse warehouseId').lean(),
      Expense.find().select('amount warehouse warehouseId date').lean(),
      Payment.find().select('amount direction date').lean(),
      Warehouse.find().select('name').lean(),
    ]);

    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const incoming = payments.filter((payment) => payment.direction === 'incoming').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const outgoing = payments.filter((payment) => payment.direction === 'outgoing').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const warehouseMetrics = warehouses.map((warehouse) => {
      const salesTotal = sales.filter((sale) => String(sale.warehouseId || '') === String(warehouse._id) || sale.warehouse === warehouse.name)
        .reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const expensesTotal = expenses.filter((expense) => String(expense.warehouseId || '') === String(warehouse._id) || expense.warehouse === warehouse.name)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return { name: warehouse.name, warehouse: warehouse.name, revenue: salesTotal, expenses: expensesTotal, profit: salesTotal - expensesTotal };
    });

    return res.json({
      pAndLRows: [
        { label: 'Gross Revenue', value: revenue, type: 'income' },
        { label: 'Operating Expenses', value: expenseTotal, type: 'expense' },
        { label: 'Net Operating Income', value: revenue - expenseTotal, type: 'income' },
      ],
      cashFlow: [{ month: 'Current', incoming, outgoing }],
      warehouseMetrics,
      summary: { revenue, expenses: expenseTotal, netCash: incoming - outgoing },
    });
  } catch (error) {
    console.error('financial reports error', error);
    return res.status(500).json({ message: 'Unable to load financial reports.' });
  }
}

module.exports = { getFinancialReports };
