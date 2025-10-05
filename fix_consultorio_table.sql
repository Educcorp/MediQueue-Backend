-- =============================================
-- CORRECCIÓN: ELIMINAR COLUMNAS INCORRECTAS DE CONSULTORIO
-- =============================================
-- Eliminar las columnas s_letra, s_color, s_icono que se agregaron por error a la tabla Consultorio

-- Verificar si las columnas existen antes de eliminarlas
ALTER TABLE Consultorio 
DROP COLUMN IF EXISTS s_letra,
DROP COLUMN IF EXISTS s_color,
DROP COLUMN IF EXISTS s_icono;