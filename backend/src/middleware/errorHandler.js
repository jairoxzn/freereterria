const logger = require('../logger');

function errorHandler(err, req, res, next) {
  logger.error(`Error procesando petición ${req.method} en ${req.originalUrl}`, err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Ocurrió un error interno en el servidor.',
    // Solo mostrar detalles del stack en desarrollo
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
