const Area = require('../models/Area');
const responses = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Crear una nueva área
 */
const createArea = asyncHandler(async (req, res) => {
  const { s_nombre_area } = req.body;
  const uk_usuario_creacion = req.user?.uk_administrador || null;

  // Crear área
  const uk_area = await Area.create({ s_nombre_area, uk_usuario_creacion });

  // Obtener área completa
  const nuevaArea = await Area.getById(uk_area);

  responses.created(res, nuevaArea.toJSON(), 'Área creada exitosamente');
});

/**
 * Obtener todas las áreas activas
 */
const getAllAreas = asyncHandler(async (req, res) => {
  const areas = await Area.getAll();

  responses.success(res, areas.map(area => area.toJSON()), 'Áreas obtenidas exitosamente');
});

/**
 * Obtener todas las áreas (incluyendo inactivas)
 */
const getAllAreasWithInactive = asyncHandler(async (req, res) => {
  const areas = await Area.getAllWithInactive();

  responses.success(res, areas.map(area => area.toJSON()), 'Áreas obtenidas exitosamente');
});

/**
 * Obtener área por UUID
 */
const getAreaById = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;

  const area = await Area.getById(uk_area);

  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  responses.success(res, area.toJSON(), 'Área obtenida exitosamente');
});

/**
 * Obtener área por nombre
 */
const getAreaByNombre = asyncHandler(async (req, res) => {
  const { s_nombre_area } = req.params;

  const area = await Area.getByNombre(s_nombre_area);

  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  responses.success(res, area.toJSON(), 'Área obtenida exitosamente');
});

/**
 * Obtener área con sus consultorios
 */
const getAreaWithConsultorios = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;

  const area = await Area.getWithConsultorios(uk_area);

  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  responses.success(res, area, 'Área con consultorios obtenida exitosamente');
});

/**
 * Buscar áreas por nombre
 */
const searchAreas = asyncHandler(async (req, res) => {
  const { term } = req.query;

  if (!term || term.trim().length < 2) {
    return responses.error(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
  }

  const areas = await Area.search(term);

  responses.success(res, areas.map(area => area.toJSON()), 'Búsqueda de áreas completada');
});

/**
 * Actualizar área
 */
const updateArea = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;
  const { s_nombre_area } = req.body;
  const uk_usuario_modificacion = req.user?.uk_administrador || null;

  // Verificar que el área existe
  const area = await Area.getById(uk_area);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  // Actualizar área
  const updated = await Area.update(uk_area, { s_nombre_area, uk_usuario_modificacion });

  if (!updated) {
    return responses.error(res, 'No se pudo actualizar el área', 400);
  }

  // Obtener área actualizada
  const areaActualizada = await Area.getById(uk_area);

  responses.success(res, areaActualizada.toJSON(), 'Área actualizada exitosamente');
});

/**
 * Soft delete - marcar área como inactiva
 */
const softDeleteArea = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;
  const uk_usuario_modificacion = req.user?.uk_administrador || null;

  // Verificar que el área existe
  const area = await Area.getById(uk_area);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  try {
    // Marcar como inactiva
    const deleted = await Area.softDelete(uk_area, uk_usuario_modificacion);

    if (!deleted) {
      return responses.error(res, 'No se pudo desactivar el área', 400);
    }

    responses.success(res, null, 'Área desactivada exitosamente');
  } catch (error) {
    // Si hay consultorios asociados
    if (error.message.includes('consultorios asociados')) {
      return responses.error(res, error.message, 409);
    }
    throw error;
  }
});

/**
 * Eliminar área (hard delete)
 */
const deleteArea = asyncHandler(async (req, res) => {
  const { uk_area } = req.params;

  // Verificar que el área existe
  const area = await Area.getById(uk_area);
  if (!area) {
    return responses.notFound(res, 'Área no encontrada');
  }

  try {
    // Eliminar área (incluye consultorios y turnos asociados automáticamente)
    const deleted = await Area.delete(uk_area);

    if (!deleted) {
      return responses.error(res, 'No se pudo eliminar el área', 400);
    }

    responses.success(res, null, 'Área, consultorios y turnos asociados eliminados exitosamente');
  } catch (error) {
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
 * Obtener estadísticas de turnos por área en un rango de fechas
 */
const getEstadisticasTurnosPorFecha = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return responses.error(res, 'Se requieren fecha_inicio y fecha_fin', 400);
  }

  const estadisticas = await Area.getEstadisticasTurnosPorFecha(fecha_inicio, fecha_fin);

  responses.success(res, estadisticas, 'Estadísticas de turnos por área obtenidas exitosamente');
});

/**
 * Obtener áreas con información básica (para selects)
 */
const getAreasBasicas = asyncHandler(async (req, res) => {
  const areas = await Area.getAll();

  const areasBasicas = areas.map(area => ({
    uk_area: area.uk_area,
    s_nombre_area: area.s_nombre_area
  }));

  responses.success(res, areasBasicas, 'Áreas básicas obtenidas exitosamente');
});

/**
 * Obtener áreas activas con conteo de consultorios
 */
const getAreasWithCount = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      a.uk_area,
      a.s_nombre_area,
      COUNT(c.uk_consultorio) as total_consultorios,
      COUNT(CASE WHEN c.ck_estado = 'ACTIVO' THEN 1 END) as consultorios_activos
    FROM Area a
    LEFT JOIN Consultorio c ON a.uk_area = c.uk_area
    WHERE a.ck_estado = 'ACTIVO'
    GROUP BY a.uk_area, a.s_nombre_area
    ORDER BY a.s_nombre_area
  `;

  const { executeQuery } = require('../config/database');
  const results = await executeQuery(query);

  responses.success(res, results, 'Áreas con conteo de consultorios obtenidas exitosamente');
});

module.exports = {
  createArea,
  getAllAreas,
  getAllAreasWithInactive,
  getAreaById,
  getAreaByNombre,
  getAreaWithConsultorios,
  searchAreas,
  updateArea,
  softDeleteArea,
  deleteArea,
  getEstadisticasTurnos,
  getEstadisticasTurnosPorFecha,
  getAreasBasicas,
  getAreasWithCount
};