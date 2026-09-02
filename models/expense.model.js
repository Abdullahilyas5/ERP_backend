const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  ref: { type: String, required: true, unique: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouse: { type: String, default: '' },
  department: { type: String, default: 'Operations' },
  paymentMethod: { type: String, default: 'Bank Transfer' },
  employee: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Recorded', 'Pending', 'Approved', 'Rejected'], default: 'Recorded' },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
