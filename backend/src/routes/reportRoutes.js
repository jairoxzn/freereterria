const express = require('express');
const router = express.Router();
const { getDashboardStats, getSystemLogs } = require('../controllers/reportController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/dashboard', getDashboardStats);
router.get('/logs', isAdmin, getSystemLogs); // Auditoría de logs requiere privilegios Admin

module.exports = router;
