const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Todas las rutas de categorías requieren inicio de sesión
router.use(verifyToken);

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Solo administradores pueden crear, modificar o eliminar categorías
router.post('/', isAdmin, createCategory);
router.put('/:id', isAdmin, updateCategory);
router.delete('/:id', isAdmin, deleteCategory);

module.exports = router;
