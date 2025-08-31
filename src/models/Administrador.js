const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Administrador {
  constructor(data) {
    this.id_administrador = data.id_administrador;
    this.nombre = data.nombre;
    this.email = data.email;
    this.password = data.password;
  }

  // Crear nuevo administrador
  static async create(adminData) {
    const { nombre, email, password } = adminData;
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO administrador (nombre, email, password) 
      VALUES (?, ?, ?)
    `;
    
    const result = await executeQuery(query, [nombre, email, hashedPassword]);
    return result.insertId;
  }

  // Obtener todos los administradores
  static async getAll() {
    const query = 'SELECT id_administrador, nombre, email FROM administrador';
    const results = await executeQuery(query);
    return results.map(admin => new Administrador(admin));
  }

  // Obtener administrador por ID
  static async getById(id) {
    const query = 'SELECT * FROM administrador WHERE id_administrador = ?';
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new Administrador(results[0]);
  }

  // Obtener administrador por email
  static async getByEmail(email) {
    const query = 'SELECT * FROM administrador WHERE email = ?';
    const results = await executeQuery(query, [email]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new Administrador(results[0]);
  }

  // Actualizar administrador
  static async update(id, adminData) {
    const { nombre, email, password } = adminData;
    let query;
    let params;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE administrador SET nombre = ?, email = ?, password = ? WHERE id_administrador = ?';
      params = [nombre, email, hashedPassword, id];
    } else {
      query = 'UPDATE administrador SET nombre = ?, email = ? WHERE id_administrador = ?';
      params = [nombre, email, id];
    }

    const result = await executeQuery(query, params);
    return result.affectedRows > 0;
  }

  // Eliminar administrador
  static async delete(id) {
    const query = 'DELETE FROM administrador WHERE id_administrador = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Verificar contraseña
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Convertir a objeto sin contraseña
  toJSON() {
    const { password, ...adminWithoutPassword } = this;
    return adminWithoutPassword;
  }
}

module.exports = Administrador;
