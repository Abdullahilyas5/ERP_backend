const express = require('express');
const router = express.Router();
const { requireAuth, authorize } = require('../middleware/auth.middleware');

// Minimal POS route placeholder
router.get('/', requireAuth, authorize('pos'), (req, res) => {
  return res.json({ message: 'POS module placeholder', catalog: [] });
});

module.exports = router;
