const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuración y middleware
const config = require('./config/config');
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');
const { testConnection } = require('./config/database');

// Importar rutas
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// Configurar middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configurar CORS
app.use(cors(config.cors));

// Middleware para logging de requests
if (process.env.VITE_NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MediQueue Backend API',
    version: '1.0.0',
    description: 'Sistema turnomático para gestión hospitalaria',
    endpoints: {
      api: '/api',
      health: '/api/health',
      docs: '/api'
    },
    timestamp: new Date().toISOString()
  });
});

// Configurar rutas principales
app.use('/api', routes);

// Middleware para rutas no encontradas
app.use('*', notFoundHandler);

// Middleware global de manejo de errores
app.use(errorHandler);

// Función para inicializar la aplicación
const initializeApp = async () => {
  try {
    console.log('🚀 Iniciando MediQueue Backend...');
    
    // Probar conexión a la base de datos
    console.log('📊 Probando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    console.log('✅ Aplicación inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando la aplicación:', error.message);
    return false;
  }
};

module.exports = { app, initializeApp };
