const { body, param, query } = require('express-validator');
const helpers = require('../utils/helpers');

/**
 * Validaciones para crear un nuevo turno
 */
const createTurnoValidation = [
  body('uk_consultorio')
    .notEmpty()
    .withMessage('El UUID del consultorio es requerido')
    .isUUID()
    .withMessage('UUID de consultorio inválido'),

  body('uk_paciente')
    .optional()
    .isUUID()
    .withMessage('UUID de paciente inválido')
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

  query('uk_area')
    .optional()
    .isUUID()
    .withMessage('UUID de área inválido'),

  query('uk_consultorio')
    .optional()
    .isUUID()
    .withMessage('UUID de consultorio inválido')
];

/**
 * Validación para obtener turno por UUID
 */
const getTurnoValidation = [
  param('uk_turno')
    .isUUID()
    .withMessage('UUID de turno inválido')
];

/**
 * Validaciones para actualizar estado del turno
 */
const updateEstadoValidation = [
  param('uk_turno')
    .isUUID()
    .withMessage('UUID de turno inválido'),

  body('s_estado')
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
  param('uk_consultorio')
    .isUUID()
    .withMessage('UUID de consultorio inválido')
];

/**
 * Validaciones para obtener turnos por paciente
 */
const getTurnosByPacienteValidation = [
  param('uk_paciente')
    .isUUID()
    .withMessage('UUID de paciente inválido')
];

/**
 * Validación para registrar paciente y crear turno en una sola operación
 */
const createTurnoWithPacienteValidation = [
  body('uk_consultorio')
    .notEmpty()
    .withMessage('El UUID del consultorio es requerido')
    .isUUID()
    .withMessage('UUID de consultorio inválido'),

  body('paciente')
    .notEmpty()
    .withMessage('Los datos del paciente son requeridos'),

  body('paciente.s_nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('paciente.s_apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('paciente.c_telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .custom((value) => {
      if (!helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('paciente.d_fecha_nacimiento')
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

  body('paciente.s_email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido'),

  body('registrar_completo')
    .optional()
    .isBoolean()
    .withMessage('registrar_completo debe ser un booleano')
];

/**
 * Validaciones para crear turno público
 */
const createTurnoPublicoValidation = [
  body('uk_consultorio')
    .notEmpty()
    .withMessage('El UUID del consultorio es requerido')
    .isUUID()
    .withMessage('UUID de consultorio inválido'),

  body('paciente')
    .optional()
    .isObject()
    .withMessage('Los datos del paciente deben ser un objeto'),

  body('paciente.s_nombre')
    .if(body('paciente').exists())
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('paciente.s_apellido')
    .if(body('paciente').exists())
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('paciente.c_telefono')
    .if(body('paciente').exists())
    .optional()
    .trim()
    .custom((value) => {
      if (value && !helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('paciente.d_fecha_nacimiento')
    .if(body('paciente').exists())
    .optional()
    .isDate()
    .withMessage('La fecha de nacimiento debe ser una fecha válida'),

  body('paciente.s_email')
    .if(body('paciente').exists())
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido')
];

/**
 * Validaciones para actualizar observaciones
 */
const updateObservacionesValidation = [
  param('uk_turno')
    .isUUID()
    .withMessage('UUID de turno inválido'),

  body('s_observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las observaciones no pueden exceder 500 caracteres')
];

/**
 * Validaciones para obtener turnos por rango de fechas
 */
const getTurnosByDateRangeValidation = [
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
    }),

  query('estado')
    .optional()
    .custom((value) => {
      if (!helpers.isValidTurnoEstado(value)) {
        throw new Error('Estado de turno inválido');
      }
      return true;
    }),

  query('uk_area')
    .optional()
    .isUUID()
    .withMessage('UUID de área inválido'),

  query('uk_consultorio')
    .optional()
    .isUUID()
    .withMessage('UUID de consultorio inválido')
];

module.exports = {
  createTurnoValidation,
  getTurnosValidation,
  getTurnoValidation,
  updateEstadoValidation,
  llamarSiguienteValidation,
  getTurnosByPacienteValidation,
  createTurnoWithPacienteValidation,
  createTurnoPublicoValidation,
  updateObservacionesValidation,
  getTurnosByDateRangeValidation
};