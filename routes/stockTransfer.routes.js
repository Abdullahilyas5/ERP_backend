const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockTransfer.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

router.get('/', requireAuth, authorize('stockTransfers'), ctrl.list);
router.post('/', requireAuth, authorize('stockTransfers'), ctrl.create);
router.get('/:id', requireAuth, authorize('stockTransfers'), ctrl.get);
router.put('/:id', requireAuth, authorize('stockTransfers'), ctrl.update);
router.delete('/:id', requireAuth, authorize('stockTransfers'), ctrl.remove);

module.exports = router;