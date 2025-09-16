const { executeQuery } = require('../config/database');

class Area {
  constructor(data) {
    this.uk_area = data.uk_area;
    this.s_nombre_area = data.s_nombre_area;
    this.ck_estado = data.ck_estado || 'ACTIVO';
    this.d_fecha_creacion = data.d_fecha_creacion;
    this.d_fecha_modificacion = data.d_fecha_modificacion;
    this.uk_usuario_creacion = data.uk_usuario_creacion;
    this.uk_usuario_modificacion = data.uk_usuario_modificacion;
  }

  // Crear nueva área
  static async create(areaData) {
    const { s_nombre_area, uk_usuario_creacion } = areaData;
    const query = `
      INSERT INTO Area (s_nombre_area, uk_usuario_creacion) 
      VALUES (?, ?)
    `;
    const result = await executeQuery(query, [s_nombre_area, uk_usuario_creacion]);
    return result.insertId;
  }

  // Obtener todas las áreas activas
  static async getAll() {
    const query = `
      SELECT * FROM Area 
      WHERE ck_estado = 'ACTIVO' 
      ORDER BY s_nombre_area
    `;
    const results = await executeQuery(query);
    return results.map(area => new Area(area));
  }

  // Obtener todas las áreas (incluyendo inactivas)
  static async getAllWithInactive() {
    const query = 'SELECT * FROM Area ORDER BY s_nombre_area';
    const results = await executeQuery(query);
    return results.map(area => new Area(area));
  }

  // Obtener área por UUID
  static async getById(uk_area) {
    const query = 'SELECT * FROM Area WHERE uk_area = ?';
    const results = await executeQuery(query, [uk_area]);

    if (results.length === 0) {
      return null;
    }

    return new Area(results[0]);
  }

  // Obtener área por nombre
  static async getByNombre(s_nombre_area) {
    const query = 'SELECT * FROM Area WHERE s_nombre_area = ? AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query, [s_nombre_area]);

    if (results.length === 0) {
      return null;
    }

    return new Area(results[0]);
  }

  // Obtener área con sus consultorios
  static async getWithConsultorios(uk_area) {
    const areaQuery = 'SELECT * FROM Area WHERE uk_area = ?';
    const consultoriosQuery = `
      SELECT * FROM Consultorio 
      WHERE uk_area = ? AND ck_estado = 'ACTIVO' 
      ORDER BY i_numero_consultorio
    `;

    const areaResults = await executeQuery(areaQuery, [uk_area]);

    if (areaResults.length === 0) {
      return null;
    }

    const area = new Area(areaResults[0]);
    const consultorios = await executeQuery(consultoriosQuery, [uk_area]);
    area.consultorios = consultorios;

    return area;
  }

  // Actualizar área
  static async update(uk_area, areaData) {
    const { s_nombre_area, uk_usuario_modificacion } = areaData;

    const query = `
      UPDATE Area 
      SET s_nombre_area = ?, 
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_area = ?
    `;
    const result = await executeQuery(query, [s_nombre_area, uk_usuario_modificacion, uk_area]);

    return result.affectedRows > 0;
  }

  // Soft delete - marcar como inactivo
  static async softDelete(uk_area, uk_usuario_modificacion) {
    const query = `
      UPDATE Area 
      SET ck_estado = 'INACTIVO',
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_area = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_area]);
    return result.affectedRows > 0;
  }

  // Eliminar área (hard delete - solo si no tiene consultorios)
  static async delete(uk_area) {
    // Verificar si hay consultorios asociados
    const consultoriosQuery = 'SELECT COUNT(*) as count FROM Consultorio WHERE uk_area = ? AND ck_estado = "ACTIVO"';
    const consultoriosCount = await executeQuery(consultoriosQuery, [uk_area]);

    if (consultoriosCount[0].count > 0) {
      throw new Error('No se puede eliminar el área porque tiene consultorios asociados');
    }

    const query = 'DELETE FROM Area WHERE uk_area = ?';
    const result = await executeQuery(query, [uk_area]);
    return result.affectedRows > 0;
  }

  // Obtener estadísticas de turnos por área
  static async getEstadisticasTurnos() {
    const query = `
      SELECT 
        a.uk_area,
        a.s_nombre_area,
        COUNT(t.uk_turno) as total_turnos,
        COUNT(CASE WHEN t.s_estado = 'EN_ESPERA' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN t.s_estado = 'LLAMANDO' THEN 1 END) as turnos_llamando,
        COUNT(CASE WHEN t.s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        COUNT(CASE WHEN t.s_estado = 'CANCELADO' THEN 1 END) as turnos_cancelados,
        COUNT(CASE WHEN t.s_estado = 'NO_PRESENTE' THEN 1 END) as turnos_no_presente
      FROM Area a
      LEFT JOIN Consultorio c ON a.uk_area = c.uk_area AND c.ck_estado = 'ACTIVO'
      LEFT JOIN Turno t ON c.uk_consultorio = t.uk_consultorio AND t.ck_estado = 'ACTIVO' AND t.d_fecha = CURDATE()
      WHERE a.ck_estado = 'ACTIVO'
      GROUP BY a.uk_area, a.s_nombre_area
      ORDER BY a.s_nombre_area
    `;

    const results = await executeQuery(query);
    return results;
  }

  // Obtener estadísticas de turnos por área en un rango de fechas
  static async getEstadisticasTurnosPorFecha(fecha_inicio, fecha_fin) {
    const query = `
      SELECT 
        a.uk_area,
        a.s_nombre_area,
        COUNT(t.uk_turno) as total_turnos,
        COUNT(CASE WHEN t.s_estado = 'EN_ESPERA' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN t.s_estado = 'LLAMANDO' THEN 1 END) as turnos_llamando,
        COUNT(CASE WHEN t.s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        COUNT(CASE WHEN t.s_estado = 'CANCELADO' THEN 1 END) as turnos_cancelados,
        COUNT(CASE WHEN t.s_estado = 'NO_PRESENTE' THEN 1 END) as turnos_no_presente
      FROM Area a
      LEFT JOIN Consultorio c ON a.uk_area = c.uk_area AND c.ck_estado = 'ACTIVO'
      LEFT JOIN Turno t ON c.uk_consultorio = t.uk_consultorio AND t.ck_estado = 'ACTIVO' 
        AND t.d_fecha BETWEEN ? AND ?
      WHERE a.ck_estado = 'ACTIVO'
      GROUP BY a.uk_area, a.s_nombre_area
      ORDER BY a.s_nombre_area
    `;

    const results = await executeQuery(query, [fecha_inicio, fecha_fin]);
    return results;
  }

  // Buscar áreas por nombre
  static async search(searchTerm) {
    const query = `
      SELECT * FROM Area 
      WHERE s_nombre_area LIKE ? AND ck_estado = 'ACTIVO'
      ORDER BY s_nombre_area
    `;
    const term = `%${searchTerm}%`;
    const results = await executeQuery(query, [term]);
    return results.map(area => new Area(area));
  }

  // Convertir a objeto sin campos de auditoría
  toJSON() {
    return {
      uk_area: this.uk_area,
      s_nombre_area: this.s_nombre_area,
      ck_estado: this.ck_estado
    };
  }
}

module.exports = Area;