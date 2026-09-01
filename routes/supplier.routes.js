const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// suppliers module key: 'suppliers'
router.get('/', requireAuth, authorize('suppliers'), supplierController.listSuppliers);
router.post('/', requireAuth, authorize('suppliers'), supplierController.createSupplier);
router.get('/:id', requireAuth, authorize('suppliers'), supplierController.getSupplier);
router.put('/:id', requireAuth, authorize('suppliers'), supplierController.updateSupplier);
router.delete('/:id', requireAuth, authorize('suppliers'), supplierController.deleteSupplier);

module.exports = router;
