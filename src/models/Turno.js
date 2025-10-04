const { executeQuery } = require('../config/database');

class Turno {
  constructor(data) {
    this.uk_turno = data.uk_turno;
    this.i_numero_turno = data.i_numero_turno;
    this.s_estado = data.s_estado;
    this.d_fecha = data.d_fecha;
    this.t_hora = data.t_hora;
    this.uk_paciente = data.uk_paciente;
    this.uk_consultorio = data.uk_consultorio;
    this.uk_administrador = data.uk_administrador;
    this.s_observaciones = data.s_observaciones;
    this.d_fecha_atencion = data.d_fecha_atencion;
    this.d_fecha_cancelacion = data.d_fecha_cancelacion;
    this.ck_estado = data.ck_estado || 'ACTIVO';
    this.d_fecha_creacion = data.d_fecha_creacion;
    this.d_fecha_modificacion = data.d_fecha_modificacion;
    this.uk_usuario_creacion = data.uk_usuario_creacion;
    this.uk_usuario_modificacion = data.uk_usuario_modificacion;

    // Campos adicionales para JOINs
    this.s_nombre_paciente = data.s_nombre_paciente;
    this.s_apellido_paciente = data.s_apellido_paciente;
    this.c_telefono_paciente = data.c_telefono_paciente;
    this.i_numero_consultorio = data.i_numero_consultorio;
    this.s_nombre_area = data.s_nombre_area;
    this.s_nombre_administrador = data.s_nombre_administrador;
    this.s_apellido_administrador = data.s_apellido_administrador;
  }

  // Generar siguiente número de turno para el día por área
  static async getNextNumeroTurno(uk_area = null) {
    let query;
    let params;
    
    // Obtener fecha local actual usando la misma lógica que en create
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    console.log('📅 [NUMERO] Calculando para fecha (local):', today);
    
    if (uk_area) {
      // Generar número específico por área y día
      query = `
        SELECT COALESCE(MAX(t.i_numero_turno), 0) + 1 as next_numero 
        FROM Turno t
        JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
        WHERE c.uk_area = ? AND t.d_fecha = ? AND t.ck_estado = 'ACTIVO'
      `;
      params = [uk_area, today];
    } else {
      // Fallback: número global por día
      query = `
        SELECT COALESCE(MAX(i_numero_turno), 0) + 1 as next_numero 
        FROM Turno 
        WHERE d_fecha = ? AND ck_estado = 'ACTIVO'
      `;
      params = [today];
    }
    
    const result = await executeQuery(query, params);
    return result[0].next_numero;
  }

  // Crear nuevo turno
  static async create(turnoData) {
    const { uk_consultorio, uk_administrador, uk_paciente = null, uk_usuario_creacion } = turnoData;

    // Verificar que el consultorio existe y obtener su área
    const consultorioQuery = 'SELECT uk_consultorio, uk_area FROM Consultorio WHERE uk_consultorio = ? AND ck_estado = "ACTIVO"';
    const consultorioExists = await executeQuery(consultorioQuery, [uk_consultorio]);

    if (consultorioExists.length === 0) {
      throw new Error('El consultorio especificado no existe o está inactivo');
    }
    
    const uk_area = consultorioExists[0].uk_area;

    // Verificar que el administrador existe
    const adminQuery = 'SELECT uk_administrador FROM Administrador WHERE uk_administrador = ? AND ck_estado = "ACTIVO"';
    const adminExists = await executeQuery(adminQuery, [uk_administrador]);

    if (adminExists.length === 0) {
      throw new Error('El administrador especificado no existe o está inactivo');
    }

    // Si se proporciona paciente, verificar que existe
    if (uk_paciente) {
      const pacienteQuery = 'SELECT uk_paciente FROM Paciente WHERE uk_paciente = ? AND ck_estado = "ACTIVO"';
      const pacienteExists = await executeQuery(pacienteQuery, [uk_paciente]);

      if (pacienteExists.length === 0) {
        throw new Error('El paciente especificado no existe o está inactivo');
      }
    }

    // Generar número de turno por área
    const numeroTurno = await this.getNextNumeroTurno(uk_area);

    // Obtener fecha y hora actual en formato local (zona horaria local)
    const now = new Date();
    const fechaHoy = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0');
    const horaActual = String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0') + ':' + 
                      String(now.getSeconds()).padStart(2, '0');

    console.log('📅 [CREATE] Fecha del turno (local):', fechaHoy);
    console.log('🕒 [CREATE] Hora del turno (local):', horaActual);

    // Crear turno
    const query = `
      INSERT INTO Turno (
        i_numero_turno, s_estado, d_fecha, t_hora, 
        uk_paciente, uk_consultorio, uk_administrador, uk_usuario_creacion
      ) 
      VALUES (?, 'EN_ESPERA', ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [numeroTurno, fechaHoy, horaActual, uk_paciente, uk_consultorio, uk_administrador, uk_usuario_creacion]);
    
    // Para tablas con UUID como primary key, necesitamos obtener el UUID generado
    // Obtener el turno recién creado basado en el número de turno, fecha y consultorio
    const getCreatedTurnoQuery = `
      SELECT uk_turno FROM Turno 
      WHERE i_numero_turno = ? 
        AND d_fecha = ? 
        AND uk_consultorio = ? 
        AND ck_estado = 'ACTIVO'
      ORDER BY d_fecha_creacion DESC 
      LIMIT 1
    `;
    const createdTurnoResult = await executeQuery(getCreatedTurnoQuery, [numeroTurno, fechaHoy, uk_consultorio]);
    
    const uk_turno = createdTurnoResult.length > 0 ? createdTurnoResult[0].uk_turno : null;
    
    if (!uk_turno) {
      throw new Error('Error obteniendo el UUID del turno creado');
    }
    
    return {
      id: result.insertId,
      uk_turno: uk_turno,
      i_numero_turno: numeroTurno
    };
  }

  // Obtener todos los turnos con información detallada
  static async getAll(filters = {}) {
    let whereConditions = ['t.ck_estado = "ACTIVO"'];
    let params = [];

    // Aplicar filtros
    if (filters.fecha) {
      whereConditions.push('t.d_fecha = ?');
      params.push(filters.fecha);
    } else {
      // Por defecto mostrar solo turnos del día actual
      whereConditions.push('t.d_fecha = CURDATE()');
    }

    if (filters.estado) {
      whereConditions.push('t.s_estado = ?');
      params.push(filters.estado);
    }

    if (filters.uk_area) {
      whereConditions.push('a.uk_area = ?');
      params.push(filters.uk_area);
    }

    if (filters.uk_consultorio) {
      whereConditions.push('t.uk_consultorio = ?');
      params.push(filters.uk_consultorio);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const query = `
      SELECT 
        t.*,
        COALESCE(p.s_nombre, 'Paciente') as s_nombre_paciente,
        COALESCE(p.s_apellido, 'Invitado') as s_apellido_paciente,
        p.c_telefono as c_telefono_paciente,
        c.i_numero_consultorio,
        a.s_nombre_area,
        CONCAT(ad.s_nombre, ' ', ad.s_apellido) as s_nombre_administrador
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      JOIN Administrador ad ON t.uk_administrador = ad.uk_administrador
      ${whereClause}
      ORDER BY t.i_numero_turno ASC
    `;

    const results = await executeQuery(query, params);
    return results.map(turno => new Turno(turno));
  }

  // Obtener turno por UUID
  static async getById(uk_turno) {
    const query = `
      SELECT 
        t.*,
        COALESCE(p.s_nombre, 'Paciente') as s_nombre_paciente,
        COALESCE(p.s_apellido, 'Invitado') as s_apellido_paciente,
        p.c_telefono as c_telefono_paciente,
        c.i_numero_consultorio,
        a.s_nombre_area,
        COALESCE(CONCAT(COALESCE(ad.s_nombre, ''), ' ', COALESCE(ad.s_apellido, '')), 'Administrador') as s_nombre_administrador,
        ad.s_apellido as s_apellido_administrador
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      LEFT JOIN Administrador ad ON t.uk_administrador = ad.uk_administrador
      WHERE t.uk_turno = ?
    `;

    const results = await executeQuery(query, [uk_turno]);

    if (results.length === 0) {
      return null;
    }

    return new Turno(results[0]);
  }

  // Obtener turnos por paciente
  static async getByPaciente(uk_paciente) {
    const query = `
      SELECT 
        t.*,
        p.s_nombre as s_nombre_paciente,
        p.s_apellido as s_apellido_paciente,
        p.c_telefono as c_telefono_paciente,
        c.i_numero_consultorio,
        a.s_nombre_area,
        CONCAT(ad.s_nombre, ' ', ad.s_apellido) as s_nombre_administrador
      FROM Turno t
      JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      JOIN Administrador ad ON t.uk_administrador = ad.uk_administrador
      WHERE t.uk_paciente = ? AND t.ck_estado = 'ACTIVO'
      ORDER BY t.d_fecha DESC, t.t_hora DESC
    `;

    const results = await executeQuery(query, [uk_paciente]);
    return results.map(turno => new Turno(turno));
  }

  // Obtener turnos públicos (para pantalla de usuario)
  static async getTurnosPublicos() {
    const query = `
      SELECT 
        t.i_numero_turno,
        t.s_estado,
        t.d_fecha,
        COALESCE(p.s_nombre, 'Paciente') as s_nombre_paciente,
        COALESCE(p.s_apellido, 'Invitado') as s_apellido_paciente,
        c.i_numero_consultorio,
        a.s_nombre_area,
        a.s_letra,
        a.s_color,
        a.s_icono
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE t.d_fecha >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND t.s_estado IN ('EN_ESPERA', 'LLAMANDO') 
      AND t.ck_estado = 'ACTIVO'
      ORDER BY t.d_fecha DESC, t.i_numero_turno ASC
    `;

    const results = await executeQuery(query);
    return results;
  }

  // Actualizar estado del turno
  static async updateEstado(uk_turno, nuevoEstado, uk_usuario_modificacion) {
    const estadosValidos = ['EN_ESPERA', 'LLAMANDO', 'ATENDIDO', 'CANCELADO', 'NO_PRESENTE'];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado de turno no válido');
    }

    const query = `
      UPDATE Turno 
      SET s_estado = ?, 
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_turno = ?
    `;
    const result = await executeQuery(query, [nuevoEstado, uk_usuario_modificacion, uk_turno]);

    return result.affectedRows > 0;
  }

  // Llamar siguiente turno en cola
  static async llamarSiguienteTurno(uk_consultorio) {
    // Primero cambiar cualquier turno "LLAMANDO" a "EN_ESPERA" para este consultorio
    await executeQuery(
      'UPDATE Turno SET s_estado = "EN_ESPERA" WHERE uk_consultorio = ? AND s_estado = "LLAMANDO" AND d_fecha = CURDATE() AND ck_estado = "ACTIVO"',
      [uk_consultorio]
    );

    // Obtener el siguiente turno en espera
    const query = `
      SELECT uk_turno 
      FROM Turno 
      WHERE uk_consultorio = ? AND s_estado = 'EN_ESPERA' AND d_fecha = CURDATE() AND ck_estado = 'ACTIVO'
      ORDER BY i_numero_turno ASC 
      LIMIT 1
    `;

    const results = await executeQuery(query, [uk_consultorio]);

    if (results.length === 0) {
      return null; // No hay turnos en espera
    }

    const turnoId = results[0].uk_turno;

    // Cambiar estado a "LLAMANDO"
    await this.updateEstado(turnoId, 'LLAMANDO', null);

    // Retornar el turno actualizado
    return await this.getById(turnoId);
  }

  // Obtener estadísticas del día
  static async getEstadisticasDelDia() {
    const query = `
      SELECT 
        COUNT(*) as total_turnos,
        COUNT(CASE WHEN s_estado = 'EN_ESPERA' THEN 1 END) as en_espera,
        COUNT(CASE WHEN s_estado = 'LLAMANDO' THEN 1 END) as llamando,
        COUNT(CASE WHEN s_estado = 'ATENDIDO' THEN 1 END) as atendidos,
        COUNT(CASE WHEN s_estado = 'CANCELADO' THEN 1 END) as cancelados,
        COUNT(CASE WHEN s_estado = 'NO_PRESENTE' THEN 1 END) as no_presente
      FROM Turno 
      WHERE d_fecha = CURDATE() AND ck_estado = 'ACTIVO'
    `;

    const results = await executeQuery(query);
    return results[0];
  }

  // Cancelar turno
  static async cancelar(uk_turno, uk_usuario_modificacion) {
    const query = `
      UPDATE Turno 
      SET s_estado = 'CANCELADO',
          d_fecha_cancelacion = NOW(),
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_turno = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_turno]);
    return result.affectedRows > 0;
  }

  // Marcar como atendido
  static async marcarAtendido(uk_turno, uk_usuario_modificacion) {
    const query = `
      UPDATE Turno 
      SET s_estado = 'ATENDIDO',
          d_fecha_atencion = NOW(),
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_turno = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_turno]);
    return result.affectedRows > 0;
  }

  // Marcar como no presente
  static async marcarNoPresente(uk_turno, uk_usuario_modificacion) {
    const query = `
      UPDATE Turno 
      SET s_estado = 'NO_PRESENTE',
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_turno = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_turno]);
    return result.affectedRows > 0;
  }

  // Eliminar turno
  static async delete(uk_turno) {
    console.log('🔄 [MODEL] delete() recibe UUID:', uk_turno);
    console.log('🔄 [MODEL] Tipo del UUID:', typeof uk_turno);
    
    // Verificar existencia del turno
    const turnoQuery = 'SELECT uk_turno FROM Turno WHERE uk_turno = ? AND ck_estado = "ACTIVO"';
    console.log('🔍 [MODEL] Ejecutando query de verificación...');
    const turno = await executeQuery(turnoQuery, [uk_turno]);
    console.log('🔍 [MODEL] Turnos encontrados:', turno.length);

    if (turno.length === 0) {
      console.log('❌ [MODEL] El turno no existe o ya está inactivo');
      throw new Error('El turno no existe');
    }

    // ELIMINACIÓN FÍSICA TEMPORAL PARA DEBUG
    console.log('🔄 [MODEL] Ejecutando eliminación FÍSICA...');
    const query = 'DELETE FROM Turno WHERE uk_turno = ?';
    const result = await executeQuery(query, [uk_turno]);
    console.log('🔄 [MODEL] Filas afectadas:', result.affectedRows);
    
    return result.affectedRows > 0;
  }

  // Obtener el turno actualmente llamando (público)
  static async getProximoTurnoPublico() {
    const query = `
      SELECT 
        t.i_numero_turno,
        c.i_numero_consultorio
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      WHERE t.d_fecha = CURDATE() 
      AND t.s_estado = 'LLAMANDO' 
      AND t.ck_estado = 'ACTIVO'
      ORDER BY t.i_numero_turno DESC
      LIMIT 1
    `;

    const results = await executeQuery(query);
    if (results.length === 0) {
      return null;
    }
    return results[0];
  }

  // Obtener los últimos N turnos llamados/atendidos del día (público)
  static async getUltimosTurnosPublicos(limit = 6) {
    const lim = Number.isInteger(limit) && limit > 0 ? limit : 6;
    const query = `
      SELECT 
        t.i_numero_turno,
        c.i_numero_consultorio
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      WHERE t.d_fecha = CURDATE() 
      AND t.s_estado IN ('LLAMANDO', 'ATENDIDO') 
      AND t.ck_estado = 'ACTIVO'
      ORDER BY t.i_numero_turno DESC
      LIMIT ${lim}
    `;

    const results = await executeQuery(query);
    return results;
  }

  // Actualizar observaciones
  static async updateObservaciones(uk_turno, s_observaciones, uk_usuario_modificacion) {
    const query = `
      UPDATE Turno 
      SET s_observaciones = ?,
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_turno = ?
    `;
    const result = await executeQuery(query, [s_observaciones, uk_usuario_modificacion, uk_turno]);
    return result.affectedRows > 0;
  }

  // Obtener turnos por rango de fechas
  static async getByDateRange(fecha_inicio, fecha_fin, filters = {}) {
    let whereConditions = [
      't.ck_estado = "ACTIVO"',
      't.d_fecha BETWEEN ? AND ?'
    ];
    let params = [fecha_inicio, fecha_fin];

    if (filters.estado) {
      whereConditions.push('t.s_estado = ?');
      params.push(filters.estado);
    }

    if (filters.uk_area) {
      whereConditions.push('a.uk_area = ?');
      params.push(filters.uk_area);
    }

    if (filters.uk_consultorio) {
      whereConditions.push('t.uk_consultorio = ?');
      params.push(filters.uk_consultorio);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const query = `
      SELECT 
        t.*,
        COALESCE(p.s_nombre, 'Paciente') as s_nombre_paciente,
        COALESCE(p.s_apellido, 'Invitado') as s_apellido_paciente,
        p.c_telefono as c_telefono_paciente,
        c.i_numero_consultorio,
        a.s_nombre_area,
        CONCAT(ad.s_nombre, ' ', ad.s_apellido) as s_nombre_administrador
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      JOIN Administrador ad ON t.uk_administrador = ad.uk_administrador
      ${whereClause}
      ORDER BY t.d_fecha DESC, t.i_numero_turno ASC
    `;

    const results = await executeQuery(query, params);
    return results.map(turno => new Turno(turno));
  }

  // Obtener consultorios disponibles por área
  static async getConsultoriosDisponiblesPorArea(uk_area) {
    const query = `
      SELECT 
        c.uk_consultorio,
        c.i_numero_consultorio,
        c.uk_area,
        a.s_nombre_area,
        COALESCE(turnos_espera.total_en_espera, 0) as turnos_en_espera,
        CASE 
          WHEN turnos_espera.total_en_espera IS NULL OR turnos_espera.total_en_espera = 0 THEN 'DISPONIBLE'
          ELSE 'OCUPADO'
        END as estado_disponibilidad
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      LEFT JOIN (
        SELECT 
          uk_consultorio, 
          COUNT(*) as total_en_espera
        FROM Turno 
        WHERE s_estado IN ('EN_ESPERA', 'LLAMANDO') 
        AND ck_estado = 'ACTIVO'
        AND d_fecha = CURDATE()
        GROUP BY uk_consultorio
      ) turnos_espera ON c.uk_consultorio = turnos_espera.uk_consultorio
      WHERE c.uk_area = ? 
      AND c.ck_estado = 'ACTIVO' 
      AND a.ck_estado = 'ACTIVO'
      ORDER BY turnos_en_espera ASC, c.i_numero_consultorio ASC
    `;
    
    const results = await executeQuery(query, [uk_area]);
    return results;
  }

  // Obtener el mejor consultorio para asignar en un área específica
  static async getMejorConsultorioParaAsignar(uk_area) {
    const consultorios = await this.getConsultoriosDisponiblesPorArea(uk_area);
    
    if (consultorios.length === 0) {
      throw new Error('No hay consultorios activos en esta área');
    }

    // Prioritizar consultorios completamente disponibles
    const consultoriosDisponibles = consultorios.filter(c => c.estado_disponibilidad === 'DISPONIBLE');
    
    if (consultoriosDisponibles.length > 0) {
      // Si hay consultorios disponibles, elegir el primero (número más bajo)
      return consultoriosDisponibles[0].uk_consultorio;
    }

    // Si todos están ocupados, elegir el que tenga menos turnos en espera
    return consultorios[0].uk_consultorio;
  }

  // Asignar consultorio de forma inteligente alternando entre disponibles
  static async asignarConsultorioInteligente(uk_area) {
    const consultorios = await this.getConsultoriosDisponiblesPorArea(uk_area);
    
    if (consultorios.length === 0) {
      throw new Error('No hay consultorios activos en esta área');
    }

    // Obtener el último consultorio usado para esta área hoy
    const ultimoConsultorioQuery = `
      SELECT t.uk_consultorio 
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      WHERE c.uk_area = ? 
      AND t.d_fecha = CURDATE() 
      AND t.ck_estado = 'ACTIVO'
      ORDER BY t.d_fecha_creacion DESC, t.t_hora DESC
      LIMIT 1
    `;
    
    const ultimoResult = await executeQuery(ultimoConsultorioQuery, [uk_area]);
    
    if (ultimoResult.length === 0) {
      // Si no hay turnos previos, usar el primer consultorio disponible
      return consultorios[0].uk_consultorio;
    }

    const ultimoConsultorio = ultimoResult[0].uk_consultorio;
    const consultoriosActivos = consultorios.map(c => c.uk_consultorio);
    const indiceUltimo = consultoriosActivos.indexOf(ultimoConsultorio);
    
    // Alternar al siguiente consultorio en la lista
    const siguienteIndice = (indiceUltimo + 1) % consultoriosActivos.length;
    return consultoriosActivos[siguienteIndice];
  }

  // Redistribuir turnos a consultorios más rápidos
  static async redistribuirTurnos(uk_area) {
    const consultorios = await this.getConsultoriosDisponiblesPorArea(uk_area);
    
    if (consultorios.length < 2) {
      return { redistribuidos: 0, mensaje: 'Se necesitan al menos 2 consultorios para redistribuir' };
    }

    // Encontrar consultorios disponibles
    const consultoriosDisponibles = consultorios.filter(c => c.estado_disponibilidad === 'DISPONIBLE');
    const consultoriosOcupados = consultorios.filter(c => c.estado_disponibilidad === 'OCUPADO');

    if (consultoriosDisponibles.length === 0) {
      return { redistribuidos: 0, mensaje: 'No hay consultorios disponibles para redistribuir' };
    }

    let redistribuidos = 0;

    // Redistribuir desde consultorios más ocupados a menos ocupados
    for (const consultorioOcupado of consultoriosOcupados) {
      // Obtener turnos en espera del consultorio ocupado
      const turnosEnEspera = await executeQuery(`
        SELECT uk_turno 
        FROM Turno 
        WHERE uk_consultorio = ? 
        AND s_estado = 'EN_ESPERA' 
        AND d_fecha = CURDATE() 
        AND ck_estado = 'ACTIVO'
        ORDER BY i_numero_turno ASC
      `, [consultorioOcupado.uk_consultorio]);

      // Si hay más de 3 turnos en espera, mover algunos al consultorio disponible
      if (turnosEnEspera.length > 3) {
        const consultorioDestino = consultoriosDisponibles[0];
        const turnosAMover = Math.min(2, turnosEnEspera.length - 2); // Mover hasta 2 turnos

        for (let i = 0; i < turnosAMover; i++) {
          await executeQuery(`
            UPDATE Turno 
            SET uk_consultorio = ?, 
                uk_usuario_modificacion = NULL,
                d_fecha_modificacion = NOW()
            WHERE uk_turno = ?
          `, [consultorioDestino.uk_consultorio, turnosEnEspera[i].uk_turno]);
          
          redistribuidos++;
        }

        // Actualizar estado del consultorio destino
        consultorioDestino.estado_disponibilidad = 'OCUPADO';
        consultorioDestino.turnos_en_espera += turnosAMover;
        
        // Remover de disponibles si ya tiene turnos asignados
        if (consultorioDestino.turnos_en_espera > 0) {
          const index = consultoriosDisponibles.indexOf(consultorioDestino);
          if (index > -1) {
            consultoriosDisponibles.splice(index, 1);
          }
        }

        // Si no hay más consultorios disponibles, terminar
        if (consultoriosDisponibles.length === 0) {
          break;
        }
      }
    }

    return { 
      redistribuidos, 
      mensaje: `Se redistribuyeron ${redistribuidos} turnos para optimizar el flujo` 
    };
  }

  // Crear turno con asignación inteligente de consultorio
  static async createConAsignacionInteligente(turnoData) {
    const { uk_administrador, uk_paciente = null, uk_usuario_creacion, uk_area } = turnoData;

    if (!uk_area) {
      throw new Error('El área es requerida para la asignación inteligente');
    }

    // Verificar que el área existe
    const areaQuery = 'SELECT uk_area FROM Area WHERE uk_area = ? AND ck_estado = "ACTIVO"';
    const areaExists = await executeQuery(areaQuery, [uk_area]);

    if (areaExists.length === 0) {
      throw new Error('El área especificada no existe o está inactiva');
    }

    // Asignar consultorio de forma inteligente
    const uk_consultorio = await this.asignarConsultorioInteligente(uk_area);

    // Crear el turno con el consultorio asignado
    const result = await this.create({
      uk_consultorio,
      uk_administrador,
      uk_paciente,
      uk_usuario_creacion
    });

    // Intentar redistribuir turnos para optimizar flujo
    setTimeout(async () => {
      try {
        await this.redistribuirTurnos(uk_area);
      } catch (error) {
        console.error('Error en redistribución automática:', error);
      }
    }, 1000); // Ejecutar después de 1 segundo para no bloquear la respuesta

    return result;
  }

  // Convertir a objeto público
  toJSON() {
    return {
      uk_turno: this.uk_turno,
      i_numero_turno: this.i_numero_turno,
      s_estado: this.s_estado,
      d_fecha: this.d_fecha,
      t_hora: this.t_hora,
      uk_paciente: this.uk_paciente,
      s_nombre_paciente: this.s_nombre_paciente,
      s_apellido_paciente: this.s_apellido_paciente,
      c_telefono_paciente: this.c_telefono_paciente,
      uk_consultorio: this.uk_consultorio,
      i_numero_consultorio: this.i_numero_consultorio,
      s_nombre_area: this.s_nombre_area,
      uk_administrador: this.uk_administrador,
      s_nombre_administrador: this.s_nombre_administrador,
      s_observaciones: this.s_observaciones,
      d_fecha_atencion: this.d_fecha_atencion,
      d_fecha_cancelacion: this.d_fecha_cancelacion
    };
  }
}

module.exports = Turno;