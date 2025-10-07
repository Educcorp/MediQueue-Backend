/**
 * Utilidades para manejo de fechas y zona horaria
 * Zona horaria configurada para México/Guadalajara
 */

const moment = require('moment-timezone');

// Configurar zona horaria para México/Guadalajara
const TIMEZONE = 'America/Mexico_City';

/**
 * Obtiene la fecha y hora actual en la zona horaria de México/Guadalajara
 * @returns {string} Fecha y hora en formato YYYY-MM-DD HH:mm:ss
 */
const getCurrentDateTime = () => {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Obtiene solo la fecha actual en la zona horaria de México/Guadalajara
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
const getCurrentDate = () => {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Obtiene solo la hora actual en la zona horaria de México/Guadalajara
 * @returns {string} Hora en formato HH:mm:ss
 */
const getCurrentTime = () => {
    return moment().tz(TIMEZONE).format('HH:mm:ss');
};

/**
 * Convierte una fecha a la zona horaria de México/Guadalajara
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD HH:mm:ss
 */
const convertToMexicoTime = (date) => {
    return moment(date).tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Formatea una fecha para ser usada en consultas SQL
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada para SQL
 */
const formatForSQL = (date = null) => {
    if (date) {
        return moment(date).tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    }
    return getCurrentDateTime();
};

/**
 * Obtiene el inicio del día actual en zona horaria de México
 * @returns {string} Fecha y hora del inicio del día
 */
const getStartOfDay = () => {
    return moment().tz(TIMEZONE).startOf('day').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Obtiene el fin del día actual en zona horaria de México
 * @returns {string} Fecha y hora del fin del día
 */
const getEndOfDay = () => {
    return moment().tz(TIMEZONE).endOf('day').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Verifica si una fecha es del día actual en zona horaria de México
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} True si es del día actual
 */
const isToday = (date) => {
    const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
    const dateToCheck = moment(date).tz(TIMEZONE).format('YYYY-MM-DD');
    return today === dateToCheck;
};

module.exports = {
    TIMEZONE,
    getCurrentDateTime,
    getCurrentDate,
    getCurrentTime,
    convertToMexicoTime,
    formatForSQL,
    getStartOfDay,
    getEndOfDay,
    isToday
};