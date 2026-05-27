const prisma = require('../db');
const logger = require('../logger');

// Obtener todas las categorías
async function getAllCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

// Obtener una categoría por ID
async function getCategoryById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

// Crear categoría
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es requerido.' });
    }

    // Validar nombre único
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese nombre.' });
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    logger.info(`Categoría creada: ${category.name} por usuario ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente.',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar categoría
async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es requerido.' });
    }

    // Validar si existe
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
    }

    // Validar nombre único si está cambiando
    if (name !== category.name) {
      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Ya existe otra categoría con ese nombre.' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, description }
    });

    logger.info(`Categoría ID ${id} actualizada: ${updated.name} por usuario ${req.user.email}`);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar categoría
async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    // Validar si tiene productos asociados
    const countProducts = await prisma.product.count({ where: { categoryId: id } });
    if (countProducts > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque contiene ${countProducts} productos asociados.`
      });
    }

    await prisma.category.delete({ where: { id } });

    logger.info(`Categoría ID ${id} eliminada por usuario ${req.user.email}`);

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
