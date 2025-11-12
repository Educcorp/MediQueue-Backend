const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    this.b_email_verified = data.b_email_verified || false;
    this.s_verification_token = data.s_verification_token;
    this.d_verification_token_expires = data.d_verification_token_expires;
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

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Generar UUID manualmente
    const uuid = crypto.randomUUID();

    const query = `
      INSERT INTO Administrador (
        uk_administrador, s_nombre, s_apellido, s_email, s_usuario, s_password_hash, 
        c_telefono, tipo_usuario, b_email_verified, s_verification_token,
        d_verification_token_expires, uk_usuario_creacion
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      uuid, s_nombre, s_apellido, s_email, s_usuario, s_password_hash,
      c_telefono, tipo_usuario || 1, false, verificationToken, tokenExpires,
      uk_usuario_creacion
    ]);
    
    return {
      insertId: uuid,
      verificationToken: verificationToken
    };
  }

  // Obtener todos los administradores activos
  static async getAll() {
    const query = `
      SELECT uk_administrador, s_nombre, s_apellido, s_email, s_usuario, 
             c_telefono, tipo_usuario, b_email_verified, d_fecha_creacion
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
             c_telefono, tipo_usuario, ck_estado, b_email_verified, d_fecha_creacion
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

  // Obtener administrador por token de verificación
  static async getByVerificationToken(token) {
    console.log('🔍 [GET BY TOKEN] Buscando admin con token:', token?.substring(0, 10) + '...');
    const query = 'SELECT * FROM Administrador WHERE s_verification_token = ? AND d_verification_token_expires > NOW()';
    const results = await executeQuery(query, [token]);
    
    console.log('🔍 [GET BY TOKEN] Resultados encontrados:', results.length);
    if (results.length > 0) {
      console.log('🔍 [GET BY TOKEN] Email del admin encontrado:', results[0].s_email);
      console.log('🔍 [GET BY TOKEN] b_email_verified actual:', results[0].b_email_verified);
      console.log('🔍 [GET BY TOKEN] Token expira:', results[0].d_verification_token_expires);
    }

    if (results.length === 0) {
      // Verificar si existe el token pero expiró
      const expiredQuery = 'SELECT * FROM Administrador WHERE s_verification_token = ?';
      const expiredResults = await executeQuery(expiredQuery, [token]);
      if (expiredResults.length > 0) {
        console.log('⚠️ [GET BY TOKEN] Token encontrado pero expirado para:', expiredResults[0].s_email);
        console.log('⚠️ [GET BY TOKEN] Expiró el:', expiredResults[0].d_verification_token_expires);
      } else {
        console.log('❌ [GET BY TOKEN] Token no existe en la base de datos');
      }
      return null;
    }

    return new Administrador(results[0]);
  }

  // Verificar email del administrador
  static async verifyEmail(token) {
    console.log('🔎 [MODEL VERIFY] Token recibido:', token);
    
    // Primero, buscar el admin por el token activo
    const admin = await this.getByVerificationToken(token);
    console.log('🔎 [MODEL VERIFY] Admin encontrado por token:', admin ? `Sí - ${admin.s_email}` : 'No');
    
    if (!admin) {
      // Si no se encuentra con token activo, verificar si ya fue verificado antes
      // Buscamos por el histórico: admin con email verificado y sin token
      const queryAlreadyVerified = `
        SELECT uk_administrador, s_email, b_email_verified, s_nombre, s_apellido, d_fecha_modificacion
        FROM Administrador 
        WHERE b_email_verified = TRUE
        AND s_verification_token IS NULL
        ORDER BY d_fecha_modificacion DESC
        LIMIT 10
      `;
      const verifiedAdmins = await executeQuery(queryAlreadyVerified);
      console.log('🔎 [MODEL VERIFY] Admins verificados recientes:', verifiedAdmins.length);
      
      // Si hay admins verificados recientemente (últimos 30 días), asumir que el token fue usado
      if (verifiedAdmins.length > 0) {
        const recentlyVerified = verifiedAdmins.find(a => {
          const modifiedDate = new Date(a.d_fecha_modificacion);
          const daysSinceVerified = (Date.now() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceVerified <= 30;
        });
        
        if (recentlyVerified) {
          console.log('🔎 [MODEL VERIFY] Token ya fue usado:', recentlyVerified.s_email);
          return {
            success: false,
            message: 'Este enlace de verificación ya fue utilizado',
            alreadyVerified: true
          };
        }
      }
      
      console.log('❌ [MODEL VERIFY] Token inválido o expirado');
      return { success: false, message: 'Token inválido o expirado' };
    }

    // Verificar si el email ya fue verificado (por si acaso)
    console.log('🔎 [MODEL VERIFY] Estado verificación actual:', admin.b_email_verified);
    if (admin.b_email_verified) {
      console.log('⚠️ [MODEL VERIFY] Email ya estaba verificado');
      return {
        success: false,
        message: 'Este correo electrónico ya ha sido verificado',
        alreadyVerified: true
      };
    }

    console.log('🔄 [MODEL VERIFY] Ejecutando UPDATE para verificar email...');
    console.log('🔄 [MODEL VERIFY] uk_administrador:', admin.uk_administrador);
    
    const query = `
      UPDATE Administrador 
      SET b_email_verified = TRUE,
          s_verification_token = NULL,
          d_verification_token_expires = NULL,
          d_fecha_modificacion = NOW()
      WHERE uk_administrador = ?
    `;

    try {
      const result = await executeQuery(query, [admin.uk_administrador]);
      console.log('✅ [MODEL VERIFY] UPDATE ejecutado. Resultado:', result);
      console.log('✅ [MODEL VERIFY] Filas afectadas:', result.affectedRows);
      console.log('✅ [MODEL VERIFY] Changed rows:', result.changedRows);
      
      if (result.affectedRows === 0) {
        console.error('❌ [MODEL VERIFY] No se actualizó ninguna fila. Posible problema de UUID o permisos');
        return { 
          success: false, 
          message: 'Error al actualizar el estado de verificación. Contacta al administrador.'
        };
      }
      
      // Verificar que realmente se actualizó - ESPERAR UN MOMENTO
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedAdmin = await this.getById(admin.uk_administrador);
      console.log('✅ [MODEL VERIFY] Admin después del UPDATE:');
      console.log('   → b_email_verified:', updatedAdmin?.b_email_verified);
      console.log('   → s_verification_token:', updatedAdmin?.s_verification_token ? 'Tiene token' : 'NULL');
      
      if (!updatedAdmin || !updatedAdmin.b_email_verified) {
        console.error('❌ [MODEL VERIFY] La verificación en BD falló. Admin después del UPDATE:', updatedAdmin);
        return {
          success: false,
          message: 'Error al verificar el email. Por favor intenta de nuevo.'
        };
      }
      
      return { 
        success: true, 
        message: 'Email verificado exitosamente',
        admin: updatedAdmin.toPublicJSON()  // Retornar el admin ACTUALIZADO
      };
    } catch (error) {
      console.error('❌ [MODEL VERIFY] Error durante el UPDATE:', error);
      throw error;
    }
  }

  /**
   * Buscar administradores que hayan sido verificados recientemente.
   * Esto se utiliza como un fallback cuando el token ya fue consumido pero
   * queremos confirmar en el backend que la cuenta quedó verificada.
   * @param {number} seconds ventana en segundos para considerar "reciente"
   */
  static async getRecentlyVerified(seconds = 120) {
    const cutoff = new Date(Date.now() - seconds * 1000);
    const query = `
      SELECT * FROM Administrador
      WHERE b_email_verified = TRUE
        AND d_fecha_modificacion >= ?
      ORDER BY d_fecha_modificacion DESC
      LIMIT 1
    `;

    const results = await executeQuery(query, [cutoff]);
    if (!results || results.length === 0) return null;
    
    return this._fromDbRow(results[0]);
  }

  // Helper to build an Administrador-like object from a DB row
  static _fromDbRow(row) {
    return new Administrador({
      uk_administrador: row.uk_administrador,
      s_nombre: row.s_nombre,
      s_apellido: row.s_apellido,
      s_email: row.s_email,
      s_usuario: row.s_usuario,
      s_password_hash: row.s_password_hash,
      c_telefono: row.c_telefono,
      tipo_usuario: row.tipo_usuario,
      ck_estado: row.ck_estado,
      b_email_verified: row.b_email_verified,
      s_verification_token: row.s_verification_token,
      d_verification_token_expires: row.d_verification_token_expires,
      d_fecha_creacion: row.d_fecha_creacion,
      d_fecha_modificacion: row.d_fecha_modificacion,
      uk_usuario_creacion: row.uk_usuario_creacion,
      uk_usuario_modificacion: row.uk_usuario_modificacion
    });
  }

  // Reenviar email de verificación (generar nuevo token)
  static async resendVerificationEmail(uk_administrador) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const query = `
      UPDATE Administrador 
      SET s_verification_token = ?,
          d_verification_token_expires = ?,
          d_fecha_modificacion = NOW()
      WHERE uk_administrador = ?
    `;

    await executeQuery(query, [verificationToken, tokenExpires, uk_administrador]);
    
    return verificationToken;
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
      b_email_verified: this.b_email_verified,
      d_fecha_creacion: this.d_fecha_creacion
    };
  }
}

module.exports = Administrador;