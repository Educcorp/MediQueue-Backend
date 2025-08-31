const Paciente = require('../models/Paciente');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear un nuevo paciente
 */
const createPaciente = asyncHandler(async (req, res) => {
    const { nombre, apellido, telefono, fecha_nacimiento, password } = req.body;

    // Verificar que no exista un paciente con el mismo teléfono
    const existingPaciente = await Paciente.getByTelefono(telefono);
    if (existingPaciente) {
        return responses.error(res, 'Ya existe un paciente registrado con ese teléfono', 409);
    }

    // Crear paciente
    const pacienteId = await Paciente.create({
        nombre,
        apellido,
        telefono,
        fecha_nacimiento,
        password
    });

    // Obtener paciente completo
    const nuevoPaciente = await Paciente.getById(pacienteId);

    responses.created(res, nuevoPaciente.toJSON(), 'Paciente creado exitosamente');
});

/**
 * Obtener todos los pacientes
 */
const getAllPacientes = asyncHandler(async (req, res) => {
    const pacientes = await Paciente.getAll();

    responses.success(res, pacientes, 'Pacientes obtenidos exitosamente');
});

/**
 * Obtener paciente por ID
 */
const getPacienteById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const paciente = await Paciente.getById(id);

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    responses.success(res, paciente.toJSON(), 'Paciente obtenido exitosamente');
});

/**
 * Buscar pacientes por nombre, apellido o teléfono
 */
const searchPacientes = asyncHandler(async (req, res) => {
    const { term } = req.query;

    const pacientes = await Paciente.search(term);

    responses.success(res, pacientes, 'Búsqueda de pacientes completada');
});

/**
 * Obtener paciente por teléfono
 */
const getPacienteByTelefono = asyncHandler(async (req, res) => {
    const { telefono } = req.params;

    const paciente = await Paciente.getByTelefono(telefono);

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    responses.success(res, paciente.toJSON(), 'Paciente obtenido exitosamente');
});

/**
 * Actualizar paciente
 */
const updatePaciente = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, telefono, fecha_nacimiento, password } = req.body;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(id);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Si se va a cambiar el teléfono, verificar que no exista otro con el mismo
    if (telefono && telefono !== paciente.telefono) {
        const existingPaciente = await Paciente.getByTelefono(telefono);
        if (existingPaciente) {
            return responses.error(res, 'Ya existe un paciente registrado con ese teléfono', 409);
        }
    }

    // Actualizar paciente
    const updated = await Paciente.update(id, {
        nombre,
        apellido,
        telefono,
        fecha_nacimiento,
        password
    });

    if (!updated) {
        return responses.error(res, 'No se pudo actualizar el paciente', 400);
    }

    // Obtener paciente actualizado
    const pacienteActualizado = await Paciente.getById(id);

    responses.success(res, pacienteActualizado.toJSON(), 'Paciente actualizado exitosamente');
});

/**
 * Eliminar paciente
 */
const deletePaciente = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(id);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Eliminar paciente
    const deleted = await Paciente.delete(id);

    if (!deleted) {
        return responses.error(res, 'No se pudo eliminar el paciente', 400);
    }

    responses.success(res, null, 'Paciente eliminado exitosamente');
});

/**
 * Obtener historial de turnos del paciente
 */
const getHistorialTurnos = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(id);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Obtener historial
    const historial = await Paciente.getHistorialTurnos(id);

    responses.success(res, {
        paciente: paciente.toJSON(),
        historial_turnos: historial
    }, 'Historial de turnos obtenido exitosamente');
});

/**
 * Login de paciente (opcional, para casos donde tengan contraseña)
 */
const loginPaciente = asyncHandler(async (req, res) => {
    const { telefono, password } = req.body;

    // Buscar paciente por teléfono
    const paciente = await Paciente.getByTelefono(telefono);

    if (!paciente) {
        return responses.unauthorized(res, 'Credenciales inválidas');
    }

    // Verificar que tenga contraseña
    if (!paciente.password) {
        return responses.unauthorized(res, 'Este paciente no tiene contraseña configurada');
    }

    // Verificar contraseña
    const isValidPassword = await paciente.verifyPassword(password);

    if (!isValidPassword) {
        return responses.unauthorized(res, 'Credenciales inválidas');
    }

    responses.success(res, {
        paciente: paciente.toJSON(),
        mensaje: 'Inicio de sesión exitoso'
    }, 'Autenticación de paciente exitosa');
});

/**
 * Obtener información del paciente para consulta pública (sin datos sensibles)
 */
const getPacientePublico = asyncHandler(async (req, res) => {
    const { telefono, nombre } = req.query;

    if (!telefono && !nombre) {
        return responses.error(res, 'Debe proporcionar teléfono o nombre para la búsqueda', 400);
    }

    let paciente;

    if (telefono) {
        paciente = await Paciente.getByTelefono(telefono);
    } else if (nombre) {
        const resultados = await Paciente.search(nombre);
        paciente = resultados[0] || null;
    }

    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    // Obtener historial de turnos
    const historial = await Paciente.getHistorialTurnos(paciente.id_paciente);

    responses.success(res, {
        id_paciente: paciente.id_paciente,
        nombre_completo: `${paciente.nombre} ${paciente.apellido}`,
        telefono: paciente.telefono,
        historial_turnos: historial
    }, 'Información del paciente obtenida exitosamente');
});

module.exports = {
    createPaciente,
    getAllPacientes,
    getPacienteById,
    searchPacientes,
    getPacienteByTelefono,
    updatePaciente,
    deletePaciente,
    getHistorialTurnos,
    loginPaciente,
    getPacientePublico
};
