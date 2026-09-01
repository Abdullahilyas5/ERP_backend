const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true },
  type: { type: String, enum: ['receipt','adjustment','sale','transfer'], required: true },
  ref: { type: mongoose.Schema.Types.ObjectId },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);
