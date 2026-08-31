const Product = require('../models/product.model');

async function createProduct(data) {
  const p = new Product(data);
  return p.save();
}

async function listProducts(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  return Product.find(filter).skip(Number(skip)).limit(Number(limit)).lean();
}

async function getProductById(id) {
  return Product.findById(id).lean();
}

async function updateProduct(id, patch) {
  if (patch.sku) patch.sku = String(patch.sku);
  if (patch.price != null) patch.price = Number(patch.price);
  if (patch.stock != null) patch.stock = Number(patch.stock);
  if (patch.reorderLevel != null) patch.reorderLevel = Number(patch.reorderLevel);
  if (patch.stock != null && patch.reorderLevel != null) {
    patch.status = patch.stock <= patch.reorderLevel ? 'Low Stock' : 'In Stock';
  }
  return Product.findByIdAndUpdate(id, patch, { new: true }).lean();
}

async function deleteProduct(id) {
  return Product.findByIdAndDelete(id);
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
