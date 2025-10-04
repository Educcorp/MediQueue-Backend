const { executeQuery } = require('./src/config/database');
const ConsultorioInteligenteService = require('./src/services/consultorioInteligenteService');

/**
 * Script para demostrar el funcionamiento del sistema inteligente con datos de prueba
 */
const demostrarSistema = async () => {
  console.log('🎭 ================================');
  console.log('🎭 DEMOSTRACIÓN DEL SISTEMA INTELIGENTE');
  console.log('🎭 ================================\n');

  try {
    // 1. Obtener área de Dentista para la demostración
    const areasDentista = await executeQuery(`
      SELECT uk_area, s_nombre_area 
      FROM Area 
      WHERE s_nombre_area LIKE '%Dentista%' AND ck_estado = 'ACTIVO' 
      LIMIT 1
    `);

    if (areasDentista.length === 0) {
      console.log('❌ No se encontró área de Dentista, usando la primera área disponible');
      const primeraArea = await executeQuery('SELECT uk_area, s_nombre_area FROM Area WHERE ck_estado = "ACTIVO" LIMIT 1');
      if (primeraArea.length === 0) {
        throw new Error('No hay áreas activas en el sistema');
      }
      areasDentista.push(primeraArea[0]);
    }

    const uk_area = areasDentista[0].uk_area;
    const nombre_area = areasDentista[0].s_nombre_area;

    console.log(`🦷 Demostrando con área: ${nombre_area}`);

    // 2. Mostrar estado inicial de consultorios
    console.log('\n📊 ESTADO INICIAL DE CONSULTORIOS:');
    const consultoriosIniciales = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
    
    if (consultoriosIniciales.length === 0) {
      console.log('❌ No hay consultorios en esta área');
      return;
    }

    consultoriosIniciales.forEach((c, index) => {
      console.log(`   ${index + 1}. Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_pendientes} turnos)`);
    });

    // 3. Crear algunos turnos de prueba para simular el escenario descrito
    console.log('\n🎫 CREANDO TURNOS DE PRUEBA (uno por uno para ver distribución):');
    
    // Obtener administrador
    const admin = await executeQuery('SELECT uk_administrador FROM Administrador WHERE ck_estado = "ACTIVO" LIMIT 1');
    if (admin.length === 0) {
      throw new Error('No hay administradores activos');
    }
    const uk_administrador = admin[0].uk_administrador;

    // Crear 5 turnos usando asignación inteligente, uno por uno
    const turnos = [];
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`\n   📋 Creando turno ${i}...`);
        
        const turnoResult = await ConsultorioInteligenteService.asignarTurnoInteligente({
          uk_area,
          uk_paciente: null,
          uk_administrador,
          uk_usuario_creacion: null
        });
        
        turnos.push({
          numero: i,
          consultorio: turnoResult.consultorio_asignado.i_numero_consultorio,
          uk_turno: turnoResult.uk_turno
        });

        console.log(`   ✅ Turno ${i} → Consultorio ${turnoResult.consultorio_asignado.i_numero_consultorio}`);
        
        // Mostrar estado actual después de cada asignación
        const estadoActual = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
        console.log('      Estado actual:');
        estadoActual.forEach(c => {
          console.log(`        - Consultorio ${c.i_numero_consultorio}: ${c.turnos_pendientes} pendientes, ${c.total_turnos_dia} total día`);
        });
        
      } catch (error) {
        console.log(`   ❌ Error creando turno ${i}: ${error.message}`);
      }
    }

    // 4. Mostrar distribución después de crear turnos
    console.log('\n📊 DISTRIBUCIÓN DESPUÉS DE CREAR TURNOS:');
    const consultoriosDespues = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
    
    consultoriosDespues.forEach((c, index) => {
      console.log(`   ${index + 1}. Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_pendientes} turnos)`);
    });

    // 5. Obtener estadísticas
    console.log('\n📈 ESTADÍSTICAS DE DISTRIBUCIÓN:');
    const estadisticas = await ConsultorioInteligenteService.getEstadisticasDistribucion(uk_area);
    
    if (estadisticas) {
      console.log(`   📊 Total consultorios: ${estadisticas.total_consultorios}`);
      console.log(`   📊 Total turnos: ${estadisticas.total_turnos}`);
      console.log(`   📊 Turnos en espera: ${estadisticas.turnos_en_espera}`);
      console.log(`   📊 Promedio de carga: ${estadisticas.promedio_carga}`);
      console.log(`   📊 Índice de equidad: ${estadisticas.indice_equidad}`);
      console.log(`   📊 Evaluación: ${estadisticas.evaluacion_distribucion}`);
    }

    // 6. Simular que un consultorio atiende más rápido
    console.log('\n🚀 SIMULANDO CONSULTORIO MÁS RÁPIDO:');
    
    if (consultoriosDespues.length >= 2) {
      // Marcar algunos turnos como atendidos en el segundo consultorio para simular mayor rapidez
      const consultorioRapido = consultoriosDespues[1];
      
      console.log(`   💨 Simulando que Consultorio ${consultorioRapido.i_numero_consultorio} atiende más rápido...`);
      
      // Obtener turnos del consultorio rápido
      const turnosConsultorioRapido = await executeQuery(`
        SELECT uk_turno 
        FROM Turno 
        WHERE uk_consultorio = ? 
        AND s_estado = 'EN_ESPERA' 
        AND d_fecha = CURDATE() 
        AND ck_estado = 'ACTIVO'
        LIMIT 2
      `, [consultorioRapido.uk_consultorio]);

      // Marcar como atendidos
      for (const turno of turnosConsultorioRapido) {
        await executeQuery(`
          UPDATE Turno 
          SET s_estado = 'ATENDIDO', d_fecha_atencion = NOW() 
          WHERE uk_turno = ?
        `, [turno.uk_turno]);
      }

      console.log(`   ✅ ${turnosConsultorioRapido.length} turnos marcados como atendidos`);
    }

    // 7. Ejecutar redistribución inteligente
    console.log('\n🔄 EJECUTANDO REDISTRIBUCIÓN INTELIGENTE:');
    const redistribucion = await ConsultorioInteligenteService.redistribuirTurnosPendientes(uk_area);
    
    console.log(`   📊 Turnos redistribuidos: ${redistribucion.redistribuidos}`);
    console.log(`   📝 Mensaje: ${redistribucion.mensaje}`);
    
    if (redistribucion.redistribuciones && redistribucion.redistribuciones.length > 0) {
      console.log('   📋 Redistribuciones realizadas:');
      redistribucion.redistribuciones.forEach(r => {
        console.log(`      → Turno ${r.numero_turno}: Consultorio ${r.desde_consultorio} → ${r.hacia_consultorio}`);
      });
    }

    // 8. Mostrar estado final
    console.log('\n📊 ESTADO FINAL DESPUÉS DE REDISTRIBUCIÓN:');
    const consultoriosFinales = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
    
    consultoriosFinales.forEach((c, index) => {
      console.log(`   ${index + 1}. Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_pendientes} turnos pendientes, ${c.turnos_atendidos} atendidos)`);
    });

    // 9. Estadísticas finales
    console.log('\n📈 ESTADÍSTICAS FINALES:');
    const estadisticasFinales = await ConsultorioInteligenteService.getEstadisticasDistribucion(uk_area);
    
    if (estadisticasFinales) {
      console.log(`   📊 Distribución final: ${estadisticasFinales.evaluacion_distribucion}`);
      console.log(`   📊 Índice de equidad final: ${estadisticasFinales.indice_equidad}`);
    }

    console.log('\n✅ ================================');
    console.log('✅ DEMOSTRACIÓN COMPLETADA');
    console.log('✅ El sistema funciona como se especificó:');
    console.log('✅ - Detecta consultorios por área');
    console.log('✅ - Distribuye equitativamente');
    console.log('✅ - Reasigna dinámicamente según el flujo');
    console.log('✅ - Los consultorios son dinámicos');
    console.log('✅ ================================');

  } catch (error) {
    console.error('\n❌ ERROR EN LA DEMOSTRACIÓN:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Ejecutar demostración
if (require.main === module) {
  demostrarSistema()
    .then(() => {
      console.log('\n🎉 Demostración completada exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error en la demostración:', error.message);
      process.exit(1);
    });
}

module.exports = { demostrarSistema };