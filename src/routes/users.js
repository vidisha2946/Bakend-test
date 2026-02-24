const express = require('express');
const router = express.Router();

const { createUser, listUsers } = require('../controllers/userController');
const { createUserValidator } = require('../validators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('MANAGER'), createUserValidator, validate, createUser);
router.get('/', authenticate, authorize('MANAGER'), listUsers);

module.exports = router;
