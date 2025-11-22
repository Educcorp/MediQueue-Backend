require('dotenv').config();
const { executeQuery } = require('./src/config/database');

/**
 * Script para diagnosticar problemas de zona horaria
 */
async function diagnoseTimezoneIssue() {
  try {
    console.log('🕐 Diagnosticando problema de zona horaria...\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Hora del sistema Node.js
    console.log('1️⃣ Hora del Sistema Node.js:\n');
    const nodeDate = new Date();
    console.log(`   Fecha/Hora actual: ${nodeDate}`);
    console.log(`   Timestamp: ${nodeDate.getTime()}`);
    console.log(`   ISO String: ${nodeDate.toISOString()}`);
    console.log(`   Timezone offset: ${nodeDate.getTimezoneOffset()} minutos`);
    console.log(`   Zona horaria local: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`);

    // 2. Hora de MySQL
    console.log('2️⃣ Hora de MySQL:\n');
    
    const mysqlTimeQuery = `
      SELECT 
        NOW() as mysql_now,
        UTC_TIMESTAMP() as mysql_utc,
        @@system_time_zone as system_timezone,
        @@time_zone as mysql_timezone,
        UNIX_TIMESTAMP(NOW()) as mysql_timestamp
    `;
    
    const mysqlTime = await executeQuery(mysqlTimeQuery);
    console.log(`   MySQL NOW(): ${mysqlTime[0].mysql_now}`);
    console.log(`   MySQL UTC: ${mysqlTime[0].mysql_utc}`);
    console.log(`   System timezone: ${mysqlTime[0].system_timezone}`);
    console.log(`   MySQL timezone: ${mysqlTime[0].mysql_timezone}`);
    console.log(`   MySQL timestamp: ${mysqlTime[0].mysql_timestamp}\n`);

    // 3. Comparar diferencia
    console.log('3️⃣ Comparación:\n');
    const nodeDateMysqlFormat = nodeDate.toISOString().slice(0, 19).replace('T', ' ');
    console.log(`   Node.js en formato MySQL: ${nodeDateMysqlFormat}`);
    console.log(`   MySQL NOW(): ${mysqlTime[0].mysql_now}`);
    
    const differenceQuery = `
      SELECT 
        TIMESTAMPDIFF(MINUTE, '${nodeDateMysqlFormat}', NOW()) as diff_minutes
    `;
    const diff = await executeQuery(differenceQuery);
    console.log(`   Diferencia: ${diff[0].diff_minutes} minutos\n`);

    if (Math.abs(diff[0].diff_minutes) > 60) {
      console.log('   ❌ ¡PROBLEMA DETECTADO!');
      console.log(`   Hay ${Math.abs(diff[0].diff_minutes)} minutos de diferencia entre Node.js y MySQL\n`);
    } else {
      console.log('   ✅ Las horas están sincronizadas\n');
    }

    // 4. Simular creación de token
    console.log('4️⃣ Simulación de Token:\n');
    
    // Calcular expiración como lo hace el código actual
    const expiryTime = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora desde ahora
    const expiryTimeStr = expiryTime.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`   Hora actual (Node.js): ${nodeDate.toISOString()}`);
    console.log(`   Hora de expiración calculada: ${expiryTime.toISOString()}`);
    console.log(`   Formato para MySQL: ${expiryTimeStr}\n`);

    // Ver cómo MySQL interpretaría esto
    const testQuery = `
      SELECT 
        '${expiryTimeStr}' as expiry_time,
        NOW() as current_time,
        '${expiryTimeStr}' > NOW() as is_valid,
        TIMESTAMPDIFF(MINUTE, NOW(), '${expiryTimeStr}') as minutes_until_expiry
    `;
    
    const testResult = await executeQuery(testQuery);
    console.log(`   MySQL interpretaría:`);
    console.log(`   - Hora de expiración: ${testResult[0].expiry_time}`);
    console.log(`   - Hora actual: ${testResult[0].current_time}`);
    console.log(`   - ¿Es válido?: ${testResult[0].is_valid ? 'SÍ' : 'NO'}`);
    console.log(`   - Minutos hasta expirar: ${testResult[0].minutes_until_expiry}\n`);

    // 5. Verificar tokens actuales
    console.log('5️⃣ Tokens en Base de Datos:\n');
    
    const tokensQuery = `
      SELECT 
        s_email,
        d_reset_password_expires,
        NOW() as current_time,
        d_reset_password_expires > NOW() as is_valid,
        TIMESTAMPDIFF(MINUTE, NOW(), d_reset_password_expires) as minutes_remaining
      FROM Administrador
      WHERE s_reset_password_token IS NOT NULL
      ORDER BY d_fecha_modificacion DESC
      LIMIT 3
    `;
    
    const tokens = await executeQuery(tokensQuery);
    
    if (tokens.length === 0) {
      console.log('   No hay tokens activos\n');
    } else {
      tokens.forEach((token, index) => {
        console.log(`   Token ${index + 1} (${token.s_email}):`);
        console.log(`   - Expira: ${token.d_reset_password_expires}`);
        console.log(`   - Ahora: ${token.current_time}`);
        console.log(`   - Válido: ${token.is_valid ? 'SÍ ✓' : 'NO ✗'}`);
        console.log(`   - Minutos restantes: ${token.minutes_remaining}\n`);
      });
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 DIAGNÓSTICO:\n');

    if (Math.abs(diff[0].diff_minutes) > 60) {
      console.log('❌ PROBLEMA DE ZONA HORARIA DETECTADO\n');
      console.log('Causa: Node.js y MySQL están en zonas horarias diferentes\n');
      console.log('Soluciones:\n');
      console.log('1. Configurar MySQL para usar la misma zona horaria que el sistema');
      console.log('2. Usar UTC en todas partes');
      console.log('3. Ajustar la conexión de MySQL para convertir zonas horarias\n');
    } else {
      console.log('✅ No hay problema de zona horaria\n');
      console.log('Los tokens deberían funcionar correctamente\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseTimezoneIssue();

