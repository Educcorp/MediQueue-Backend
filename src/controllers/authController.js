const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Iniciar sesión de administrador
 */
const login = asyncHandler(async (req, res) => {
  const { s_email, s_password } = req.body;

  // Buscar administrador por email
  const administrador = await Administrador.getByEmail(s_email);
  
  if (!administrador) {
    return responses.unauthorized(res, 'Credenciales inválidas');
  }

  // Verificar contraseña
  const isValidPassword = await administrador.verifyPassword(s_password);
  
  if (!isValidPassword) {
    return responses.unauthorized(res, 'Credenciales inválidas');
  }

  // Generar token JWT
  const token = generateToken({
    uk_administrador: administrador.uk_administrador,
    s_email: administrador.s_email,
    s_nombre: administrador.s_nombre,
    s_usuario: administrador.s_usuario,
    tipo_usuario: administrador.tipo_usuario
  });

  // Responder con token y datos del usuario
  responses.success(res, {
    token,
    user: administrador.toPublicJSON(),
    expires_in: '24h'
  }, 'Inicio de sesión exitoso');
});

/**
 * Iniciar sesión por usuario (alternativo)
 */
const loginByUsuario = asyncHandler(async (req, res) => {
  const { s_usuario, s_password } = req.body;

  // Buscar administrador por usuario
  const administrador = await Administrador.getByUsuario(s_usuario);
  
  if (!administrador) {
    return responses.unauthorized(res, 'Credenciales inválidas');
  }

  // Verificar contraseña
  const isValidPassword = await administrador.verifyPassword(s_password);
  
  if (!isValidPassword) {
    return responses.unauthorized(res, 'Credenciales inválidas');
  }

  // Generar token JWT
  const token = generateToken({
    uk_administrador: administrador.uk_administrador,
    s_email: administrador.s_email,
    s_nombre: administrador.s_nombre,
    s_usuario: administrador.s_usuario,
    tipo_usuario: administrador.tipo_usuario
  });

  // Responder con token y datos del usuario
  responses.success(res, {
    token,
    user: administrador.toPublicJSON(),
    expires_in: '24h'
  }, 'Inicio de sesión exitoso');
});

/**
 * Obtener información del usuario autenticado
 */
const getProfile = asyncHandler(async (req, res) => {
  // El usuario ya está disponible en req.user gracias al middleware de autenticación
  responses.success(res, req.user, 'Perfil obtenido exitosamente');
});

/**
 * Actualizar perfil del usuario autenticado
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { s_nombre, s_apellido, s_email, s_usuario, c_telefono, s_password } = req.body;
  const uk_administrador = req.user.uk_administrador;
  const uk_usuario_modificacion = req.user.uk_administrador;

  // Verificar si el email ya existe (excluyendo el usuario actual)
  if (s_email) {
    const existingAdmin = await Administrador.getByEmail(s_email);
    if (existingAdmin && existingAdmin.uk_administrador !== uk_administrador) {
      return responses.error(res, 'El email ya está en uso por otro administrador', 409);
    }
  }

  // Verificar si el usuario ya existe (excluyendo el usuario actual)
  if (s_usuario) {
    const existingAdmin = await Administrador.getByUsuario(s_usuario);
    if (existingAdmin && existingAdmin.uk_administrador !== uk_administrador) {
      return responses.error(res, 'El nombre de usuario ya está en uso por otro administrador', 409);
    }
  }

  // Actualizar administrador
  const updated = await Administrador.update(uk_administrador, { 
    s_nombre, 
    s_apellido, 
    s_email, 
    s_usuario, 
    c_telefono, 
    s_password,
    uk_usuario_modificacion
  });
  
  if (!updated) {
    return responses.error(res, 'No se pudo actualizar el perfil', 400);
  }

  // Obtener datos actualizados
  const updatedAdmin = await Administrador.getById(uk_administrador);
  
  responses.success(res, updatedAdmin.toPublicJSON(), 'Perfil actualizado exitosamente');
});

/**
 * Cambiar contraseña
 */
const changePassword = asyncHandler(async (req, res) => {
  const { s_password_actual, s_password_nuevo } = req.body;
  const uk_administrador = req.user.uk_administrador;
  const uk_usuario_modificacion = req.user.uk_administrador;

  // Obtener administrador actual
  const administrador = await Administrador.getById(uk_administrador);
  if (!administrador) {
    return responses.notFound(res, 'Administrador no encontrado');
  }

  // Verificar contraseña actual
  const isValidPassword = await administrador.verifyPassword(s_password_actual);
  if (!isValidPassword) {
    return responses.unauthorized(res, 'La contraseña actual es incorrecta');
  }

  // Cambiar contraseña
  const changed = await Administrador.changePassword(uk_administrador, s_password_nuevo, uk_usuario_modificacion);
  
  if (!changed) {
    return responses.error(res, 'No se pudo cambiar la contraseña', 400);
  }

  responses.success(res, null, 'Contraseña cambiada exitosamente');
});

/**
 * Cerrar sesión (invalidar token del lado del cliente)
 */
const logout = asyncHandler(async (req, res) => {
  responses.success(res, null, 'Sesión cerrada exitosamente');
});

/**
 * Verificar token (para rutas protegidas del frontend)
 */
const verifyToken = asyncHandler(async (req, res) => {
  // Si llegó hasta aquí, el token es válido (validado por middleware)
  responses.success(res, {
    valid: true,
    user: req.user
  }, 'Token válido');
});

/**
 * Crear primer administrador (solo si no existe ninguno)
 */
const createFirstAdmin = asyncHandler(async (req, res) => {
  // Verificar si ya existen administradores
  const existingAdmins = await Administrador.getAll();
  
  if (existingAdmins.length > 0) {
    return responses.error(res, 'Ya existen administradores en el sistema', 403);
  }

  const { s_nombre, s_apellido, s_email, s_usuario, s_password, c_telefono } = req.body;

  // Crear primer administrador
  const adminId = await Administrador.create({ 
    s_nombre, 
    s_apellido, 
    s_email, 
    s_usuario, 
    s_password, 
    c_telefono,
    tipo_usuario: 1, // Administrador principal
    uk_usuario_creacion: null // Primer administrador
  });
  
  // Obtener datos del administrador creado
  const newAdmin = await Administrador.getById(adminId);
  
  responses.created(res, newAdmin.toPublicJSON(), 'Primer administrador creado exitosamente');
});

/**
 * Obtener estadísticas del administrador
 */
const getEstadisticas = asyncHandler(async (req, res) => {
  const uk_administrador = req.user.uk_administrador;
  
  // Obtener administrador con estadísticas
  const administrador = await Administrador.getById(uk_administrador);
  if (!administrador) {
    return responses.notFound(res, 'Administrador no encontrado');
  }

  const estadisticas = await administrador.getEstadisticas();
  
  responses.success(res, {
    administrador: administrador.toPublicJSON(),
    estadisticas
  }, 'Estadísticas obtenidas exitosamente');
});

module.exports = {
  login,
  loginByUsuario,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyToken,
  createFirstAdmin,
  getEstadisticas
};