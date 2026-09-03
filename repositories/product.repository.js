const Product = require('../models/product.model');

async function createProduct(data) {
  return new Product(data).save();
}

async function listProducts(filter = {}, opts = {}) {
  const skip = Math.max(0, Number(opts.skip) || 0);
  const limit = Math.max(1, Number(opts.limit) || 100);
  return Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
}

async function getProductById(id) {
  return Product.findById(id).lean();
}

async function updateProduct(id, patch) {
  return Product.findByIdAndUpdate(id, patch, { returnDocument: 'after', runValidators: true }).lean();
}

async function deleteProduct(id) {
  return Product.findByIdAndDelete(id);
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
