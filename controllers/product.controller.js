const productService = require('../services/product.service');
const Warehouse = require('../models/warehouse.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');

async function listProducts(req, res) {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const products = await productService.listProducts({}, { skip, limit });
    return res.json(products);
  } catch (err) {
    console.error('listProducts error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createProduct(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.name || payload.price == null || payload.category == null) {
      return res.status(400).json({ message: 'name, price and category are required.' });
    }
    const sku = String(payload.sku || '').trim() || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (!payload.warehouseId) {
      return res.status(400).json({ message: 'warehouseId is required.' });
    }
    const warehouse = await Warehouse.findOne({ _id: payload.warehouseId, status: 'Active' }).lean().catch(() => null);
    if (!warehouse) return res.status(400).json({ message: 'The selected warehouse is not available.' });
    const created = await productService.createProduct({
      ...payload,
      sku,
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
    });
    const stock = Number(created.stock || 0);
    if (stock > 0) {
      await Warehouse.updateOne({ _id: warehouse._id }, {
        $inc: { stockUnits: stock, stockValue: stock * Number(created.costPrice || created.price || 0), productCount: 1, movementCount: 1 },
      });
      await InventoryTransaction.create({
        productId: created._id,
        warehouseId: warehouse._id,
        qty: stock,
        type: 'receipt',
        ref: created._id,
        createdBy: req.user?.id,
        notes: 'Initial stock for newly created product',
      });
    } else {
      await Warehouse.updateOne({ _id: warehouse._id }, { $inc: { productCount: 1 } });
    }
    return res.status(201).json(created);
  } catch (err) {
    console.error('createProduct error', err);
    if (err.code === 11000) return res.status(409).json({ message: 'SKU already exists.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getProduct(req, res) {
  try {
    const p = await productService.getProductById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found.' });
    return res.json(p);
  } catch (err) {
    console.error('getProduct error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateProduct(req, res) {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ message: 'Product not found.' });
    return res.json(updated);
  } catch (err) {
    console.error('updateProduct error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deleteProduct(req, res) {
  try {
    await productService.deleteProduct(req.params.id);
    return res.status(204).end();
  } catch (err) {
    console.error('deleteProduct error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listProducts, createProduct, getProduct, updateProduct, deleteProduct };
