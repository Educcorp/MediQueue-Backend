const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Paciente {
  constructor(data) {
    this.uk_paciente = data.uk_paciente;
    this.s_nombre = data.s_nombre;
    this.s_apellido = data.s_apellido;
    this.c_telefono = data.c_telefono;
    this.d_fecha_nacimiento = data.d_fecha_nacimiento;
    this.s_password_hash = data.s_password_hash;
    this.s_email = data.s_email;
    this.ck_estado = data.ck_estado || 'ACTIVO';
    this.d_fecha_creacion = data.d_fecha_creacion;
    this.d_fecha_modificacion = data.d_fecha_modificacion;
    this.uk_usuario_creacion = data.uk_usuario_creacion;
    this.uk_usuario_modificacion = data.uk_usuario_modificacion;
  }

  // Crear nuevo paciente
  static async create(pacienteData) {
    const { s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_password, s_email, uk_usuario_creacion } = pacienteData;

    // Encriptar contraseña si se proporciona
    let s_password_hash = null;
    if (s_password && s_password !== 'temp_password') {
      s_password_hash = await bcrypt.hash(s_password, 10);
    } else if (s_password === 'temp_password') {
      // Para pacientes públicos, usar una contraseña temporal hasheada
      s_password_hash = await bcrypt.hash('temp_password', 10);
    }

    const query = `
      INSERT INTO Paciente (
        s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, 
        s_password_hash, s_email, uk_usuario_creacion
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      s_nombre, s_apellido, c_telefono, d_fecha_nacimiento,
      s_password_hash, s_email, uk_usuario_creacion
    ]);
    return result.insertId;
  }

  // Obtener todos los pacientes activos
  static async getAll() {
    const query = `
      SELECT uk_paciente, s_nombre, s_apellido, c_telefono, 
             d_fecha_nacimiento, s_email, d_fecha_creacion
      FROM Paciente 
      WHERE ck_estado = 'ACTIVO'
      ORDER BY s_nombre, s_apellido
    `;
    const results = await executeQuery(query);
    return results.map(paciente => new Paciente(paciente));
  }

  // Obtener todos los pacientes (incluyendo inactivos)
  static async getAllWithInactive() {
    const query = `
      SELECT uk_paciente, s_nombre, s_apellido, c_telefono, 
             d_fecha_nacimiento, s_email, ck_estado, d_fecha_creacion
      FROM Paciente 
      ORDER BY s_nombre, s_apellido
    `;
    const results = await executeQuery(query);
    return results.map(paciente => new Paciente(paciente));
  }

  // Obtener paciente por UUID
  static async getById(uk_paciente) {
    const query = 'SELECT * FROM Paciente WHERE uk_paciente = ?';
    const results = await executeQuery(query, [uk_paciente]);

    if (results.length === 0) {
      return null;
    }

    return new Paciente(results[0]);
  }

  // Obtener paciente por teléfono
  static async getByTelefono(c_telefono) {
    const query = 'SELECT * FROM Paciente WHERE c_telefono = ? AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query, [c_telefono]);

    if (results.length === 0) {
      return null;
    }

    return new Paciente(results[0]);
  }

  // Obtener paciente por email
  static async getByEmail(s_email) {
    const query = 'SELECT * FROM Paciente WHERE s_email = ? AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query, [s_email]);

    if (results.length === 0) {
      return null;
    }

    return new Paciente(results[0]);
  }

  // Buscar pacientes por nombre, apellido o teléfono
  static async search(searchTerm) {
    const query = `
      SELECT uk_paciente, s_nombre, s_apellido, c_telefono, 
             d_fecha_nacimiento, s_email, d_fecha_creacion
      FROM Paciente 
      WHERE (s_nombre LIKE ? OR s_apellido LIKE ? OR c_telefono LIKE ? OR s_email LIKE ?)
      AND ck_estado = 'ACTIVO'
      ORDER BY s_nombre, s_apellido
    `;
    const term = `%${searchTerm}%`;
    const results = await executeQuery(query, [term, term, term, term]);
    return results.map(paciente => new Paciente(paciente));
  }

  // Actualizar paciente
  static async update(uk_paciente, pacienteData) {
    const { s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_password, s_email, uk_usuario_modificacion } = pacienteData;

    let query;
    let params;

    if (s_password) {
      const s_password_hash = await bcrypt.hash(s_password, 10);
      query = `
        UPDATE Paciente 
        SET s_nombre = ?, s_apellido = ?, c_telefono = ?, d_fecha_nacimiento = ?, 
            s_password_hash = ?, s_email = ?,
            uk_usuario_modificacion = ?, d_fecha_modificacion = NOW()
        WHERE uk_paciente = ?
      `;
      params = [s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_password_hash, s_email, uk_usuario_modificacion, uk_paciente];
    } else {
      query = `
        UPDATE Paciente 
        SET s_nombre = ?, s_apellido = ?, c_telefono = ?, d_fecha_nacimiento = ?, 
            s_email = ?,
            uk_usuario_modificacion = ?, d_fecha_modificacion = NOW()
        WHERE uk_paciente = ?
      `;
      params = [s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_email, uk_usuario_modificacion, uk_paciente];
    }

    const result = await executeQuery(query, params);
    return result.affectedRows > 0;
  }

  // Cambiar contraseña
  static async changePassword(uk_paciente, newPassword, uk_usuario_modificacion) {
    const s_password_hash = await bcrypt.hash(newPassword, 10);

    const query = `
      UPDATE Paciente 
      SET s_password_hash = ?, 
          uk_usuario_modificacion = ?, 
          d_fecha_modificacion = NOW()
      WHERE uk_paciente = ?
    `;

    const result = await executeQuery(query, [s_password_hash, uk_usuario_modificacion, uk_paciente]);
    return result.affectedRows > 0;
  }

  // Soft delete - marcar como inactivo
  static async softDelete(uk_paciente, uk_usuario_modificacion) {
    const query = `
      UPDATE Paciente 
      SET ck_estado = 'INACTIVO',
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_paciente = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_paciente]);
    return result.affectedRows > 0;
  }

  // Eliminar paciente (hard delete)
  static async delete(uk_paciente) {
    // Verificar si el paciente tiene turnos asociados
    const turnosQuery = 'SELECT COUNT(*) as count FROM Turno WHERE uk_paciente = ? AND ck_estado = "ACTIVO"';
    const turnosCount = await executeQuery(turnosQuery, [uk_paciente]);

    if (turnosCount[0].count > 0) {
      throw new Error('No se puede eliminar el paciente porque tiene turnos asociados');
    }

    const query = 'DELETE FROM Paciente WHERE uk_paciente = ?';
    const result = await executeQuery(query, [uk_paciente]);
    return result.affectedRows > 0;
  }

  // Obtener historial de turnos del paciente
  static async getHistorialTurnos(uk_paciente) {
    const query = `
      SELECT 
        t.uk_turno,
        t.i_numero_turno,
        t.s_estado,
        t.d_fecha,
        t.t_hora,
        t.s_observaciones,
        t.d_fecha_atencion,
        t.d_fecha_cancelacion,
        c.i_numero_consultorio,
        a.s_nombre_area
      FROM Turno t
      JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
      JOIN Area a ON c.uk_area = a.uk_area
      WHERE t.uk_paciente = ? AND t.ck_estado = 'ACTIVO'
      ORDER BY t.d_fecha DESC, t.t_hora DESC
    `;

    const results = await executeQuery(query, [uk_paciente]);
    return results;
  }

  // Obtener estadísticas del paciente
  async getEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_turnos,
        COUNT(CASE WHEN s_estado = 'EN_ESPERA' THEN 1 END) as turnos_en_espera,
        COUNT(CASE WHEN s_estado = 'LLAMANDO' THEN 1 END) as turnos_llamando,
        COUNT(CASE WHEN s_estado = 'ATENDIDO' THEN 1 END) as turnos_atendidos,
        COUNT(CASE WHEN s_estado = 'CANCELADO' THEN 1 END) as turnos_cancelados,
        COUNT(CASE WHEN s_estado = 'NO_PRESENTE' THEN 1 END) as turnos_no_presente
      FROM Turno 
      WHERE uk_paciente = ? AND ck_estado = 'ACTIVO'
    `;

    const results = await executeQuery(query, [this.uk_paciente]);
    return results[0];
  }

  // Verificar contraseña
  async verifyPassword(password) {
    if (!this.s_password_hash) return false;
    return await bcrypt.compare(password, this.s_password_hash);
  }

  // Calcular edad
  getEdad() {
    if (!this.d_fecha_nacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(this.d_fecha_nacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  // Convertir a objeto sin contraseña
  toJSON() {
    const { s_password_hash, ...pacienteWithoutPassword } = this;
    return pacienteWithoutPassword;
  }

  // Convertir a objeto público (sin datos sensibles)
  toPublicJSON() {
    return {
      uk_paciente: this.uk_paciente,
      s_nombre: this.s_nombre,
      s_apellido: this.s_apellido,
      c_telefono: this.c_telefono,
      d_fecha_nacimiento: this.d_fecha_nacimiento,
      s_email: this.s_email,
      edad: this.getEdad()
    };
  }
}

module.exports = Paciente;