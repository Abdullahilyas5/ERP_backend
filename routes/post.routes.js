const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { requireAuth, authorize } = require('../middleware/auth.middleware');

router.get('/', requireAuth, authorize('cms'), postController.listPosts);
router.post('/', requireAuth, authorize('cms'), postController.createPost);
router.get('/:id', requireAuth, authorize('cms'), postController.getPost);
router.put('/:id', requireAuth, authorize('cms'), postController.updatePost);
router.delete('/:id', requireAuth, authorize('cms'), postController.deletePost);

module.exports = router;
