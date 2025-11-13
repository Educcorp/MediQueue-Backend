/**
 * Middleware para control de rate limiting (cooldown) en creación de turnos
 * Previene spam de creación de turnos por dispositivo (Device ID + IP)
 */

// Almacén en memoria para tracking de dispositivos y timestamps
// En producción se recomienda usar Redis para persistencia y escalabilidad
const deviceCooldowns = new Map();

// Configuración del cooldown (en milisegundos)
const COOLDOWN_DURATION = 60 * 1000; // 60 segundos de cooldown

/**
 * Limpieza periódica de dispositivos antiguos del Map
 * Ejecuta cada 5 minutos para evitar crecimiento infinito de memoria
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [deviceKey, data] of deviceCooldowns.entries()) {
    // Eliminar entradas más antiguas que el doble del cooldown
    if (now - data.timestamp > COOLDOWN_DURATION * 2) {
      deviceCooldowns.delete(deviceKey);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 [RATE-LIMITER] Limpiados ${cleanedCount} dispositivos antiguos del cooldown`);
  }
}, 5 * 60 * 1000); // Cada 5 minutos

/**
 * Obtiene la IP real del cliente
 * Considera proxies y load balancers
 */
const getClientIp = (req) => {
  // Intentar obtener IP de headers comunes de proxies
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    return forwardedFor.split(',')[0].trim();
  }
  
  // Otros headers comunes
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }
  
  // Cloudflare
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // IP directa del socket
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         'unknown';
};

/**
 * Obtiene el Device ID del cliente desde los headers
 */
const getDeviceId = (req) => {
  return req.headers['x-device-id'] || null;
};

/**
 * Genera una clave única combinando Device ID e IP
 * Si no hay Device ID, usa solo la IP (fallback)
 */
const getDeviceKey = (req) => {
  const deviceId = getDeviceId(req);
  const clientIp = getClientIp(req);
  
  // Si tenemos Device ID, usarlo como clave principal
  if (deviceId && deviceId !== 'undefined' && deviceId !== 'null') {
    return `device:${deviceId}`;
  }
  
  // Fallback: usar solo IP
  return `ip:${clientIp}`;
};

/**
 * Formatea el tiempo restante en segundos de manera legible
 */
const formatTimeRemaining = (milliseconds) => {
  const seconds = Math.ceil(milliseconds / 1000);
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes} minuto${minutes > 1 ? 's' : ''} y ${remainingSeconds} segundo${remainingSeconds > 1 ? 's' : ''}`
      : `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
};

/**
 * Middleware de rate limiting para creación de turnos
 * Aplica cooldown compartido entre todas las áreas basado en Device ID
 */
const turnoCooldownMiddleware = (req, res, next) => {
  const deviceKey = getDeviceKey(req);
  const clientIp = getClientIp(req);
  const deviceId = getDeviceId(req);
  const now = Date.now();
  
  console.log(`🔍 [RATE-LIMITER] Verificando cooldown para dispositivo: ${deviceKey.substring(0, 30)}... (IP: ${clientIp})`);
  
  // Verificar si el dispositivo está en cooldown
  const cooldownData = deviceCooldowns.get(deviceKey);
  
  if (cooldownData) {
    const timeElapsed = now - cooldownData.timestamp;
    const timeRemaining = COOLDOWN_DURATION - timeElapsed;
    
    // Si todavía está en cooldown
    if (timeElapsed < COOLDOWN_DURATION) {
      const timeRemainingFormatted = formatTimeRemaining(timeRemaining);
      const timeElapsedSeconds = Math.floor(timeElapsed / 1000);
      
      console.log(`⏳ [RATE-LIMITER] Dispositivo ${deviceKey.substring(0, 30)}... en cooldown. Tiempo transcurrido: ${timeElapsedSeconds}s, Tiempo restante: ${Math.ceil(timeRemaining / 1000)}s`);
      
      return res.status(429).json({
        success: false,
        message: `Por favor espera ${timeRemainingFormatted} antes de solicitar otro turno`,
        error: 'COOLDOWN_ACTIVE',
        data: {
          timeRemaining: Math.ceil(timeRemaining / 1000), // en segundos
          lastTurnCreated: new Date(cooldownData.timestamp).toISOString(),
          cooldownDuration: COOLDOWN_DURATION / 1000 // en segundos
        }
      });
    }
    
    // El cooldown ha expirado, eliminar del Map
    console.log(`✅ [RATE-LIMITER] Cooldown expirado para dispositivo ${deviceKey.substring(0, 30)}...`);
    deviceCooldowns.delete(deviceKey);
  }
  
  // Registrar la creación del turno con timestamp actual
  deviceCooldowns.set(deviceKey, {
    timestamp: now,
    deviceId: deviceId,
    ip: clientIp
  });
  
  console.log(`✅ [RATE-LIMITER] Dispositivo ${deviceKey.substring(0, 30)}... autorizado. Cooldown activado por ${COOLDOWN_DURATION / 1000}s`);
  console.log(`📊 [RATE-LIMITER] Dispositivos actualmente en cooldown: ${deviceCooldowns.size}`);
  
  next();
};

/**
 * Obtiene información sobre el estado del rate limiter (para debugging/admin)
 */
const getRateLimiterStats = () => {
  const now = Date.now();
  const activeDevices = [];
  
  for (const [deviceKey, data] of deviceCooldowns.entries()) {
    const timeElapsed = now - data.timestamp;
    const timeRemaining = COOLDOWN_DURATION - timeElapsed;
    
    if (timeRemaining > 0) {
      // Ocultar información sensible
      const maskedIp = data.ip ? data.ip.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.xxx') : 'unknown';
      const maskedDeviceId = data.deviceId ? data.deviceId.substring(0, 10) + '...' : 'no-device-id';
      
      activeDevices.push({
        deviceKey: deviceKey.substring(0, 20) + '...',
        deviceId: maskedDeviceId,
        ip: maskedIp,
        timeRemaining: Math.ceil(timeRemaining / 1000),
        lastCreated: new Date(data.timestamp).toISOString()
      });
    }
  }
  
  return {
    cooldownDuration: COOLDOWN_DURATION / 1000,
    activeDevicesCount: activeDevices.length,
    totalTrackedDevices: deviceCooldowns.size,
    activeDevices: activeDevices.sort((a, b) => a.timeRemaining - b.timeRemaining)
  };
};

/**
 * Limpia el cooldown de un dispositivo específico (útil para testing o admin override)
 * Puede buscar por Device ID o por IP
 */
const clearDeviceCooldown = (identifier) => {
  // Intentar eliminar con diferentes formatos
  const deviceKey = `device:${identifier}`;
  const ipKey = `ip:${identifier}`;
  
  let deleted = deviceCooldowns.delete(deviceKey) || deviceCooldowns.delete(ipKey);
  
  // Si no se encuentra directamente, buscar por coincidencia parcial
  if (!deleted) {
    for (const [key, data] of deviceCooldowns.entries()) {
      if (key.includes(identifier) || data.deviceId === identifier || data.ip === identifier) {
        deviceCooldowns.delete(key);
        deleted = true;
        break;
      }
    }
  }
  
  console.log(`🔓 [RATE-LIMITER] Cooldown ${deleted ? 'eliminado' : 'no encontrado'} para identificador: ${identifier}`);
  return deleted;
};

/**
 * Limpia todos los cooldowns (útil para testing)
 */
const clearAllCooldowns = () => {
  const count = deviceCooldowns.size;
  deviceCooldowns.clear();
  console.log(`🗑️ [RATE-LIMITER] Limpiados ${count} cooldowns de dispositivos`);
  return count;
};

// Alias para compatibilidad con código existente
const clearIpCooldown = clearDeviceCooldown;

module.exports = {
  turnoCooldownMiddleware,
  getRateLimiterStats,
  clearDeviceCooldown,
  clearIpCooldown, // Alias para compatibilidad
  clearAllCooldowns,
  COOLDOWN_DURATION
};

