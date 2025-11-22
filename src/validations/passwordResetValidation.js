const { body, query } = require('express-validator');

/**
 * Validaciones para solicitar recuperación de contraseña
 */
const requestPasswordResetValidation = [
  body('s_email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es requerido')
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El correo electrónico no puede exceder 100 caracteres')
];

/**
 * Validaciones para verificar token de reseteo
 */
const verifyResetTokenValidation = [
  query('token')
    .notEmpty()
    .withMessage('El token es requerido')
    .isLength({ min: 64, max: 64 })
    .withMessage('El token debe tener 64 caracteres')
    .matches(/^[a-f0-9]{64}$/)
    .withMessage('El token tiene un formato inválido')
];

/**
 * Validaciones para resetear contraseña
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('El token es requerido')
    .isLength({ min: 64, max: 64 })
    .withMessage('El token debe tener 64 caracteres')
    .matches(/^[a-f0-9]{64}$/)
    .withMessage('El token tiene un formato inválido'),

  body('s_password_nuevo')
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número')
];

module.exports = {
  requestPasswordResetValidation,
  verifyResetTokenValidation,
  resetPasswordValidation
};

