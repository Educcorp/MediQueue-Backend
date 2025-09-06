const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Obtener todos los administradores
 */
const getAllAdmins = asyncHandler(async (req, res) => {
    const administradores = await Administrador.getAll();
    responses.success(res, administradores, 'Administradores obtenidos exitosamente');
});

/**
 * Crear un nuevo administrador
 */
const createAdmin = asyncHandler(async (req, res) => {
    const { nombre, email, password } = req.body;

    // Verificar si el email ya existe
    const existingAdmin = await Administrador.getByEmail(email);
    if (existingAdmin) {
        return responses.error(res, 'Ya existe un administrador con ese email', 409);
    }

    // Crear administrador
    const adminId = await Administrador.create({ nombre, email, password });

    // Obtener datos del administrador creado (sin password)
    const newAdmin = await Administrador.getById(adminId);

    responses.created(res, newAdmin.toJSON(), 'Administrador creado exitosamente');
});

/**
 * Obtener administrador por ID
 */
const getAdminById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const administrador = await Administrador.getById(id);

    if (!administrador) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    responses.success(res, administrador.toJSON(), 'Administrador obtenido exitosamente');
});

/**
 * Actualizar administrador
 */
const updateAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password } = req.body;

    // Verificar que el administrador existe
    const existingAdmin = await Administrador.getById(id);
    if (!existingAdmin) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // Verificar si el email ya existe (excluyendo el administrador actual)
    if (email) {
        const emailExists = await Administrador.getByEmail(email);
        if (emailExists && emailExists.id_administrador !== parseInt(id)) {
            return responses.error(res, 'El email ya está en uso por otro administrador', 409);
        }
    }

    // Actualizar administrador
    const updated = await Administrador.update(id, { nombre, email, password });

    if (!updated) {
        return responses.error(res, 'No se pudo actualizar el administrador', 400);
    }

    // Obtener datos actualizados
    const updatedAdmin = await Administrador.getById(id);

    responses.success(res, updatedAdmin.toJSON(), 'Administrador actualizado exitosamente');
});

/**
 * Eliminar administrador
 */
const deleteAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Debug: Verificar qué contiene req.user
    console.log('req.user:', req.user);
    console.log('ID a eliminar:', id);
    
    const currentUserId = req.user.id_administrador;
    console.log('Current user ID:', currentUserId);

    // Verificar que el administrador existe antes de continuar
    const existingAdmin = await Administrador.getById(id);
    if (!existingAdmin) {
        return responses.notFound(res, 'Administrador no encontrado');
    }

    // No permitir que un administrador se elimine a sí mismo
    if (parseInt(id) === currentUserId) {
        return responses.error(res, 'No puedes eliminar tu propia cuenta', 400);
    }



    // Verificar que no sea el único administrador
    const allAdmins = await Administrador.getAll();
    if (allAdmins.length <= 1) {
        return responses.error(res, 'No se puede eliminar el último administrador del sistema', 400);
    }

    // Verificar si el administrador tiene turnos asociados
    // Esto debería hacerse antes de intentar eliminar para dar un mensaje más claro
    try {
        const hasTurnos = await Administrador.hasTurnos(id);
        if (hasTurnos) {
            return responses.error(res, 'No se puede eliminar este administrador porque tiene turnos asociados', 409);
        }
    } catch (checkError) {
        console.log('Error verificando turnos asociados:', checkError);
        // Continuar con la eliminación de todas formas
    }

    // Eliminar administrador
    try {
        const deleted = await Administrador.delete(id);

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

module.exports = {
    getAllAdmins,
    createAdmin,
    getAdminById,
    updateAdmin,
    deleteAdmin
};
