// Ver usuarios existentes en Railway
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkExistingUsers() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'crossover.proxy.rlwy.net',
      port: 24520,
      database: 'railway',
      user: 'root',
      password: 'eevDQDtoDTFxyFGvZhfioCzGYxZwjMqD'
    });

    console.log('📋 Usuarios existentes en Railway:\n');
    const [users] = await connection.execute(`
      SELECT s_nombre, s_apellido, s_email, s_usuario, b_email_verified, 
             d_fecha_creacion
      FROM Administrador 
      ORDER BY d_fecha_creacion DESC
    `);
    
    console.table(users);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkExistingUsers();
