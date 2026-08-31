const productRepo = require('../repositories/product.repository');

async function createProduct(data) {
  return productRepo.createProduct(data);
}

async function listProducts(filter, opts) {
  return productRepo.listProducts(filter, opts);
}

async function getProductById(id) {
  return productRepo.getProductById(id);
}

async function updateProduct(id, patch) {
  return productRepo.updateProduct(id, patch);
}

async function deleteProduct(id) {
  return productRepo.deleteProduct(id);
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
