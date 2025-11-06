const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

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

    // Crear administrador con token de verificación
    const result = await Administrador.create({
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
    const newAdmin = await Administrador.getById(result.insertId);

    // Enviar email de verificación
    try {
        await emailService.sendVerificationEmail(
            s_email,
            `${s_nombre} ${s_apellido}`,
            result.verificationToken
        );
        
        responses.created(
            res, 
            newAdmin.toPublicJSON(), 
            'Administrador creado exitosamente. Se ha enviado un email de verificación.'
        );
    } catch (emailError) {
        console.error('Error al enviar email de verificación:', emailError);
        // El administrador se creó pero el email falló
        responses.created(
            res, 
            newAdmin.toPublicJSON(), 
            'Administrador creado exitosamente, pero hubo un error al enviar el email de verificación. Contacte al administrador del sistema.'
        );
    }
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

    // Si el usuario no está verificado Y no tiene turnos, permitir eliminación directa
    if (!existingAdmin.b_email_verified) {
        console.log('Usuario no verificado, verificando si tiene turnos antes de eliminar:', existingAdmin.s_email);
        
        // Verificar si tiene turnos
        try {
            const hasTurnos = await Administrador.hasTurnos(uk_administrador);
            if (hasTurnos) {
                return responses.error(res, 'No se puede eliminar este usuario aunque no esté verificado porque tiene turnos asociados. Debe usar desactivación (soft delete) en su lugar.', 409);
            }
        } catch (checkError) {
            console.error('Error verificando turnos:', checkError);
            return responses.error(res, 'Error al verificar turnos asociados: ' + checkError.message, 500);
        }

        // No tiene turnos, proceder con eliminación
        try {
            const deleted = await Administrador.delete(uk_administrador);
            if (deleted) {
                return responses.success(res, null, 'Usuario sin verificar eliminado exitosamente');
            } else {
                return responses.error(res, 'No se pudo eliminar el usuario', 500);
            }
        } catch (deleteError) {
            console.error('Error eliminando usuario no verificado:', deleteError);
            return responses.error(res, 'Error al eliminar usuario: ' + deleteError.message, 500);
        }
    }

    // Intentar eliminar (el modelo intentará desenlazar o reasignar turnos si es posible)
    try {
        const deleted = await Administrador.delete(uk_administrador);

        if (!deleted) {
            return responses.error(res, 'No se pudo eliminar el administrador', 400);
        }

        responses.success(res, null, 'Administrador eliminado exitosamente');
    } catch (deleteError) {
        console.error('Error eliminando administrador:', deleteError);

        // Si el modelo devolvió un mensaje específico sobre turnos, retornarlo
        if (deleteError.message && deleteError.message.includes('turnos')) {
            return responses.error(res, deleteError.message, 409);
        }

        // Manejo específico de errores de FK
        if (deleteError.code === 'ER_ROW_IS_REFERENCED_2' || deleteError.code === 'ER_ROW_IS_REFERENCED') {
            return responses.error(res, deleteError.message || 'No se puede eliminar este administrador porque tiene datos asociados', 409);
        }

        // Error genérico
        return responses.error(res, 'Error al eliminar el administrador: ' + deleteError.message, 500);
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

/**
 * Verificar email del administrador
 */
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    console.log('🔍 [VERIFY EMAIL] Iniciando verificación para token:', token);

    if (!token) {
        console.log('❌ [VERIFY EMAIL] Token no proporcionado');
        return responses.error(res, 'Token de verificación requerido', 400);
    }

    console.log('🔄 [VERIFY EMAIL] Llamando a Administrador.verifyEmail()...');
    const result = await Administrador.verifyEmail(token);
    console.log('📊 [VERIFY EMAIL] Resultado:', result);

    if (!result.success) {
        console.log('❌ [VERIFY EMAIL] Verificación fallida:', result.message);
        return responses.error(res, result.message, 400);
    }

    console.log('✅ [VERIFY EMAIL] Verificación exitosa, enviando email de bienvenida...');
    
    // Enviar email de bienvenida
    try {
        await emailService.sendWelcomeEmail(
            result.admin.s_email,
            `${result.admin.s_nombre} ${result.admin.s_apellido}`
        );
        console.log('📧 [VERIFY EMAIL] Email de bienvenida enviado exitosamente');
    } catch (emailError) {
        console.error('⚠️ [VERIFY EMAIL] Error al enviar email de bienvenida:', emailError);
        // No fallar la verificación si el email de bienvenida falla
    }

    console.log('✅ [VERIFY EMAIL] Enviando respuesta exitosa al frontend');
    responses.success(res, result.admin, result.message);
});

/**
 * Verificar estado de token (fallback)
 * Si el token no existe, intenta detectar si la cuenta ya fue verificada recientemente
 */
const verifyEmailStatus = asyncHandler(async (req, res) => {
    const { token } = req.params;
    console.log('🔍 [VERIFY STATUS] Token recibido:', token);

    if (!token) {
        return responses.error(res, 'Token de verificación requerido', 400);
    }

    // Buscar por token
    console.log('🔄 [VERIFY STATUS] Buscando token en BD...');
    const adminByToken = await Administrador.getByVerificationToken(token);
    if (adminByToken) {
        console.log('✅ [VERIFY STATUS] Token encontrado, aún pendiente de verificación');
        return responses.success(res, adminByToken.toPublicJSON(), 'Token válido, pendiente de verificación');
    }

    console.log('⚠️ [VERIFY STATUS] Token no encontrado, buscando verificación reciente...');
    // Fallback: buscar si hubo una verificación reciente en la tabla
    const recent = await Administrador.getRecentlyVerified(180); // 3 minutos
    console.log('📊 [VERIFY STATUS] Usuario reciente:', recent ? recent.s_email : 'ninguno');
    
    if (recent && recent.b_email_verified) {
        console.log('✅ [VERIFY STATUS] Encontrado usuario verificado recientemente');
        return responses.success(res, recent.toPublicJSON(), 'Email verificado exitosamente');
    }

    console.log('❌ [VERIFY STATUS] No se encontró verificación reciente');
    return responses.error(res, 'Token inválido o expirado', 400);
});

/**
 * Reenviar email de verificación
 */
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { uk_administrador } = req.params;

    // Verificar que el administrador existe
    const administrador = await Administrador.getById(uk_administrador);
    if (!administrador) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // Verificar si ya está verificado
    if (administrador.b_email_verified) {
        return responses.error(res, 'El email ya ha sido verificado', 400);
    }

    // Generar nuevo token y enviar email
    const verificationToken = await Administrador.resendVerificationEmail(uk_administrador);

    try {
        await emailService.sendVerificationEmail(
            administrador.s_email,
            `${administrador.s_nombre} ${administrador.s_apellido}`,
            verificationToken
        );

        responses.success(res, null, 'Email de verificación reenviado exitosamente');
    } catch (emailError) {
        console.error('Error al reenviar email de verificación:', emailError);
        return responses.error(res, 'Error al enviar el email de verificación', 500);
    }
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
    getAdminsWithStats,
    verifyEmail,
    verifyEmailStatus,
    resendVerificationEmail
}
