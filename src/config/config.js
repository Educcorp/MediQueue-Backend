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
    origin: process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000',
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
