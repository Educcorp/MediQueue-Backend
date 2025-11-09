// Verificar token en la base de datos
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkToken() {
  let connection;
  const token = '8fdcaf8e423517e55a4e74b41bb4cb6b6c6ae0c48703eb8c23debb74fb81620d';
  
  try {
    connection = await mysql.createConnection({
      host: 'crossover.proxy.rlwy.net',
      port: 24520,
      database: 'railway',
      user: 'root',
      password: 'eevDQDtoDTFxyFGvZhfioCzGYxZwjMqD'
    });

    console.log('🔍 Buscando token:', token.substring(0, 20) + '...\n');
    
    // Buscar el token
    const [results] = await connection.execute(`
      SELECT s_nombre, s_email, s_verification_token, 
             d_verification_token_expires,
             b_email_verified,
             NOW() as ahora,
             d_verification_token_expires > NOW() as es_valido
      FROM Administrador 
      WHERE s_verification_token = ?
    `, [token]);
    
    if (results.length === 0) {
      console.log('❌ Token no encontrado en la base de datos');
    } else {
      console.log('✅ Token encontrado:\n');
      console.table(results);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkToken();
