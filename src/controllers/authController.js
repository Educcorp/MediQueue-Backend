const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

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

  // ✅ VERIFICAR QUE EL EMAIL ESTÉ VERIFICADO
  if (!administrador.b_email_verified) {
    console.log('⚠️ [LOGIN] Intento de login con email no verificado:', s_email);
    return responses.error(res, 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.', 403);
  }

  console.log('✅ [LOGIN] Login exitoso para usuario verificado:', s_email);

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

  // ✅ VERIFICAR QUE EL EMAIL ESTÉ VERIFICADO
  if (!administrador.b_email_verified) {
    console.log('⚠️ [LOGIN BY USUARIO] Intento de login con email no verificado:', s_usuario);
    return responses.error(res, 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.', 403);
  }

  console.log('✅ [LOGIN BY USUARIO] Login exitoso para usuario verificado:', s_usuario);

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

/**
 * Verificar si un email existe en el sistema y está verificado
 */
const verifyEmailExists = asyncHandler(async (req, res) => {
  const { s_email } = req.body;

  if (!s_email) {
    return responses.error(res, 'El correo electrónico es requerido', 400);
  }

  // Buscar administrador por email
  const administrador = await Administrador.getByEmail(s_email);

  if (!administrador) {
    console.log('⚠️ [VERIFY-EMAIL] Correo no encontrado:', s_email);
    return responses.notFound(res, 'El correo electrónico no está registrado');
  }

  // Verificar que el email esté verificado
  if (!administrador.b_email_verified) {
    console.log('⚠️ [VERIFY-EMAIL] Email no verificado:', s_email);
    return responses.error(res, 'Debe verificar su correo electrónico primero', 403);
  }

  console.log('✅ [VERIFY-EMAIL] Email encontrado y verificado:', s_email);

  // Devolver datos básicos del administrador (sin información sensible)
  responses.success(res, {
    email: administrador.s_email,
    nombre: administrador.s_nombre,
    apellido: administrador.s_apellido,
    usuario: administrador.s_usuario
  }, 'Correo electrónico verificado exitosamente');
});

/**
 * Confirmar identidad y otorgar acceso rápido
 */
const confirmIdentity = asyncHandler(async (req, res) => {
  const { s_email } = req.body;

  if (!s_email) {
    return responses.error(res, 'El correo electrónico es requerido', 400);
  }

  // Buscar administrador por email
  const administrador = await Administrador.getByEmail(s_email);

  if (!administrador) {
    console.log('⚠️ [CONFIRM-IDENTITY] Correo no encontrado:', s_email);
    return responses.notFound(res, 'El correo electrónico no está registrado');
  }

  // Verificar que el email esté verificado
  if (!administrador.b_email_verified) {
    console.log('⚠️ [CONFIRM-IDENTITY] Email no verificado:', s_email);
    return responses.error(res, 'Debe verificar su correo electrónico primero', 403);
  }

  console.log('✅ [CONFIRM-IDENTITY] Identidad confirmada para:', s_email);

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
  }, 'Identidad confirmada exitosamente');
});

/**
 * Solicitar recuperación de contraseña
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { s_email } = req.body;

  if (!s_email) {
    return responses.error(res, 'El correo electrónico es requerido', 400);
  }

  console.log('📧 [REQUEST PASSWORD RESET] Solicitud para:', s_email);

  // Generar token de reseteo
  const result = await Administrador.generatePasswordResetToken(s_email);

  if (!result) {
    console.log('⚠️ [REQUEST PASSWORD RESET] Email no encontrado:', s_email);
    // Por seguridad, siempre respondemos con éxito incluso si el email no existe
    return responses.success(res, null, 'Si el correo electrónico está registrado, recibirás un enlace de recuperación');
  }

  if (result.error === 'email_not_verified') {
    console.log('⚠️ [REQUEST PASSWORD RESET] Email no verificado:', s_email);
    return responses.error(res, 'Debes verificar tu correo electrónico antes de poder recuperar tu contraseña', 403);
  }

  // Enviar email de recuperación
  try {
    await emailService.sendPasswordResetEmail(
      result.admin.s_email,
      result.admin.s_nombre,
      result.token
    );

    console.log('✅ [REQUEST PASSWORD RESET] Email de recuperación enviado a:', s_email);
    responses.success(res, null, 'Se ha enviado un enlace de recuperación a tu correo electrónico');
  } catch (error) {
    console.error('❌ [REQUEST PASSWORD RESET] Error al enviar email:', error);
    return responses.error(res, 'Error al enviar el correo de recuperación. Por favor, intenta nuevamente más tarde.', 500);
  }
});

/**
 * Verificar token de reseteo de contraseña
 */
const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return responses.error(res, 'Token no proporcionado', 400);
  }

  console.log('🔍 [VERIFY RESET TOKEN] Verificando token...');

  // Buscar administrador por token
  const administrador = await Administrador.getByPasswordResetToken(token);

  if (!administrador) {
    console.log('❌ [VERIFY RESET TOKEN] Token inválido o expirado');
    return responses.error(res, 'El enlace de recuperación es inválido o ha expirado', 400);
  }

  console.log('✅ [VERIFY RESET TOKEN] Token válido para:', administrador.s_email);

  responses.success(res, {
    email: administrador.s_email,
    valid: true
  }, 'Token válido');
});

/**
 * Resetear contraseña con token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, s_password_nuevo } = req.body;

  if (!token || !s_password_nuevo) {
    return responses.error(res, 'Token y nueva contraseña son requeridos', 400);
  }

  if (s_password_nuevo.length < 6) {
    return responses.error(res, 'La contraseña debe tener al menos 6 caracteres', 400);
  }

  console.log('🔄 [RESET PASSWORD] Reseteando contraseña...');

  // Resetear contraseña
  const result = await Administrador.resetPasswordWithToken(token, s_password_nuevo);

  if (!result.success) {
    console.log('❌ [RESET PASSWORD] Error:', result.message);
    return responses.error(res, result.message, 400);
  }

  console.log('✅ [RESET PASSWORD] Contraseña actualizada para:', result.admin.s_email);

  responses.success(res, null, 'Contraseña actualizada exitosamente');
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
  getEstadisticas,
  verifyEmailExists,
  confirmIdentity,
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};