const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String },
  name: { type: String },
  qtyOrdered: { type: Number, required: true },
  qtyReceived: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  items: [poItemSchema],
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Partially Received', 'Received', 'Cancelled'], default: 'Pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
