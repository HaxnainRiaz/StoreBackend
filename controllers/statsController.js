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

        // Count unique customers
        const registeredCustomersCount = await User.countDocuments({ role: 'customer' });
        const allOrdersForCustomers = await Order.find({});
        const uniqueCustomerNames = new Set(allOrdersForCustomers.map(o => o.shippingAddress?.fullName || o.customerName));
        const totalCustomers = Math.max(registeredCustomersCount, uniqueCustomerNames.size);

        // Revenue: ONLY DELIVERED
        const deliveredOrders = await Order.find({ orderStatus: 'delivered' });
        const totalRevenue = deliveredOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        // Avg Order Value based on all orders (or should it be delivered?) 
        // User said "dont add amount in gross revenue until delivered", 
        // but Avg Order Value might still consider all non-cancelled orders for business insight.
        // However, to be safe and consistent with "strongly handling" revenue, let's use delivered for AOV too if inferred.
        // Actually, AOV usually considers all valid orders. Let's use all non-cancelled for AOV.
        const nonCancelledOrders = await Order.find({ orderStatus: { $ne: 'cancelled' } });
        const avgOrderValue = nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;

        // Dynamic Trends calculation (Current Month vs Previous Month)
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current Month Stats
        const thisMonthDelivered = await Order.find({
            orderStatus: 'delivered',
            createdAt: { $gte: startOfThisMonth }
        });
        const thisMonthRev = thisMonthDelivered.reduce((acc, o) => acc + o.totalAmount, 0);
        const thisMonthOrders = await Order.countDocuments({ createdAt: { $gte: startOfThisMonth } });

        // Previous Month Stats
        const prevMonthDelivered = await Order.find({
            orderStatus: 'delivered',
            createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
        });
        const prevMonthRev = prevMonthDelivered.reduce((acc, o) => acc + o.totalAmount, 0);
        const prevMonthOrders = await Order.countDocuments({
            createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
        });

        const calculateTrend = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return parseFloat(((curr - prev) / prev * 100).toFixed(1));
        };

        const revenueTrend = calculateTrend(thisMonthRev, prevMonthRev);
        const ordersTrend = calculateTrend(thisMonthOrders, prevMonthOrders);

        // Customers Trend (New signups)
        const thisMonthCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: startOfThisMonth } });
        const prevMonthCustomers = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
        });
        const customersTrend = calculateTrend(thisMonthCustomers, prevMonthCustomers);

        const aovTrend = calculateTrend(
            thisMonthOrders > 0 ? thisMonthRev / thisMonthOrders : 0,
            prevMonthOrders > 0 ? prevMonthRev / prevMonthOrders : 0
        );

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                totalCustomers,
                totalProducts,
                avgOrderValue,
                trends: {
                    revenue: revenueTrend,
                    orders: ordersTrend,
                    aov: aovTrend,
                    customers: customersTrend
                }
            }
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Revenue Progress Chart Data
// @route   GET /api/stats/progress
// @access  Private/Admin
exports.getRevenueProgress = async (req, res) => {
    try {
        const { filter = 'month' } = req.query; // 'day', 'month', 'year'
        let groupBy = {};
        let match = { orderStatus: 'delivered' };

        if (filter === 'day') {
            groupBy = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" }
            };
        } else if (filter === 'year') {
            groupBy = { year: { $year: "$createdAt" } };
        } else { // default month
            groupBy = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
            };
        }

        const stats = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: "$totalAmount" },
                    timestamp: { $first: "$createdAt" }
                }
            },
            { $sort: { timestamp: 1 } }
        ]);

        // Flatten for frontend
        const chartData = stats.map(s => ({
            label: filter === 'day'
                ? new Date(s.timestamp).toLocaleDateString()
                : filter === 'year'
                    ? s._id.year.toString()
                    : new Date(s.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' }),
            value: s.revenue
        }));

        res.status(200).json({
            success: true,
            data: chartData
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
