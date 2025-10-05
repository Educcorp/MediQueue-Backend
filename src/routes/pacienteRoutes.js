const express = require('express');
const router = express.Router();

const pacienteController = require('../controllers/pacienteController');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
  createPacienteValidation,
  updatePacienteValidation,
  getPacienteValidation,
  searchPacienteValidation,
  getHistorialValidation,
  changePasswordValidation,
  createOrFindPacienteValidation
} = require('../validations/pacienteValidation');

/**
 * @route   POST /api/pacientes
 * @desc    Crear un nuevo paciente
 * @access  Private (Admin)
 */
router.post('/',
  verifyToken,
  requireAdmin,
  createPacienteValidation,
  handleValidationErrors,
  pacienteController.createPaciente
);

/**
 * @route   POST /api/pacientes/create-or-find
 * @desc    Crear o buscar paciente por teléfono (para turnos públicos)
 * @access  Public
 */
router.post('/create-or-find',
  createOrFindPacienteValidation,
  handleValidationErrors,
  pacienteController.createOrFindPaciente
);

/**
 * @route   POST /api/pacientes/login
 * @desc    Login de paciente
 * @access  Public
 */
router.post('/login',
  pacienteController.loginPaciente
);

/**
 * @route   GET /api/pacientes
 * @desc    Obtener todos los pacientes activos
 * @access  Private (Admin)
 */
router.get('/',
  verifyToken,
  requireAdmin,
  pacienteController.getAllPacientes
);

/**
 * @route   GET /api/pacientes/all
 * @desc    Obtener todos los pacientes (incluyendo inactivos)
 * @access  Private (Admin)
 */
router.get('/all',
  verifyToken,
  requireAdmin,
  pacienteController.getAllPacientes
);

/**
 * @route   GET /api/pacientes/search
 * @desc    Buscar pacientes por nombre, apellido, teléfono o email
 * @access  Private (Admin)
 */
router.get('/search',
  verifyToken,
  requireAdmin,
  searchPacienteValidation,
  handleValidationErrors,
  pacienteController.searchPacientes
);

/**
 * @route   GET /api/pacientes/publico
 * @desc    Obtener información del paciente para consulta pública
 * @access  Public
 */
router.get('/publico',
  pacienteController.getPacientePublico
);

/**
 * @route   GET /api/pacientes/:uk_paciente
 * @desc    Obtener paciente por UUID
 * @access  Private (Admin)
 */
router.get('/:uk_paciente',
  verifyToken,
  requireAdmin,
  getPacienteValidation,
  handleValidationErrors,
  pacienteController.getPacienteById
);

/**
 * @route   GET /api/pacientes/telefono/:c_telefono
 * @desc    Obtener paciente por teléfono
 * @access  Private (Admin)
 */
router.get('/telefono/:c_telefono',
  verifyToken,
  requireAdmin,
  pacienteController.getPacienteByTelefono
);

/**
 * @route   GET /api/pacientes/email/:s_email
 * @desc    Obtener paciente por email
 * @access  Private (Admin)
 */
router.get('/email/:s_email',
  verifyToken,
  requireAdmin,
  pacienteController.getPacienteByEmail
);

/**
 * @route   GET /api/pacientes/:uk_paciente/historial
 * @desc    Obtener historial de turnos del paciente
 * @access  Private (Admin)
 */
router.get('/:uk_paciente/historial',
  verifyToken,
  requireAdmin,
  getHistorialValidation,
  handleValidationErrors,
  pacienteController.getHistorialTurnos
);

/**
 * @route   GET /api/pacientes/:uk_paciente/estadisticas
 * @desc    Obtener estadísticas del paciente
 * @access  Private (Admin)
 */
router.get('/:uk_paciente/estadisticas',
  verifyToken,
  requireAdmin,
  getPacienteValidation,
  handleValidationErrors,
  pacienteController.getEstadisticas
);

/**
 * @route   PUT /api/pacientes/:uk_paciente
 * @desc    Actualizar paciente
 * @access  Private (Admin)
 */
router.put('/:uk_paciente',
  verifyToken,
  requireAdmin,
  updatePacienteValidation,
  handleValidationErrors,
  pacienteController.updatePaciente
);

/**
 * @route   PUT /api/pacientes/:uk_paciente/change-password
 * @desc    Cambiar contraseña del paciente
 * @access  Private (Admin)
 */
router.put('/:uk_paciente/change-password',
  verifyToken,
  requireAdmin,
  changePasswordValidation,
  handleValidationErrors,
  pacienteController.changePassword
);

/**
 * @route   PUT /api/pacientes/:uk_paciente/soft-delete
 * @desc    Desactivar paciente (soft delete)
 * @access  Private (Admin)
 */
router.put('/:uk_paciente/soft-delete',
  verifyToken,
  requireAdmin,
  getPacienteValidation,
  handleValidationErrors,
  pacienteController.softDeletePaciente
);

/**
 * @route   DELETE /api/pacientes/:uk_paciente
 * @desc    Eliminar paciente (hard delete)
 * @access  Private (Admin)
 */
router.delete('/:uk_paciente',
  verifyToken,
  requireAdmin,
  getPacienteValidation,
  handleValidationErrors,
  pacienteController.deletePaciente
);

module.exports = router;