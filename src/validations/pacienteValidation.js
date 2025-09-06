const { body, param, query } = require('express-validator');
const helpers = require('../utils/helpers');

/**
 * Validaciones para crear un nuevo paciente
 */
const createPacienteValidation = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .custom((value) => {
      if (!helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('fecha_nacimiento')
    .notEmpty()
    .withMessage('La fecha de nacimiento es requerida')
    .isDate()
    .withMessage('La fecha de nacimiento debe ser una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      
      if (fecha > hoy) {
        throw new Error('La fecha de nacimiento no puede ser futura');
      }
      
      if (edad > 120) {
        throw new Error('La edad no puede ser mayor a 120 años');
      }
      
      return true;
    }),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

/**
 * Validaciones para actualizar un paciente
 */
const updatePacienteValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de paciente inválido'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('apellido')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El apellido no puede estar vacío')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('telefono')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El teléfono no puede estar vacío')
    .custom((value) => {
      if (!helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('fecha_nacimiento')
    .optional()
    .isDate()
    .withMessage('La fecha de nacimiento debe ser una fecha válida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      
      if (fecha > hoy) {
        throw new Error('La fecha de nacimiento no puede ser futura');
      }
      
      if (edad > 120) {
        throw new Error('La edad no puede ser mayor a 120 años');
      }
      
      return true;
    }),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

/**
 * Validación para obtener paciente por ID
 */
const getPacienteValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de paciente inválido')
];

/**
 * Validación para búsqueda de pacientes
 */
const searchPacienteValidation = [
  query('term')
    .trim()
    .notEmpty()
    .withMessage('El término de búsqueda es requerido')
    .isLength({ min: 2 })
    .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
];

/**
 * Validación para obtener historial de turnos
 */
const getHistorialValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de paciente inválido')
];

module.exports = {
  createPacienteValidation,
  updatePacienteValidation,
  getPacienteValidation,
  searchPacienteValidation,
  getHistorialValidation
};
