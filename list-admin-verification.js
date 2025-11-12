/**
 * Script para listar todos los administradores y su estado de verificación
 * Uso: node list-admin-verification.js [--all | --verified | --unverified]
 */

require('dotenv').config();
const { executeQuery } = require('./src/config/database');

const listAdmins = async (filter = 'all') => {
  console.log('\n📋 LISTA DE ADMINISTRADORES - ESTADO DE VERIFICACIÓN\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    let query = `
      SELECT 
        uk_administrador,
        s_nombre,
        s_apellido,
        s_email,
        s_usuario,
        b_email_verified,
        ck_estado,
        d_fecha_creacion,
        d_fecha_modificacion
      FROM Administrador
    `;

    const params = [];

    // Aplicar filtros según el argumento
    if (filter === 'verified') {
      query += ' WHERE b_email_verified = TRUE';
      console.log('🔍 Filtro: Solo administradores con email verificado\n');
    } else if (filter === 'unverified') {
      query += ' WHERE b_email_verified = FALSE';
      console.log('🔍 Filtro: Solo administradores SIN verificar email\n');
    } else {
      console.log('🔍 Filtro: Todos los administradores\n');
    }

    query += ' ORDER BY d_fecha_creacion DESC';

    const admins = await executeQuery(query, params);

    if (admins.length === 0) {
      console.log('ℹ️  No se encontraron administradores con los criterios especificados.\n');
      process.exit(0);
    }

    console.log(`📊 Total de administradores: ${admins.length}\n`);
    console.log('─────────────────────────────────────────────────────────────────────\n');

    // Estadísticas
    const verified = admins.filter(a => a.b_email_verified).length;
    const unverified = admins.filter(a => !a.b_email_verified).length;
    const active = admins.filter(a => a.ck_estado === 'ACTIVO').length;

    console.log('📈 Estadísticas:');
    console.log(`   ✅ Verificados: ${verified}`);
    console.log(`   ❌ No Verificados: ${unverified}`);
    console.log(`   🟢 Activos: ${active}`);
    console.log('');
    console.log('─────────────────────────────────────────────────────────────────────\n');

    // Listar administradores
    admins.forEach((admin, index) => {
      const statusIcon = admin.b_email_verified ? '✅' : '❌';
      const stateIcon = admin.ck_estado === 'ACTIVO' ? '🟢' : '🔴';
      
      console.log(`${index + 1}. ${statusIcon} ${stateIcon} ${admin.s_nombre} ${admin.s_apellido}`);
      console.log(`   📧 Email: ${admin.s_email}`);
      console.log(`   👤 Usuario: ${admin.s_usuario}`);
      console.log(`   🔑 UUID: ${admin.uk_administrador.substring(0, 8)}...`);
      console.log(`   📅 Creado: ${admin.d_fecha_creacion}`);
      console.log(`   🔄 Modificado: ${admin.d_fecha_modificacion}`);
      console.log(`   📊 Estado: ${admin.ck_estado}`);
      console.log(`   ✉️  Verificado: ${admin.b_email_verified ? 'SÍ' : 'NO'}`);
      
      if (!admin.b_email_verified) {
        console.log(`   ⚠️  ACCIÓN REQUERIDA: Verificar email manualmente`);
        console.log(`   💡 Comando: node verify-admin-email.js ${admin.s_email}`);
      }
      
      console.log('');
    });

    console.log('─────────────────────────────────────────────────────────────────────\n');

    // Mostrar comandos útiles
    if (unverified > 0) {
      console.log('🔧 ACCIONES DISPONIBLES:\n');
      console.log('Para verificar un administrador específico:');
      console.log('   node verify-admin-email.js <email>\n');
      console.log('Para verificar TODOS los administradores no verificados:');
      console.log('   node verify-all-admins.js\n');
    }

  } catch (error) {
    console.error('\n❌ Error al listar administradores:');
    console.error('   ', error.message);
    console.error('\nDetalles del error:', error);
    console.log('');
    process.exit(1);
  }

  process.exit(0);
};

// Obtener filtro de los argumentos de línea de comandos
const arg = process.argv[2];
let filter = 'all';

if (arg === '--verified') {
  filter = 'verified';
} else if (arg === '--unverified' || arg === '--pending') {
  filter = 'unverified';
} else if (arg === '--all' || !arg) {
  filter = 'all';
} else {
  console.log('\n❌ Argumento no válido.');
  console.log('\n📖 Uso: node list-admin-verification.js [opción]');
  console.log('\nOpciones disponibles:');
  console.log('   --all         Mostrar todos los administradores (por defecto)');
  console.log('   --verified    Mostrar solo verificados');
  console.log('   --unverified  Mostrar solo no verificados\n');
  process.exit(1);
}

listAdmins(filter);
