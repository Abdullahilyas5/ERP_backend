const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, trim: true },
  unit: { type: String, default: 'Unit' },
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  markupPercent: { type: Number, default: 0 },
  marginPercent: { type: Number, default: 0 },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  warehouseName: { type: String, default: '' },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  stock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  isActive: { type: Boolean, default: true },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

productSchema.pre('save', function calculatePricing() {
  const selling = Number(this.sellingPrice ?? this.price ?? 0);
  const cost = Number(this.costPrice ?? 0);

  if (selling > 0 || cost > 0) {
    this.price = selling || cost;
    this.sellingPrice = selling || cost;
    if (cost > 0) {
      const markup = ((selling - cost) / cost) * 100;
      const margin = ((selling - cost) / selling) * 100;
      this.markupPercent = Number.isFinite(markup) ? Number(markup.toFixed(2)) : 0;
      this.marginPercent = Number.isFinite(margin) ? Number(margin.toFixed(2)) : 0;
    }
  }

  if (this.stock <= 0) this.status = 'Out of Stock';
  else if (this.stock <= (this.reorderLevel || 0)) this.status = 'Low Stock';
  else this.status = 'In Stock';

});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
