const Product = require('../models/product.model');
const StockTransfer = require('../models/stockTransfer.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

async function getInventoryOverview(req, res) {
  try {
    const products = await Product.find().lean();
    
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyCount = 0;

    const lowStockAlerts = [];

    for (const p of products) {
      const stock = Number(p.stock || 0);
      const price = Number(p.price || 0);
      const reorderLevel = Number(p.reorderLevel || 0);

      totalStockUnits += stock;
      totalValuation += stock * price;

      if (stock <= 0) {
        outOfStockCount++;
        lowStockAlerts.push({ ...p, urgency: 'Critical (Out of Stock)' });
      } else if (stock <= reorderLevel) {
        lowStockCount++;
        lowStockAlerts.push({ ...p, urgency: 'Low Stock' });
      } else {
        healthyCount++;
      }
    }

    // Sort alerts so out of stock items appear first
    lowStockAlerts.sort((a, b) => (a.stock || 0) - (b.stock || 0));

    // Recent stock transfers
    const transfers = await StockTransfer.find().sort({ createdAt: -1 }).limit(15).lean();

    // Recent transactions with populated product details
    const recentTransactions = await InventoryTransaction.find()
      .populate('productId', 'name sku category price')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      summary: {
        totalProducts: products.length,
        totalStockUnits,
        totalValuation,
        lowStockCount,
        outOfStockCount,
        healthyCount,
      },
      alerts: lowStockAlerts,
      transfers,
      recentTransactions,
    });
  } catch (err) {
    console.error('getInventoryOverview error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getInventoryTransactions(req, res) {
  try {
    const { page = 1, limit = 50, type, productId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (productId) {
      filter.productId = productId;
    }

    const [transactions, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .populate('productId', 'name sku category price stock')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InventoryTransaction.countDocuments(filter),
    ]);

    return res.json({
      transactions,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('getInventoryTransactions error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Adjust inventory:
// items = [{ productId or sku, qty, mode: 'delta' | 'set', reason, notes }]
async function adjustInventory(req, res) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : (req.body.productId ? [req.body] : []);
    if (items.length === 0) return res.status(400).json({ message: 'At least one adjustment item is required.' });

    const results = [];
    for (const it of items) {
      let product = null;
      if (it.productId) product = await Product.findById(it.productId);
      if (!product && it.sku) product = await Product.findOne({ sku: it.sku });
      if (!product) {
        results.push({ ok: false, reason: 'Product not found', item: it });
        continue;
      }

      const currentStock = Number(product.stock || 0);
      let deltaQty = 0;
      let newStock = currentStock;

      if (it.mode === 'set') {
        const exactQty = Math.max(0, Number(it.qty || 0));
        deltaQty = exactQty - currentStock;
        newStock = exactQty;
      } else {
        deltaQty = Number(it.qty || 0);
        newStock = Math.max(0, currentStock + deltaQty);
      }

      if (deltaQty === 0 && it.mode !== 'set') {
        results.push({ ok: false, reason: 'Zero adjustment quantity', item: it });
        continue;
      }

      // Determine product status
      let newStatus = 'In Stock';
      const reorderLevel = Number(product.reorderLevel || 0);
      if (newStock <= 0) {
        newStatus = 'Out of Stock';
      } else if (newStock <= reorderLevel) {
        newStatus = 'Low Stock';
      }

      // Update product in DB
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { stock: newStock, status: newStatus },
        { new: true }
      );

      // Record inventory transaction
      const inv = new InventoryTransaction({
        productId: product._id,
        qty: deltaQty,
        type: 'adjustment',
        ref: req.body.ref || null,
        notes: it.notes || it.reason || 'Manual inventory adjustment',
        createdBy: req.user?.id,
        metadata: {
          previousStock: currentStock,
          newStock: newStock,
          mode: it.mode || 'delta',
          reason: it.reason || 'Adjustment',
        },
      });
      await inv.save();

      results.push({
        ok: true,
        productId: product._id,
        productName: product.name,
        previousStock: currentStock,
        newStock: newStock,
        deltaQty,
        status: newStatus,
      });
    }

    return res.json({ message: 'Adjustment processed successfully.', results });
  } catch (err) {
    console.error('adjustInventory error', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
}

module.exports = { getInventoryOverview, getInventoryTransactions, adjustInventory };

