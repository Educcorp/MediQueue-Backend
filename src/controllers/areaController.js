const Area = require('../models/Area');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear una nueva área
 */
const createArea = asyncHandler(async (req, res) => {
  const { nombre_area } = req.body;

  // Crear área
  const areaId = await Area.create({ nombre_area });

  // Obtener área completa
  const nuevaArea = await Area.getById(areaId);

  responses.created(res, nuevaArea, 'Área creada exitosamente');
});

/**
 * Obtener todas las áreas
 */
const getAllAreas = asyncHandler(async (req, res) => {
  const areas = await Area.getAll();

  responses.success(res, areas, 'Áreas obtenidas exitosamente');
});

/**
 * Obtener área por ID
 */
const getAreaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const area = await Area.getById(id);
  
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  responses.success(res, area, 'Área obtenida exitosamente');
});

/**
 * Obtener área con sus consultorios
 */
const getAreaWithConsultorios = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const area = await Area.getWithConsultorios(id);
  
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  responses.success(res, area, 'Área con consultorios obtenida exitosamente');
});

/**
 * Actualizar área
 */
const updateArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre_area } = req.body;

  // Verificar que el área existe
  const area = await Area.getById(id);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  // Actualizar área
  const updated = await Area.update(id, { nombre_area });

  if (!updated) {
    return responses.error(res, 'No se pudo actualizar el área', 400);
  }

  // Obtener área actualizada
  const areaActualizada = await Area.getById(id);

  responses.success(res, areaActualizada, 'Área actualizada exitosamente');
});

/**
 * Eliminar área
 */
const deleteArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el área existe
  const area = await Area.getById(id);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  try {
    // Eliminar área
    const deleted = await Area.delete(id);
    
    if (!deleted) {
      return responses.error(res, 'No se pudo eliminar el área', 400);
    }

    responses.success(res, null, 'Área eliminada exitosamente');
  } catch (error) {
    // Si hay consultorios asociados
    if (error.message.includes('consultorios asociados')) {
      return responses.error(res, error.message, 409);
    }
    throw error;
  }
});

/**
 * Obtener estadísticas de turnos por área
 */
const getEstadisticasTurnos = asyncHandler(async (req, res) => {
  const estadisticas = await Area.getEstadisticasTurnos();

  responses.success(res, estadisticas, 'Estadísticas de turnos por área obtenidas exitosamente');
});

/**
 * Obtener áreas con información básica (para selects)
 */
const getAreasBasicas = asyncHandler(async (req, res) => {
  const areas = await Area.getAll();

  const areasBasicas = areas.map(area => ({
    id_area: area.id_area,
    nombre_area: area.nombre_area
  }));

  responses.success(res, areasBasicas, 'Áreas básicas obtenidas exitosamente');
});

module.exports = {
  createArea,
  getAllAreas,
  getAreaById,
  getAreaWithConsultorios,
  updateArea,
  deleteArea,
  getEstadisticasTurnos,
  getAreasBasicas
};
