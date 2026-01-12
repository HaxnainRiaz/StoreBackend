const express = require('express');
const {
    getBlogs,
    getBlog,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getBlogs)
    .post(protect, authorize('admin'), createBlog);

router.route('/slug/:slug')
    .get(getBlogBySlug);

router.route('/:id')
    .get(getBlog)
    .put(protect, authorize('admin'), updateBlog)
    .delete(protect, authorize('admin'), deleteBlog);

router.post('/:id/comments', require('../controllers/blogController').addComment);

module.exports = router;
