const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Iniciar sesión de administrador
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Buscar administrador por email
  const administrador = await Administrador.getByEmail(email);
  
  if (!administrador) {
    return responses.unauthorized(res, 'Credenciales inválidas');
  }

  // Verificar contraseña
  const isValidPassword = await administrador.verifyPassword(password);
  
  if (!isValidPassword) {
    return responses.unauthorized(res, 'Credenciales inválidas');
  }

  // Generar token JWT
  const token = generateToken({
    id: administrador.id_administrador,
    email: administrador.email,
    nombre: administrador.nombre
  });

  // Responder con token y datos del usuario
  responses.success(res, {
    token,
    user: administrador.toJSON(),
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
  const { nombre, email, password } = req.body;
  const userId = req.user.id_administrador;

  // Verificar si el email ya existe (excluyendo el usuario actual)
  if (email) {
    const existingAdmin = await Administrador.getByEmail(email);
    if (existingAdmin && existingAdmin.id_administrador !== userId) {
      return responses.error(res, 'El email ya está en uso por otro administrador', 409);
    }
  }

  // Actualizar administrador
  const updated = await Administrador.update(userId, { nombre, email, password });
  
  if (!updated) {
    return responses.error(res, 'No se pudo actualizar el perfil', 400);
  }

  // Obtener datos actualizados
  const updatedAdmin = await Administrador.getById(userId);
  
  responses.success(res, updatedAdmin.toJSON(), 'Perfil actualizado exitosamente');
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

  const { nombre, email, password } = req.body;

  // Crear primer administrador
  const adminId = await Administrador.create({ nombre, email, password });
  
  // Obtener datos del administrador creado
  const newAdmin = await Administrador.getById(adminId);
  
  responses.created(res, newAdmin.toJSON(), 'Primer administrador creado exitosamente');
});

module.exports = {
  login,
  getProfile,
  updateProfile,
  logout,
  verifyToken,
  createFirstAdmin
};
