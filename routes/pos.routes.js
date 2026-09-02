const express = require('express');
const router = express.Router();
const { requireAuth, authorize } = require('../middleware/auth.middleware');
const posController = require('../controllers/pos.controller');

router.get('/items', requireAuth, authorize('pos'), posController.listCatalog);
router.get('/warehouses', requireAuth, authorize('pos'), posController.listWarehouses);
router.post('/checkout', requireAuth, authorize('pos'), posController.checkout);

module.exports = router;
