const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/login', login);

// Rutas protegidas (El registro solo lo hace el Admin)
router.post('/register', verifyToken, isAdmin, register);
router.get('/profile', verifyToken, getProfile);

module.exports = router;
