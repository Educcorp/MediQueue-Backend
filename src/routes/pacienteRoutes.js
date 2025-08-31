const express = require('express');
const router = express.Router();

const pacienteController = require('../controllers/pacienteController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const { 
  createPacienteValidation, 
  updatePacienteValidation, 
  getPacienteValidation,
  searchPacienteValidation,
  getHistorialValidation
} = require('../validations/pacienteValidation');

/**
 * @route   POST /api/pacientes
 * @desc    Crear un nuevo paciente
 * @access  Private (Admin)
 */
router.post('/', 
  verifyToken,
  createPacienteValidation,
  handleValidationErrors,
  pacienteController.createPaciente
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
 * @desc    Obtener todos los pacientes
 * @access  Private (Admin)
 */
router.get('/', 
  verifyToken,
  pacienteController.getAllPacientes
);

/**
 * @route   GET /api/pacientes/search
 * @desc    Buscar pacientes por nombre, apellido o teléfono
 * @access  Private (Admin)
 */
router.get('/search', 
  verifyToken,
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
 * @route   GET /api/pacientes/:id
 * @desc    Obtener paciente por ID
 * @access  Private (Admin)
 */
router.get('/:id', 
  verifyToken,
  getPacienteValidation,
  handleValidationErrors,
  pacienteController.getPacienteById
);

/**
 * @route   GET /api/pacientes/telefono/:telefono
 * @desc    Obtener paciente por teléfono
 * @access  Private (Admin)
 */
router.get('/telefono/:telefono', 
  verifyToken,
  pacienteController.getPacienteByTelefono
);

/**
 * @route   GET /api/pacientes/:id/historial
 * @desc    Obtener historial de turnos del paciente
 * @access  Private (Admin)
 */
router.get('/:id/historial', 
  verifyToken,
  getHistorialValidation,
  handleValidationErrors,
  pacienteController.getHistorialTurnos
);

/**
 * @route   PUT /api/pacientes/:id
 * @desc    Actualizar paciente
 * @access  Private (Admin)
 */
router.put('/:id', 
  verifyToken,
  updatePacienteValidation,
  handleValidationErrors,
  pacienteController.updatePaciente
);

/**
 * @route   DELETE /api/pacientes/:id
 * @desc    Eliminar paciente
 * @access  Private (Admin)
 */
router.delete('/:id', 
  verifyToken,
  getPacienteValidation,
  handleValidationErrors,
  pacienteController.deletePaciente
);

module.exports = router;
