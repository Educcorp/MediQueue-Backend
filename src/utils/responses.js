/**
 * Utilidades para respuestas estandarizadas de la API
 */

const responses = {
  // Respuesta exitosa
  success: (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // Respuesta de error
  error: (res, message = 'Error interno del servidor', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  },

  // Error de validación
  validationError: (res, errors, message = 'Error de validación') => {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  },

  // No encontrado
  notFound: (res, message = 'Recurso no encontrado') => {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  // No autorizado
  unauthorized: (res, message = 'No autorizado') => {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  // Prohibido
  forbidden: (res, message = 'Acceso prohibido') => {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  },

  // Creado exitosamente
  created: (res, data = null, message = 'Recurso creado exitosamente') => {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = responses;
