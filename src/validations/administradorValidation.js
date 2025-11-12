const { body, param, query } = require('express-validator');
const helpers = require('../utils/helpers');

/**
 * Validaciones para crear un nuevo administrador
 */
const createAdminValidation = [
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

  body('s_email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),

  body('s_usuario')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  body('s_password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  body('c_telefono')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('tipo_usuario')
    .optional()
    .isInt({ min: 1, max: 1 })
    .withMessage('El tipo de usuario debe ser 1 (Administrador)')
];

/**
 * Validaciones para actualizar un administrador
 */
const updateAdminValidation = [
  param('uk_administrador')
    .isUUID()
    .withMessage('UUID de administrador inválido'),

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

  body('s_email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El email no puede estar vacío')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),

  body('s_usuario')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario no puede estar vacío')
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  body('s_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  body('c_telefono')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    }),

  body('tipo_usuario')
    .optional()
    .isInt({ min: 1, max: 1 })
    .withMessage('El tipo de usuario debe ser 1 (Administrador)')
];

/**
 * Validaciones para actualizar perfil del usuario autenticado
 */
const updateProfileValidation = [
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

  body('s_email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El email no puede estar vacío')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),

  body('s_usuario')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario no puede estar vacío')
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  body('c_telefono')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !helpers.isValidPhone(value)) {
        throw new Error('El formato del teléfono no es válido');
      }
      return true;
    })
];

/**
 * Validaciones para login de administrador por email
 */
const loginValidation = [
  body('s_email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),

  body('s_password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

/**
 * Validaciones para login de administrador por usuario
 */
const loginByUsuarioValidation = [
  body('s_usuario')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres'),

  body('s_password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

/**
 * Validación para obtener administrador por UUID
 */
const getAdminValidation = [
  param('uk_administrador')
    .isUUID()
    .withMessage('UUID de administrador inválido')
];

/**
 * Validaciones para buscar administradores
 */
const searchAdminValidation = [
  query('term')
    .trim()
    .notEmpty()
    .withMessage('El término de búsqueda es requerido')
    .isLength({ min: 2 })
    .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
];

/**
 * Validaciones para cambiar contraseña
 */
const changePasswordValidation = [
  body('s_password_actual')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),

  body('s_password_nuevo')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
    .custom((value, { req }) => {
      if (value === req.body.s_password_actual) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    })
];

module.exports = {
  createAdminValidation,
  updateAdminValidation,
  updateProfileValidation,
  loginValidation,
  loginByUsuarioValidation,
  getAdminValidation,
  searchAdminValidation,
  changePasswordValidation
};