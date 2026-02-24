const express = require('express');
const router = express.Router();

const { editComment, deleteComment } = require('../controllers/commentController');
const { commentValidator } = require('../validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.patch('/:id', authenticate, commentValidator, validate, editComment);
router.delete('/:id', authenticate, deleteComment);

module.exports = router;
