const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'customer' });

        const orders = await Order.find({ paymentStatus: 'paid' });
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

        // Get monthly revenue (last 6 months) for charts
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                totalCustomers,
                totalProducts,
                monthlyStats
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
