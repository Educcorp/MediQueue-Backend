const jwt = require('jsonwebtoken');
const config = require('../config/config');
const responses = require('../utils/responses');
const Administrador = require('../models/Administrador');

/**
 * Middleware para verificar JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return responses.unauthorized(res, 'Token de acceso requerido');
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return responses.unauthorized(res, 'Token de acceso requerido');
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Obtener datos completos del administrador
    const administrador = await Administrador.getById(decoded.id);
    
    if (!administrador) {
      return responses.unauthorized(res, 'Token inválido');
    }

    // Agregar datos del usuario al request
    req.user = administrador.toJSON();
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return responses.unauthorized(res, 'Token inválido');
    }
    
    if (error.name === 'TokenExpiredError') {
      return responses.unauthorized(res, 'Token expirado');
    }
    
    console.error('Error en middleware de autenticación:', error);
    return responses.error(res, 'Error interno del servidor');
  }
};

/**
 * Middleware opcional para verificar JWT (no bloquea si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const administrador = await Administrador.getById(decoded.id);
    
    req.user = administrador ? administrador.toJSON() : null;
    next();
    
  } catch (error) {
    // Si hay error con el token, simplemente no autenticar
    req.user = null;
    next();
  }
};

/**
 * Generar token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Verificar si el usuario autenticado es administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return responses.unauthorized(res, 'Acceso denegado');
  }
  
  // En este sistema, todos los usuarios autenticados son administradores
  next();
};

/**
 * Middleware para extraer información del paciente de los parámetros de consulta
 * Útil para endpoints que pueden ser usados por pacientes o administradores
 */
const extractPacienteInfo = (req, res, next) => {
  const { telefono, nombre } = req.query;
  
  if (telefono || nombre) {
    req.pacienteSearch = {
      telefono: telefono || null,
      nombre: nombre || null
    };
  }
  
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  generateToken,
  requireAdmin,
  extractPacienteInfo
};
