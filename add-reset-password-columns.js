const { executeQuery } = require('./src/config/database');

/**
 * Script para agregar las columnas de recuperación de contraseña
 * a la tabla Administrador si no existen
 */
async function addResetPasswordColumns() {
  try {
    console.log('🔧 Agregando columnas de recuperación de contraseña...\n');

    // Verificar si la columna s_reset_password_token existe
    const checkColumn1 = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Administrador' 
      AND COLUMN_NAME = 's_reset_password_token'
    `;

    const result1 = await executeQuery(checkColumn1);
    
    if (result1[0].count === 0) {
      console.log('➕ Agregando columna s_reset_password_token...');
      await executeQuery(`
        ALTER TABLE Administrador 
        ADD COLUMN s_reset_password_token VARCHAR(255) NULL
      `);
      console.log('✅ Columna s_reset_password_token agregada');
    } else {
      console.log('✓ Columna s_reset_password_token ya existe');
    }

    // Verificar si la columna d_reset_password_expires existe
    const checkColumn2 = `
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Administrador' 
      AND COLUMN_NAME = 'd_reset_password_expires'
    `;

    const result2 = await executeQuery(checkColumn2);
    
    if (result2[0].count === 0) {
      console.log('➕ Agregando columna d_reset_password_expires...');
      await executeQuery(`
        ALTER TABLE Administrador 
        ADD COLUMN d_reset_password_expires DATETIME NULL
      `);
      console.log('✅ Columna d_reset_password_expires agregada');
    } else {
      console.log('✓ Columna d_reset_password_expires ya existe');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Migración completada exitosamente');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nAhora puedes usar la funcionalidad de recuperación de contraseña.');

  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
    console.error('\nSi el error persiste, ejecuta manualmente el script SQL:');
    console.error('   add-password-reset-columns.sql');
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
addResetPasswordColumns();

