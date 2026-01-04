const Banner = require('../models/Banner');
const { createLog } = require('./auditController');

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        await createLog(req.user.id, 'Banner Creation', `Added new hero banner: ${banner.title}`);
        res.status(201).json({ success: true, data: banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await createLog(req.user.id, 'Banner Update', `Updated banner: ${banner.title}`);
        res.status(200).json({ success: true, data: banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
