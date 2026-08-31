const customerRepo = require('../repositories/customer.repository');

async function createCustomer(data) {
  return customerRepo.createCustomer(data);
}

async function listCustomers(filter, opts) {
  return customerRepo.listCustomers(filter, opts);
}

async function getCustomerById(id) {
  return customerRepo.getCustomerById(id);
}

async function updateCustomer(id, patch) {
  return customerRepo.updateCustomer(id, patch);
}

async function deleteCustomer(id) {
  return customerRepo.deleteCustomer(id);
}

module.exports = { createCustomer, listCustomers, getCustomerById, updateCustomer, deleteCustomer };
