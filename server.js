require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// 1. CONFIGURACIÓN E INICIALIZACIÓN
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ferreteria_freereterria_secret_key_2026';

// Conector Singleton de Prisma
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Logger del sistema (consola y archivo local con degradación segura para Vercel)
const logDir = path.join(__dirname, 'logs');
let canWriteLogs = true;

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
} catch (e) {
  canWriteLogs = false;
  console.log("Sistema de archivos de sólo lectura (Vercel). Escribiendo logs únicamente en consola.");
}

const logFile = path.join(logDir, 'system.log');

const logger = {
  info: (message) => {
    const ts = new Date().toISOString();
    const formatted = `[${ts}] [INFO]: ${message}\n`;
    console.log(`\x1b[32m%s\x1b[0m`, formatted.trim());
    if (canWriteLogs) {
      try {
        fs.appendFileSync(logFile, formatted);
      } catch (e) {}
    }
  },
  warn: (message) => {
    const ts = new Date().toISOString();
    const formatted = `[${ts}] [WARN]: ${message}\n`;
    console.log(`\x1b[33m%s\x1b[0m`, formatted.trim());
    if (canWriteLogs) {
      try {
        fs.appendFileSync(logFile, formatted);
      } catch (e) {}
    }
  },
  error: (message, err) => {
    const ts = new Date().toISOString();
    const errDetails = err ? ` - Details: ${err.message}\n${err.stack}` : '';
    const formatted = `[${ts}] [ERROR]: ${message}${errDetails}\n`;
    console.error(`\x1b[31m%s\x1b[0m`, formatted.trim());
    if (canWriteLogs) {
      try {
        fs.appendFileSync(logFile, formatted);
      } catch (e) {}
    }
  },
  getLogs: () => {
    if (!canWriteLogs || !fs.existsSync(logFile)) {
      return [
        `[${new Date().toISOString()}] [INFO]: Servidor en la nube activo. logs de consola de Vercel disponibles en tiempo real.`
      ];
    }
    try {
      return fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
    } catch (e) {
      return [];
    }
  }
};

prisma.$on('error', (e) => logger.error(`Prisma: ${e.message}`));
prisma.$on('warn', (e) => logger.warn(`Prisma: ${e.message}`));

// Middlewares globales
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(morgan('dev'));

// Servir la carpeta estática "public" para el frontend SPA
app.use(express.static(path.join(__dirname, 'public')));


// 2. MIDDLEWARES DE SEGURIDAD (JWT & ROLES)
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn(`Intento de acceso sin token desde IP: ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Token inválido o expirado desde IP: ${req.ip}`);
    return res.status(403).json({ success: false, message: 'Token de sesión inválido o expirado.' });
  }
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    logger.warn(`Acceso administrativo denegado para: ${req.user?.email || 'Desconocido'}`);
    return res.status(403).json({ success: false, message: 'Permiso denegado. Se requiere rol de Administrador.' });
  }
  next();
}


// 3. ENDPOINTS DE LA API (REST)

// --- AUTENTICACIÓN ---
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    logger.info(`Inicio de sesión: ${user.email}`);

    res.json({ success: true, message: 'Sesión iniciada.', token, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

app.post('/api/auth/register', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'EMPLOYEE' }
    });

    logger.info(`Usuario registrado: ${user.email} con rol: ${user.role}`);
    res.status(201).json({ success: true, message: 'Personal registrado con éxito.', data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

app.get('/api/auth/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

// --- CATEGORÍAS ---
app.get('/api/categories', verifyToken, async (req, res, next) => {
  try {
    const list = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
    res.json({ success: true, data: list });
  } catch (error) { next(error); }
});

app.post('/api/categories', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nombre obligatorio.' });

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Categoría existente.' });

    const cat = await prisma.category.create({ data: { name, description } });
    logger.info(`Categoría creada: ${cat.name}`);
    res.status(201).json({ success: true, message: 'Categoría creada con éxito.', data: cat });
  } catch (error) { next(error); }
});

app.put('/api/categories/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });

    const updated = await prisma.category.update({ where: { id }, data: { name, description } });
    res.json({ success: true, message: 'Categoría modificada.', data: updated });
  } catch (error) { next(error); }
});

app.delete('/api/categories/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) return res.status(400).json({ success: false, message: `No se puede eliminar, contiene ${productsCount} artículos asociados.` });

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Categoría eliminada con éxito.' });
  } catch (error) { next(error); }
});

// --- PROVEEDORES ---
app.get('/api/suppliers', verifyToken, async (req, res, next) => {
  try {
    const list = await prisma.supplier.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { purchases: true } } } });
    res.json({ success: true, data: list });
  } catch (error) { next(error); }
});

app.post('/api/suppliers', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nombre obligatorio.' });

    const supplier = await prisma.supplier.create({ data: { name, phone, address, email } });
    logger.info(`Proveedor creado: ${supplier.name}`);
    res.status(201).json({ success: true, message: 'Proveedor registrado.', data: supplier });
  } catch (error) { next(error); }
});

app.put('/api/suppliers/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, address, email } = req.body;

    const updated = await prisma.supplier.update({ where: { id }, data: { name, phone, address, email } });
    res.json({ success: true, message: 'Proveedor actualizado.', data: updated });
  } catch (error) { next(error); }
});

app.delete('/api/suppliers/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const purchasesCount = await prisma.purchase.count({ where: { supplierId: id } });
    if (purchasesCount > 0) return res.status(400).json({ success: false, message: 'No se puede eliminar, registra abastecimientos vinculados.' });

    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true, message: 'Proveedor eliminado.' });
  } catch (error) { next(error); }
});

// --- PRODUCTOS ---
app.get('/api/products', verifyToken, async (req, res, next) => {
  try {
    const { search, categoryId, brand, lowStock } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };

    const allProds = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });

    const products = lowStock === 'true' ? allProds.filter(p => p.stock <= p.stockMin) : allProds;
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
});

app.get('/api/products/:id', verifyToken, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const prod = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!prod) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    res.json({ success: true, data: prod });
  } catch (error) { next(error); }
});

app.get('/api/products/sku/:sku', verifyToken, async (req, res, next) => {
  try {
    const prod = await prisma.product.findUnique({ where: { sku: req.params.sku }, include: { category: true } });
    if (!prod) return res.status(404).json({ success: false, message: 'SKU no registrado.' });
    res.json({ success: true, data: prod });
  } catch (error) { next(error); }
});

app.post('/api/products', verifyToken, async (req, res, next) => {
  try {
    const { name, sku, categoryId, brand, description, pricePurchase, priceSale, stock, stockMin, image, status } = req.body;
    if (!name || !sku || !categoryId || pricePurchase === undefined || priceSale === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios incompletos.' });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) return res.status(400).json({ success: false, message: `El SKU ${sku} ya está en uso.` });

    const product = await prisma.product.create({
      data: {
        name, sku, categoryId: parseInt(categoryId), brand: brand || '', description: description || '',
        pricePurchase: parseFloat(pricePurchase), priceSale: parseFloat(priceSale), stock: parseInt(stock),
        stockMin: stockMin !== undefined ? parseInt(stockMin) : 5, image: image || null, status: status || 'ACTIVE'
      }
    });

    if (product.stock > 0) {
      await prisma.inventoryMovement.create({
        data: { productId: product.id, type: 'INPUT', quantity: product.stock, reason: 'REGISTRO INICIAL DE PRODUCTO', userId: req.user.id }
      });
    }

    logger.info(`Producto creado: ${product.name} (${product.sku})`);
    res.status(201).json({ success: true, message: 'Producto registrado.', data: product });
  } catch (error) { next(error); }
});

app.put('/api/products/:id', verifyToken, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, sku, categoryId, brand, description, pricePurchase, priceSale, stock, stockMin, image, status } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });

    let finalStock = existing.stock;
    if (stock !== undefined && parseInt(stock) !== existing.stock) {
      finalStock = parseInt(stock);
      const diff = finalStock - existing.stock;
      await prisma.inventoryMovement.create({
        data: { productId: id, type: diff > 0 ? 'INPUT' : 'OUTPUT', quantity: Math.abs(diff), reason: `AJUSTE MANUAL DE INVENTARIO`, userId: req.user.id }
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name || existing.name, sku: sku || existing.sku, categoryId: categoryId !== undefined ? parseInt(categoryId) : existing.categoryId,
        brand: brand !== undefined ? brand : existing.brand, description: description !== undefined ? description : existing.description,
        pricePurchase: pricePurchase !== undefined ? parseFloat(pricePurchase) : existing.pricePurchase,
        priceSale: priceSale !== undefined ? parseFloat(priceSale) : existing.priceSale, stock: finalStock,
        stockMin: stockMin !== undefined ? parseInt(stockMin) : existing.stockMin, image: image !== undefined ? image : existing.image, status: status || existing.status
      }
    });

    res.json({ success: true, message: 'Producto actualizado.', data: updated });
  } catch (error) { next(error); }
});

app.delete('/api/products/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const countSales = await prisma.saleDetail.count({ where: { productId: id } });
    const countPurchases = await prisma.purchaseDetail.count({ where: { productId: id } });

    if (countSales > 0 || countPurchases > 0) {
      await prisma.product.update({ where: { id }, data: { status: 'INACTIVE' } });
      return res.json({ success: true, message: 'El producto registra transacciones. Desactivado (INACTIVE) para proteger el historial.' });
    }

    await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Producto eliminado del catálogo.' });
  } catch (error) { next(error); }
});

// --- COMPRAS (ABASTECIMIENTO) ---
app.get('/api/purchases', verifyToken, async (req, res, next) => {
  try {
    const list = await prisma.purchase.findMany({
      include: { supplier: { select: { name: true } }, user: { select: { name: true } }, details: { include: { product: { select: { name: true, sku: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (error) { next(error); }
});

app.get('/api/purchases/:id', verifyToken, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const pur = await prisma.purchase.findUnique({
      where: { id },
      include: { supplier: true, user: { select: { name: true } }, details: { include: { product: true } } }
    });
    if (!pur) return res.status(404).json({ success: false, message: 'Compra no encontrada.' });
    res.json({ success: true, data: pur });
  } catch (error) { next(error); }
});

app.post('/api/purchases', verifyToken, async (req, res, next) => {
  try {
    const { supplierId, items } = req.body;
    if (!supplierId || !items || items.length === 0) return res.status(400).json({ success: false, message: 'Faltan datos de compra.' });

    const newPurchase = await prisma.$transaction(async (tx) => {
      let totalPurchase = 0;
      for (const item of items) {
        totalPurchase += parseInt(item.quantity) * parseFloat(item.pricePurchase);
      }

      const purchase = await tx.purchase.create({
        data: { supplierId: parseInt(supplierId), userId: req.user.id, total: totalPurchase }
      });

      for (const item of items) {
        await tx.purchaseDetail.create({
          data: { purchaseId: purchase.id, productId: parseInt(item.productId), quantity: parseInt(item.quantity), pricePurchase: parseFloat(item.pricePurchase) }
        });

        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: { stock: { increment: parseInt(item.quantity) }, pricePurchase: parseFloat(item.pricePurchase) }
        });

        await tx.inventoryMovement.create({
          data: { productId: parseInt(item.productId), type: 'INPUT', quantity: parseInt(item.quantity), reason: `COMPRA A PROVEEDOR #${purchase.id}`, userId: req.user.id }
        });
      }
      return purchase;
    });

    logger.info(`Compra registrada ID: ${newPurchase.id} por total S/. ${newPurchase.total}`);
    res.status(201).json({ success: true, message: 'Abastecimiento registrado con éxito.', data: newPurchase });
  } catch (error) { next(error); }
});

// --- VENTAS (POS) ---
app.get('/api/sales', verifyToken, async (req, res, next) => {
  try {
    const list = await prisma.sale.findMany({
      include: { user: { select: { name: true } }, saleDetails: { include: { product: { select: { name: true, sku: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (error) { next(error); }
});

app.get('/api/sales/:id', verifyToken, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { user: { select: { name: true } }, saleDetails: { include: { product: true } } }
    });
    if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada.' });
    res.json({ success: true, data: sale });
  } catch (error) { next(error); }
});

app.post('/api/sales', verifyToken, async (req, res, next) => {
  try {
    const { items, discount } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Carrito de compras vacío.' });

    const cleanDiscount = discount ? parseFloat(discount) : 0;

    const newSale = await prisma.$transaction(async (tx) => {
      let calculatedTotal = 0;
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: parseInt(item.productId) } });
        if (!product) throw new Error('Producto no encontrado.');
        if (product.status !== 'ACTIVE') throw new Error(`Producto ${product.name} inactivo.`);
        if (product.stock < parseInt(item.quantity)) throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}`);

        calculatedTotal += parseInt(item.quantity) * parseFloat(item.priceSale);
      }

      const finalTotal = Math.max(0, calculatedTotal - cleanDiscount);
      const sale = await tx.sale.create({
        data: { userId: req.user.id, total: finalTotal, discount: cleanDiscount }
      });

      for (const item of items) {
        const subtotal = parseInt(item.quantity) * parseFloat(item.priceSale);
        await tx.saleDetail.create({
          data: { saleId: sale.id, productId: parseInt(item.productId), quantity: parseInt(item.quantity), priceSale: parseFloat(item.priceSale), total: subtotal }
        });

        await tx.product.update({
          where: { id: parseInt(item.productId) },
          data: { stock: { decrement: parseInt(item.quantity) } }
        });

        await tx.inventoryMovement.create({
          data: { productId: parseInt(item.productId), type: 'OUTPUT', quantity: parseInt(item.quantity), reason: `VENTA POS TICKET #${sale.id}`, userId: req.user.id }
        });
      }
      return sale;
    });

    logger.info(`Venta POS registrada ID: ${newSale.id} por total S/. ${newSale.total}`);
    res.status(201).json({ success: true, message: 'Venta facturada.', data: newSale });
  } catch (error) {
    logger.error('POS Checkout Error', error);
    res.status(400).json({ success: false, message: error.message || 'Error al procesar la venta.' });
  }
});

// --- KARDEX ---
app.get('/api/movements', verifyToken, async (req, res, next) => {
  try {
    const { productId, type } = req.query;
    const where = {};

    if (productId) where.productId = parseInt(productId);
    if (type) where.type = type;

    const list = await prisma.inventoryMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true, stock: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (error) { next(error); }
});

// --- REPORTES Y ESTADÍSTICAS ---
app.get('/api/reports/dashboard', verifyToken, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });

    const allProds = await prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { stock: true, stockMin: true } });
    const lowStockCount = allProds.filter(p => p.stock <= p.stockMin).length;

    const salesTodayRes = await prisma.sale.aggregate({ where: { createdAt: { gte: today } }, _sum: { total: true }, _count: { id: true } });
    const salesToday = salesTodayRes._sum.total || 0;
    const salesCountToday = salesTodayRes._count.id || 0;

    const salesMonthRes = await prisma.sale.aggregate({ where: { createdAt: { gte: firstDay } }, _sum: { total: true } });
    const earningsMonth = salesMonthRes._sum.total || 0;

    // Historial 7 días
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const dEnd = new Date(d);
      dEnd.setDate(dEnd.getDate() + 1);

      const daySales = await prisma.sale.aggregate({ where: { createdAt: { gte: d, lt: dEnd } }, _sum: { total: true } });
      salesTrend.push({
        name: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        ventas: daySales._sum.total || 0
      });
    }

    // Categorías stock dist
    const categories = await prisma.category.findMany({ include: { products: { where: { status: 'ACTIVE' }, select: { stock: true } } } });
    const categoryDist = categories.map(cat => ({
      name: cat.name,
      value: cat.products.reduce((acc, curr) => acc + curr.stock, 0)
    })).filter(i => i.value > 0);

    const lowStockAlerts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 8
    });

    res.json({
      success: true,
      data: {
        totalProducts, lowStockCount, salesToday, salesCountToday, earningsMonth, salesTrend, categoryDist,
        lowStockAlerts: lowStockAlerts.filter(p => p.stock <= p.stockMin)
      }
    });
  } catch (error) { next(error); }
});

app.get('/api/reports/logs', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const rawLogs = logger.getLogs();
    res.json({ success: true, data: rawLogs.reverse().slice(0, 200) });
  } catch (error) { next(error); }
});


// 4. MANEJO DE RUTAS FALLBACK (APLICACIÓN SPA REACT)
// Sirve la SPA para cualquier ruta no capturada por la API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware Global de Errores
app.use((err, req, res, next) => {
  logger.error(`API Error en ${req.method} ${req.url}`, err);
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ success: false, message: err.message || 'Error interno del servidor.' });
});

// Iniciar servidor
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`Servidor Monolítico Freereterria iniciado en http://localhost:${PORT}`);
    console.log(`\x1b[36m%s\x1b[0m`, `======================================================`);
    console.log(`\x1b[36m%s\x1b[0m`, `  SISTEMA MONOLÍTICO FREERETERRIA CORRIENDO`);
    console.log(`\x1b[36m%s\x1b[0m`, `  Accede localmente en: http://localhost:${PORT}`);
    console.log(`\x1b[36m%s\x1b[0m`, `======================================================`);
  });
}

module.exports = app;

