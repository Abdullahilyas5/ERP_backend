const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  manager: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  description: { type: String, default: '' },
  stockUnits: { type: Number, default: 0 },
  stockValue: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  transfers: { type: Number, default: 0 },
  movementCount: { type: Number, default: 0 },
  productCount: { type: Number, default: 0 },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
