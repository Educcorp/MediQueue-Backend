const { executeQuery } = require('../config/database');

class Consultorio {
  constructor(data) {
    this.uk_consultorio = data.uk_consultorio;
    this.i_numero_consultorio = data.i_numero_consultorio;
    this.uk_area = data.uk_area;
    this.ck_estado = data.ck_estado || 'ACTIVO';
    this.d_fecha_creacion = data.d_fecha_creacion;
    this.d_fecha_modificacion = data.d_fecha_modificacion;
    this.uk_usuario_creacion = data.uk_usuario_creacion;
    this.uk_usuario_modificacion = data.uk_usuario_modificacion;

    // Campos adicionales para JOINs
    this.s_nombre_area = data.s_nombre_area;
  }

  // Crear nuevo consultorio
  static async create(consultorioData) {
    const { i_numero_consultorio, uk_area, uk_usuario_creacion } = consultorioData;

    // Verificar que el área existe
    const areaQuery = 'SELECT uk_area FROM Area WHERE uk_area = ? AND ck_estado = "ACTIVO"';
    const areaExists = await executeQuery(areaQuery, [uk_area]);

    if (areaExists.length === 0) {
      throw new Error('El área especificada no existe o está inactiva');
    }

    // Verificar que no exista otro consultorio con el mismo número en la misma área
    const duplicateQuery = 'SELECT uk_consultorio FROM Consultorio WHERE i_numero_consultorio = ? AND uk_area = ? AND ck_estado = "ACTIVO"';
    const duplicate = await executeQuery(duplicateQuery, [i_numero_consultorio, uk_area]);

    if (duplicate.length > 0) {
      throw new Error('Ya existe un consultorio con este número en la misma área');
    }

    const query = `
      INSERT INTO Consultorio (i_numero_consultorio, uk_area, uk_usuario_creacion) 
      VALUES (?, ?, ?)
    `;
    const result = await executeQuery(query, [i_numero_consultorio, uk_area, uk_usuario_creacion]);
    return result.insertId;
  }

  // Obtener todos los consultorios activos
  static async getAll() {
    const query = `
      SELECT c.*, a.s_nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE c.ck_estado = 'ACTIVO' AND a.ck_estado = 'ACTIVO'
      ORDER BY a.s_nombre_area, c.i_numero_consultorio
    `;
    const results = await executeQuery(query);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Obtener todos los consultorios (incluyendo inactivos)
  static async getAllWithInactive() {
    const query = `
      SELECT c.*, a.s_nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      ORDER BY a.s_nombre_area, c.i_numero_consultorio
    `;
    const results = await executeQuery(query);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Obtener consultorio por UUID
  static async getById(uk_consultorio) {
    const query = `
      SELECT c.*, a.s_nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE c.uk_consultorio = ?
    `;
    const results = await executeQuery(query, [uk_consultorio]);

    if (results.length === 0) {
      return null;
    }

    return new Consultorio(results[0]);
  }

  // Obtener consultorios por área
  static async getByArea(uk_area) {
    const query = `
      SELECT c.*, a.s_nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE c.uk_area = ? AND c.ck_estado = 'ACTIVO' AND a.ck_estado = 'ACTIVO'
      ORDER BY c.i_numero_consultorio
    `;
    const results = await executeQuery(query, [uk_area]);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Obtener consultorios disponibles (sin turnos en espera o llamando)
  static async getDisponibles() {
    const query = `
      SELECT DISTINCT c.*, a.s_nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE c.ck_estado = 'ACTIVO' AND a.ck_estado = 'ACTIVO'
      AND c.uk_consultorio NOT IN (
        SELECT DISTINCT uk_consultorio 
        FROM Turno 
        WHERE s_estado IN ('EN_ESPERA', 'LLAMANDO') 
        AND ck_estado = 'ACTIVO'
        AND d_fecha = CURDATE()
      )
      ORDER BY a.s_nombre_area, c.i_numero_consultorio
    `;
    const results = await executeQuery(query);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Obtener consultorios básicos (solo para mostrar en formularios)
  static async getBasicos() {
    const query = `
      SELECT c.uk_consultorio, c.i_numero_consultorio, a.s_nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE c.ck_estado = 'ACTIVO' AND a.ck_estado = 'ACTIVO'
      ORDER BY a.s_nombre_area, c.i_numero_consultorio
    `;
    const results = await executeQuery(query);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Actualizar consultorio
  static async update(uk_consultorio, consultorioData) {
    const { i_numero_consultorio, uk_area, uk_usuario_modificacion } = consultorioData;

    // Verificar que el área existe
    const areaQuery = 'SELECT uk_area FROM Area WHERE uk_area = ? AND ck_estado = "ACTIVO"';
    const areaExists = await executeQuery(areaQuery, [uk_area]);

    if (areaExists.length === 0) {
      throw new Error('El área especificada no existe o está inactiva');
    }

    // Verificar que no exista otro consultorio con el mismo número en la misma área (excepto el actual)
    const duplicateQuery = 'SELECT uk_consultorio FROM Consultorio WHERE i_numero_consultorio = ? AND uk_area = ? AND uk_consultorio != ? AND ck_estado = "ACTIVO"';
    const duplicate = await executeQuery(duplicateQuery, [i_numero_consultorio, uk_area, uk_consultorio]);

    if (duplicate.length > 0) {
      throw new Error('Ya existe un consultorio con este número en la misma área');
    }

    const query = `
      UPDATE Consultorio 
      SET i_numero_consultorio = ?, uk_area = ?,
          uk_usuario_modificacion = ?, d_fecha_modificacion = NOW()
      WHERE uk_consultorio = ?
    `;
    const result = await executeQuery(query, [i_numero_consultorio, uk_area, uk_usuario_modificacion, uk_consultorio]);

    return result.affectedRows > 0;
  }

  // Soft delete - marcar como inactivo
  static async softDelete(uk_consultorio, uk_usuario_modificacion) {
    // Verificar si hay turnos asociados
    const turnosQuery = 'SELECT COUNT(*) as count FROM Turno WHERE uk_consultorio = ? AND ck_estado = "ACTIVO"';
    const turnosCount = await executeQuery(turnosQuery, [uk_consultorio]);

    if (turnosCount[0].count > 0) {
      throw new Error('No se puede desactivar el consultorio porque tiene turnos asociados');
    }

    const query = `
      UPDATE Consultorio 
      SET ck_estado = 'INACTIVO',
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_consultorio = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_consultorio]);
    return result.affectedRows > 0;
  }

  // Eliminar consultorio (hard delete)
  static async delete(uk_consultorio) {
    // Primero eliminar todos los turnos asociados al consultorio
    const deleteTurnosQuery = 'DELETE FROM Turno WHERE uk_consultorio = ?';
    await executeQuery(deleteTurnosQuery, [uk_consultorio]);

    // Luego eliminar el consultorio
    const query = 'DELETE FROM Consultorio WHERE uk_consultorio = ?';
    const result = await executeQuery(query, [uk_consultorio]);
    return result.affectedRows > 0;
  }

  // Obtener estadísticas de turnos del consultorio
  async getEstadisticasTurnos() {
    const query = `
      SELECT 
        COUNT(*) as total_turnos,
        COUNT(CASE WHEN s_estado = 'EN_ESPERA' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN s_estado = 'LLAMANDO' THEN 1 END) as turnos_llamando,
        COUNT(CASE WHEN s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        COUNT(CASE WHEN s_estado = 'CANCELADO' THEN 1 END) as turnos_cancelados,
        COUNT(CASE WHEN s_estado = 'NO_PRESENTE' THEN 1 END) as turnos_no_presente
      FROM Turno 
      WHERE uk_consultorio = ? AND ck_estado = 'ACTIVO' AND d_fecha = CURDATE()
    `;

    const results = await executeQuery(query, [this.uk_consultorio]);
    return results[0];
  }

  // Obtener estadísticas de turnos del consultorio en un rango de fechas
  async getEstadisticasTurnosPorFecha(fecha_inicio, fecha_fin) {
    const query = `
      SELECT 
        COUNT(*) as total_turnos,
        COUNT(CASE WHEN s_estado = 'EN_ESPERA' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN s_estado = 'LLAMANDO' THEN 1 END) as turnos_llamando,
        COUNT(CASE WHEN s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        COUNT(CASE WHEN s_estado = 'CANCELADO' THEN 1 END) as turnos_cancelados,
        COUNT(CASE WHEN s_estado = 'NO_PRESENTE' THEN 1 END) as turnos_no_presente
      FROM Turno 
      WHERE uk_consultorio = ? AND ck_estado = 'ACTIVO' 
      AND d_fecha BETWEEN ? AND ?
    `;

    const results = await executeQuery(query, [this.uk_consultorio, fecha_inicio, fecha_fin]);
    return results[0];
  }

  // Verificar si el consultorio está disponible (sin turnos en espera o llamando)
  async isDisponible() {
    const query = `
      SELECT COUNT(*) as count 
      FROM Turno 
      WHERE uk_consultorio = ? 
      AND s_estado IN ('EN_ESPERA', 'LLAMANDO') 
      AND ck_estado = 'ACTIVO'
      AND d_fecha = CURDATE()
    `;

    const results = await executeQuery(query, [this.uk_consultorio]);
    return results[0].count === 0;
  }

  // Obtener turno actual del consultorio (si hay uno llamando)
  async getTurnoActual() {
    const query = `
      SELECT t.*, 
             COALESCE(p.s_nombre, 'Paciente') as s_nombre_paciente,
             COALESCE(p.s_apellido, 'Invitado') as s_apellido_paciente
      FROM Turno t
      LEFT JOIN Paciente p ON t.uk_paciente = p.uk_paciente
      WHERE t.uk_consultorio = ? 
      AND t.s_estado = 'LLAMANDO' 
      AND t.ck_estado = 'ACTIVO'
      AND t.d_fecha = CURDATE()
      ORDER BY t.i_numero_turno ASC
      LIMIT 1
    `;

    const results = await executeQuery(query, [this.uk_consultorio]);
    return results.length > 0 ? results[0] : null;
  }

  // Convertir a objeto público
  toJSON() {
    return {
      uk_consultorio: this.uk_consultorio,
      i_numero_consultorio: this.i_numero_consultorio,
      uk_area: this.uk_area,
      s_nombre_area: this.s_nombre_area,
      ck_estado: this.ck_estado
    };
  }
}

module.exports = Consultorio;