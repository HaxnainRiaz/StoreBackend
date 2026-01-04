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
        const coupon = await Coupon.create(req.body);

        // Audit Log
        await createLog(req.user.id, 'Promotion Creation', `Created coupon: ${coupon.code}`);

        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
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
