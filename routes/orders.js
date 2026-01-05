const express = require('express');
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    getOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize, optional } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(optional, addOrderItems)
    .get(protect, authorize('admin'), getOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/status').put(protect, authorize('admin'), updateOrderStatus);

module.exports = router;
