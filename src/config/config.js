require('dotenv').config();

const config = {
  // Configuración del servidor
  port: process.env.PORT || 3000,

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'mediqueue_secret_key_2025',
    expiresIn: '24h'
  },

  // Configuración de base de datos
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },

  // Configuración CORS
  cors: {
    origin: [
      // Desarrollo local
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      // Railway domains
      'https://mediqueue-backend.railway.app',
      'https://robust-reprieve-production.up.railway.app',
      // Frontend URL configurada
      process.env.FRONTEND_URL
    ].filter(Boolean), // Filtrar valores undefined
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
  },

  // Estados de turnos
  turnoEstados: {
    EN_ESPERA: 'En espera',
    LLAMANDO: 'Llamando',
    ATENDIDO: 'Atendido',
    CANCELADO: 'Cancelado'
  }
};

module.exports = config;
