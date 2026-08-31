const Customer = require('../models/customer.model');

async function createCustomer(data) {
  const c = new Customer(data);
  return c.save();
}

async function listCustomers(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  return Customer.find(filter).skip(Number(skip)).limit(Number(limit)).lean();
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
