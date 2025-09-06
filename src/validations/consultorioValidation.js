const { body, param, query } = require('express-validator');

/**
 * Validaciones para crear un nuevo consultorio
 */
const createConsultorioValidation = [
  body('numero_consultorio')
    .notEmpty()
    .withMessage('El número del consultorio es requerido')
    .isInt({ min: 1, max: 999 })
    .withMessage('El número del consultorio debe ser un entero entre 1 y 999'),

  body('id_area')
    .notEmpty()
    .withMessage('El ID del área es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de área inválido')
];

/**
 * Validaciones para actualizar un consultorio
 */
const updateConsultorioValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de consultorio inválido'),

  body('numero_consultorio')
    .optional()
    .notEmpty()
    .withMessage('El número del consultorio no puede estar vacío')
    .isInt({ min: 1, max: 999 })
    .withMessage('El número del consultorio debe ser un entero entre 1 y 999'),

  body('id_area')
    .optional()
    .notEmpty()
    .withMessage('El ID del área no puede estar vacío')
    .isInt({ min: 1 })
    .withMessage('ID de área inválido')
];

/**
 * Validación para obtener consultorio por ID
 */
const getConsultorioValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de consultorio inválido')
];

/**
 * Validación para obtener consultorios por área
 */
const getConsultoriosByAreaValidation = [
  param('id_area')
    .isInt({ min: 1 })
    .withMessage('ID de área inválido')
];

/**
 * Validación para llamar siguiente turno en consultorio
 */
const llamarSiguienteConsultorioValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de consultorio inválido')
];

module.exports = {
  createConsultorioValidation,
  updateConsultorioValidation,
  getConsultorioValidation,
  getConsultoriosByAreaValidation,
  llamarSiguienteConsultorioValidation
};
