const { executeQuery } = require('../config/database');

class Area {
  constructor(data) {
    this.id_area = data.id_area;
    this.nombre_area = data.nombre_area;
  }

  // Crear nueva área
  static async create(areaData) {
    const { nombre_area } = areaData;
    
    const query = 'INSERT INTO area (nombre_area) VALUES (?)';
    const result = await executeQuery(query, [nombre_area]);
    return result.insertId;
  }

  // Obtener todas las áreas
  static async getAll() {
    const query = 'SELECT * FROM area ORDER BY nombre_area';
    const results = await executeQuery(query);
    return results.map(area => new Area(area));
  }

  // Obtener área por ID
  static async getById(id) {
    const query = 'SELECT * FROM area WHERE id_area = ?';
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new Area(results[0]);
  }

  // Obtener área con sus consultorios
  static async getWithConsultorios(id) {
    const areaQuery = 'SELECT * FROM area WHERE id_area = ?';
    const consultoriosQuery = 'SELECT * FROM consultorio WHERE id_area = ? ORDER BY numero_consultorio';
    
    const areaResults = await executeQuery(areaQuery, [id]);
    
    if (areaResults.length === 0) {
      return null;
    }
    
    const area = new Area(areaResults[0]);
    const consultorios = await executeQuery(consultoriosQuery, [id]);
    area.consultorios = consultorios;
    
    return area;
  }

  // Actualizar área
  static async update(id, areaData) {
    const { nombre_area } = areaData;
    
    const query = 'UPDATE area SET nombre_area = ? WHERE id_area = ?';
    const result = await executeQuery(query, [nombre_area, id]);
    
    return result.affectedRows > 0;
  }

  // Eliminar área
  static async delete(id) {
    // Verificar si hay consultorios asociados
    const consultoriosQuery = 'SELECT COUNT(*) as count FROM consultorio WHERE id_area = ?';
    const consultoriosCount = await executeQuery(consultoriosQuery, [id]);
    
    if (consultoriosCount[0].count > 0) {
      throw new Error('No se puede eliminar el área porque tiene consultorios asociados');
    }
    
    const query = 'DELETE FROM area WHERE id_area = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Obtener estadísticas de turnos por área
  static async getEstadisticasTurnos() {
    const query = `
      SELECT 
        a.id_area,
        a.nombre_area,
        COUNT(t.id_turno) as total_turnos,
        COUNT(CASE WHEN t.estado = 'En espera' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN t.estado = 'Atendido' THEN 1 END) as turnos_atendidos
      FROM area a
      LEFT JOIN consultorio c ON a.id_area = c.id_area
      LEFT JOIN turno t ON c.id_consultorio = t.id_consultorio
      GROUP BY a.id_area, a.nombre_area
      ORDER BY a.nombre_area
    `;
    
    const results = await executeQuery(query);
    return results;
  }
}

module.exports = Area;
