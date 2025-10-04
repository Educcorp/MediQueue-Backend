const { executeQuery } = require('../config/database');
const Consultorio = require('../models/Consultorio');
const Turno = require('../models/Turno');

/**
 * Servicio para la gestión inteligente de consultorios
 * Maneja la asignación dinámica, distribución equitativa y reasignación automática
 */
class ConsultorioInteligenteService {

  /**
   * Obtener fecha actual en formato consistente
   * @returns {string} Fecha en formato YYYY-MM-DD
   */
  static getFechaActual() {
    const now = new Date();
    return now.getFullYear() + '-' + 
           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
           String(now.getDate()).padStart(2, '0');
  }

  /**
   * Detectar consultorios disponibles por área médica
   * @param {string} uk_area - UUID del área médica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)
   * @returns {Array} Lista de consultorios con información de disponibilidad
   */
  static async getConsultoriosDisponiblesPorArea(uk_area, fecha = null) {
    const fechaCondicion = fecha || this.getFechaActual();
    
    console.log(`🔍 Consultando consultorios para área ${uk_area} en fecha ${fechaCondicion}`);
    
    const query = `
      SELECT 
        c.uk_consultorio,
        c.i_numero_consultorio,
        a.s_nombre_area,
        COUNT(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 END) as turnos_pendientes,
        COUNT(CASE WHEN t.s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        COUNT(t.uk_turno) as total_turnos_dia,
        AVG(CASE 
          WHEN t.s_estado = 'ATENDIDO' AND t.d_fecha_atencion IS NOT NULL THEN 
            TIMESTAMPDIFF(MINUTE, TIMESTAMP(t.d_fecha, t.t_hora), t.d_fecha_atencion)
          ELSE NULL 
        END) as tiempo_promedio_atencion,
        CASE 
          WHEN COUNT(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 END) = 0 THEN 'DISPONIBLE'
          ELSE 'OCUPADO'
        END as estado_disponibilidad,
        COUNT(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 END) as puntuacion_carga
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      LEFT JOIN Turno t ON c.uk_consultorio = t.uk_consultorio 
        AND t.d_fecha = ? 
        AND t.ck_estado = 'ACTIVO'
      WHERE c.uk_area = ? AND c.ck_estado = 'ACTIVO' AND a.ck_estado = 'ACTIVO'
      GROUP BY c.uk_consultorio, c.i_numero_consultorio, a.s_nombre_area
      ORDER BY puntuacion_carga ASC, total_turnos_dia ASC, c.i_numero_consultorio ASC
    `;

    const results = await executeQuery(query, [fechaCondicion, uk_area]);
    return results;
  }

  /**
   * Obtener el consultorio óptimo para asignar un nuevo turno con distribución equitativa REAL
   * @param {string} uk_area - UUID del área médica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional)
   * @returns {Object} Consultorio óptimo para asignación
   */
  static async getConsultorioOptimo(uk_area, fecha = null) {
    const consultoriosDisponibles = await this.getConsultoriosDisponiblesPorArea(uk_area, fecha);
    
    if (consultoriosDisponibles.length === 0) {
      throw new Error('No hay consultorios activos para el área especificada');
    }

    console.log('🔍 Consultorios disponibles para asignación:');
    consultoriosDisponibles.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.turnos_pendientes} pendientes, ${c.total_turnos_dia} total del día`);
    });

    // ESTRATEGIA 1: Buscar consultorios completamente libres (sin turnos pendientes)
    const consultoriosLibres = consultoriosDisponibles.filter(c => c.turnos_pendientes === 0);
    
    if (consultoriosLibres.length > 0) {
      // Entre los libres, elegir el que tenga menos turnos asignados en el día (distribución equitativa)
      consultoriosLibres.sort((a, b) => {
        if (a.total_turnos_dia !== b.total_turnos_dia) {
          return a.total_turnos_dia - b.total_turnos_dia;
        }
        return a.i_numero_consultorio - b.i_numero_consultorio; // Orden consistente como desempate
      });
      
      console.log(`✅ Consultorio libre seleccionado: ${consultoriosLibres[0].i_numero_consultorio} (${consultoriosLibres[0].total_turnos_dia} turnos del día)`);
      return consultoriosLibres[0];
    }

    // ESTRATEGIA 2: Si todos están ocupados, distribución equitativa por carga actual
    // Encontrar la carga mínima
    const cargaMinima = Math.min(...consultoriosDisponibles.map(c => c.turnos_pendientes));
    const consultoriosConCargaMinima = consultoriosDisponibles.filter(c => c.turnos_pendientes === cargaMinima);
    
    // Entre los de carga mínima, elegir el que tenga menos turnos del día
    consultoriosConCargaMinima.sort((a, b) => {
      if (a.total_turnos_dia !== b.total_turnos_dia) {
        return a.total_turnos_dia - b.total_turnos_dia;
      }
      return a.i_numero_consultorio - b.i_numero_consultorio;
    });
    
    console.log(`⚖️  Consultorio con menor carga seleccionado: ${consultoriosConCargaMinima[0].i_numero_consultorio} (${consultoriosConCargaMinima[0].turnos_pendientes} pendientes, ${consultoriosConCargaMinima[0].total_turnos_dia} del día)`);
    return consultoriosConCargaMinima[0];
  }

  /**
   * Asignar turno de manera inteligente
   * @param {Object} turnoData - Datos del turno
   * @returns {Object} Resultado de la asignación con información del consultorio
   */
  static async asignarTurnoInteligente(turnoData) {
    const { uk_area, uk_administrador, uk_paciente, uk_usuario_creacion } = turnoData;

    if (!uk_area) {
      throw new Error('El área médica es requerida para la asignación inteligente');
    }

    // Obtener consultorio óptimo
    const consultorioOptimo = await this.getConsultorioOptimo(uk_area);
    
    // Crear turno con el consultorio asignado
    const turnoCreado = await Turno.create({
      uk_consultorio: consultorioOptimo.uk_consultorio,
      uk_administrador,
      uk_paciente,
      uk_usuario_creacion
    });

    return {
      ...turnoCreado,
      consultorio_asignado: {
        uk_consultorio: consultorioOptimo.uk_consultorio,
        i_numero_consultorio: consultorioOptimo.i_numero_consultorio,
        s_nombre_area: consultorioOptimo.s_nombre_area,
        turnos_pendientes: consultorioOptimo.turnos_pendientes,
        estado_disponibilidad: consultorioOptimo.estado_disponibilidad
      }
    };
  }

  /**
   * Redistribuir turnos pendientes hacia consultorios más eficientes
   * @param {string} uk_area - UUID del área médica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional)
   * @returns {Object} Resultado de la redistribución
   */
  static async redistribuirTurnosPendientes(uk_area, fecha = null) {
    const fechaCondicion = fecha || this.getFechaActual();
    
    console.log(`🔄 Iniciando redistribución para área ${uk_area} en fecha ${fechaCondicion}`);
    
    // Obtener estado actual de consultorios
    const consultoriosDisponibles = await this.getConsultoriosDisponiblesPorArea(uk_area, fechaCondicion);
    
    if (consultoriosDisponibles.length < 2) {
      return { redistribuidos: 0, mensaje: 'Se necesitan al menos 2 consultorios para redistribuir' };
    }

    console.log('📊 Estado actual de consultorios:');
    consultoriosDisponibles.forEach(c => {
      console.log(`   - Consultorio ${c.i_numero_consultorio}: ${c.turnos_pendientes} pendientes`);
    });

    // Calcular carga promedio y identificar desequilibrios
    const totalTurnosPendientes = consultoriosDisponibles.reduce((sum, c) => sum + c.turnos_pendientes, 0);
    const cargaPromedio = totalTurnosPendientes / consultoriosDisponibles.length;
    
    console.log(`📊 Carga promedio: ${cargaPromedio.toFixed(2)} turnos por consultorio`);
    
    // Identificar consultorios que necesitan balanceo
    const consultoriosConExceso = consultoriosDisponibles.filter(c => c.turnos_pendientes > Math.ceil(cargaPromedio));
    const consultoriosConDeficit = consultoriosDisponibles.filter(c => c.turnos_pendientes < Math.floor(cargaPromedio));
    
    console.log(`🔍 Consultorios con exceso: ${consultoriosConExceso.map(c => `${c.i_numero_consultorio}(${c.turnos_pendientes})`).join(', ')}`);
    console.log(`🔍 Consultorios con déficit: ${consultoriosConDeficit.map(c => `${c.i_numero_consultorio}(${c.turnos_pendientes})`).join(', ')}`);

    if (consultoriosConExceso.length === 0 || consultoriosConDeficit.length === 0) {
      return { redistribuidos: 0, mensaje: 'No hay desequilibrio significativo para redistribuir' };
    }

    let redistribuidos = 0;
    const redistribuciones = [];

    // Redistribuir de consultorios con exceso hacia consultorios con déficit
    for (const consultorioExceso of consultoriosConExceso) {
      // Calcular cuántos turnos se pueden mover
      const exceso = consultorioExceso.turnos_pendientes - Math.ceil(cargaPromedio);
      const turnosAMover = Math.min(exceso, 2); // Máximo 2 turnos por ciclo para estabilidad
      
      if (turnosAMover <= 0) continue;
      
      console.log(`📤 Moviendo ${turnosAMover} turnos del Consultorio ${consultorioExceso.i_numero_consultorio}`);
      
      // Obtener turnos para redistribuir
      const turnosQuery = `
        SELECT uk_turno, i_numero_turno
        FROM Turno 
        WHERE uk_consultorio = ? 
        AND s_estado = 'EN_ESPERA' 
        AND ck_estado = 'ACTIVO'
        AND d_fecha = ?
        ORDER BY i_numero_turno ASC
        LIMIT ?
      `;
      
      const turnosParaRedistribuir = await executeQuery(turnosQuery, [
        consultorioExceso.uk_consultorio, 
        fechaCondicion,
        turnosAMover
      ]);

      // Distribuir entre consultorios con déficit
      for (let i = 0; i < turnosParaRedistribuir.length && i < consultoriosConDeficit.length; i++) {
        const turno = turnosParaRedistribuir[i];
        const consultorioDestino = consultoriosConDeficit[i % consultoriosConDeficit.length];
        
        console.log(`   📋 Moviendo turno ${turno.i_numero_turno} → Consultorio ${consultorioDestino.i_numero_consultorio}`);
        
        // Actualizar el turno para cambiar de consultorio
        const updateQuery = `
          UPDATE Turno 
          SET uk_consultorio = ?, 
              d_fecha_modificacion = NOW(),
              s_observaciones = CONCAT(
                COALESCE(s_observaciones, ''), 
                IF(s_observaciones IS NOT NULL AND s_observaciones != '', ' | ', ''),
                'Reasignado automáticamente desde Consultorio ${consultorioExceso.i_numero_consultorio} para balanceo de carga'
              )
          WHERE uk_turno = ?
        `;
        
        const updateResult = await executeQuery(updateQuery, [
          consultorioDestino.uk_consultorio, 
          turno.uk_turno
        ]);

        if (updateResult.affectedRows > 0) {
          redistribuidos++;
          redistribuciones.push({
            numero_turno: turno.i_numero_turno,
            desde_consultorio: consultorioExceso.i_numero_consultorio,
            hacia_consultorio: consultorioDestino.i_numero_consultorio
          });

          // Actualizar contadores locales
          consultorioDestino.turnos_pendientes++;
          
          // Si el consultorio destino ya no tiene déficit, removerlo de la lista
          if (consultorioDestino.turnos_pendientes >= Math.floor(cargaPromedio)) {
            const index = consultoriosConDeficit.indexOf(consultorioDestino);
            if (index > -1) consultoriosConDeficit.splice(index, 1);
          }
        }
      }
      
      // Si ya no hay consultorios con déficit, parar
      if (consultoriosConDeficit.length === 0) break;
    }

    console.log(`✅ Redistribución completada: ${redistribuidos} turnos movidos`);

    return {
      redistribuidos,
      redistribuciones,
      carga_promedio: cargaPromedio,
      mensaje: redistribuidos > 0 ? 
        `Se redistribuyeron ${redistribuidos} turnos para balancear la carga` : 
        'No se encontraron turnos para redistribuir'
    };
  }

  /**
   * Monitorear y reasignar automáticamente turnos según el flujo
   * Este método debe ejecutarse periódicamente
   * @param {string} uk_area - UUID del área médica (opcional, si no se especifica procesa todas las áreas)
   * @returns {Object} Resumen de reasignaciones realizadas
   */
  static async monitorearyReasignar(uk_area = null) {
    let areas = [];
    
    if (uk_area) {
      areas = [{ uk_area }];
    } else {
      // Obtener todas las áreas activas
      const areasQuery = 'SELECT uk_area FROM Area WHERE ck_estado = "ACTIVO"';
      areas = await executeQuery(areasQuery);
    }

    const resultados = [];

    for (const area of areas) {
      try {
        const redistribucion = await this.redistribuirTurnosPendientes(area.uk_area);
        
        if (redistribucion.redistribuidos > 0) {
          resultados.push({
            uk_area: area.uk_area,
            ...redistribucion
          });
        }
      } catch (error) {
        console.error(`Error redistribuyendo área ${area.uk_area}:`, error.message);
        resultados.push({
          uk_area: area.uk_area,
          error: error.message,
          redistribuidos: 0
        });
      }
    }

    return {
      areas_procesadas: areas.length,
      total_redistribuidos: resultados.reduce((sum, r) => sum + (r.redistribuidos || 0), 0),
      detalle_por_area: resultados
    };
  }

  /**
   * Obtener estadísticas de distribución por área
   * @param {string} uk_area - UUID del área médica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional)
   * @returns {Object} Estadísticas detalladas de distribución
   */
  static async getEstadisticasDistribucion(uk_area, fecha = null) {
    const fechaCondicion = fecha || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        a.s_nombre_area,
        COUNT(DISTINCT c.uk_consultorio) as total_consultorios,
        COUNT(t.uk_turno) as total_turnos,
        COUNT(CASE WHEN t.s_estado = 'EN_ESPERA' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN t.s_estado = 'LLAMANDO' THEN 1 END) as turnos_llamando,
        COUNT(CASE WHEN t.s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        ROUND(AVG(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 ELSE 0 END), 2) as promedio_carga,
        MIN(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 ELSE 0 END) as carga_minima,
        MAX(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 ELSE 0 END) as carga_maxima,
        ROUND(
          STDDEV(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 ELSE 0 END), 2
        ) as desviacion_carga
      FROM Area a
      JOIN Consultorio c ON a.uk_area = c.uk_area
      LEFT JOIN Turno t ON c.uk_consultorio = t.uk_consultorio 
        AND t.d_fecha = ? 
        AND t.ck_estado = 'ACTIVO'
      WHERE a.uk_area = ? AND a.ck_estado = 'ACTIVO' AND c.ck_estado = 'ACTIVO'
      GROUP BY a.uk_area, a.s_nombre_area
    `;

    const estadisticas = await executeQuery(query, [fechaCondicion, uk_area]);
    
    if (estadisticas.length === 0) {
      return null;
    }

    const stats = estadisticas[0];
    
    // Calcular índice de equidad (0 = perfectamente distribuido, 1 = máxima desigualdad)
    const indiceEquidad = stats.total_consultorios > 1 ? 
      (stats.desviacion_carga || 0) / Math.max(stats.promedio_carga, 1) : 0;

    return {
      ...stats,
      indice_equidad: Math.round(indiceEquidad * 100) / 100,
      evaluacion_distribucion: indiceEquidad < 0.3 ? 'EXCELENTE' : 
                               indiceEquidad < 0.6 ? 'BUENA' :
                               indiceEquidad < 1.0 ? 'REGULAR' : 'DEFICIENTE'
    };
  }

  /**
   * Forzar redistribución equitativa de todos los turnos pendientes
   * Útil para balancear completamente la carga cuando hay desequilibrios severos
   * @param {string} uk_area - UUID del área médica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional)
   * @returns {Object} Resultado de la redistribución forzada
   */
  static async redistribucionForzada(uk_area, fecha = null) {
    const fechaCondicion = fecha || new Date().toISOString().split('T')[0];
    
    // Obtener todos los turnos pendientes del área
    const turnosQuery = `
      SELECT t.uk_turno, t.i_numero_turno, t.uk_consultorio, c.i_numero_consultorio
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      WHERE c.uk_area = ? 
      AND t.s_estado = 'EN_ESPERA' 
      AND t.ck_estado = 'ACTIVO'
      AND t.d_fecha = ?
      ORDER BY t.i_numero_turno ASC
    `;
    
    const turnosPendientes = await executeQuery(turnosQuery, [uk_area, fechaCondicion]);
    
    if (turnosPendientes.length === 0) {
      return { redistribuidos: 0, mensaje: 'No hay turnos pendientes para redistribuir' };
    }

    // Obtener todos los consultorios activos del área
    const consultoriosActivos = await this.getConsultoriosDisponiblesPorArea(uk_area, fechaCondicion);
    
    if (consultoriosActivos.length === 0) {
      throw new Error('No hay consultorios activos en el área especificada');
    }

    let redistribuidos = 0;
    const redistribuciones = [];

    // Redistribuir turnos de manera equitativa (round-robin)
    for (let i = 0; i < turnosPendientes.length; i++) {
      const turno = turnosPendientes[i];
      const consultorioDestino = consultoriosActivos[i % consultoriosActivos.length];
      
      // Solo reasignar si el turno no está ya en el consultorio óptimo
      if (turno.uk_consultorio !== consultorioDestino.uk_consultorio) {
        const updateQuery = `
          UPDATE Turno 
          SET uk_consultorio = ?, 
              d_fecha_modificacion = NOW(),
              s_observaciones = CONCAT(
                COALESCE(s_observaciones, ''), 
                IF(s_observaciones IS NOT NULL AND s_observaciones != '', ' | ', ''),
                'Redistribuido automáticamente para balanceo equitativo'
              )
          WHERE uk_turno = ?
        `;
        
        const updateResult = await executeQuery(updateQuery, [
          consultorioDestino.uk_consultorio, 
          turno.uk_turno
        ]);

        if (updateResult.affectedRows > 0) {
          redistribuidos++;
          redistribuciones.push({
            numero_turno: turno.i_numero_turno,
            desde_consultorio: turno.i_numero_consultorio,
            hacia_consultorio: consultorioDestino.i_numero_consultorio
          });
        }
      }
    }

    return {
      redistribuidos,
      redistribuciones,
      total_turnos_procesados: turnosPendientes.length,
      mensaje: `Redistribución forzada completada: ${redistribuidos} turnos reasignados de ${turnosPendientes.length} procesados`
    };
  }
}

module.exports = ConsultorioInteligenteService;