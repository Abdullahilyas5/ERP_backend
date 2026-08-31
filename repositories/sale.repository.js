const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const Customer = require('../models/customer.model');

async function createSale(data) {
  // Save sale and decrement product stocks
  const sale = new Sale(data);
  const saved = await sale.save();

  // Reduce product stock atomically
  for (const it of data.items) {
    try {
      if (it.productId) {
        await Product.findByIdAndUpdate(it.productId, { $inc: { stock: -Math.abs(Number(it.quantity)) } });
      } else if (it.sku) {
        await Product.findOneAndUpdate({ sku: it.sku }, { $inc: { stock: -Math.abs(Number(it.quantity)) } });
      }
    } catch (err) {
      // log and continue
      console.warn('Failed to update product stock for sale', err.message);
    }
  }

  // Update customer metrics (spend, visits, loyalty, tier) if customer provided
  if (data.customer) {
    try {
      const spendInc = Number(saved.total || data.total || 0);
      const loyaltyInc = Math.floor(spendInc || 0);
      const updated = await Customer.findByIdAndUpdate(
        data.customer,
        { $inc: { spend: spendInc, visits: 1, loyalty: loyaltyInc } },
        { new: true }
      ).lean();

      if (updated) {
        // derive tier from total spend
        let newTier = updated.tier || 'Bronze';
        const s = Number(updated.spend || 0);
        if (s >= 2000) newTier = 'Platinum';
        else if (s >= 1000) newTier = 'Gold';
        else if (s >= 500) newTier = 'Silver';
        else newTier = 'Bronze';

        if (newTier !== updated.tier) {
          await Customer.findByIdAndUpdate(data.customer, { $set: { tier: newTier } });
        }
      }
    } catch (err) {
      console.warn('Failed to update customer metrics for sale', err.message);
    }
  }

  return saved;
}

async function listSales(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  return Sale.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean();
}

async function getSaleById(id) {
  return Sale.findById(id).lean();
}

module.exports = { createSale, listSales, getSaleById };
