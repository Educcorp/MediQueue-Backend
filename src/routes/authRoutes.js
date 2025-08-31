const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const { loginValidation, createAdminValidation, updateAdminValidation } = require('../validations/administradorValidation');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de administrador
 * @access  Public
 */
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  authController.login
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
  updateAdminValidation.filter(validation => validation.param !== 'id'), // Remover validación de ID
  handleValidationErrors,
  authController.updateProfile
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
