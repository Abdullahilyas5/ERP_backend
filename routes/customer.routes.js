const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// customers module permission key: 'customers'
router.get('/', requireAuth, authorize('customers'), customerController.listCustomers);
router.post('/', requireAuth, authorize('customers'), customerController.createCustomer);
router.get('/:id', requireAuth, authorize('customers'), customerController.getCustomer);
router.put('/:id', requireAuth, authorize('customers'), customerController.updateCustomer);
router.delete('/:id', requireAuth, authorize('customers'), customerController.deleteCustomer);

module.exports = router;
