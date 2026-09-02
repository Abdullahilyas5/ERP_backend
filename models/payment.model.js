const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, trim: true },
  ref: { type: String, default: '', trim: true },
  type: { type: String, enum: ['Customer Payment', 'Supplier Payment', 'POS Payment', 'Customer Advance', 'Supplier Advance', 'Expense Payment', 'Refund', 'Other Income', 'Other Payment'], default: 'Customer Payment' },
  direction: { type: String, enum: ['incoming', 'outgoing'], default: 'incoming' },
  party: { type: String, default: '' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  invoiceReference: { type: String, default: '' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Bank Transfer', 'Card', 'Cash', 'Cheque', 'Digital Wallet', 'Mobile Wallet', 'Other'], default: 'Cash' },
  cashAccount: { type: String, default: 'Main Business Bank' },
  accountType: { type: String, enum: ['Cash', 'Bank', 'Other payment accounts'], default: 'Bank' },
  status: { type: String, enum: ['Pending', 'Completed', 'Partially Paid', 'Failed', 'Cancelled', 'Refunded', 'Partially Refunded', 'Reconciled'], default: 'Pending' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouse: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
