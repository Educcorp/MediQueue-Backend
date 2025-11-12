/**
 * Script de diagnóstico para problemas de verificación de email
 * Verifica la configuración de la base de datos y el estado del sistema
 * Uso: node diagnose-email-verification.js
 */

require('dotenv').config();
const { executeQuery, testConnection } = require('./src/config/database');

const diagnose = async () => {
  console.log('\n🔍 DIAGNÓSTICO DEL SISTEMA DE VERIFICACIÓN DE EMAIL\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    database: false,
    tableExists: false,
    columnsCorrect: false,
    adminsExist: false,
    pendingVerifications: 0
  };

  try {
    // 1. Verificar conexión a la base de datos
    console.log('1️⃣  Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    results.database = dbConnected;

    if (dbConnected) {
      console.log('   ✅ Conexión exitosa\n');
    } else {
      console.log('   ❌ No se pudo conectar a la base de datos\n');
      console.log('⚠️  Verifica las siguientes variables de entorno:');
      console.log(`   MYSQL_HOST: ${process.env.MYSQL_HOST || 'NO CONFIGURADO'}`);
      console.log(`   MYSQL_PORT: ${process.env.MYSQL_PORT || 'NO CONFIGURADO'}`);
      console.log(`   MYSQL_USER: ${process.env.MYSQL_USER || 'NO CONFIGURADO'}`);
      console.log(`   MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '***' : 'NO CONFIGURADO'}`);
      console.log(`   MYSQL_DATABASE: ${process.env.MYSQL_DATABASE || 'NO CONFIGURADO'}\n`);
      return results;
    }

    // 2. Verificar que la tabla Administrador existe
    console.log('2️⃣  Verificando tabla Administrador...');
    try {
      const tableQuery = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? 
        AND table_name = 'Administrador'
      `;
      const tableResult = await executeQuery(tableQuery, [
        process.env.MYSQL_DATABASE || 'mediqueue'
      ]);

      if (tableResult[0].count > 0) {
        console.log('   ✅ Tabla Administrador existe\n');
        results.tableExists = true;
      } else {
        console.log('   ❌ Tabla Administrador NO existe\n');
        console.log('⚠️  Ejecuta el script setup-complete-database.sql para crear las tablas\n');
        return results;
      }
    } catch (error) {
      console.log('   ❌ Error al verificar tabla:', error.message, '\n');
      return results;
    }

    // 3. Verificar estructura de columnas
    console.log('3️⃣  Verificando estructura de la tabla...');
    try {
      const columnsQuery = `
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.columns
        WHERE table_schema = ?
        AND table_name = 'Administrador'
        AND COLUMN_NAME IN ('b_email_verified', 's_verification_token', 'd_verification_token_expires')
        ORDER BY COLUMN_NAME
      `;
      const columns = await executeQuery(columnsQuery, [
        process.env.MYSQL_DATABASE || 'mediqueue'
      ]);

      console.log('   Columnas encontradas:\n');
      
      const requiredColumns = {
        'b_email_verified': false,
        's_verification_token': false,
        'd_verification_token_expires': false
      };

      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}`);
        console.log(`     Tipo: ${col.DATA_TYPE}`);
        console.log(`     Nullable: ${col.IS_NULLABLE}`);
        console.log(`     Default: ${col.COLUMN_DEFAULT || 'NULL'}\n`);
        
        if (requiredColumns.hasOwnProperty(col.COLUMN_NAME)) {
          requiredColumns[col.COLUMN_NAME] = true;
        }
      });

      const allColumnsExist = Object.values(requiredColumns).every(v => v);
      
      if (allColumnsExist) {
        console.log('   ✅ Todas las columnas necesarias existen\n');
        results.columnsCorrect = true;
      } else {
        console.log('   ❌ Faltan columnas necesarias:\n');
        Object.entries(requiredColumns).forEach(([col, exists]) => {
          if (!exists) {
            console.log(`      - ${col}`);
          }
        });
        console.log('\n⚠️  Ejecuta el script add-email-verification.sql\n');
        return results;
      }
    } catch (error) {
      console.log('   ❌ Error al verificar columnas:', error.message, '\n');
      return results;
    }

    // 4. Verificar que existen administradores
    console.log('4️⃣  Verificando administradores en el sistema...');
    try {
      const countQuery = `SELECT COUNT(*) as total FROM Administrador`;
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      if (total > 0) {
        console.log(`   ✅ Total de administradores: ${total}\n`);
        results.adminsExist = true;
      } else {
        console.log('   ⚠️  No hay administradores registrados\n');
        return results;
      }
    } catch (error) {
      console.log('   ❌ Error al contar administradores:', error.message, '\n');
      return results;
    }

    // 5. Estadísticas de verificación
    console.log('5️⃣  Estadísticas de verificación de email...\n');
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN b_email_verified = TRUE THEN 1 ELSE 0 END) as verificados,
          SUM(CASE WHEN b_email_verified = FALSE THEN 1 ELSE 0 END) as no_verificados,
          SUM(CASE WHEN ck_estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
          SUM(CASE WHEN s_verification_token IS NOT NULL THEN 1 ELSE 0 END) as con_token
        FROM Administrador
      `;
      const stats = await executeQuery(statsQuery);
      const s = stats[0];

      console.log('   📊 Estadísticas Generales:');
      console.log(`      Total: ${s.total}`);
      console.log(`      Verificados: ${s.verificados} (${Math.round(s.verificados/s.total*100)}%)`);
      console.log(`      No Verificados: ${s.no_verificados} (${Math.round(s.no_verificados/s.total*100)}%)`);
      console.log(`      Activos: ${s.activos}`);
      console.log(`      Con Token: ${s.con_token}\n`);

      results.pendingVerifications = parseInt(s.no_verificados);

      if (s.no_verificados > 0) {
        console.log('   ⚠️  Hay administradores pendientes de verificación\n');
        
        // Listar administradores no verificados
        const pendingQuery = `
          SELECT 
            s_email,
            s_nombre,
            s_apellido,
            ck_estado,
            d_fecha_creacion,
            s_verification_token IS NOT NULL as tiene_token
          FROM Administrador
          WHERE b_email_verified = FALSE
          ORDER BY d_fecha_creacion DESC
          LIMIT 5
        `;
        const pending = await executeQuery(pendingQuery);

        console.log('   📋 Administradores no verificados (máximo 5):');
        pending.forEach((admin, i) => {
          console.log(`\n   ${i+1}. ${admin.s_nombre} ${admin.s_apellido}`);
          console.log(`      Email: ${admin.s_email}`);
          console.log(`      Estado: ${admin.ck_estado}`);
          console.log(`      Creado: ${admin.d_fecha_creacion}`);
          console.log(`      Token: ${admin.tiene_token ? 'Sí' : 'No'}`);
        });
        console.log('');

      } else {
        console.log('   ✅ Todos los administradores están verificados\n');
      }
    } catch (error) {
      console.log('   ❌ Error al obtener estadísticas:', error.message, '\n');
      return results;
    }

    // 6. Verificar permisos de UPDATE
    console.log('6️⃣  Verificando permisos de UPDATE...');
    try {
      const testQuery = `
        UPDATE Administrador 
        SET d_fecha_modificacion = d_fecha_modificacion
        WHERE 1=0
      `;
      await executeQuery(testQuery);
      console.log('   ✅ El usuario tiene permisos de UPDATE\n');
    } catch (error) {
      console.log('   ❌ Error: El usuario NO tiene permisos de UPDATE');
      console.log(`      ${error.message}\n`);
      console.log('⚠️  Contacta al administrador de la base de datos para otorgar permisos\n');
      return results;
    }

    // 7. Verificar tokens expirados
    console.log('7️⃣  Verificando tokens expirados...');
    try {
      const expiredQuery = `
        SELECT COUNT(*) as expired
        FROM Administrador
        WHERE s_verification_token IS NOT NULL
        AND d_verification_token_expires < NOW()
      `;
      const expiredResult = await executeQuery(expiredQuery);
      const expiredCount = expiredResult[0].expired;

      if (expiredCount > 0) {
        console.log(`   ⚠️  Hay ${expiredCount} token(s) expirado(s)\n`);
        console.log('   💡 Puedes limpiarlos con:');
        console.log('      SQL: UPDATE Administrador SET s_verification_token = NULL WHERE d_verification_token_expires < NOW()\n');
      } else {
        console.log('   ✅ No hay tokens expirados\n');
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo verificar tokens expirados:', error.message, '\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:');
    console.error('   ', error.message);
    console.error('\nStack trace:', error.stack);
    console.log('');
  }

  // Resumen final
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 RESUMEN DEL DIAGNÓSTICO\n');
  console.log(`   Base de datos: ${results.database ? '✅' : '❌'}`);
  console.log(`   Tabla existe: ${results.tableExists ? '✅' : '❌'}`);
  console.log(`   Columnas correctas: ${results.columnsCorrect ? '✅' : '❌'}`);
  console.log(`   Administradores existen: ${results.adminsExist ? '✅' : '❌'}`);
  console.log(`   Pendientes de verificación: ${results.pendingVerifications}`);
  console.log('');

  // Recomendaciones
  if (results.pendingVerifications > 0) {
    console.log('💡 ACCIONES RECOMENDADAS:\n');
    console.log('   Para listar administradores no verificados:');
    console.log('      node list-admin-verification.js --unverified\n');
    console.log('   Para verificar uno específico:');
    console.log('      node verify-admin-email.js <email>\n');
    console.log('   Para verificar todos:');
    console.log('      node verify-all-admins.js\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(0);
};

diagnose();
