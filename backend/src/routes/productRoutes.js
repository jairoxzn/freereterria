const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/sku/:sku', getProductBySku);

router.post('/', createProduct); // Los empleados también pueden registrar si es necesario, o restringirlo a Admin. Permitámoslo, y eliminar solo Admin.
router.put('/:id', updateProduct);
router.delete('/:id', isAdmin, deleteProduct); // Eliminar de forma segura requiere Admin

module.exports = router;
