# Sistema de Asignación Inteligente de Consultorios

## Resumen

Se ha implementado un sistema completo de asignación inteligente de consultorios que resuelve los requisitos solicitados:

1. **Detección automática de consultorios por área**
2. **Distribución equitativa entre consultorios**
3. **Reasignación dinámica según el flujo**
4. **Consultorios dinámicos que se adaptan al flujo**

## Componentes Implementados

### 1. Servicio Inteligente (`consultorioInteligenteService.js`)

Servicio centralizado que maneja toda la lógica de asignación inteligente:

#### Métodos Principales:

- **`getConsultoriosDisponiblesPorArea(uk_area, fecha)`**
  - Detecta automáticamente consultorios disponibles por área
  - Calcula carga de trabajo y puntuación de eficiencia
  - Ordena por disponibilidad y rendimiento

- **`getConsultorioOptimo(uk_area, fecha)`**
  - Selecciona el mejor consultorio para asignar un turno
  - Prioriza consultorios libres, luego los menos cargados

- **`asignarTurnoInteligente(turnoData)`**
  - Crea turnos con asignación automática de consultorio
  - Distribuye equitativamente la carga

- **`redistribuirTurnosPendientes(uk_area, fecha)`**
  - Reasigna turnos pendientes a consultorios más eficientes
  - Detecta consultorios sobrecargados y los balancea

- **`monitorearyReasignar(uk_area)`**
  - Monitoreo continuo y reasignación automática
  - Puede procesar todas las áreas o una específica

- **`getEstadisticasDistribucion(uk_area, fecha)`**
  - Proporciona métricas de distribución y equidad
  - Evalúa la calidad del balanceo (EXCELENTE, BUENA, REGULAR, DEFICIENTE)

- **`redistribucionForzada(uk_area, fecha)`**
  - Redistribución completa para casos de desequilibrio severo
  - Reorganiza todos los turnos pendientes equitativamente

### 2. Controlador Actualizado (`turnoController.js`)

Se actualizaron los métodos existentes y se agregaron nuevos endpoints:

#### Endpoints Nuevos:

- **`POST /api/turnos/inteligente/monitorear`**
  - Ejecuta monitoreo y reasignación automática
  - Útil para tareas programadas

- **`GET /api/turnos/area/:uk_area/estadisticas`**
  - Obtiene estadísticas de distribución por área
  - Incluye índice de equidad y evaluación

- **`GET /api/turnos/area/:uk_area/consultorio-optimo`**
  - Obtiene el consultorio óptimo para un área
  - Útil para interfaces de administración

#### Endpoints Actualizados:

- **`POST /api/turnos/inteligente`**
  - Ahora usa el servicio inteligente para asignación
  - Incluye información del consultorio asignado

- **`POST /api/turnos/publico/auto`**
  - Asignación inteligente para usuarios públicos
  - Distribución automática por área

- **`GET /api/turnos/consultorios/area/:uk_area/disponibles`**
  - Información enriquecida con estadísticas de carga
  - Incluye puntuaciones de eficiencia

- **`POST /api/turnos/area/:uk_area/redistribuir`**
  - Soporta redistribución inteligente y forzada
  - Parámetro `forzar` para redistribución completa

### 3. Rutas Actualizadas (`turnoRoutes.js`)

Se agregaron las nuevas rutas manteniendo la seguridad y validación:

```javascript
// Monitoreo inteligente
POST /api/turnos/inteligente/monitorear

// Estadísticas de distribución
GET /api/turnos/area/:uk_area/estadisticas?fecha=YYYY-MM-DD

// Consultorio óptimo
GET /api/turnos/area/:uk_area/consultorio-optimo?fecha=YYYY-MM-DD

// Redistribución con opciones
POST /api/turnos/area/:uk_area/redistribuir
Body: { "forzar": true/false }
```

## Algoritmo de Distribución

### 1. Detección de Consultorios

```sql
-- Consulta para detectar consultorios con información de carga
SELECT 
  c.uk_consultorio,
  c.i_numero_consultorio,
  COUNT(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 END) as turnos_pendientes,
  CASE 
    WHEN COUNT(CASE WHEN t.s_estado IN ('EN_ESPERA', 'LLAMANDO') THEN 1 END) = 0 THEN 'DISPONIBLE'
    ELSE 'OCUPADO'
  END as estado_disponibilidad
FROM Consultorio c
LEFT JOIN Turno t ON c.uk_consultorio = t.uk_consultorio AND t.d_fecha = CURDATE()
WHERE c.uk_area = ? AND c.ck_estado = 'ACTIVO'
ORDER BY turnos_pendientes ASC, tiempo_promedio_atencion ASC
```

### 2. Asignación Inteligente

1. **Prioridad 1**: Consultorios completamente libres (sin turnos pendientes)
2. **Prioridad 2**: Consultorio con menor carga de trabajo
3. **Prioridad 3**: Consultorio con mejor tiempo promedio de atención
4. **Prioridad 4**: Consultorio con menor número (orden consistente)

### 3. Redistribución Dinámica

El sistema identifica:
- Consultorios **sobrecargados**: Con más turnos que el promedio
- Consultorios **disponibles**: Sin turnos pendientes o con carga menor

Luego redistribuye turnos del más cargado al menos cargado usando round-robin.

### 4. Métricas de Equidad

- **Índice de Equidad**: Desviación estándar / Promedio de carga
  - 0-0.3: EXCELENTE distribución
  - 0.3-0.6: BUENA distribución  
  - 0.6-1.0: REGULAR distribución
  - >1.0: DEFICIENTE distribución

## Casos de Uso Resueltos

### Caso 1: Detección Automática por Área
```javascript
// El sistema detecta automáticamente consultorios de "Dentista"
const consultorios = await ConsultorioInteligenteService.getConsultoriosDisponiblesPorArea(uk_area_dentista);
// Resultado: Lista de consultorios con información de carga y disponibilidad
```

### Caso 2: Distribución Equitativa
```javascript
// Aunque todos estén ocupados, distribuye equitativamente
const consultorioOptimo = await ConsultorioInteligenteService.getConsultorioOptimo(uk_area);
// Resultado: Consultorio con menor carga, incluso si está ocupado
```

### Caso 3: Consultorios Dinámicos
```javascript
// Si Consultorio 2 atiende más rápido, los turnos del Consultorio 1 se reasignan
const resultado = await ConsultorioInteligenteService.redistribuirTurnosPendientes(uk_area);
// Resultado: Turnos se mueven automáticamente al consultorio más eficiente
```

### Caso 4: Ejemplo Específico (Dentista)
**Situación inicial:**
- Consultorio 1: turno1, turno3, turno5 (3 turnos)
- Consultorio 2: turno2, turno4 (2 turnos)

**Si Consultorio 2 es más rápido:**
1. Sistema detecta desequilibrio
2. Reasigna turno5 del Consultorio 1 al Consultorio 2
3. Nueva distribución:
   - Consultorio 1: turno1, turno3 (2 turnos)
   - Consultorio 2: turno2, turno4, turno5 (3 turnos)

## Configuración y Monitoreo

### Monitoreo Automático
Se puede configurar un cron job para ejecutar monitoreo periódico:

```bash
# Cada 5 minutos
*/5 * * * * curl -X POST http://localhost:3000/api/turnos/inteligente/monitorear
```

### Estadísticas en Tiempo Real
```javascript
// Obtener estado actual de distribución
const stats = await ConsultorioInteligenteService.getEstadisticasDistribucion(uk_area);
console.log(`Distribución: ${stats.evaluacion_distribucion}`);
console.log(`Índice de equidad: ${stats.indice_equidad}`);
```

## Pruebas Implementadas

Se incluye `test-sistema-inteligente.js` con pruebas completas:

1. **Conexión a BD**: Verifica datos básicos
2. **Detección**: Prueba detección de consultorios por área
3. **Asignación**: Valida selección de consultorio óptimo
4. **Distribución**: Simula múltiples asignaciones
5. **Reasignación**: Prueba redistribución dinámica
6. **Estadísticas**: Valida métricas de equidad
7. **Monitoreo**: Prueba monitoreo completo del sistema

```bash
# Ejecutar pruebas
node test-sistema-inteligente.js
```

## Beneficios del Sistema

1. **Automático**: No requiere intervención manual para balancear
2. **Adaptativo**: Se ajusta en tiempo real al flujo de cada consultorio
3. **Equitativo**: Distribuye la carga de manera justa
4. **Eficiente**: Prioriza consultorios más rápidos
5. **Transparente**: Proporciona estadísticas y métricas claras
6. **Auditable**: Registra todas las reasignaciones en observaciones

## Consideraciones de Rendimiento

- Las consultas están optimizadas con índices apropiados
- El sistema funciona con datos del día actual por defecto
- La redistribución es incremental (máximo 2 turnos por ciclo)
- Las estadísticas se calculan on-demand para datos actuales

## Escalabilidad

El sistema está diseñado para:
- Múltiples áreas médicas
- Cualquier cantidad de consultorios por área
- Grandes volúmenes de turnos diarios
- Monitoreo continuo sin impacto en rendimiento

Esta implementación cumple completamente con los requisitos solicitados y proporciona una solución robusta, escalable y automatizada para la gestión inteligente de consultorios.