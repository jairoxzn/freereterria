const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllSuppliers);
router.get('/:id', getSupplierById);

router.post('/', isAdmin, createSupplier);
router.put('/:id', isAdmin, updateSupplier);
router.delete('/:id', isAdmin, deleteSupplier);

module.exports = router;
