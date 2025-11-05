# 🕐 Sistema de Rate Limiting (Cooldown) para Creación de Turnos

## 📋 Descripción General

Este sistema implementa un mecanismo de **cooldown (enfriamiento)** para prevenir el spam en la creación de turnos públicos. El sistema rastrea las solicitudes por dirección IP del cliente y aplica un tiempo de espera obligatorio entre creaciones de turnos.

## 🎯 Características Principales

### ✅ Protección contra Spam
- **Cooldown compartido entre áreas**: Una IP no puede crear turnos en ninguna área durante el período de cooldown
- **Detección automática de IP**: Considera proxies, load balancers y CDNs (Cloudflare, etc.)
- **Limpieza automática**: Elimina IPs antiguas del registro cada 5 minutos para optimizar memoria

### ⚙️ Configuración Actual

```javascript
// Duración del cooldown (en milisegundos)
const COOLDOWN_DURATION = 60 * 1000; // 60 segundos (1 minuto)
```

**Para cambiar la duración del cooldown:**
1. Abrir archivo: `MediQueue-Backend/src/middleware/rateLimiter.js`
2. Modificar la constante `COOLDOWN_DURATION`
3. Ejemplos:
   - 30 segundos: `30 * 1000`
   - 1 minuto: `60 * 1000`
   - 2 minutos: `2 * 60 * 1000`

## 🔧 Implementación Técnica

### Endpoints Protegidos

Los siguientes endpoints públicos están protegidos con rate limiting:

1. **POST** `/api/turnos/publico/auto` - Crear turno con asignación automática
2. **POST** `/api/turnos/publico` - Crear turno público

### Respuesta de Error (HTTP 429)

Cuando una IP está en cooldown, el servidor responde con:

```json
{
  "success": false,
  "message": "Por favor espera 45 segundos antes de solicitar otro turno",
  "error": "COOLDOWN_ACTIVE",
  "data": {
    "timeRemaining": 45,
    "lastTurnCreated": "2024-11-05T10:30:00.000Z",
    "cooldownDuration": 60
  }
}
```

### Detección de IP

El sistema detecta la IP del cliente en el siguiente orden de prioridad:

1. Header `x-forwarded-for` (proxies, load balancers)
2. Header `x-real-ip` (nginx, apache)
3. Header `cf-connecting-ip` (Cloudflare)
4. IP del socket directo

## 🔐 Endpoints Administrativos

Para administradores autenticados:

### 1. Ver Estadísticas del Rate Limiter

```bash
GET /api/turnos/admin/rate-limiter/stats
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas del rate limiter obtenidas exitosamente",
  "data": {
    "cooldownDuration": 60,
    "activeIpsCount": 5,
    "totalTrackedIps": 5,
    "activeIps": [
      {
        "ip": "192.168.1.xxx",
        "timeRemaining": 45,
        "lastCreated": "2024-11-05T10:30:00.000Z"
      }
    ]
  }
}
```

### 2. Limpiar Cooldown de una IP Específica

```bash
DELETE /api/turnos/admin/rate-limiter/clear/{ip}
Authorization: Bearer {admin_token}
```

**Ejemplo:**
```bash
DELETE /api/turnos/admin/rate-limiter/clear/192.168.1.100
```

### 3. Limpiar Todos los Cooldowns

```bash
DELETE /api/turnos/admin/rate-limiter/clear-all
Authorization: Bearer {admin_token}
```

## 🎨 Manejo en el Frontend

El componente `TakeTurn.jsx` maneja automáticamente el error de cooldown:

```javascript
// Manejo específico del error 429
if (error.response?.status === 429) {
  const errorData = error.response?.data;
  const timeRemaining = errorData?.data?.timeRemaining;
  
  // Muestra mensaje personalizado con tiempo restante
  setError(`⏳ Debes esperar ${timeRemaining} segundos antes de solicitar otro turno`);
}
```

### Mensaje Visible al Usuario

El usuario verá mensajes como:
- "⏳ Debes esperar 45 segundos antes de solicitar otro turno"
- "⏳ Debes esperar 1 minuto y 15 segundos antes de solicitar otro turno"

## 📊 Monitoreo y Logs

El sistema registra eventos importantes en la consola del servidor:

```
🔍 [RATE-LIMITER] Verificando cooldown para IP: 192.168.1.100
⏳ [RATE-LIMITER] IP 192.168.1.100 en cooldown. Tiempo transcurrido: 30s, Tiempo restante: 30s
✅ [RATE-LIMITER] IP 192.168.1.100 autorizada. Cooldown activado por 60s
📊 [RATE-LIMITER] IPs actualmente en cooldown: 5
🧹 [RATE-LIMITER] Limpiadas 3 IPs antiguas del cooldown
```

## 🚀 Recomendaciones de Producción

### Para Mayor Escalabilidad

Considera migrar el almacenamiento de IPs de memoria a **Redis**:

**Ventajas de Redis:**
- ✅ Persistencia entre reinicios del servidor
- ✅ Soporte para múltiples instancias del servidor (load balancing)
- ✅ TTL automático de claves
- ✅ Mejor rendimiento con grandes volúmenes

**Implementación sugerida con Redis:**

```javascript
const redis = require('redis');
const client = redis.createClient();

const turnoCooldownMiddleware = async (req, res, next) => {
  const clientIp = getClientIp(req);
  const key = `cooldown:${clientIp}`;
  
  const exists = await client.exists(key);
  
  if (exists) {
    const ttl = await client.ttl(key);
    return res.status(429).json({
      // ... error response
      timeRemaining: ttl
    });
  }
  
  // Establecer clave con TTL automático
  await client.set(key, Date.now(), 'EX', COOLDOWN_DURATION / 1000);
  next();
};
```

### Ajustes Recomendados

- **Desarrollo/Testing**: 30 segundos
- **Producción (tráfico bajo)**: 60 segundos (actual)
- **Producción (tráfico alto)**: 2-3 minutos
- **Alta seguridad**: 5 minutos

## 🧪 Testing

### Test Manual

1. Crear un turno en cualquier área
2. Intentar crear otro turno inmediatamente
3. Verificar que se reciba error 429
4. Esperar el tiempo del cooldown
5. Verificar que se puede crear turno nuevamente

### Test con cURL

```bash
# Primera solicitud (exitosa)
curl -X POST http://localhost:3000/api/turnos/publico/auto \
  -H "Content-Type: application/json" \
  -d '{"uk_area": "uuid-del-area"}'

# Segunda solicitud inmediata (debe fallar con 429)
curl -X POST http://localhost:3000/api/turnos/publico/auto \
  -H "Content-Type: application/json" \
  -d '{"uk_area": "uuid-del-area"}'
```

## 🔄 Mantenimiento

### Limpieza Automática

El sistema limpia IPs antiguas cada **5 minutos** automáticamente. No requiere intervención manual.

### Reinicio del Servidor

⚠️ **Nota importante**: Al reiniciar el servidor, todos los cooldowns en memoria se pierden. Si esto es un problema en producción, considera usar Redis.

## 📝 Notas Adicionales

- El cooldown es **por IP**, no por usuario ni dispositivo
- IPs detrás del mismo proxy/NAT comparten el mismo cooldown
- El sistema es resistente a cambios de área (el cooldown aplica a todas las áreas)
- No afecta a endpoints administrativos autenticados

## 🐛 Resolución de Problemas

### Problema: Usuario legítimo bloqueado

**Solución**: Usar endpoint administrativo para limpiar su IP:
```bash
DELETE /api/turnos/admin/rate-limiter/clear/{ip}
```

### Problema: Muchos usuarios detrás del mismo NAT

**Solución**: Considerar implementar cooldown por sesión o token en lugar de IP, o reducir el tiempo de cooldown.

### Problema: Cooldowns no persisten entre reinicios

**Solución**: Implementar Redis como se describe en "Recomendaciones de Producción".

---

**Fecha de implementación**: Noviembre 2024  
**Versión**: 1.0  
**Mantenedor**: Sistema MediQueue

