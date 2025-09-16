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

  // Generar siguiente número de turno para el día
  static async getNextNumeroTurno() {
    const query = `
      SELECT COALESCE(MAX(i_numero_turno), 0) + 1 as next_numero 
      FROM Turno 
      WHERE d_fecha = CURDATE() AND ck_estado = 'ACTIVO'
    `;
    const result = await executeQuery(query);
    return result[0].next_numero;
  }

  // Crear nuevo turno
  static async create(turnoData) {
    const { uk_consultorio, uk_administrador, uk_paciente = null, uk_usuario_creacion } = turnoData;

    // Verificar que el consultorio existe
    const consultorioQuery = 'SELECT uk_consultorio FROM Consultorio WHERE uk_consultorio = ? AND ck_estado = "ACTIVO"';
    const consultorioExists = await executeQuery(consultorioQuery, [uk_consultorio]);

    if (consultorioExists.length === 0) {
      throw new Error('El consultorio especificado no existe o está inactivo');
    }

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

    // Generar número de turno
    const numeroTurno = await this.getNextNumeroTurno();

    // Crear turno
    const query = `
      INSERT INTO Turno (
        i_numero_turno, s_estado, d_fecha, t_hora, 
        uk_paciente, uk_consultorio, uk_administrador, uk_usuario_creacion
      ) 
      VALUES (?, 'EN_ESPERA', CURDATE(), CURTIME(), ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [numeroTurno, uk_paciente, uk_consultorio, uk_administrador, uk_usuario_creacion]);
    return {
      id: result.insertId,
      uk_turno: result.insertId, // En MySQL, insertId es el ID generado
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
        CONCAT(ad.s_nombre, ' ', ad.s_apellido) as s_nombre_administrador
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      JOIN Administrador ad ON t.uk_administrador = ad.uk_administrador
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
        COALESCE(p.s_nombre, 'Paciente') as s_nombre_paciente,
        COALESCE(p.s_apellido, 'Invitado') as s_apellido_paciente,
        c.i_numero_consultorio,
        a.s_nombre_area
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE t.d_fecha = CURDATE() 
      AND t.s_estado IN ('EN_ESPERA', 'LLAMANDO') 
      AND t.ck_estado = 'ACTIVO'
      ORDER BY t.i_numero_turno ASC
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

  // Eliminar turno (solo si no está atendido)
  static async delete(uk_turno) {
    // Verificar que el turno no esté atendido
    const turnoQuery = 'SELECT s_estado FROM Turno WHERE uk_turno = ?';
    const turno = await executeQuery(turnoQuery, [uk_turno]);

    if (turno.length === 0) {
      throw new Error('El turno no existe');
    }

    if (turno[0].s_estado === 'ATENDIDO') {
      throw new Error('No se puede eliminar un turno que ya fue atendido');
    }

    const query = 'DELETE FROM Turno WHERE uk_turno = ?';
    const result = await executeQuery(query, [uk_turno]);
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