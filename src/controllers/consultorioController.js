const Consultorio = require('../models/Consultorio');
const Area = require('../models/Area');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear un nuevo consultorio
 */
const createConsultorio = asyncHandler(async (req, res) => {
  const { i_numero_consultorio, uk_area } = req.body;
  const uk_usuario_creacion = req.user?.uk_administrador || null;

  try {
    // Crear consultorio
    const uk_consultorio = await Consultorio.create({
      i_numero_consultorio,
      uk_area,
      uk_usuario_creacion
    });

    // Obtener consultorio completo
    const nuevoConsultorio = await Consultorio.getById(uk_consultorio);

    responses.created(res, nuevoConsultorio.toJSON(), 'Consultorio creado exitosamente');
  } catch (error) {
    if (error.message.includes('área especificada no existe')) {
      return responses.notFound(res, error.message);
    }
    if (error.message.includes('Ya existe un consultorio')) {
      return responses.error(res, error.message, 409);
    }
    throw error;
  }
});

/**
 * Obtener todos los consultorios activos
 */
const getAllConsultorios = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getAll();

  responses.success(res, consultorios.map(c => c.toJSON()), 'Consultorios obtenidos exitosamente');
});

/**
 * Obtener todos los consultorios (incluyendo inactivos)
 */
const getAllConsultoriosWithInactive = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getAllWithInactive();

  responses.success(res, consultorios.map(c => c.toJSON()), 'Consultorios obtenidos exitosamente');
});

/**
 * Obtener consultorio por UUID
 */
const getConsultorioById = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;

  const consultorio = await Consultorio.getById(uk_consultorio);

  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  responses.success(res, consultorio.toJSON(), 'Consultorio obtenido exitosamente');
});

/**
 * Obtener consultorios por área
 */
const getConsultoriosByArea = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;

  // Verificar que el área existe
  const area = await Area.getById(uk_area);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  const consultorios = await Consultorio.getByArea(uk_area);

  responses.success(res, {
    area: area.toJSON(),
    consultorios: consultorios.map(c => c.toJSON())
  }, 'Consultorios del área obtenidos exitosamente');
});

/**
 * Obtener consultorios básicos (solo para mostrar en formularios)
 */
const getConsultoriosBasicos = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getBasicos();

  responses.success(res, consultorios.map(c => c.toJSON()), 'Consultorios básicos obtenidos exitosamente');
});

/**
 * Actualizar consultorio
 */
const updateConsultorio = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;
  const { i_numero_consultorio, uk_area } = req.body;
  const uk_usuario_modificacion = req.user?.uk_administrador || null;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  try {
    // Actualizar consultorio
    const updated = await Consultorio.update(uk_consultorio, {
      i_numero_consultorio,
      uk_area,
      uk_usuario_modificacion
    });

    if (!updated) {
      return responses.error(res, 'No se pudo actualizar el consultorio', 400);
    }

    // Obtener consultorio actualizado
    const consultorioActualizado = await Consultorio.getById(uk_consultorio);

    responses.success(res, consultorioActualizado.toJSON(), 'Consultorio actualizado exitosamente');
  } catch (error) {
    if (error.message.includes('área especificada no existe')) {
      return responses.notFound(res, error.message);
    }
    if (error.message.includes('Ya existe un consultorio')) {
      return responses.error(res, error.message, 409);
    }
    throw error;
  }
});

/**
 * Soft delete - marcar consultorio como inactivo
 */
const softDeleteConsultorio = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;
  const uk_usuario_modificacion = req.user?.uk_administrador || null;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  try {
    // Marcar como inactivo
    const deleted = await Consultorio.softDelete(uk_consultorio, uk_usuario_modificacion);

    if (!deleted) {
      return responses.error(res, 'No se pudo desactivar el consultorio', 400);
    }

    responses.success(res, null, 'Consultorio desactivado exitosamente');
  } catch (error) {
    // Si hay turnos asociados
    if (error.message.includes('turnos asociados')) {
      return responses.error(res, error.message, 409);
    }
    throw error;
  }
});

/**
 * Eliminar consultorio (hard delete)
 */
const deleteConsultorio = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  try {
    // Eliminar consultorio (incluye turnos asociados automáticamente)
    const deleted = await Consultorio.delete(uk_consultorio);

    if (!deleted) {
      return responses.error(res, 'No se pudo eliminar el consultorio', 400);
    }

    responses.success(res, null, 'Consultorio y sus turnos asociados eliminados exitosamente');
  } catch (error) {
    throw error;
  }
});

/**
 * Obtener consultorios disponibles (sin turnos en espera o llamando)
 */
const getConsultoriosDisponibles = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getDisponibles();

  responses.success(res, consultorios.map(c => c.toJSON()), 'Consultorios disponibles obtenidos exitosamente');
});

/**
 * Obtener estadísticas de turnos del consultorio
 */
const getEstadisticasTurnos = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Obtener estadísticas
  const estadisticas = await consultorio.getEstadisticasTurnos();

  responses.success(res, {
    consultorio: consultorio.toJSON(),
    estadisticas
  }, 'Estadísticas del consultorio obtenidas exitosamente');
});

/**
 * Obtener estadísticas de turnos del consultorio por rango de fechas
 */
const getEstadisticasTurnosPorFecha = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return responses.error(res, 'Se requieren fecha_inicio y fecha_fin', 400);
  }

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Obtener estadísticas
  const estadisticas = await consultorio.getEstadisticasTurnosPorFecha(fecha_inicio, fecha_fin);

  responses.success(res, {
    consultorio: consultorio.toJSON(),
    estadisticas
  }, 'Estadísticas del consultorio obtenidas exitosamente');
});

/**
 * Verificar si el consultorio está disponible
 */
const isConsultorioDisponible = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Verificar disponibilidad
  const disponible = await consultorio.isDisponible();

  responses.success(res, { disponible }, 'Estado de disponibilidad obtenido exitosamente');
});

/**
 * Obtener turno actual del consultorio
 */
const getTurnoActual = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Obtener turno actual
  const turnoActual = await consultorio.getTurnoActual();

  if (!turnoActual) {
    return responses.success(res, null, 'No hay turno actual en este consultorio');
  }

  responses.success(res, turnoActual, 'Turno actual obtenido exitosamente');
});

/**
 * Llamar siguiente turno en el consultorio
 */
const llamarSiguienteTurno = asyncHandler(async (req, res) => {
  const { uk_consultorio } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(uk_consultorio);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Importar Turno aquí para evitar dependencias circulares
  const Turno = require('../models/Turno');

  // Llamar siguiente turno
  const siguienteTurno = await Turno.llamarSiguienteTurno(uk_consultorio);

  if (!siguienteTurno) {
    return responses.success(res, null, 'No hay turnos en espera para este consultorio');
  }

  responses.success(res, siguienteTurno, 'Siguiente turno llamado exitosamente');
});

/**
 * Obtener consultorios básicos por área (para selects)
 */
const getConsultoriosBasicosByArea = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;

  const consultorios = await Consultorio.getByArea(uk_area);

  const consultoriosBasicos = consultorios.map(consultorio => ({
    uk_consultorio: consultorio.uk_consultorio,
    i_numero_consultorio: consultorio.i_numero_consultorio,
    s_nombre_area: consultorio.s_nombre_area
  }));

  responses.success(res, consultoriosBasicos, 'Consultorios básicos obtenidos exitosamente');
});

/**
 * Obtener consultorios con estadísticas del día
 */
const getConsultoriosWithStats = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getAll();

  const consultoriosConStats = await Promise.all(
    consultorios.map(async (consultorio) => {
      const estadisticas = await consultorio.getEstadisticasTurnos();
      const disponible = await consultorio.isDisponible();
      const turnoActual = await consultorio.getTurnoActual();

      return {
        ...consultorio.toJSON(),
        estadisticas,
        disponible,
        turno_actual: turnoActual
      };
    })
  );

  responses.success(res, consultoriosConStats, 'Consultorios con estadísticas obtenidos exitosamente');
});

module.exports = {
  createConsultorio,
  getAllConsultorios,
  getAllConsultoriosWithInactive,
  getConsultorioById,
  getConsultoriosByArea,
  getConsultoriosBasicos,
  updateConsultorio,
  softDeleteConsultorio,
  deleteConsultorio,
  getConsultoriosDisponibles,
  getEstadisticasTurnos,
  getEstadisticasTurnosPorFecha,
  isConsultorioDisponible,
  getTurnoActual,
  llamarSiguienteTurno,
  getConsultoriosBasicosByArea,
  getConsultoriosWithStats
};