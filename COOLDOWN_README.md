# ⏳ Sistema de Cooldown - Guía Rápida

## 🎯 ¿Qué hace?

Evita que un mismo dispositivo cree múltiples turnos en un período corto de tiempo (spam).

## ⚙️ Configuración Actual

- **Tiempo de espera**: 60 segundos (1 minuto)
- **Aplicado a**: Todos los endpoints públicos de creación de turnos
- **Compartido**: Entre todas las áreas
- **Identificación**: Device ID (fingerprint del dispositivo) + IP como fallback

## 🔧 Cambiar el Tiempo de Cooldown

Edita el archivo: `src/middleware/rateLimiter.js`

```javascript
// Línea 10
const COOLDOWN_DURATION = 60 * 1000; // Cambia 60 por los segundos que desees
```

**Ejemplos:**
- 30 segundos: `30 * 1000`
- 2 minutos: `2 * 60 * 1000`
- 5 minutos: `5 * 60 * 1000`

## 📋 Endpoints Administrativos

### Ver estadísticas
```bash
GET /api/turnos/admin/rate-limiter/stats
```

### Limpiar dispositivo específico (por Device ID o IP)
```bash
DELETE /api/turnos/admin/rate-limiter/clear/{device-id-o-ip}
```

### Limpiar todos los cooldowns
```bash
DELETE /api/turnos/admin/rate-limiter/clear-all
```

## 💡 Funcionamiento

1. Usuario solicita turno → ✅ Se crea el turno
2. Usuario intenta solicitar otro turno inmediatamente → ❌ Error 429
3. Usuario espera 60 segundos → ✅ Puede solicitar turno nuevamente

## 🔍 Ver Logs

Los logs aparecen en la consola del servidor con el prefijo `[RATE-LIMITER]`:

```
✅ [RATE-LIMITER] Dispositivo device:abc123... autorizado. Cooldown activado por 60s
⏳ [RATE-LIMITER] Dispositivo device:abc123... en cooldown. Tiempo restante: 30s
📊 [RATE-LIMITER] Dispositivos actualmente en cooldown: 5
```

## 📖 Documentación Completa

- **Guía técnica Device ID**: Ver `DEVICE_ID_IMPLEMENTATION.md`
- **Documentación Rate Limiter**: Ver `RATE_LIMITER_DOCUMENTATION.md`

