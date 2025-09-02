const express = require('express');
const router = express.Router();

const turnoController = require('../controllers/turnoController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
  createTurnoValidation,
  getTurnosValidation,
  getTurnoValidation,
  updateEstadoValidation,
  llamarSiguienteValidation,
  getTurnosByPacienteValidation,
  createTurnoWithPacienteValidation
} = require('../validations/turnoValidation');

/**
 * @route   POST /api/turnos
 * @desc    Crear un nuevo turno
 * @access  Private (Admin)
 */
router.post('/',
  verifyToken,
  createTurnoValidation,
  handleValidationErrors,
  turnoController.createTurno
);

/**
 * @route   POST /api/turnos/with-paciente
 * @desc    Crear turno con registro de paciente en una sola operación
 * @access  Private (Admin)
 */
router.post('/with-paciente',
  verifyToken,
  createTurnoWithPacienteValidation,
  handleValidationErrors,
  turnoController.createTurnoWithPaciente
);

/**
 * @route   POST /api/turnos/rapido
 * @desc    Generar turno rápido (para pantalla de usuario)
 * @access  Public
 */
router.post('/rapido',
  turnoController.generarTurnoRapido
);

/**
 * @route   GET /api/turnos
 * @desc    Obtener todos los turnos con filtros
 * @access  Private (Admin)
 */
router.get('/',
  verifyToken,
  getTurnosValidation,
  handleValidationErrors,
  turnoController.getTurnos
);

/**
 * @route   GET /api/turnos/publicos
 * @desc    Obtener turnos públicos (para pantalla de usuario)
 * @access  Public
 */
router.get('/publicos',
  turnoController.getTurnosPublicos
);

/**
 * @route   GET /api/turnos/estadisticas
 * @desc    Obtener estadísticas del día
 * @access  Private (Admin)
 */
router.get('/estadisticas',
  verifyToken,
  turnoController.getEstadisticasDelDia
);

/**
 * @route   GET /api/turnos/fecha/:fecha
 * @desc    Obtener turnos por fecha específica
 * @access  Private (Admin)
 */
router.get('/fecha/:fecha',
  verifyToken,
  (req, res, next) => {
    req.query.fecha = req.params.fecha;
    next();
  },
  getTurnosValidation,
  handleValidationErrors,
  turnoController.getTurnos
);

/**
 * @route   GET /api/turnos/estado/:estado
 * @desc    Obtener turnos por estado específico
 * @access  Private (Admin)
 */
router.get('/estado/:estado',
  verifyToken,
  (req, res, next) => {
    req.query.estado = req.params.estado;
    next();
  },
  getTurnosValidation,
  handleValidationErrors,
  turnoController.getTurnos
);

/**
 * @route   GET /api/turnos/:id
 * @desc    Obtener turno por ID
 * @access  Private (Admin)
 */
router.get('/:id',
  verifyToken,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.getTurnoById
);

/**
 * @route   GET /api/turnos/paciente/:id_paciente
 * @desc    Obtener turnos por paciente
 * @access  Private (Admin)
 */
router.get('/paciente/:id_paciente',
  verifyToken,
  getTurnosByPacienteValidation,
  handleValidationErrors,
  turnoController.getTurnosByPaciente
);

/**
 * @route   PUT /api/turnos/:id/estado
 * @desc    Actualizar estado de un turno
 * @access  Private (Admin)
 */
router.put('/:id/estado',
  verifyToken,
  updateEstadoValidation,
  handleValidationErrors,
  turnoController.updateEstadoTurno
);

/**
 * @route   PATCH /api/turnos/:id/estado
 * @desc    Actualizar estado de un turno (método alternativo)
 * @access  Private (Admin)
 */
router.patch('/:id/estado',
  verifyToken,
  updateEstadoValidation,
  handleValidationErrors,
  turnoController.updateEstadoTurno
);

/**
 * @route   POST /api/turnos/consultorio/:id_consultorio/siguiente
 * @desc    Llamar siguiente turno en un consultorio
 * @access  Private (Admin)
 */
router.post('/consultorio/:id_consultorio/siguiente',
  verifyToken,
  llamarSiguienteValidation,
  handleValidationErrors,
  turnoController.llamarSiguienteTurno
);

/**
 * @route   PUT /api/turnos/:id/cancelar
 * @desc    Cancelar turno
 * @access  Private (Admin)
 */
router.put('/:id/cancelar',
  verifyToken,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.cancelarTurno
);

/**
 * @route   PUT /api/turnos/:id/atender
 * @desc    Marcar turno como atendido
 * @access  Private (Admin)
 */
router.put('/:id/atender',
  verifyToken,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.marcarAtendido
);

/**
 * @route   DELETE /api/turnos/:id
 * @desc    Eliminar turno
 * @access  Private (Admin)
 */
router.delete('/:id',
  verifyToken,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.deleteTurno
);

module.exports = router;
