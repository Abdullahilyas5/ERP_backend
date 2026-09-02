const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { requireAuth, authorize, authorizeAny } = require('../middleware/auth.middleware');

router.get('/', requireAuth, authorizeAny('warehouses', 'products', 'inventory', 'stockTransfers', 'expenses', 'payments', 'pos'), warehouseController.listWarehouses);
router.post('/', requireAuth, authorize('warehouses'), warehouseController.createWarehouse);
router.get('/:id', requireAuth, authorize('warehouses'), warehouseController.getWarehouse);
router.put('/:id', requireAuth, authorize('warehouses'), warehouseController.updateWarehouse);
router.delete('/:id', requireAuth, authorize('warehouses'), warehouseController.deleteWarehouse);

module.exports = router;
