-- Agregar columnas para recuperación de contraseña
-- Ejecutar este script si las columnas no existen

USE mediqueue;

-- Verificar si las columnas ya existen antes de agregarlas
SET @dbname = DATABASE();
SET @tablename = 'Administrador';
SET @columnname1 = 's_reset_password_token';
SET @columnname2 = 'd_reset_password_expires';

-- Preparar y ejecutar la adición de s_reset_password_token si no existe
SET @s1 = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname1, ' VARCHAR(255) NULL');
SET @exist1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname1);

SELECT @exist1 AS 's_reset_password_token_exists';

SET @query1 = IF(@exist1 = 0, @s1, 'SELECT "Column s_reset_password_token already exists" AS message');
PREPARE stmt1 FROM @query1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Preparar y ejecutar la adición de d_reset_password_expires si no existe
SET @s2 = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' DATETIME NULL');
SET @exist2 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname2);

SELECT @exist2 AS 'd_reset_password_expires_exists';

SET @query2 = IF(@exist2 = 0, @s2, 'SELECT "Column d_reset_password_expires already exists" AS message');
PREPARE stmt2 FROM @query2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Verificar la estructura de la tabla
DESCRIBE Administrador;

SELECT '✅ Script ejecutado correctamente' AS status;

