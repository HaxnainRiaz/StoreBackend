const Coupon = require('../models/Coupon');
const { createLog } = require('./auditController');

exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort('-createdAt');
        res.status(200).json({ success: true, data: coupons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        // Map frontend fields (value -> discountValue, minimumSpend -> minAmount)
        if (req.body.value !== undefined) req.body.discountValue = req.body.value;
        if (req.body.minimumSpend !== undefined) req.body.minAmount = req.body.minimumSpend;

        const coupon = await Coupon.create(req.body);

        // Audit Log
        if (req.user) {
            await createLog(req.user.id, 'Promotion Creation', `Created coupon: ${coupon.code}`);
        }

        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
        console.error('Coupon Creation Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Audit Log
        await createLog(req.user.id, 'Promotion Update', `Updated coupon: ${coupon.code}`);

        res.status(200).json({ success: true, data: coupon });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            const couponCode = coupon.code;
            await Coupon.findByIdAndDelete(req.params.id);

            // Audit Log
            await createLog(req.user.id, 'Promotion Deletion', `Deleted coupon: ${couponCode}`);
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Validate coupon code
// @route   GET /api/coupons/validate/:code
// @access  Public
exports.validateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({
            code: req.params.code.toUpperCase(),
            isActive: true,
            expiresAt: { $gt: new Date() }
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
        }

        res.status(200).json({ success: true, data: coupon });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
