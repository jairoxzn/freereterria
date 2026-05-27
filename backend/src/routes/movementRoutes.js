const express = require('express');
const router = express.Router();
const { getMovements } = require('../controllers/movementController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getMovements);

module.exports = router;
