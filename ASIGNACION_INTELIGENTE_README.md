# 🎯 Sistema de Asignación Inteligente de Consultorios

## 📋 Descripción General

Se ha implementado un sistema inteligente de asignación de consultorios que detecta automáticamente los consultorios disponibles por área y asigna turnos de manera optimizada. El sistema también incluye redistribución automática para equilibrar la carga de trabajo entre consultorios.

## 🔧 Funcionalidades Implementadas

### 1. **Detección de Consultorios Disponibles por Área**

#### Método: `getConsultoriosDisponiblesPorArea(uk_area)`

- **Descripción**: Obtiene todos los consultorios de un área específica con información sobre su disponibilidad
- **Retorna**: Array de consultorios con:
  - `uk_consultorio`: ID único del consultorio
  - `i_numero_consultorio`: Número del consultorio
  - `s_nombre_area`: Nombre del área médica
  - `turnos_en_espera`: Cantidad de turnos pendientes
  - `estado_disponibilidad`: 'DISPONIBLE' o 'OCUPADO'

#### Endpoint: `GET /api/turnos/consultorios/area/:uk_area/disponibles`

- **Acceso**: Administradores autenticados
- **Respuesta**: Lista de consultorios con estado de disponibilidad

### 2. **Asignación Inteligente de Consultorios**

#### Método: `asignarConsultorioInteligente(uk_area)`

- **Descripción**: Asigna el mejor consultorio disponible alternando entre opciones
- **Lógica**:
  1. Prioriza consultorios completamente disponibles (sin turnos en espera)
  2. Si todos están ocupados, elige el que tenga menos turnos
  3. Alterna entre consultorios para distribuir la carga equitativamente

#### Método: `getMejorConsultorioParaAsignar(uk_area)`

- **Descripción**: Selecciona el consultorio óptimo basado en disponibilidad y carga actual

### 3. **Creación de Turnos con Asignación Inteligente**

#### Método: `createConAsignacionInteligente(turnoData)`

- **Descripción**: Crea un turno asignando automáticamente el mejor consultorio disponible
- **Incluye**: Redistribución automática posterior para optimizar flujo

#### Endpoints:

- `POST /api/turnos/inteligente` - Para administradores
- `POST /api/turnos/publico/auto` - Para usuarios públicos (actualizado)

### 4. **Redistribución Automática de Turnos**

#### Método: `redistribuirTurnos(uk_area)`

- **Descripción**: Redistribuye turnos entre consultorios para optimizar el flujo
- **Lógica**:
  1. Identifica consultorios sobrecargados (más de 3 turnos en espera)
  2. Mueve turnos a consultorios disponibles
  3. Mantiene balance de carga entre consultorios
  4. Retorna estadísticas de turnos redistribuidos

#### Endpoint: `POST /api/turnos/area/:uk_area/redistribuir`

- **Acceso**: Administradores autenticados
- **Respuesta**: Número de turnos redistribuidos y mensaje explicativo

### 5. **Estadísticas y Análisis de Flujo**

#### Método: `getEstadisticasFlujo(uk_consultorio, fecha)`

- **Descripción**: Obtiene estadísticas detalladas de un consultorio
- **Incluye**:
  - Turnos por estado (espera, llamando, atendidos, etc.)
  - Tiempo promedio de atención
  - Estado actual de disponibilidad

#### Método: `getMejoresConsultoriosPorArea(uk_area, fecha)`

- **Descripción**: Rankea consultorios por eficiencia y rendimiento
- **Criterios**:
  - Turnos atendidos vs tiempo promedio
  - Disponibilidad actual
  - Turnos pendientes

#### Endpoints:

- `GET /api/consultorios/:uk_consultorio/estadisticas-flujo`
- `GET /api/consultorios/area/:uk_area/mejores`

## 🚀 Casos de Uso

### Escenario 1: Área con Múltiples Consultorios Disponibles

```
Dentista - Consultorio 1: DISPONIBLE (0 turnos)
Dentista - Consultorio 2: DISPONIBLE (0 turnos)

Acción: Alterna entre Consultorio 1 y 2 para nuevos turnos
```

### Escenario 2: Área con Consultorios Ocupados

```
Dentista - Consultorio 1: OCUPADO (5 turnos)
Dentista - Consultorio 2: OCUPADO (2 turnos)

Acción: Asigna nuevos turnos al Consultorio 2 (menor carga)
```

### Escenario 3: Redistribución Automática

```
Consultorio 1: 6 turnos en espera
Consultorio 2: 0 turnos (disponible)

Acción: Mueve 2 turnos del Consultorio 1 al Consultorio 2
Resultado: Consultorio 1: 4 turnos, Consultorio 2: 2 turnos
```

## 📊 Ejemplo de Flujo Completo

1. **Usuario solicita turno para Dentista**
2. **Sistema detecta consultorios disponibles**:
   - Consultorio 1: 1 turno en espera
   - Consultorio 2: 3 turnos en espera
3. **Asignación inteligente**: Elige Consultorio 1 (menor carga)
4. **Redistribución automática**: Se ejecuta en segundo plano
5. **Resultado optimizado**: Carga balanceada entre consultorios

## 🔄 Redistribución Automática

### Cuándo se Ejecuta

- Después de crear cada turno (asíncrono, no bloquea respuesta)
- Manualmente mediante endpoint de administrador
- Al detectar desequilibrio en la carga de trabajo

### Criterios de Redistribución

- Consultorios con más de 3 turnos en espera
- Disponibilidad de consultorios alternativos
- Mantener al menos 2 turnos en el consultorio original

### Beneficios

- **Tiempos de espera reducidos**
- **Mejor utilización de recursos**
- **Flujo optimizado de pacientes**
- **Distribución equitativa de carga**

## 🛠 Configuración y Personalización

### Parámetros Ajustables

- **Umbral de redistribución**: Actualmente 3 turnos (modificable en código)
- **Número de turnos a mover**: Máximo 2 por redistribución
- **Frecuencia de redistribución**: Después de cada turno creado

### Métricas de Eficiencia

- **Eficiencia = Turnos Atendidos / Tiempo Promedio**
- **Disponibilidad = Sin turnos en espera o llamando**
- **Rendimiento = Combinación de eficiencia y disponibilidad**

## 📈 Beneficios del Sistema

1. **Optimización Automática**: Sin intervención manual requerida
2. **Balanceado de Carga**: Distribución equitativa entre consultorios
3. **Reducción de Tiempos**: Pacientes atendidos más rápidamente
4. **Flexibilidad**: Funciona con cualquier número de consultorios por área
5. **Transparencia**: Estadísticas detalladas para análisis y mejoras

## 🧪 Pruebas

Ejecutar el script de pruebas:

```bash
cd MediQueue-Backend
node test-asignacion-inteligente.js
```

El script validará:

- Detección de consultorios disponibles
- Asignación inteligente
- Redistribución de turnos
- Estadísticas de flujo
- Ranking de mejores consultorios

## 🚀 Implementación en Frontend

Para integrar estas funcionalidades en el frontend, utilizar los nuevos endpoints:

```javascript
// Crear turno con asignación automática
const crearTurnoInteligente = async (areaId, pacienteData) => {
  const response = await fetch("/api/turnos/publico/auto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uk_area: areaId,
      paciente: pacienteData,
    }),
  });
  return response.json();
};

// Obtener consultorios disponibles
const getConsultoriosDisponibles = async (areaId) => {
  const response = await fetch(
    `/api/turnos/consultorios/area/${areaId}/disponibles`
  );
  return response.json();
};

// Redistribuir turnos (solo administradores)
const redistribuirTurnos = async (areaId) => {
  const response = await fetch(`/api/turnos/area/${areaId}/redistribuir`, {
    method: "POST",
  });
  return response.json();
};
```

## 📝 Notas Técnicas

- La redistribución se ejecuta asíncronamente para no afectar la velocidad de respuesta
- El sistema mantiene la integridad de los datos durante redistribuciones
- Los UUIDs se preservan al mover turnos entre consultorios
- Las estadísticas se calculan en tiempo real basadas en el estado actual
