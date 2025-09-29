const express = require('express');
const router = express.Router();

const areaController = require('../controllers/areaController');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const {
  createAreaValidation,
  updateAreaValidation,
  getAreaValidation,
  searchAreaValidation,
  getEstadisticasPorFechaValidation
} = require('../validations/areaValidation');

/**
 * @route   POST /api/areas
 * @desc    Crear una nueva área
 * @access  Private (Admin)
 */
router.post('/',
  verifyToken,
  requireAdmin,
  createAreaValidation,
  handleValidationErrors,
  areaController.createArea
);

/**
 * @route   GET /api/areas
 * @desc    Obtener todas las áreas activas
 * @access  Private (Admin)
 */
router.get('/',
  verifyToken,
  requireAdmin,
  areaController.getAllAreas
);

/**
 * @route   GET /api/areas/all
 * @desc    Obtener todas las áreas (incluyendo inactivas)
 * @access  Private (Super Admin)
 */
router.get('/all',
  verifyToken,
  requireSuperAdmin,
  areaController.getAllAreasWithInactive
);

/**
 * @route   GET /api/areas/basicas
 * @desc    Obtener áreas con información básica (para selects)
 * @access  Public (para generar turnos)
 */
router.get('/basicas',
  areaController.getAreasBasicas
);

/**
 * @route   GET /api/areas/search
 * @desc    Buscar áreas por nombre
 * @access  Private (Admin)
 */
router.get('/search',
  verifyToken,
  requireAdmin,
  searchAreaValidation,
  handleValidationErrors,
  areaController.searchAreas
);

/**
 * @route   GET /api/areas/estadisticas
 * @desc    Obtener estadísticas de turnos por área
 * @access  Private (Admin)
 */
router.get('/estadisticas',
  verifyToken,
  requireAdmin,
  areaController.getEstadisticasTurnos
);

/**
 * @route   GET /api/areas/estadisticas-por-fecha
 * @desc    Obtener estadísticas de turnos por área en un rango de fechas
 * @access  Private (Admin)
 */
router.get('/estadisticas-por-fecha',
  verifyToken,
  requireAdmin,
  getEstadisticasPorFechaValidation,
  handleValidationErrors,
  areaController.getEstadisticasTurnosPorFecha
);

/**
 * @route   GET /api/areas/with-count
 * @desc    Obtener áreas con conteo de consultorios
 * @access  Private (Admin)
 */
router.get('/with-count',
  verifyToken,
  requireAdmin,
  areaController.getAreasWithCount
);

/**
 * @route   GET /api/areas/:uk_area
 * @desc    Obtener área por UUID
 * @access  Private (Admin)
 */
router.get('/:uk_area',
  verifyToken,
  requireAdmin,
  getAreaValidation,
  handleValidationErrors,
  areaController.getAreaById
);

/**
 * @route   GET /api/areas/nombre/:s_nombre_area
 * @desc    Obtener área por nombre
 * @access  Private (Admin)
 */
router.get('/nombre/:s_nombre_area',
  verifyToken,
  requireAdmin,
  areaController.getAreaByNombre
);

/**
 * @route   GET /api/areas/:uk_area/consultorios
 * @desc    Obtener área con sus consultorios
 * @access  Private (Admin) / Public (para generar turnos)
 */
router.get('/:uk_area/consultorios',
  getAreaValidation,
  handleValidationErrors,
  areaController.getAreaWithConsultorios
);

/**
 * @route   PUT /api/areas/:uk_area
 * @desc    Actualizar área
 * @access  Private (Admin)
 */
router.put('/:uk_area',
  verifyToken,
  requireAdmin,
  updateAreaValidation,
  handleValidationErrors,
  areaController.updateArea
);

/**
 * @route   PUT /api/areas/:uk_area/soft-delete
 * @desc    Desactivar área (soft delete)
 * @access  Private (Super Admin)
 */
router.put('/:uk_area/soft-delete',
  verifyToken,
  requireSuperAdmin,
  getAreaValidation,
  handleValidationErrors,
  areaController.softDeleteArea
);

/**
 * @route   DELETE /api/areas/:uk_area
 * @desc    Eliminar área (hard delete)
 * @access  Private (Super Admin)
 */
router.delete('/:uk_area',
  verifyToken,
  requireSuperAdmin,
  getAreaValidation,
  handleValidationErrors,
  areaController.deleteArea
);

/**
 * @route   GET /api/areas/personalization/config
 * @desc    Obtener configuración de personalización (letras en uso, colores e iconos)
 * @access  Private (Admin)
 */
router.get('/personalization/config',
  verifyToken,
  requireAdmin,
  areaController.getPersonalizationConfig
);

/**
 * @route   GET /api/areas/personalization/check-letra
 * @desc    Verificar disponibilidad de letra
 * @access  Private (Admin)
 */
router.get('/personalization/check-letra',
  verifyToken,
  requireAdmin,
  areaController.checkLetraDisponibilidad
);

module.exports = router;