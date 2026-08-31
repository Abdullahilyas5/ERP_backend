const customerService = require('../services/customer.service');

async function listCustomers(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const customers = await customerService.listCustomers({}, { skip, limit });
    return res.json(customers);
  } catch (err) {
    console.error('listCustomers error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createCustomer(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ message: 'name is required.' });
    const created = await customerService.createCustomer(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createCustomer error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getCustomer(req, res) {
  try {
    const c = await customerService.getCustomerById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Customer not found.' });
    return res.json(c);
  } catch (err) {
    console.error('getCustomer error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateCustomer(req, res) {
  try {
    const updated = await customerService.updateCustomer(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ message: 'Customer not found.' });
    return res.json(updated);
  } catch (err) {
    console.error('updateCustomer error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deleteCustomer(req, res) {
  try {
    await customerService.deleteCustomer(req.params.id);
    return res.status(204).end();
  } catch (err) {
    console.error('deleteCustomer error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listCustomers, createCustomer, getCustomer, updateCustomer, deleteCustomer };
