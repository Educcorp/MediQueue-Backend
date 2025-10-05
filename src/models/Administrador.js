const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Administrador {
  constructor(data) {
    this.uk_administrador = data.uk_administrador;
    this.s_nombre = data.s_nombre;
    this.s_apellido = data.s_apellido;
    this.s_email = data.s_email;
    this.s_usuario = data.s_usuario;
    this.s_password_hash = data.s_password_hash;
    this.c_telefono = data.c_telefono;
    this.tipo_usuario = data.tipo_usuario || 1; // 1=Admin, 2=Supervisor
    this.ck_estado = data.ck_estado || 'ACTIVO';
    this.d_fecha_creacion = data.d_fecha_creacion;
    this.d_fecha_modificacion = data.d_fecha_modificacion;
    this.uk_usuario_creacion = data.uk_usuario_creacion;
    this.uk_usuario_modificacion = data.uk_usuario_modificacion;
  }

  // Crear nuevo administrador
  static async create(adminData) {
    const { s_nombre, s_apellido, s_email, s_usuario, s_password, c_telefono, tipo_usuario, uk_usuario_creacion } = adminData;

    // Encriptar contraseña
    const s_password_hash = await bcrypt.hash(s_password, 10);

    const query = `
      INSERT INTO Administrador (
        s_nombre, s_apellido, s_email, s_usuario, s_password_hash, 
        c_telefono, tipo_usuario, uk_usuario_creacion
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      s_nombre, s_apellido, s_email, s_usuario, s_password_hash,
      c_telefono, tipo_usuario || 1, uk_usuario_creacion
    ]);
    return result.insertId;
  }

  // Obtener todos los administradores activos
  static async getAll() {
    const query = `
      SELECT uk_administrador, s_nombre, s_apellido, s_email, s_usuario, 
             c_telefono, tipo_usuario, d_fecha_creacion
      FROM Administrador 
      WHERE ck_estado = 'ACTIVO'
      ORDER BY s_nombre, s_apellido
    `;
    const results = await executeQuery(query);
    return results.map(admin => new Administrador(admin));
  }

  // Obtener todos los administradores (incluyendo inactivos)
  static async getAllWithInactive() {
    const query = `
      SELECT uk_administrador, s_nombre, s_apellido, s_email, s_usuario, 
             c_telefono, tipo_usuario, ck_estado, d_fecha_creacion
      FROM Administrador 
      ORDER BY s_nombre, s_apellido
    `;
    const results = await executeQuery(query);
    return results.map(admin => new Administrador(admin));
  }

  // Obtener administrador por UUID
  static async getById(uk_administrador) {
    const query = 'SELECT * FROM Administrador WHERE uk_administrador = ?';
    const results = await executeQuery(query, [uk_administrador]);

    if (results.length === 0) {
      return null;
    }

    return new Administrador(results[0]);
  }

  // Obtener administrador por email
  static async getByEmail(s_email) {
    const query = 'SELECT * FROM Administrador WHERE s_email = ? AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query, [s_email]);

    if (results.length === 0) {
      return null;
    }

    return new Administrador(results[0]);
  }

  // Obtener administrador por usuario
  static async getByUsuario(s_usuario) {
    const query = 'SELECT * FROM Administrador WHERE s_usuario = ? AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query, [s_usuario]);

    if (results.length === 0) {
      return null;
    }

    return new Administrador(results[0]);
  }

  // Obtener cualquier administrador activo (el primero por UUID)
  static async getAnyId() {
    const query = 'SELECT uk_administrador FROM Administrador WHERE ck_estado = "ACTIVO" ORDER BY uk_administrador ASC LIMIT 1';
    const results = await executeQuery(query);
    if (results.length === 0) return null;
    return results[0].uk_administrador;
  }

  // Buscar administradores
  static async search(searchTerm) {
    const query = `
      SELECT uk_administrador, s_nombre, s_apellido, s_email, s_usuario, 
             c_telefono, tipo_usuario, d_fecha_creacion
      FROM Administrador 
      WHERE (s_nombre LIKE ? OR s_apellido LIKE ? OR s_email LIKE ? OR s_usuario LIKE ?)
      AND ck_estado = 'ACTIVO'
      ORDER BY s_nombre, s_apellido
    `;
    const term = `%${searchTerm}%`;
    const results = await executeQuery(query, [term, term, term, term]);
    return results.map(admin => new Administrador(admin));
  }

  // Actualizar administrador
  static async update(uk_administrador, adminData) {
    const { s_nombre, s_apellido, s_email, s_usuario, s_password, c_telefono, tipo_usuario, uk_usuario_modificacion } = adminData;

    let query;
    let params;

    if (s_password) {
      const s_password_hash = await bcrypt.hash(s_password, 10);
      query = `
        UPDATE Administrador 
        SET s_nombre = ?, s_apellido = ?, s_email = ?, s_usuario = ?, 
            s_password_hash = ?, c_telefono = ?, tipo_usuario = ?,
            uk_usuario_modificacion = ?, d_fecha_modificacion = NOW()
        WHERE uk_administrador = ?
      `;
      params = [s_nombre, s_apellido, s_email, s_usuario, s_password_hash, c_telefono, tipo_usuario, uk_usuario_modificacion, uk_administrador];
    } else {
      query = `
        UPDATE Administrador 
        SET s_nombre = ?, s_apellido = ?, s_email = ?, s_usuario = ?, 
            c_telefono = ?, tipo_usuario = ?,
            uk_usuario_modificacion = ?, d_fecha_modificacion = NOW()
        WHERE uk_administrador = ?
      `;
      params = [s_nombre, s_apellido, s_email, s_usuario, c_telefono, tipo_usuario, uk_usuario_modificacion, uk_administrador];
    }

    const result = await executeQuery(query, params);
    return result.affectedRows > 0;
  }

  // Cambiar contraseña
  static async changePassword(uk_administrador, newPassword, uk_usuario_modificacion) {
    const s_password_hash = await bcrypt.hash(newPassword, 10);

    const query = `
      UPDATE Administrador 
      SET s_password_hash = ?, 
          uk_usuario_modificacion = ?, 
          d_fecha_modificacion = NOW()
      WHERE uk_administrador = ?
    `;

    const result = await executeQuery(query, [s_password_hash, uk_usuario_modificacion, uk_administrador]);
    return result.affectedRows > 0;
  }

  // Soft delete - marcar como inactivo
  static async softDelete(uk_administrador, uk_usuario_modificacion) {
    const query = `
      UPDATE Administrador 
      SET ck_estado = 'INACTIVO',
          uk_usuario_modificacion = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_administrador = ?
    `;
    const result = await executeQuery(query, [uk_usuario_modificacion, uk_administrador]);
    return result.affectedRows > 0;
  }

  // Eliminar administrador (hard delete)
  static async delete(uk_administrador) {
    // Verificar si el administrador tiene turnos asociados
    const turnosQuery = 'SELECT COUNT(*) as count FROM Turno WHERE uk_administrador = ? AND ck_estado = "ACTIVO"';
    const turnosCount = await executeQuery(turnosQuery, [uk_administrador]);

    if (turnosCount[0].count > 0) {
      throw new Error('No se puede eliminar el administrador porque tiene turnos asociados');
    }

    const query = 'DELETE FROM Administrador WHERE uk_administrador = ?';
    const result = await executeQuery(query, [uk_administrador]);
    return result.affectedRows > 0;
  }

  // Verificar si el administrador tiene turnos asociados
  static async hasTurnos(uk_administrador) {
    const query = 'SELECT COUNT(*) as count FROM Turno WHERE uk_administrador = ? AND ck_estado = "ACTIVO"';
    const results = await executeQuery(query, [uk_administrador]);
    return results[0].count > 0;
  }

  // Verificar contraseña
  async verifyPassword(password) {
    if (!this.s_password_hash) return false;
    return await bcrypt.compare(password, this.s_password_hash);
  }

  // Obtener estadísticas del administrador
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
      WHERE uk_administrador = ? AND ck_estado = 'ACTIVO' AND d_fecha = CURDATE()
    `;

    const results = await executeQuery(query, [this.uk_administrador]);
    return results[0];
  }

  // Convertir a objeto sin contraseña
  toJSON() {
    const { s_password_hash, ...adminWithoutPassword } = this;
    return adminWithoutPassword;
  }

  // Convertir a objeto público (sin datos sensibles)
  toPublicJSON() {
    return {
      uk_administrador: this.uk_administrador,
      s_nombre: this.s_nombre,
      s_apellido: this.s_apellido,
      s_email: this.s_email,
      s_usuario: this.s_usuario,
      c_telefono: this.c_telefono,
      tipo_usuario: this.tipo_usuario,
      d_fecha_creacion: this.d_fecha_creacion
    };
  }
}

module.exports = Administrador;