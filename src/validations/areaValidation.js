const { body, param, query } = require('express-validator');
const Area = require('../models/Area');

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
    .withMessage('El nombre del área solo puede contener letras, espacios, guiones y paréntesis'),

  body('s_letra')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 1, max: 2 })
    .withMessage('La letra debe tener máximo 2 caracteres')
    .matches(/^[A-Za-z]+$/)
    .withMessage('La letra solo puede contener caracteres alfabéticos')
    .custom(async (value) => {
      if (value && !(await Area.isLetraAvailable(value.toUpperCase()))) {
        throw new Error('Esta letra ya está en uso por otra área');
      }
      return true;
    }),

  body('s_color')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('El color debe ser un valor hexadecimal válido (ej: #FF5733)'),

  body('s_icono')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 50 })
    .withMessage('El icono debe tener entre 2 y 50 caracteres')
    .matches(/^[A-Za-z][A-Za-z0-9]*$/)
    .withMessage('El icono debe ser un nombre válido de FontAwesome')
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
    .withMessage('El nombre del área solo puede contener letras, espacios, guiones y paréntesis'),

  body('s_letra')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 1, max: 2 })
    .withMessage('La letra debe tener máximo 2 caracteres')
    .matches(/^[A-Za-z]+$/)
    .withMessage('La letra solo puede contener caracteres alfabéticos')
    .custom(async (value, { req }) => {
      if (value && !(await Area.isLetraAvailable(value.toUpperCase(), req.params.uk_area))) {
        throw new Error('Esta letra ya está en uso por otra área');
      }
      return true;
    }),

  body('s_color')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('El color debe ser un valor hexadecimal válido (ej: #FF5733)'),

  body('s_icono')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 50 })
    .withMessage('El icono debe tener entre 2 y 50 caracteres')
    .matches(/^[A-Za-z][A-Za-z0-9]*$/)
    .withMessage('El icono debe ser un nombre válido de FontAwesome')
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