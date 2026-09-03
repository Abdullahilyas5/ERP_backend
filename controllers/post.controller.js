const Post = require('../models/post.model');

async function listPosts(req, res) {
  try {
    const { category, status, q, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email role')
        .sort({ pinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res.json({ posts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listPosts error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function listPublicPosts(req, res) {
  try {
    const { limit = 6 } = req.query;
    const posts = await Post.find({ status: 'Published', publishedAt: { $ne: null, $lte: new Date() } })
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(Number(limit))
      .lean();
    return res.json({ posts });
  } catch (err) {
    console.error('listPublicPosts error', err);
    return res.status(500).json({ message: 'Unable to load published articles.' });
  }
}

async function getPost(req, res) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    ).populate('author', 'name email role');

    if (!post) return res.status(404).json({ message: 'Post not found.' });
    return res.json(post);
  } catch (err) {
    console.error('getPost error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createPost(req, res) {
  try {
    const { title, content, excerpt, category, coverImage, tags, status, pinned } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required.' });
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required.' });

    const post = new Post({
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
      content,
      excerpt: excerpt ? excerpt.trim() : content.substring(0, 150) + '...',
      category: category || 'Announcement',
      coverImage: coverImage || '/images/supermarket_hero.jpg',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      author: req.user?.id,
      authorName: req.user?.name || req.user?.email || 'Store Admin',
      status: status || 'Published',
      pinned: Boolean(pinned),
      publishedAt: status === 'Draft' ? null : new Date(),
    });

    const saved = await post.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('createPost error', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
}

async function updatePost(req, res) {
  try {
    const { title, content, excerpt, category, coverImage, tags, status, pinned } = req.body || {};
    const patch = {};

    if (title !== undefined) {
      patch.title = title.trim();
      patch.slug = title.trim().toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    }
    if (content !== undefined) patch.content = content;
    if (excerpt !== undefined) patch.excerpt = excerpt;
    if (category !== undefined) patch.category = category;
    if (coverImage !== undefined) patch.coverImage = coverImage;
    if (tags !== undefined) {
      patch.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }
    if (status !== undefined) {
      patch.status = status;
      if (status === 'Published') patch.publishedAt = new Date();
    }
    if (pinned !== undefined) patch.pinned = Boolean(pinned);

    const updated = await Post.findByIdAndUpdate(req.params.id, patch, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ message: 'Post not found.' });
    return res.json(updated);
  } catch (err) {
    console.error('updatePost error', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
}

async function deletePost(req, res) {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Post not found.' });
    return res.status(204).end();
  } catch (err) {
    console.error('deletePost error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listPosts, listPublicPosts, getPost, createPost, updatePost, deletePost };
