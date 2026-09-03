const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, default: '' },
  name: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouse: { type: String, default: '' },
  warehouseName: { type: String, default: '' },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  changeDue: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'Cash' },
  paymentId: { type: String, default: '' },
  notes: { type: String, default: '' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, default: '' },
  cashierName: { type: String, default: '' },
  channel: { type: String, enum: ['Cash', 'Card', 'Mobile Wallet', 'Bank Transfer', 'Cheque', 'Other'], default: 'Cash' },
  status: { type: String, enum: ['Paid', 'Pending', 'Refunded', 'Partially Paid', 'Cancelled'], default: 'Paid' },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Partially Paid', 'Failed'], default: 'Completed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
