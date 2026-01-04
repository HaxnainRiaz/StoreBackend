const SupportTicket = require('../models/SupportTicket');
const { createLog } = require('./auditController');

// @desc    Get all support tickets
// @route   GET /api/support-tickets
// @access  Private/Admin
exports.getTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort('-createdAt');
        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/support-tickets/:id
// @access  Private/Admin
exports.updateTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Audit Log
        await createLog(req.user.id, 'Support Update', `Ticket from ${ticket.email} set to ${ticket.status}`);

        res.status(200).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Public submission
// @route   POST /api/support-tickets
// @access  Public
exports.createTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.create(req.body);
        res.status(201).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/support-tickets/:id
// @access  Private/Admin
exports.deleteTicket = async (req, res) => {
    try {
        await SupportTicket.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
