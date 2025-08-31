const Consultorio = require('../models/Consultorio');
const Area = require('../models/Area');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear un nuevo consultorio
 */
const createConsultorio = asyncHandler(async (req, res) => {
  const { numero_consultorio, id_area } = req.body;

  try {
    // Crear consultorio
    const consultorioId = await Consultorio.create({ numero_consultorio, id_area });

    // Obtener consultorio completo
    const nuevoConsultorio = await Consultorio.getById(consultorioId);

    responses.created(res, nuevoConsultorio, 'Consultorio creado exitosamente');
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
 * Obtener todos los consultorios
 */
const getAllConsultorios = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getAll();

  responses.success(res, consultorios, 'Consultorios obtenidos exitosamente');
});

/**
 * Obtener consultorio por ID
 */
const getConsultorioById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const consultorio = await Consultorio.getById(id);
  
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  responses.success(res, consultorio, 'Consultorio obtenido exitosamente');
});

/**
 * Obtener consultorios por área
 */
const getConsultoriosByArea = asyncHandler(async (req, res) => {
  const { id_area } = req.params;

  // Verificar que el área existe
  const area = await Area.getById(id_area);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  const consultorios = await Consultorio.getByArea(id_area);

  responses.success(res, {
    area,
    consultorios
  }, 'Consultorios del área obtenidos exitosamente');
});

/**
 * Actualizar consultorio
 */
const updateConsultorio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { numero_consultorio, id_area } = req.body;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(id);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  try {
    // Actualizar consultorio
    const updated = await Consultorio.update(id, { numero_consultorio, id_area });

    if (!updated) {
      return responses.error(res, 'No se pudo actualizar el consultorio', 400);
    }

    // Obtener consultorio actualizado
    const consultorioActualizado = await Consultorio.getById(id);

    responses.success(res, consultorioActualizado, 'Consultorio actualizado exitosamente');
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
 * Eliminar consultorio
 */
const deleteConsultorio = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(id);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  try {
    // Eliminar consultorio
    const deleted = await Consultorio.delete(id);
    
    if (!deleted) {
      return responses.error(res, 'No se pudo eliminar el consultorio', 400);
    }

    responses.success(res, null, 'Consultorio eliminado exitosamente');
  } catch (error) {
    // Si hay turnos asociados
    if (error.message.includes('turnos asociados')) {
      return responses.error(res, error.message, 409);
    }
    throw error;
  }
});

/**
 * Obtener consultorios disponibles (sin turnos en espera o llamando)
 */
const getConsultoriosDisponibles = asyncHandler(async (req, res) => {
  const consultorios = await Consultorio.getDisponibles();

  responses.success(res, consultorios, 'Consultorios disponibles obtenidos exitosamente');
});

/**
 * Obtener estadísticas de turnos del consultorio
 */
const getEstadisticasTurnos = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(id);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Obtener estadísticas
  const estadisticas = await consultorio.getEstadisticasTurnos();

  responses.success(res, {
    consultorio: {
      id_consultorio: consultorio.id_consultorio,
      numero_consultorio: consultorio.numero_consultorio,
      nombre_area: consultorio.nombre_area
    },
    estadisticas
  }, 'Estadísticas del consultorio obtenidas exitosamente');
});

/**
 * Llamar siguiente turno en el consultorio
 */
const llamarSiguienteTurno = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el consultorio existe
  const consultorio = await Consultorio.getById(id);
  if (!consultorio) {
    return responses.notFound(res, 'Consultorio no encontrado');
  }

  // Importar Turno aquí para evitar dependencias circulares
  const Turno = require('../models/Turno');
  
  // Llamar siguiente turno
  const siguienteTurno = await Turno.llamarSiguienteTurno(id);

  if (!siguienteTurno) {
    return responses.success(res, null, 'No hay turnos en espera para este consultorio');
  }

  responses.success(res, siguienteTurno, 'Siguiente turno llamado exitosamente');
});

/**
 * Obtener consultorios básicos por área (para selects)
 */
const getConsultoriosBasicosByArea = asyncHandler(async (req, res) => {
  const { id_area } = req.params;

  const consultorios = await Consultorio.getByArea(id_area);

  const consultoriosBasicos = consultorios.map(consultorio => ({
    id_consultorio: consultorio.id_consultorio,
    numero_consultorio: consultorio.numero_consultorio,
    nombre_area: consultorio.nombre_area
  }));

  responses.success(res, consultoriosBasicos, 'Consultorios básicos obtenidos exitosamente');
});

module.exports = {
  createConsultorio,
  getAllConsultorios,
  getConsultorioById,
  getConsultoriosByArea,
  updateConsultorio,
  deleteConsultorio,
  getConsultoriosDisponibles,
  getEstadisticasTurnos,
  llamarSiguienteTurno,
  getConsultoriosBasicosByArea
};
