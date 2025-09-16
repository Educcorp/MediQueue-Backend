const { body, param, query } = require('express-validator');

/**
 * Validaciones para crear una nueva área
 */
const createAreaValidation = [
  body('s_nombre_area')
    .trim()
    .notEmpty()
    .withMessage('El nombre del área es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del área debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/)
    .withMessage('El nombre del área solo puede contener letras, espacios, guiones y paréntesis')
];

/**
 * Validaciones para actualizar un área
 */
const updateAreaValidation = [
  param('uk_area')
    .isUUID()
    .withMessage('UUID de área inválido'),

  body('s_nombre_area')
    .trim()
    .notEmpty()
    .withMessage('El nombre del área es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del área debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/)
    .withMessage('El nombre del área solo puede contener letras, espacios, guiones y paréntesis')
];

/**
 * Validación para obtener área por UUID
 */
const getAreaValidation = [
  param('uk_area')
    .isUUID()
    .withMessage('UUID de área inválido')
];

/**
 * Validación para búsqueda de áreas
 */
const searchAreaValidation = [
  query('term')
    .trim()
    .notEmpty()
    .withMessage('El término de búsqueda es requerido')
    .isLength({ min: 2 })
    .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
];

/**
 * Validaciones para obtener estadísticas por fecha
 */
const getEstadisticasPorFechaValidation = [
  query('fecha_inicio')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isDate()
    .withMessage('La fecha de inicio debe ser válida (YYYY-MM-DD)'),

  query('fecha_fin')
    .notEmpty()
    .withMessage('La fecha de fin es requerida')
    .isDate()
    .withMessage('La fecha de fin debe ser válida (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const fechaInicio = new Date(req.query.fecha_inicio);
      const fechaFin = new Date(value);

      if (fechaFin < fechaInicio) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
      }

      return true;
    })
];

module.exports = {
  createAreaValidation,
  updateAreaValidation,
  getAreaValidation,
  searchAreaValidation,
  getEstadisticasPorFechaValidation
};