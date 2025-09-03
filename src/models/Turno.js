const { executeQuery } = require('../config/database');

class Turno {
  constructor(data) {
    this.id_turno = data.id_turno;
    this.numero_turno = data.numero_turno;
    this.estado = data.estado;
    this.fecha = data.fecha;
    this.hora = data.hora;
    this.id_paciente = data.id_paciente;
    this.id_consultorio = data.id_consultorio;
    this.id_administrador = data.id_administrador;

    // Campos adicionales para JOINs
    this.nombre_paciente = data.nombre_paciente;
    this.apellido_paciente = data.apellido_paciente;
    this.numero_consultorio = data.numero_consultorio;
    this.nombre_area = data.nombre_area;
    this.nombre_administrador = data.nombre_administrador;
  }

  // Generar siguiente número de turno
  static async getNextNumeroTurno() {
    const query = `
      SELECT COALESCE(MAX(numero_turno), 0) + 1 as next_numero 
      FROM Turno 
      WHERE fecha = CURDATE()
    `;
    const result = await executeQuery(query);
    return result[0].next_numero;
  }

  // Crear nuevo turno
  static async create(turnoData) {
    const { id_consultorio, id_administrador, id_paciente = null } = turnoData;

    // Verificar que el consultorio existe
    const consultorioQuery = 'SELECT id_consultorio FROM Consultorio WHERE id_consultorio = ?';
    const consultorioExists = await executeQuery(consultorioQuery, [id_consultorio]);

    if (consultorioExists.length === 0) {
      throw new Error('El consultorio especificado no existe');
    }

    // Generar número de turno
    const numeroTurno = await this.getNextNumeroTurno();

    // Crear turno
    const query = `
      INSERT INTO Turno (numero_turno, estado, fecha, hora, id_paciente, id_consultorio, id_administrador) 
      VALUES (?, 'En espera', CURDATE(), CURTIME(), ?, ?, ?)
    `;

    const result = await executeQuery(query, [numeroTurno, id_paciente, id_consultorio, id_administrador]);
    return {
      id: result.insertId,
      numero_turno: numeroTurno
    };
  }

  // Obtener todos los turnos con información detallada
  static async getAll(filters = {}) {
    let whereConditions = [];
    let params = [];

    // Aplicar filtros
    if (filters.fecha) {
      whereConditions.push('t.fecha = ?');
      params.push(filters.fecha);
    } else {
      // Por defecto mostrar solo turnos del día actual
      whereConditions.push('t.fecha = CURDATE()');
    }

    if (filters.estado) {
      whereConditions.push('t.estado = ?');
      params.push(filters.estado);
    }

    if (filters.id_area) {
      whereConditions.push('a.id_area = ?');
      params.push(filters.id_area);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const query = `
      SELECT 
        t.*,
        COALESCE(p.nombre, 'Paciente Invitado') as nombre_paciente,
        COALESCE(p.apellido, '') as apellido_paciente,
        c.numero_consultorio,
        a.nombre_area,
        ad.nombre as nombre_administrador
      FROM Turno t
      LEFT JOIN Paciente p ON t.id_paciente = p.id_paciente
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      JOIN Area a ON c.id_area = a.id_area
      JOIN Administrador ad ON t.id_administrador = ad.id_administrador
      ${whereClause}
      ORDER BY t.numero_turno ASC
    `;

    const results = await executeQuery(query, params);
    return results.map(turno => new Turno(turno));
  }

  // Obtener turno por ID
  static async getById(id) {
    const query = `
      SELECT 
        t.*,
        COALESCE(p.nombre, 'Paciente Invitado') as nombre_paciente,
        COALESCE(p.apellido, '') as apellido_paciente,
        c.numero_consultorio,
        a.nombre_area,
        ad.nombre as nombre_administrador
      FROM Turno t
      LEFT JOIN Paciente p ON t.id_paciente = p.id_paciente
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      JOIN Area a ON c.id_area = a.id_area
      JOIN Administrador ad ON t.id_administrador = ad.id_administrador
      WHERE t.id_turno = ?
    `;

    const results = await executeQuery(query, [id]);

    if (results.length === 0) {
      return null;
    }

    return new Turno(results[0]);
  }

  // Obtener turnos por paciente
  static async getByPaciente(id_paciente) {
    const query = `
      SELECT 
        t.*,
        p.nombre as nombre_paciente,
        p.apellido as apellido_paciente,
        c.numero_consultorio,
        a.nombre_area,
        ad.nombre as nombre_administrador
      FROM Turno t
      JOIN Paciente p ON t.id_paciente = p.id_paciente
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      JOIN Area a ON c.id_area = a.id_area
      JOIN Administrador ad ON t.id_administrador = ad.id_administrador
      WHERE t.id_paciente = ?
      ORDER BY t.fecha DESC, t.hora DESC
    `;

    const results = await executeQuery(query, [id_paciente]);
    return results.map(turno => new Turno(turno));
  }

  // Obtener turnos públicos (para pantalla de usuario)
  static async getTurnosPublicos() {
    const query = `
      SELECT 
        t.numero_turno,
        t.estado,
        COALESCE(p.nombre, 'Paciente Invitado') as nombre_paciente,
        COALESCE(p.apellido, '') as apellido_paciente,
        c.numero_consultorio,
        a.nombre_area
      FROM Turno t
      LEFT JOIN Paciente p ON t.id_paciente = p.id_paciente
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      JOIN Area a ON c.id_area = a.id_area
      WHERE t.fecha = CURDATE() AND t.estado IN ('En espera', 'Llamando')
      ORDER BY t.numero_turno ASC
    `;

    const results = await executeQuery(query);
    return results;
  }

  // Actualizar estado del turno
  static async updateEstado(id, nuevoEstado) {
    const estadosValidos = ['En espera', 'Llamando', 'Atendido', 'Cancelado'];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado de turno no válido');
    }

    const query = 'UPDATE Turno SET estado = ? WHERE id_turno = ?';
    const result = await executeQuery(query, [nuevoEstado, id]);

    return result.affectedRows > 0;
  }

  // Llamar siguiente turno en cola
  static async llamarSiguienteTurno(id_consultorio) {
    // Primero cambiar cualquier turno "Llamando" a "En espera" para este consultorio
    await executeQuery(
      'UPDATE Turno SET estado = "En espera" WHERE id_consultorio = ? AND estado = "Llamando" AND fecha = CURDATE()',
      [id_consultorio]
    );

    // Obtener el siguiente turno en espera
    const query = `
      SELECT id_turno 
      FROM Turno 
      WHERE id_consultorio = ? AND estado = 'En espera' AND fecha = CURDATE()
      ORDER BY numero_turno ASC 
      LIMIT 1
    `;

    const results = await executeQuery(query, [id_consultorio]);

    if (results.length === 0) {
      return null; // No hay turnos en espera
    }

    const turnoId = results[0].id_turno;

    // Cambiar estado a "Llamando"
    await this.updateEstado(turnoId, 'Llamando');

    // Retornar el turno actualizado
    return await this.getById(turnoId);
  }

  // Obtener estadísticas del día
  static async getEstadisticasDelDia() {
    const query = `
      SELECT 
        COUNT(*) as total_turnos,
        COUNT(CASE WHEN estado = 'En espera' THEN 1 END) as en_espera,
        COUNT(CASE WHEN estado = 'Llamando' THEN 1 END) as llamando,
        COUNT(CASE WHEN estado = 'Atendido' THEN 1 END) as atendidos,
        COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END) as cancelados
      FROM Turno 
      WHERE fecha = CURDATE()
    `;

    const results = await executeQuery(query);
    return results[0];
  }

  // Cancelar turno
  static async cancelar(id) {
    return await this.updateEstado(id, 'Cancelado');
  }

  // Marcar como atendido
  static async marcarAtendido(id) {
    return await this.updateEstado(id, 'Atendido');
  }

  // Eliminar turno (solo si no está atendido)
  static async delete(id) {
    // Verificar que el turno no esté atendido
    const turnoQuery = 'SELECT estado FROM Turno WHERE id_turno = ?';
    const turno = await executeQuery(turnoQuery, [id]);

    if (turno.length === 0) {
      throw new Error('El turno no existe');
    }

    if (turno[0].estado === 'Atendido') {
      throw new Error('No se puede eliminar un turno que ya fue atendido');
    }

    const query = 'DELETE FROM Turno WHERE id_turno = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Obtener el turno actualmente llamando (público)
  static async getProximoTurnoPublico() {
    const query = `
      SELECT 
        t.numero_turno,
        c.numero_consultorio
      FROM Turno t
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      WHERE t.fecha = CURDATE() AND t.estado = 'Llamando'
      ORDER BY t.numero_turno DESC
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
        t.numero_turno,
        c.numero_consultorio
      FROM Turno t
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      WHERE t.fecha = CURDATE() AND t.estado IN ('Llamando', 'Atendido')
      ORDER BY t.numero_turno DESC
      LIMIT ${lim}
    `;

    const results = await executeQuery(query);
    return results;
  }
}

module.exports = Turno;
