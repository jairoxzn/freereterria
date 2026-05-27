const prisma = require('../db');
const logger = require('../logger');

// Obtener todas las ventas registradas
async function getAllSales(req, res, next) {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        },
        saleDetails: {
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
      data: sales
    });
  } catch (error) {
    next(error);
  }
}

// Obtener detalles de una venta específica por ID
async function getSaleById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        saleDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Ticket de venta no encontrado.' });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
}

// Registrar nueva venta en el POS (Disminuye stock y genera Kardex atómicamente)
async function createSale(req, res, next) {
  try {
    const { items, discount } = req.body; // items: [{ productId, quantity, priceSale }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'El carrito de ventas no puede estar vacío.' });
    }

    const cleanDiscount = discount ? parseFloat(discount) : 0;

    // Ejecutar transacciones de venta de forma segura
    const newSale = await prisma.$transaction(async (tx) => {
      let calculatedTotal = 0;

      // 1. Validar existencias de stock antes de vender
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId) }
        });

        if (!product) {
          throw new Error(`Producto no encontrado en catálogo.`);
        }

        if (product.status !== 'ACTIVE') {
          throw new Error(`El producto "${product.name}" se encuentra inactivo y no se puede vender.`);
        }

        if (product.stock < parseInt(item.quantity)) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
        }

        calculatedTotal += parseInt(item.quantity) * parseFloat(item.priceSale);
      }

      // 2. Crear cabecera de la venta
      const finalTotal = Math.max(0, calculatedTotal - cleanDiscount);
      const sale = await tx.sale.create({
        data: {
          userId: req.user.id,
          total: finalTotal,
          discount: cleanDiscount
        }
      });

      // 3. Crear detalles, decrementar inventario y guardar Kardex
      for (const item of items) {
        const subtotal = parseInt(item.quantity) * parseFloat(item.priceSale);

        // Guardar detalle de venta
        await tx.saleDetail.create({
          data: {
            saleId: sale.id,
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            priceSale: parseFloat(item.priceSale),
            total: subtotal
          }
        });

        // Decrementar el inventario físico
        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: {
            stock: {
              decrement: parseInt(item.quantity)
            }
          }
        });

        // Registrar movimiento de salida en Kardex
        await tx.inventoryMovement.create({
          data: {
            productId: parseInt(item.productId),
            type: 'OUTPUT',
            quantity: parseInt(item.quantity),
            reason: `VENTA POS TICKET #${sale.id}`,
            userId: req.user.id
          }
        });
      }

      return sale;
    });

    logger.info(`Venta POS registrada ID ${newSale.id} por usuario ${req.user.email} con un total final de S/. ${newSale.total}`);

    res.status(201).json({
      success: true,
      message: 'Venta procesada y comprobante generado exitosamente.',
      data: newSale
    });
  } catch (error) {
    logger.error('Error en transacción de venta POS:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al procesar la venta en la base de datos.'
    });
  }
}

module.exports = {
  getAllSales,
  getSaleById,
  createSale
};
