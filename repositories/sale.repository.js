const mongoose = require('mongoose');
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const Customer = require('../models/customer.model');
const Payment = require('../models/payment.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function updateProductStatus(product) {
  const stock = Number(product.stock || 0);
  const reorderLevel = Number(product.reorderLevel || 0);
  if (stock <= 0) product.status = 'Out of Stock';
  else if (stock <= reorderLevel) product.status = 'Low Stock';
  else product.status = 'In Stock';
  return product;
}

function usingDatabase() {
  return mongoose.connection.readyState === 1;
}

async function createSale(data = {}) {
  const saleItems = Array.isArray(data.items) ? data.items : [];
  if (!saleItems.length) {
    throw new Error('Sale items are required.');
  }

  const normalizedItems = saleItems.map((item) => ({
    productId: item.productId || item.product || null,
    sku: item.sku || '',
    name: item.name || item.productName || 'Product',
    price: toNumber(item.price || item.unitPrice || 0),
    quantity: toNumber(item.quantity || item.qty || 0),
    costPrice: toNumber(item.costPrice || 0),
  }));

  const invoiceId = data.invoiceId || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const total = toNumber(data.total, 0);
  const subtotal = toNumber(data.subtotal, total);
  const tax = toNumber(data.tax, 0);
  const discount = toNumber(data.discount, 0);

  if (!usingDatabase()) {
    throw new Error('ERP database is unavailable; sales cannot be recorded.');
  }

  const session = await mongoose.startSession();
  let savedSale = null;
  let savedPayment = null;
  const topologyType = mongoose.connection.getClient()?.topology?.description?.type;
  const supportsTransactions = topologyType === 'ReplicaSet' || topologyType === 'Sharded';

  try {
    const applySale = async () => {
      const saleDoc = new Sale({
        ...data,
        invoiceId,
        items: normalizedItems,
        total,
        subtotal,
        tax,
        discount,
        status: data.status || 'Completed',
        paymentStatus: data.paymentStatus || 'Paid',
      });

      savedSale = await saleDoc.save({ session });

      for (const item of saleItems) {
        const qty = Math.abs(toNumber(item.quantity || item.qty || 0, 0));
        if (qty <= 0) continue;

        const productId = item.productId || item.product || null;
        const sku = item.sku || null;
        const product = productId ? await Product.findById(productId).session(session) : await Product.findOne({ sku }).session(session);
        if (!product) {
          throw new Error(`Product not found for sale item: ${sku || productId || 'unknown'}`);
        }

        const available = toNumber(product.stock, 0);
        if (available < qty) {
          throw new Error(`Insufficient stock for ${product.name || product.sku}. Available: ${available}`);
        }

        product.stock = available - qty;
        updateProductStatus(product);
        await product.save({ session });

        await InventoryTransaction.create([{
          productId: product._id,
          warehouseId: item.warehouseId || product.warehouseId || null,
          qty: -qty,
          type: 'sale',
          ref: savedSale._id,
          createdBy: data.createdBy || null,
          notes: `Sale of ${qty} ${product.unit || 'unit'}(s)`,
          metadata: { saleId: String(savedSale._id), productName: product.name },
        }], { session });
      }

      const paymentAmount = toNumber(data.paidAmount ?? data.total ?? savedSale.total, 0);
      if (paymentAmount > 0) {
        [savedPayment] = await Payment.create([{ 
          paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ref: savedSale.invoiceId,
          type: 'POS Payment',
          direction: 'incoming',
          party: data.customerName || data.customer || 'Walk-in Customer',
          customerId: data.customer || null,
          invoiceReference: savedSale.invoiceId,
          amount: paymentAmount,
          method: data.paymentMethod || 'Cash',
          cashAccount: data.cashAccount || 'Main Cash Drawer',
          accountType: data.accountType || 'Cash',
          status: 'Completed',
          warehouseId: data.warehouseId || null,
          warehouse: data.warehouseName || '',
          date: new Date(),
          notes: data.notes || 'POS payment',
          createdBy: data.createdBy || null,
          metadata: {
            saleId: String(savedSale._id),
            cashierName: data.metadata?.cashierName || '',
          },
        }], { session });
      }

      if (data.customer) {
        const customer = await Customer.findById(data.customer).session(session);
        if (customer) {
          customer.outstandingBalance = toNumber(customer.outstandingBalance, 0) + Math.max(0, toNumber(savedSale.total, 0) - toNumber(data.paidAmount, 0));
          await customer.save({ session });
        }
      }
    };

    if (supportsTransactions) await session.withTransaction(applySale);
    else await applySale();
  } finally {
    await session.endSession();
  }

  const sale = await Sale.findById(savedSale._id).lean();
  return { ...sale, paymentId: savedPayment?.paymentId || null };
}

async function listSales(filter = {}, opts = {}) {
  const { skip = 0, limit = 10 } = opts;
  const normalizedLimit = Math.max(1, Number(limit) || 10);
  const normalizedSkip = Math.max(0, Number(skip) || 0);

  if (!usingDatabase()) throw new Error('ERP database is unavailable; sales cannot be loaded.');

  const [items, total] = await Promise.all([
    Sale.find(filter).sort({ createdAt: -1 }).skip(normalizedSkip).limit(normalizedLimit).lean().catch(() => []),
    Sale.countDocuments(filter).catch(() => 0),
  ]);

  return {
    items,
    total,
    page: Math.floor(normalizedSkip / normalizedLimit) + 1,
    limit: normalizedLimit,
    totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
  };
}

async function getSaleById(id) {
  if (!usingDatabase()) throw new Error('ERP database is unavailable; sales cannot be loaded.');
  return Sale.findById(id).lean();
}

module.exports = { createSale, listSales, getSaleById };
