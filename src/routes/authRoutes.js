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

module.exports = router;