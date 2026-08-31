const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  item: { type: String, required: true },
  qty: { type: Number, required: true },
  status: { type: String, enum: ['Scheduled', 'In Transit', 'Received'], default: 'Scheduled' },
}, { timestamps: true });

module.exports = mongoose.models.StockTransfer || mongoose.model('StockTransfer', stockTransferSchema);
