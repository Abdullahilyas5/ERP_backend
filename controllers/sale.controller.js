const saleService = require('../services/sale.service');
const Product = require('../models/product.model');

async function listSales(req, res) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const sales = await saleService.listSales({}, { skip, limit });
    return res.json(sales);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createSale(req, res) {
  try {
    const { items = [], channel = 'Cash', customer } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'At least one item required.' });

    // compute subtotal and totals server-side
    let subtotal = 0;
    const normalizedItems = [];
    for (const it of items) {
      // it: { productId, sku, quantity }
      let product = null;
      if (it.productId) product = await Product.findById(it.productId).lean();
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

    const sale = await saleService.createSale({ invoiceId, items: normalizedItems, subtotal, tax, total, customer, channel, status: 'Paid', createdBy: req.user?.id });

    return res.status(201).json(sale);
  } catch (err) {
    console.error('createSale error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listSales, createSale };
