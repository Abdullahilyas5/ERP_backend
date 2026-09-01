const supplierService = require('../services/supplier.service');
const PurchaseOrder = require('../models/purchaseOrder.model');

async function listSuppliers(req, res) {
  try {
    const { page = 1, limit = 200, q, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { contactName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { country: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      supplierService.listSuppliers(filter, { skip, limit: Number(limit) }),
      supplierService.countSuppliers(filter),
    ]);

    return res.json({
      suppliers: items,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('listSuppliers error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createSupplier(req, res) {
  try {
    const { name, contactName, email, phone, address, city, country, paymentTerms, taxId, status, notes } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ message: 'Supplier name is required.' });

    const payload = {
      name: name.trim(),
      contactName: contactName ? contactName.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      country: country ? country.trim() : '',
      paymentTerms: paymentTerms || 'Net 30',
      taxId: taxId ? taxId.trim() : '',
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      notes: notes || '',
    };

    const created = await supplierService.createSupplier(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createSupplier error', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
}

async function getSupplier(req, res) {
  try {
    const s = await supplierService.getSupplierById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Supplier not found.' });

    // Fetch related purchase orders if available
    let purchaseOrders = [];
    try {
      purchaseOrders = await PurchaseOrder.find({ supplier: req.params.id }).sort({ createdAt: -1 }).limit(10).lean();
    } catch (e) {
      console.warn('Could not load POs for supplier', e.message);
    }

    return res.json({ ...s, purchaseOrders });
  } catch (err) {
    console.error('getSupplier error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateSupplier(req, res) {
  try {
    const { name, contactName, email, phone, address, city, country, paymentTerms, taxId, status, notes } = req.body || {};
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: 'Supplier name cannot be empty.' });
    }

    const payload = {};
    if (name !== undefined) payload.name = name.trim();
    if (contactName !== undefined) payload.contactName = contactName.trim();
    if (email !== undefined) payload.email = email.trim().toLowerCase();
    if (phone !== undefined) payload.phone = phone.trim();
    if (address !== undefined) payload.address = address.trim();
    if (city !== undefined) payload.city = city.trim();
    if (country !== undefined) payload.country = country.trim();
    if (paymentTerms !== undefined) payload.paymentTerms = paymentTerms;
    if (taxId !== undefined) payload.taxId = taxId.trim();
    if (status !== undefined) payload.status = status;
    if (notes !== undefined) payload.notes = notes;

    const updated = await supplierService.updateSupplier(req.params.id, payload);
    if (!updated) return res.status(404).json({ message: 'Supplier not found.' });
    return res.json(updated);
  } catch (err) {
    console.error('updateSupplier error', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
}

async function deleteSupplier(req, res) {
  try {
    const deleted = await supplierService.deleteSupplier(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Supplier not found.' });
    return res.status(204).end();
  } catch (err) {
    console.error('deleteSupplier error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listSuppliers, createSupplier, getSupplier, updateSupplier, deleteSupplier };

