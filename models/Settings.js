const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    announcementBarText: { type: String, default: 'Free Shipping on Orders Over $75' },
    showNewsletterSection: { type: Boolean, default: true },
    showFeaturedCollection: { type: Boolean, default: true },
    showBlogSection: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
