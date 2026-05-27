const prisma = require('../db');
const logger = require('../logger');

// Obtener todos los proveedores
async function getAllSuppliers(req, res, next) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true }
        }
      }
    });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
}

// Obtener proveedor por ID
async function getSupplierById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: true
      }
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

// Crear proveedor
async function createSupplier(req, res, next) {
  try {
    const { name, phone, address, email } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre del proveedor es obligatorio.' });
    }

    const supplier = await prisma.supplier.create({
      data: { name, phone, address, email }
    });

    logger.info(`Proveedor creado: ${supplier.name} por usuario ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente.',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar proveedor
async function updateSupplier(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, address, email } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre del proveedor es obligatorio.' });
    }

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: { name, phone, address, email }
    });

    logger.info(`Proveedor ID ${id} actualizado por usuario ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar proveedor
async function deleteSupplier(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    // Validar si tiene compras asociadas
    const countPurchases = await prisma.purchase.count({ where: { supplierId: id } });
    if (countPurchases > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el proveedor porque registra ${countPurchases} compras de abastecimiento.`
      });
    }

    await prisma.supplier.delete({ where: { id } });

    logger.info(`Proveedor ID ${id} eliminado por usuario ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
