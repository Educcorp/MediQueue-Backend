const Turno = require('../models/Turno');
const Paciente = require('../models/Paciente');
const Consultorio = require('../models/Consultorio');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear un nuevo turno
 */
const createTurno = asyncHandler(async (req, res) => {
    const { id_consultorio, id_paciente } = req.body;
    const id_administrador = req.user.id_administrador;

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(id_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    // Si se proporciona id_paciente, verificar que existe
    if (id_paciente) {
        const paciente = await Paciente.getById(id_paciente);
        if (!paciente) {
            return responses.notFound(res, 'Paciente no encontrado');
        }
    }

    // Crear turno
    const turnoResult = await Turno.create({
        id_consultorio,
        id_paciente: id_paciente || null,
        id_administrador
    });

    // Obtener turno completo con información detallada
    const turnoCompleto = await Turno.getById(turnoResult.id);

    responses.created(res, turnoCompleto, 'Turno creado exitosamente');
});

/**
 * Crear turno con registro de paciente en una sola operación
 */
const createTurnoWithPaciente = asyncHandler(async (req, res) => {
    const { id_consultorio, paciente, registrar_completo } = req.body;
    const id_administrador = req.user.id_administrador;

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(id_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    let pacienteId = null;

    // Si se debe registrar completamente, crear el paciente
    if (registrar_completo) {
        // Verificar que no exista un paciente con el mismo teléfono
        const existingPaciente = await Paciente.getByTelefono(paciente.telefono);
        if (existingPaciente) {
            return responses.error(res, 'Ya existe un paciente registrado con ese teléfono', 409);
        }

        // Crear paciente completo
        pacienteId = await Paciente.create(paciente);
    }

    // Crear turno
    const turnoResult = await Turno.create({
        id_consultorio,
        id_paciente: pacienteId,
        id_administrador
    });

    // Obtener turno completo con información detallada
    const turnoCompleto = await Turno.getById(turnoResult.id);

    const message = registrar_completo ?
        'Paciente registrado y turno creado exitosamente' :
        'Turno creado exitosamente';

    responses.created(res, {
        turno: turnoCompleto,
        paciente_registrado: !!pacienteId
    }, message);
});

/**
 * Obtener todos los turnos con filtros
 */
const getTurnos = asyncHandler(async (req, res) => {
    const filters = {
        fecha: req.query.fecha,
        estado: req.query.estado,
        id_area: req.query.id_area
    };

    const turnos = await Turno.getAll(filters);

    responses.success(res, turnos, 'Turnos obtenidos exitosamente');
});

/**
 * Obtener turnos públicos (para pantalla de usuario)
 */
const getTurnosPublicos = asyncHandler(async (req, res) => {
    const turnos = await Turno.getTurnosPublicos();

    responses.success(res, turnos, 'Turnos públicos obtenidos exitosamente');
});

/**
 * Obtener turno por ID
 */
const getTurnoById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const turno = await Turno.getById(id);

    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    responses.success(res, turno, 'Turno obtenido exitosamente');
});

/**
 * Obtener turnos por paciente
 */
const getTurnosByPaciente = asyncHandler(async (req, res) => {
    const { id_paciente } = req.params;

    // Verificar que el paciente existe
    const paciente = await Paciente.getById(id_paciente);
    if (!paciente) {
        return responses.notFound(res, 'Paciente no encontrado');
    }

    const turnos = await Turno.getByPaciente(id_paciente);

    responses.success(res, {
        paciente: paciente.toJSON(),
        turnos
    }, 'Turnos del paciente obtenidos exitosamente');
});

/**
 * Actualizar estado de un turno
 */
const updateEstadoTurno = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Verificar que el turno existe
    const turno = await Turno.getById(id);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Actualizar estado
    const updated = await Turno.updateEstado(id, estado);

    if (!updated) {
        return responses.error(res, 'No se pudo actualizar el turno', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(id);

    responses.success(res, turnoActualizado, 'Estado del turno actualizado exitosamente');
});

/**
 * Llamar siguiente turno en un consultorio
 */
const llamarSiguienteTurno = asyncHandler(async (req, res) => {
    const { id_consultorio } = req.params;

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(id_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    // Llamar siguiente turno
    const siguienteTurno = await Turno.llamarSiguienteTurno(id_consultorio);

    if (!siguienteTurno) {
        return responses.success(res, null, 'No hay turnos en espera para este consultorio');
    }

    responses.success(res, siguienteTurno, 'Siguiente turno llamado exitosamente');
});

/**
 * Cancelar turno
 */
const cancelarTurno = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el turno existe
    const turno = await Turno.getById(id);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // No se puede cancelar un turno ya atendido
    if (turno.estado === 'Atendido') {
        return responses.error(res, 'No se puede cancelar un turno que ya fue atendido', 400);
    }

    // Cancelar turno
    const cancelled = await Turno.cancelar(id);

    if (!cancelled) {
        return responses.error(res, 'No se pudo cancelar el turno', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(id);

    responses.success(res, turnoActualizado, 'Turno cancelado exitosamente');
});

/**
 * Marcar turno como atendido
 */
const marcarAtendido = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el turno exists
    const turno = await Turno.getById(id);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Marcar como atendido
    const attended = await Turno.marcarAtendido(id);

    if (!attended) {
        return responses.error(res, 'No se pudo marcar el turno como atendido', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(id);

    responses.success(res, turnoActualizado, 'Turno marcado como atendido exitosamente');
});

/**
 * Eliminar turno
 */
const deleteTurno = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el turno exists
    const turno = await Turno.getById(id);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Eliminar turno
    const deleted = await Turno.delete(id);

    if (!deleted) {
        return responses.error(res, 'No se pudo eliminar el turno', 400);
    }

    responses.success(res, null, 'Turno eliminado exitosamente');
});

/**
 * Obtener estadísticas del día
 */
const getEstadisticasDelDia = asyncHandler(async (req, res) => {
    const estadisticas = await Turno.getEstadisticasDelDia();

    responses.success(res, estadisticas, 'Estadísticas del día obtenidas exitosamente');
});

/**
 * Generar turno rápido (para pantalla de usuario)
 */
const generarTurnoRapido = asyncHandler(async (req, res) => {
    const { id_consultorio, nombre_paciente } = req.body;

    // Verificar que el consultorio existe y está disponible
    const consultorio = await Consultorio.getById(id_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    // Crear turno sin registro de paciente (paciente invitado)
    const turnoResult = await Turno.create({
        id_consultorio,
        id_paciente: null,
        id_administrador: 1 // ID de administrador por defecto para turnos automáticos
    });

    // Obtener turno completo
    const turnoCompleto = await Turno.getById(turnoResult.id);

    responses.created(res, {
        numero_turno: turnoCompleto.numero_turno,
        consultorio: turnoCompleto.numero_consultorio,
        area: turnoCompleto.nombre_area,
        estado: turnoCompleto.estado
    }, 'Turno generado exitosamente');
});

module.exports = {
    createTurno,
    createTurnoWithPaciente,
    getTurnos,
    getTurnosPublicos,
    getTurnoById,
    getTurnosByPaciente,
    updateEstadoTurno,
    llamarSiguienteTurno,
    cancelarTurno,
    marcarAtendido,
    deleteTurno,
    getEstadisticasDelDia,
    generarTurnoRapido
};
