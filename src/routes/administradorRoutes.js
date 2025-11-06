const express = require('express');
const router = express.Router();

const administradorController = require('../controllers/administradorController');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
    createAdminValidation,
    updateAdminValidation,
    getAdminValidation,
    searchAdminValidation,
    changePasswordValidation
} = require('../validations/administradorValidation');

/**
 * @route   GET /api/administradores
 * @desc    Obtener todos los administradores activos
 * @access  Private (Admin)
 */
router.get('/',
    verifyToken,
    requireAdmin,
    administradorController.getAllAdmins
);

/**
 * @route   GET /api/administradores/all
 * @desc    Obtener todos los administradores (incluyendo inactivos)
 * @access  Private (Super Admin)
 */
router.get('/all',
    verifyToken,
    requireSuperAdmin,
    administradorController.getAllAdminsWithInactive
);

/**
 * @route   GET /api/administradores/search
 * @desc    Buscar administradores por nombre, email o usuario
 * @access  Private (Admin)
 */
router.get('/search',
    verifyToken,
    requireAdmin,
    searchAdminValidation,
    handleValidationErrors,
    administradorController.searchAdmins
);

/**
 * @route   GET /api/administradores/with-stats
 * @desc    Obtener administradores con estadísticas
 * @access  Private (Admin)
 */
router.get('/with-stats',
    verifyToken,
    requireAdmin,
    administradorController.getAdminsWithStats
);

/**
 * @route   POST /api/administradores
 * @desc    Crear un nuevo administrador
 * @access  Private (Super Admin)
 */
router.post('/',
    verifyToken,
    requireSuperAdmin,
    createAdminValidation,
    handleValidationErrors,
    administradorController.createAdmin
);

/**
 * @route   GET /api/administradores/:uk_administrador
 * @desc    Obtener administrador por UUID
 * @access  Private (Admin)
 */
router.get('/:uk_administrador',
    verifyToken,
    requireAdmin,
    getAdminValidation,
    handleValidationErrors,
    administradorController.getAdminById
);

/**
 * @route   GET /api/administradores/email/:s_email
 * @desc    Obtener administrador por email
 * @access  Private (Admin)
 */
router.get('/email/:s_email',
    verifyToken,
    requireAdmin,
    administradorController.getAdminByEmail
);

/**
 * @route   GET /api/administradores/usuario/:s_usuario
 * @desc    Obtener administrador por nombre de usuario
 * @access  Private (Admin)
 */
router.get('/usuario/:s_usuario',
    verifyToken,
    requireAdmin,
    administradorController.getAdminByUsuario
);

/**
 * @route   GET /api/administradores/:uk_administrador/estadisticas
 * @desc    Obtener estadísticas del administrador
 * @access  Private (Admin)
 */
router.get('/:uk_administrador/estadisticas',
    verifyToken,
    requireAdmin,
    getAdminValidation,
    handleValidationErrors,
    administradorController.getEstadisticas
);

/**
 * @route   PUT /api/administradores/:uk_administrador
 * @desc    Actualizar administrador
 * @access  Private (Super Admin)
 */
router.put('/:uk_administrador',
    verifyToken,
    requireSuperAdmin,
    updateAdminValidation,
    handleValidationErrors,
    administradorController.updateAdmin
);

/**
 * @route   PUT /api/administradores/:uk_administrador/change-password
 * @desc    Cambiar contraseña del administrador
 * @access  Private (Super Admin)
 */
router.put('/:uk_administrador/change-password',
    verifyToken,
    requireSuperAdmin,
    changePasswordValidation,
    handleValidationErrors,
    administradorController.changePassword
);

/**
 * @route   PUT /api/administradores/:uk_administrador/soft-delete
 * @desc    Desactivar administrador (soft delete)
 * @access  Private (Super Admin)
 */
router.put('/:uk_administrador/soft-delete',
    verifyToken,
    requireSuperAdmin,
    getAdminValidation,
    handleValidationErrors,
    administradorController.softDeleteAdmin
);

/**
 * @route   DELETE /api/administradores/:uk_administrador
 * @desc    Eliminar administrador (hard delete)
 * @access  Private (Super Admin)
 */
router.delete('/:uk_administrador',
    verifyToken,
    requireSuperAdmin,
    getAdminValidation,
    handleValidationErrors,
    administradorController.deleteAdmin
);

/** 
 * @route   GET /api/administradores/verify-email/:token
 * @desc    Verificar email del administrador con token
 * @access  Public
 */
// Endpoint público para consultar el estado del token (fallback)
router.get('/verify-status/:token',
    administradorController.verifyEmailStatus
);

router.get('/verify-email/:token',
    administradorController.verifyEmail
);

/**
 * @route   POST /api/administradores/:uk_administrador/resend-verification
 * @desc    Reenviar email de verificaci�n
 * @access  Private (Super Admin)
 */
router.post('/:uk_administrador/resend-verification',
    verifyToken,
    requireSuperAdmin,
    getAdminValidation,
    handleValidationErrors,
    administradorController.resendVerificationEmail
);

module.exports = router;
