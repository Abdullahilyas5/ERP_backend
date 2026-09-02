const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  company: { type: String, default: '' },
  taxNumber: { type: String, default: '' },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Blocked'], default: 'Active' },
  spend: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
  loyalty: { type: Number, default: 0 },
  lastPurchase: { type: Date, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
