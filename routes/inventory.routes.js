const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventory.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

router.get('/', requireAuth, authorize('inventory'), ctrl.getInventoryOverview);
router.get('/transactions', requireAuth, authorize('inventory'), ctrl.getInventoryTransactions);
// POST /adjust — perform stock adjustments (inventory staff or manager)
router.post('/adjust', requireAuth, authorize('inventory'), ctrl.adjustInventory);

module.exports = router;