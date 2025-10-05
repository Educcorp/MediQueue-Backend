const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Obtener todos los administradores activos
 */
const getAllAdmins = asyncHandler(async (req, res) => {
    const administradores = await Administrador.getAll();
    responses.success(res, administradores.map(admin => admin.toPublicJSON()), 'Administradores obtenidos exitosamente');
});

/**
 * Obtener todos los administradores (incluyendo inactivos)
 */
const getAllAdminsWithInactive = asyncHandler(async (req, res) => {
    const administradores = await Administrador.getAllWithInactive();
    responses.success(res, administradores.map(admin => admin.toPublicJSON()), 'Administradores obtenidos exitosamente');
});

/**
 * Crear un nuevo administrador
 */
const createAdmin = asyncHandler(async (req, res) => {
    const { s_nombre, s_apellido, s_email, s_usuario, s_password, c_telefono, tipo_usuario } = req.body;
    const uk_usuario_creacion = req.user?.uk_administrador || null;

    // Verificar si el email ya existe
    const existingEmail = await Administrador.getByEmail(s_email);
    if (existingEmail) {
        return responses.error(res, 'Ya existe un administrador con ese email', 409);
    }

    // Verificar si el usuario ya existe
    const existingUsuario = await Administrador.getByUsuario(s_usuario);
    if (existingUsuario) {
        return responses.error(res, 'Ya existe un administrador con ese nombre de usuario', 409);
    }

    // Crear administrador
    const uk_administrador = await Administrador.create({
        s_nombre,
        s_apellido,
        s_email,
        s_usuario,
        s_password,
        c_telefono,
        tipo_usuario,
        uk_usuario_creacion
    });

    // Obtener datos del administrador creado (sin password)
    const newAdmin = await Administrador.getById(uk_administrador);

    responses.created(res, newAdmin.toPublicJSON(), 'Administrador creado exitosamente');
});

/**
 * Obtener administrador por UUID
 */
const getAdminById = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;

    const administrador = await Administrador.getById(uk_administrador);

    if (!administrador) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    responses.success(res, administrador.toPublicJSON(), 'Administrador obtenido exitosamente');
});

/**
 * Obtener administrador por email
 */
const getAdminByEmail = asyncHandler(async (req, res) => {
    const { s_email } = req.params;

    const administrador = await Administrador.getByEmail(s_email);

    if (!administrador) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    responses.success(res, administrador.toPublicJSON(), 'Administrador obtenido exitosamente');
});

/**
 * Obtener administrador por usuario
 */
const getAdminByUsuario = asyncHandler(async (req, res) => {
    const { s_usuario } = req.params;

    const administrador = await Administrador.getByUsuario(s_usuario);

    if (!administrador) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    responses.success(res, administrador.toPublicJSON(), 'Administrador obtenido exitosamente');
});

/**
 * Buscar administradores
 */
const searchAdmins = asyncHandler(async (req, res) => {
    const { term } = req.query;

    if (!term || term.trim().length < 2) {
        return responses.error(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
    }

    const administradores = await Administrador.search(term);

    responses.success(res, administradores.map(admin => admin.toPublicJSON()), 'Búsqueda de administradores completada');
});

/**
 * Actualizar administrador
 */
const updateAdmin = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;
    const { s_nombre, s_apellido, s_email, s_usuario, c_telefono, tipo_usuario, s_password } = req.body;
    const uk_usuario_modificacion = req.user?.uk_administrador || null;

    // Verificar que el administrador existe
    const existingAdmin = await Administrador.getById(uk_administrador);
    if (!existingAdmin) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // Verificar si el email ya existe (excluyendo el administrador actual)
    if (s_email && s_email !== existingAdmin.s_email) {
        const emailExists = await Administrador.getByEmail(s_email);
        if (emailExists && emailExists.uk_administrador !== uk_administrador) {
            return responses.error(res, 'El email ya está en uso por otro administrador', 409);
        }
    }

    // Verificar si el usuario ya existe (excluyendo el administrador actual)
    if (s_usuario && s_usuario !== existingAdmin.s_usuario) {
        const usuarioExists = await Administrador.getByUsuario(s_usuario);
        if (usuarioExists && usuarioExists.uk_administrador !== uk_administrador) {
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
        tipo_usuario,
        s_password,
        uk_usuario_modificacion
    });

    if (!updated) {
        return responses.error(res, 'No se pudo actualizar el administrador', 400);
    }

    // Obtener datos actualizados
    const updatedAdmin = await Administrador.getById(uk_administrador);

    responses.success(res, updatedAdmin.toPublicJSON(), 'Administrador actualizado exitosamente');
});

/**
 * Cambiar contraseña de administrador
 */
const changePassword = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;
    const { s_password_actual, s_password_nuevo } = req.body;
    const uk_usuario_modificacion = req.user?.uk_administrador || null;

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
 * Soft delete - marcar administrador como inactivo
 */
const softDeleteAdmin = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;
    const uk_usuario_modificacion = req.user?.uk_administrador || null;

    // No permitir que un administrador se desactive a sí mismo
    if (uk_administrador === uk_usuario_modificacion) {
        return responses.error(res, 'No puedes desactivar tu propia cuenta', 400);
    }

    // Verificar que el administrador existe
    const existingAdmin = await Administrador.getById(uk_administrador);
    if (!existingAdmin) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // Verificar que no sea el único administrador activo
    const allAdmins = await Administrador.getAll();
    if (allAdmins.length <= 1) {
        return responses.error(res, 'No se puede desactivar el último administrador activo del sistema', 400);
    }

    // Verificar si el administrador tiene turnos asociados
    try {
        const hasTurnos = await Administrador.hasTurnos(uk_administrador);
        if (hasTurnos) {
            return responses.error(res, 'No se puede desactivar este administrador porque tiene turnos asociados', 409);
        }
    } catch (checkError) {
        console.log('Error verificando turnos asociados:', checkError);
        // Continuar con la desactivación de todas formas
    }

    // Marcar como inactivo
    try {
        const deleted = await Administrador.softDelete(uk_administrador, uk_usuario_modificacion);

        if (!deleted) {
            return responses.error(res, 'No se pudo desactivar el administrador', 400);
        }

        responses.success(res, null, 'Administrador desactivado exitosamente');
    } catch (deleteError) {
        console.error('Error desactivando administrador:', deleteError);
        throw deleteError;
    }
});

/**
 * Eliminar administrador (hard delete)
 */
const deleteAdmin = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;
    const currentUserId = req.user?.uk_administrador;

    // No permitir que un administrador se elimine a sí mismo
    if (uk_administrador === currentUserId) {
        return responses.error(res, 'No puedes eliminar tu propia cuenta', 400);
    }

    // Verificar que el administrador existe
    const existingAdmin = await Administrador.getById(uk_administrador);
    if (!existingAdmin) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // Verificar que no sea el único administrador
    const allAdmins = await Administrador.getAll();
    if (allAdmins.length <= 1) {
        return responses.error(res, 'No se puede eliminar el último administrador del sistema', 400);
    }

    // Verificar si el administrador tiene turnos asociados
    try {
        const hasTurnos = await Administrador.hasTurnos(uk_administrador);
        if (hasTurnos) {
            return responses.error(res, 'No se puede eliminar este administrador porque tiene turnos asociados', 409);
        }
    } catch (checkError) {
        console.log('Error verificando turnos asociados:', checkError);
        // Continuar con la eliminación de todas formas
    }

    // Eliminar administrador
    try {
        const deleted = await Administrador.delete(uk_administrador);

        if (!deleted) {
            return responses.error(res, 'No se pudo eliminar el administrador', 400);
        }

        responses.success(res, null, 'Administrador eliminado exitosamente');
    } catch (deleteError) {
        console.error('Error eliminando administrador:', deleteError);

        // Manejo específico de error de foreign key
        if (deleteError.code === 'ER_ROW_IS_REFERENCED_2') {
            return responses.error(res, 'No se puede eliminar este administrador porque tiene turnos o datos asociados', 409);
        }

        throw deleteError; // Re-lanzar otros errores para que los maneje el errorHandler global
    }
});

/**
 * Obtener estadísticas del administrador
 */
const getEstadisticas = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;

    // Verificar que el administrador existe
    const administrador = await Administrador.getById(uk_administrador);
    if (!administrador) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // Obtener estadísticas
    const estadisticas = await administrador.getEstadisticas();

    responses.success(res, {
        administrador: administrador.toPublicJSON(),
        estadisticas
    }, 'Estadísticas del administrador obtenidas exitosamente');
});

/**
 * Obtener administradores con estadísticas
 */
const getAdminsWithStats = asyncHandler(async (req, res) => {
    const administradores = await Administrador.getAll();

    const adminsConStats = await Promise.all(
        administradores.map(async (admin) => {
            const estadisticas = await admin.getEstadisticas();
            return {
                ...admin.toPublicJSON(),
                estadisticas
            };
        })
    );

    responses.success(res, adminsConStats, 'Administradores con estadísticas obtenidos exitosamente');
});

module.exports = {
    getAllAdmins,
    getAllAdminsWithInactive,
    createAdmin,
    getAdminById,
    getAdminByEmail,
    getAdminByUsuario,
    searchAdmins,
    updateAdmin,
    changePassword,
    softDeleteAdmin,
    deleteAdmin,
    getEstadisticas,
    getAdminsWithStats
};