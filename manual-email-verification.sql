-- ========================================
-- SCRIPT DE VERIFICACIÓN MANUAL DE EMAIL
-- ========================================
-- Este script permite verificar manualmente el email de los administradores
-- cuando el proceso automático falla en producción

-- ========================================
-- 1. CONSULTAR ADMINISTRADORES NO VERIFICADOS
-- ========================================
-- Ver todos los administradores que aún no han verificado su email
SELECT 
    uk_administrador,
    s_nombre,
    s_apellido,
    s_email,
    s_usuario,
    b_email_verified,
    s_verification_token,
    d_verification_token_expires,
    d_fecha_creacion,
    d_fecha_modificacion,
    ck_estado
FROM Administrador
WHERE b_email_verified = FALSE
ORDER BY d_fecha_creacion DESC;

-- ========================================
-- 2. VERIFICAR MANUALMENTE POR EMAIL
-- ========================================
-- Reemplaza 'admin@example.com' con el email del administrador a verificar
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE s_email = 'admin@example.com';

-- ========================================
-- 3. VERIFICAR MANUALMENTE POR UK_ADMINISTRADOR
-- ========================================
-- Reemplaza 'UUID-DEL-ADMIN' con el uk_administrador correspondiente
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE uk_administrador = 'UUID-DEL-ADMIN';

-- ========================================
-- 4. VERIFICAR MÚLTIPLES ADMINISTRADORES
-- ========================================
-- Verificar todos los administradores activos que no estén verificados
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE b_email_verified = FALSE 
  AND ck_estado = 'ACTIVO';

-- ========================================
-- 5. CONSULTAR ESTADO DESPUÉS DE LA VERIFICACIÓN
-- ========================================
-- Verificar que la actualización se realizó correctamente
SELECT 
    uk_administrador,
    s_nombre,
    s_apellido,
    s_email,
    b_email_verified,
    d_fecha_modificacion,
    ck_estado
FROM Administrador
WHERE s_email = 'admin@example.com';

-- ========================================
-- 6. GENERAR NUEVO TOKEN DE VERIFICACIÓN (OPCIONAL)
-- ========================================
-- Si prefieres generar un nuevo token en lugar de verificar manualmente
-- Reemplaza los valores según sea necesario
UPDATE Administrador 
SET 
    s_verification_token = UUID(),
    d_verification_token_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR),
    d_fecha_modificacion = NOW()
WHERE s_email = 'admin@example.com'
  AND b_email_verified = FALSE;

-- ========================================
-- 7. ESTADÍSTICAS DE VERIFICACIÓN
-- ========================================
-- Ver un resumen de administradores verificados vs no verificados
SELECT 
    b_email_verified AS 'Email Verificado',
    COUNT(*) AS 'Cantidad',
    ck_estado AS 'Estado'
FROM Administrador
GROUP BY b_email_verified, ck_estado;

-- ========================================
-- 8. LIMPIAR TOKENS EXPIRADOS
-- ========================================
-- Eliminar tokens de verificación que ya expiraron
UPDATE Administrador 
SET 
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE d_verification_token_expires < NOW()
  AND s_verification_token IS NOT NULL;

-- ========================================
-- EJEMPLOS DE USO
-- ========================================

/*
EJEMPLO 1: Verificar al usuario con email specific@hospital.com
----------------------------------------
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE s_email = 'specific@hospital.com';


EJEMPLO 2: Verificar todos los administradores creados hoy
----------------------------------------
UPDATE Administrador 
SET 
    b_email_verified = TRUE,
    s_verification_token = NULL,
    d_verification_token_expires = NULL,
    d_fecha_modificacion = NOW()
WHERE DATE(d_fecha_creacion) = CURDATE()
  AND b_email_verified = FALSE;


EJEMPLO 3: Ver detalles completos de un admin por su email
----------------------------------------
SELECT * FROM Administrador 
WHERE s_email = 'admin@example.com';
*/
