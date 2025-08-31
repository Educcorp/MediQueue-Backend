const { validationResult } = require('express-validator');
const responses = require('../utils/responses');

/**
 * Middleware para procesar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return responses.validationError(res, formattedErrors, 'Error de validación en los datos proporcionados');
  }
  
  next();
};

/**
 * Validaciones comunes para paginación
 */
const paginationValidation = [
  // page debe ser un entero positivo, por defecto 1
  (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    req.query.page = Math.max(1, page);
    next();
  },
  
  // limit debe ser un entero entre 1 y 100, por defecto 10
  (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    req.query.limit = Math.max(1, Math.min(100, limit));
    next();
  }
];

/**
 * Validación para parámetros de fecha
 */
const dateRangeValidation = [
  // fecha_inicio opcional, debe ser fecha válida
  (req, res, next) => {
    const { fecha_inicio } = req.query;
    if (fecha_inicio) {
      const fecha = new Date(fecha_inicio);
      if (isNaN(fecha.getTime())) {
        return responses.validationError(res, [{ field: 'fecha_inicio', message: 'Fecha de inicio inválida' }]);
      }
    }
    next();
  },
  
  // fecha_fin opcional, debe ser fecha válida y posterior a fecha_inicio
  (req, res, next) => {
    const { fecha_inicio, fecha_fin } = req.query;
    if (fecha_fin) {
      const fechaFin = new Date(fecha_fin);
      if (isNaN(fechaFin.getTime())) {
        return responses.validationError(res, [{ field: 'fecha_fin', message: 'Fecha de fin inválida' }]);
      }
      
      if (fecha_inicio) {
        const fechaInicio = new Date(fecha_inicio);
        if (fechaFin < fechaInicio) {
          return responses.validationError(res, [{ field: 'fecha_fin', message: 'La fecha de fin debe ser posterior a la fecha de inicio' }]);
        }
      }
    }
    next();
  }
];

/**
 * Sanitizar parámetros de búsqueda
 */
const sanitizeSearchParams = (req, res, next) => {
  if (req.query.search) {
    req.query.search = req.query.search.trim().substring(0, 100);
  }
  next();
};

/**
 * Validar que el ID en el parámetro coincida con el ID en el cuerpo (para operaciones de actualización)
 */
const validateIdMatch = (req, res, next) => {
  const paramId = parseInt(req.params.id);
  const bodyId = req.body.id;
  
  if (bodyId && parseInt(bodyId) !== paramId) {
    return responses.validationError(res, [{ field: 'id', message: 'El ID en la URL no coincide con el ID en el cuerpo de la petición' }]);
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  paginationValidation,
  dateRangeValidation,
  sanitizeSearchParams,
  validateIdMatch
};
