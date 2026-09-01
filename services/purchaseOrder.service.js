const poRepo = require('../repositories/purchaseOrder.repository');

async function createPurchaseOrder(data) {
  return poRepo.createPurchaseOrder(data);
}

async function listPurchaseOrders(filter, opts) {
  return poRepo.listPurchaseOrders(filter, opts);
}

async function getPurchaseOrder(id) {
  return poRepo.getPurchaseOrder(id);
}

async function receivePurchaseOrder(poId, receivedItems, userId) {
  return poRepo.receivePurchaseOrder(poId, receivedItems, userId);
}

module.exports = { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder, receivePurchaseOrder };
