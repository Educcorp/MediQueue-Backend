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

    // Obtener datos completos del administrador usando UUID
    const administrador = await Administrador.getById(decoded.uk_administrador);

    if (!administrador) {
      return responses.unauthorized(res, 'Token inválido - usuario no encontrado');
    }

    // Verificar que el administrador esté activo
    if (administrador.ck_estado !== 'ACTIVO') {
      return responses.unauthorized(res, 'Cuenta desactivada');
    }

    // Agregar datos del usuario al request
    req.user = {
      uk_administrador: administrador.uk_administrador,
      s_nombre: administrador.s_nombre,
      s_apellido: administrador.s_apellido,
      s_email: administrador.s_email,
      s_usuario: administrador.s_usuario,
      tipo_usuario: administrador.tipo_usuario,
      c_telefono: administrador.c_telefono
    };
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
    const administrador = await Administrador.getById(decoded.uk_administrador);

    if (administrador && administrador.ck_estado === 'ACTIVO') {
      req.user = {
        uk_administrador: administrador.uk_administrador,
        s_nombre: administrador.s_nombre,
        s_apellido: administrador.s_apellido,
        s_email: administrador.s_email,
        s_usuario: administrador.s_usuario,
        tipo_usuario: administrador.tipo_usuario,
        c_telefono: administrador.c_telefono
      };
    } else {
      req.user = null;
    }

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
 * Verificar si el usuario autenticado es administrador principal (tipo_usuario = 1)
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return responses.unauthorized(res, 'Acceso denegado');
  }

  if (req.user.tipo_usuario !== 1) {
    return responses.forbidden(res, 'Se requieren permisos de administrador principal');
  }

  next();
};

/**
 * Verificar si el usuario autenticado es supervisor o administrador
 */
const requireSupervisorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return responses.unauthorized(res, 'Acceso denegado');
  }

  if (![1, 2].includes(req.user.tipo_usuario)) {
    return responses.forbidden(res, 'Se requieren permisos de supervisor o administrador');
  }

  next();
};

/**
 * Middleware para extraer información del paciente de los parámetros de consulta
 * Útil para endpoints que pueden ser usados por pacientes o administradores
 */
const extractPacienteInfo = (req, res, next) => {
  const { c_telefono, s_nombre } = req.query;

  if (c_telefono || s_nombre) {
    req.pacienteSearch = {
      c_telefono: c_telefono || null,
      s_nombre: s_nombre || null
    };
  }

  next();
};

/**
 * Middleware para validar que el usuario puede acceder a un recurso específico
 * Útil para endpoints donde el usuario solo puede acceder a sus propios datos
 */
const requireOwnershipOrAdmin = (resourceField = 'uk_administrador') => {
  return (req, res, next) => {
    if (!req.user) {
      return responses.unauthorized(res, 'Acceso denegado');
    }

    // Si es administrador principal, puede acceder a todo
    if (req.user.tipo_usuario === 1) {
      return next();
    }

    // Para otros casos, verificar que el recurso pertenece al usuario
    const resourceId = req.params[resourceField] || req.body[resourceField];
    if (resourceId && resourceId !== req.user.uk_administrador) {
      return responses.forbidden(res, 'No tienes permisos para acceder a este recurso');
    }

    next();
  };
};

/**
 * Middleware para logging de acciones de administradores
 */
const logAdminAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(`[${new Date().toISOString()}] Admin ${req.user.s_usuario} (${req.user.uk_administrador}) - ${action}`);
    }
    next();
  };
};

module.exports = {
  verifyToken,
  optionalAuth,
  generateToken,
  requireAdmin,
  requireSuperAdmin,
  requireSupervisorOrAdmin,
  extractPacienteInfo,
  requireOwnershipOrAdmin,
  logAdminAction
};