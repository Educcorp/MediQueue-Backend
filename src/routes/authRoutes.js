const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
  loginValidation,
  loginByUsuarioValidation,
  createAdminValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../validations/administradorValidation');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de administrador por email
 * @access  Public
 */
router.post('/login',
  loginValidation,
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/auth/login-usuario
 * @desc    Iniciar sesión de administrador por nombre de usuario
 * @access  Public
 */
router.post('/login-usuario',
  loginByUsuarioValidation,
  handleValidationErrors,
  authController.loginByUsuario
);

/**
 * @route   POST /api/auth/first-admin
 * @desc    Crear primer administrador (solo si no existe ninguno)
 * @access  Public
 */
router.post('/first-admin',
  createAdminValidation,
  handleValidationErrors,
  authController.createFirstAdmin
);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile',
  verifyToken,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put('/profile',
  verifyToken,
  updateProfileValidation,
  handleValidationErrors,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.put('/change-password',
  verifyToken,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

/**
 * @route   GET /api/auth/estadisticas
 * @desc    Obtener estadísticas del administrador autenticado
 * @access  Private
 */
router.get('/estadisticas',
  verifyToken,
  authController.getEstadisticas
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout',
  verifyToken,
  authController.logout
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar token
 * @access  Private
 */
router.get('/verify',
  verifyToken,
  authController.verifyToken
);

/**
 * @route   POST /api/auth/verify-email-exists
 * @desc    Verificar si un correo existe y está verificado
 * @access  Public
 */
router.post('/verify-email-exists',
  authController.verifyEmailExists
);

/**
 * @route   POST /api/auth/confirm-identity
 * @desc    Confirmar identidad y otorgar acceso
 * @access  Public
 */
router.post('/confirm-identity',
  authController.confirmIdentity
);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Solicitar recuperación de contraseña (envía email)
 * @access  Public
 */
router.post('/request-password-reset',
  authController.requestPasswordReset
);

/**
 * @route   GET /api/auth/verify-reset-token
 * @desc    Verificar token de reseteo de contraseña
 * @access  Public
 */
router.get('/verify-reset-token',
  authController.verifyResetToken
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetear contraseña con token
 * @access  Public
 */
router.post('/reset-password',
  authController.resetPassword
);

module.exports = router;