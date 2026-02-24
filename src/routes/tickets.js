const express = require('express');
const router = express.Router();

const { getTicketById, createTicket, listTickets, assignTicket, updateStatus, deleteTicket } = require('../controllers/ticketController');
const { addComment, listComments } = require('../controllers/commentController');
const { createTicketValidator, assignTicketValidator, updateStatusValidator, commentValidator } = require('../validators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('USER', 'MANAGER'), createTicketValidator, validate, createTicket);
router.get('/', authenticate, listTickets);
router.get('/:id', authenticate, getTicketById);
router.patch('/:id/assign', authenticate, authorize('MANAGER', 'SUPPORT'), assignTicketValidator, validate, assignTicket);
router.patch('/:id/status', authenticate, authorize('MANAGER', 'SUPPORT'), updateStatusValidator, validate, updateStatus);
router.delete('/:id', authenticate, authorize('MANAGER'), deleteTicket);
router.post('/:id/comments', authenticate, commentValidator, validate, addComment);
router.get('/:id/comments', authenticate, listComments);

module.exports = router;
