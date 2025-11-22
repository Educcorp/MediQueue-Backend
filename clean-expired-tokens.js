require('dotenv').config();
const { executeQuery } = require('./src/config/database');

/**
 * Script para limpiar tokens expirados de la base de datos
 */
async function cleanExpiredTokens() {
  try {
    console.log('🧹 Limpiando tokens expirados...\n');

    // 1. Contar tokens expirados
    const countQuery = `
      SELECT COUNT(*) as count
      FROM Administrador
      WHERE s_reset_password_token IS NOT NULL
      AND d_reset_password_expires < NOW()
    `;

    const countResult = await executeQuery(countQuery);
    const expiredCount = countResult[0].count;

    console.log(`   Tokens expirados encontrados: ${expiredCount}\n`);

    if (expiredCount === 0) {
      console.log('   ✅ No hay tokens expirados para limpiar');
      process.exit(0);
    }

    // 2. Mostrar tokens que se van a limpiar
    const listQuery = `
      SELECT s_email, s_nombre, d_reset_password_expires
      FROM Administrador
      WHERE s_reset_password_token IS NOT NULL
      AND d_reset_password_expires < NOW()
    `;

    const tokens = await executeQuery(listQuery);
    
    console.log('   Tokens a limpiar:');
    tokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.s_email} - Expiró: ${token.d_reset_password_expires}`);
    });
    console.log('');

    // 3. Limpiar tokens expirados
    const cleanQuery = `
      UPDATE Administrador
      SET s_reset_password_token = NULL,
          d_reset_password_expires = NULL
      WHERE s_reset_password_token IS NOT NULL
      AND d_reset_password_expires < NOW()
    `;

    const result = await executeQuery(cleanQuery);

    console.log(`   ✅ ${result.affectedRows} token(es) limpiado(s)\n`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Limpieza completada');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
cleanExpiredTokens();

