// Script para agregar campos de verificación de email a Railway
require('dotenv').config();
const mysql = require('mysql2/promise');

async function addEmailVerificationToRailway() {
  console.log('🚀 Conectando a la base de datos de Railway...\n');
  
  let connection;
  
  try {
    // Configuración de Railway
    connection = await mysql.createConnection({
      host: 'crossover.proxy.rlwy.net',
      port: 24520,
      database: 'railway',
      user: 'root',
      password: 'eevDQDtoDTFxyFGvZhfioCzGYxZwjMqD'
    });

    console.log('✅ Conectado a Railway exitosamente\n');

    // Verificar si los campos ya existen
    console.log('🔍 Verificando estructura actual de la tabla Administrador...\n');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='Administrador'"
    );
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Columnas actuales:', columnNames.join(', '));

    // Agregar campos si no existen
    if (!columnNames.includes('b_email_verified')) {
      console.log('\n➕ Agregando campo b_email_verified...');
      await connection.execute(`
        ALTER TABLE Administrador 
        ADD COLUMN b_email_verified BOOLEAN DEFAULT FALSE COMMENT 'Indica si el email ha sido verificado'
      `);
      console.log('✅ Campo b_email_verified agregado');
    } else {
      console.log('\n✓ Campo b_email_verified ya existe');
    }

    if (!columnNames.includes('s_verification_token')) {
      console.log('➕ Agregando campo s_verification_token...');
      await connection.execute(`
        ALTER TABLE Administrador 
        ADD COLUMN s_verification_token VARCHAR(255) DEFAULT NULL COMMENT 'Token para verificar email'
      `);
      console.log('✅ Campo s_verification_token agregado');
    } else {
      console.log('✓ Campo s_verification_token ya existe');
    }

    if (!columnNames.includes('d_verification_token_expires')) {
      console.log('➕ Agregando campo d_verification_token_expires...');
      await connection.execute(`
        ALTER TABLE Administrador 
        ADD COLUMN d_verification_token_expires DATETIME DEFAULT NULL COMMENT 'Fecha de expiración del token de verificación'
      `);
      console.log('✅ Campo d_verification_token_expires agregado');
    } else {
      console.log('✓ Campo d_verification_token_expires ya existe');
    }

    // Agregar índice para el token si no existe
    console.log('\n🔍 Verificando índices...');
    const [indexes] = await connection.execute(`
      SELECT DISTINCT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA='railway' 
      AND TABLE_NAME='Administrador'
      AND COLUMN_NAME='s_verification_token'
    `);

    if (indexes.length === 0) {
      console.log('➕ Agregando índice para s_verification_token...');
      await connection.execute(`
        ALTER TABLE Administrador 
        ADD INDEX idx_verification_token (s_verification_token)
      `);
      console.log('✅ Índice agregado');
    } else {
      console.log('✓ Índice ya existe');
    }

    // Verificar estructura final
    console.log('\n📊 Estructura final de la tabla Administrador:\n');
    const [finalStructure] = await connection.execute('DESCRIBE Administrador');
    console.table(finalStructure);

    console.log('\n🎉 ¡Migración completada exitosamente en Railway!');
    console.log('✅ La base de datos está lista para el sistema de verificación de email\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('\nError completo:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
  
  process.exit(0);
}

addEmailVerificationToRailway();
