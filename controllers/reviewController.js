const Review = require('../models/Review');
const { createLog } = require('./auditController');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private/Admin
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate('product', 'title').populate('user', 'name');
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update review (Admin reply)
// @route   PUT /api/reviews/:id
// @access  Private/Admin
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, {
            adminReply: req.body.adminReply
        }, { new: true });

        // Audit Log
        await createLog(req.user.id, 'Review Moderation', `Added admin reply to review ${review._id}`);

        res.status(200).json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (review) {
            const productId = review.product;
            await Review.findByIdAndDelete(req.params.id);

            // Audit Log
            await createLog(req.user.id, 'Review Deletion', `Deleted review ${req.params.id}`);
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Add review (Customer)
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res) => {
    try {
        req.body.user = req.user.id;
        const review = await Review.create(req.body);
        res.status(201).json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
