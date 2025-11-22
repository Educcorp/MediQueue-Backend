require('dotenv').config();
const { executeQuery } = require('./src/config/database');
const crypto = require('crypto');

/**
 * Script para diagnosticar el problema con los tokens de reset
 */
async function debugTokenIssue() {
  try {
    console.log('🔍 Diagnosticando problema con tokens de reset...\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Verificar cómo se generan los tokens
    console.log('1️⃣ Generación de Token:\n');
    const testToken = crypto.randomBytes(32).toString('hex');
    console.log(`   Token generado: ${testToken}`);
    console.log(`   Longitud: ${testToken.length} caracteres`);
    console.log(`   Formato: ${/^[a-f0-9]+$/.test(testToken) ? 'Hexadecimal válido ✓' : 'Formato inválido ✗'}\n`);

    // 2. Verificar tokens en la base de datos
    console.log('2️⃣ Tokens en Base de Datos:\n');
    
    const query = `
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
      LIMIT 5
    `;

    const results = await executeQuery(query);

    if (results.length === 0) {
      console.log('   ⚠️  No hay tokens activos en la base de datos\n');
      console.log('   Esto es normal si nadie ha solicitado recuperación recientemente.\n');
    } else {
      console.log(`   Tokens activos encontrados: ${results.length}\n`);
      
      results.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.s_email} (${row.s_nombre})`);
        console.log(`      Token: ${row.s_reset_password_token ? row.s_reset_password_token.substring(0, 20) + '...' : 'NULL'}`);
        console.log(`      Longitud: ${row.token_length} caracteres`);
        console.log(`      Expira: ${row.d_reset_password_expires}`);
        console.log(`      Válido: ${row.is_valid ? '✓ SÍ' : '✗ NO (expirado)'}\n`);
      });
    }

    // 3. Simular validación del token (como lo hace el backend)
    console.log('3️⃣ Validación de Token:\n');
    
    const tokenFromUrl = 'e9b8c7f3a2d1e4b5c6a7f8d9e0b1c2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9'; // Ejemplo
    console.log(`   Token de ejemplo: ${tokenFromUrl}`);
    console.log(`   Longitud: ${tokenFromUrl.length} caracteres`);
    console.log(`   Formato válido: ${/^[a-f0-9]{64}$/.test(tokenFromUrl) ? '✓ SÍ' : '✗ NO'}\n`);

    // 4. Verificar el token exacto del error
    console.log('4️⃣ Analizando Token del Error:\n');
    const errorToken = 'a715a50cd5976122a'; // Del error en la consola
    console.log(`   Token en el error: ${errorToken}`);
    console.log(`   Longitud: ${errorToken.length} caracteres`);
    console.log(`   ❌ PROBLEMA: Token incompleto (debería ser 64 caracteres)\n`);

    // 5. Posibles causas
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS DE CAUSAS POSIBLES:\n');

    console.log('❌ Causa 1: URL del email está cortando el token');
    console.log('   → El enlace en el email no contiene el token completo\n');

    console.log('❌ Causa 2: Frontend está cortando el token de la URL');
    console.log('   → useSearchParams() o window.location no captura el token completo\n');

    console.log('❌ Causa 3: Servidor web está truncando URLs largas');
    console.log('   → Configuración de servidor limitando longitud de URL\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SOLUCIONES:\n');

    console.log('1. Verificar el enlace completo en el email');
    console.log('   → Abrir el email y copiar la URL completa');
    console.log('   → Verificar que el parámetro token= tiene 64 caracteres\n');

    console.log('2. Verificar logs del backend cuando se genera el token');
    console.log('   → Buscar: "[GENERATE RESET TOKEN] Token generado exitosamente"');
    console.log('   → Confirmar que se guarda correctamente en BD\n');

    console.log('3. Probar con un token manualmente');
    console.log('   → Solicitar recuperación de contraseña');
    console.log('   → Revisar en BD el token completo');
    console.log('   → Construir URL manualmente y probar\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

    // 6. Generar un email de prueba y mostrar la URL
    console.log('5️⃣ Generando Email de Prueba:\n');
    
    const testEmail = 'test@example.com';
    const nombre = 'Usuario Test';
    const resetToken = crypto.randomBytes(32).toString('hex');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/admin/reset-password?token=${resetToken}`;

    console.log(`   Email: ${testEmail}`);
    console.log(`   Nombre: ${nombre}`);
    console.log(`   Token generado: ${resetToken}`);
    console.log(`   Longitud del token: ${resetToken.length} caracteres`);
    console.log(`   URL completa: ${resetUrl}`);
    console.log(`   Longitud de la URL: ${resetUrl.length} caracteres\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('1. Solicita recuperación de contraseña desde el frontend');
    console.log('2. Revisa los logs del servidor backend');
    console.log('3. Abre el email y copia la URL completa');
    console.log('4. Verifica que el token tenga 64 caracteres');
    console.log('5. Si el token es más corto, hay un problema en la generación del email');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar diagnóstico
debugTokenIssue();

