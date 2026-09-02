const Customer = require('../models/customer.model');

async function createCustomer(data) {
  const payload = { ...data };
  if (!payload.customerCode || !String(payload.customerCode).trim()) {
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
  return { items, total, page: Math.floor(normalizedSkip / normalizedLimit) + 1, limit: normalizedLimit };
}

async function getCustomerById(id) {
  return Customer.findById(id).lean();
}

async function updateCustomer(id, patch) {
  if (patch.spend != null) patch.spend = Number(patch.spend);
  if (patch.visits != null) patch.visits = Number(patch.visits);
  if (patch.loyalty != null) patch.loyalty = Number(patch.loyalty);
  return Customer.findByIdAndUpdate(id, patch, { new: true }).lean();
}

async function deleteCustomer(id) {
  return Customer.findByIdAndDelete(id);
}

module.exports = { createCustomer, listCustomers, getCustomerById, updateCustomer, deleteCustomer };
