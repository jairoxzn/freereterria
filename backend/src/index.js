require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./logger');
const errorHandler = require('./middleware/errorHandler');

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const movementRoutes = require('./routes/movementRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors({
  origin: '*', // Permitir cualquier origen para desarrollo local simple, modularizar si es necesario
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Test simple de disponibilidad
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    systemTime: new Date().toISOString(),
    name: 'Freereterria API Server'
  });
});

// Registrar Módulos de Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/reports', reportRoutes);

// Servir un simple error 404 para cualquier ruta no mapeada
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware Global de Errores
app.use(errorHandler);

// Iniciar Servidor
app.listen(PORT, () => {
  logger.info(`Servidor API iniciado exitosamente en el puerto ${PORT}`);
  console.log(`\x1b[36m%s\x1b[0m`, `------------------------------------------------------`);
  console.log(`\x1b[36m%s\x1b[0m`, `  Freereterria Backend API corriendo en http://localhost:${PORT}`);
  console.log(`\x1b[36m%s\x1b[0m`, `------------------------------------------------------`);
});
