const Order = require('../models/Order');
const Product = require('../models/Product');
const { createLog } = require('./auditController');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.addOrderItems = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            totalAmount,
            coupon
        } = req.body;

        if (items && items.length === 0) {
            return res.status(400).json({ success: false, message: 'No order items' });
        }

        const order = new Order({
            items,
            user: req.user._id,
            shippingAddress,
            totalAmount,
            coupon
        });

        const createdOrder = await order.save();

        // decreaseStockOnOrder
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({ success: true, data: createdOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('items.product', 'title images');

    if (order) {
        res.status(200).json({ success: true, data: order });
    } else {
        res.status(404).json({ success: false, message: 'Order not found' });
    }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.paymentStatus = 'paid';
        const updatedOrder = await order.save();

        // Audit Log
        await createLog(req.user.id, 'Payment Update', `Order ${order._id} marked as PAID`);

        res.status(200).json({ success: true, data: updatedOrder });
    } else {
        res.status(404).json({ success: false, message: 'Order not found' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: orders });
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = req.body.status;
        const updatedOrder = await order.save();

        // Audit Log
        await createLog(req.user.id, 'Order Status Update', `Order ${order._id} changed to ${req.body.status}`);

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name email').sort('-createdAt');
    res.status(200).json({ success: true, data: orders });
};
