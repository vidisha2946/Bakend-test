const { body } = require('express-validator');

const loginValidator = [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const createUserValidator = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').notEmpty().withMessage('Role is required').isIn(['MANAGER', 'SUPPORT', 'USER']).withMessage('Role must be one of: MANAGER, SUPPORT, USER'),
];

const createTicketValidator = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 5 }).withMessage('Title must be at least 5 characters').isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('priority').notEmpty().withMessage('Priority is required').isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Priority must be one of: LOW, MEDIUM, HIGH'),
];

const assignTicketValidator = [
    body('userId').exists({ checkNull: true }).withMessage('userId is required').isInt({ gt: 0 }).withMessage('userId must be a positive integer').toInt(),
];

const updateStatusValidator = [
    body('status').notEmpty().withMessage('status is required').isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED'),
];

const commentValidator = [
    body('comment').trim().notEmpty().withMessage('Comment text is required'),
];

module.exports = {
    loginValidator,
    createUserValidator,
    createTicketValidator,
    assignTicketValidator,
    updateStatusValidator,
    commentValidator,
};
