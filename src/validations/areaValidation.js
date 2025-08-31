const { body, param } = require('express-validator');

/**
 * Validaciones para crear una nueva área
 */
const createAreaValidation = [
  body('nombre_area')
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
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de área inválido'),

  body('nombre_area')
    .trim()
    .notEmpty()
    .withMessage('El nombre del área es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del área debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/)
    .withMessage('El nombre del área solo puede contener letras, espacios, guiones y paréntesis')
];

/**
 * Validación para obtener área por ID
 */
const getAreaValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de área inválido')
];

module.exports = {
  createAreaValidation,
  updateAreaValidation,
  getAreaValidation
};
