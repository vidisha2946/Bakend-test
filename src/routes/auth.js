const express = require('express');
const router = express.Router();

const { login } = require('../controllers/authController');
const { loginValidator } = require('../validators');
const validate = require('../middleware/validate');

router.post('/login', loginValidator, validate, login);

module.exports = router;
