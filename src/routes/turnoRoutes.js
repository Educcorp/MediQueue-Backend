const express = require('express');
const router = express.Router();

const turnoController = require('../controllers/turnoController');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
  createTurnoValidation,
  getTurnosValidation,
  getTurnoValidation,
  updateEstadoValidation,
  llamarSiguienteValidation,
  getTurnosByPacienteValidation,
  createTurnoWithPacienteValidation,
  updateObservacionesValidation,
  getTurnosByDateRangeValidation
} = require('../validations/turnoValidation');

/**
 * @route   POST /api/turnos
 * @desc    Crear un nuevo turno
 * @access  Private (Admin)
 */
router.post('/',
  verifyToken,
  requireAdmin,
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
  requireAdmin,
  createTurnoWithPacienteValidation,
  handleValidationErrors,
  turnoController.createTurnoWithPaciente
);

/**
 * @route   POST /api/turnos/publico
 * @desc    Crear turno con paciente (para usuarios públicos)
 * @access  Public
 */
router.post('/publico',
  turnoController.createTurnoPublico
);

/**
 * @route   POST /api/turnos/publico/auto
 * @desc    Crear turno con asignación automática de consultorio (para usuarios públicos)
 * @access  Public
 */
router.post('/publico/auto',
  turnoController.createTurnoPublicoAuto
);

/**
 * @route   GET /api/turnos
 * @desc    Obtener todos los turnos con filtros
 * @access  Private (Admin)
 */
router.get('/',
  verifyToken,
  requireAdmin,
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
 * @route   GET /api/turnos/proximo
 * @desc    Obtener próximo turno (pantalla pública)
 * @access  Public
 */
router.get('/proximo',
  turnoController.getProximoTurnoPublico
);

/**
 * @route   GET /api/turnos/ultimos
 * @desc    Obtener últimos turnos (pantalla pública)
 * @access  Public
 */
router.get('/ultimos',
  turnoController.getUltimosTurnosPublicos
);

/**
 * @route   GET /api/turnos/estadisticas
 * @desc    Obtener estadísticas del día
 * @access  Private (Admin)
 */
router.get('/estadisticas',
  verifyToken,
  requireAdmin,
  turnoController.getEstadisticasDelDia
);

/**
 * @route   GET /api/turnos/rango-fechas
 * @desc    Obtener turnos por rango de fechas
 * @access  Private (Admin)
 */
router.get('/rango-fechas',
  verifyToken,
  requireAdmin,
  getTurnosByDateRangeValidation,
  handleValidationErrors,
  turnoController.getTurnosByDateRange
);

/**
 * @route   GET /api/turnos/fecha/:fecha
 * @desc    Obtener turnos por fecha específica
 * @access  Private (Admin)
 */
router.get('/fecha/:fecha',
  verifyToken,
  requireAdmin,
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
  requireAdmin,
  (req, res, next) => {
    req.query.estado = req.params.estado;
    next();
  },
  getTurnosValidation,
  handleValidationErrors,
  turnoController.getTurnos
);

/**
 * @route   GET /api/turnos/:uk_turno
 * @desc    Obtener turno por UUID
 * @access  Private (Admin)
 */
router.get('/:uk_turno',
  verifyToken,
  requireAdmin,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.getTurnoById
);

/**
 * @route   GET /api/turnos/paciente/:uk_paciente
 * @desc    Obtener turnos por paciente
 * @access  Private (Admin)
 */
router.get('/paciente/:uk_paciente',
  verifyToken,
  requireAdmin,
  getTurnosByPacienteValidation,
  handleValidationErrors,
  turnoController.getTurnosByPaciente
);

/**
 * @route   PUT /api/turnos/:uk_turno/estado
 * @desc    Actualizar estado de un turno
 * @access  Private (Admin)
 */
router.put('/:uk_turno/estado',
  verifyToken,
  requireAdmin,
  updateEstadoValidation,
  handleValidationErrors,
  turnoController.updateEstadoTurno
);

/**
 * @route   PATCH /api/turnos/:uk_turno/estado
 * @desc    Actualizar estado de un turno (método alternativo)
 * @access  Private (Admin)
 */
router.patch('/:uk_turno/estado',
  verifyToken,
  requireAdmin,
  updateEstadoValidation,
  handleValidationErrors,
  turnoController.updateEstadoTurno
);

/**
 * @route   PUT /api/turnos/:uk_turno/observaciones
 * @desc    Actualizar observaciones de un turno
 * @access  Private (Admin)
 */
router.put('/:uk_turno/observaciones',
  verifyToken,
  requireAdmin,
  updateObservacionesValidation,
  handleValidationErrors,
  turnoController.updateObservaciones
);

/**
 * @route   POST /api/turnos/consultorio/:uk_consultorio/siguiente
 * @desc    Llamar siguiente turno en un consultorio
 * @access  Private (Admin)
 */
router.post('/consultorio/:uk_consultorio/siguiente',
  verifyToken,
  requireAdmin,
  llamarSiguienteValidation,
  handleValidationErrors,
  turnoController.llamarSiguienteTurno
);

/**
 * @route   PUT /api/turnos/:uk_turno/cancelar
 * @desc    Cancelar turno
 * @access  Private (Admin)
 */
router.put('/:uk_turno/cancelar',
  verifyToken,
  requireAdmin,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.cancelarTurno
);

/**
 * @route   PUT /api/turnos/:uk_turno/atender
 * @desc    Marcar turno como atendido
 * @access  Private (Admin)
 */
router.put('/:uk_turno/atender',
  verifyToken,
  requireAdmin,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.marcarAtendido
);

/**
 * @route   PUT /api/turnos/:uk_turno/no-presente
 * @desc    Marcar turno como no presente
 * @access  Private (Admin)
 */
router.put('/:uk_turno/no-presente',
  verifyToken,
  requireAdmin,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.marcarNoPresente
);

/**
 * @route   DELETE /api/turnos/:uk_turno
 * @desc    Eliminar turno
 * @access  Private (Admin)
 */
router.delete('/:uk_turno',
  verifyToken,
  requireAdmin,
  getTurnoValidation,
  handleValidationErrors,
  turnoController.deleteTurno
);

module.exports = router;