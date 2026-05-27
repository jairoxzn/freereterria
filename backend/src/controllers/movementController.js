const prisma = require('../db');

// Obtener todo el historial de movimientos de inventario (Kardex)
async function getMovements(req, res, next) {
  try {
    const { productId, type } = req.query;

    const where = {};

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (type) {
      where.type = type; // "INPUT", "OUTPUT", "ADJUSTMENT"
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            brand: true,
            stock: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMovements
};
