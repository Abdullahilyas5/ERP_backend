const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sale.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// sales permission key: 'sales'
router.get('/', requireAuth, authorize('sales'), ctrl.listSales);
router.post('/', requireAuth, authorize('sales'), ctrl.createSale);

module.exports = router;