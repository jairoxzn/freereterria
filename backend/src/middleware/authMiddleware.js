const jwt = require('jsonwebtoken');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'ferreteria_freereterria_secret_key_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    logger.warn(`Petición rechazada sin token JWT desde IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó un token de autenticación.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Intento de acceso con token inválido/expirado desde IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Token de autenticación inválido o expirado.'
    });
  }
}

function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado.'
    });
  }

  if (req.user.role !== 'ADMIN') {
    logger.warn(`Usuario ${req.user.email} con rol ${req.user.role} intentó acceder a recurso administrativo.`);
    return res.status(403).json({
      success: false,
      message: 'Permiso denegado. Se requieren privilegios de administrador.'
    });
  }

  next();
}

module.exports = {
  verifyToken,
  isAdmin
};
