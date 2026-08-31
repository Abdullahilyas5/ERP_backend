const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventory.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

router.get('/', requireAuth, authorize('inventory'), ctrl.getInventoryOverview);

module.exports = router;