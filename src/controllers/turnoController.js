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
    const { id_consultorio } = req.body;

    // Verificar que el consultorio existe y está disponible
    const consultorio = await Consultorio.getById(id_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    // Crear paciente placeholder en caso de que la columna id_paciente sea NOT NULL
    // Usar un administrador existente (el primero disponible)
    const Administrador = require('../models/Administrador');
    const anyAdminId = await Administrador.getAnyId();

    if (!anyAdminId) {
        return responses.error(res, 'No hay administradores registrados para asignar el turno', 400);
    }

    // Crear paciente "Invitado" con datos mínimos válidos
    const placeholderPacienteId = await Paciente.create({
        nombre: 'Invitado',
        apellido: 'Sin datos',
        telefono: null,
        fecha_nacimiento: '1990-01-01',
        password: 'temp_password'
    });

    const turnoResult = await Turno.create({
        id_consultorio,
        id_paciente: placeholderPacienteId,
        id_administrador: anyAdminId
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

/**
 * Crear turno con paciente (para usuarios públicos)
 */
const createTurnoPublico = asyncHandler(async (req, res) => {
    const { id_consultorio, paciente } = req.body;

    console.log('📝 Creando turno público:', { id_consultorio, paciente });

    // Validar datos requeridos
    if (!id_consultorio) {
        return responses.error(res, 'ID de consultorio es requerido', 400);
    }

    if (!paciente || !paciente.nombre || !paciente.apellido || !paciente.telefono) {
        return responses.error(res, 'Datos de paciente incompletos. Se requieren nombre, apellido y teléfono', 400);
    }

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(id_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }
    console.log('✅ Consultorio encontrado:', consultorio);

    // Para usuarios públicos, siempre crear un nuevo paciente
    // Esto permite que múltiples usuarios usen el mismo teléfono con diferentes nombres
    const pacienteData = {
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        telefono: paciente.telefono,
        fecha_nacimiento: '1990-01-01', // Fecha por defecto (campo es NOT NULL)
        password: 'temp_password' // Password temporal (campo es NOT NULL)
    };
    console.log('👤 Creando nuevo paciente para usuario público:', pacienteData);
    const pacienteId = await Paciente.create(pacienteData);
    console.log('✅ Paciente creado con ID:', pacienteId);

    // Usar un administrador existente (el primero disponible)
    const Administrador = require('../models/Administrador');
    const anyAdminId = await Administrador.getAnyId();

    if (!anyAdminId) {
        return responses.error(res, 'No hay administradores registrados para asignar el turno', 400);
    }
    console.log('👨‍💼 Administrador asignado:', anyAdminId);

    // Crear turno
    const turnoData = {
        id_consultorio,
        id_paciente: pacienteId,
        id_administrador: anyAdminId
    };
    console.log('🎫 Creando turno:', turnoData);

    const turnoResult = await Turno.create(turnoData);
    console.log('✅ Turno creado con ID:', turnoResult.id);

    // Obtener turno completo con información detallada
    const turnoCompleto = await Turno.getById(turnoResult.id);

    if (!turnoCompleto) {
        return responses.error(res, 'Error obteniendo información del turno creado', 500);
    }
    console.log('✅ Turno completo obtenido:', turnoCompleto);

    responses.created(res, turnoCompleto, 'Paciente registrado y turno creado exitosamente');
});

/**
 * Obtener próximo turno para pantalla pública
 */
const getProximoTurnoPublico = asyncHandler(async (req, res) => {
    let proximo = await Turno.getProximoTurnoPublico();

    // Si no hay "Llamando", devolver el primer "En espera" del día
    if (!proximo) {
        const fallbackQuery = `
            SELECT t.numero_turno, c.numero_consultorio
            FROM Turno t
            JOIN Consultorio c ON t.id_consultorio = c.id_consultorio
            WHERE t.fecha = CURDATE() AND t.estado = 'En espera'
            ORDER BY t.numero_turno ASC
            LIMIT 1
        `;
        const { executeQuery } = require('../config/database');
        const results = await executeQuery(fallbackQuery);
        proximo = results.length > 0 ? results[0] : null;
    }

    if (!proximo) {
        return responses.success(res, null, 'No hay turnos para mostrar');
    }

    // Mapear a la forma que espera el frontend
    const mapped = {
        id: proximo.numero_turno,
        consultorio: proximo.numero_consultorio
    };

    responses.success(res, mapped, 'Próximo turno obtenido exitosamente');
});

/**
 * Obtener últimos turnos para pantalla pública
 */
const getUltimosTurnosPublicos = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 6;
    const ultimos = await Turno.getUltimosTurnosPublicos(limit);

    const mapped = ultimos.map(t => ({
        id: t.numero_turno,
        consultorio: t.numero_consultorio
    }));

    responses.success(res, mapped, 'Últimos turnos obtenidos exitosamente');
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
    generarTurnoRapido,
    createTurnoPublico,
    getProximoTurnoPublico,
    getUltimosTurnosPublicos
};
