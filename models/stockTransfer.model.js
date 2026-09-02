const mongoose = require('mongoose');

const stockTransferItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, trim: true, default: '' },
  name: { type: String, trim: true, default: '' },
  qty: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  _id: false,
}, { _id: false });

const stockTransferSchema = new mongoose.Schema({
  transferId: { type: String, required: true, unique: true, trim: true },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  item: { type: String, default: '' },
  qty: { type: Number, default: 0 },
  items: { type: [stockTransferItemSchema], default: [] },
  reason: { type: String, default: 'Stock transfer' },
  status: { type: String, enum: ['Pending', 'Approved', 'In Transit', 'Completed', 'Rejected', 'Cancelled', 'Scheduled', 'Received'], default: 'Pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.StockTransfer || mongoose.model('StockTransfer', stockTransferSchema);
