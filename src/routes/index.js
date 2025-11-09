const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./authRoutes');
const administradorRoutes = require('./administradorRoutes');
const turnoRoutes = require('./turnoRoutes');
const pacienteRoutes = require('./pacienteRoutes');
const areaRoutes = require('./areaRoutes');
const consultorioRoutes = require('./consultorioRoutes');
const testRoutes = require('./testRoutes');

/**
 * Ruta de salud del API
 * @route   GET /api/health
 * @desc    Verificar estado del servidor
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediQueue API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Información general del API
 * @route   GET /api
 * @desc    Información del API
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido al API de MediQueue',
    description: 'Sistema turnomático para gestión hospitalaria',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      turnos: '/api/turnos',
      pacientes: '/api/pacientes',
      areas: '/api/areas',
      consultorios: '/api/consultorios'
    },
    documentation: {
      health: 'GET /api/health - Estado del servidor',
      auth: {
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        verify: 'GET /api/auth/verify'
      },
      turnos: {
        public: 'GET /api/turnos/publicos - Turnos para pantalla pública',
        generate: 'POST /api/turnos/rapido - Generar turno rápido',
        admin: 'GET /api/turnos - Lista completa (requiere autenticación)'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Configurar rutas
router.use('/auth', authRoutes);
router.use('/administradores', administradorRoutes);
router.use('/turnos', turnoRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/areas', areaRoutes);
router.use('/consultorios', consultorioRoutes);
router.use('/test', testRoutes); // Rutas de prueba (remover en producción)

module.exports = router;
