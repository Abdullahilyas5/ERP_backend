const supplierRepo = require('../repositories/supplier.repository');

async function createSupplier(data) {
  return supplierRepo.createSupplier(data);
}

async function listSuppliers(filter, opts) {
  return supplierRepo.listSuppliers(filter, opts);
}

async function countSuppliers(filter) {
  return supplierRepo.countSuppliers(filter);
}

async function getSupplierById(id) {
  return supplierRepo.getSupplierById(id);
}

async function updateSupplier(id, patch) {
  return supplierRepo.updateSupplier(id, patch);
}

async function deleteSupplier(id) {
  return supplierRepo.deleteSupplier(id);
}

module.exports = { createSupplier, listSuppliers, countSuppliers, getSupplierById, updateSupplier, deleteSupplier };

