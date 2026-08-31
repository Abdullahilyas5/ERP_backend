const saleRepo = require('../repositories/sale.repository');

async function createSale(data) {
  return saleRepo.createSale(data);
}

async function listSales(filter, opts) {
  return saleRepo.listSales(filter, opts);
}

async function getSaleById(id) {
  return saleRepo.getSaleById(id);
}

module.exports = { createSale, listSales, getSaleById };
