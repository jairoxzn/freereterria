const express = require('express');
const router = express.Router();
const {
  getAllSales,
  getSaleById,
  createSale
} = require('../controllers/saleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/', createSale); // Los cajeros y administradores pueden emitir ventas

module.exports = router;
