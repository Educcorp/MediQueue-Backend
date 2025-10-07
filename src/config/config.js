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
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: process.env.MYSQL_PORT || process.env.DB_PORT,
    name: process.env.MYSQL_DATABASE || process.env.DB_NAME,
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD
  },

  // Configuración CORS
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'https://mediqueue.up.railway.app',
      'https://mediqueue-production.up.railway.app'
    ],
    credentials: true
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
