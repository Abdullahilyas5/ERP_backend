const Customer = require('../models/customer.model');
const Sale = require('../models/sale.model');

async function createCustomer(data) {
  const payload = { ...data };
  if (!String(payload.customerCode || '').trim()) {
    payload.customerCode = `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  payload.name = String(payload.name || '').trim();
  if (!payload.name) throw new Error('Customer name is required.');
  const c = new Customer(payload);
  return c.save();
}

async function listCustomers(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  const normalizedLimit = Math.max(1, Number(limit) || 100);
  const normalizedSkip = Math.max(0, Number(skip) || 0);
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(normalizedSkip).limit(normalizedLimit).lean(),
    Customer.countDocuments(filter),
  ]);
  const customerIds = items.map((customer) => customer._id);
  const orderStats = customerIds.length
    ? await Sale.aggregate([
      { $match: { customer: { $in: customerIds }, status: { $nin: ['Cancelled', 'Refunded'] } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: { $ifNull: ['$total', 0] } },
          orderCount: { $sum: 1 },
          lastOrder: { $first: '$invoiceId' },
          lastOrderDate: { $first: '$createdAt' },
        },
      },
    ])
    : [];
  const statsByCustomer = new Map(orderStats.map((stats) => [String(stats._id), stats]));
  const enrichedItems = items.map((customer) => {
    const stats = statsByCustomer.get(String(customer._id));
    return {
      ...customer,
      totalSpent: Number(stats?.totalSpent || 0),
      orderCount: Number(stats?.orderCount || 0),
      lastOrder: stats?.lastOrder || null,
      lastOrderDate: stats?.lastOrderDate || null,
    };
  });
  return { items: enrichedItems, total, page: Math.floor(normalizedSkip / normalizedLimit) + 1, limit: normalizedLimit };
}

async function getCustomerById(id) {
  return Customer.findById(id).lean();
}

async function updateCustomer(id, patch) {
  if (patch.spend != null) patch.spend = Number(patch.spend);
  if (patch.visits != null) patch.visits = Number(patch.visits);
  if (patch.loyalty != null) patch.loyalty = Number(patch.loyalty);
  return Customer.findByIdAndUpdate(id, patch, { returnDocument: 'after' }).lean();
}

async function deleteCustomer(id) {
  return Customer.findByIdAndDelete(id);
}

module.exports = { createCustomer, listCustomers, getCustomerById, updateCustomer, deleteCustomer };
