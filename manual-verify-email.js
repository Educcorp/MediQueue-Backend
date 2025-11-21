const { executeQuery } = require('./src/config/database');

/**
 * Script para verificar manualmente el email de un administrador
 * Uso: node manual-verify-email.js <email>
 */
async function manualVerifyEmail() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log('❌ Error: Debes proporcionar un email');
      console.log('');
      console.log('Uso: node manual-verify-email.js <email>');
      console.log('Ejemplo: node manual-verify-email.js admin@ejemplo.com');
      process.exit(1);
    }

    console.log(`🔍 Buscando administrador con email: ${email}\n`);

    // Buscar el administrador
    const findQuery = 'SELECT * FROM Administrador WHERE s_email = ?';
    const admins = await executeQuery(findQuery, [email]);

    if (admins.length === 0) {
      console.log('❌ No se encontró ningún administrador con ese email');
      process.exit(1);
    }

    const admin = admins[0];

    console.log('✅ Administrador encontrado:');
    console.log(`   Nombre: ${admin.s_nombre} ${admin.s_apellido}`);
    console.log(`   Email: ${admin.s_email}`);
    console.log(`   Usuario: ${admin.s_usuario}`);
    console.log(`   Estado: ${admin.ck_estado}`);
    console.log(`   Email verificado: ${admin.b_email_verified ? 'SÍ' : 'NO'}\n`);

    if (admin.b_email_verified) {
      console.log('ℹ️  Este email ya está verificado');
      process.exit(0);
    }

    // Verificar el email
    const updateQuery = `
      UPDATE Administrador 
      SET b_email_verified = 1,
          s_verification_token = NULL,
          d_verification_token_expires = NULL,
          d_fecha_modificacion = NOW()
      WHERE s_email = ?
    `;

    console.log('🔄 Verificando email...');
    const result = await executeQuery(updateQuery, [email]);

    if (result.affectedRows > 0) {
      console.log('✅ Email verificado exitosamente\n');
      
      // Verificar el cambio
      const verifyQuery = 'SELECT b_email_verified FROM Administrador WHERE s_email = ?';
      const verification = await executeQuery(verifyQuery, [email]);
      
      if (verification[0].b_email_verified) {
        console.log('✅ Verificación confirmada en la base de datos');
        console.log('   El administrador ahora puede usar la función de "Acceso Rápido"');
      } else {
        console.log('⚠️  Advertencia: El cambio no se reflejó en la base de datos');
      }
    } else {
      console.log('❌ No se pudo verificar el email');
    }

  } catch (error) {
    console.error('❌ Error al verificar email:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
manualVerifyEmail();

