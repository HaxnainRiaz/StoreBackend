const CMSContent = require('../models/CMSContent');
const { createLog } = require('./auditController');

exports.getCms = async (req, res) => {
    try {
        let cms = await CMSContent.findOne();
        if (!cms) {
            cms = await CMSContent.create({});
        }
        res.status(200).json({ success: true, data: cms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCms = async (req, res) => {
    try {
        let cms = await CMSContent.findOne();
        if (!cms) {
            cms = await CMSContent.create(req.body);
        } else {
            cms = await CMSContent.findOneAndUpdate({}, req.body, { new: true });
        }

        // Audit Log
        await createLog(req.user.id, 'CMS Update', 'Updated global website content and layout configuration');

        res.status(200).json({ success: true, data: cms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
