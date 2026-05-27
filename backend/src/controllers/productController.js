const prisma = require('../db');
const logger = require('../logger');

// Obtener todos los productos (con filtros opcionales de búsqueda, categoría, marca y bajo stock)
async function getAllProducts(req, res, next) {
  try {
    const { search, categoryId, brand, lowStock } = req.query;

    const where = {};

    // Filtro por estado activo de base
    // (opcional: se puede listar inactivos para administradores, pero mantengámoslo simple)

    // Búsqueda en tiempo real por Nombre o SKU
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por Categoría
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    // Filtro por Marca
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    // Filtro por Bajo Stock
    if (lowStock === 'true') {
      where.stock = {
        lt: prisma.product.fields.stockMin // stock < stockMin
      };
    }

    // Si queremos que funcione dinámicamente con Prisma, podemos cargarlos y filtrar, o usar la comparación de campos directos en BD.
    // Como Prisma v5 soporta comparar campos, o podemos evaluar `stock <= stockMin` a través de un query directo o cargando en memoria.
    // Para asegurar compatibilidad total en todas las versiones, cargamos con stock bajo consultando productos donde stock <= stockMin usando query relacional o crudo.
    // Escribamos un query robusto de Prisma:
    let products;
    if (lowStock === 'true') {
      // Cargamos productos y filtramos los que tengan stock por debajo o igual al stockMin.
      const allProds = await prisma.product.findMany({
        where: {
          ...where,
          // Removemos la comparación directa que podría fallar en algunos conectores viejos de Prisma
        },
        include: {
          category: {
            select: { name: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      products = allProds.filter(p => p.stock <= p.stockMin);
    } else {
      products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
}

// Obtener producto por ID
async function getProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

// Obtener producto por SKU (Escáner de código de barras)
async function getProductBySku(req, res, next) {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({
      where: { sku },
      include: {
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: `Producto con SKU '${sku}' no registrado.` });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

// Crear producto
async function createProduct(req, res, next) {
  try {
    const { name, sku, categoryId, brand, description, pricePurchase, priceSale, stock, stockMin, image, status } = req.body;

    if (!name || !sku || !categoryId || pricePurchase === undefined || priceSale === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Nombre, SKU, Categoría, Precio Compra, Precio Venta y Stock inicial son obligatorios.' });
    }

    // Verificar SKU duplicado
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Ya existe un producto con el SKU: ${sku}` });
    }

    // Crear el producto
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId: parseInt(categoryId),
        brand: brand || '',
        description: description || '',
        pricePurchase: parseFloat(pricePurchase),
        priceSale: parseFloat(priceSale),
        stock: parseInt(stock),
        stockMin: stockMin !== undefined ? parseInt(stockMin) : 5,
        image: image || null,
        status: status || 'ACTIVE'
      }
    });

    // Crear movimiento inicial en Kardex si stock > 0
    if (product.stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'INPUT',
          quantity: product.stock,
          reason: 'INVENTARIO INICIAL - REGISTRO DE PRODUCTO',
          userId: req.user.id
        }
      });
    }

    logger.info(`Producto creado: ${product.name} (SKU: ${product.sku}) por usuario ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Producto registrado exitosamente.',
      data: product
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar producto
async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, sku, categoryId, brand, description, pricePurchase, priceSale, stock, stockMin, image, status } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    // Verificar SKU único si cambió
    if (sku && sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return res.status(400).json({ success: false, message: `Ya existe otro producto con el SKU: ${sku}` });
      }
    }

    // Si se modifica el stock manualmente, registrar el movimiento de ajuste
    let finalStock = existingProduct.stock;
    if (stock !== undefined && parseInt(stock) !== existingProduct.stock) {
      finalStock = parseInt(stock);
      const diff = finalStock - existingProduct.stock;
      const type = diff > 0 ? 'INPUT' : 'OUTPUT';

      await prisma.inventoryMovement.create({
        data: {
          productId: id,
          type,
          quantity: Math.abs(diff),
          reason: `AJUSTE MANUAL DE INVENTARIO (Stock anterior: ${existingProduct.stock} -> Nuevo: ${finalStock})`,
          userId: req.user.id
        }
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        sku: sku || existingProduct.sku,
        categoryId: categoryId !== undefined ? parseInt(categoryId) : existingProduct.categoryId,
        brand: brand !== undefined ? brand : existingProduct.brand,
        description: description !== undefined ? description : existingProduct.description,
        pricePurchase: pricePurchase !== undefined ? parseFloat(pricePurchase) : existingProduct.pricePurchase,
        priceSale: priceSale !== undefined ? parseFloat(priceSale) : existingProduct.priceSale,
        stock: finalStock,
        stockMin: stockMin !== undefined ? parseInt(stockMin) : existingProduct.stockMin,
        image: image !== undefined ? image : existingProduct.image,
        status: status || existingProduct.status
      }
    });

    logger.info(`Producto ID ${id} actualizado por usuario ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar producto
async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    // Validar si tiene movimientos o ventas/compras registradas
    const countMovements = await prisma.inventoryMovement.count({ where: { productId: id } });
    const countSales = await prisma.saleDetail.count({ where: { productId: id } });
    const countPurchases = await prisma.purchaseDetail.count({ where: { productId: id } });

    if (countSales > 0 || countPurchases > 0) {
      // En vez de eliminar físicamente, se puede desactivar para mantener integridad referencial
      await prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });

      logger.info(`Producto ID ${id} desactivado (INACTIVE) en lugar de eliminado debido a transacciones existentes.`);
      return res.json({
        success: true,
        message: 'El producto tiene transacciones registradas. Se ha cambiado su estado a INACTIVO para proteger el histórico.'
      });
    }

    // Si no tiene historial, se puede borrar
    if (countMovements > 0) {
      await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
    }

    await prisma.product.delete({ where: { id } });

    logger.info(`Producto ID ${id} eliminado definitivamente por usuario ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente del catálogo.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct
};
