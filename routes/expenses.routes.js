const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// expenses module key: 'expenses'
router.get('/', requireAuth, authorize('expenses'), expenseController.listExpenses);
router.post('/', requireAuth, authorize('expenses'), expenseController.createExpense);
router.get('/:id', requireAuth, authorize('expenses'), expenseController.getExpense);
router.put('/:id', requireAuth, authorize('expenses'), expenseController.updateExpense);
router.delete('/:id', requireAuth, authorize('expenses'), expenseController.deleteExpense);

module.exports = router;
