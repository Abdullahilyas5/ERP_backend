const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  address: { type: String },
  spend: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
  loyalty: { type: Number, default: 0 },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
