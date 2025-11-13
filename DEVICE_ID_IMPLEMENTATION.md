# 🔐 Implementación de Device ID - Sistema de Cooldown

## Resumen

Se ha actualizado el sistema de cooldown para usar **Device ID** en lugar de solo direcciones IP. Esto proporciona un control más preciso y efectivo contra el spam de turnos.

## ¿Por qué Device ID en lugar de solo IP?

### Limitaciones de usar solo IP:
- ❌ **NAT/Proxies**: Múltiples usuarios legítimos pueden compartir la misma IP pública
- ❌ **Redes públicas**: WiFi de hospitales, cafeterías, etc.
- ❌ **IPs dinámicas**: Los usuarios pueden cambiar de IP fácilmente
- ❌ **VPNs**: Fácil de evadir cambiando servidor VPN

### Ventajas de Device ID:
- ✅ **Identificación única**: Cada dispositivo tiene un ID persistente
- ✅ **Funciona con NAT**: Diferentes dispositivos en la misma red se identifican por separado
- ✅ **Difícil de evadir**: Requiere cambiar de navegador/dispositivo, no solo de IP
- ✅ **Fallback a IP**: Si no hay Device ID, usa IP como respaldo
- ✅ **Privacy-friendly**: Se genera en el cliente, no expone información personal

## Arquitectura de la Implementación

### Frontend (MediQueue/src/)

#### 1. Generación de Device ID (`utils/deviceId.js`)

```javascript
// Componentes del fingerprint:
- User Agent (navegador, OS)
- Idioma del navegador
- Zona horaria
- Resolución de pantalla
- Profundidad de color
- Plataforma (Windows, Mac, Linux, etc.)
- Estado de cookies
- Memoria del dispositivo (si disponible)
- Número de cores CPU (si disponible)
- Canvas fingerprinting (opcional)
```

**Proceso:**
1. Recopila características del navegador/dispositivo
2. Genera un hash único combinando todas las características
3. Añade timestamp y número aleatorio para unicidad
4. Almacena en `localStorage` con clave `mediqueue_device_id`
5. Reutiliza el mismo ID en visitas futuras

**Formato del Device ID:**
```
{fingerprint}-{timestamp}-{random}
Ejemplo: abc123def-1kz8p4n-7x4j9q2
```

#### 2. Interceptor de Axios (`services/api.js`)

```javascript
// Cada petición HTTP incluye:
headers: {
  'X-Device-Id': '{device-id-generado}',
  // ... otros headers
}
```

### Backend (MediQueue-Backend/src/)

#### 1. Middleware de Rate Limiting (`middleware/rateLimiter.js`)

**Funciones principales:**

```javascript
getDeviceId(req)
// Extrae Device ID del header 'X-Device-Id'

getClientIp(req)
// Obtiene IP real del cliente (soporta proxies)

getDeviceKey(req)
// Genera clave única:
// - Si hay Device ID: "device:{device-id}"
// - Si no hay Device ID: "ip:{ip-address}"

turnoCooldownMiddleware(req, res, next)
// Verifica cooldown usando deviceKey
// Bloquea si está activo, registra si no
```

**Almacenamiento:**
```javascript
Map<deviceKey, {
  timestamp: number,    // Momento de última solicitud
  deviceId: string,     // Device ID (puede ser null)
  ip: string           // IP del cliente
}>
```

## Flujo Completo de una Solicitud

### Escenario 1: Primera solicitud de un dispositivo

```
1. [Frontend] Usuario accede a /tomar-turno
   ├─ Se genera/recupera Device ID: "abc123-xyz-789"
   └─ Se almacena en localStorage

2. [Frontend] Usuario selecciona área y solicita turno
   ├─ Axios interceptor añade header: X-Device-Id: abc123-xyz-789
   └─ POST /api/turnos/publico/auto

3. [Backend] Middleware rateLimiter recibe petición
   ├─ getDeviceId() → "abc123-xyz-789"
   ├─ getClientIp() → "192.168.1.100"
   ├─ getDeviceKey() → "device:abc123-xyz-789"
   ├─ Busca "device:abc123-xyz-789" en deviceCooldowns → NO EXISTE
   ├─ Crea entrada: { timestamp: now, deviceId: "abc123...", ip: "192..." }
   └─ next() → Permite continuar

4. [Backend] Controller crea turno exitosamente

5. [Frontend] Muestra turno generado con éxito
```

### Escenario 2: Segunda solicitud inmediata (dentro de 60s)

```
1. [Frontend] Usuario intenta crear otro turno
   ├─ Usa mismo Device ID: "abc123-xyz-789"
   └─ POST /api/turnos/publico/auto

2. [Backend] Middleware rateLimiter
   ├─ getDeviceKey() → "device:abc123-xyz-789"
   ├─ Busca en deviceCooldowns → EXISTE
   ├─ Calcula tiempo transcurrido: 15 segundos
   ├─ Calcula tiempo restante: 45 segundos
   └─ Responde HTTP 429 con:
       {
         success: false,
         message: "Por favor espera 45 segundos antes de solicitar otro turno",
         error: "COOLDOWN_ACTIVE",
         data: {
           timeRemaining: 45,
           lastTurnCreated: "2024-11-13T...",
           cooldownDuration: 60
         }
       }

3. [Frontend] TakeTurn.jsx recibe error 429
   ├─ Catch detecta status === 429
   ├─ Extrae timeRemaining (45)
   ├─ Formatea mensaje: "⏳ Debes esperar 45 segundos antes de solicitar otro turno"
   └─ Muestra en .error-message-touch (fixed bottom)
```

### Escenario 3: Solicitud después de expiración (>60s)

```
1. [Frontend] Usuario espera 65 segundos e intenta de nuevo
   └─ POST /api/turnos/publico/auto

2. [Backend] Middleware rateLimiter
   ├─ getDeviceKey() → "device:abc123-xyz-789"
   ├─ Busca en deviceCooldowns → EXISTE
   ├─ Calcula tiempo transcurrido: 65 segundos
   ├─ timeElapsed (65) >= COOLDOWN_DURATION (60) → EXPIRÓ
   ├─ Elimina entrada antigua de deviceCooldowns
   ├─ Crea nueva entrada con timestamp actual
   └─ next() → Permite continuar

3. [Backend] Controller crea nuevo turno exitosamente

4. [Frontend] Muestra nuevo turno
```

## Configuración y Ajustes

### Cambiar duración del cooldown

**Archivo**: `MediQueue-Backend/src/middleware/rateLimiter.js`

```javascript
// Línea 11
const COOLDOWN_DURATION = 60 * 1000; // Cambiar valor aquí

// Ejemplos:
const COOLDOWN_DURATION = 30 * 1000;        // 30 segundos
const COOLDOWN_DURATION = 2 * 60 * 1000;    // 2 minutos
const COOLDOWN_DURATION = 5 * 60 * 1000;    // 5 minutos
```

### Limpiar Device ID en desarrollo

**Frontend (Consola del navegador):**
```javascript
// Importar función
import { clearDeviceId } from './utils/deviceId';
clearDeviceId();

// O directamente:
localStorage.removeItem('mediqueue_device_id');
```

**Backend (Endpoint admin):**
```bash
# Limpiar cooldown de dispositivo específico
DELETE /api/turnos/admin/rate-limiter/clear/{device-id-o-ip}

# Limpiar todos los cooldowns
DELETE /api/turnos/admin/rate-limiter/clear-all
```

## Endpoints Administrativos

### Ver estadísticas de cooldowns activos

```bash
GET /api/turnos/admin/rate-limiter/stats
Authorization: Bearer {admin-token}

# Respuesta:
{
  "cooldownDuration": 60,
  "activeDevicesCount": 5,
  "totalTrackedDevices": 5,
  "activeDevices": [
    {
      "deviceKey": "device:abc123-xyz-7...",
      "deviceId": "abc123-xyz...",
      "ip": "192.168.1.xxx",
      "timeRemaining": 45,
      "lastCreated": "2024-11-13T10:30:00.000Z"
    }
  ]
}
```

### Limpiar cooldown de un dispositivo

```bash
DELETE /api/turnos/admin/rate-limiter/clear/{identifier}
Authorization: Bearer {admin-token}

# identifier puede ser:
# - Device ID completo: "abc123-xyz-789"
# - Device ID parcial: "abc123"
# - IP: "192.168.1.100"
```

### Limpiar todos los cooldowns

```bash
DELETE /api/turnos/admin/rate-limiter/clear-all
Authorization: Bearer {admin-token}
```

## Seguridad y Privacidad

### ✅ Privacy-Friendly
- No se almacenan datos personales
- No se rastrea actividad entre sitios
- Device ID se genera localmente
- Se puede eliminar limpiando localStorage

### ✅ Seguridad
- Fingerprinting hace difícil evasión simple
- Combinación de múltiples factores
- Fallback a IP si no hay Device ID
- Limpieza automática de datos antiguos

### ⚠️ Limitaciones
- Usuario puede limpiar localStorage y cookies para obtener nuevo ID
- Usuario puede cambiar de navegador/dispositivo
- No es 100% infalible, pero suficiente para prevenir spam casual

## Testing

### Caso de prueba 1: Cooldown funciona correctamente

```bash
# Terminal 1: Primera solicitud (debe funcionar)
curl -X POST http://localhost:3000/api/turnos/publico/auto \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device-123" \
  -d '{"uk_area": "uuid-area-aqui"}'

# Respuesta: HTTP 201 Created

# Terminal 1: Segunda solicitud inmediata (debe fallar)
curl -X POST http://localhost:3000/api/turnos/publico/auto \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device-123" \
  -d '{"uk_area": "uuid-area-aqui"}'

# Respuesta: HTTP 429 Too Many Requests
# {
#   "success": false,
#   "message": "Por favor espera ... segundos antes de solicitar otro turno",
#   "error": "COOLDOWN_ACTIVE"
# }
```

### Caso de prueba 2: Diferentes dispositivos funcionan independientemente

```bash
# Terminal 1: Dispositivo A
curl -X POST ... -H "X-Device-Id: device-A" ...
# → HTTP 201 Created ✅

# Terminal 2: Dispositivo B (simultáneo)
curl -X POST ... -H "X-Device-Id: device-B" ...
# → HTTP 201 Created ✅ (dispositivo diferente, no hay cooldown)

# Terminal 1: Dispositivo A de nuevo
curl -X POST ... -H "X-Device-Id: device-A" ...
# → HTTP 429 Too Many Requests ❌ (device-A en cooldown)

# Terminal 2: Dispositivo B de nuevo
curl -X POST ... -H "X-Device-Id: device-B" ...
# → HTTP 429 Too Many Requests ❌ (device-B en cooldown)
```

### Caso de prueba 3: Fallback a IP funciona

```bash
# Sin header X-Device-Id (simula navegador antiguo)
curl -X POST http://localhost:3000/api/turnos/publico/auto \
  -H "Content-Type: application/json" \
  -d '{"uk_area": "uuid-area-aqui"}'

# → Sistema usa IP como identificador
# → Funciona normalmente con cooldown basado en IP
```

## Monitoreo en Producción

### Logs a observar

```bash
# Logs de cooldown exitoso
✅ [RATE-LIMITER] Dispositivo device:abc123... autorizado. Cooldown activado por 60s
📊 [RATE-LIMITER] Dispositivos actualmente en cooldown: 3

# Logs de bloqueo por cooldown
⏳ [RATE-LIMITER] Dispositivo device:abc123... en cooldown. Tiempo transcurrido: 30s, Tiempo restante: 30s

# Logs de limpieza automática
🧹 [RATE-LIMITER] Limpiados 5 dispositivos antiguos del cooldown
```

### Métricas recomendadas

- Número de dispositivos únicos por día
- Tasa de bloqueos por cooldown (indicador de intentos de spam)
- Tiempo promedio entre solicitudes por dispositivo
- Porcentaje de solicitudes sin Device ID (fallback a IP)

## Troubleshooting

### Problema: Usuario legítimo bloqueado

**Síntoma**: Usuario reporta que no puede generar turno incluso después de esperar

**Solución**:
```bash
# Obtener Device ID del usuario (pedirle que ejecute en consola):
localStorage.getItem('mediqueue_device_id')

# Limpiar cooldown manualmente:
DELETE /api/turnos/admin/rate-limiter/clear/{device-id}
```

### Problema: Device ID no se genera

**Síntoma**: Todos los usuarios usan IP como identificador

**Diagnóstico**:
1. Verificar que archivo `deviceId.js` existe
2. Verificar que se importa en `api.js`
3. Revisar consola del navegador por errores
4. Verificar que localStorage está habilitado

**Solución temporal**: Sistema funciona con IP como fallback

### Problema: Cooldown muy restrictivo/permisivo

**Solución**: Ajustar `COOLDOWN_DURATION` en `rateLimiter.js`

```javascript
// Muy restrictivo (usuarios se quejan)
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutos
// → Reducir a 2-3 minutos

// Muy permisivo (hay spam)
const COOLDOWN_DURATION = 30 * 1000; // 30 segundos
// → Aumentar a 2-5 minutos
```

## Próximas Mejoras Potenciales

### 🚀 Nivel 1: Redis para persistencia
- Mantener cooldowns entre reinicios del servidor
- Soportar múltiples instancias/servidores
- Mejor escalabilidad

### 🚀 Nivel 2: Rate limiting progresivo
```
1er turno:   Sin cooldown
2do turno:   30 segundos
3er turno:   1 minuto
4to turno:   5 minutos
5to+ turno:  Bloqueo de 1 hora
```

### 🚀 Nivel 3: Whitelist de dispositivos
- Kioscos del hospital sin cooldown
- Staff médico con restricciones relajadas
- Administración desde panel admin

### 🚀 Nivel 4: Análisis de comportamiento
- Detectar patrones sospechosos (rápidas solicitudes)
- Alertas automáticas a administradores
- Dashboard de seguridad

## Conclusión

La implementación de Device ID proporciona un control más efectivo y justo del spam de turnos:

✅ **Más preciso**: Identifica dispositivos reales, no solo IPs compartidas  
✅ **Más justo**: No penaliza usuarios legítimos en redes compartidas  
✅ **Más efectivo**: Más difícil de evadir que solo cambiar IP  
✅ **Compatible**: Fallback a IP si Device ID no disponible  
✅ **Privacy-friendly**: No compromete privacidad del usuario  

---

**Fecha de implementación**: Noviembre 13, 2024  
**Versión**: 2.0 - Device ID Implementation  
**Estado**: ✅ Producción Ready

