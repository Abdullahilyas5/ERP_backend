const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactName: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
  taxId: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: { type: String, default: '' },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

