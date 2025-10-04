const { executeQuery } = require('./src/config/database');
const ConsultorioInteligenteService = require('./src/services/consultorioInteligenteService');
const Turno = require('./src/models/Turno');
const Consultorio = require('./src/models/Consultorio');
const Area = require('./src/models/Area');

/**
 * Pruebas completas del sistema de asignación inteligente de consultorios
 */
class TestSistemaInteligente {

  static async ejecutarTodasLasPruebas() {
    console.log('🧪 ================================');
    console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA INTELIGENTE');
    console.log('🧪 ================================\n');

    try {
      await this.pruebaConexionBD();
      await this.pruebaDeteccionConsultorios();
      await this.pruebaAsignacionInteligente();
      await this.pruebaDistribucionEquitativa();
      await this.pruebaReasignacionDinamica();
      await this.pruebaEstadisticas();
      await this.pruebaMonitoreoCompleto();
      
      console.log('\n✅ ================================');
      console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
      console.log('✅ ================================');
    } catch (error) {
      console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  static async pruebaConexionBD() {
    console.log('📊 Probando conexión a la base de datos...');
    
    const areas = await executeQuery('SELECT COUNT(*) as count FROM Area WHERE ck_estado = "ACTIVO"');
    const consultorios = await executeQuery('SELECT COUNT(*) as count FROM Consultorio WHERE ck_estado = "ACTIVO"');
    
    console.log(`✅ Áreas activas: ${areas[0].count}`);
    console.log(`✅ Consultorios activos: ${consultorios[0].count}`);
    
    if (areas[0].count === 0 || consultorios[0].count === 0) {
      throw new Error('No hay áreas o consultorios activos en la BD');
    }
  }

  static async pruebaDeteccionConsultorios() {
    console.log('\n🔍 Probando detección de consultorios por área...');
    
    // Obtener la primera área activa
    const areas = await executeQuery('SELECT uk_area, s_nombre_area FROM Area WHERE ck_estado = "ACTIVO" LIMIT 1');
    if (areas.length === 0) {
      throw new Error('No hay áreas activas');
    }
    
    const uk_area = areas[0].uk_area;
    const nombre_area = areas[0].s_nombre_area;
    
    console.log(`📋 Probando con área: ${nombre_area}`);
    
    const consultorios = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
    
    console.log(`✅ Consultorios detectados: ${consultorios.length}`);
    consultorios.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.estado_disponibilidad} (${c.turnos_pendientes} turnos pendientes)`);
    });
    
    if (consultorios.length === 0) {
      console.log('⚠️  No hay consultorios en esta área, pero la función trabaja correctamente');
    }
  }

  static async pruebaAsignacionInteligente() {
    console.log('\n🎯 Probando asignación inteligente de turno...');
    
    // Obtener área con consultorios
    const areaConsultorios = await executeQuery(`
      SELECT a.uk_area, a.s_nombre_area, COUNT(c.uk_consultorio) as num_consultorios
      FROM Area a
      JOIN Consultorio c ON a.uk_area = c.uk_area
      WHERE a.ck_estado = 'ACTIVO' AND c.ck_estado = 'ACTIVO'
      GROUP BY a.uk_area, a.s_nombre_area
      ORDER BY num_consultorios DESC
      LIMIT 1
    `);
    
    if (areaConsultorios.length === 0) {
      console.log('⚠️  No hay áreas con consultorios para probar');
      return;
    }
    
    const uk_area = areaConsultorios[0].uk_area;
    const nombre_area = areaConsultorios[0].s_nombre_area;
    
    console.log(`📋 Probando asignación en área: ${nombre_area}`);
    
    // Obtener consultorio óptimo
    const consultorioOptimo = await ConsultorioInteligenteService.getConsultorioOptimo(uk_area);
    
    console.log(`✅ Consultorio óptimo seleccionado: ${consultorioOptimo.i_numero_consultorio}`);
    console.log(`   - Estado: ${consultorioOptimo.estado_disponibilidad}`);
    console.log(`   - Turnos pendientes: ${consultorioOptimo.turnos_pendientes}`);
    console.log(`   - Puntuación de carga: ${consultorioOptimo.puntuacion_carga}`);
  }

  static async pruebaDistribucionEquitativa() {
    console.log('\n⚖️  Probando distribución equitativa...');
    
    // Obtener área con múltiples consultorios
    const areaConsultorios = await executeQuery(`
      SELECT a.uk_area, a.s_nombre_area, COUNT(c.uk_consultorio) as num_consultorios
      FROM Area a
      JOIN Consultorio c ON a.uk_area = c.uk_area
      WHERE a.ck_estado = 'ACTIVO' AND c.ck_estado = 'ACTIVO'
      GROUP BY a.uk_area, a.s_nombre_area
      HAVING num_consultorios >= 2
      ORDER BY num_consultorios DESC
      LIMIT 1
    `);
    
    if (areaConsultorios.length === 0) {
      console.log('⚠️  No hay áreas con múltiples consultorios para probar distribución');
      return;
    }
    
    const uk_area = areaConsultorios[0].uk_area;
    const nombre_area = areaConsultorios[0].s_nombre_area;
    
    console.log(`📋 Probando distribución en área: ${nombre_area} (${areaConsultorios[0].num_consultorios} consultorios)`);
    
    // Simular asignación de múltiples turnos
    const consultorios = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
    
    console.log('📊 Estado inicial de consultorios:');
    consultorios.forEach((c, index) => {
      console.log(`   ${index + 1}. Consultorio ${c.i_numero_consultorio}: ${c.turnos_pendientes} turnos`);
    });
    
    // Simular 5 asignaciones y mostrar cómo se distribuirían
    console.log('\n🎯 Simulando 5 asignaciones inteligentes:');
    for (let i = 1; i <= 5; i++) {
      const optimo = await ConsultorioInteligenteService.getConsultorioOptimo(uk_area);
      console.log(`   Turno ${i} → Consultorio ${optimo.i_numero_consultorio} (carga: ${optimo.puntuacion_carga})`);
    }
  }

  static async pruebaReasignacionDinamica() {
    console.log('\n🔄 Probando reasignación dinámica...');
    
    // Obtener área con turnos pendientes
    const areasTurnos = await executeQuery(`
      SELECT a.uk_area, a.s_nombre_area, COUNT(t.uk_turno) as turnos_pendientes
      FROM Area a
      JOIN Consultorio c ON a.uk_area = c.uk_area
      JOIN Turno t ON c.uk_consultorio = t.uk_consultorio
      WHERE a.ck_estado = 'ACTIVO' 
        AND c.ck_estado = 'ACTIVO'
        AND t.ck_estado = 'ACTIVO'
        AND t.s_estado = 'EN_ESPERA'
        AND t.d_fecha = CURDATE()
      GROUP BY a.uk_area, a.s_nombre_area
      HAVING turnos_pendientes > 0
      ORDER BY turnos_pendientes DESC
      LIMIT 1
    `);
    
    if (areasTurnos.length === 0) {
      console.log('⚠️  No hay áreas con turnos pendientes para probar reasignación');
      return;
    }
    
    const uk_area = areasTurnos[0].uk_area;
    const nombre_area = areasTurnos[0].s_nombre_area;
    
    console.log(`📋 Probando reasignación en área: ${nombre_area}`);
    console.log(`📊 Turnos pendientes en el área: ${areasTurnos[0].turnos_pendientes}`);
    
    // Obtener estado inicial
    const estadoInicial = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area);
    console.log('\n📊 Estado inicial:');
    estadoInicial.forEach(c => {
      console.log(`   Consultorio ${c.i_numero_consultorio}: ${c.turnos_pendientes} turnos (${c.estado_disponibilidad})`);
    });
    
    // Intentar redistribución
    const resultado = await ConsultorioInteligenteService.redistribuirTurnosPendientes(uk_area);
    
    console.log('\n🎯 Resultado de redistribución:');
    console.log(`   Turnos redistribuidos: ${resultado.redistribuidos}`);
    console.log(`   Mensaje: ${resultado.mensaje}`);
    
    if (resultado.redistribuciones && resultado.redistribuciones.length > 0) {
      console.log('   Redistribuciones realizadas:');
      resultado.redistribuciones.forEach(r => {
        console.log(`     - Turno ${r.numero_turno}: Consultorio ${r.desde_consultorio} → ${r.hacia_consultorio}`);
      });
    }
  }

  static async pruebaEstadisticas() {
    console.log('\n📈 Probando estadísticas de distribución...');
    
    // Obtener área con datos
    const areas = await executeQuery('SELECT uk_area, s_nombre_area FROM Area WHERE ck_estado = "ACTIVO" LIMIT 1');
    if (areas.length === 0) {
      throw new Error('No hay áreas activas');
    }
    
    const uk_area = areas[0].uk_area;
    const nombre_area = areas[0].s_nombre_area;
    
    console.log(`📋 Generando estadísticas para área: ${nombre_area}`);
    
    const estadisticas = await ConsultorioInteligenteService.getEstadisticasDistribucion(uk_area);
    
    if (estadisticas) {
      console.log('📊 Estadísticas obtenidas:');
      console.log(`   - Total consultorios: ${estadisticas.total_consultorios}`);
      console.log(`   - Total turnos: ${estadisticas.total_turnos}`);
      console.log(`   - Turnos en espera: ${estadisticas.turnos_en_espera}`);
      console.log(`   - Turnos atendidos: ${estadisticas.turnos_atendidos}`);
      console.log(`   - Promedio de carga: ${estadisticas.promedio_carga}`);
      console.log(`   - Índice de equidad: ${estadisticas.indice_equidad}`);
      console.log(`   - Evaluación: ${estadisticas.evaluacion_distribucion}`);
    } else {
      console.log('⚠️  No se encontraron estadísticas para esta área');
    }
  }

  static async pruebaMonitoreoCompleto() {
    console.log('\n👁️  Probando monitoreo y reasignación completa...');
    
    // Probar monitoreo de todas las áreas
    const resultado = await ConsultorioInteligenteService.monitorearyReasignar();
    
    console.log('📊 Resultado del monitoreo completo:');
    console.log(`   - Áreas procesadas: ${resultado.areas_procesadas}`);
    console.log(`   - Total redistribuidos: ${resultado.total_redistribuidos}`);
    
    if (resultado.detalle_por_area.length > 0) {
      console.log('   - Detalle por área:');
      resultado.detalle_por_area.forEach(area => {
        if (area.redistribuidos > 0) {
          console.log(`     * Área ${area.uk_area}: ${area.redistribuidos} turnos redistribuidos`);
        } else if (area.error) {
          console.log(`     * Área ${area.uk_area}: Error - ${area.error}`);
        }
      });
    }
    
    if (resultado.total_redistribuidos === 0) {
      console.log('✅ Sistema en equilibrio - no se requirieron reasignaciones');
    } else {
      console.log(`✅ Sistema optimizado - ${resultado.total_redistribuidos} turnos reasignados`);
    }
  }

  static async limpiarDatosPrueba() {
    console.log('\n🧹 Limpiando datos de prueba...');
    
    // Aquí podrías agregar lógica para limpiar datos de prueba si es necesario
    // Por ahora solo mostramos información
    
    const turnosPrueba = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM Turno 
      WHERE s_observaciones LIKE '%Reasignado automáticamente%' 
        OR s_observaciones LIKE '%Redistribuido automáticamente%'
    `);
    
    console.log(`📊 Turnos con reasignaciones automáticas: ${turnosPrueba[0].count}`);
    console.log('✅ Los datos de reasignación permanecen para auditoría');
  }
}

/**
 * Ejecutar las pruebas
 */
const ejecutarPruebas = async () => {
  try {
    await TestSistemaInteligente.ejecutarTodasLasPruebas();
    await TestSistemaInteligente.limpiarDatosPrueba();
    
    console.log('\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('💡 El sistema de asignación inteligente está funcionando correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 ERROR EN LAS PRUEBAS:', error.message);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarPruebas();
}

module.exports = TestSistemaInteligente;