const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// payments module key: 'payments'
router.get('/', requireAuth, authorize('payments'), paymentController.listPayments);
router.post('/', requireAuth, authorize('payments'), paymentController.createPayment);
router.get('/:id', requireAuth, authorize('payments'), paymentController.getPayment);
router.put('/:id', requireAuth, authorize('payments'), paymentController.updatePayment);
router.delete('/:id', requireAuth, authorize('payments'), paymentController.deletePayment);

module.exports = router;
