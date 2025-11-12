const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión a la base de datos
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mediqueue',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función para ejecutar consultas
const executeQuery = async (query, params = []) => {
  try {
    // Para SELECT, retornar solo los rows
    // Para INSERT, UPDATE, DELETE, retornar el resultado completo con affectedRows
    const [rows, fields] = await pool.execute(query, params);
    
    // Si es un comando de modificación (INSERT, UPDATE, DELETE), retornar rows que contiene affectedRows
    if (rows.affectedRows !== undefined) {
      return rows;
    }
    
    // Si es SELECT, retornar los resultados
    return rows;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery
};
