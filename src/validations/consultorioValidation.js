const { body, param, query } = require('express-validator');

/**
 * Validaciones para crear un nuevo consultorio
 */
const createConsultorioValidation = [
  body('i_numero_consultorio')
    .notEmpty()
    .withMessage('El número del consultorio es requerido')
    .isInt({ min: 1, max: 999 })
    .withMessage('El número del consultorio debe ser un entero entre 1 y 999'),

  body('uk_area')
    .notEmpty()
    .withMessage('El UUID del área es requerido')
    .isUUID()
    .withMessage('UUID de área inválido')
];

/**
 * Validaciones para actualizar un consultorio
 */
const updateConsultorioValidation = [
  param('uk_consultorio')
    .isUUID()
    .withMessage('UUID de consultorio inválido'),

  body('i_numero_consultorio')
    .optional()
    .notEmpty()
    .withMessage('El número del consultorio no puede estar vacío')
    .isInt({ min: 1, max: 999 })
    .withMessage('El número del consultorio debe ser un entero entre 1 y 999'),

  body('uk_area')
    .optional()
    .notEmpty()
    .withMessage('El UUID del área no puede estar vacío')
    .isUUID()
    .withMessage('UUID de área inválido')
];

/**
 * Validación para obtener consultorio por UUID
 */
const getConsultorioValidation = [
  param('uk_consultorio')
    .isUUID()
    .withMessage('UUID de consultorio inválido')
];

/**
 * Validación para obtener consultorios por área
 */
const getConsultoriosByAreaValidation = [
  param('uk_area')
    .isUUID()
    .withMessage('UUID de área inválido')
];

/**
 * Validación para llamar siguiente turno en consultorio
 */
const llamarSiguienteConsultorioValidation = [
  param('uk_consultorio')
    .isUUID()
    .withMessage('UUID de consultorio inválido')
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
  createConsultorioValidation,
  updateConsultorioValidation,
  getConsultorioValidation,
  getConsultoriosByAreaValidation,
  llamarSiguienteConsultorioValidation,
  getEstadisticasPorFechaValidation
};