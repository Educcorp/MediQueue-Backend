const { executeQuery } = require('./src/config/database');

/**
 * Script para verificar si las columnas de recuperación de contraseña existen
 */
async function checkResetColumns() {
  try {
    console.log('🔍 Verificando columnas de recuperación de contraseña...\n');

    // Verificar columnas
    const query = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Administrador'
      AND COLUMN_NAME IN ('s_reset_password_token', 'd_reset_password_expires')
      ORDER BY COLUMN_NAME
    `;

    const columns = await executeQuery(query);

    if (columns.length === 0) {
      console.log('❌ Las columnas NO existen en la base de datos\n');
      console.log('🔧 SOLUCIÓN: Ejecuta el siguiente comando para agregarlas:');
      console.log('   node add-reset-password-columns.js\n');
      return false;
    }

    console.log('✅ Las columnas existen en la base de datos:\n');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}`);
      console.log(`     Tipo: ${col.DATA_TYPE}`);
      console.log(`     NULL: ${col.IS_NULLABLE}`);
      console.log('');
    });

    // Verificar estructura completa de la tabla
    const tableStructure = `
      SELECT COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Administrador'
      ORDER BY ORDINAL_POSITION
    `;

    const allColumns = await executeQuery(tableStructure);
    
    console.log('📋 Estructura completa de la tabla Administrador:');
    console.log('═══════════════════════════════════════════════════');
    allColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.COLUMN_NAME.padEnd(35)} (${col.DATA_TYPE})`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error al verificar columnas:', error);
    return false;
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
checkResetColumns();

