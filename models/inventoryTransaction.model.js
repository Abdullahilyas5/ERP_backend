const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  qty: { type: Number, required: true },
  type: { type: String, enum: ['receipt', 'adjustment', 'sale', 'transfer', 'transfer_out', 'transfer_in', 'return'], required: true },
  ref: { type: mongoose.Schema.Types.Mixed },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);
