const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// Only users with 'users' permission can manage users
router.get('/', requireAuth, authorize('users'), userController.listUsers);
router.post('/', requireAuth, authorize('users'), userController.createUser);
router.get('/:id', requireAuth, authorize('users'), userController.getUser);
router.put('/:id', requireAuth, authorize('users'), userController.updateUser);
router.post('/:id/approve', requireAuth, authorize('users'), userController.approveUser);
router.patch('/:id/active', requireAuth, authorize('users'), userController.setActive);
router.delete('/:id', requireAuth, authorize('users'), userController.deleteUser);

module.exports = router;