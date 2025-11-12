/**
 * Script para diagnosticar y reparar el problema de UPDATE
 */
require('dotenv').config();
const { executeQuery, pool } = require('./src/config/database');

async function diagnosticAndFix() {
  console.log('\n🔧 DIAGNÓSTICO Y REPARACIÓN DEL UPDATE\n');
  console.log('═'.repeat(70));

  try {
    // 1. Buscar usuarios no verificados
    console.log('\n1️⃣  Buscando usuarios no verificados...');
    const unverified = await executeQuery(`
      SELECT uk_administrador, s_email, b_email_verified, s_verification_token
      FROM Administrador 
      WHERE b_email_verified = 0 OR b_email_verified = FALSE
      LIMIT 3
    `);
    
    console.log(`   → Encontrados ${unverified.length} usuarios no verificados`);
    
    if (unverified.length > 0) {
      const testUser = unverified[0];
      console.log('\n   📋 Usuario de prueba:');
      console.log('      Email:', testUser.s_email);
      console.log('      UUID:', testUser.uk_administrador);
      console.log('      Verificado (antes):', testUser.b_email_verified);
      
      // 2. Probar UPDATE con TRUE
      console.log('\n2️⃣  Probando UPDATE con TRUE...');
      const query1 = `
        UPDATE Administrador 
        SET b_email_verified = TRUE
        WHERE uk_administrador = ?
      `;
      
      const result1 = await executeQuery(query1, [testUser.uk_administrador]);
      console.log('   → Resultado:', result1);
      console.log('   → affectedRows:', result1?.affectedRows);
      console.log('   → changedRows:', result1?.changedRows);
      
      // Verificar
      const [check1] = await executeQuery(
        'SELECT b_email_verified FROM Administrador WHERE uk_administrador = ?',
        [testUser.uk_administrador]
      );
      console.log('   → Estado después:', check1?.b_email_verified);
      
      // Revertir
      await executeQuery(
        'UPDATE Administrador SET b_email_verified = 0 WHERE uk_administrador = ?',
        [testUser.uk_administrador]
      );
      
      // 3. Probar UPDATE con 1
      console.log('\n3️⃣  Probando UPDATE con 1...');
      const query2 = `
        UPDATE Administrador 
        SET b_email_verified = 1
        WHERE uk_administrador = ?
      `;
      
      const result2 = await executeQuery(query2, [testUser.uk_administrador]);
      console.log('   → Resultado:', result2);
      console.log('   → affectedRows:', result2?.affectedRows);
      console.log('   → changedRows:', result2?.changedRows);
      
      // Verificar
      const [check2] = await executeQuery(
        'SELECT b_email_verified FROM Administrador WHERE uk_administrador = ?',
        [testUser.uk_administrador]
      );
      console.log('   → Estado después:', check2?.b_email_verified);
      
      // Revertir
      await executeQuery(
        'UPDATE Administrador SET b_email_verified = 0 WHERE uk_administrador = ?',
        [testUser.uk_administrador]
      );
      
      // 4. Probar UPDATE completo (como en el código real)
      console.log('\n4️⃣  Probando UPDATE completo (como en producción)...');
      const query3 = `
        UPDATE Administrador 
        SET b_email_verified = 1,
            s_verification_token = NULL,
            d_verification_token_expires = NULL,
            d_fecha_modificacion = NOW()
        WHERE uk_administrador = ?
      `;
      
      const result3 = await executeQuery(query3, [testUser.uk_administrador]);
      console.log('   → Resultado tipo:', typeof result3);
      console.log('   → Resultado:', result3);
      console.log('   → affectedRows:', result3?.affectedRows);
      console.log('   → changedRows:', result3?.changedRows);
      
      // Verificar
      await new Promise(resolve => setTimeout(resolve, 200));
      const [check3] = await executeQuery(
        'SELECT b_email_verified, s_verification_token FROM Administrador WHERE uk_administrador = ?',
        [testUser.uk_administrador]
      );
      console.log('   → Estado después:');
      console.log('      b_email_verified:', check3?.b_email_verified);
      console.log('      s_verification_token:', check3?.s_verification_token || 'NULL');
      
      if (check3?.b_email_verified === 1 || check3?.b_email_verified === true) {
        console.log('   ✅ UPDATE FUNCIONÓ CORRECTAMENTE');
      } else {
        console.log('   ❌ UPDATE NO FUNCIONÓ');
      }
      
      // Revertir cambios
      console.log('\n5️⃣  Revirtiendo cambios...');
      await executeQuery(
        'UPDATE Administrador SET b_email_verified = 0 WHERE uk_administrador = ?',
        [testUser.uk_administrador]
      );
      console.log('   ✅ Cambios revertidos');
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ Diagnóstico completado\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

diagnosticAndFix();
