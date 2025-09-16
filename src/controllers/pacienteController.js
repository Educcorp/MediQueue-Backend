const Paciente = require('../models/Paciente');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear un nuevo paciente
 */
const createPaciente = asyncHandler(async (req, res) => {
    const { s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_password, s_email } = req.body;
    const uk_usuario_creacion = req.user?.uk_administrador || null;

    // Verificar que no exista un paciente con el mismo teléfono
    const existingPaciente = await Paciente.getByTelefono(c_telefono);
    if (existingPaciente) {
        return responses.error(res, 'Ya existe un paciente registrado con ese teléfono', 409);
    }

    // Si se proporciona email, verificar que no exista otro paciente con el mismo
    if (s_email) {
        const existingEmail = await Paciente.getByEmail(s_email);
        if (existingEmail) {
            return responses.error(res, 'Ya existe un paciente registrado con ese email', 409);
        }
    }

    // Crear paciente
    const uk_paciente = await Paciente.create({
        s_nombre,
        s_apellido,
        c_telefono,
        d_fecha_nacimiento,
        s_password,
        s_email,
        uk_usuario_creacion
    });

    // Obtener paciente completo
    const nuevoPaciente = await Paciente.getById(uk_paciente);

    responses.created(res, nuevoPaciente.toPublicJSON(), 'Paciente creado exitosamente');
});

/**
 * Obtener todos los pacientes
 */
const getAllPacientes = asyncHandler(async (req, res) => {
    const pacientes = await Paciente.getAll();

    responses.success(res, pacientes.map(p => p.toPublicJSON()), 'Pacientes obtenidos exitosamente');
});

/**
 * Obtener paciente por UUID
 */
const getPacienteById = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;

    const paciente = await Paciente.getById(uk_paciente);

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    responses.success(res, paciente.toPublicJSON(), 'Paciente obtenido exitosamente');
});

/**
 * Buscar pacientes por nombre, apellido, teléfono o email
 */
const searchPacientes = asyncHandler(async (req, res) => {
    const { term } = req.query;

    if (!term || term.trim().length < 2) {
        return responses.error(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
    }

    const pacientes = await Paciente.search(term);

    responses.success(res, pacientes.map(p => p.toPublicJSON()), 'Búsqueda de pacientes completada');
});

/**
 * Obtener paciente por teléfono
 */
const getPacienteByTelefono = asyncHandler(async (req, res) => {
    const { c_telefono } = req.params;

    const paciente = await Paciente.getByTelefono(c_telefono);

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    responses.success(res, paciente.toPublicJSON(), 'Paciente obtenido exitosamente');
});

/**
 * Obtener paciente por email
 */
const getPacienteByEmail = asyncHandler(async (req, res) => {
    const { s_email } = req.params;

    const paciente = await Paciente.getByEmail(s_email);

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    responses.success(res, paciente.toPublicJSON(), 'Paciente obtenido exitosamente');
});

/**
 * Actualizar paciente
 */
const updatePaciente = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;
    const { s_nombre, s_apellido, c_telefono, d_fecha_nacimiento, s_password, s_email } = req.body;
    const uk_usuario_modificacion = req.user?.uk_administrador || null;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(uk_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Si se va a cambiar el teléfono, verificar que no exista otro con el mismo
    if (c_telefono && c_telefono !== paciente.c_telefono) {
        const existingPaciente = await Paciente.getByTelefono(c_telefono);
        if (existingPaciente) {
            return responses.error(res, 'Ya existe un paciente registrado con ese teléfono', 409);
        }
    }

    // Si se va a cambiar el email, verificar que no exista otro con el mismo
    if (s_email && s_email !== paciente.s_email) {
        const existingEmail = await Paciente.getByEmail(s_email);
        if (existingEmail) {
            return responses.error(res, 'Ya existe un paciente registrado con ese email', 409);
        }
    }

    // Actualizar paciente
    const updated = await Paciente.update(uk_paciente, {
        s_nombre,
        s_apellido,
        c_telefono,
        d_fecha_nacimiento,
        s_password,
        s_email,
        uk_usuario_modificacion
    });

    if (!updated) {
        return responses.error(res, 'No se pudo actualizar el paciente', 400);
    }

    // Obtener paciente actualizado
    const pacienteActualizado = await Paciente.getById(uk_paciente);

    responses.success(res, pacienteActualizado.toPublicJSON(), 'Paciente actualizado exitosamente');
});

/**
 * Cambiar contraseña del paciente
 */
const changePassword = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;
    const { s_password_actual, s_password_nuevo } = req.body;
    const uk_usuario_modificacion = req.user?.uk_administrador || null;

    // Obtener paciente actual
    const paciente = await Paciente.getById(uk_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Verificar contraseña actual
    const isValidPassword = await paciente.verifyPassword(s_password_actual);
    if (!isValidPassword) {
        return responses.unauthorized(res, 'La contraseña actual es incorrecta');
    }

    // Cambiar contraseña
    const changed = await Paciente.changePassword(uk_paciente, s_password_nuevo, uk_usuario_modificacion);
    
    if (!changed) {
        return responses.error(res, 'No se pudo cambiar la contraseña', 400);
    }

    responses.success(res, null, 'Contraseña cambiada exitosamente');
});

/**
 * Soft delete - marcar paciente como inactivo
 */
const softDeletePaciente = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;
    const uk_usuario_modificacion = req.user?.uk_administrador || null;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(uk_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Marcar como inactivo
    const deleted = await Paciente.softDelete(uk_paciente, uk_usuario_modificacion);

    if (!deleted) {
        return responses.error(res, 'No se pudo desactivar el paciente', 400);
    }

    responses.success(res, null, 'Paciente desactivado exitosamente');
});

/**
 * Eliminar paciente (hard delete)
 */
const deletePaciente = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(uk_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Eliminar paciente
    try {
        const deleted = await Paciente.delete(uk_paciente);
        if (!deleted) {
            return responses.error(res, 'No se pudo eliminar el paciente', 400);
        }
    } catch (error) {
        return responses.error(res, error.message, 400);
    }

    responses.success(res, null, 'Paciente eliminado exitosamente');
});

/**
 * Obtener historial de turnos del paciente
 */
const getHistorialTurnos = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(uk_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Obtener historial
    const historial = await Paciente.getHistorialTurnos(uk_paciente);

    responses.success(res, {
        paciente: paciente.toPublicJSON(),
        historial_turnos: historial
    }, 'Historial de turnos obtenido exitosamente');
});

/**
 * Obtener estadísticas del paciente
 */
const getEstadisticas = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(uk_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Obtener estadísticas
    const estadisticas = await paciente.getEstadisticas();

    responses.success(res, {
        paciente: paciente.toPublicJSON(),
        estadisticas
    }, 'Estadísticas del paciente obtenidas exitosamente');
});

/**
 * Login de paciente (opcional, para casos donde tengan contraseña)
 */
const loginPaciente = asyncHandler(async (req, res) => {
    const { c_telefono, s_password } = req.body;

    // Buscar paciente por teléfono
    const paciente = await Paciente.getByTelefono(c_telefono);

    if (!paciente) {
        return responses.unauthorized(res, 'Credenciales inválidas');
    }

    // Verificar que tenga contraseña
    if (!paciente.s_password_hash) {
        return responses.unauthorized(res, 'Este paciente no tiene contraseña configurada');
    }

    // Verificar contraseña
    const isValidPassword = await paciente.verifyPassword(s_password);

    if (!isValidPassword) {
        return responses.unauthorized(res, 'Credenciales inválidas');
    }

    responses.success(res, {
        paciente: paciente.toPublicJSON(),
        mensaje: 'Inicio de sesión exitoso'
    }, 'Autenticación de paciente exitosa');
});

/**
 * Obtener información del paciente para consulta pública (sin datos sensibles)
 */
const getPacientePublico = asyncHandler(async (req, res) => {
    const { c_telefono, s_nombre } = req.query;

    if (!c_telefono && !s_nombre) {
        return responses.error(res, 'Debe proporcionar teléfono o nombre para la búsqueda', 400);
    }

    let paciente;

    if (c_telefono) {
        paciente = await Paciente.getByTelefono(c_telefono);
    } else if (s_nombre) {
        const resultados = await Paciente.search(s_nombre);
        paciente = resultados[0] || null;
    }

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Obtener historial de turnos
    const historial = await Paciente.getHistorialTurnos(paciente.uk_paciente);

    responses.success(res, {
        uk_paciente: paciente.uk_paciente,
        s_nombre_completo: `${paciente.s_nombre} ${paciente.s_apellido}`,
        c_telefono: paciente.c_telefono,
        s_email: paciente.s_email,
        edad: paciente.getEdad(),
        historial_turnos: historial
    }, 'Información del paciente obtenida exitosamente');
});

/**
 * Crear o buscar paciente por teléfono (para turnos públicos)
 */
const createOrFindPaciente = asyncHandler(async (req, res) => {
    const { c_telefono, s_nombre, s_apellido, d_fecha_nacimiento, s_email } = req.body;

    // Buscar paciente existente
    let paciente = await Paciente.getByTelefono(c_telefono);

    if (paciente) {
        // Si existe, actualizar datos si se proporcionan
        if (s_nombre || s_apellido || d_fecha_nacimiento || s_email) {
            const updated = await Paciente.update(paciente.uk_paciente, {
                s_nombre: s_nombre || paciente.s_nombre,
                s_apellido: s_apellido || paciente.s_apellido,
                d_fecha_nacimiento: d_fecha_nacimiento || paciente.d_fecha_nacimiento,
                s_email: s_email || paciente.s_email,
                uk_usuario_modificacion: null // Usuario público
            });

            if (updated) {
                paciente = await Paciente.getById(paciente.uk_paciente);
            }
        }
    } else {
        // Si no existe, crear nuevo paciente
        const uk_paciente = await Paciente.create({
            s_nombre: s_nombre || 'Paciente',
            s_apellido: s_apellido || 'Invitado',
            c_telefono,
            d_fecha_nacimiento: d_fecha_nacimiento || '1990-01-01',
            s_email: s_email || null,
            uk_usuario_creacion: null // Usuario público
        });

        paciente = await Paciente.getById(uk_paciente);
    }

    responses.success(res, paciente.toPublicJSON(), 'Paciente obtenido/creado exitosamente');
});

module.exports = {
    createPaciente,
    getAllPacientes,
    getPacienteById,
    searchPacientes,
    getPacienteByTelefono,
    getPacienteByEmail,
    updatePaciente,
    changePassword,
    softDeletePaciente,
    deletePaciente,
    getHistorialTurnos,
    getEstadisticas,
    loginPaciente,
    getPacientePublico,
    createOrFindPaciente
};