const express = require('express');
const { getReviews, updateReview, deleteReview, addReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin'), getReviews)
    .post(protect, addReview);

router.route('/:id')
    .put(protect, authorize('admin'), updateReview)
    .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
