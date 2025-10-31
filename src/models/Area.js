const { executeQuery } = require('../config/database');

class Area {
  constructor(data) {
    this.uk_area = data.uk_area;
    this.s_nombre_area = data.s_nombre_area;
    this.s_letra = data.s_letra;
    this.s_color = data.s_color;
    this.s_icono = data.s_icono;
    this.ck_estado = data.ck_estado || 'ACTIVO';
    this.d_fecha_creacion = data.d_fecha_creacion;
    this.d_fecha_modificacion = data.d_fecha_modificacion;
    this.uk_usuario_creacion = data.uk_usuario_creacion;
    this.uk_usuario_modificacion = data.uk_usuario_modificacion;
  }

  // Crear nueva área
  static async create(areaData) {
    const { s_nombre_area, s_letra, s_color, s_icono, uk_usuario_creacion } = areaData;

    // Generar UUID explícitamente para poder devolverlo
    const insertQuery = `
      INSERT INTO Area (s_nombre_area, s_letra, s_color, s_icono, uk_usuario_creacion) 
      VALUES (?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [s_nombre_area, s_letra, s_color, s_icono, uk_usuario_creacion]);

    // Obtener el UUID del área recién creada
    const selectQuery = `
      SELECT uk_area FROM Area 
      WHERE s_nombre_area = ? 
      ORDER BY d_fecha_creacion DESC 
      LIMIT 1
    `;

    const result = await executeQuery(selectQuery, [s_nombre_area]);

    if (result.length === 0) {
      throw new Error('Error al obtener el área creada');
    }

    return result[0].uk_area;
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
    const { s_nombre_area, s_letra, s_color, s_icono, uk_usuario_modificacion } = areaData;

    const query = `
      UPDATE Area 
      SET s_nombre_area = ?, 
          s_letra = ?,
          s_color = ?,
          s_icono = ?,
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_area = ?
    `;
    const result = await executeQuery(query, [s_nombre_area, s_letra, s_color, s_icono, uk_usuario_modificacion, uk_area]);

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

  // Toggle estado - cambiar entre ACTIVO e INACTIVO
  static async toggleEstado(uk_area, nuevoEstado, uk_usuario_modificacion) {
    const query = `
      UPDATE Area 
      SET ck_estado = ?,
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_area = ?
    `;
    const result = await executeQuery(query, [nuevoEstado, uk_usuario_modificacion, uk_area]);
    return result.affectedRows > 0;
  }

  // Eliminar área (hard delete - elimina consultorios y turnos en cascada)
  static async delete(uk_area) {
    // Obtener todos los consultorios del área
    const consultoriosQuery = 'SELECT uk_consultorio FROM Consultorio WHERE uk_area = ?';
    const consultorios = await executeQuery(consultoriosQuery, [uk_area]);

    // Eliminar turnos de todos los consultorios del área
    if (consultorios.length > 0) {
      const consultorioIds = consultorios.map(c => c.uk_consultorio);
      const placeholders = consultorioIds.map(() => '?').join(',');
      const deleteTurnosQuery = `DELETE FROM Turno WHERE uk_consultorio IN (${placeholders})`;
      await executeQuery(deleteTurnosQuery, consultorioIds);
    }

    // Eliminar todos los consultorios del área
    const deleteConsultoriosQuery = 'DELETE FROM Consultorio WHERE uk_area = ?';
    await executeQuery(deleteConsultoriosQuery, [uk_area]);

    // Finalmente eliminar el área
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

  // Verificar si una letra ya está en uso por otra área
  static async isLetraAvailable(s_letra, uk_area_exclude = null) {
    let query = 'SELECT uk_area FROM Area WHERE s_letra = ? AND ck_estado = "ACTIVO"';
    const params = [s_letra];

    if (uk_area_exclude) {
      query += ' AND uk_area != ?';
      params.push(uk_area_exclude);
    }

    const results = await executeQuery(query, params);
    return results.length === 0;
  }

  // Obtener todas las letras ya en uso
  static async getLetrasEnUso() {
    const query = 'SELECT s_letra FROM Area WHERE s_letra IS NOT NULL AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query);
    return results.map(row => row.s_letra);
  }

  // Validar formato de letra (máximo 2 letras, solo alfabético)
  static isValidLetra(s_letra) {
    if (!s_letra) return true; // Permitir null/undefined
    return /^[A-Za-z]{1,2}$/.test(s_letra);
  }

  // Validar formato de color hexadecimal
  static isValidColor(s_color) {
    if (!s_color) return true; // Permitir null/undefined
    return /^#[0-9A-Fa-f]{6}$/.test(s_color);
  }

  // Obtener configuración completa para formularios frontend
  static async getPersonalizationConfig() {
    const letrasEnUso = await this.getLetrasEnUso();

    // Colores predefinidos disponibles
    const coloresPredefinidos = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1'
    ];

    // Iconos predefinidos de FontAwesome
    const iconosPredefinidos = [
      'FaStethoscope', 'FaBaby', 'FaHeartbeat', 'FaUserMd', 'FaFemale',
      'FaEye', 'FaBone', 'FaBrain', 'FaMale', 'FaFlask',
      'FaProcedures', 'FaDoorOpen', 'FaHospital', 'FaAmbulance',
      'FaSyringe', 'FaPrescriptionBottle', 'FaXRay', 'FaMicroscope',
      'FaLungs', 'FaTooth', 'FaHeadSideCough', 'FaHandHoldingHeart',
      'FaWheelchair', 'FaCrutch', 'FaThermometer'
    ];

    return {
      letrasEnUso,
      coloresPredefinidos,
      iconosPredefinidos
    };
  }

  // Convertir a objeto sin campos de auditoría
  toJSON() {
    return {
      uk_area: this.uk_area,
      s_nombre_area: this.s_nombre_area,
      s_letra: this.s_letra,
      s_color: this.s_color,
      s_icono: this.s_icono,
      ck_estado: this.ck_estado
    };
  }
}

module.exports = Area;