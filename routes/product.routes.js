const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAuth, authorize, authorizeAny } = require('../middleware/auth.middleware');

// products module permission key: 'products'
router.get('/', requireAuth, authorizeAny('products', 'inventory', 'stockTransfers', 'warehouses'), productController.listProducts);
router.post('/', requireAuth, authorize('products'), productController.createProduct);
router.get('/:id', requireAuth, authorize('products'), productController.getProduct);
router.put('/:id', requireAuth, authorize('products'), productController.updateProduct);
router.delete('/:id', requireAuth, authorize('products'), productController.deleteProduct);

module.exports = router;
