const express = require('express');
const router = express.Router();

const consultorioController = require('../controllers/consultorioController');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../validations/commonValidation');
const { 
  createConsultorioValidation, 
  updateConsultorioValidation, 
  getConsultorioValidation,
  getConsultoriosByAreaValidation,
  llamarSiguienteConsultorioValidation
} = require('../validations/consultorioValidation');

/**
 * @route   POST /api/consultorios
 * @desc    Crear un nuevo consultorio
 * @access  Private (Admin)
 */
router.post('/', 
  verifyToken,
  createConsultorioValidation,
  handleValidationErrors,
  consultorioController.createConsultorio
);

/**
 * @route   GET /api/consultorios
 * @desc    Obtener todos los consultorios
 * @access  Private (Admin)
 */
router.get('/', 
  verifyToken,
  consultorioController.getAllConsultorios
);

/**
 * @route   GET /api/consultorios/disponibles
 * @desc    Obtener consultorios disponibles (sin turnos en espera o llamando)
 * @access  Private (Admin) / Public (para generar turnos)
 */
router.get('/disponibles', 
  consultorioController.getConsultoriosDisponibles
);

/**
 * @route   GET /api/consultorios/:id
 * @desc    Obtener consultorio por ID
 * @access  Private (Admin)
 */
router.get('/:id', 
  verifyToken,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.getConsultorioById
);

/**
 * @route   GET /api/consultorios/area/:id_area
 * @desc    Obtener consultorios por área
 * @access  Private (Admin) / Public (para generar turnos)
 */
router.get('/area/:id_area', 
  getConsultoriosByAreaValidation,
  handleValidationErrors,
  consultorioController.getConsultoriosByArea
);

/**
 * @route   GET /api/consultorios/area/:id_area/basicos
 * @desc    Obtener consultorios básicos por área (para selects)
 * @access  Private (Admin) / Public (para generar turnos)
 */
router.get('/area/:id_area/basicos', 
  getConsultoriosByAreaValidation,
  handleValidationErrors,
  consultorioController.getConsultoriosBasicosByArea
);

/**
 * @route   GET /api/consultorios/:id/estadisticas
 * @desc    Obtener estadísticas de turnos del consultorio
 * @access  Private (Admin)
 */
router.get('/:id/estadisticas', 
  verifyToken,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.getEstadisticasTurnos
);

/**
 * @route   POST /api/consultorios/:id/siguiente-turno
 * @desc    Llamar siguiente turno en el consultorio
 * @access  Private (Admin)
 */
router.post('/:id/siguiente-turno', 
  verifyToken,
  llamarSiguienteConsultorioValidation,
  handleValidationErrors,
  consultorioController.llamarSiguienteTurno
);

/**
 * @route   PUT /api/consultorios/:id
 * @desc    Actualizar consultorio
 * @access  Private (Admin)
 */
router.put('/:id', 
  verifyToken,
  updateConsultorioValidation,
  handleValidationErrors,
  consultorioController.updateConsultorio
);

/**
 * @route   DELETE /api/consultorios/:id
 * @desc    Eliminar consultorio
 * @access  Private (Admin)
 */
router.delete('/:id', 
  verifyToken,
  getConsultorioValidation,
  handleValidationErrors,
  consultorioController.deleteConsultorio
);

module.exports = router;
