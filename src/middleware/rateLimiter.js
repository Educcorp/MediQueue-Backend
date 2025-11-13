/**
 * Middleware para control de rate limiting (cooldown) en creación de turnos
 * Previene spam de creación de turnos por IP
 */

// Almacén en memoria para tracking de IPs y timestamps
// En producción se recomienda usar Redis para persistencia y escalabilidad
const ipCooldowns = new Map();

// Configuración del cooldown (en milisegundos)
const COOLDOWN_DURATION = 0; // Sin cooldown (deshabilitado)

/**
 * Limpieza periódica de IPs antiguas del Map
 * Ejecuta cada 5 minutos para evitar crecimiento infinito de memoria
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [ip, data] of ipCooldowns.entries()) {
    // Eliminar entradas más antiguas que el doble del cooldown
    if (now - data.timestamp > COOLDOWN_DURATION * 2) {
      ipCooldowns.delete(ip);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 [RATE-LIMITER] Limpiadas ${cleanedCount} IPs antiguas del cooldown`);
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
 * Aplica cooldown compartido entre todas las áreas
 */
const turnoCooldownMiddleware = (req, res, next) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  
  console.log(`🔍 [RATE-LIMITER] Verificando cooldown para IP: ${clientIp}`);
  
  // Verificar si la IP está en cooldown
  const cooldownData = ipCooldowns.get(clientIp);
  
  if (cooldownData) {
    const timeElapsed = now - cooldownData.timestamp;
    const timeRemaining = COOLDOWN_DURATION - timeElapsed;
    
    // Si todavía está en cooldown
    if (timeElapsed < COOLDOWN_DURATION) {
      const timeRemainingFormatted = formatTimeRemaining(timeRemaining);
      const timeElapsedSeconds = Math.floor(timeElapsed / 1000);
      
      console.log(`⏳ [RATE-LIMITER] IP ${clientIp} en cooldown. Tiempo transcurrido: ${timeElapsedSeconds}s, Tiempo restante: ${Math.ceil(timeRemaining / 1000)}s`);
      
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
    console.log(`✅ [RATE-LIMITER] Cooldown expirado para IP ${clientIp}`);
    ipCooldowns.delete(clientIp);
  }
  
  // Registrar la creación del turno con timestamp actual
  ipCooldowns.set(clientIp, {
    timestamp: now,
    ip: clientIp
  });
  
  console.log(`✅ [RATE-LIMITER] IP ${clientIp} autorizada. Cooldown activado por ${COOLDOWN_DURATION / 1000}s`);
  console.log(`📊 [RATE-LIMITER] IPs actualmente en cooldown: ${ipCooldowns.size}`);
  
  next();
};

/**
 * Obtiene información sobre el estado del rate limiter (para debugging/admin)
 */
const getRateLimiterStats = () => {
  const now = Date.now();
  const activeIps = [];
  
  for (const [ip, data] of ipCooldowns.entries()) {
    const timeElapsed = now - data.timestamp;
    const timeRemaining = COOLDOWN_DURATION - timeElapsed;
    
    if (timeRemaining > 0) {
      activeIps.push({
        ip: ip.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.xxx'), // Ocultar último octeto por privacidad
        timeRemaining: Math.ceil(timeRemaining / 1000),
        lastCreated: new Date(data.timestamp).toISOString()
      });
    }
  }
  
  return {
    cooldownDuration: COOLDOWN_DURATION / 1000,
    activeIpsCount: activeIps.length,
    totalTrackedIps: ipCooldowns.size,
    activeIps: activeIps.sort((a, b) => a.timeRemaining - b.timeRemaining)
  };
};

/**
 * Limpia el cooldown de una IP específica (útil para testing o admin override)
 */
const clearIpCooldown = (ip) => {
  const deleted = ipCooldowns.delete(ip);
  console.log(`🔓 [RATE-LIMITER] Cooldown ${deleted ? 'eliminado' : 'no encontrado'} para IP: ${ip}`);
  return deleted;
};

/**
 * Limpia todos los cooldowns (útil para testing)
 */
const clearAllCooldowns = () => {
  const count = ipCooldowns.size;
  ipCooldowns.clear();
  console.log(`🗑️ [RATE-LIMITER] Limpiados ${count} cooldowns`);
  return count;
};

module.exports = {
  turnoCooldownMiddleware,
  getRateLimiterStats,
  clearIpCooldown,
  clearAllCooldowns,
  COOLDOWN_DURATION
};

