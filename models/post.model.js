const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true, default: '' },
    coverImage: { type: String, default: '/images/supermarket_hero.jpg' },
    category: {
      type: String,
      enum: ['Announcement', 'Promotion', 'Store News', 'Weekly Deals', 'Notice', 'Event'],
      default: 'Announcement',
    },
    tags: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: 'Store Management' },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
    },
    pinned: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
