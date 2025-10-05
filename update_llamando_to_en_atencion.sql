-- Script para cambiar el estado 'LLAMANDO' por 'EN_ATENCION' en la base de datos
-- Ejecutar este script en tu base de datos MySQL

-- 1. Actualizar todos los registros existentes de 'LLAMANDO' a 'EN_ATENCION'
UPDATE Turno 
SET s_estado = 'EN_ATENCION' 
WHERE s_estado = 'LLAMANDO';

-- 2. Si hay alguna constraint o trigger que valide los estados, también necesitarás actualizarla
-- (Esto depende de cómo esté configurada tu base de datos)

-- 3. Verificar que el cambio se aplicó correctamente
SELECT s_estado, COUNT(*) as cantidad 
FROM Turno 
GROUP BY s_estado;

-- Resultado esperado:
-- Ya no debería aparecer 'LLAMANDO' en los resultados
-- Debería aparecer 'EN_ATENCION' con el conteo correspondiente