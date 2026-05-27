const prisma = require('../db');
const logger = require('../logger');

// Obtener historial de todas las compras
async function getAllPurchases(req, res, next) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        },
        details: {
          include: {
            product: {
              select: { name: true, sku: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    next(error);
  }
}

// Obtener compra detallada por ID
async function getPurchaseById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: { name: true, email: true }
        },
        details: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Registro de compra no encontrado.' });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
}

// Registrar nueva compra (Aumenta stock y añade Kardex automáticamente en una transacción atómica)
async function createPurchase(req, res, next) {
  try {
    const { supplierId, items } = req.body; // items: [{ productId, quantity, pricePurchase }]

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere el proveedor y al menos un producto a comprar.' });
    }

    // Ejecutar la operación en una transacción atómica
    const newPurchase = await prisma.$transaction(async (tx) => {
      let totalPurchase = 0;

      // 1. Calcular total y validar datos de entrada
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0 || !item.pricePurchase || item.pricePurchase <= 0) {
          throw new Error('Datos de producto inválidos en los ítems de compra.');
        }
        totalPurchase += parseInt(item.quantity) * parseFloat(item.pricePurchase);
      }

      // 2. Crear cabecera de compra
      const purchase = await tx.purchase.create({
        data: {
          supplierId: parseInt(supplierId),
          userId: req.user.id,
          total: totalPurchase
        }
      });

      // 3. Crear detalles de compra, actualizar stock y registrar movimientos de Kardex
      for (const item of items) {
        // Registrar el detalle
        await tx.purchaseDetail.create({
          data: {
            purchaseId: purchase.id,
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            pricePurchase: parseFloat(item.pricePurchase)
          }
        });

        // Aumentar stock del producto
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            stock: {
              increment: parseInt(item.quantity)
            },
            pricePurchase: parseFloat(item.pricePurchase) // Actualizar costo de compra de referencia
          }
        });

        // Generar Kardex de Entrada
        await tx.inventoryMovement.create({
          data: {
            productId: parseInt(item.productId),
            type: 'INPUT',
            quantity: parseInt(item.quantity),
            reason: `ABASTECIMIENTO - COMPRA PROVEEDOR #${purchase.id}`,
            userId: req.user.id
          }
        });
      }

      return purchase;
    });

    logger.info(`Compra registrada exitosamente ID ${newPurchase.id} por usuario ${req.user.email} con un total de S/. ${newPurchase.total}`);

    res.status(201).json({
      success: true,
      message: 'Compra y stock registrados exitosamente.',
      data: newPurchase
    });
  } catch (error) {
    logger.error('Error en transacción de compra:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al procesar la compra en la base de datos.'
    });
  }
}

module.exports = {
  getAllPurchases,
  getPurchaseById,
  createPurchase
};
