const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String },
  name: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  channel: { type: String, enum: ['Cash','Card','Mobile Wallet','Bank Transfer','Cheque','Other'], default: 'Cash' },
  status: { type: String, enum: ['Paid', 'Pending', 'Refunded'], default: 'Paid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
