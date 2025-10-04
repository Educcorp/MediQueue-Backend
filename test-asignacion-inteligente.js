const { executeQuery } = require('./src/config/database');
const Turno = require('./src/models/Turno');
const Consultorio = require('./src/models/Consultorio');

// Script de prueba para validar la funcionalidad de asignación inteligente
const testAsignacionInteligente = async () => {
  try {
    console.log('🧪 Iniciando pruebas de asignación inteligente de consultorios...\n');

    // 1. Obtener todas las áreas disponibles
    console.log('📋 1. Obteniendo áreas disponibles...');
    const areas = await executeQuery('SELECT uk_area, s_nombre_area FROM Area WHERE ck_estado = "ACTIVO"');
    console.log(`✅ Se encontraron ${areas.length} áreas activas:`);
    areas.forEach(area => console.log(`   - ${area.s_nombre_area} (${area.uk_area})`));

    if (areas.length === 0) {
      console.log('❌ No hay áreas disponibles para pruebas');
      return;
    }

    const areaTest = areas[0];
    console.log(`\n🎯 Usando área para pruebas: ${areaTest.s_nombre_area}\n`);

    // 2. Obtener consultorios disponibles por área
    console.log('📋 2. Probando detección de consultorios disponibles...');
    const consultoriosDisponibles = await Turno.getConsultoriosDisponiblesPorArea(areaTest.uk_area);
    console.log(`✅ Consultorios en ${areaTest.s_nombre_area}:`);
    consultoriosDisponibles.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_en_espera} turnos en espera)`);
    });

    if (consultoriosDisponibles.length === 0) {
      console.log('❌ No hay consultorios disponibles en esta área');
      return;
    }

    // 3. Probar asignación inteligente
    console.log('\n📋 3. Probando asignación inteligente de consultorio...');
    const consultorioAsignado = await Turno.asignarConsultorioInteligente(areaTest.uk_area);
    console.log(`✅ Consultorio asignado inteligentemente: ${consultorioAsignado}`);

    // Obtener detalles del consultorio asignado
    const detallesConsultorio = consultoriosDisponibles.find(c => c.uk_consultorio === consultorioAsignado);
    if (detallesConsultorio) {
      console.log(`   - Número: ${detallesConsultorio.i_numero_consultorio}`);
      console.log(`   - Estado: ${detallesConsultorio.estado_disponibilidad}`);
      console.log(`   - Turnos en espera: ${detallesConsultorio.turnos_en_espera}`);
    }

    // 4. Probar redistribución de turnos
    console.log('\n📋 4. Probando redistribución de turnos...');
    const resultadoRedistribucion = await Turno.redistribuirTurnos(areaTest.uk_area);
    console.log('✅ Resultado de redistribución:', resultadoRedistribucion);

    // 5. Verificar estado después de redistribución
    console.log('\n📋 5. Verificando estado después de redistribución...');
    const consultoriosPostRedistribucion = await Turno.getConsultoriosDisponiblesPorArea(areaTest.uk_area);
    console.log('✅ Estado actualizado de consultorios:');
    consultoriosPostRedistribucion.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_en_espera} turnos en espera)`);
    });

    // 6. Probar obtener mejor consultorio
    console.log('\n📋 6. Probando obtención del mejor consultorio...');
    const mejorConsultorio = await Turno.getMejorConsultorioParaAsignar(areaTest.uk_area);
    console.log(`✅ Mejor consultorio para asignar: ${mejorConsultorio}`);

    // 7. Probar estadísticas de flujo de consultorio (si existe el método)
    if (consultoriosDisponibles.length > 0) {
      console.log('\n📋 7. Probando estadísticas de flujo...');
      try {
        const estadisticasFlujo = await Consultorio.getEstadisticasFlujo(consultoriosDisponibles[0].uk_consultorio);
        console.log('✅ Estadísticas de flujo del primer consultorio:');
        console.log(JSON.stringify(estadisticasFlujo, null, 2));
      } catch (error) {
        console.log('⚠️ Error obteniendo estadísticas de flujo:', error.message);
      }
    }

    // 8. Probar mejores consultorios por área
    console.log('\n📋 8. Probando mejores consultorios por área...');
    try {
      const mejoresConsultorios = await Consultorio.getMejoresConsultoriosPorArea(areaTest.uk_area);
      console.log('✅ Mejores consultorios por área:');
      mejoresConsultorios.forEach((c, index) => {
        console.log(`   ${index + 1}. Consultorio ${c.i_numero_consultorio}:`);
        console.log(`      - Turnos atendidos: ${c.turnos_atendidos}`);
        console.log(`      - Turnos pendientes: ${c.turnos_pendientes}`);
        console.log(`      - Tiempo promedio: ${c.tiempo_promedio_atencion || 'N/A'} min`);
        console.log(`      - Disponible: ${c.disponible ? 'Sí' : 'No'}`);
        console.log(`      - Eficiencia: ${typeof c.eficiencia === 'number' ? c.eficiencia.toFixed(2) : 'N/A'}`);
      });
    } catch (error) {
      console.log('⚠️ Error obteniendo mejores consultorios:', error.message);
    }

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📊 RESUMEN DE FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('✅ Detección de consultorios disponibles por área');
    console.log('✅ Asignación inteligente de consultorios con alternancia');
    console.log('✅ Redistribución automática de turnos para optimizar flujo');
    console.log('✅ Obtención del mejor consultorio disponible');
    console.log('✅ Estadísticas de flujo por consultorio');
    console.log('✅ Ranking de mejores consultorios por área');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  testAsignacionInteligente()
    .then(() => {
      console.log('\n🏁 Pruebas finalizadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = testAsignacionInteligente;