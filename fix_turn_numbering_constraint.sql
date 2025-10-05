-- =============================================
-- MIGRACIÓN: ARREGLAR RESTRICCIÓN DE NUMERACIÓN DE TURNOS
-- =============================================
-- Este script modifica la constraint única para permitir numeración por área

-- Primero, eliminar la constraint única actual
ALTER TABLE Turno DROP INDEX uk_turno_dia_numero;

-- Como no podemos hacer una constraint directa con área (requiere JOIN),
-- vamos a crear una constraint compuesta que incluya el consultorio
-- Esto permite que diferentes consultorios (de diferentes áreas) tengan el mismo número de turno
-- pero dentro del mismo consultorio, los números siguen siendo únicos por día

-- Agregar nueva constraint única: número de turno + fecha + consultorio
ALTER TABLE Turno ADD CONSTRAINT uk_turno_dia_numero_consultorio 
UNIQUE (i_numero_turno, d_fecha, uk_consultorio);

-- Nota: Esto aún no es perfecto porque diferentes consultorios de la misma área
-- pueden tener diferentes números. Para una solución completa, necesitaríamos
-- una función o trigger que gestione la numeración por área.

-- Por ahora, como alternativa temporal, eliminamos la constraint única
-- y dejamos que la lógica de aplicación maneje la numeración
ALTER TABLE Turno DROP INDEX uk_turno_dia_numero_consultorio;

-- Comentario: La numeración por área se manejará únicamente desde la aplicación
-- sin restricciones de base de datos para evitar conflictos.