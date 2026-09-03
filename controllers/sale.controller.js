const mongoose = require('mongoose');
const saleService = require('../services/sale.service');
const Product = require('../models/product.model');

async function getSale(req, res) {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found.' });
    return res.json(sale);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function listSales(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.customerName) filter.customerName = { $regex: req.query.customerName, $options: 'i' };
    if (req.query.cashier) {
      const cashier = { $regex: req.query.cashier, $options: 'i' };
      filter.$or = [{ cashierName: cashier }, { 'metadata.cashierName': cashier }];
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(`${req.query.from}T00:00:00.000Z`);
      if (req.query.to) filter.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
    }
    const sales = await saleService.listSales(filter, { skip, limit });
    return res.json(sales);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createSale(req, res) {
  try {
    const {
      items = [],
      channel = 'Cash',
      customer,
      paymentMethod = channel,
      paidAmount,
      warehouseId,
      warehouseName,
      cashAccount,
      accountType,
      cashierName,
      customerName,
      discount = 0,
      notes = '',
    } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'At least one item required.' });

    // compute subtotal and totals server-side
    let subtotal = 0;
    const normalizedItems = [];
    for (const it of items) {
      // it: { productId, sku, quantity }
      let product = null;
      if (it.productId && mongoose.isValidObjectId(it.productId)) {
        product = await Product.findById(it.productId).lean();
      }
      if (!product && it.sku) product = await Product.findOne({ sku: it.sku }).lean();
      if (!product) return res.status(400).json({ message: `Product not found for ${it.productId || it.sku}` });
      const qty = Number(it.quantity || 1);
      const price = Number(it.price != null ? it.price : product.price || 0);
      subtotal += price * qty;
      normalizedItems.push({ productId: product._id, sku: product.sku, name: product.name, price, quantity: qty });
    }

    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const invoiceId = `INV-${Date.now()}`;

    const sale = await saleService.createSale({
      invoiceId,
      items: normalizedItems,
      subtotal,
      tax,
      total,
      discount: Number(discount),
      paidAmount: paidAmount == null ? total : Number(paidAmount),
      balanceDue: Math.max(0, total - Number(paidAmount == null ? total : paidAmount)),
      changeDue: Math.max(0, Number(paidAmount == null ? total : paidAmount) - total),
      customer,
      customerName,
      cashierName: cashierName || req.user?.name || '',
      channel,
      paymentMethod,
      warehouseId,
      warehouseName,
      cashAccount,
      accountType,
      notes,
      status: 'Paid',
      createdBy: req.user?.id,
    });

    return res.status(201).json(sale);
  } catch (err) {
    console.error('createSale error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listSales, getSale, createSale };
