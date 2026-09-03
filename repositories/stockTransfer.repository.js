const mongoose = require('mongoose');
const StockTransfer = require('../models/stockTransfer.model');
const Product = require('../models/product.model');
const InventoryTransaction = require('../models/inventoryTransaction.model');
const Warehouse = require('../models/warehouse.model');

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

async function createTransfer(data = {}) {
  const resolveWarehouse = async (value) => {
    if (!value) return null;
    if (mongoose.isValidObjectId(value)) return value;
    const warehouse = await Warehouse.findOne({ $or: [{ code: value }, { name: value }] }).lean();
    return warehouse?._id || null;
  };
  const fromWarehouseId = await resolveWarehouse(data.fromWarehouseId || data.fromWarehouse);
  const toWarehouseId = await resolveWarehouse(data.toWarehouseId || data.toWarehouse);
  const rawItems = Array.isArray(data.items) && data.items.length ? data.items : [data];

  if (!fromWarehouseId || !toWarehouseId) {
    throw new Error('Source and destination warehouses are required.');
  }

  if (String(fromWarehouseId) === String(toWarehouseId)) {
    throw new Error('Source and destination warehouses must be different.');
  }

  if (!rawItems.length) {
    throw new Error('At least one product is required for the transfer.');
  }

  const normalizedItems = [];
  for (const item of rawItems) {
    const productId = item.productId || item.product || null;
    const sku = item.sku || item.productSku || null;
    const qty = Math.abs(toNumber(item.qty ?? item.quantity, 0));
    if (!productId && !sku) continue;
    if (qty <= 0) continue;
    normalizedItems.push({ productId, sku, qty, reason: item.reason || data.reason || 'Stock transfer' });
  }

  if (!normalizedItems.length) {
    throw new Error('Transfer quantity must be greater than zero.');
  }

  const transferId = data.transferId || `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const savedTransfer = await StockTransfer.findOneAndUpdate(
    { transferId },
    { $setOnInsert: { transferId } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const session = await mongoose.startSession();
  let created;
  const topologyType = mongoose.connection.getClient()?.topology?.description?.type;
  const supportsTransactions = topologyType === 'ReplicaSet' || topologyType === 'Sharded';

  try {
    const applyTransfer = async () => {
      const preparedItems = [];
      let totalQty = 0;

      for (const item of normalizedItems) {
        const productIdentifier = item.productId || item.sku;
        let sourceProduct = item.productId && mongoose.isValidObjectId(item.productId)
          ? await Product.findById(item.productId).session(session)
          : null;
        if (!sourceProduct && productIdentifier) {
          const sku = item.sku || productIdentifier;
          sourceProduct = await Product.findOne({ sku }).sort({ createdAt: -1 }).session(session);
        }
        if (sourceProduct?.warehouseId &&
            String(sourceProduct.warehouseId) !== String(fromWarehouseId)) {
          sourceProduct = null;
        }
        if (!sourceProduct && item.sku) {
          sourceProduct = await Product.findOne({ sku: item.sku, warehouseId: fromWarehouseId })
            .sort({ createdAt: -1 }).session(session);
        }
        if (!sourceProduct && item.productId && !mongoose.isValidObjectId(item.productId)) {
          sourceProduct = await Product.findOne({ sku: item.productId, warehouseId: fromWarehouseId })
            .sort({ createdAt: -1 }).session(session);
        }

        if (!sourceProduct) {
          throw new Error(`Product not found for transfer: ${item.sku || item.productId || 'unknown'}`);
        }

        const sourceStock = toNumber(sourceProduct.stock, 0);
        if (sourceStock < item.qty) {
          throw new Error(`Insufficient stock in source warehouse for ${sourceProduct.name || sourceProduct.sku}.`);
        }

        const sourceClone = await Product.findById(sourceProduct._id).session(session);
        sourceClone.stock = sourceStock - item.qty;
        updateProductStatus(sourceClone);
        sourceClone.warehouseId = fromWarehouseId;
        sourceClone.warehouseName = data.from || data.fromWarehouseName || sourceClone.warehouseName || 'Source Warehouse';
        await sourceClone.save({ session });

        const destinationQuery = { sku: sourceProduct.sku, warehouseId: toWarehouseId };
        let destinationProduct = await Product.findOne(destinationQuery).session(session);

        if (!destinationProduct) {
          const destinationWarehouse = await Warehouse.findById(toWarehouseId).select('code').lean().session(session);
          destinationProduct = new Product({
            ...sourceProduct.toObject(),
            _id: new mongoose.Types.ObjectId(),
            // SKU is globally unique in the product model; keep the original
            // SKU in metadata while giving the warehouse copy a unique key.
            sku: `${sourceProduct.sku}-${destinationWarehouse?.code || String(toWarehouseId).slice(-6)}`,
            warehouseId: toWarehouseId,
            warehouseName: data.to || data.toWarehouseName || 'Destination Warehouse',
            stock: item.qty,
            status: 'In Stock',
            metadata: { ...((sourceProduct.metadata || {})), sourceWarehouseId: fromWarehouseId },
          });
          delete destinationProduct.__v;
          await destinationProduct.save({ session });
        } else {
          destinationProduct.stock = toNumber(destinationProduct.stock, 0) + item.qty;
          destinationProduct.warehouseName = data.to || data.toWarehouseName || destinationProduct.warehouseName || 'Destination Warehouse';
          updateProductStatus(destinationProduct);
          await destinationProduct.save({ session });
        }

        await Warehouse.updateOne({ _id: fromWarehouseId }, {
          $inc: { stockUnits: -item.qty, transfers: 1, movementCount: 1 },
        }).session(session);
        await Warehouse.updateOne({ _id: toWarehouseId }, {
          $inc: { stockUnits: item.qty, transfers: 1, movementCount: 1 },
        }).session(session);

        preparedItems.push({
          productId: sourceProduct._id,
          sku: sourceProduct.sku,
          name: sourceProduct.name,
          qty: item.qty,
          unitPrice: toNumber(sourceProduct.costPrice || sourceProduct.price, 0),
        });

        await InventoryTransaction.create([{ 
          productId: sourceProduct._id,
          warehouseId: fromWarehouseId,
          qty: -item.qty,
          type: 'transfer_out',
          ref: transferId,
          createdBy: data.createdBy || data.requestedBy || null,
          notes: `Transfer to ${data.to || 'destination warehouse'}`,
          metadata: { reason: item.reason || data.reason || 'Stock transfer', fromWarehouseId, toWarehouseId },
        }, {
          productId: destinationProduct._id,
          warehouseId: toWarehouseId,
          qty: item.qty,
          type: 'transfer_in',
          ref: transferId,
          createdBy: data.createdBy || data.requestedBy || null,
          notes: `Transfer from ${data.from || 'source warehouse'}`,
          metadata: { reason: item.reason || data.reason || 'Stock transfer', fromWarehouseId, toWarehouseId },
        }], { session });

        totalQty += item.qty;
      }

      created = await StockTransfer.findByIdAndUpdate(
        savedTransfer._id,
        {
          $set: {
            fromWarehouseId,
            toWarehouseId,
            from: data.from || data.fromWarehouseName || 'Source Warehouse',
            to: data.to || data.toWarehouseName || 'Destination Warehouse',
            item: data.item || preparedItems[0]?.name || 'Stock transfer',
            qty: totalQty,
            items: preparedItems,
            productId: preparedItems[0]?.productId || data.productId || null,
            reason: data.reason || 'Stock transfer',
            status: data.status === 'Pending' ? 'Completed' : (data.status || 'Completed'),
            requestedBy: data.requestedBy || data.createdBy || null,
            createdBy: data.createdBy || data.requestedBy || null,
            metadata: { ...data.metadata, transferId },
          }
        },
        { returnDocument: 'after', session }
      ).lean();
    };

    if (supportsTransactions) await session.withTransaction(applyTransfer);
    else await applyTransfer();
  } catch (error) {
    await StockTransfer.deleteOne({ _id: savedTransfer._id });
    throw error;
  } finally {
    await session.endSession();
  }

  return created || savedTransfer.toObject();
}

async function listTransfers(filter = {}, opts = {}) {
  const { skip = 0, limit = 100 } = opts;
  return StockTransfer.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean();
}

async function getTransferById(id) {
  return StockTransfer.findById(id).lean();
}

async function updateTransfer(id, patch = {}) {
  return StockTransfer.findByIdAndUpdate(id, patch, { returnDocument: 'after' }).lean();
}

async function deleteTransfer(id) {
  return StockTransfer.findByIdAndDelete(id);
}

module.exports = { createTransfer, listTransfers, getTransferById, updateTransfer, deleteTransfer };
