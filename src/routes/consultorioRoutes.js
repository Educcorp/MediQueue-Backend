const express = require('express');
const router = express.Router();

const consultorioController = require('../controllers/consultorioController');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const { 
  createConsultorioValidation, 
  updateConsultorioValidation, 
  getConsultorioValidation,
  getConsultoriosByAreaValidation,
  llamarSiguienteConsultorioValidation,
  getEstadisticasPorFechaValidation
} = require('../validations/consultorioValidation');

/**
 * @route   POST /api/consultorios
 * @desc    Crear un nuevo consultorio
 * @access  Private (Admin)
 */
router.post('/', 
  verifyToken,
  requireAdmin,
  createConsultorioValidation,
  handleValidationErrors,
  consultorioController.createConsultorio
);

/**
 * @route   GET /api/consultorios
 * @desc    Obtener todos los consultorios activos
 * @access  Private (Admin)
 */
router.get('/', 
  verifyToken,
  requireAdmin,
  consultorioController.getAllConsultorios
);

/**
 * @route   GET /api/consultorios/all
 * @desc    Obtener todos los consultorios (incluyendo inactivos)
 * @access  Private (Super Admin)
 */
router.get('/all',
  verifyToken,
  requireSuperAdmin,
  consultorioController.getAllConsultoriosWithInactive
);

/**
 * @route   GET /api/consultorios/basicos
 * @desc    Obtener consultorios básicos (para generar turnos)
 * @access  Public (para generar turnos)
 */
router.get('/basicos', 
  consultorioController.getConsultoriosBasicos
);

/**
 * @route   GET /api/consultorios/disponibles
 * @desc    Obtener consultorios disponibles (sin turnos en espera o llamando)
 * @access  Public (para generar turnos)
 */
router.get('/disponibles', 
  consultorioController.getConsultoriosDisponibles
);

/**
 * @route   GET /api/consultorios/with-stats
 * @desc    Obtener consultorios con estadísticas del día
 * @access  Private (Admin)
 */
router.get('/with-stats',
  verifyToken,
  requireAdmin,
  consultorioController.getConsultoriosWithStats
);

/**
 * @route   GET /api/consultorios/:uk_consultorio
 * @desc    Obtener consultorio por UUID
 * @access  Private (Admin)
 */
router.get('/:uk_consultorio', 
  verifyToken,
  requireAdmin,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.getConsultorioById
);

/**
 * @route   GET /api/consultorios/area/:uk_area
 * @desc    Obtener consultorios por área
 * @access  Public (para generar turnos)
 */
router.get('/area/:uk_area', 
  getConsultoriosByAreaValidation,
  handleValidationErrors,
  consultorioController.getConsultoriosByArea
);

/**
 * @route   GET /api/consultorios/area/:uk_area/basicos
 * @desc    Obtener consultorios básicos por área (para selects)
 * @access  Public (para generar turnos)
 */
router.get('/area/:uk_area/basicos', 
  getConsultoriosByAreaValidation,
  handleValidationErrors,
  consultorioController.getConsultoriosBasicosByArea
);

/**
 * @route   GET /api/consultorios/:uk_consultorio/estadisticas
 * @desc    Obtener estadísticas de turnos del consultorio
 * @access  Private (Admin)
 */
router.get('/:uk_consultorio/estadisticas', 
  verifyToken,
  requireAdmin,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.getEstadisticasTurnos
);

/**
 * @route   GET /api/consultorios/:uk_consultorio/estadisticas-por-fecha
 * @desc    Obtener estadísticas de turnos del consultorio por rango de fechas
 * @access  Private (Admin)
 */
router.get('/:uk_consultorio/estadisticas-por-fecha',
  verifyToken,
  requireAdmin,
  getEstadisticasPorFechaValidation,
  handleValidationErrors,
  consultorioController.getEstadisticasTurnosPorFecha
);

/**
 * @route   GET /api/consultorios/:uk_consultorio/disponible
 * @desc    Verificar si el consultorio está disponible
 * @access  Private (Admin)
 */
router.get('/:uk_consultorio/disponible',
  verifyToken,
  requireAdmin,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.isConsultorioDisponible
);

/**
 * @route   GET /api/consultorios/:uk_consultorio/turno-actual
 * @desc    Obtener turno actual del consultorio
 * @access  Private (Admin)
 */
router.get('/:uk_consultorio/turno-actual',
  verifyToken,
  requireAdmin,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.getTurnoActual
);

/**
 * @route   POST /api/consultorios/:uk_consultorio/siguiente-turno
 * @desc    Llamar siguiente turno en el consultorio
 * @access  Private (Admin)
 */
router.post('/:uk_consultorio/siguiente-turno', 
  verifyToken,
  requireAdmin,
  llamarSiguienteConsultorioValidation,
  handleValidationErrors,
  consultorioController.llamarSiguienteTurno
);

/**
 * @route   PUT /api/consultorios/:uk_consultorio
 * @desc    Actualizar consultorio
 * @access  Private (Admin)
 */
router.put('/:uk_consultorio', 
  verifyToken,
  requireAdmin,
  updateConsultorioValidation,
  handleValidationErrors,
  consultorioController.updateConsultorio
);

/**
 * @route   PUT /api/consultorios/:uk_consultorio/soft-delete
 * @desc    Desactivar consultorio (soft delete)
 * @access  Private (Super Admin)
 */
router.put('/:uk_consultorio/soft-delete',
  verifyToken,
  requireSuperAdmin,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.softDeleteConsultorio
);

/**
 * @route   DELETE /api/consultorios/:uk_consultorio
 * @desc    Eliminar consultorio (hard delete)
 * @access  Private (Super Admin)
 */
router.delete('/:uk_consultorio', 
  verifyToken,
  requireSuperAdmin,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.deleteConsultorio
);

module.exports = router;