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
  if (req.query.term) {
    req.query.term = req.query.term.trim().substring(0, 100);
  }
  next();
};

/**
 * Validar que el UUID en el parámetro coincida con el UUID en el cuerpo (para operaciones de actualización)
 */
const validateUUIDMatch = (req, res, next) => {
  const paramUUID = req.params.uk_administrador || req.params.uk_paciente || req.params.uk_turno || req.params.uk_consultorio || req.params.uk_area;
  const bodyUUID = req.body.uk_administrador || req.body.uk_paciente || req.body.uk_turno || req.body.uk_consultorio || req.body.uk_area;

  if (bodyUUID && bodyUUID !== paramUUID) {
    return responses.validationError(res, [{ field: 'uuid', message: 'El UUID en la URL no coincide con el UUID en el cuerpo de la petición' }]);
  }

  next();
};

/**
 * Validar formato de UUID
 */
const validateUUID = (field) => {
  return (req, res, next) => {
    const value = req.params[field] || req.body[field];
    if (value) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        return responses.validationError(res, [{ field, message: 'Formato de UUID inválido' }]);
      }
    }
    next();
  };
};

/**
 * Validar que al menos un campo sea proporcionado en actualizaciones
 */
const validateAtLeastOneField = (fields) => {
  return (req, res, next) => {
    const hasAtLeastOne = fields.some(field => req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '');

    if (!hasAtLeastOne) {
      return responses.validationError(res, [{
        field: 'body',
        message: `Al menos uno de los siguientes campos debe ser proporcionado: ${fields.join(', ')}`
      }]);
    }

    next();
  };
};

/**
 * Sanitizar strings para prevenir inyección
 */
const sanitizeStrings = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  sanitizeObject(req.body);
  next();
};

/**
 * Validar límites de tamaño de archivo (si se implementa subida de archivos)
 */
const validateFileSize = (maxSizeInMB = 5) => {
  return (req, res, next) => {
    if (req.file && req.file.size > maxSizeInMB * 1024 * 1024) {
      return responses.validationError(res, [{
        field: 'file',
        message: `El archivo no puede exceder ${maxSizeInMB}MB`
      }]);
    }
    next();
  };
};

/**
 * Validar tipos de archivo permitidos (si se implementa subida de archivos)
 */
const validateFileType = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  return (req, res, next) => {
    if (req.file && !allowedTypes.includes(req.file.mimetype)) {
      return responses.validationError(res, [{
        field: 'file',
        message: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
      }]);
    }
    next();
  };
};

module.exports = {
  handleValidationErrors,
  paginationValidation,
  dateRangeValidation,
  sanitizeSearchParams,
  validateUUIDMatch,
  validateUUID,
  validateAtLeastOneField,
  sanitizeStrings,
  validateFileSize,
  validateFileType
};