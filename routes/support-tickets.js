const express = require('express');
const { getTickets, updateTicket, createTicket, deleteTicket } = require('../controllers/supportTicketController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin'), getTickets)
    .post(createTicket);

router.route('/:id')
    .put(protect, authorize('admin'), updateTicket)
    .delete(protect, authorize('admin'), deleteTicket);

module.exports = router;
