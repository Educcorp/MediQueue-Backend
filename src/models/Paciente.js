const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Paciente {
  constructor(data) {
    this.id_paciente = data.id_paciente;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.telefono = data.telefono;
    this.fecha_nacimiento = data.fecha_nacimiento;
    this.password = data.password;
  }

  // Crear nuevo paciente
  static async create(pacienteData) {
    const { nombre, apellido, telefono, fecha_nacimiento, password } = pacienteData;

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      INSERT INTO Paciente (nombre, apellido, telefono, fecha_nacimiento, password) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [nombre, apellido, telefono, fecha_nacimiento, hashedPassword]);
    return result.insertId;
  }

  // Obtener todos los pacientes
  static async getAll() {
    const query = 'SELECT id_paciente, nombre, apellido, telefono, fecha_nacimiento FROM Paciente';
    const results = await executeQuery(query);
    return results.map(paciente => new Paciente(paciente));
  }

  // Obtener paciente por ID
  static async getById(id) {
    const query = 'SELECT * FROM Paciente WHERE id_paciente = ?';
    const results = await executeQuery(query, [id]);

    if (results.length === 0) {
      return null;
    }

    return new Paciente(results[0]);
  }

  // Buscar pacientes por nombre o teléfono
  static async search(searchTerm) {
    const query = `
      SELECT id_paciente, nombre, apellido, telefono, fecha_nacimiento 
      FROM Paciente 
      WHERE nombre LIKE ? OR apellido LIKE ? OR telefono LIKE ?
    `;
    const term = `%${searchTerm}%`;
    const results = await executeQuery(query, [term, term, term]);
    return results.map(paciente => new Paciente(paciente));
  }

  // Obtener paciente por teléfono
  static async getByTelefono(telefono) {
    const query = 'SELECT * FROM Paciente WHERE telefono = ?';
    const results = await executeQuery(query, [telefono]);

    if (results.length === 0) {
      return null;
    }

    return new Paciente(results[0]);
  }

  // Actualizar paciente
  static async update(id, pacienteData) {
    const { nombre, apellido, telefono, fecha_nacimiento, password } = pacienteData;
    let query;
    let params;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE Paciente 
        SET nombre = ?, apellido = ?, telefono = ?, fecha_nacimiento = ?, password = ? 
        WHERE id_paciente = ?
      `;
      params = [nombre, apellido, telefono, fecha_nacimiento, hashedPassword, id];
    } else {
      query = `
        UPDATE Paciente 
        SET nombre = ?, apellido = ?, telefono = ?, fecha_nacimiento = ? 
        WHERE id_paciente = ?
      `;
      params = [nombre, apellido, telefono, fecha_nacimiento, id];
    }

    const result = await executeQuery(query, params);
    return result.affectedRows > 0;
  }

  // Eliminar paciente
  static async delete(id) {
    const query = 'DELETE FROM Paciente WHERE id_paciente = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Obtener historial de turnos del paciente
  static async getHistorialTurnos(id) {
    const query = `
      SELECT t.*, c.numero_consultorio, a.nombre_area 
      FROM Turno t
      JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
      JOIN Area a ON c.id_area = a.id_area
      WHERE t.id_paciente = ?
      ORDER BY t.fecha DESC, t.hora DESC
    `;

    const results = await executeQuery(query, [id]);
    return results;
  }

  // Verificar contraseña
  async verifyPassword(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  }

  // Convertir a objeto sin contraseña
  toJSON() {
    const { password, ...pacienteWithoutPassword } = this;
    return pacienteWithoutPassword;
  }
}

module.exports = Paciente;
