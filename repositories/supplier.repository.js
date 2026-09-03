const Supplier = require('../models/supplier.model');

async function createSupplier(data) {
  const s = new Supplier(data);
  return s.save();
}

async function listSuppliers(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  return Supplier.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean();
}

async function countSuppliers(filter = {}) {
  return Supplier.countDocuments(filter);
}

async function getSupplierById(id) {
  return Supplier.findById(id).lean();
}

async function updateSupplier(id, patch) {
  return Supplier.findByIdAndUpdate(id, patch, { returnDocument: 'after', runValidators: true }).lean();
}

async function deleteSupplier(id) {
  return Supplier.findByIdAndDelete(id);
}

module.exports = { createSupplier, listSuppliers, countSuppliers, getSupplierById, updateSupplier, deleteSupplier };
