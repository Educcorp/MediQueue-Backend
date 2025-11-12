/**
 * Script de debugging para verificar el estado de verificación de emails
 * Uso: node debug-verification.js
 */

require('dotenv').config();
const { executeQuery } = require('./src/config/database');

async function debugVerification() {
  console.log('🔍 DEBUG: Verificando estado de administradores...\n');

  try {
    // 1. Listar todos los administradores con su estado de verificación
    const allAdmins = await executeQuery(`
      SELECT 
        uk_administrador,
        s_email,
        s_nombre,
        s_apellido,
        b_email_verified,
        s_verification_token,
        d_verification_token_expires,
        d_fecha_creacion,
        d_fecha_modificacion
      FROM Administrador 
      ORDER BY d_fecha_creacion DESC
      LIMIT 10
    `);

    console.log('📊 ADMINISTRADORES RECIENTES:');
    console.log('═'.repeat(100));
    
    allAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.s_nombre} ${admin.s_apellido} (${admin.s_email})`);
      console.log(`   UUID: ${admin.uk_administrador}`);
      console.log(`   Email Verificado: ${admin.b_email_verified ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Token: ${admin.s_verification_token ? admin.s_verification_token.substring(0, 20) + '...' : 'NULL'}`);
      console.log(`   Token Expira: ${admin.d_verification_token_expires || 'NULL'}`);
      console.log(`   Creado: ${admin.d_fecha_creacion}`);
      console.log(`   Modificado: ${admin.d_fecha_modificacion}`);
    });

    console.log('\n' + '═'.repeat(100));

    // 2. Verificados vs No verificados
    const stats = await executeQuery(`
      SELECT 
        b_email_verified,
        COUNT(*) as total
      FROM Administrador
      GROUP BY b_email_verified
    `);

    console.log('\n📈 ESTADÍSTICAS:');
    console.log('═'.repeat(100));
    stats.forEach(stat => {
      console.log(`${stat.b_email_verified ? '✅ Verificados' : '❌ No verificados'}: ${stat.total}`);
    });

    // 3. Tokens expirados
    const expiredTokens = await executeQuery(`
      SELECT COUNT(*) as total
      FROM Administrador
      WHERE s_verification_token IS NOT NULL 
      AND d_verification_token_expires < NOW()
    `);

    console.log(`⏰ Tokens expirados: ${expiredTokens[0].total}`);

    // 4. Tokens activos
    const activeTokens = await executeQuery(`
      SELECT COUNT(*) as total
      FROM Administrador
      WHERE s_verification_token IS NOT NULL 
      AND d_verification_token_expires > NOW()
    `);

    console.log(`✅ Tokens activos: ${activeTokens[0].total}`);

    console.log('\n' + '═'.repeat(100));
    console.log('\n✅ Debug completado\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
    process.exit(1);
  }
}

debugVerification();
