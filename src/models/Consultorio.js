const { executeQuery } = require('../config/database');

class Consultorio {
  constructor(data) {
    this.id_consultorio = data.id_consultorio;
    this.numero_consultorio = data.numero_consultorio;
    this.id_area = data.id_area;
    this.nombre_area = data.nombre_area; // Para cuando se hace JOIN
  }

  // Crear nuevo consultorio
  static async create(consultorioData) {
    const { numero_consultorio, id_area } = consultorioData;

    // Verificar que el área existe
    const areaQuery = 'SELECT id_area FROM Area WHERE id_area = ?';
    const areaExists = await executeQuery(areaQuery, [id_area]);

    if (areaExists.length === 0) {
      throw new Error('El área especificada no existe');
    }

    // Verificar que no exista otro consultorio con el mismo número en la misma área
    const duplicateQuery = 'SELECT id_consultorio FROM Consultorio WHERE numero_consultorio = ? AND id_area = ?';
    const duplicate = await executeQuery(duplicateQuery, [numero_consultorio, id_area]);

    if (duplicate.length > 0) {
      throw new Error('Ya existe un consultorio con este número en la misma área');
    }

    const query = 'INSERT INTO Consultorio (numero_consultorio, id_area) VALUES (?, ?)';
    const result = await executeQuery(query, [numero_consultorio, id_area]);
    return result.insertId;
  }

  // Obtener todos los consultorios
  static async getAll() {
    const query = `
      SELECT c.*, a.nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.id_area = a.id_area
      ORDER BY a.nombre_area, c.numero_consultorio
    `;
    const results = await executeQuery(query);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Obtener consultorio por ID
  static async getById(id) {
    const query = `
      SELECT c.*, a.nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.id_area = a.id_area
      WHERE c.id_consultorio = ?
    `;
    const results = await executeQuery(query, [id]);

    if (results.length === 0) {
      return null;
    }

    return new Consultorio(results[0]);
  }

  // Obtener consultorios por área
  static async getByArea(id_area) {
    const query = `
      SELECT c.*, a.nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.id_area = a.id_area
      WHERE c.id_area = ?
      ORDER BY c.numero_consultorio
    `;
    const results = await executeQuery(query, [id_area]);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Actualizar consultorio
  static async update(id, consultorioData) {
    const { numero_consultorio, id_area } = consultorioData;

    // Verificar que el área existe
    const areaQuery = 'SELECT id_area FROM Area WHERE id_area = ?';
    const areaExists = await executeQuery(areaQuery, [id_area]);

    if (areaExists.length === 0) {
      throw new Error('El área especificada no existe');
    }

    // Verificar que no exista otro consultorio con el mismo número en la misma área (excepto el actual)
    const duplicateQuery = 'SELECT id_consultorio FROM Consultorio WHERE numero_consultorio = ? AND id_area = ? AND id_consultorio != ?';
    const duplicate = await executeQuery(duplicateQuery, [numero_consultorio, id_area, id]);

    if (duplicate.length > 0) {
      throw new Error('Ya existe un consultorio con este número en la misma área');
    }

    const query = 'UPDATE Consultorio SET numero_consultorio = ?, id_area = ? WHERE id_consultorio = ?';
    const result = await executeQuery(query, [numero_consultorio, id_area, id]);

    return result.affectedRows > 0;
  }

  // Eliminar consultorio
  static async delete(id) {
    // Verificar si hay turnos asociados
    const turnosQuery = 'SELECT COUNT(*) as count FROM Turno WHERE id_consultorio = ?';
    const turnosCount = await executeQuery(turnosQuery, [id]);

    if (turnosCount[0].count > 0) {
      throw new Error('No se puede eliminar el consultorio porque tiene turnos asociados');
    }

    const query = 'DELETE FROM Consultorio WHERE id_consultorio = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Obtener consultorios disponibles (sin turnos en espera o llamando)
  static async getDisponibles() {
    const query = `
      SELECT DISTINCT c.*, a.nombre_area 
      FROM Consultorio c
      JOIN Area a ON c.id_area = a.id_area
      WHERE c.id_consultorio NOT IN (
        SELECT DISTINCT id_consultorio 
        FROM Turno 
        WHERE estado IN ('En espera', 'Llamando') 
        AND fecha = CURDATE()
      )
      ORDER BY a.nombre_area, c.numero_consultorio
    `;
    const results = await executeQuery(query);
    return results.map(consultorio => new Consultorio(consultorio));
  }

  // Obtener estadísticas de turnos del consultorio
  async getEstadisticasTurnos() {
    const query = `
      SELECT 
        COUNT(*) as total_turnos,
        COUNT(CASE WHEN estado = 'En espera' THEN 1 END) as en_espera,
        COUNT(CASE WHEN estado = 'Llamando' THEN 1 END) as llamando,
        COUNT(CASE WHEN estado = 'Atendido' THEN 1 END) as atendidos,
        COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END) as cancelados
      FROM Turno 
      WHERE id_consultorio = ? AND fecha = CURDATE()
    `;

    const results = await executeQuery(query, [this.id_consultorio]);
    return results[0];
  }
}

module.exports = Consultorio;
