# ⏳ Sistema de Cooldown - Guía Rápida

## 🎯 ¿Qué hace?

Evita que una misma IP cree múltiples turnos en un período corto de tiempo (spam).

## ⚙️ Configuración Actual

- **Tiempo de espera**: 60 segundos (1 minuto)
- **Aplicado a**: Todos los endpoints públicos de creación de turnos
- **Compartido**: Entre todas las áreas

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

### Limpiar IP específica
```bash
DELETE /api/turnos/admin/rate-limiter/clear/192.168.1.100
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
✅ [RATE-LIMITER] IP 192.168.1.100 autorizada. Cooldown activado por 60s
⏳ [RATE-LIMITER] IP 192.168.1.100 en cooldown. Tiempo restante: 30s
```

## 📖 Documentación Completa

Ver archivo `RATE_LIMITER_DOCUMENTATION.md` para detalles técnicos completos.

