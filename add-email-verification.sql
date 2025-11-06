-- Script para agregar campos de verificación de email a la tabla Administrador
-- Ejecutar este script en la base de datos de MediQueue

USE MediQueue;

-- Agregar columna para verificación de email
ALTER TABLE Administrador 
ADD COLUMN IF NOT EXISTS b_email_verified BOOLEAN DEFAULT FALSE COMMENT 'Indica si el email ha sido verificado';

-- Agregar columna para el token de verificación
ALTER TABLE Administrador 
ADD COLUMN IF NOT EXISTS s_verification_token VARCHAR(255) DEFAULT NULL COMMENT 'Token para verificar email';

-- Agregar columna para la fecha de expiración del token
ALTER TABLE Administrador 
ADD COLUMN IF NOT EXISTS d_verification_token_expires DATETIME DEFAULT NULL COMMENT 'Fecha de expiración del token de verificación';

-- Verificar los campos agregados
DESCRIBE Administrador;
