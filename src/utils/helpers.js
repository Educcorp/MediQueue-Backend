/**
 * Funciones auxiliares para la aplicación
 */

const helpers = {
  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validar teléfono (formato internacional flexible similar a E.164)
  isValidPhone: (phone) => {
    if (!phone) return false;
    // Eliminar espacios, guiones y paréntesis, conservar '+' si está al inicio
    const normalized = String(phone)
      .trim()
      .replace(/\s|\-|\(|\)/g, '');

    // Permitir opcional '+' seguida de 8 a 15 dígitos (rangos comunes internacionales)
    // No permitir ceros a la izquierda tras el '+' según E.164 (1-9)
    const e164LikeRegex = /^\+?[1-9]\d{7,14}$/;
    return e164LikeRegex.test(normalized);
  },

  // Formatear fecha para MySQL
  formatDateForDB: (date) => {
    if (!date) return null;
    return new Date(date).toISOString().slice(0, 10);
  },

  // Formatear tiempo para MySQL
  formatTimeForDB: (time) => {
    if (!time) return null;
    return time.slice(0, 8); // HH:MM:SS
  },

  // Generar número de turno aleatorio (backup si falla el secuencial)
  generateTurnoNumber: () => {
    return Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
  },

  // Validar que una fecha no sea pasada
  isDateInFuture: (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  },

  // Sanitizar string para búsquedas
  sanitizeSearchTerm: (term) => {
    if (!term) return '';
    return term.trim().replace(/[%_]/g, '\\$&');
  },

  // Calcular edad desde fecha de nacimiento
  calculateAge: (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  },

  // Formatear nombre completo
  formatFullName: (nombre, apellido) => {
    if (!nombre && !apellido) return 'Paciente Invitado';
    if (!apellido) return nombre;
    if (!nombre) return apellido;
    return `${nombre} ${apellido}`;
  },

  // Validar que un estado de turno sea válido
  isValidTurnoEstado: (estado) => {
    const estadosValidos = [
      'En espera', 'Llamando', 'Atendido', 'Cancelado', // Formato español (legacy)
      'EN_ESPERA', 'LLAMANDO', 'ATENDIDO', 'CANCELADO', 'NO_PRESENTE' // Formato nuevo
    ];
    return estadosValidos.includes(estado);
  },

  // Escapar caracteres especiales para HTML
  escapeHtml: (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Generar código alfanumérico aleatorio
  generateRandomCode: (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Verificar si un objeto está vacío
  isEmpty: (obj) => {
    return obj === null || obj === undefined ||
      (typeof obj === 'object' && Object.keys(obj).length === 0) ||
      (typeof obj === 'string' && obj.trim().length === 0);
  }
};

module.exports = helpers;
