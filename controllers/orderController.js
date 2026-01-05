const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { createLog } = require('./auditController');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.addOrderItems = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            coupon: couponCode // Expecting coupon code from frontend
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No order items' });
        }

        // 1. Fetch Products and Calculate Items Total & Stock Check
        let calculatedItems = [];
        let itemsTotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.title}` });
            }

            // Determine price (use sale price if valid)
            const unitPrice = (product.salePrice && product.salePrice < product.price)
                ? product.salePrice
                : product.price;

            itemsTotal += unitPrice * item.quantity;

            calculatedItems.push({
                product: product._id,
                quantity: item.quantity,
                price: unitPrice
            });
        }

        // 2. Validate Coupon and Calculate Discount
        let discountAmount = 0;
        let validCouponId = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

            if (coupon && coupon.isActive && new Date() < coupon.expiresAt) {
                // Check minimum amount
                if (itemsTotal >= coupon.minAmount) {
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (itemsTotal * coupon.discountValue) / 100;
                        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                            discountAmount = coupon.maxDiscount;
                        }
                    } else { // fixed
                        discountAmount = coupon.discountValue;
                    }
                    validCouponId = coupon._id;
                }
            }
        }

        // 3. Calculate Final Total (Removed Shipping and Tax as per user request)
        const shipping = 0;
        const tax = 0;

        let finalTotal = itemsTotal - discountAmount;
        if (finalTotal < 0) finalTotal = 0;

        // 4. Create Order
        const order = new Order({
            user: req.user ? req.user._id : null,
            items: calculatedItems,
            shippingAddress,
            totalAmount: finalTotal, // Server calculated total
            coupon: validCouponId,
            paymentStatus: 'pending', // Will be updated by payment gateway in prod
        });

        const createdOrder = await order.save();

        // 5. Audit Log (Only for logged in users)
        if (req.user) {
            await createLog(req.user.id, 'Order Creation', `Created order ${createdOrder._id} for amount $${finalTotal.toFixed(2)}`);
        }

        // 6. Decrease Stock
        for (const item of calculatedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({
            success: true,
            data: createdOrder,
            summary: {
                subtotal: itemsTotal,
                discount: discountAmount,
                shipping,
                tax,
                total: finalTotal
            }
        });

    } catch (err) {
        console.error("Order Create Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product', 'title images')
            .populate('coupon', 'code discountType discountValue');

        if (order) {
            // Ensure user can only see their own orders unless admin
            if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }
            res.status(200).json({ success: true, data: order });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.paymentStatus = 'paid';
            order.paidAt = Date.now();

            const updatedOrder = await order.save();

            // Audit Log
            await createLog(req.user.id, 'Payment Update', `Order ${order._id} marked as PAID`);

            res.status(200).json({ success: true, data: updatedOrder });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
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
        if (req.body.status === 'delivered') {
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();

        // Audit Log
        await createLog(req.user.id, 'Order Status', `Order ${order._id} updated to ${req.body.status}`);

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'id name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
