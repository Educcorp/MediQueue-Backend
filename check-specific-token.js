require('dotenv').config();
const { executeQuery } = require('./src/config/database');

/**
 * Script para verificar un token específico en la base de datos
 */
async function checkSpecificToken() {
  try {
    const token = 'd6c4f2935d4e7f2f2576ea5cdfb3cd46b5436b79bf496bb8ec926a39fd569df9';
    
    console.log('🔍 Verificando token en la base de datos...\n');
    console.log(`Token: ${token}`);
    console.log(`Longitud: ${token.length} caracteres\n`);

    // Buscar el token en la BD
    const query = `
      SELECT 
        s_email,
        s_nombre,
        s_reset_password_token,
        d_reset_password_expires,
        d_reset_password_expires > NOW() as is_valid,
        TIMESTAMPDIFF(MINUTE, NOW(), d_reset_password_expires) as minutes_remaining
      FROM Administrador
      WHERE s_reset_password_token = ?
    `;

    const results = await executeQuery(query, [token]);

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (results.length === 0) {
      console.log('❌ TOKEN NO ENCONTRADO EN LA BASE DE DATOS\n');
      console.log('Posibles causas:');
      console.log('1. El token nunca se guardó en la BD');
      console.log('2. El token fue usado y eliminado');
      console.log('3. El token fue limpiado por ser antiguo\n');
      
      console.log('📋 Verificando todos los tokens actuales:\n');
      
      const allTokensQuery = `
        SELECT 
          s_email,
          s_nombre,
          s_reset_password_token,
          LENGTH(s_reset_password_token) as token_length,
          d_reset_password_expires,
          d_reset_password_expires > NOW() as is_valid
        FROM Administrador
        WHERE s_reset_password_token IS NOT NULL
        ORDER BY d_fecha_modificacion DESC
      `;
      
      const allTokens = await executeQuery(allTokensQuery);
      
      if (allTokens.length === 0) {
        console.log('   ⚠️  No hay ningún token en la base de datos');
        console.log('   Necesitas solicitar un nuevo enlace de recuperación\n');
      } else {
        console.log(`   Tokens encontrados: ${allTokens.length}\n`);
        allTokens.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.s_email} (${row.s_nombre})`);
          console.log(`      Token: ${row.s_reset_password_token.substring(0, 20)}...`);
          console.log(`      Longitud: ${row.token_length}`);
          console.log(`      Expira: ${row.d_reset_password_expires}`);
          console.log(`      Válido: ${row.is_valid ? '✓ SÍ' : '✗ NO'}\n`);
        });
      }
    } else {
      const result = results[0];
      console.log('✅ TOKEN ENCONTRADO\n');
      console.log(`   Email: ${result.s_email}`);
      console.log(`   Nombre: ${result.s_nombre}`);
      console.log(`   Expira: ${result.d_reset_password_expires}`);
      console.log(`   Estado: ${result.is_valid ? '✅ VÁLIDO' : '❌ EXPIRADO'}`);
      
      if (result.is_valid) {
        console.log(`   Tiempo restante: ${result.minutes_remaining} minutos\n`);
      } else {
        console.log(`   Expiró hace: ${Math.abs(result.minutes_remaining)} minutos\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSpecificToken();

