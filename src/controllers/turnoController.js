const Turno = require('../models/Turno');
const Paciente = require('../models/Paciente');
const Consultorio = require('../models/Consultorio');
const Administrador = require('../models/Administrador');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear un nuevo turno
 */
const createTurno = asyncHandler(async (req, res) => {
    const { uk_consultorio, uk_paciente } = req.body;
    const uk_administrador = req.user.uk_administrador;
    const uk_usuario_creacion = req.user.uk_administrador;

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(uk_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    // Si se proporciona uk_paciente, verificar que existe
    if (uk_paciente) {
        const paciente = await Paciente.getById(uk_paciente);
        if (!paciente) {
            return responses.notFound(res, 'Paciente no encontrado');
        }
    }

    // Crear turno
    const turnoResult = await Turno.create({
        uk_consultorio,
        uk_paciente: uk_paciente || null,
        uk_administrador,
        uk_usuario_creacion
    });

    // Obtener turno completo con información detallada
    const turnoCompleto = await Turno.getById(turnoResult.uk_turno);

    responses.created(res, turnoCompleto, 'Turno creado exitosamente');
});

/**
 * Crear turno con registro de paciente en una sola operación
 */
const createTurnoWithPaciente = asyncHandler(async (req, res) => {
    const { uk_consultorio, paciente, registrar_completo } = req.body;
    const uk_administrador = req.user.uk_administrador;
    const uk_usuario_creacion = req.user.uk_administrador;

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(uk_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    let uk_paciente = null;

    // Si se debe registrar completamente, crear el paciente
    if (registrar_completo) {
        // Verificar que no exista un paciente con el mismo teléfono
        const existingPaciente = await Paciente.getByTelefono(paciente.c_telefono);
        if (existingPaciente) {
            return responses.error(res, 'Ya existe un paciente registrado con ese teléfono', 409);
        }

        // Crear paciente completo
        uk_paciente = await Paciente.create({
            ...paciente,
            uk_usuario_creacion
        });
    }

    // Crear turno
    const turnoResult = await Turno.create({
        uk_consultorio,
        uk_paciente: uk_paciente,
        uk_administrador,
        uk_usuario_creacion
    });

    // Obtener turno completo con información detallada
    const turnoCompleto = await Turno.getById(turnoResult.uk_turno);

    const message = registrar_completo ?
        'Paciente registrado y turno creado exitosamente' :
        'Turno creado exitosamente';

    responses.created(res, {
        turno: turnoCompleto,
        paciente_registrado: !!uk_paciente
    }, message);
});

/**
 * Obtener todos los turnos con filtros
 */
const getTurnos = asyncHandler(async (req, res) => {
    const filters = {
        fecha: req.query.fecha,
        estado: req.query.estado,
        uk_area: req.query.uk_area,
        uk_consultorio: req.query.uk_consultorio
    };

    const turnos = await Turno.getAll(filters);

    responses.success(res, turnos, 'Turnos obtenidos exitosamente');
});

/**
 * Obtener turnos públicos (para pantalla de usuario)
 */
const getTurnosPublicos = asyncHandler(async (req, res) => {
    const turnos = await Turno.getTurnosPublicos();

    // Mapear a la forma que espera el frontend
    const mapped = (turnos || []).map(t => ({
        id: t.i_numero_turno,
        consultorio: t.i_numero_consultorio,
        area: t.s_nombre_area,
        estado: t.s_estado
    }));

    responses.success(res, mapped, 'Turnos públicos obtenidos exitosamente');
});

/**
 * Obtener turno por ID
 */
const getTurnoById = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;

    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    responses.success(res, turno, 'Turno obtenido exitosamente');
});

/**
 * Obtener turnos por paciente
 */
const getTurnosByPaciente = asyncHandler(async (req, res) => {
    const { uk_paciente } = req.params;

    const turnos = await Turno.getByPaciente(uk_paciente);
    responses.success(res, turnos, 'Turnos del paciente obtenidos exitosamente');
});

/**
 * Actualizar estado del turno
 */
const updateEstadoTurno = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;
    const { s_estado } = req.body;
    const uk_usuario_modificacion = req.user.uk_administrador;

    // Verificar que el turno existe
    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Actualizar estado
    const updated = await Turno.updateEstado(uk_turno, s_estado, uk_usuario_modificacion);

    if (!updated) {
        return responses.error(res, 'No se pudo actualizar el estado del turno', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(uk_turno);

    responses.success(res, turnoActualizado, 'Estado del turno actualizado exitosamente');
});

/**
 * Llamar siguiente turno en un consultorio
 */
const llamarSiguienteTurno = asyncHandler(async (req, res) => {
    const { uk_consultorio } = req.params;

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(uk_consultorio);
    if (!consultorio) {
        return responses.notFound(res, 'Consultorio no encontrado');
    }

    // Llamar siguiente turno
    const siguienteTurno = await Turno.llamarSiguienteTurno(uk_consultorio);

    if (!siguienteTurno) {
        return responses.success(res, null, 'No hay turnos en espera para este consultorio');
    }

    responses.success(res, siguienteTurno, 'Siguiente turno llamado exitosamente');
});

/**
 * Cancelar turno
 */
const cancelarTurno = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;
    const uk_usuario_modificacion = req.user.uk_administrador;

    // Verificar que el turno existe
    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Permitir cancelación incluso si ya fue atendido (solicitud del cliente)

    // Cancelar turno
    const cancelled = await Turno.cancelar(uk_turno, uk_usuario_modificacion);

    if (!cancelled) {
        return responses.error(res, 'No se pudo cancelar el turno', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(uk_turno);

    responses.success(res, turnoActualizado, 'Turno cancelado exitosamente');
});

/**
 * Marcar turno como atendido
 */
const marcarAtendido = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;
    const uk_usuario_modificacion = req.user.uk_administrador;

    // Verificar que el turno existe
    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Marcar como atendido
    const atendido = await Turno.marcarAtendido(uk_turno, uk_usuario_modificacion);

    if (!atendido) {
        return responses.error(res, 'No se pudo marcar el turno como atendido', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(uk_turno);

    responses.success(res, turnoActualizado, 'Turno marcado como atendido exitosamente');
});

/**
 * Marcar turno como no presente
 */
const marcarNoPresente = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;
    const uk_usuario_modificacion = req.user.uk_administrador;

    // Verificar que el turno existe
    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Marcar como no presente
    const noPresente = await Turno.marcarNoPresente(uk_turno, uk_usuario_modificacion);

    if (!noPresente) {
        return responses.error(res, 'No se pudo marcar el turno como no presente', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(uk_turno);

    responses.success(res, turnoActualizado, 'Turno marcado como no presente exitosamente');
});

/**
 * Actualizar observaciones del turno
 */
const updateObservaciones = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;
    const { s_observaciones } = req.body;
    const uk_usuario_modificacion = req.user.uk_administrador;

    // Verificar que el turno existe
    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Actualizar observaciones
    const updated = await Turno.updateObservaciones(uk_turno, s_observaciones, uk_usuario_modificacion);

    if (!updated) {
        return responses.error(res, 'No se pudieron actualizar las observaciones', 400);
    }

    // Obtener turno actualizado
    const turnoActualizado = await Turno.getById(uk_turno);

    responses.success(res, turnoActualizado, 'Observaciones actualizadas exitosamente');
});

/**
 * Eliminar turno
 */
const deleteTurno = asyncHandler(async (req, res) => {
    const { uk_turno } = req.params;

    // Verificar que el turno existe
    const turno = await Turno.getById(uk_turno);
    if (!turno) {
        return responses.notFound(res, 'Turno no encontrado');
    }

    // Eliminar turno
    try {
        const deleted = await Turno.delete(uk_turno);
        if (!deleted) {
            return responses.error(res, 'No se pudo eliminar el turno', 400);
        }
    } catch (error) {
        return responses.error(res, error.message, 400);
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
 * Obtener turnos por rango de fechas
 */
const getTurnosByDateRange = asyncHandler(async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    const filters = {
        estado: req.query.estado,
        uk_area: req.query.uk_area,
        uk_consultorio: req.query.uk_consultorio
    };

    if (!fecha_inicio || !fecha_fin) {
        return responses.error(res, 'Se requieren fecha_inicio y fecha_fin', 400);
    }

    const turnos = await Turno.getByDateRange(fecha_inicio, fecha_fin, filters);
    responses.success(res, turnos, 'Turnos obtenidos exitosamente');
});

// =============================================
// ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN)
// =============================================

/**
 * Crear turno público (para usuarios no autenticados)
 */
const createTurnoPublico = asyncHandler(async (req, res) => {
    const { uk_consultorio, paciente } = req.body;

    console.log('🎫 Creando turno público:', { uk_consultorio, paciente });

    // Verificar que el consultorio existe
    const consultorio = await Consultorio.getById(uk_consultorio);
    if (!consultorio) {
        console.log('❌ Consultorio no encontrado:', uk_consultorio);
        return responses.notFound(res, 'Consultorio no encontrado');
    }
    console.log('✅ Consultorio encontrado:', consultorio.s_nombre_area);

    let uk_paciente = null;

    // Si se proporciona información del paciente, crear o buscar paciente
    if (paciente && paciente.c_telefono) {
        console.log('👤 Buscando paciente existente:', paciente.c_telefono);

        // Buscar paciente existente por teléfono
        let existingPaciente = await Paciente.getByTelefono(paciente.c_telefono);

        if (existingPaciente) {
            console.log('✅ Paciente existente encontrado:', existingPaciente.s_nombre);
            uk_paciente = existingPaciente.uk_paciente;
        } else {
            console.log('👤 Creando nuevo paciente...');
            // Crear paciente temporal (sin contraseña)
            uk_paciente = await Paciente.create({
                s_nombre: paciente.s_nombre || 'Paciente',
                s_apellido: paciente.s_apellido || 'Invitado',
                c_telefono: paciente.c_telefono,
                d_fecha_nacimiento: paciente.d_fecha_nacimiento || '1990-01-01',
                s_email: paciente.s_email || null,
                uk_usuario_creacion: null // Usuario público
            });
            console.log('✅ Paciente creado con UUID:', uk_paciente);
        }
    }

    // Obtener cualquier administrador activo para asignar el turno
    const anyAdminId = await Administrador.getAnyId();
    if (!anyAdminId) {
        console.log('❌ No hay administradores disponibles');
        return responses.error(res, 'No hay administradores disponibles en el sistema', 400);
    }
    console.log('👨‍💼 Administrador asignado:', anyAdminId);

    // Crear turno
    const turnoData = {
        uk_consultorio,
        uk_paciente: uk_paciente,
        uk_administrador: anyAdminId,
        uk_usuario_creacion: null // Usuario público
    };
    console.log('🎫 Creando turno:', turnoData);

    const turnoResult = await Turno.create(turnoData);
    console.log('✅ Turno creado con UUID:', turnoResult.uk_turno);

    // Obtener turno completo con información detallada
    const turnoCompleto = await Turno.getById(turnoResult.uk_turno);

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

    // Si no hay "LLAMANDO", devolver el primer "EN_ESPERA" del día
    if (!proximo) {
        const fallbackQuery = `
            SELECT t.i_numero_turno, c.i_numero_consultorio
            FROM Turno t
            JOIN Consultorio c ON t.uk_consultorio = c.uk_consultorio
            WHERE t.d_fecha = CURDATE() AND t.s_estado = 'EN_ESPERA' AND t.ck_estado = 'ACTIVO'
            ORDER BY t.i_numero_turno ASC
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
        id: proximo.i_numero_turno,
        consultorio: proximo.i_numero_consultorio
    };

    responses.success(res, mapped, 'Próximo turno obtenido exitosamente');
});

/**
 * Obtener últimos turnos para pantalla pública
 */
const getUltimosTurnosPublicos = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    const ultimos = await Turno.getUltimosTurnosPublicos(limit);

    // Mapear a la forma que espera el frontend
    const mapped = ultimos.map(turno => ({
        id: turno.i_numero_turno,
        consultorio: turno.i_numero_consultorio
    }));

    responses.success(res, mapped, 'Últimos turnos obtenidos exitosamente');
});

module.exports = {
    // Endpoints autenticados
    createTurno,
    createTurnoWithPaciente,
    getTurnos,
    getTurnoById,
    getTurnosByPaciente,
    updateEstadoTurno,
    llamarSiguienteTurno,
    cancelarTurno,
    marcarAtendido,
    marcarNoPresente,
    updateObservaciones,
    deleteTurno,
    getEstadisticasDelDia,
    getTurnosByDateRange,

    // Endpoints públicos
    createTurnoPublico,
    getTurnosPublicos,
    getProximoTurnoPublico,
    getUltimosTurnosPublicos
};