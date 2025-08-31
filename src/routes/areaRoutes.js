const express = require('express');
const router = express.Router();

const areaController = require('../controllers/areaController');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const { 
  createAreaValidation, 
  updateAreaValidation, 
  getAreaValidation 
} = require('../validations/areaValidation');

/**
 * @route   POST /api/areas
 * @desc    Crear una nueva área
 * @access  Private (Admin)
 */
router.post('/', 
  verifyToken,
  createAreaValidation,
  handleValidationErrors,
  areaController.createArea
);

/**
 * @route   GET /api/areas
 * @desc    Obtener todas las áreas
 * @access  Private (Admin)
 */
router.get('/', 
  verifyToken,
  areaController.getAllAreas
);

/**
 * @route   GET /api/areas/basicas
 * @desc    Obtener áreas con información básica (para selects)
 * @access  Private (Admin) / Public (para generar turnos)
 */
router.get('/basicas', 
  areaController.getAreasBasicas
);

/**
 * @route   GET /api/areas/estadisticas
 * @desc    Obtener estadísticas de turnos por área
 * @access  Private (Admin)
 */
router.get('/estadisticas', 
  verifyToken,
  areaController.getEstadisticasTurnos
);

/**
 * @route   GET /api/areas/:id
 * @desc    Obtener área por ID
 * @access  Private (Admin)
 */
router.get('/:id', 
  verifyToken,
  getAreaValidation,
  handleValidationErrors,
  areaController.getAreaById
);

/**
 * @route   GET /api/areas/:id/consultorios
 * @desc    Obtener área con sus consultorios
 * @access  Private (Admin) / Public (para generar turnos)
 */
router.get('/:id/consultorios', 
  getAreaValidation,
  handleValidationErrors,
  areaController.getAreaWithConsultorios
);

/**
 * @route   PUT /api/areas/:id
 * @desc    Actualizar área
 * @access  Private (Admin)
 */
router.put('/:id', 
  verifyToken,
  updateAreaValidation,
  handleValidationErrors,
  areaController.updateArea
);

/**
 * @route   DELETE /api/areas/:id
 * @desc    Eliminar área
 * @access  Private (Admin)
 */
router.delete('/:id', 
  verifyToken,
  getAreaValidation,
  handleValidationErrors,
  areaController.deleteArea
);

module.exports = router;
