const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// suppliers module key: 'suppliers'
router.get('/', requireAuth, authorize('suppliers'), purchaseOrderController.listPOs);
router.post('/', requireAuth, authorize('suppliers'), purchaseOrderController.createPO);
router.get('/:id', requireAuth, authorize('suppliers'), purchaseOrderController.getPO);
router.post('/:id/receive', requireAuth, authorize('inventory'), purchaseOrderController.receivePO);

module.exports = router;
