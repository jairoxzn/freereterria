const express = require('express');
const router = express.Router();
const {
  getAllPurchases,
  getPurchaseById,
  createPurchase
} = require('../controllers/purchaseController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase); // Cualquier empleado logueado puede registrar una compra/recepción de mercadería

module.exports = router;
