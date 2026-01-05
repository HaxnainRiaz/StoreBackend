const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please add a comment']
    },
    title: {
        type: String,
        trim: true
    },
    resultsTime: {
        type: String,
        enum: ['1 week', '2 weeks', '3–4 weeks', 'More than a month']
    },
    skinType: {
        type: String,
        enum: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal']
    },
    recommend: {
        type: String,
        enum: ['Yes', 'No']
    },
    adminReply: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Prevent user from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get avg rating and update product
reviewSchema.statics.getAverageRating = async function (productId) {
    const obj = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    try {
        if (obj[0]) {
            await mongoose.model('Product').findByIdAndUpdate(productId, {
                rating: obj[0].averageRating,
                totalReviews: obj[0].reviewCount
            });
        } else {
            await mongoose.model('Product').findByIdAndUpdate(productId, {
                rating: 0,
                totalReviews: 0
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
reviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before remove
reviewSchema.pre('remove', function () {
    this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
