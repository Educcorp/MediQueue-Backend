const { body, param, query } = require('express-validator');
const helpers = require('../utils/helpers');

/**
 * Validaciones para crear un nuevo turno
 */
const createTurnoValidation = [
  body('id_consultorio')
    .notEmpty()
    .withMessage('El ID del consultorio es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de consultorio inválido'),

  body('id_paciente')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de paciente inválido'),

  // Validación de datos del paciente invitado si no se proporciona id_paciente
  body('paciente_nombre')
    .if(body('id_paciente').not().exists())
    .trim()
    .notEmpty()
    .withMessage('El nombre del paciente es requerido para pacientes invitados')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('paciente_apellido')
    .if(body('id_paciente').not().exists())
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
];

/**
 * Validaciones para obtener turnos con filtros
 */
const getTurnosValidation = [
  query('fecha')
    .optional()
    .isDate()
    .withMessage('La fecha debe ser válida (YYYY-MM-DD)'),

  query('estado')
    .optional()
    .custom((value) => {
      if (!helpers.isValidTurnoEstado(value)) {
        throw new Error('Estado de turno inválido');
      }
      return true;
    }),

  query('id_area')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de área inválido')
];

/**
 * Validación para obtener turno por ID
 */
const getTurnoValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de turno inválido')
];

/**
 * Validaciones para actualizar estado del turno
 */
const updateEstadoValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de turno inválido'),

  body('estado')
    .trim()
    .notEmpty()
    .withMessage('El estado es requerido')
    .custom((value) => {
      if (!helpers.isValidTurnoEstado(value)) {
        throw new Error('Estado de turno inválido');
      }
      return true;
    })
];

/**
 * Validación para llamar siguiente turno
 */
const llamarSiguienteValidation = [
  param('id_consultorio')
    .isInt({ min: 1 })
    .withMessage('ID de consultorio inválido')
];

/**
 * Validaciones para obtener turnos por paciente
 */
const getTurnosByPacienteValidation = [
  param('id_paciente')
    .isInt({ min: 1 })
    .withMessage('ID de paciente inválido')
];

/**
 * Validación para registrar paciente y crear turno en una sola operación
 */
const createTurnoWithPacienteValidation = [
  body('id_consultorio')
    .notEmpty()
    .withMessage('El ID del consultorio es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de consultorio inválido'),

  body('paciente')
    .notEmpty()
    .withMessage('Los datos del paciente son requeridos'),

  body('paciente.nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('paciente.apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('paciente.telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .custom((value) => {
      if (!helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('paciente.fecha_nacimiento')
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

  body('registrar_completo')
    .optional()
    .isBoolean()
    .withMessage('registrar_completo debe ser un booleano')
];

module.exports = {
  createTurnoValidation,
  getTurnosValidation,
  getTurnoValidation,
  updateEstadoValidation,
  llamarSiguienteValidation,
  getTurnosByPacienteValidation,
  createTurnoWithPacienteValidation
};
