const responses = require('../utils/responses');

/**
 * Middleware global para manejo de errores
 */
const errorHandler = (error, req, res, next) => {
  console.error('Error capturado:', error);

  // Error de validación de base de datos
  if (error.code === 'ER_DUP_ENTRY') {
    return responses.error(res, 'Ya existe un registro con esos datos', 409);
  }

  // Error de constraint de foreign key
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return responses.error(res, 'Referencia inválida a otro registro', 400);
  }

  // Error de conexión a base de datos
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
    return responses.error(res, 'Error de conexión a la base de datos', 503);
  }

  // Error de validación personalizado
  if (error.type === 'validation') {
    return responses.validationError(res, error.errors, error.message);
  }

  // Error de negocio personalizado
  if (error.type === 'business') {
    return responses.error(res, error.message, 400);
  }

  // Error de recurso no encontrado
  if (error.type === 'not_found') {
    return responses.notFound(res, error.message);
  }

  // Error de sintaxis JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return responses.error(res, 'JSON inválido en el cuerpo de la petición', 400);
  }

  // Error de límite de tamaño de payload
  if (error.type === 'entity.too.large') {
    return responses.error(res, 'El archivo o datos enviados son demasiado grandes', 413);
  }

  // Error por defecto
  return responses.error(res, 'Error interno del servidor', 500);
};

/**
 * Middleware para capturar rutas no encontradas
 */
const notFoundHandler = (req, res) => {
  return responses.notFound(res, `Ruta ${req.method} ${req.originalUrl} no encontrada`);
};

/**
 * Wrapper para funciones async que automáticamente captura errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar que el cuerpo de la petición no esté vacío
 */
const requireBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return responses.error(res, 'El cuerpo de la petición no puede estar vacío', 400);
  }
  next();
};

/**
 * Middleware para logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    if (req.user) {
      log.user = req.user.id_administrador;
    }
    
    console.log('Request:', JSON.stringify(log));
  });
  
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requireBody,
  requestLogger
};
