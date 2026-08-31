const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  ref: { type: String, required: true, unique: true },
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date },
  method: { type: String, enum: ['Bank Transfer','Card','Cash','Cheque','Mobile Wallet','Other'], default: 'Bank Transfer' },
  status: { type: String, enum: ['Scheduled', 'Pending', 'Approved', 'Completed', 'Cancelled'], default: 'Pending' },
  notes: { type: String },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
