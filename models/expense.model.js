const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  ref: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  month: { type: String },
  status: { type: String, enum: ['Recorded', 'Pending', 'Approved', 'Rejected'], default: 'Recorded' },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
