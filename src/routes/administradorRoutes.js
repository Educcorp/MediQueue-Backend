const express = require('express');
const router = express.Router();

const administradorController = require('../controllers/administradorController');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
    createAdminValidation,
    updateAdminValidation,
    getAdminValidation
} = require('../validations/administradorValidation');

/**
 * @route   GET /api/administradores
 * @desc    Obtener todos los administradores
 * @access  Private (Admin)
 */
router.get('/',
    verifyToken,
    administradorController.getAllAdmins
);

/**
 * @route   POST /api/administradores
 * @desc    Crear un nuevo administrador
 * @access  Private (Admin)
 */
router.post('/',
    verifyToken,
    createAdminValidation,
    handleValidationErrors,
    administradorController.createAdmin
);

/**
 * @route   GET /api/administradores/:id
 * @desc    Obtener administrador por ID
 * @access  Private (Admin)
 */
router.get('/:id',
    verifyToken,
    getAdminValidation,
    handleValidationErrors,
    administradorController.getAdminById
);

/**
 * @route   PUT /api/administradores/:id
 * @desc    Actualizar administrador
 * @access  Private (Admin)
 */
router.put('/:id',
    verifyToken,
    updateAdminValidation,
    handleValidationErrors,
    administradorController.updateAdmin
);

/**
 * @route   DELETE /api/administradores/:id
 * @desc    Eliminar administrador
 * @access  Private (Admin)
 */
router.delete('/:id',
    verifyToken,
    getAdminValidation,
    handleValidationErrors,
    administradorController.deleteAdmin
);

module.exports = router;
