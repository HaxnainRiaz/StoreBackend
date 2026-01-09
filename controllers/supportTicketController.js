const SupportTicket = require('../models/SupportTicket');
const { createLog } = require('./auditController');
const { protect } = require('../middleware/authMiddleware'); // For conditional use if needed

// @desc    Get all support tickets
// @route   GET /api/support-tickets
// @access  Private/Admin
exports.getTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().populate('user', 'name email').sort('-createdAt');
        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get user's own tickets
// @route   GET /api/support-tickets/my-tickets
// @access  Private
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, data: tickets });
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
        const ticketData = { ...req.body };
        if (req.user) {
            ticketData.user = req.user.id;
        }
        const ticket = await SupportTicket.create(ticketData);
        res.status(201).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Add reply to ticket
// @route   POST /api/support-tickets/:id/reply
// @access  Private (User or Admin)
exports.addReply = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check ownership if not admin
        if (req.user.role !== 'admin' && ticket.user?.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const reply = {
            sender: req.user.role === 'admin' ? 'admin' : 'user',
            message: req.body.message
        };

        ticket.replies.push(reply);

        // If admin replies, set status to in-progress if it was open
        if (req.user.role === 'admin' && ticket.status === 'open') {
            ticket.status = 'in-progress';
        }

        await ticket.save();

        if (req.user.role === 'admin') {
            await createLog(req.user.id, 'Support Reply', `Admin replied to ticket from ${ticket.email}`);
        }

        res.status(200).json({ success: true, data: ticket });
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
