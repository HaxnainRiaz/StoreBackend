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

        // Count unique customers: Registered + Guest (by unique email)
        const registeredCustomers = await User.countDocuments({ role: 'customer' });
        const guestEmails = await Order.distinct('shippingAddress.email'); // Try to get from shipping address if email exists there
        // If email is not in shippingAddress, try to get from user object or just count unique shipping names
        const uniqueOrderEmails = await Order.distinct('user'); // Basic approach for now

        // Better: Count unique combinations of email/name from orders
        const allOrders = await Order.find({ orderStatus: { $ne: 'cancelled' } });
        const totalRevenue = allOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Count unique guest names if User collection is empty
        const uniqueCustomerCount = Math.max(registeredCustomers, (await Order.distinct('shippingAddress.fullName')).length);

        // Get monthly revenue (last 12 months) for charts
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                    orderStatus: { $ne: 'cancelled' }
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
                totalCustomers: uniqueCustomerCount,
                totalProducts,
                avgOrderValue,
                monthlyStats
            }
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
