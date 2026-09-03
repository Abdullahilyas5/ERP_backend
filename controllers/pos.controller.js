const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Customer = require('../models/customer.model');
const Warehouse = require('../models/warehouse.model');
const saleService = require('../services/sale.service');

function catalogItem(product) {
  const id = String(product._id || product.id || product.sku);
  return {
    ...product,
    _id: id,
    id,
    price: Number(product.price ?? product.sellingPrice ?? 0),
    sellingPrice: Number(product.sellingPrice ?? product.price ?? 0),
  };
}

async function listCatalog(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'ERP database is unavailable; POS catalog cannot be loaded.' });
    }
    const products = await Product.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();
    return res.json({ items: products.map(catalogItem) });
  } catch (error) {
    console.error('list POS catalog error', error);
    return res.status(500).json({ message: 'Unable to load the POS catalog.' });
  }
}

async function listWarehouses(req, res) {
  try {
    const warehouses = await Warehouse.find({ status: 'Active' })
      .sort({ name: 1 })
      .select('_id code name location')
      .lean();
    return res.json({ items: warehouses });
  } catch (error) {
    console.error('list POS warehouses error', error);
    return res.status(500).json({ message: 'Unable to load POS branches.' });
  }
}

async function checkout(req, res) {
  try {
    const {
      items = [], paymentMethod = 'Cash', customer, customerName, cashReceived,
      warehouseId, warehouseName, cashierName,
    } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Add at least one item before checkout.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'ERP database is unavailable; POS sales cannot be recorded.' });
    }
    if (!warehouseId) {
      return res.status(400).json({ message: 'Select the branch handling this sale.' });
    }
    const warehouse = await Warehouse.findOne({ _id: warehouseId, status: 'Active' }).lean().catch(() => null);
    if (!warehouse) {
      return res.status(400).json({ message: 'The selected branch is not available.' });
    }

    const normalizedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId).lean().catch(() => null)
        || await Product.findOne({ sku: item.sku }).lean();
      if (!product) return res.status(400).json({ message: `Product not found: ${item.name || item.sku || item.productId}.` });

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ message: `Enter a whole quantity greater than zero for ${product.name}.` });
      }
      if (Number(product.stock || 0) < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}.` });
      }

      const price = Number(product.price ?? product.sellingPrice ?? 0);
      subtotal += price * quantity;
      normalizedItems.push({ productId: product._id, sku: product.sku, name: product.name, price, costPrice: product.costPrice, quantity, warehouseId: warehouse._id });
    }

    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    if (paymentMethod === 'Cash' && Number(cashReceived || 0) < total) {
      return res.status(400).json({ message: 'Cash received must cover the order total.' });
    }
    const customerRecord = customer ? await Customer.findById(customer).lean().catch(() => null) : null;
    const sale = await saleService.createSale({
      invoiceId: `INV-${Date.now()}`,
      items: normalizedItems,
      subtotal,
      tax,
      total,
      paidAmount: paymentMethod === 'Cash' ? Number(cashReceived || 0) : total,
      changeDue: paymentMethod === 'Cash' ? Math.max(0, Number(cashReceived || 0) - total) : 0,
      customer: customerRecord?._id || null,
      customerName: customerRecord?.name || customerName || 'Walk-in Customer',
      channel: paymentMethod,
      paymentMethod,
      status: 'Paid',
      paymentStatus: 'Completed',
      createdBy: req.user.id,
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      warehouse: warehouse.name,
      metadata: { cashierName: req.user?.name || cashierName || req.user?.email || 'Current cashier' },
    });

    return res.status(201).json({ ...sale, changeDue: paymentMethod === 'Cash' ? Number((Number(cashReceived) - total).toFixed(2)) : 0 });
  } catch (error) {
    console.error('POS checkout error', error);
    return res.status(500).json({ message: error.message || 'Unable to complete the POS checkout.' });
  }
}

module.exports = { listCatalog, listWarehouses, checkout };
