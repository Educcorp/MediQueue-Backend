const { body, param, query } = require('express-validator');
const helpers = require('../utils/helpers');

/**
 * Validaciones para crear un nuevo paciente
 */
const createPacienteValidation = [
  body('s_nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('s_apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('c_telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .custom((value) => {
      if (!helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('d_fecha_nacimiento')
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

  body('s_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),

  body('s_email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres')
];

/**
 * Validaciones para actualizar un paciente
 */
const updatePacienteValidation = [
  param('uk_paciente')
    .isUUID()
    .withMessage('UUID de paciente inválido'),

  body('s_nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('s_apellido')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El apellido no puede estar vacío')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('c_telefono')
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

  body('d_fecha_nacimiento')
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

  body('s_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),

  body('s_email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres')
];

/**
 * Validación para obtener paciente por UUID
 */
const getPacienteValidation = [
  param('uk_paciente')
    .isUUID()
    .withMessage('UUID de paciente inválido')
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
  param('uk_paciente')
    .isUUID()
    .withMessage('UUID de paciente inválido')
];

/**
 * Validaciones para cambiar contraseña de paciente
 */
const changePasswordValidation = [
  param('uk_paciente')
    .isUUID()
    .withMessage('UUID de paciente inválido'),

  body('s_password_actual')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),

  body('s_password_nuevo')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .custom((value, { req }) => {
      if (value === req.body.s_password_actual) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    })
];

/**
 * Validaciones para crear o buscar paciente (turnos públicos)
 */
const createOrFindPacienteValidation = [
  body('c_telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .custom((value) => {
      if (!helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('s_nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('s_apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('d_fecha_nacimiento')
    .optional()
    .isDate()
    .withMessage('La fecha de nacimiento debe ser una fecha válida'),

  body('s_email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres')
];

module.exports = {
  createPacienteValidation,
  updatePacienteValidation,
  getPacienteValidation,
  searchPacienteValidation,
  getHistorialValidation,
  changePasswordValidation,
  createOrFindPacienteValidation
};